import { Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { SubtitleFile, SubtitleCue } from '../types';
import { parseSRT } from './srtParser';
import { parseEPUB, splitTextIntoSentences } from './epubParser';
import { parsePDF } from './pdfParser';

export interface DocumentInput {
  name: string;
  uri?: string;
  file?: any; // Web File/Blob object
  rawText?: string;
  mimeType?: string;
}

/**
 * Faz a leitura binária ou textual de um arquivo suportando Web, Android, iOS e Desktop.
 */
export async function readDocumentData(input: DocumentInput): Promise<{
  arrayBuffer?: ArrayBuffer;
  base64?: string;
  text?: string;
}> {
  if (input.rawText) {
    return { text: input.rawText };
  }

  const fileName = input.name || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isBinary =
    ext === 'pdf' ||
    ext === 'epub' ||
    Boolean(
      input.mimeType &&
        (input.mimeType.includes('pdf') ||
          input.mimeType.includes('epub') ||
          input.mimeType.includes('octet-stream') ||
          input.mimeType.includes('zip'))
    );

  // 1. Objeto File / Blob nativo do navegador (Web)
  if (input.file) {
    try {
      if (typeof input.file.arrayBuffer === 'function') {
        const buffer = await input.file.arrayBuffer();
        return { arrayBuffer: buffer };
      }
      if (typeof FileReader !== 'undefined') {
        const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(input.file);
        });
        return { arrayBuffer: buffer };
      }
    } catch (fileErr) {
      console.warn('Aviso: Falha ao ler input.file, tentando fallback:', fileErr);
    }
  }

  // 2. Leitura por URI
  if (input.uri) {
    // Na Web ou para URIs do tipo blob:, http(s):, data:
    if (
      Platform.OS === 'web' ||
      input.uri.startsWith('blob:') ||
      input.uri.startsWith('http://') ||
      input.uri.startsWith('https://') ||
      input.uri.startsWith('data:')
    ) {
      try {
        const res = await fetch(input.uri);
        if (isBinary) {
          const buffer = await res.arrayBuffer();
          return { arrayBuffer: buffer };
        } else {
          const text = await res.text();
          return { text };
        }
      } catch (webErr) {
        console.warn('Aviso: Falha no fetch(uri) Web:', webErr);
      }
    }

    // No Mobile (Android / iOS) via expo-file-system/legacy
    try {
      if (FileSystemLegacy && typeof FileSystemLegacy.readAsStringAsync === 'function') {
        if (isBinary) {
          const base64 = await FileSystemLegacy.readAsStringAsync(input.uri, {
            encoding: FileSystemLegacy.EncodingType?.Base64 || 'base64',
          });
          return { base64 };
        } else {
          const text = await FileSystemLegacy.readAsStringAsync(input.uri, {
            encoding: FileSystemLegacy.EncodingType?.UTF8 || 'utf8',
          });
          return { text };
        }
      }
    } catch (fsErr) {
      console.warn('Aviso: Falha com FileSystemLegacy, tentando fetch/fallback:', fsErr);
    }

    // Fallback universal com fetch (funciona em versões recentes do React Native para file:// e content://)
    try {
      const res = await fetch(input.uri);
      if (isBinary) {
        const buffer = await res.arrayBuffer();
        return { arrayBuffer: buffer };
      } else {
        const text = await res.text();
        return { text };
      }
    } catch (fetchErr) {
      console.warn('Aviso: Falha no fallback fetch:', fetchErr);
    }
  }

  throw new Error(
    'Não foi possível ler os dados do arquivo selecionado. Verifique as permissões de acesso ao arquivo no dispositivo.'
  );
}

/**
 * Converte texto puro (.txt) em um SubtitleFile navegável com frases interativas.
 */
