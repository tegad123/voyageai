import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Splash from '../components/onboarding/Splash';
import MainApp from '../components/onboarding/MainApp';

export default function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'loader' | 'main'>('splash');
  const [dotAnimations] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]);

  const handleSplashComplete = () => {
    setCurrentScreen('loader');
  };

  const handleLoaderComplete = () => {
    setCurrentScreen('main');
  };

  const handleOnboardingComplete = () => {
    try {
      router.push('/login');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Animate dots in loader
  useEffect(() => {
    if (currentScreen === 'loader') {
      const animateDots = () => {
        Animated.sequence([
          Animated.timing(dotAnimations[0], { toValue: -8, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnimations[0], { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnimations[1], { toValue: -8, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnimations[1], { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnimations[2], { toValue: -8, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnimations[2], { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => animateDots());
      };
      animateDots();

      const timer = setTimeout(handleLoaderComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, dotAnimations]);
  
  if (currentScreen === 'splash') {
    return <Splash onComplete={handleSplashComplete} duration={2000} />;
  }
  
  if (currentScreen === 'loader') {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#E6E6FA']}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.logoText}>✈️</Text>
          <Text style={styles.appName}>Voyage AI</Text>
          
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { transform: [{ translateY: dotAnimations[0] }] }]} />
            <Animated.View style={[styles.dot, { transform: [{ translateY: dotAnimations[1] }] }]} />
            <Animated.View style={[styles.dot, { transform: [{ translateY: dotAnimations[2] }] }]} />
          </View>
          
          <Text style={styles.loadingText}>Setting up your journey...</Text>
        </View>
      </LinearGradient>
    );
  }
  
  return <MainApp onRestart={handleOnboardingComplete} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B5B95',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B5B95',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B5B95',
    textAlign: 'center',
  },
}); 