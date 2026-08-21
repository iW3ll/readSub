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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleFile, StudyStats } from '../types';
import { parseSRT } from '../services/srtParser';
import { getSampleSubtitles } from '../assets/sampleSubtitles';
import { getRecentSubtitles, saveRecentSubtitle, getStudyStats } from '../storage/asyncStorage';

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
  
  // Modal para colar texto .SRT
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

  // Carregar arquivo do celular via DocumentPicker
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*', 'text/plain', 'application/x-subrip'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      const fileName = fileAsset.name || 'Legenda Personalizada';
      const fileUri = fileAsset.uri;

      // Lê o conteúdo do arquivo com suporte a Web e Mobile
      let fileContent = '';
      if (Platform.OS === 'web') {
        const webAsset = fileAsset as any;
        if (webAsset.file && typeof webAsset.file.text === 'function') {
          fileContent = await webAsset.file.text();
        } else if (fileUri) {
          const res = await fetch(fileUri);
          fileContent = await res.text();
        }
      } else {
        fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      const parsedCues = parseSRT(fileContent);

      if (parsedCues.length === 0) {
        Alert.alert(
          'Arquivo Inválido',
          'Não foi possível encontrar blocos de legenda válidos no formato .SRT.'
        );
        return;
      }

      const newSubtitle: SubtitleFile = {
        id: `custom_${Date.now()}`,
        title: fileName.replace(/\.srt$/i, ''),
        description: `Legenda importada (${parsedCues.length} falas)`,
        category: 'custom',
        cues: parsedCues,
        durationMs: parsedCues[parsedCues.length - 1].endTimeMs,
        createdAt: Date.now(),
      };

      await saveRecentSubtitle(newSubtitle);
      onSelectSubtitle(newSubtitle);
      navigation.navigate('Player');
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
      Alert.alert('Erro', 'Ocorreu uma falha ao tentar ler o arquivo selecionado.');
    }
  };

  // Processar texto colado manualmente
  const handleProcessPastedSRT = async () => {
    if (!pastedText.trim()) {
      Alert.alert('Aviso', 'Por favor, cole o conteúdo de uma legenda .SRT.');
      return;
    }

    const parsedCues = parseSRT(pastedText);
    if (parsedCues.length === 0) {
      Alert.alert(
        'Formato Inválido',
        'O texto colado não possui o formato de timestamp de legendas .SRT (ex: 00:00:01,000 --> 00:00:04,000).'
      );
      return;
    }

    const title = pastedTitle.trim() || `Legenda Colada (${new Date().toLocaleDateString()})`;
    const newSubtitle: SubtitleFile = {
      id: `pasted_${Date.now()}`,
      title,
      description: `Texto colado com ${parsedCues.length} falas`,
      category: 'custom',
      cues: parsedCues,
      durationMs: parsedCues[parsedCues.length - 1].endTimeMs,
      createdAt: Date.now(),
    };

    await saveRecentSubtitle(newSubtitle);
    setPasteModalVisible(false);
    setPastedText('');
    setPastedTitle('');

    onSelectSubtitle(newSubtitle);
    navigation.navigate('Player');
  };

  const handleSelectSub = async (sub: SubtitleFile) => {
    await saveRecentSubtitle(sub);
    onSelectSubtitle(sub);
    navigation.navigate('Player');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header de Boas-Vindas */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>ReadSub 🎬</Text>
            <Text style={styles.appSubtitle}>Aprenda inglês no ritmo das legendas</Text>
          </View>
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

        {/* Seção de Upload e Entrada de Legenda */}
        <Text style={styles.sectionHeading}>CARREGAR LEGENDA</Text>
        
        <View style={styles.actionGrid}>
          {/* Botão de Arquivo .SRT */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handlePickDocument}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="folder-open-outline" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardTitle}>Abrir Arquivo .SRT</Text>
            <Text style={styles.actionCardDesc}>Carregue do seu celular</Text>
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
            <Text style={styles.actionCardTitle}>Colar Texto .SRT</Text>
            <Text style={styles.actionCardDesc}>Inserir bloco de texto</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Legendas Prontas / Biblioteca */}
        <Text style={styles.sectionHeading}>BIBLIOTECA DE MODELOS</Text>
        {samples.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.subtitleCard}
            onPress={() => handleSelectSub(item)}
            activeOpacity={0.7}
          >
            <View style={styles.subIconContainer}>
              <Ionicons
                name={
                  item.category === 'movies'
                    ? 'film'
                    : item.category === 'speeches'
                    ? 'mic'
                    : 'chatbubbles'
                }
                size={24}
                color="#60A5FA"
              />
            </View>
            <View style={styles.subInfoContainer}>
              <Text style={styles.subTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.subDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.subMetaRow}>
                <Text style={styles.subMetaText}>
                  {item.cues.length} falas
                </Text>
                <Text style={styles.subMetaDot}>•</Text>
                <Text style={styles.subMetaText}>
                  {(item.durationMs / 1000).toFixed(0)}s de duração
                </Text>
              </View>
            </View>
            <Ionicons name="play-circle" size={32} color="#3B82F6" />
          </TouchableOpacity>
        ))}

        {/* Seção Recentes se houver */}
        {recents.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>RECENTES</Text>
            {recents.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={`recent_${item.id}`}
                style={[styles.subtitleCard, styles.recentCard]}
                onPress={() => handleSelectSub(item)}
              >
                <Ionicons name="time-outline" size={22} color="#94A3B8" />
                <View style={[styles.subInfoContainer, { marginLeft: 12 }]}>
                  <Text style={styles.subTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.subDesc}>{item.cues.length} falas salvas</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal para colar texto .SRT */}
      <Modal
        visible={pasteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasteModalVisible(false)}
      >
        <View style={styles.pasteModalOverlay}>
          <View style={styles.pasteModalContent}>
            <View style={styles.pasteModalHeader}>
              <Text style={styles.pasteModalTitle}>Colar Legenda .SRT</Text>
              <TouchableOpacity onPress={() => setPasteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Título da legenda (ex: Trecho de Filme)"
              placeholderTextColor="#64748B"
              value={pastedTitle}
              onChangeText={setPastedTitle}
            />

            <TextInput
              style={styles.pasteInput}
              placeholder="Cole aqui o conteúdo SRT completo com tempos (ex: 1\n00:00:01,000 --> 00:00:04,000\nHello world!)"
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
                onPress={handleProcessPastedSRT}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.pasteSubmitText}>Carregar Legenda</Text>
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
  },
  appName: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
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
});
