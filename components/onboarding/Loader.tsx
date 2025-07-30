import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from './Logo';

interface LoaderProps {
  onComplete: () => void;
  duration?: number;
}

const Loader: React.FC<LoaderProps> = ({ onComplete, duration = 1500 }) => {
  const bounceAnim = new Animated.Value(0);
  const dot1Anim = new Animated.Value(0);
  const dot2Anim = new Animated.Value(0);
  const dot3Anim = new Animated.Value(0);

  useEffect(() => {
    // Logo bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dot animations
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1Anim, { toValue: -8, duration: 200, useNativeDriver: true }),
        Animated.timing(dot1Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(dot2Anim, { toValue: -8, duration: 200, useNativeDriver: true }),
        Animated.timing(dot2Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(dot3Anim, { toValue: -8, duration: 200, useNativeDriver: true }),
        Animated.timing(dot3Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => animateDots());
    };
    animateDots();

    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#E6E6FA']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ translateY: bounceAnim }] }]}>
          <Logo size={100} />
        </Animated.View>
        
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot1Anim }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot2Anim }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot3Anim }] }]} />
        </View>
        
        <Text style={styles.loadingText}>Setting up your journey...</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
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

export default Loader; 