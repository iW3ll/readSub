import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleFile } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { TranscriptScreen } from '../screens/TranscriptScreen';
import { VocabularyScreen } from '../screens/VocabularyScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { getSampleSubtitles } from '../assets/sampleSubtitles';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  // Estado compartilhado da legenda ativa e posição
  const samples = getSampleSubtitles();
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleFile | null>(
    samples.length > 0 ? samples[0] : null
  );

  return (
    <Tab.Navigator
      initialRouteName="Início"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';

          if (route.name === 'Início') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Player') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Transcrição') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Vocabulário') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Flashcards') {
            iconName = focused ? 'albums' : 'albums-outline';
          } else if (route.name === 'Ajustes') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Início">
        {(props) => (
          <HomeScreen
            {...props}
            onSelectSubtitle={(sub) => setCurrentSubtitle(sub)}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Player">
        {(props) => (
          <PlayerScreen
            {...props}
            currentSubtitle={currentSubtitle}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Transcrição">
        {(props) => (
          <TranscriptScreen
            {...props}
            currentSubtitle={currentSubtitle}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Vocabulário" component={VocabularyScreen} />

      <Tab.Screen name="Flashcards" component={FlashcardsScreen} />

      <Tab.Screen name="Ajustes" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
