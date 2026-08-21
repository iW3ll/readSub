import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedWord } from '../types';
import { speakEnglish } from '../services/speechService';

interface FlashcardItemProps {
  card: SavedWord;
  onToggleMastered: (id: string) => void;
  onDelete: (id: string) => void;
}

export const FlashcardItem: React.FC<FlashcardItemProps> = ({
  card,
  onToggleMastered,
  onDelete,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.cardContainer, isFlipped ? styles.cardBack : styles.cardFront]}
        onPress={() => setIsFlipped(!isFlipped)}
      >
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                card.mastered ? styles.masteredBadge : styles.learningBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  card.mastered ? styles.masteredBadgeText : styles.learningBadgeText,
                ]}
              >
                {card.mastered ? 'DOMINADO' : 'EM ESTUDO'}
              </Text>
            </View>
            {card.partOfSpeech && (
              <View style={styles.posBadge}>
                <Text style={styles.posBadgeText}>{card.partOfSpeech}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => speakEnglish(card.cleanWord || card.word)}
            >
              <Ionicons name="volume-medium" size={18} color="#60A5FA" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(card.id)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {!isFlipped ? (
            // Frente do Card (Inglês)
            <>
              <Text style={styles.wordEnglish}>{card.word}</Text>
              {card.phonetic ? (
                <Text style={styles.phonetic}>{card.phonetic}</Text>
              ) : null}

              {card.contextSentence ? (
                <View style={styles.contextBox}>
                  <Text style={styles.contextLabel}>Contexto:</Text>
                  <Text style={styles.contextText}>"{card.contextSentence}"</Text>
                </View>
              ) : null}

              <Text style={styles.flipInstruction}>Toque para virar e ver a tradução ↺</Text>
            </>
          ) : (
            // Verso do Card (Português + Definição)
            <>
              <Text style={styles.translationLabel}>TRADUÇÃO</Text>
              <Text style={styles.wordPortuguese}>{card.translation}</Text>

              {card.definition ? (
                <View style={styles.definitionBox}>
                  <Text style={styles.definitionLabel}>Definição:</Text>
                  <Text style={styles.definitionText}>{card.definition}</Text>
                </View>
              ) : null}

              <Text style={styles.flipInstruction}>Toque para virar para o inglês ↻</Text>
            </>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[
              styles.masterButton,
              card.mastered ? styles.unmasterBtn : styles.masterBtn,
            ]}
            onPress={() => onToggleMastered(card.id)}
          >
            <Ionicons
              name={card.mastered ? 'refresh' : 'checkmark-circle'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.masterButtonText}>
              {card.mastered ? 'Marcar para Revisar' : 'Marcar como Dominado'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 8,
    width: '100%',
  },
  cardContainer: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    minHeight: 210,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cardFront: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardBack: {
    backgroundColor: '#0F172A',
    borderColor: '#3B82F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  learningBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  masteredBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  learningBadgeText: {
    color: '#FACC15',
  },
  masteredBadgeText: {
    color: '#34D399',
  },
  posBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  posBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  cardBody: {
    alignItems: 'center',
    marginVertical: 10,
  },
  wordEnglish: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  phonetic: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: 'monospace',
    marginTop: 2,
    marginBottom: 6,
  },
  contextBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    marginTop: 6,
  },
  contextLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  contextText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontStyle: 'italic',
  },
  translationLabel: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  wordPortuguese: {
    color: '#34D399',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  definitionBox: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    marginBottom: 6,
  },
  definitionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  definitionText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
  },
  flipInstruction: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  masterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  masterBtn: {
    backgroundColor: '#059669',
  },
  unmasterBtn: {
    backgroundColor: '#475569',
  },
  masterButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
