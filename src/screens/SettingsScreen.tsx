import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { UserSettings } from '../types';
import { getSettings, saveSettings } from '../storage/asyncStorage';
import { translateText } from '../services/translationService';
import { speakEnglish } from '../services/speechService';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettingsState] = useState<UserSettings | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettingsState(s);
    setApiKeyInput(s.deepLApiKey || '');
  };

  const handleSaveApiKey = async () => {
    if (!settings) return;
    const updated = await saveSettings({
      deepLApiKey: apiKeyInput.trim(),
    });
    setSettingsState(updated);
    Alert.alert('Sucesso', 'Chave da API DeepL salva com sucesso!');
  };

  const handleTestDeepL = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Aviso', 'Insira uma chave da API DeepL para testar.');
      return;
    }

    setTestingKey(true);
    setTestResult(null);

    try {
      const res = await translateText('Hello, world! Welcome to ReadSub.', 'PT', apiKeyInput.trim());
      if (res.source === 'deepl') {
        setTestResult(`✅ Sucesso (DeepL): "${res.translatedText}"`);
      } else {
        setTestResult(`⚠️ Resposta via fallback (${res.source}): "${res.translatedText}"`);
      }
    } catch (e: any) {
      setTestResult(`❌ Erro: ${e.message || 'Falha ao conectar com DeepL'}`);
    } finally {
      setTestingKey(false);
    }
  };

  const handleToggleAutoPause = async (val: boolean) => {
    if (!settings) return;
    const updated = await saveSettings({ autoPauseOnWordClick: val });
    setSettingsState(updated);
  };

  const handleTtsRateChange = async (val: number) => {
    if (!settings) return;
    const rounded = Math.round(val * 10) / 10;
    const updated = await saveSettings({ ttsRate: rounded });
    setSettingsState(updated);
  };

  const handleTestTts = () => {
    speakEnglish('Hello! This is how the audio pronunciation sounds in ReadSub.', {
      rate: settings?.ttsRate || 0.9,
      pitch: settings?.ttsPitch || 1.0,
    });
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Configurações</Text>
          <Text style={styles.subtitleCount}>Personalize traduções, voz e player</Text>
        </View>

        {/* Bloco DeepL API */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="language" size={20} color="#60A5FA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>API do DeepL</Text>
              <Text style={styles.sectionSub}>Tradução neural de alta precisão</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Chave de Autenticação (DeepL Auth Key):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.keyInput}
              placeholder="ex: 12345678-abcd-...:fx"
              placeholderTextColor="#64748B"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowKey(!showKey)}
            >
              <Ionicons
                name={showKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.apiActionsRow}>
            <TouchableOpacity style={styles.saveKeyBtn} onPress={handleSaveApiKey}>
              <Text style={styles.saveKeyBtnText}>Salvar Chave</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testKeyBtn}
              onPress={handleTestDeepL}
              disabled={testingKey}
            >
              {testingKey ? (
                <ActivityIndicator size="small" color="#60A5FA" />
              ) : (
                <Text style={styles.testKeyBtnText}>Testar Conexão</Text>
              )}
            </TouchableOpacity>
          </View>

          {testResult ? (
            <View style={styles.testResultBox}>
              <Text style={styles.testResultText}>{testResult}</Text>
            </View>
          ) : null}

          <View style={styles.infoTipBox}>
            <Ionicons name="information-circle-outline" size={16} color="#60A5FA" />
            <Text style={styles.infoTipText}>
              O ReadSub possui sistema híbrido: mesmo sem chave DeepL, o app funciona perfeitamente utilizando serviços de tradução e dicionários públicos com cache offline!
            </Text>
          </View>
        </View>

        {/* Bloco Síntese de Voz (TTS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <Ionicons name="volume-high" size={20} color="#34D399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Pronúncia & Áudio (TTS)</Text>
              <Text style={styles.sectionSub}>Velocidade da voz em inglês</Text>
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Velocidade da fala: {settings.ttsRate}x</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={1.3}
              step={0.1}
              value={settings.ttsRate}
              onValueChange={handleTtsRateChange}
              minimumTrackTintColor="#34D399"
              maximumTrackTintColor="#334155"
              thumbTintColor="#34D399"
            />
          </View>

          <TouchableOpacity style={styles.testTtsBtn} onPress={handleTestTts}>
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.testTtsBtnText}>Ouvir Teste de Pronúncia</Text>
          </TouchableOpacity>
        </View>

        {/* Bloco Preferências do Player */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="options-outline" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Comportamento do Player</Text>
              <Text style={styles.sectionSub}>Ajustes de navegação e pausa</Text>
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchLabel}>Pausar ao tocar na palavra</Text>
              <Text style={styles.switchDesc}>
                Pausa a reprodução da legenda automaticamente ao abrir o modal de tradução.
              </Text>
            </View>
            <Switch
              value={settings.autoPauseOnWordClick}
              onValueChange={handleToggleAutoAutoPause => handleToggleAutoPause(handleToggleAutoAutoPause)}
              trackColor={{ false: '#334155', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Informações Acadêmicas do Projeto */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>ReadSub — Projeto Final Lab 3</Text>
          <Text style={styles.aboutText}>
            IFBA — Instituto Federal da Bahia • Semestre 2026.1{'\n'}
            Desenvolvido com React Native, Expo, DeepL API, Free Dictionary API & AsyncStorage.
          </Text>
          <Text style={styles.versionText}>Versão 1.0.0 (Entrega Final)</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginBottom: 16,
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
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  keyInput: {
    flex: 1,
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  eyeBtn: {
    padding: 10,
  },
  apiActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  saveKeyBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveKeyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  testKeyBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  testKeyBtnText: {
    color: '#60A5FA',
    fontWeight: '700',
    fontSize: 13,
  },
  testResultBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  testResultText: {
    color: '#F8FAFC',
    fontSize: 12,
  },
  infoTipBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoTipText: {
    flex: 1,
    color: '#93C5FD',
    fontSize: 11,
    lineHeight: 16,
  },
  sliderRow: {
    marginVertical: 6,
  },
  sliderLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  testTtsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
  },
  testTtsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  switchDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  aboutCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  aboutTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  aboutText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  versionText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
});