export function parsePlainText(text: string, title = 'Texto / Livro'): SubtitleFile {
  const sentences = splitTextIntoSentences(text);
  if (sentences.length === 0) {
    throw new Error('O texto fornecido está vazio.');
  }

  const cues: SubtitleCue[] = [];
  const virtualSentenceDurationMs = 4000;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const cueId = i + 1;
    const startTimeMs = i * virtualSentenceDurationMs;
    const endTimeMs = startTimeMs + virtualSentenceDurationMs;

    cues.push({
      id: cueId,
      startTimeMs,
      endTimeMs,
      startTimeStr: `Trecho ${cueId}`,
      endTimeStr: `Frase ${cueId}`,
      text: sentence,
      rawText: sentence,
    });
  }

  return {
    id: `txt_${Date.now()}`,
    title,
    description: `Texto importado (${cues.length} frases)`,
    category: 'book',
    contentType: 'book',
    cues,
    durationMs: cues[cues.length - 1].endTimeMs,
    createdAt: Date.now(),
  };
}

/**
 * Analisa e processa qualquer documento suportado (.srt, .pdf, .epub, .txt).
 */
export async function parseDigitalDocument(input: DocumentInput): Promise<SubtitleFile> {
  const fileName = input.name || 'Documento';
  let ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Se a extensão não veio no nome, deduz pelo mimeType ou URI
  if (!ext || ext === fileName.toLowerCase()) {
    if (input.mimeType?.includes('pdf') || input.uri?.toLowerCase().endsWith('.pdf')) {
      ext = 'pdf';
    } else if (input.mimeType?.includes('epub') || input.uri?.toLowerCase().endsWith('.epub')) {
      ext = 'epub';
    } else if (input.mimeType?.includes('subrip') || input.uri?.toLowerCase().endsWith('.srt')) {
      ext = 'srt';
    }
  }

  const { arrayBuffer, base64, text } = await readDocumentData(input);

  // Verificação de formato por cabeçalho binário (Magic Bytes)
  let detectedType = ext;
  if (arrayBuffer && arrayBuffer.byteLength >= 4) {
    const header = new Uint8Array(arrayBuffer.slice(0, 5));
    // PDF começa com '%PDF-' (0x25, 0x50, 0x44, 0x46)
    if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
      detectedType = 'pdf';
    } else if (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) {
      // ZIP / EPUB começa com 'PK\x03\x04'
      if (detectedType !== 'pdf') detectedType = 'epub';
    }
  } else if (base64) {
    const cleanPrefix = base64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
    if (cleanPrefix.startsWith('JVBERi0')) {
      // JVBERi0 é '%PDF-' em Base64
      detectedType = 'pdf';
    } else if (cleanPrefix.startsWith('UEsDB')) {
      // UEsDB é 'PK\x03\x04' em Base64
      if (detectedType !== 'pdf') detectedType = 'epub';
    }
  }

  // 1. Formato ePub
  if (detectedType === 'epub') {
    const data = arrayBuffer || base64;
    if (!data) throw new Error('Não foi possível ler os dados do arquivo ePub.');
    return await parseEPUB(data, fileName);
  }

  // 2. Formato PDF
  if (detectedType === 'pdf') {
    const data = arrayBuffer || base64;
    if (!data) throw new Error('Não foi possível ler os dados do arquivo PDF.');
    return await parsePDF(data, fileName);
  }

  // 3. Formato SRT / VTT ou Texto
  let rawContent = text;
  if (!rawContent && arrayBuffer) {
    rawContent = new TextDecoder('utf-8').decode(arrayBuffer);
  }

  if (!rawContent) {
    throw new Error('Não foi possível extrair o conteúdo de texto do documento.');
  }

  // Se tem padrão de timestamp SRT (00:00:00,000 --> 00:00:00,000)
  if (rawContent.includes('-->')) {
    const parsedCues = parseSRT(rawContent);
    if (parsedCues.length > 0) {
      return {
        id: `srt_${Date.now()}`,
        title: fileName.replace(/\.(srt|vtt)$/i, ''),
        description: `Legenda importada (${parsedCues.length} falas)`,
        category: 'custom',
        contentType: 'subtitle',
        cues: parsedCues,
        durationMs: parsedCues[parsedCues.length - 1].endTimeMs,
        createdAt: Date.now(),
      };
    }
  }

  // Fallback para texto estruturado em frases
  return parsePlainText(rawContent, fileName.replace(/\.[^/.]+$/, ''));
}
