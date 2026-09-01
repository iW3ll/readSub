export type ContentType = 'subtitle' | 'book' | 'pdf' | 'epub';

export interface SubtitleCue {
  id: number;
  startTimeMs: number;
  endTimeMs: number;
  startTimeStr: string; // HH:MM:SS,mmm ou "Pág. 1" / "Capítulo 1"
  endTimeStr: string;   // HH:MM:SS,mmm ou "Frase 1"
  text: string;
  rawText: string;
  pageNumber?: number;
  chapterTitle?: string;
}

export interface SubtitleFile {
  id: string;
  title: string;
  description?: string;
  category?: 'movies' | 'speeches' | 'dialogues' | 'custom' | 'book' | 'pdf' | 'epub';
  contentType?: ContentType;
  author?: string;
  totalPages?: number;
  totalChapters?: number;
  cues: SubtitleCue[];
  durationMs: number;
  createdAt: number;
}

export interface WordDetails {
  word: string;
  cleanWord: string;
  translation: string;
  source: 'deepl' | 'mymemory' | 'libretranslate' | 'dictionary' | 'offline_fallback' | 'fallback';
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  synonyms?: string[];
  contextSentence?: string;
  subtitleTitle?: string;
  timestampMs?: number;
}

export interface SavedWord {
  id: string;
  word: string;
  cleanWord: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  exampleSentence?: string;
  contextSentence: string;
  subtitleTitle: string;
  timestampMs?: number;
  dateAdded: number;
  mastered: boolean;
  reviewCount: number;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  source: 'deepl' | 'mymemory' | 'libretranslate' | 'fallback';
  detectedSourceLanguage?: string;
}

export interface UserSettings {
  deepLApiKey: string;
  useDeepL: boolean;
  targetLanguage: string;
  ttsRate: number;
  ttsPitch: number;
  autoPauseOnWordClick: boolean;
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
}

export interface StudyStats {
  totalWordsSaved: number;
  masteredWordsCount: number;
  subtitlesCompleted: number;
  totalStudySeconds: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface UserProgressStats {
  totalWordsSaved: number;
  masteredWordsCount: number;
  learningWordsCount: number;
  masteryPercentage: number;
  totalReviews: number;
  studyStreakDays: number;
  subtitlesCompleted: number;
}

export interface StudySessionLog {
  id: string;
  userId: string;
  cardsReviewed: number;
  cardsMastered: number;
  durationSeconds: number;
  createdAt: string;
}

