import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedWord, SubtitleFile, UserSettings, StudyStats } from '../types';
import {
  fetchCloudFlashcards,
  saveCloudFlashcard,
  deleteCloudFlashcard,
  toggleCloudFlashcardMastered,
  recordStudySession,
} from '../services/supabaseFlashcards';
import { getCurrentUser } from '../services/authService';

const STORAGE_KEYS = {
  VOCABULARY: '@readsub_vocabulary',
  RECENT_SUBTITLES: '@readsub_recent_subtitles',
  SETTINGS: '@readsub_settings',
  STATS: '@readsub_stats',
};

const DEFAULT_SETTINGS: UserSettings = {
  deepLApiKey: '',
  useDeepL: true,
  targetLanguage: 'PT',
  ttsRate: 0.9,
  ttsPitch: 1.0,
  autoPauseOnWordClick: true,
  theme: 'dark',
  fontSize: 'medium',
};

const DEFAULT_STATS: StudyStats = {
  totalWordsSaved: 0,
  masteredWordsCount: 0,
  subtitlesCompleted: 0,
  totalStudySeconds: 0,
};

// ==================== VOCABULÁRIO (LOCAL + NUVEM) ====================

export async function getSavedWords(): Promise<SavedWord[]> {
  try {
    const user = await getCurrentUser();
    if (user) {
      const cloudWords = await fetchCloudFlashcards();
      if (cloudWords && cloudWords.length > 0) {
        // Atualiza cache local
        await AsyncStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(cloudWords));
        return cloudWords;
      }
    }

    const json = await AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY);
    if (!json) return [];
    const words: SavedWord[] = JSON.parse(json);
    return Array.isArray(words) ? words : [];
  } catch (error) {
    console.error('Erro ao carregar vocabulário:', error);
    return [];
  }
}

export async function saveWord(
  wordData: Omit<SavedWord, 'id' | 'dateAdded' | 'mastered' | 'reviewCount'>
): Promise<SavedWord> {
  try {
    const words = await getSavedWords();
    const clean = wordData.cleanWord.toLowerCase().trim();

    // Verifica se já existe a palavra localmente
    const existingIndex = words.findIndex((w) => w.cleanWord.toLowerCase().trim() === clean);

    let finalWord: SavedWord;

    if (existingIndex >= 0) {
      words[existingIndex] = {
        ...words[existingIndex],
        ...wordData,
        dateAdded: Date.now(),
      };
      finalWord = words[existingIndex];
    } else {
      finalWord = {
        ...wordData,
        id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        dateAdded: Date.now(),
        mastered: false,
        reviewCount: 0,
      };
      words.unshift(finalWord);
    }

    // Salva no AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(words));

    // Salva na nuvem se logado
    const user = await getCurrentUser();
    if (user) {
      const cloudRes = await saveCloudFlashcard(finalWord);
      if (cloudRes) finalWord = cloudRes;
    }

    // Atualiza contagem nos stats
    await incrementStat('totalWordsSaved');

    return finalWord;
  } catch (error) {
    console.error('Erro ao salvar palavra:', error);
    throw error;
  }
}

export async function deleteWord(id: string): Promise<void> {
  try {
    const words = await getSavedWords();
    const updated = words.filter((w) => w.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(updated));

    // Deleta na nuvem se logado
    const user = await getCurrentUser();
    if (user) {
      await deleteCloudFlashcard(id);
    }
  } catch (error) {
    console.error('Erro ao deletar palavra:', error);
  }
}

export async function toggleWordMastered(id: string): Promise<SavedWord | null> {
  try {
    const words = await getSavedWords();
    const index = words.findIndex((w) => w.id === id);
    if (index === -1) return null;

    const currentStatus = words[index].mastered;
    words[index].mastered = !currentStatus;
    words[index].reviewCount = (words[index].reviewCount || 0) + 1;

    await AsyncStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(words));

    // Atualiza na nuvem se logado
    const user = await getCurrentUser();
    if (user) {
      await toggleCloudFlashcardMastered(id);
      // Registra sessão rápida de estudo
      await recordStudySession(1, words[index].mastered ? 1 : 0, 10);
    }

    return words[index];
  } catch (error) {
    console.error('Erro ao alterar status de aprendizado:', error);
    return null;
  }
}

export async function isWordSaved(cleanWord: string): Promise<boolean> {
  if (!cleanWord) return false;
  const words = await getSavedWords();
  const clean = cleanWord.toLowerCase().trim();
  return words.some((w) => w.cleanWord.toLowerCase().trim() === clean);
}

// ==================== CONFIGURAÇÕES ====================

export async function getSettings(): Promise<UserSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return DEFAULT_SETTINGS;
  }
}

// ==================== HISTÓRICO DE LEGENDAS ====================

export async function getRecentSubtitles(): Promise<SubtitleFile[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SUBTITLES);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    return [];
  }
}

export async function saveRecentSubtitle(sub: SubtitleFile): Promise<void> {
  try {
    const recents = await getRecentSubtitles();
    const filtered = recents.filter((item) => item.id !== sub.id);
    const updated = [sub, ...filtered].slice(0, 10);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SUBTITLES, JSON.stringify(updated));
  } catch (error) {
    console.error('Erro ao salvar recente:', error);
  }
}

// ==================== ESTATÍSTICAS ====================

export async function getStudyStats(): Promise<StudyStats> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
    const words = await getSavedWords();
    const mastered = words.filter((w) => w.mastered).length;

    if (!json) {
      return {
        ...DEFAULT_STATS,
        totalWordsSaved: words.length,
        masteredWordsCount: mastered,
      };
    }

    const parsed = JSON.parse(json);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      totalWordsSaved: words.length,
      masteredWordsCount: mastered,
    };
  } catch (error) {
    return DEFAULT_STATS;
  }
}

export async function incrementStat(stat: keyof StudyStats, amount = 1): Promise<void> {
  try {
    const current = await getStudyStats();
    const updated = {
      ...current,
      [stat]: (current[stat] || 0) + amount,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
  } catch (e) {
    // Silencioso
  }
}
