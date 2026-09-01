import { TranslationResult } from '../types';

// Cache em memória para consultas repetidas
const translationCache = new Map<string, TranslationResult>();

// Dicionário offline rápido para palavras mais comuns do inglês
const OFFLINE_DICTIONARY: Record<string, string> = {
  the: 'o, a, os, as',
  be: 'ser, estar',
  to: 'para, a',
  of: 'de, do, da',
  and: 'e',
  a: 'um, uma',
  in: 'em, dentro de',
  that: 'que, aquele, aquilo',
  have: 'ter, possuir',
  i: 'eu',
  it: 'isto, ele, ela (objeto/animal)',
  for: 'para, por',
  not: 'não',
  on: 'em, sobre, em cima de',
  with: 'com',
  he: 'ele',
  as: 'como, enquanto',
  you: 'você, vocês, tu',
  do: 'fazer',
  at: 'em, a, no, na',
  this: 'este, esta, isto',
  but: 'mas, porém',
  his: 'dele, seu',
  by: 'por, perto de',
  from: 'de, a partir de',
  they: 'eles, elas',
  we: 'nós',
  say: 'dizer',
  her: 'dela, a ela',
  she: 'ela',
  or: 'ou',
  an: 'um, uma',
  will: 'vai, vontade, futuro',
  my: 'meu, minha, meus, minhas',
  one: 'um, uma, alguém',
  all: 'todo, toda, todos, todas',
  would: 'iria, gostaria',
  there: 'lá, ali, existe',
  their: 'deles, delas, seus',
  what: 'o que, qual',
  so: 'então, tão, assim',
  up: 'para cima, acima',
  out: 'fora, para fora',
  if: 'se',
  about: 'sobre, a respeito de',
  who: 'quem',
  get: 'obter, conseguir, ficar',
  which: 'qual, o qual',
  go: 'ir',
  me: 'me, mim',
  when: 'quando',
  make: 'fazer, criar',
  can: 'poder, conseguir, lata',
  like: 'gostar, como, semelhante',
  time: 'tempo, hora, vez',
  no: 'não, nenhum',
  just: 'apenas, só, justo',
  him: 'ele, a ele, o',
  know: 'saber, conhecer',
  take: 'pegar, tomar, levar',
  people: 'pessoas, povo',
  into: 'para dentro de, em',
  year: 'ano',
  your: 'seu, sua, seus, suas',
  good: 'bom, boa',
  some: 'algum, alguns, um pouco',
  could: 'poderia, podia',
  them: 'eles, elas, a eles',
  see: 'ver, enxergar',
  other: 'outro, outra',
  than: 'do que',
  then: 'então, depois',
  now: 'agora',
  look: 'olhar, parecer',
  only: 'apenas, somente',
  come: 'vir, chegar',
  its: 'seu, sua, dele (coisas)',
  over: 'sobre, acima de, terminado',
  think: 'pensar, achar',
  also: 'também',
  back: 'voltar, atrás, costas',
  after: 'depois, após',
  use: 'usar, utilizar',
  two: 'dois, duas',
  how: 'como, quão',
  our: 'nosso, nossa',
  work: 'trabalho, trabalhar',
  first: 'primeiro, primeira',
  well: 'bem, poço',
  way: 'caminho, maneira, jeito',
  even: 'mesmo, até, plano',
  new: 'novo, nova',
  want: 'querer, desejar',
  because: 'porque, pois',
  any: 'qualquer, nenhum',
  these: 'estes, estas',
  give: 'dar, fornecer',
  day: 'dia',
  most: 'a maioria, mais',
  us: 'nós, nos',
  love: 'amor, amar',
  life: 'vida',
  learn: 'aprender',
  speak: 'falar',
  listen: 'escutar, ouvir',
  understand: 'entender, compreender',
  connect: 'conectar, ligar',
  dots: 'pontos',
  destiny: 'destino',
  future: 'futuro',
  trust: 'confiar, confiança',
  courage: 'coragem',
  heart: 'coração',
  intuition: 'intuição',
  relativity: 'relatividade',
  gravity: 'gravidade',
  dimension: 'dimensão',
  transcend: 'transcender, superar',
  coffee: 'café',
  morning: 'manhã',
  friend: 'amigo, amiga',
  together: 'juntos, juntas',
  great: 'ótimo, grande',
  challenge: 'desafio, desafiar',
  success: 'sucesso',
  failure: 'fracasso, falha',
  today: 'hoje',
  tomorrow: 'amanhã',
  yesterday: 'ontem',
  always: 'sempre',
  never: 'nunca',
  sometimes: 'às vezes',
  start: 'começar, início',
  stop: 'parar',
  help: 'ajuda, ajudar',
  need: 'precisar, necessidade',
  feel: 'sentir',
  try: 'tentar',
  leave: 'deixar, sair',
  call: 'chamar, ligar',
  keep: 'manter, guardar',
  let: 'deixar, permitir',
  begin: 'começar',
  seem: 'parecer',
  talk: 'conversar, falar',
  turn: 'virar, vez, transformar',
  startled: 'assustado',
  happy: 'feliz',
  sad: 'triste',
  world: 'mundo',
  place: 'lugar',
  thing: 'coisa',
  man: 'homem',
  woman: 'mulher',
  child: 'criança',
  eye: 'olho',
  hand: 'mão',
  mind: 'mente',
  head: 'cabeça',
  home: 'casa, lar',
  water: 'água',
  night: 'noite',
  school: 'escola',
  point: 'ponto',
  right: 'certo, direito',
  left: 'esquerda, deixou',
  small: 'pequeno',
  big: 'grande',
  high: 'alto',
  different: 'diferente',
  next: 'próximo',
  early: 'cedo',
  young: 'jovem',
  important: 'importante',
  few: 'poucos',
  public: 'público',
  bad: 'ruim, mau',
  same: 'mesmo',
  able: 'capaz',
  again: 'de novo, novamente',
  far: 'longe',
  off: 'desligado, longe',
  always_learning: 'sempre aprendendo',
};

