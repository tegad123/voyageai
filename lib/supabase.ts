// Supabase client configuration with lazy initialization
// All imports delayed to prevent app startup crashes

const DEFAULT_SUPABASE_URL = 'https://zlrqnqxgmjlqetlvsyog.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscnFucXhnbWpscWV0bHZzeW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwODk0MjIsImV4cCI6MjA3ODY2NTQyMn0.b6Fo0u5-E6uPYbk4WKpr6sKpKSjg_jEpL78maF-Uz60';

let supabaseClientInstance: any = null;
let isInitialized = false;

export function getSupabase() {
  if (isInitialized && supabaseClientInstance) {
    return supabaseClientInstance;
  }

  try {
    console.log('[SUPABASE] Starting initialization...');
    
    // Import polyfills only when needed
    require('react-native-url-polyfill/auto');
    require('react-native-get-random-values');
    
    const { createClient } = require('@supabase/supabase-js');
    
    // Use public Expo env vars (fall back to bundled defaults so TestFlight builds keep working)
    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const SUPABASE_ANON_KEY =
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    
    console.log('[SUPABASE] Creating client with URL:', SUPABASE_URL?.slice(0, 30));
    
    supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        storage: {
          getItem: async (key: string) => {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              return await AsyncStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: async (key: string, value: string) => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem(key, value);
          },
          removeItem: async (key: string) => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.removeItem(key);
          },
        },
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    
    isInitialized = true;
    console.log('[SUPABASE] Client created successfully');
  } catch (error) {
    console.error('[SUPABASE] Failed to initialize:', error);
    // Create minimal fallback client
    try {
      const { createClient } = require('@supabase/supabase-js');
      supabaseClientInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      isInitialized = true;
    } catch (fallbackError) {
      console.error('[SUPABASE] Fallback also failed:', fallbackError);
      // Return a minimal mock object
      supabaseClientInstance = {
        auth: {
          signUp: async () => ({ data: null, error: new Error('Supabase not available') }),
          signInWithPassword: async () => ({ data: null, error: new Error('Supabase not available') }),
          signInWithIdToken: async () => ({ data: null, error: new Error('Supabase not available') }),
        },
      };
      isInitialized = true;
    }
  }

  return supabaseClientInstance;
}

// Named export for direct use
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
};
