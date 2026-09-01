import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleFile } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { TranscriptScreen } from '../screens/TranscriptScreen';
import { VocabularyScreen } from '../screens/VocabularyScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { getSampleSubtitles } from '../assets/sampleSubtitles';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs: React.FC = () => {
  // Estado compartilhado da legenda ativa
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
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
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

      <Tab.Screen name="Perfil" component={ProfileScreen} />

      <Tab.Screen name="Ajustes" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};