/**
 * Traduz um texto (palavra ou frase completa) usando DeepL API, Dicionário Instantâneo ou MyMemory.
 */
export async function translateText(
  text: string,
  targetLang = 'PT',
  customApiKey?: string
): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      originalText: text,
      translatedText: '',
      source: 'fallback',
    };
  }

  const cacheKey = `${trimmed.toLowerCase()}_${targetLang}_${customApiKey ? 'key' : 'nokey'}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 1. Otimização Instantânea (0ms): Se for uma palavra única comum, usa o dicionário local
  const cleanWordKey = trimmed.toLowerCase().replace(/[^a-z]/g, '');
  const isSingleWord = !trimmed.includes(' ');

  if (isSingleWord && OFFLINE_DICTIONARY[cleanWordKey] && !customApiKey) {
    const result: TranslationResult = {
      originalText: trimmed,
      translatedText: OFFLINE_DICTIONARY[cleanWordKey],
      source: 'fallback',
    };
    translationCache.set(cacheKey, result);
    return result;
  }

  // 2. Tentativa via DeepL API (se houver chave configurada)
  if (customApiKey && customApiKey.trim().length > 5) {
    try {
      const apiKey = customApiKey.trim();
      const isFreeApi = apiKey.endsWith(':fx') || !apiKey.includes('.');
      const endpoint = isFreeApi
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      const deeplTarget = targetLang.toUpperCase() === 'PT' ? 'PT-BR' : targetLang.toUpperCase();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [trimmed],
          target_lang: deeplTarget,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.translations && data.translations.length > 0) {
          const result: TranslationResult = {
            originalText: trimmed,
            translatedText: data.translations[0].text,
            source: 'deepl',
            detectedSourceLanguage: data.translations[0].detected_source_language,
          };
          translationCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar DeepL API, alternando para fallback rápido:', e);
    }
  }

  // 3. Tentativa via MyMemory API com timeout curto (1.5s)
  try {
    const encoded = encodeURIComponent(trimmed);
    const langPair = targetLang.toLowerCase() === 'pt' ? 'en|pt-br' : `en|${targetLang.toLowerCase()}`;
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${langPair}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const result: TranslationResult = {
          originalText: trimmed,
          translatedText: data.responseData.translatedText,
          source: 'mymemory',
        };
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (e) {
    // Silencioso se timeout
  }

  // 4. Fallback para dicionário offline
  if (OFFLINE_DICTIONARY[cleanWordKey]) {
    const result: TranslationResult = {
      originalText: trimmed,
      translatedText: OFFLINE_DICTIONARY[cleanWordKey],
      source: 'fallback',
    };
    translationCache.set(cacheKey, result);
    return result;
  }

  // 5. Fallback padrão
  return {
    originalText: trimmed,
    translatedText: trimmed,
    source: 'fallback',
  };
}
