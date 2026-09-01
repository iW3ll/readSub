import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleFile, StudyStats } from '../types';
import { getSampleSubtitles } from '../assets/sampleSubtitles';
import { getRecentSubtitles, saveRecentSubtitle, getStudyStats } from '../storage/asyncStorage';
import { parseDigitalDocument } from '../services/documentParser';

interface HomeScreenProps {
  navigation: any;
  onSelectSubtitle: (subtitle: SubtitleFile) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  onSelectSubtitle,
}) => {
  const [samples] = useState<SubtitleFile[]>(getSampleSubtitles());
  const [recents, setRecents] = useState<SubtitleFile[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'books' | 'subtitles'>('all');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processando arquivo...');
  
  // Modal para colar texto / SRT
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const rec = await getRecentSubtitles();
    setRecents(rec);
    const st = await getStudyStats();
    setStats(st);
  };

  // Carregar arquivo (PDF, ePub, SRT, TXT)
  const handlePickDocument = async (filterMode: 'all' | 'books' | 'subtitles' = 'all') => {
    try {
      let mimeTypes: string[] = ['*/*'];
      if (filterMode === 'books') {
        mimeTypes = [
          'application/pdf',
          '.pdf',
          'application/epub+zip',
          '.epub',
          'text/plain',
          '.txt',
          'application/octet-stream',
          '*/*',
        ];
      } else if (filterMode === 'subtitles') {
        mimeTypes = ['text/plain', '.srt', '.vtt', '.txt', 'application/x-subrip', '*/*'];
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      const fileName = fileAsset.name || 'Documento';
      const fileUri = fileAsset.uri;
      const fileMime = fileAsset.mimeType || '';

      setIsLoadingFile(true);
      setLoadingMessage(
        fileName.toLowerCase().endsWith('.pdf') || fileMime.includes('pdf')
          ? 'Extraindo páginas e texto do PDF...'
          : fileName.toLowerCase().endsWith('.epub') || fileMime.includes('epub')
          ? 'Processando capítulos do livro ePub...'
          : 'Indexando conteúdo...'
      );

      const parsedDoc = await parseDigitalDocument({
        name: fileName,
        uri: fileUri,
        mimeType: fileMime,
        file: (fileAsset as any).file,
      });

      if (!parsedDoc || !parsedDoc.cues || parsedDoc.cues.length === 0) {
        Alert.alert(
          'Arquivo Sem Conteúdo',
          'Não foi possível encontrar frases ou falas válidas no arquivo selecionado.'
        );
        setIsLoadingFile(false);
        return;
      }

      await saveRecentSubtitle(parsedDoc);
      setIsLoadingFile(false);
      onSelectSubtitle(parsedDoc);
      navigation.navigate('Player');
    } catch (error: any) {
      setIsLoadingFile(false);
      console.error('Erro ao abrir documento:', error);
      Alert.alert(
        'Erro ao Abrir Arquivo',
        error?.message || 'Ocorreu uma falha ao tentar ler e processar o arquivo selecionado.'
      );
    }
  };

  // Processar texto ou SRT colado manualmente
  const handleProcessPastedContent = async () => {
    if (!pastedText.trim()) {
      Alert.alert('Aviso', 'Por favor, cole o conteúdo de um livro, texto ou legenda .SRT.');
      return;
    }

    try {
      setIsLoadingFile(true);
      setLoadingMessage('Processando texto colado...');

      const title = pastedTitle.trim() || `Texto Colado (${new Date().toLocaleDateString()})`;
      const parsedDoc = await parseDigitalDocument({
        name: title,
        rawText: pastedText,
      });

      await saveRecentSubtitle(parsedDoc);
      setIsLoadingFile(false);
      setPasteModalVisible(false);
      setPastedText('');
      setPastedTitle('');

      onSelectSubtitle(parsedDoc);
      navigation.navigate('Player');
    } catch (error: any) {
      setIsLoadingFile(false);
      Alert.alert('Erro ao Processar', error?.message || 'Não foi possível analisar o texto informado.');
    }
  };

  const handleSelectSub = async (sub: SubtitleFile) => {
    await saveRecentSubtitle(sub);
    onSelectSubtitle(sub);
    navigation.navigate('Player');
  };

  const filteredSamples = samples.filter((s) => {
    if (libraryFilter === 'books') {
      return s.contentType === 'pdf' || s.contentType === 'epub' || s.category === 'book' || s.category === 'pdf' || s.category === 'epub';
    }
    if (libraryFilter === 'subtitles') {
      return s.contentType === 'subtitle' || s.category === 'movies' || s.category === 'speeches' || s.category === 'dialogues';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        {/* Header de Boas-Vindas */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>ReadSub 🎬</Text>
            <Text style={styles.appSubtitle}>Aprenda inglês no ritmo das legendas</Text>
          </View>
          <TouchableOpacity
            style={styles.profileHeaderBtn}
            onPress={() => navigation.navigate('Perfil')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={34} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Resumo de Estudos / Estatísticas */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.totalWordsSaved || 0}</Text>
            <Text style={styles.statLabel}>Palavras Salvas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#34D399' }]}>
              {stats?.masteredWordsCount || 0}
            </Text>
            <Text style={styles.statLabel}>Dominadas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <TouchableOpacity onPress={() => navigation.navigate('Flashcards')}>
              <Text style={[styles.statNumber, { color: '#60A5FA' }]}>Praticar</Text>
              <Text style={styles.statLabel}>Flashcards →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção de Upload e Entrada de Conteúdo */}
        <Text style={styles.sectionHeading}>CARREGAR CONTEÚDO</Text>
        
        <View style={styles.actionGrid}>
          {/* Botão de Livro Digital (PDF / ePub) */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handlePickDocument('books')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#10B981' }]}>
              <Ionicons name="book-outline" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardTitle}>Ler Livro (PDF / ePub)</Text>
            <Text style={styles.actionCardDesc}>Importar e-books e PDFs</Text>
          </TouchableOpacity>

          {/* Botão de Arquivo .SRT */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handlePickDocument('subtitles')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="folder-open-outline" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardTitle}>Legenda .SRT</Text>
            <Text style={styles.actionCardDesc}>Do dispositivo</Text>
          </TouchableOpacity>

          {/* Botão de Colar Texto */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setPasteModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#7C3AED' }]}>
              <Ionicons name="clipboard-outline" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardTitle}>Colar Texto / SRT</Text>
            <Text style={styles.actionCardDesc}>Texto ou legenda</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Biblioteca e Filtros */}
        <View style={styles.libraryHeaderRow}>
          <Text style={styles.sectionHeading}>BIBLIOTECA DE MODELOS</Text>
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[styles.filterPill, libraryFilter === 'all' && styles.filterPillActive]}
              onPress={() => setLibraryFilter('all')}
            >
              <Text style={[styles.filterPillText, libraryFilter === 'all' && styles.filterPillTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, libraryFilter === 'books' && styles.filterPillActive]}
              onPress={() => setLibraryFilter('books')}
            >
              <Text style={[styles.filterPillText, libraryFilter === 'books' && styles.filterPillTextActive]}>
                📚 Livros
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, libraryFilter === 'subtitles' && styles.filterPillActive]}
              onPress={() => setLibraryFilter('subtitles')}
            >
              <Text style={[styles.filterPillText, libraryFilter === 'subtitles' && styles.filterPillTextActive]}>
                🎬 Legendas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredSamples.map((item) => {
          const isBook = item.contentType === 'epub' || item.contentType === 'pdf' || item.category === 'epub' || item.category === 'pdf' || item.category === 'book';
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.subtitleCard}
              onPress={() => handleSelectSub(item)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.subIconContainer,
                item.contentType === 'epub' || item.category === 'epub'
                  ? { backgroundColor: 'rgba(16, 185, 129, 0.15)' }
                  : item.contentType === 'pdf' || item.category === 'pdf'
                  ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                  : { backgroundColor: '#0F172A' }
              ]}>
                <Ionicons
                  name={
                    item.contentType === 'epub' || item.category === 'epub'
                      ? 'book'
                      : item.contentType === 'pdf' || item.category === 'pdf'
                      ? 'document-text'
                      : item.category === 'movies'
                      ? 'film'
                      : item.category === 'speeches'
                      ? 'mic'
                      : 'chatbubbles'
                  }
                  size={24}
                  color={
                    item.contentType === 'epub' || item.category === 'epub'
                      ? '#34D399'
                      : item.contentType === 'pdf' || item.category === 'pdf'
                      ? '#F87171'
                      : '#60A5FA'
                  }
                />
              </View>
              <View style={styles.subInfoContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.subTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isBook && (
                    <View style={[
                      styles.bookTypeBadge,
                      item.contentType === 'epub' ? styles.epubBadge : styles.pdfBadge
                    ]}>
                      <Text style={styles.bookTypeBadgeText}>
                        {item.contentType === 'epub' ? 'ePUB' : 'PDF'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.subDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.subMetaRow}>
                  <Text style={styles.subMetaText}>
                    {item.cues.length} {isBook ? 'frases' : 'falas'}
                  </Text>
                  {item.author && (
                    <>
                      <Text style={styles.subMetaDot}>•</Text>
                      <Text style={styles.subMetaText} numberOfLines={1}>
                        Autor: {item.author}
                      </Text>
                    </>
                  )}
                  {item.totalChapters && (
                    <>
                      <Text style={styles.subMetaDot}>•</Text>
                      <Text style={styles.subMetaText}>
                        {item.totalChapters} capítulos
                      </Text>
                    </>
                  )}
                  {item.totalPages && (
                    <>
                      <Text style={styles.subMetaDot}>•</Text>
                      <Text style={styles.subMetaText}>
                        {item.totalPages} págs
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Ionicons name="play-circle" size={32} color="#3B82F6" />
            </TouchableOpacity>
          );
        })}

        {/* Seção Recentes se houver */}
        {recents.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>RECENTES</Text>
            {recents.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={`recent_${item.id}`}
                style={[styles.subtitleCard, styles.recentCard]}
                onPress={() => handleSelectSub(item)}
              >
                <Ionicons
                  name={
                    item.contentType === 'epub' || item.category === 'epub'
                      ? 'book'
                      : item.contentType === 'pdf' || item.category === 'pdf'
                      ? 'document-text'
                      : 'time-outline'
                  }
                  size={22}
                  color="#94A3B8"
                />
                <View style={[styles.subInfoContainer, { marginLeft: 12 }]}>
                  <Text style={styles.subTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.subDesc}>
                    {item.cues.length} {item.contentType === 'epub' || item.contentType === 'pdf' ? 'frases salvas' : 'falas salvas'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Carregamento ao Processar Arquivo */}
      <Modal visible={isLoadingFile} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingModalTitle}>Carregando Documento</Text>
            <Text style={styles.loadingModalDesc}>{loadingMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Modal para colar texto / .SRT */}
      <Modal
        visible={pasteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasteModalVisible(false)}
      >
        <View style={styles.pasteModalOverlay}>
          <View style={styles.pasteModalContent}>
            <View style={styles.pasteModalHeader}>
              <Text style={styles.pasteModalTitle}>Colar Texto ou Legenda</Text>
              <TouchableOpacity onPress={() => setPasteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Título (ex: O Pequeno Príncipe / Trecho de Filme)"
              placeholderTextColor="#64748B"
              value={pastedTitle}
              onChangeText={setPastedTitle}
            />

            <TextInput
              style={styles.pasteInput}
              placeholder="Cole aqui o texto em inglês (livro, parágrafos, artigo) ou o formato SRT com tempos..."
              placeholderTextColor="#64748B"
              multiline
              value={pastedText}
              onChangeText={setPastedText}
              textAlignVertical="top"
            />

            <View style={styles.pasteActions}>
              <TouchableOpacity
                style={styles.pasteCancelBtn}
                onPress={() => setPasteModalVisible(false)}
              >
                <Text style={styles.pasteCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pasteSubmitBtn}
                onPress={handleProcessPastedContent}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.pasteSubmitText}>Carregar Conteúdo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 18,
  },
  header: {
    marginTop: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHeaderBtn: {
    padding: 4,
  },
  appName: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
  },
  sectionHeading: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionCardDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  subtitleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recentCard: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
  },
  subIconContainer: {
    backgroundColor: '#0F172A',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subInfoContainer: {
    flex: 1,
    marginRight: 10,
  },
  subTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  subDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  subMetaText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
  },
  subMetaDot: {
    color: '#64748B',
    marginHorizontal: 6,
    fontSize: 10,
  },
  pasteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  pasteModalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '85%',
  },
  pasteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pasteModalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  titleInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pasteInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 13,
    height: 180,
    borderWidth: 1,
    borderColor: '#334155',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  pasteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  pasteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  pasteCancelText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  pasteSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pasteSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  libraryHeaderRow: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  filterPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  bookTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  epubBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  pdfBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  bookTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  loadingModalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  loadingModalDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
