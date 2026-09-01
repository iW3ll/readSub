import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './authService';
import { SavedWord, UserProgressStats } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_VOCABULARY_KEY = '@readsub_vocabulary';

/**
 * Busca todos os flashcards do usuário logado na nuvem.
 */
export async function fetchCloudFlashcards(): Promise<SavedWord[]> {
  if (!isSupabaseConfigured()) return [];

  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar flashcards na nuvem:', error);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      id: item.id,
      word: item.word,
      cleanWord: item.clean_word,
      translation: item.translation,
      phonetic: item.phonetic || undefined,
      partOfSpeech: item.part_of_speech || undefined,
      definition: item.definition || undefined,
      exampleSentence: item.example_sentence || undefined,
      contextSentence: item.context_sentence,
      subtitleTitle: item.subtitle_title,
      timestampMs: item.timestamp_ms ? Number(item.timestamp_ms) : undefined,
      dateAdded: item.date_added ? Number(item.date_added) : new Date(item.created_at).getTime(),
      mastered: !!item.mastered,
      reviewCount: item.review_count || 0,
    }));
  } catch (err) {
    console.error('Erro de conexão ao carregar flashcards:', err);
    return [];
  }
}

/**
 * Salva ou atualiza um flashcard na conta do usuário no Supabase.
 */
export async function saveCloudFlashcard(
  wordData: Omit<SavedWord, 'id' | 'dateAdded' | 'mastered' | 'reviewCount'> & { id?: string }
): Promise<SavedWord | null> {
  if (!isSupabaseConfigured()) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const clean = wordData.cleanWord.toLowerCase().trim();
  const cardId = wordData.id || `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .upsert(
        {
          id: cardId,
          user_id: user.id,
          word: wordData.word,
          clean_word: clean,
          translation: wordData.translation,
          phonetic: wordData.phonetic || null,
          part_of_speech: wordData.partOfSpeech || null,
          definition: wordData.definition || null,
          example_sentence: wordData.exampleSentence || null,
          context_sentence: wordData.contextSentence,
          subtitle_title: wordData.subtitleTitle,
          timestamp_ms: wordData.timestampMs || null,
          date_added: now,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar flashcard na nuvem:', error);
      return null;
    }

    return {
      ...wordData,
      id: data.id,
      dateAdded: Number(data.date_added || now),
      mastered: !!data.mastered,
      reviewCount: data.review_count || 0,
    };
  } catch (err) {
    console.error('Erro ao salvar no Supabase:', err);
    return null;
  }
}

/**
 * Deleta um flashcard do usuário no Supabase.
 */
export async function deleteCloudFlashcard(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  } catch (err) {
    console.error('Erro ao deletar flashcard:', err);
    return false;
  }
}

/**
 * Alterna o status de 'mastered' (dominado) do flashcard no Supabase.
 */
export async function toggleCloudFlashcardMastered(id: string): Promise<SavedWord | null> {
  if (!isSupabaseConfigured()) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    // Busca o card atual
    const { data: current, error: fetchErr } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !current) return null;

    const newMastered = !current.mastered;
    const newReviewCount = (current.review_count || 0) + 1;

    const { data, error } = await supabase
      .from('flashcards')
      .update({
        mastered: newMastered,
        review_count: newReviewCount,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      word: data.word,
      cleanWord: data.clean_word,
      translation: data.translation,
      phonetic: data.phonetic || undefined,
      partOfSpeech: data.part_of_speech || undefined,
      definition: data.definition || undefined,
      exampleSentence: data.example_sentence || undefined,
      contextSentence: data.context_sentence,
      subtitleTitle: data.subtitle_title,
      timestampMs: data.timestamp_ms ? Number(data.timestamp_ms) : undefined,
      dateAdded: Number(data.date_added || Date.now()),
      mastered: !!data.mastered,
      reviewCount: data.review_count,
    };
  } catch (err) {
    console.error('Erro ao alternar status do flashcard:', err);
    return null;
  }
}

/**
 * Registra uma sessão de estudo para o histórico e métricas.
 */
export async function recordStudySession(
  cardsReviewed: number,
  cardsMastered: number,
  durationSeconds: number = 60
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const user = await getCurrentUser();
  if (!user) return;

  try {
    await supabase.from('study_sessions').insert([
      {
        user_id: user.id,
        cards_reviewed: cardsReviewed,
        cards_mastered: cardsMastered,
        duration_seconds: durationSeconds,
      },
    ]);
  } catch (err) {
    console.error('Erro ao registrar sessão de estudo:', err);
  }
}

/**
 * Calcula todas as estatísticas de progresso do usuário logado.
 */
export async function getUserProgressStats(): Promise<UserProgressStats> {
  const defaultStats: UserProgressStats = {
    totalWordsSaved: 0,
    masteredWordsCount: 0,
    learningWordsCount: 0,
    masteryPercentage: 0,
    totalReviews: 0,
    studyStreakDays: 0,
    subtitlesCompleted: 0,
  };

  if (!isSupabaseConfigured()) return defaultStats;

  const user = await getCurrentUser();
  if (!user) return defaultStats;

  try {
    // 1. Busca contagem e status dos flashcards
    const { data: cards, error: cardsErr } = await supabase
      .from('flashcards')
      .select('mastered, review_count, created_at')
      .eq('user_id', user.id);

    if (cardsErr || !cards) return defaultStats;

    const totalWordsSaved = cards.length;
    const masteredWordsCount = cards.filter((c) => c.mastered).length;
    const learningWordsCount = totalWordsSaved - masteredWordsCount;
    const masteryPercentage =
      totalWordsSaved > 0 ? Math.round((masteredWordsCount / totalWordsSaved) * 100) : 0;
    const totalReviews = cards.reduce((acc, c) => acc + (c.review_count || 0), 0);

    // 2. Busca sessões de estudo para calcular a ofensiva (streak) de dias
    let streakDays = 0;
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessions && sessions.length > 0) {
      const dates = sessions.map((s) => new Date(s.created_at).toISOString().split('T')[0]);
      const uniqueDates = Array.from(new Set(dates)).sort().reverse();

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
        streakDays = 1;
        let checkDate = uniqueDates.includes(today)
          ? new Date()
          : new Date(Date.now() - 86400000);

        for (let i = 1; i < uniqueDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const expected = checkDate.toISOString().split('T')[0];
          if (uniqueDates[i] === expected) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalWordsSaved,
      masteredWordsCount,
      learningWordsCount,
      masteryPercentage,
      totalReviews,
      studyStreakDays: streakDays,
      subtitlesCompleted: 0,
    };
  } catch (err) {
    console.error('Erro ao calcular estatísticas:', err);
    return defaultStats;
  }
}

/**
 * Sincroniza palavras salvas offline (AsyncStorage) para o Supabase quando o usuário faz login.
 */
export async function syncLocalCardsToCloud(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const user = await getCurrentUser();
  if (!user) return 0;

  try {
    const rawLocal = await AsyncStorage.getItem(LOCAL_VOCABULARY_KEY);
    if (!rawLocal) return 0;

    const localCards: SavedWord[] = JSON.parse(rawLocal);
    if (!Array.isArray(localCards) || localCards.length === 0) return 0;

    let syncedCount = 0;
    for (const card of localCards) {
      await saveCloudFlashcard(card);
      syncedCount++;
    }

    return syncedCount;
  } catch (err) {
    console.error('Erro na sincronização de vocabulário:', err);
    return 0;
  }
}
