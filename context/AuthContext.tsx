import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = 'voyageAI.user';
const ONBOARDING_STORAGE_KEY = 'voyageAI.hasSeenOnboarding';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Load user and onboarding status on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      console.log('[AUTH_CONTEXT] Loading auth state...');
      
      const [savedUser, savedOnboarding] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY).catch(err => {
          console.error('[AUTH_CONTEXT] Error loading user:', err);
          return null;
        }),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).catch(err => {
          console.error('[AUTH_CONTEXT] Error loading onboarding:', err);
          return null;
        }),
      ]);

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          console.log('[AUTH_CONTEXT] User loaded:', parsed.email);
        } catch (parseError) {
          console.error('[AUTH_CONTEXT] Error parsing user data:', parseError);
        }
      }

      if (savedOnboarding === 'true') {
        setHasSeenOnboarding(true);
        console.log('[AUTH_CONTEXT] Onboarding completed');
      } else {
        console.log('[AUTH_CONTEXT] Onboarding not completed');
      }
    } catch (error) {
      console.error('[AUTH_CONTEXT] Error loading auth state:', error);
    } finally {
      setIsLoading(false);
      console.log('[AUTH_CONTEXT] Auth loading complete');
    }
  };

  const signIn = async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasSeenOnboarding,
        signIn,
        signOut,
        updateUser,
        markOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

