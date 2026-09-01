import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleFile, SubtitleCue } from '../types';
import { speakEnglish } from '../services/speechService';

interface TranscriptScreenProps {
  navigation: any;
  currentSubtitle: SubtitleFile | null;
  onSeekToCue?: (ms: number) => void;
}

export const TranscriptScreen: React.FC<TranscriptScreenProps> = ({
  navigation,
  currentSubtitle,
  onSeekToCue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const cues = currentSubtitle?.cues || [];

  // Filtra por termo de busca
  const filteredCues = cues.filter((cue) =>
    cue.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCue = (cue: SubtitleCue) => {
    if (onSeekToCue) {
      onSeekToCue(cue.startTimeMs);
    }
    navigation.navigate('Player');
  };

  const isBook = currentSubtitle?.contentType === 'epub' || currentSubtitle?.contentType === 'pdf' || currentSubtitle?.category === 'epub' || currentSubtitle?.category === 'pdf' || currentSubtitle?.category === 'book';

  const renderCueItem = ({ item, index }: { item: SubtitleCue; index: number }) => (
    <TouchableOpacity
      style={styles.cueItemCard}
      activeOpacity={0.7}
      onPress={() => handleSelectCue(item)}
    >
      <View style={styles.cueMetaRow}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>#{item.id}</Text>
        </View>

        <View style={[
          styles.timeBadge,
          item.chapterTitle ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981', borderWidth: 1 } : null
        ]}>
          <Ionicons
            name={item.chapterTitle ? 'book-outline' : item.pageNumber ? 'document-text-outline' : 'time-outline'}
            size={12}
            color={item.chapterTitle ? '#34D399' : item.pageNumber ? '#F87171' : '#94A3B8'}
          />
          <Text style={[
            styles.timeText,
            item.chapterTitle ? { color: '#34D399' } : item.pageNumber ? { color: '#F87171' } : null
          ]}>
            {item.chapterTitle || (item.pageNumber ? `Página ${item.pageNumber}` : `${item.startTimeStr.split(',')[0]} → ${item.endTimeStr.split(',')[0]}`)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.audioIconBtn}
          onPress={() => speakEnglish(item.text)}
        >
          <Ionicons name="volume-medium" size={16} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <Text style={styles.cueText}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>{isBook ? 'Leitura Contínua' : 'Transcrição Completa'}</Text>
          <Text style={styles.subtitleCount}>
            {currentSubtitle ? `${cues.length} ${isBook ? 'frases indexadas' : 'falas indexadas'} • ${currentSubtitle.title}` : 'Nenhum conteúdo'}
          </Text>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar palavra ou trecho no roteiro..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Falas */}
        {filteredCues.length > 0 ? (
          <FlatList
            data={filteredCues}
            keyExtractor={(item) => `cue_${item.id}`}
            renderItem={renderCueItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#475569" />
            <Text style={styles.emptyTitle}>Nenhuma fala encontrada</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Carregue uma legenda primeiro.'}
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
    marginTop: 14,
    marginBottom: 12,
  },
  screenTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitleCount: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  cueItemCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  indexBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indexText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  audioIconBtn: {
    marginLeft: 'auto',
    backgroundColor: '#0F172A',
    padding: 6,
    borderRadius: 8,
  },
  cueText: {
    color: '#F8FAFC',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 13,
  },
});
