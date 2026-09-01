import { WordDetails, TranslationResult } from '../types';
import { translateText } from './translationService';

// Cache em memória para definições de dicionário
const dictionaryCache = new Map<string, Partial<WordDetails>>();

/**
 * Remove pontuações e caracteres especiais ao redor de uma palavra.
 */
export function sanitizeWord(rawWord: string): string {
  if (!rawWord) return '';
  return rawWord
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .trim();
}

/**
 * Busca definição, fonética e classe gramatical na Free Dictionary API com timeout estrito.
 */
async function fetchDictionaryWithTimeout(
  cleanWord: string,
  timeoutMs = 1200
): Promise<Partial<WordDetails>> {
  const key = cleanWord.toLowerCase();
  if (dictionaryCache.has(key)) {
    return dictionaryCache.get(key)!;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return {};
    }

    const entry = data[0];
    const result: Partial<WordDetails> = {};

    // Fonética
    if (entry.phonetic) {
      result.phonetic = entry.phonetic;
    } else if (entry.phonetics && entry.phonetics.length > 0) {
      const withText = entry.phonetics.find((p: any) => p.text);
      if (withText) result.phonetic = withText.text;
    }

    // Significados e Exemplos
    if (entry.meanings && entry.meanings.length > 0) {
      const firstMeaning = entry.meanings[0];
      result.partOfSpeech = firstMeaning.partOfSpeech;

      if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
        const firstDef = firstMeaning.definitions[0];
        result.definition = firstDef.definition;
        if (firstDef.example) {
          result.example = firstDef.example;
        }
      }

      if (firstMeaning.synonyms && firstMeaning.synonyms.length > 0) {
        result.synonyms = firstMeaning.synonyms.slice(0, 4);
      }
    }

    dictionaryCache.set(key, result);
    return result;
  } catch (err) {
    // Timeout ou erro de rede silencioso para não travar a tradução
    clearTimeout(timeoutId);
    return {};
  }
}

/**
 * Consulta detalhes enriquecidos de uma palavra: Tradução + Definição em inglês + Fonética + Exemplos.
 * Executa tradução e consulta de dicionário EM PARALELO para máxima velocidade.
 */
export async function lookupWordDetails(
  rawWord: string,
  contextSentence?: string,
  subtitleTitle?: string,
  timestampMs?: number,
  deepLApiKey?: string
): Promise<WordDetails> {
  const cleanWord = sanitizeWord(rawWord);

  if (!cleanWord) {
    return {
      word: rawWord,
      cleanWord: '',
      translation: 'Nenhum termo selecionado',
      source: 'offline_fallback',
    };
  }

  // Executa Tradução e Dicionário SIMULTANEAMENTE em paralelo
  const [translationRes, dictDetails] = await Promise.all([
    translateText(cleanWord, 'PT', deepLApiKey),
    fetchDictionaryWithTimeout(cleanWord, 1200),
  ]);

  return {
    word: rawWord.trim(),
    cleanWord: cleanWord,
    translation: translationRes.translatedText || cleanWord,
    source: translationRes.source,
    contextSentence: contextSentence?.trim(),
    subtitleTitle,
    timestampMs,
    phonetic: dictDetails.phonetic,
    partOfSpeech: dictDetails.partOfSpeech,
    definition: dictDetails.definition,
    example: dictDetails.example,
    synonyms: dictDetails.synonyms,
  };
}
