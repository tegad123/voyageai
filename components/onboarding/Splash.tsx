import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plane } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const planeAnim = useRef(new Animated.Value(-width)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const cloudAnim1 = useRef(new Animated.Value(-100)).current;
  const cloudAnim2 = useRef(new Animated.Value(-150)).current;
  const cloudAnim3 = useRef(new Animated.Value(-200)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.parallel([
        Animated.timing(cloudAnim1, {
          toValue: width + 100,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(cloudAnim2, {
          toValue: width + 150,
          duration: 20000,
          useNativeDriver: true,
        }),
        Animated.timing(cloudAnim3, {
          toValue: width + 200,
          duration: 18000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(planeAnim, {
        toValue: width + 100,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 1500);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#1a0f2e', '#5e2d79', '#c44569', '#f39c6b', '#ffd56b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.cloud, { transform: [{ translateX: cloudAnim1 }], top: 100 }]}>
        <Text style={styles.cloudText}>☁️</Text>
      </Animated.View>
      <Animated.View style={[styles.cloud, { transform: [{ translateX: cloudAnim2 }], top: 200 }]}>
        <Text style={styles.cloudText}>☁️</Text>
      </Animated.View>
      <Animated.View style={[styles.cloud, { transform: [{ translateX: cloudAnim3 }], top: 150 }]}>
        <Text style={styles.cloudText}>☁️</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={[styles.logoContainer, { transform: [{ rotate }] }]}>
          <Image
            source={require('../../assets/images/Resizedlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.appName}>Voya AI</Text>
        <Text style={styles.tagline}>Shoqëruesi Juaj Inteligjent i Udhëtimit</Text>

        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={onComplete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F0F0F0']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Filloni</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.planeContainer,
          {
            transform: [{ translateX: planeAnim }, { rotate: '-15deg' }],
          },
        ]}
      >
        <Plane size={40} color="#FFFFFF" strokeWidth={2} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 150,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 60,
    opacity: 0.9,
  },
  planeContainer: {
    position: 'absolute',
    top: height * 0.3,
    left: 0,
  },
  cloud: {
    position: 'absolute',
    zIndex: 1,
  },
  cloudText: {
    fontSize: 60,
    opacity: 0.4,
  },
  buttonContainer: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});
