import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, MapPin, Calendar } from 'lucide-react-native';

interface MainFeaturesProps {
  onContinue: () => void;
}

export default function MainFeatures({ onContinue }: MainFeaturesProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.stagger(150, [
        Animated.spring(slideAnim1, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim2, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim3, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => {
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 1000);
  }, []);

  return (
    <LinearGradient
      colors={['#1a0f2e', '#5e2d79', '#c44569', '#f39c6b', '#ffd56b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Animated.View
            style={[
              styles.featureCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim1 }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
              style={styles.cardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Sparkles size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Planifikim i Fuqizuar nga AI</Text>
              <Text style={styles.featureDescription}>
                Lëreni AI-në tonë të krijojë itinerare të personalizuar të përshtatura sipas preferencave tuaja
              </Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.featureCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim2 }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
              style={styles.cardGradient}
            >
              <View style={styles.featureIconContainer}>
                <MapPin size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Destinacione të Mençura</Text>
              <Text style={styles.featureDescription}>
                Zbuloni vende të fshehura dhe pika të njohura të përzgjedhura veçanërisht për ju
              </Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.featureCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim3 }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
              style={styles.cardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Calendar size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Përditësime në Kohë Reale</Text>
              <Text style={styles.featureDescription}>
                Merrni përditësime të drejtpërdrejta për motin, ngjarjet dhe kushtet e udhëtimit
              </Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F0F0F0']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Vazhdoni</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  featureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardGradient: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  featureDescription: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    color: '#7B3FF2',
  },
});

