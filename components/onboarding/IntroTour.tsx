import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface IntroTourProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

const IntroTour: React.FC<IntroTourProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: 'location-outline',
      title: "Discover Perfect Destinations",
      subtitle: "AI-powered recommendations tailored to your preferences",
      description: "Let our intelligent system find amazing places that match your travel style, budget, and interests.",
    },
    {
      icon: 'calendar-outline',
      title: "Select Dates & Book Effortlessly",
      subtitle: "Seamless booking with smart date suggestions",
      description: "Our AI optimizes your travel dates for the best prices and weather conditions.",
    },
    {
      icon: 'sparkles-outline',
      title: "Relax & Enjoy Your Voyage",
      subtitle: "Personalized itineraries and 24/7 support",
      description: "Sit back while we handle the details and provide real-time assistance throughout your journey.",
    }
  ];

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#E6E6FA']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                { backgroundColor: index === currentSlide ? '#6B5B95' : '#D1D5DB' }
              ]}
            />
          ))}
        </View>
        
        <View style={styles.spacer} />
      </View>

      {/* Slides */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.slideContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={slide.icon as any} size={64} color="#6B5B95" />
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentSlide === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentSlide === 0 ? '#9CA3AF' : '#6B5B95'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={isLastSlide ? onComplete : () => setCurrentSlide(currentSlide + 1)}
        >
          <LinearGradient
            colors={['#8E7CC3', '#6B5B95']}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
            {!isLastSlide && (
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentSlide === slides.length - 1 && styles.navButtonDisabled]}
          onPress={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={currentSlide === slides.length - 1 ? '#9CA3AF' : '#6B5B95'} 
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#6B5B95',
    fontWeight: '500',
  },
  indicators: {
    flexDirection: 'row',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  spacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B5B95',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  primaryButton: {
    flex: 1,
    marginHorizontal: 16,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default IntroTour; 