import React from 'react';
import { router } from 'expo-router';
import Login from '../components/onboarding/Login';

export default function LoginScreen() {
  const handleLoginComplete = () => {
    console.log('=== Login completed, navigating to main app ===');
    router.replace('/tabs');
  };

  return <Login onComplete={handleLoginComplete} />;
} 