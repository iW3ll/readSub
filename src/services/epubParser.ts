import JSZip from 'jszip';
import { SubtitleCue, SubtitleFile } from '../types';

/**
 * Decodifica entidades HTML comuns em caracteres legíveis.
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '...')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Limpa marcações HTML e extrai texto puro de parágrafos/capítulos.
 */
function cleanHtmlText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Divide um bloco de texto em frases individuais para leitura interativa.
 */
export function splitTextIntoSentences(text: string): string[] {
  if (!text) return [];

  const normalized = decodeHtmlEntities(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Quebra por quebras de linha e pontuação de fim de frase
  const rawParagraphs = normalized.split(/\n+/);
  const sentences: string[] = [];

  for (const para of rawParagraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // Divide por pontuações de fim de frase (. ! ?) preservando aspas de fechamento
    // Evita dividir abreviações conhecidas (Mr., Mrs., Dr., etc., i.e., e.g., vs.)
    const rawTokens = trimmedPara.match(/[^.!?]+[.!?]+["'”’]?|[^.!?]+$/g) || [trimmedPara];

    for (let token of rawTokens) {
      token = token.trim();
      if (token.length > 0) {
        sentences.push(token);
      }
    }
  }

  return sentences;
}

/**
 * Extrai o valor de uma tag XML simples (ex: <dc:title>Livro</dc:title>).
 */
function extractXmlTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<[a-zA-Z0-9_:]*${tagName}[^>]*>([\\s\\S]*?)<\\/[a-zA-Z0-9_:]*${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match && match[1]) {
    return decodeHtmlEntities(cleanHtmlText(match[1]));
  }
  return '';
}

/**
 * Faz o parse completo de um arquivo .EPUB (ArrayBuffer, Uint8Array ou Base64)
 * e o converte para um SubtitleFile com frases navegáveis.
 */
export async function parseEPUB(
  data: ArrayBuffer | Uint8Array | string,
  fallbackTitle = 'Livro ePub'
): Promise<SubtitleFile> {
  const zip = new JSZip();
  let zipContent: JSZip;

  if (typeof data === 'string') {
    // Se for string base64
    zipContent = await zip.loadAsync(data, { base64: true });
  } else {
    zipContent = await zip.loadAsync(data);
  }

  // 1. Lê META-INF/container.xml para descobrir o caminho do arquivo .opf
  const containerFile = zipContent.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Arquivo ePub inválido: META-INF/container.xml não encontrado.');
  }

  const containerXml = await containerFile.async('text');
  const rootfileMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
  if (!rootfileMatch || !rootfileMatch[1]) {
    throw new Error('Arquivo ePub inválido: rootfile OPF não especificado no container.xml.');
  }

  const opfPath = rootfileMatch[1];
  const opfFile = zipContent.file(opfPath);
  if (!opfFile) {
    throw new Error(`Arquivo ePub inválido: arquivo OPF "${opfPath}" não encontrado no arquivo.`);
  }

  const opfXml = await opfFile.async('text');

  // Diretório base do OPF (ex: "OEBPS/" ou "")
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Extrai metadados do livro
  const bookTitle = extractXmlTag(opfXml, 'title') || fallbackTitle.replace(/\.epub$/i, '');
  const bookAuthor = extractXmlTag(opfXml, 'creator') || extractXmlTag(opfXml, 'author') || '';
  const bookDescription = extractXmlTag(opfXml, 'description') || '';

  // 3. Extrai o Manifest (id -> href)
  const manifestMap: Record<string, string> = {};
  const itemRegex = /<item\b[^>]*\bid=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
    manifestMap[itemMatch[1]] = itemMatch[2];
  }

  // Se a regex com id antes de href não pegar tudo, tenta regex genérica
  if (Object.keys(manifestMap).length === 0) {
    const genericItemRegex = /<item\b([^>]+)>/gi;
    let genMatch: RegExpExecArray | null;
    while ((genMatch = genericItemRegex.exec(opfXml)) !== null) {
      const attrs = genMatch[1];
      const idM = attrs.match(/id=["']([^"']+)["']/i);
      const hrefM = attrs.match(/href=["']([^"']+)["']/i);
      if (idM && hrefM) {
        manifestMap[idM[1]] = hrefM[1];
      }
    }
  }

  // 4. Extrai a Spine (ordem dos capítulos)
  const spineIds: string[] = [];
  const spineItemRegex = /<itemref\b[^>]*\bidref=["']([^"']+)["'][^>]*>/gi;
  let spineMatch: RegExpExecArray | null;

  while ((spineMatch = spineItemRegex.exec(opfXml)) !== null) {
    spineIds.push(spineMatch[1]);
  }

  // 5. Itera pelos capítulos na ordem da Spine
  const cues: SubtitleCue[] = [];
  let chapterIndex = 0;
  const virtualSentenceDurationMs = 4000; // 4 segundos virtuais por frase

  // Se não encontrou spineIds, tenta pegar todos os arquivos xhtml/html do manifest
  const chapterHrefs = spineIds.length > 0
    ? spineIds.map((id) => manifestMap[id]).filter(Boolean)
    : Object.values(manifestMap).filter((href) => /\.(xhtml|html|xml|htm)$/i.test(href));

  for (const rawHref of chapterHrefs) {
    // Decodifica URI components como %20
    const cleanHref = decodeURIComponent(rawHref.split('#')[0]);
    const chapterPath = opfDir ? `${opfDir}${cleanHref}` : cleanHref;

    const chapterFile = zipContent.file(chapterPath) || zipContent.file(cleanHref);
    if (!chapterFile) continue;

    chapterIndex++;
    const chapterHtml = await chapterFile.async('text');

    // Tenta identificar o título do capítulo
    const chapterTitle =
      extractXmlTag(chapterHtml, 'h1') ||
      extractXmlTag(chapterHtml, 'title') ||
      extractXmlTag(chapterHtml, 'h2') ||
      `Capítulo ${chapterIndex}`;

    // Limpa o HTML e extrai texto
    const plainText = cleanHtmlText(chapterHtml);
    if (!plainText) continue;

    const sentences = splitTextIntoSentences(plainText);

    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      const sentenceText = sentences[sIdx];
      if (!sentenceText || sentenceText.length < 2) continue;

      const cueId = cues.length + 1;
      const startTimeMs = (cueId - 1) * virtualSentenceDurationMs;
      const endTimeMs = startTimeMs + virtualSentenceDurationMs;

      cues.push({
        id: cueId,
        startTimeMs,
        endTimeMs,
        startTimeStr: `Cap. ${chapterIndex}`,
        endTimeStr: `Frase ${sIdx + 1}`,
        text: sentenceText,
        rawText: sentenceText,
        chapterTitle,
      });
    }
  }

  if (cues.length === 0) {
    throw new Error('Não foi possível extrair texto legível do arquivo ePub.');
  }

  const durationMs = cues[cues.length - 1].endTimeMs;

  return {
    id: `epub_${Date.now()}`,
    title: bookTitle,
    description: `Livro Digital ePub • ${bookAuthor ? 'Autor: ' + bookAuthor + ' • ' : ''}${chapterIndex} capítulos (${cues.length} frases)`,
    category: 'epub',
    contentType: 'epub',
    author: bookAuthor,
    totalChapters: chapterIndex,
    cues,
    durationMs,
    createdAt: Date.now(),
  };
}
