import 'react-native-gesture-handler'; // must be first
import React from 'react';
import { enableScreens } from 'react-native-screens';
import { Slot } from 'expo-router';
import { ChatSessionProvider } from '../context/ChatSessionContext';
import { ItineraryProvider } from '../context/ItineraryContext';
import { LanguageProvider } from '../context/LanguageContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// enable screens once
enableScreens();

export default function RootLayout() {
  console.log('=== [app/_layout.tsx] RootLayout component loaded ===');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <ChatSessionProvider>
          <ItineraryProvider>
            <Slot />
          </ItineraryProvider>
        </ChatSessionProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
} 