import 'react-native-gesture-handler'; // must be first
import React, { useEffect } from 'react';
import { enableScreens } from 'react-native-screens';
import { Slot } from 'expo-router';
import { ChatSessionProvider } from '../context/ChatSessionContext';
import { ItineraryProvider } from '../context/ItineraryContext';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState } from 'react-native';
import { flushFeedbackQueue } from '../src/features/feedback/queue';

// enable screens once
enableScreens();

export default function RootLayout() {
  console.log('=== [app/_layout.tsx] RootLayout component loaded ===');

  useEffect(() => {
    const flush = () => { flushFeedbackQueue().catch(() => {}); };
    const t = setTimeout(flush, 300);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') flush(); });
    return () => { clearTimeout(t); sub.remove(); };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <ChatSessionProvider>
            <ItineraryProvider>
              <Slot />
            </ItineraryProvider>
          </ChatSessionProvider>
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
} 