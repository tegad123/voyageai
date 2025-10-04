import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
// @ts-ignore – the module is available at runtime via Expo
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Logo from './Logo';
import { useLanguage } from '../../context/LanguageContext';

// Import Firebase auth using REST API
console.log('=== ABOUT TO IMPORT Firebase auth ===');
import { auth } from '../../lib/firebase';
console.log('=== Firebase auth imported:', auth);

interface LoginProps {
  onComplete: () => void;
}

const Login: React.FC<LoginProps> = ({ onComplete }) => {
  console.log('=== Login component rendering ===');
  
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    // Configure Google Sign-In
    // TODO: Replace with your actual Google OAuth client IDs from Firebase Console
    // 1. Go to Firebase Console > Authentication > Sign-in method > Google
    // 2. Enable Google sign-in and get the Web client ID
    // 3. For iOS: Get the iOS client ID from the same page
    // 4. For Android: The android client ID is automatically configured via google-services.json
    const configureGoogleSignIn = async () => {
      try {
        await GoogleSignin.configure({
          webClientId: '752889489358-jt5k4art15l82aan1ti4qmi40p8mu92t.apps.googleusercontent.com',
          iosClientId: '752889489358-psvv1a4p8imksbn2vjvs840p904609fj.apps.googleusercontent.com', // Fixed format
          scopes: ['email', 'profile'],
          offlineAccess: false,
        });
        console.log('Google Sign-In configured successfully');
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
      }
    };
    
    configureGoogleSignIn();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert(t('Error'), t('Please fill in all required fields'));
      return;
    }
    if (isSignUp && !formData.name) {
      Alert.alert(t('Error'), t('Please enter your full name'));
      return;
    }
    
    console.log('=== Starting authentication ===');
    console.log('=== Auth object:', auth);
    console.log('=== Form data:', formData);
    
    setLoading(true);
    try {
      if (isSignUp) {
        console.log('=== Creating user account ===');
        const result = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        console.log('=== User created successfully:', result);
      } else {
        console.log('=== Signing in user ===');
        const result = await auth.signInWithEmailAndPassword(formData.email, formData.password);
        console.log('=== User signed in successfully:', result);
      }
      console.log('=== Authentication successful, calling onComplete ===');
      onComplete();
    } catch (error: any) {
      console.log('=== Authentication error:', error);
      console.log('=== Error message:', error.message);
      console.log('=== Error code:', error.code);
      Alert.alert(t('Authentication Error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('Google');
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices();
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Sign in with Firebase using the Google ID token
      console.log('=== Signing in with Google token ===');
      await auth.signInWithGoogle(idToken);
      
      console.log('=== Google sign-in successful ===');
      onComplete();
    } catch (error: any) {
      console.log('=== Google sign-in error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        console.log('User cancelled Google sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        Alert.alert(t('Error'), 'Sign-in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        Alert.alert(t('Error'), 'Google Play Services not available');
      } else {
        // Some other error happened
        Alert.alert(t('Authentication Error'), error.message || 'Google sign-in failed');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('Apple');
    try {
      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('Error'), 'Apple Sign-In is not available on this device');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential received:', credential);

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Sign in with Firebase using the Apple identity token
      console.log('=== Signing in with Apple token ===');
      await auth.signInWithApple(credential.identityToken, credential.authorizationCode || '');
      
      console.log('=== Apple sign-in successful ===');
      onComplete();
    } catch (error: any) {
      console.log('=== Apple sign-in error:', error);
      
      if (error.code === 'ERR_CANCELED') {
        // User cancelled the login flow
        console.log('User cancelled Apple sign-in');
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        Alert.alert(t('Authentication Error'), 'Invalid response from Apple. Please try again.');
      } else if (error.code === 'ERR_REQUEST_FAILED') {
        Alert.alert(t('Authentication Error'), 'Apple Sign-In request failed. Please try again.');
      } else {
        Alert.alert(t('Authentication Error'), error.message || t('Apple sign-in failed'));
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={['#FFFFFF', '#E6E6FA']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.header}>
            <Logo size={80} />
            <Text style={styles.title}>
              {isSignUp ? t('Create your account') : t('Welcome back')}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp ? t('Start your journey with Voyage AI') : t('Sign in to continue your adventure')}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('Full Name')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('Enter your full name')}
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('Email Address')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter your email')}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('Phone Number')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('Enter your phone number')}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('Password')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter your password')}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              <LinearGradient
                colors={['#8E7CC3', '#6B5B95']}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size={32} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? t('Create Account') : t('Sign In')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('Or continue with')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialButton, socialLoading === 'Google' && styles.socialButtonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'Google' ? (
                  <ActivityIndicator size="small" color="#6B5B95" />
                ) : (
                  <Ionicons name="logo-google" size={20} color="#6B5B95" />
                )}
                <Text style={styles.socialButtonText}>{t('Google')}</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={[styles.socialButton, styles.appleButton, socialLoading === 'Apple' && styles.socialButtonDisabled]}
                  onPress={handleAppleSignIn}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'Apple' ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Ionicons name="logo-apple" size={20} color="#000" />
                  )}
                  <Text style={[styles.socialButtonText, { color: '#000' }]}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp ? t('Already have an account? Sign in') : t("Don't have an account? Sign up")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    paddingBottom: 100, // Extra padding at bottom for keyboard
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#121212',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 12,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B5B95',
    marginLeft: 8,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#6B5B95',
    fontWeight: '500',
  },
});

export default Login; 