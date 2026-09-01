import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore
import * as pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { SubtitleCue, SubtitleFile } from '../types';
import { splitTextIntoSentences } from './epubParser';

// Registra o handler de worker na thread principal para evitar falhas de carregamento de worker externo
if (typeof globalThis !== 'undefined') {
  (globalThis as any).pdfjsWorker = pdfWorker;
}

if (pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/legacy/build/pdf.worker.min.mjs`;
  } catch {
    // Ignora se não puder atribuir workerSrc
  }
}

/**
 * Converte string base64 para Uint8Array de forma universal (Hermes, Web, Node).
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Remove prefixo data URI e qualquer espaço em branco ou quebra de linha
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');

  if (typeof atob !== 'undefined') {
    try {
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch {
      // Fallback para parser manual abaixo se o atob falhar
    }
  }

  // Decodificador manual puro para ambientes onde atob ou Buffer não estejam disponíveis (ex: Hermes)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = cleanBase64.length * 0.75;
  if (cleanBase64.endsWith('==')) bufferLength -= 2;
  else if (cleanBase64.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(Math.max(0, Math.floor(bufferLength)));
  let p = 0;
  for (let i = 0; i < cleanBase64.length; i += 4) {
    const encoded1 = lookup[cleanBase64.charCodeAt(i)];
    const encoded2 = lookup[cleanBase64.charCodeAt(i + 1)];
    const encoded3 = lookup[cleanBase64.charCodeAt(i + 2)];
    const encoded4 = lookup[cleanBase64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (cleanBase64[i + 2] !== '=' && p < bytes.length) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (cleanBase64[i + 3] !== '=' && p < bytes.length) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }
  return bytes;
}

/**
 * Faz o parse de um arquivo PDF (ArrayBuffer, Uint8Array ou Base64)
 * e o converte para um SubtitleFile com páginas e frases navegáveis.
 */
export async function parsePDF(
  data: ArrayBuffer | Uint8Array | string,
  fallbackTitle = 'Documento PDF'
): Promise<SubtitleFile> {
  let uint8Data: Uint8Array;

  if (typeof data === 'string') {
    uint8Data = base64ToUint8Array(data);
  } else if (data instanceof Uint8Array) {
    uint8Data = data;
  } else if (data instanceof ArrayBuffer) {
    uint8Data = new Uint8Array(data);
  } else {
    throw new Error('Formato de dados binários de PDF inválido.');
  }

  if (uint8Data.length === 0) {
    throw new Error('O arquivo PDF selecionado está vazio (0 bytes).');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Data,
    useSystemFonts: true,
    disableFontFace: true,
  });

  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (loadErr: any) {
    console.error('Falha ao abrir PDF com pdfjs-dist:', loadErr);
    const msg = loadErr?.message || '';
    if (msg.toLowerCase().includes('password')) {
      throw new Error('Este PDF é protegido por senha. Remova a senha antes de importar.');
    }
    throw new Error(`Não foi possível ler a estrutura do arquivo PDF: ${msg || 'arquivo corrompido ou formato não suportado'}`);
  }

  const numPages = pdfDoc.numPages;

  if (!numPages || numPages === 0) {
    throw new Error('O arquivo PDF não possui páginas legíveis.');
  }

  // Tenta extrair título dos metadados do PDF
  let extractedTitle = fallbackTitle.replace(/\.pdf$/i, '');
  try {
    const metadata = await pdfDoc.getMetadata();
    const info: any = metadata?.info;
    if (info && info.Title && typeof info.Title === 'string' && info.Title.trim().length > 0) {
      extractedTitle = info.Title.trim();
    }
  } catch {
    // Ignora erro de metadados e usa o nome do arquivo
  }

  const cues: SubtitleCue[] = [];
  const virtualSentenceDurationMs = 4500; // 4.5 segundos virtuais por frase

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      if (!textContent || !textContent.items || textContent.items.length === 0) {
        continue;
      }

      // Agrupa itens de texto respeitando linhas
      let pageFullText = '';
      let lastY: number | null = null;

      for (const item of textContent.items) {
        const textItem = item as any;
        if (!textItem || typeof textItem.str !== 'string') continue;

        const currentY = textItem.transform ? textItem.transform[5] : null;

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          // Mudança de linha vertical
          pageFullText += '\n' + textItem.str;
        } else {
          pageFullText += (pageFullText.length > 0 && !pageFullText.endsWith(' ') ? ' ' : '') + textItem.str;
        }

        lastY = currentY;
      }

      const sentences = splitTextIntoSentences(pageFullText);

      for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const sentenceText = sentences[sIdx].trim();
        if (!sentenceText || sentenceText.length < 2) continue;

        const cueId = cues.length + 1;
        const startTimeMs = (cueId - 1) * virtualSentenceDurationMs;
        const endTimeMs = startTimeMs + virtualSentenceDurationMs;

        cues.push({
          id: cueId,
          startTimeMs,
          endTimeMs,
          startTimeStr: `Pág. ${pageNum}`,
          endTimeStr: `Frase ${sIdx + 1}`,
          text: sentenceText,
          rawText: sentenceText,
          pageNumber: pageNum,
        });
      }
    } catch (pageError) {
      console.warn(`Aviso: Falha ao ler página ${pageNum} do PDF:`, pageError);
      // Continua para a próxima página sem quebrar todo o documento
    }
  }

  if (cues.length === 0) {
    throw new Error(
      'Não foi possível extrair texto do documento PDF. O arquivo pode ser um PDF escaneado (imagem digitalizada) sem camada de texto selecionável.'
    );
  }

  const durationMs = cues[cues.length - 1].endTimeMs;

  return {
    id: `pdf_${Date.now()}`,
    title: extractedTitle,
    description: `Livro Digital PDF • ${numPages} páginas (${cues.length} frases extraídas)`,
    category: 'pdf',
    contentType: 'pdf',
    totalPages: numPages,
    cues,
    durationMs,
    createdAt: Date.now(),
  };
}
