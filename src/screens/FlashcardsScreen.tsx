import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SavedWord } from '../types';
import { FlashcardItem } from '../components/FlashcardItem';
import {
  getSavedWords,
  toggleWordMastered,
  deleteWord,
} from '../storage/asyncStorage';
import { speakEnglish } from '../services/speechService';

interface FlashcardsScreenProps {
  navigation: any;
}

export const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({ navigation }) => {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [mode, setMode] = useState<'session' | 'list'>('session');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const data = await getSavedWords();
    setWords(data);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  const handleToggleMastered = async (id: string) => {
    await toggleWordMastered(id);
    const updated = await getSavedWords();
    setWords(updated);
  };

  const handleDelete = async (id: string) => {
    await deleteWord(id);
    const updated = await getSavedWords();
    setWords(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  // Avançar no modo de estudo
  const handleAnswerCard = async (mastered: boolean) => {
    if (words.length === 0) return;
    const currentWord = words[currentIndex];

    if (currentWord && currentWord.mastered !== mastered) {
      await toggleWordMastered(currentWord.id);
      const updated = await getSavedWords();
      setWords(updated);
    }

    setIsFlipped(false);
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const currentCard = words[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Flashcards de Estudo</Text>
            <Text style={styles.subtitleCount}>
              {words.length} cartas no seu baralho
            </Text>
          </View>

          {words.length > 0 && (
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'session' && styles.modeBtnActive]}
                onPress={() => {
                  setMode('session');
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setSessionCompleted(false);
                }}
              >
                <Ionicons
                  name="play"
                  size={14}
                  color={mode === 'session' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    mode === 'session' && styles.modeBtnTextActive,
                  ]}
                >
                  Sessão
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, mode === 'list' && styles.modeBtnActive]}
                onPress={() => setMode('list')}
              >
                <Ionicons
                  name="list"
                  size={14}
                  color={mode === 'list' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    mode === 'list' && styles.modeBtnTextActive,
                  ]}
                >
                  Lista
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {words.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={60} color="#475569" />
            <Text style={styles.emptyTitle}>Nenhum flashcard disponível</Text>
            <Text style={styles.emptyDesc}>
              Abra uma legenda no Player e toque em palavras desconhecidas para adicioná-las aos seus flashcards.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Player')}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>Ir para o Player</Text>
            </TouchableOpacity>
          </View>
        ) : mode === 'session' ? (
          sessionCompleted ? (
            // Tela de conclusão da sessão
            <View style={styles.completionContainer}>
              <View style={styles.trophyCircle}>
                <Ionicons name="trophy" size={54} color="#FACC15" />
              </View>
              <Text style={styles.completionTitle}>Parabéns! Sessão Concluída! 🎉</Text>
              <Text style={styles.completionDesc}>
                Você revisou todas as {words.length} cartas do seu vocabulário.
              </Text>

              <View style={styles.statsBox}>
                <Text style={styles.statsBoxText}>
                  Cartas Dominadas: {words.filter((w) => w.mastered).length} de {words.length}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.restartBtn}
                onPress={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setSessionCompleted(false);
                }}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.restartBtnText}>Reiniciar Prática</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Modo Sessão Interativa (1 Card por vez)
            <ScrollView
              contentContainerStyle={styles.sessionArea}
              showsVerticalScrollIndicator={true}
            >
              {/* Barra de Progresso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    Carta {currentIndex + 1} de {words.length}
                  </Text>
                  <Text style={styles.progressPercent}>
                    {Math.round(((currentIndex + 1) / words.length) * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${((currentIndex + 1) / words.length) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Card Central */}
              {currentCard && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.bigCard,
                    isFlipped ? styles.bigCardBack : styles.bigCardFront,
                  ]}
                  onPress={() => setIsFlipped(!isFlipped)}
                >
                  <View style={styles.bigCardTop}>
                    <TouchableOpacity
                      style={styles.ttsCircle}
                      onPress={() => speakEnglish(currentCard.cleanWord || currentCard.word)}
                    >
                      <Ionicons name="volume-medium" size={24} color="#60A5FA" />
                    </TouchableOpacity>
                    <Text style={styles.sideHint}>
                      {isFlipped ? 'VERSO (TRADUÇÃO)' : 'FRENTE (INGLÊS)'}
                    </Text>
                  </View>

                  <View style={styles.bigCardCenter}>
                    {!isFlipped ? (
                      <>
                        <Text style={styles.bigWord}>{currentCard.word}</Text>
                        {currentCard.phonetic ? (
                          <Text style={styles.bigPhonetic}>{currentCard.phonetic}</Text>
                        ) : null}

                        {currentCard.contextSentence ? (
                          <View style={styles.bigContextBox}>
                            <Text style={styles.bigContextText}>
                              "{currentCard.contextSentence}"
                            </Text>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Text style={styles.bigTranslation}>{currentCard.translation}</Text>
                        {currentCard.definition ? (
                          <Text style={styles.bigDefinition}>
                            {currentCard.definition}
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>

                  <Text style={styles.flipHelp}>Toque no card para virar ↺</Text>
                </TouchableOpacity>
              )}

              {/* Botões de Decisão */}
              <View style={styles.decisionRow}>
                <TouchableOpacity
                  style={[styles.decisionBtn, styles.learningBtn]}
                  onPress={() => handleAnswerCard(false)}
                >
                  <Ionicons name="refresh-outline" size={20} color="#FACC15" />
                  <Text style={[styles.decisionBtnText, { color: '#FACC15' }]}>
                    Revisar Mais
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.decisionBtn, styles.masteredBtn]}
                  onPress={() => handleAnswerCard(true)}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#34D399" />
                  <Text style={[styles.decisionBtnText, { color: '#34D399' }]}>
                    Já Dominei!
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )
        ) : (
          // Modo Lista de Todos os Cards
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={true}
          >
            {words.map((item) => (
              <FlashcardItem
                key={item.id}
                card={item}
                onToggleMastered={handleToggleMastered}
                onDelete={handleDelete}
              />
            ))}
            <View style={{ height: 30 }} />
          </ScrollView>
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
    marginBottom: 16,
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    gap: 4,
  },
  modeBtnActive: {
    backgroundColor: '#3B82F6',
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  sessionArea: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  bigCard: {
    flex: 1,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: 340,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bigCardFront: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  bigCardBack: {
    backgroundColor: '#0F172A',
    borderColor: '#10B981',
  },
  bigCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ttsCircle: {
    backgroundColor: '#0F172A',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideHint: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bigCardCenter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  bigWord: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  bigPhonetic: {
    color: '#94A3B8',
    fontSize: 16,
    fontFamily: 'monospace',
    marginTop: 6,
    marginBottom: 14,
  },
  bigContextBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bigContextText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  bigTranslation: {
    color: '#34D399',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  bigDefinition: {
    color: '#E2E8F0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  flipHelp: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  decisionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    backgroundColor: '#1E293B',
  },
  learningBtn: {
    borderColor: '#EAB308',
  },
  masteredBtn: {
    borderColor: '#10B981',
  },
  decisionBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '800',
  },
  emptyDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  completionTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  completionDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  statsBox: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsBoxText: {
    color: '#34D399',
    fontWeight: '700',
    fontSize: 14,
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
  },
  restartBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
