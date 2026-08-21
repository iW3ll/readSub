import * as Speech from 'expo-speech';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  language?: string;
}

/**
 * Reproduz o texto em inglês utilizando o sintetizador nativo (TTS).
 */
export async function speakEnglish(text: string, options: SpeechOptions = {}): Promise<void> {
  if (!text || !text.trim()) return;

  try {
    // Interrompe qualquer áudio anterior antes de iniciar
    await Speech.stop();

    Speech.speak(text.trim(), {
      language: options.language || 'en-US',
      pitch: options.pitch !== undefined ? options.pitch : 1.0,
      rate: options.rate !== undefined ? options.rate : 0.9,
    });
  } catch (error) {
    console.warn('Erro ao reproduzir síntese de voz (TTS):', error);
  }
}

/**
 * Interrompe qualquer fala em andamento.
 */
export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (e) {
    // Ignora
  }
}
