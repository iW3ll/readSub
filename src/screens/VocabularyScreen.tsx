import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SavedWord } from '../types';
import {
  getSavedWords,
  deleteWord,
  toggleWordMastered,
} from '../storage/asyncStorage';
import { speakEnglish } from '../services/speechService';

interface VocabularyScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'learning' | 'mastered';

export const VocabularyScreen: React.FC<VocabularyScreenProps> = ({ navigation }) => {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWords();
    const unsubscribe = navigation.addListener('focus', () => {
      loadWords();
    });
    return unsubscribe;
  }, [navigation]);

  const loadWords = async () => {
    const data = await getSavedWords();
    setWords(data);
  };

  const handleDelete = (id: string, word: string) => {
    Alert.alert(
      'Remover Palavra',
      `Deseja remover "${word}" do seu caderno de vocabulário?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await deleteWord(id);
            loadWords();
          },
        },
      ]
    );
  };

  const handleToggleMastered = async (id: string) => {
    await toggleWordMastered(id);
    loadWords();
  };

  // Filtros combinados
  const filteredWords = words.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'learning') return !item.mastered;
    if (filter === 'mastered') return item.mastered;
    return true;
  });

  const renderWordItem = ({ item }: { item: SavedWord }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <View style={styles.wordTitleGroup}>
          <Text style={styles.wordTitle}>{item.word}</Text>
          {item.phonetic ? (
            <Text style={styles.phonetic}>{item.phonetic}</Text>
          ) : null}
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => speakEnglish(item.cleanWord || item.word)}
          >
            <Ionicons name="volume-medium" size={18} color="#60A5FA" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.masterBadgeBtn,
              item.mastered ? styles.masteredActive : styles.learningActive,
            ]}
            onPress={() => handleToggleMastered(item.id)}
          >
            <Ionicons
              name={item.mastered ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={item.mastered ? '#10B981' : '#FACC15'}
            />
            <Text
              style={[
                styles.badgeBtnText,
                item.mastered ? { color: '#34D399' } : { color: '#FACC15' },
              ]}
            >
              {item.mastered ? 'Dominada' : 'Estudando'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.word)}
          >
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tradução */}
      <View style={styles.translationRow}>
        <Text style={styles.translationText}>{item.translation}</Text>
        {item.partOfSpeech && (
          <Text style={styles.posText}>({item.partOfSpeech})</Text>
        )}
      </View>

      {/* Frase de Contexto */}
      {item.contextSentence ? (
        <View style={styles.contextBox}>
          <Text style={styles.contextText}>"{item.contextSentence}"</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Caderno de Vocabulário</Text>
            <Text style={styles.subtitleCount}>
              {words.length} termos salvos ({words.filter((w) => w.mastered).length} dominados)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.flashcardQuickBtn}
            onPress={() => navigation.navigate('Flashcards')}
          >
            <Ionicons name="albums" size={18} color="#FFFFFF" />
            <Text style={styles.flashcardBtnText}>Flashcards</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de Busca */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por termo em inglês ou português..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filtros em Pílulas */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.pill, filter === 'all' && styles.pillActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.pillText, filter === 'all' && styles.pillTextActive]}>
              Todas ({words.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, filter === 'learning' && styles.pillActive]}
            onPress={() => setFilter('learning')}
          >
            <Text style={[styles.pillText, filter === 'learning' && styles.pillTextActive]}>
              Em Estudo ({words.filter((w) => !w.mastered).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, filter === 'mastered' && styles.pillActive]}
            onPress={() => setFilter('mastered')}
          >
            <Text style={[styles.pillText, filter === 'mastered' && styles.pillTextActive]}>
              Dominadas ({words.filter((w) => w.mastered).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Palavras */}
        {filteredWords.length > 0 ? (
          <FlatList
            data={filteredWords}
            keyExtractor={(item) => item.id}
            renderItem={renderWordItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={54} color="#475569" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Nenhuma palavra encontrada' : 'Nenhuma palavra salva ainda'}
            </Text>
            <Text style={styles.emptyDesc}>
              Toque nas palavras enquanto assiste à legenda no Player para salvar termos aqui.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  screenTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitleCount: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  flashcardQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  flashcardBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
  },
  wordCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordTitleGroup: {
    flex: 1,
  },
  wordTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  phonetic: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    backgroundColor: '#0F172A',
    padding: 6,
    borderRadius: 8,
  },
  masterBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  learningActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
  },
  masteredActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#0F172A',
    padding: 6,
    borderRadius: 8,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  translationText: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '700',
  },
  posText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  contextBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  contextText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
