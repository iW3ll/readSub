import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleCue } from '../types';

interface SubtitleViewerProps {
  currentCue: SubtitleCue | null;
  previousCue: SubtitleCue | null;
  nextCue: SubtitleCue | null;
  onWordPress: (word: string, contextSentence: string) => void;
  onTranslateFullLine: (sentence: string) => void;
  onSpeakFullLine: (sentence: string) => void;
}

export const SubtitleViewer: React.FC<SubtitleViewerProps> = ({
  currentCue,
  previousCue,
  nextCue,
  onWordPress,
  onTranslateFullLine,
  onSpeakFullLine,
}) => {
  // Tokeniza o texto em palavras individuais preservando espaços e pontuações
  const renderInteractiveWords = (sentence: string) => {
    if (!sentence) return null;

    // Divide por espaços mantendo os tokens
    const tokens = sentence.split(/(\s+)/);

    return (
      <View style={styles.wordsContainer}>
        {tokens.map((token, index) => {
          // Se for apenas espaço em branco
          if (/^\s+$/.test(token)) {
            return <Text key={`space_${index}`} style={styles.spaceText}> </Text>;
          }

          // Se for palavra real
          return (
            <TouchableOpacity
              key={`word_${index}_${token}`}
              activeOpacity={0.6}
              style={styles.wordButton}
              onPress={() => onWordPress(token, sentence)}
            >
              <Text style={styles.wordText}>{token}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Fala Anterior (Contexto sutil) */}
      {previousCue && (
        <View style={styles.neighborCueContainer}>
          <Text style={styles.neighborCueText} numberOfLines={1}>
            {previousCue.text}
          </Text>
        </View>
      )}

      {/* Fala Atual (Em Destaque) */}
      <View style={styles.activeCueCard}>
        {currentCue ? (
          <>
            <View style={styles.cueHeader}>
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={13} color="#94A3B8" />
                <Text style={styles.timeBadgeText}>
                  {currentCue.startTimeStr.split(',')[0]} - {currentCue.endTimeStr.split(',')[0]}
                </Text>
              </View>
              
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onSpeakFullLine(currentCue.text)}
                  accessibilityLabel="Ouvir fala completa"
                >
                  <Ionicons name="volume-medium" size={18} color="#60A5FA" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onTranslateFullLine(currentCue.text)}
                  accessibilityLabel="Traduzir frase inteira"
                >
                  <Ionicons name="language" size={18} color="#34D399" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.interactiveArea}>
              {renderInteractiveWords(currentCue.text)}
            </View>

            <Text style={styles.tapTip}>Toque em qualquer palavra para ver tradução e pronúncia</Text>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={32} color="#475569" />
            <Text style={styles.emptyText}>Silêncio / Aguardando próxima fala...</Text>
          </View>
        )}
      </View>

      {/* Próxima Fala (Prévia sutil) */}
      {nextCue && (
        <View style={styles.neighborCueContainer}>
          <Text style={styles.neighborCueText} numberOfLines={1}>
            {nextCue.text}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  neighborCueContainer: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    opacity: 0.45,
    marginVertical: 4,
  },
  neighborCueText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  activeCueCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    minHeight: 160,
    justifyContent: 'center',
  },
  cueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  timeBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    backgroundColor: '#0F172A',
    padding: 6,
    borderRadius: 10,
  },
  interactiveArea: {
    marginVertical: 8,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 3,
    marginHorizontal: 2,
    marginVertical: 3,
    borderRadius: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#60A5FA',
  },
  wordText: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 28,
  },
  spaceText: {
    color: '#F8FAFC',
    fontSize: 19,
  },
  tapTip: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
