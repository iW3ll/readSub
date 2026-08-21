import { SubtitleCue } from '../types';

/**
 * Converte string de tempo do formato SRT (00:01:23,456 ou 00:01:23.456) em milissegundos.
 */
export function timeStringToMs(timeString: string): number {
  if (!timeString) return 0;
  
  const normalized = timeString.trim().replace('.', ',');
  const parts = normalized.split(':');
  
  if (parts.length < 3) return 0;
  
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  
  const secParts = parts[2].split(',');
  const seconds = parseInt(secParts[0], 10) || 0;
  const milliseconds = parseInt(secParts[1] || '0', 10) || 0;
  
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

/**
 * Converte milissegundos para formato legível de tempo (ex: 02:45 ou 01:15:30).
 */
export function msToFormattedTime(ms: number, includeHours = false): string {
  if (isNaN(ms) || ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (includeHours || hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Converte milissegundos para o formato padrão de timestamp SRT (00:00:00,000).
 */
export function msToSrtTimestamp(ms: number): string {
  if (isNaN(ms) || ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;
  
  const pad = (n: number, length = 2) => n.toString().padStart(length, '0');
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

/**
 * Limpa tags HTML como <i>, <b>, <font>, etc. e quebras de linha indesejadas.
 */
export function cleanSubtitleText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // remove tags HTML
    .replace(/\{[^\}]*\}/g, '') // remove tags ASS/SSA se houver
    .replace(/&rlm;/gi, '')
    .replace(/&lrm;/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

/**
 * Faz o parse completo de um texto no formato .SRT para uma lista de SubtitleCue.
 */
export function parseSRT(srtContent: string): SubtitleCue[] {
  if (!srtContent || typeof srtContent !== 'string') {
    return [];
  }

  // Normaliza quebras de linha do Windows (\r\n) e Mac (\r) para \n
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  
  // Divide os blocos de legenda separados por duas quebras de linha
  const rawBlocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].trim();
    if (!block) continue;

    const lines = block.split('\n');
    if (lines.length < 2) continue;

    let timeLineIndex = 1;
    // Caso a primeira linha já seja a linha de tempo (sem número de índice prévio)
    if (lines[0].includes('-->')) {
      timeLineIndex = 0;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const timeParts = timeLine.split('-->');
    if (timeParts.length !== 2) continue;

    const startTimeStr = timeParts[0].trim();
    const endTimeStr = timeParts[1].trim();

    const startTimeMs = timeStringToMs(startTimeStr);
    const endTimeMs = timeStringToMs(endTimeStr);

    // O texto da legenda são as linhas restantes
    const textLines = lines.slice(timeLineIndex + 1);
    const rawText = textLines.join(' ');
    const text = cleanSubtitleText(rawText);

    if (text.length > 0 && endTimeMs >= startTimeMs) {
      cues.push({
        id: cues.length + 1,
        startTimeMs,
        endTimeMs,
        startTimeStr,
        endTimeStr,
        text,
        rawText,
      });
    }
  }

  // Ordena os blocos por tempo inicial
  return cues.sort((a, b) => a.startTimeMs - b.startTimeMs);
}

/**
 * Encontra a fala ativa em determinado momento (milissegundos).
 */
export function findActiveCue(cues: SubtitleCue[], currentTimeMs: number): SubtitleCue | null {
  if (!cues || cues.length === 0) return null;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (currentTimeMs >= cue.startTimeMs && currentTimeMs <= cue.endTimeMs) {
      return cue;
    }
  }
  return null;
}

/**
 * Encontra o índice da fala ativa ou da próxima fala mais próxima no tempo atual.
 */
export function findCurrentCueIndex(cues: SubtitleCue[], currentTimeMs: number): number {
  if (!cues || cues.length === 0) return -1;

  // Primeiro busca exata
  for (let i = 0; i < cues.length; i++) {
    if (currentTimeMs >= cues[i].startTimeMs && currentTimeMs <= cues[i].endTimeMs) {
      return i;
    }
  }

  // Caso esteja em silêncio entre duas falas, encontra a próxima que virá
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].startTimeMs > currentTimeMs) {
      return i;
    }
  }

  return cues.length - 1;
}
