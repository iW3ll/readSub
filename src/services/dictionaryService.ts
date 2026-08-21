import { WordDetails } from '../types';
import { translateText } from './translationService';

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
 * Consulta detalhes enriquecidos de uma palavra: Tradução + Definição em inglês + Fonética + Exemplos.
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

  // 1. Obter tradução (DeepL ou fallback)
  const translationRes = await translateText(cleanWord, 'PT', deepLApiKey);

  // Objeto base de resposta
  const details: WordDetails = {
    word: rawWord.trim(),
    cleanWord: cleanWord,
    translation: translationRes.translatedText || cleanWord,
    source: translationRes.source,
    contextSentence: contextSentence?.trim(),
    subtitleTitle,
    timestampMs,
  };

  // 2. Tentar buscar definição, fonética e classe gramatical na Free Dictionary API
  try {
    const dictResponse = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord.toLowerCase())}`
    );

    if (dictResponse.ok) {
      const data = await dictResponse.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];

        // Fonética
        if (entry.phonetic) {
          details.phonetic = entry.phonetic;
        } else if (entry.phonetics && entry.phonetics.length > 0) {
          const withText = entry.phonetics.find((p: any) => p.text);
          if (withText) details.phonetic = withText.text;
        }

        // Significados e Exemplos
        if (entry.meanings && entry.meanings.length > 0) {
          const firstMeaning = entry.meanings[0];
          details.partOfSpeech = firstMeaning.partOfSpeech;

          if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
            const firstDef = firstMeaning.definitions[0];
            details.definition = firstDef.definition;
            if (firstDef.example) {
              details.example = firstDef.example;
            }
          }

          // Se tiver sinônimos
          if (firstMeaning.synonyms && firstMeaning.synonyms.length > 0) {
            details.synonyms = firstMeaning.synonyms.slice(0, 4);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Dicionário externo indisponível, usando apenas tradução:', error);
  }

  return details;
}
