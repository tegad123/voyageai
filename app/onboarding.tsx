import React, { useState } from 'react';
import { router } from 'expo-router';
import Splash from '../components/onboarding/Splash';
import MainFeatures from '../components/onboarding/MainFeatures';
import { useAuth } from '../context/AuthContext';

export default function OnboardingScreen() {
  const { markOnboardingComplete } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'features'>('splash');

  const handleSplashComplete = () => {
    console.log('[ONBOARDING] Splash completed, showing features');
    setCurrentScreen('features');
  };

  const handleFeaturesComplete = async () => {
    console.log('[ONBOARDING] Features completed, navigating to login');
    try {
      await markOnboardingComplete();
      router.push('/login');
    } catch (error) {
      console.error('[ONBOARDING] Navigation error:', error);
    }
  };
  
  if (currentScreen === 'splash') {
    return <Splash onComplete={handleSplashComplete} />;
  }
  
  return <MainFeatures onContinue={handleFeaturesComplete} />;
} 