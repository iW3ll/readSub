import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WordDetails } from '../types';
import { speakEnglish } from '../services/speechService';

interface WordTranslationModalProps {
  visible: boolean;
  loading: boolean;
  wordDetails: WordDetails | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
}

export const WordTranslationModal: React.FC<WordTranslationModalProps> = ({
  visible,
  loading,
  wordDetails,
  isSaved,
  onClose,
  onToggleSave,
}) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Barra superior de arraste / fechar */}
          <View style={styles.handleBar} />
          
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {wordDetails?.word || 'Traduzindo...'}
              </Text>
              {wordDetails?.phonetic ? (
                <Text style={styles.phoneticText}>{wordDetails.phonetic}</Text>
              ) : null}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Consultando DeepL & Dicionário...</Text>
            </View>
          ) : wordDetails ? (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
              {/* Botões de Ação Rápida: Áudio TTS e Salvar Vocabulário */}
              <View style={styles.actionsBar}>
                <TouchableOpacity
                  style={styles.speechButton}
                  onPress={() => speakEnglish(wordDetails.cleanWord || wordDetails.word)}
                >
                  <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                  <Text style={styles.speechButtonText}>Ouvir Pronúncia</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, isSaved && styles.savedActiveButton]}
                  onPress={onToggleSave}
                >
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isSaved ? '#10B981' : '#CBD5E1'}
                  />
                  <Text style={[styles.saveButtonText, isSaved && styles.savedActiveText]}>
                    {isSaved ? 'Salvo no Caderno' : 'Salvar Palavra'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bloco de Tradução Principal */}
              <View style={styles.cardSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>TRADUÇÃO (PORTUGUÊS)</Text>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceBadgeText}>
                      {wordDetails.source === 'deepl' ? 'DeepL API' : 'Tradutor'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.translationText}>{wordDetails.translation}</Text>
              </View>

              {/* Bloco de Definição em Inglês (se houver) */}
              {wordDetails.definition && (
                <View style={styles.cardSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>DEFINIÇÃO EM INGLÊS</Text>
                    {wordDetails.partOfSpeech && (
                      <View style={styles.posBadge}>
                        <Text style={styles.posBadgeText}>{wordDetails.partOfSpeech}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.definitionText}>{wordDetails.definition}</Text>
                </View>
              )}

              {/* Exemplo de uso adicional do dicionário */}
              {wordDetails.example && (
                <View style={styles.cardSection}>
                  <Text style={styles.sectionLabel}>EXEMPLO DE USO</Text>
                  <Text style={styles.exampleText}>"{wordDetails.example}"</Text>
                </View>
              )}

              {/* Contexto da fala da legenda */}
              {wordDetails.contextSentence && (
                <View style={[styles.cardSection, styles.contextCard]}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>CONTEXTO NA LEGENDA</Text>
                    <Ionicons name="film-outline" size={14} color="#60A5FA" />
                  </View>
                  <Text style={styles.contextSentenceText}>"{wordDetails.contextSentence}"</Text>
                </View>
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#334155',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  phoneticText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#1E293B',
    padding: 6,
    borderRadius: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  scrollContent: {
    marginTop: 4,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  speechButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  speechButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  savedActiveButton: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  saveButtonText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 13,
  },
  savedActiveText: {
    color: '#10B981',
  },
  cardSection: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contextCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: '#2563EB',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sourceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
  },
  posBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  posBadgeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontStyle: 'italic',
  },
  translationText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  definitionText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  exampleText: {
    color: '#93C5FD',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  contextSentenceText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
  },
});
