import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface MainAppProps {
  onRestart: () => void;
}

// This component now navigates to the main app after onboarding completion
const MainApp: React.FC<MainAppProps> = ({ onRestart }) => {
  const handleGetStarted = () => {
    console.log('=== User completed onboarding, navigating to main app ===');
    // Navigate to the main app tabs
    router.replace('/tabs');
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#E6E6FA']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Voyage AI! 🎉</Text>
          <Text style={styles.description}>
            Your AI-powered travel companion is ready to help you discover amazing destinations and create unforgettable experiences.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <LinearGradient
              colors={['#8E7CC3', '#6B5B95']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MainApp; 