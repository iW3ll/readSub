import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleFile, SubtitleCue, WordDetails, UserSettings } from '../types';
import { SubtitleViewer } from '../components/SubtitleViewer';
import { PlayerControls } from '../components/PlayerControls';
import { WordTranslationModal } from '../components/WordTranslationModal';
import {
  findActiveCue,
  findCurrentCueIndex,
  cleanSubtitleText,
} from '../services/srtParser';
import { lookupWordDetails } from '../services/dictionaryService';
import { translateText } from '../services/translationService';
import { speakEnglish } from '../services/speechService';
import {
  getSettings,
  saveWord,
  isWordSaved,
  incrementStat,
} from '../storage/asyncStorage';

interface PlayerScreenProps {
  navigation: any;
  currentSubtitle: SubtitleFile | null;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  navigation,
  currentSubtitle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLoopingLine, setIsLoopingLine] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Modal de Tradução de Palavra / Frase
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);
  const [activeWordDetails, setActiveWordDetails] = useState<WordDetails | null>(null);
  const [isCurrentWordSaved, setIsCurrentWordSaved] = useState(false);

  // Refs de temporizador
  const timerRef = useRef<any>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const currentTimeMsRef = useRef<number>(0);
  currentTimeMsRef.current = currentTimeMs;

  const cues = currentSubtitle?.cues || [];
  const durationMs = currentSubtitle?.durationMs || 0;

  // Carrega configurações
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Gerenciamento do Motor de Tempo (Timer loop)
  useEffect(() => {
    if (isPlaying) {
      lastTickTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaReal = now - lastTickTimeRef.current;
        lastTickTimeRef.current = now;

        const deltaScaled = Math.round(deltaReal * playbackSpeed);
        const nextTime = currentTimeMsRef.current + deltaScaled;

        // Se estiver em modo Loop de Linha
        if (isLoopingLine && cues.length > 0) {
          const activeCue = findActiveCue(cues, currentTimeMsRef.current);
          if (activeCue && nextTime > activeCue.endTimeMs) {
            setCurrentTimeMs(activeCue.startTimeMs);
            return;
          }
        }

        // Fim da legenda
        if (nextTime >= durationMs && durationMs > 0) {
          setCurrentTimeMs(durationMs);
          setIsPlaying(false);
          incrementStat('subtitlesCompleted');
          return;
        }

        setCurrentTimeMs(nextTime);
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, isLoopingLine, durationMs, cues]);

  // Identifica a fala atual, anterior e posterior
  const currentCueIndex = findCurrentCueIndex(cues, currentTimeMs);
  const activeCue = findActiveCue(cues, currentTimeMs);
  const previousCue = currentCueIndex > 0 ? cues[currentCueIndex - 1] : null;
  const nextCue =
    currentCueIndex >= 0 && currentCueIndex < cues.length - 1
      ? cues[currentCueIndex + 1]
      : null;

  // Controles
  const handlePlayPause = () => {
    if (currentTimeMs >= durationMs && durationMs > 0) {
      setCurrentTimeMs(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (targetMs: number) => {
    setCurrentTimeMs(Math.max(0, Math.min(targetMs, durationMs)));
  };

  const handlePreviousCue = () => {
    if (cues.length === 0) return;
    if (currentCueIndex > 0) {
      setCurrentTimeMs(cues[currentCueIndex - 1].startTimeMs);
    } else {
      setCurrentTimeMs(0);
    }
  };

  const handleNextCue = () => {
    if (cues.length === 0) return;
    if (currentCueIndex >= 0 && currentCueIndex < cues.length - 1) {
      setCurrentTimeMs(cues[currentCueIndex + 1].startTimeMs);
    }
  };

  const handleSkipSeconds = (seconds: number) => {
    const next = currentTimeMs + seconds * 1000;
    setCurrentTimeMs(Math.max(0, Math.min(next, durationMs)));
  };

  const handleToggleLoop = () => {
    setIsLoopingLine(!isLoopingLine);
  };

  const handleChangeSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex]);
  };

  // Clique em uma palavra da legenda
  const handleWordPress = async (word: string, contextSentence: string) => {
    if (settings?.autoPauseOnWordClick && isPlaying) {
      setIsPlaying(false);
    }

    setModalVisible(true);
    setLoadingWord(true);
    setActiveWordDetails(null);

    try {
      const details = await lookupWordDetails(
        word,
        contextSentence,
        currentSubtitle?.title,
        currentTimeMs,
        settings?.deepLApiKey
      );
      setActiveWordDetails(details);
      const saved = await isWordSaved(details.cleanWord);
      setIsCurrentWordSaved(saved);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWord(false);
    }
  };

  // Traduzir a linha inteira da fala
  const handleTranslateFullLine = async (sentence: string) => {
    if (isPlaying) setIsPlaying(false);

    setModalVisible(true);
    setLoadingWord(true);

    try {
      const transRes = await translateText(sentence, 'PT', settings?.deepLApiKey);
      const details: WordDetails = {
        word: sentence,
        cleanWord: sentence,
        translation: transRes.translatedText,
        source: transRes.source,
        contextSentence: sentence,
        subtitleTitle: currentSubtitle?.title,
        timestampMs: currentTimeMs,
      };
      setActiveWordDetails(details);
      setIsCurrentWordSaved(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWord(false);
    }
  };

  const handleSpeakFullLine = (sentence: string) => {
    speakEnglish(sentence, {
      rate: settings?.ttsRate || 0.9,
      pitch: settings?.ttsPitch || 1.0,
    });
  };

  // Salvar ou remover palavra no Caderno de Vocabulário
  const handleToggleSaveWord = async () => {
    if (!activeWordDetails) return;

    try {
      if (!isCurrentWordSaved) {
        await saveWord({
          word: activeWordDetails.word,
          cleanWord: activeWordDetails.cleanWord,
          translation: activeWordDetails.translation,
          phonetic: activeWordDetails.phonetic,
          partOfSpeech: activeWordDetails.partOfSpeech,
          definition: activeWordDetails.definition,
          exampleSentence: activeWordDetails.example,
          contextSentence: activeWordDetails.contextSentence || '',
          subtitleTitle: activeWordDetails.subtitleTitle || 'Geral',
          timestampMs: activeWordDetails.timestampMs,
        });
        setIsCurrentWordSaved(true);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar no vocabulário.');
    }
  };

  if (!currentSubtitle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.noSubContainer}>
          <Ionicons name="film-outline" size={64} color="#475569" />
          <Text style={styles.noSubTitle}>Nenhuma legenda carregada</Text>
          <Text style={styles.noSubDesc}>
            Selecione uma legenda na biblioteca ou abra um arquivo .SRT na tela inicial.
          </Text>
          <TouchableOpacity
            style={styles.goHomeButton}
            onPress={() => navigation.navigate('Início')}
          >
            <Ionicons name="home" size={18} color="#FFFFFF" />
            <Text style={styles.goHomeButtonText}>Ir para Início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header do Player */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.subTitle} numberOfLines={1}>
              {currentSubtitle.title}
            </Text>
            <Text style={styles.subSubtitle}>
              {cues.length} falas • {Math.floor(durationMs / 1000)}s
            </Text>
          </View>

          <TouchableOpacity
            style={styles.transcriptButton}
            onPress={() => navigation.navigate('Transcrição')}
          >
            <Ionicons name="list" size={22} color="#60A5FA" />
          </TouchableOpacity>
        </View>

        {/* Área Principal de Exibição das Legendas Interativas */}
        <ScrollView
          contentContainerStyle={styles.centerDisplay}
          showsVerticalScrollIndicator={false}
        >
          <SubtitleViewer
            currentCue={activeCue}
            previousCue={previousCue}
            nextCue={nextCue}
            onWordPress={handleWordPress}
            onTranslateFullLine={handleTranslateFullLine}
            onSpeakFullLine={handleSpeakFullLine}
          />
        </ScrollView>

        {/* Painel Inferior de Controles */}
        <View style={styles.bottomControls}>
          <PlayerControls
            isPlaying={isPlaying}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            playbackSpeed={playbackSpeed}
            isLoopingLine={isLoopingLine}
            onPlayPauseToggle={handlePlayPause}
            onSeek={handleSeek}
            onPreviousCue={handlePreviousCue}
            onNextCue={handleNextCue}
            onToggleLoop={handleToggleLoop}
            onChangeSpeed={handleChangeSpeed}
            onSkipSeconds={handleSkipSeconds}
          />
        </View>
      </View>

      {/* Modal de Tradução e Fonética com DeepL */}
      <WordTranslationModal
        visible={modalVisible}
        loading={loadingWord}
        wordDetails={activeWordDetails}
        isSaved={isCurrentWordSaved}
        onClose={() => setModalVisible(false)}
        onToggleSave={handleToggleSaveWord}
      />
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
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleGroup: {
    flex: 1,
  },
  subTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  subSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  transcriptButton: {
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 10,
  },
  centerDisplay: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  noSubContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  noSubTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  noSubDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  goHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  goHomeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
