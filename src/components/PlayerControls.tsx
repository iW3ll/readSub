import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { msToFormattedTime } from '../services/srtParser';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  playbackSpeed: number;
  isLoopingLine: boolean;
  onPlayPauseToggle: () => void;
  onSeek: (targetMs: number) => void;
  onPreviousCue: () => void;
  onNextCue: () => void;
  onToggleLoop: () => void;
  onChangeSpeed: () => void;
  onSkipSeconds: (seconds: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTimeMs,
  durationMs,
  playbackSpeed,
  isLoopingLine,
  onPlayPauseToggle,
  onSeek,
  onPreviousCue,
  onNextCue,
  onToggleLoop,
  onChangeSpeed,
  onSkipSeconds,
}) => {
  const safeDuration = durationMs > 0 ? durationMs : 1000;
  const currentRatio = Math.min(Math.max(currentTimeMs, 0), safeDuration);

  return (
    <View style={styles.container}>
      {/* Barra de Progresso / Slider */}
      <View style={styles.sliderSection}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={safeDuration}
          value={currentRatio}
          onSlidingComplete={onSeek}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#334155"
          thumbTintColor="#60A5FA"
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{msToFormattedTime(currentTimeMs)}</Text>
          <Text style={styles.timeText}>{msToFormattedTime(durationMs)}</Text>
        </View>
      </View>

      {/* Controles Principais */}
      <View style={styles.mainControlsRow}>
        {/* Velocidade de Reprodução */}
        <TouchableOpacity
          style={styles.auxButton}
          onPress={onChangeSpeed}
          accessibilityLabel="Alterar velocidade"
        >
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>

        {/* Voltar 5 segundos */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => onSkipSeconds(-5)}
          accessibilityLabel="Voltar 5 segundos"
        >
          <Ionicons name="play-back-outline" size={22} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Fala Anterior */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onPreviousCue}
          accessibilityLabel="Fala anterior"
        >
          <Ionicons name="play-skip-back" size={22} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Play / Pause Principal */}
        <TouchableOpacity
          style={[styles.playPauseButton, isPlaying && styles.playingState]}
          onPress={onPlayPauseToggle}
          activeOpacity={0.8}
          accessibilityLabel={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color="#FFFFFF"
            style={isPlaying ? {} : { marginLeft: 3 }}
          />
        </TouchableOpacity>

        {/* Próxima Fala */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onNextCue}
          accessibilityLabel="Próxima fala"
        >
          <Ionicons name="play-skip-forward" size={22} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Avançar 5 segundos */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => onSkipSeconds(5)}
          accessibilityLabel="Avançar 5 segundos"
        >
          <Ionicons name="play-forward-outline" size={22} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Repetir Linha (Loop) */}
        <TouchableOpacity
          style={[styles.auxButton, isLoopingLine && styles.activeLoopButton]}
          onPress={onToggleLoop}
          accessibilityLabel="Repetir fala atual em loop"
        >
          <Ionicons
            name="repeat"
            size={18}
            color={isLoopingLine ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sliderSection: {
    width: '100%',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  mainControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  playPauseButton: {
    backgroundColor: '#3B82F6',
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  playingState: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auxButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeLoopButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  speedText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
});
