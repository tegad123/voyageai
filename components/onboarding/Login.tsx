import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Logo from './Logo';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

// Lazy imports to prevent startup crashes
let supabaseClient: any = null;
let GoogleSignin: any = null;
let AppleAuthentication: any = null;
let statusCodes: any = null;
let modulesInitialized = false;
let modulesInitializing: Promise<void> | null = null;
let moduleInitQueue: (() => void)[] = [];
let isModuleInitPendingFlush = false;

function enqueueModuleInit(fn: () => void) {
  moduleInitQueue.push(fn);
  if (!isModuleInitPendingFlush) {
    isModuleInitPendingFlush = true;
    setTimeout(() => {
      isModuleInitPendingFlush = false;
      const queue = [...moduleInitQueue];
      moduleInitQueue = [];
      queue.forEach((cb) => cb());
    }, 0);
  }
}

async function ensureModulesLoaded() {
  if (modulesInitialized) return;
  if (modulesInitializing) {
    await modulesInitializing;
    return;
  }

  modulesInitializing = (async () => {
    try {
      console.log('[LOGIN] Ensuring modules are loaded...');

      // Load Supabase
      try {
        const { getSupabase } = await import('../../lib/supabase');
        supabaseClient = getSupabase();
        console.log('[LOGIN] Supabase loaded');
      } catch (err) {
        console.error('[LOGIN] Failed to load Supabase:', err);
      }

      // Load Google Sign-In
      try {
        const googleModule = await import('@react-native-google-signin/google-signin');
        GoogleSignin = googleModule.GoogleSignin;
        statusCodes = googleModule.statusCodes;

        if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
          await GoogleSignin.configure({
            webClientId: '824179274204-5dardlt2fn443pcrh73a1j2jlfm9qkq.apps.googleusercontent.com',
            iosClientId: '752889489358-bmqnb6mfha7qbkfnfd2trfp4i7fq27jd.apps.googleusercontent.com',
            scopes: ['email', 'profile'],
            offlineAccess: false,
          });
          console.log('[LOGIN] Google Sign-In configured');
        }
      } catch (err) {
        console.error('[LOGIN] Failed to load Google Sign-In:', err);
      }

      // Load Apple Authentication
      try {
        AppleAuthentication = await import('expo-apple-authentication');
        console.log('[LOGIN] Apple Authentication loaded');
      } catch (err) {
        console.error('[LOGIN] Failed to load Apple Authentication:', err);
      }

      modulesInitialized = true;
      console.log('[LOGIN] Module initialization complete');
    } catch (error: any) {
      console.error('[LOGIN] Error initializing modules:', error);
    } finally {
      modulesInitializing = null;
    }
  })();

  await modulesInitializing;
}

interface LoginProps {
  onComplete: () => void;
}

const Login: React.FC<LoginProps> = ({ onComplete }) => {
  console.log('=== Login component rendering ===');
  
  const { t } = useLanguage();
  const { signIn: saveUserAuth } = useAuth();
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

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    await ensureModulesLoaded();
    if (!formData.email || !formData.password) {
      Alert.alert(t('Error'), t('Please fill in all required fields'));
      return;
    }
    if (isSignUp && !formData.name) {
      Alert.alert(t('Error'), t('Please enter your full name'));
      return;
    }
    
    if (!supabaseClient) {
      Alert.alert(t('Error'), 'Authentication service not available');
      return;
    }
    
    console.log('=== Starting authentication (Supabase) ===');
    console.log('=== Form data:', { email: formData.email, hasName: !!formData.name });
    
    setLoading(true);
    try {
      let userEmail = formData.email;
      let userId = '';
      if (isSignUp) {
        console.log('=== Supabase signUp ===');
        const { data, error } = await supabaseClient.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name, phone: formData.phone },
          },
        });
        if (error) throw error;
        userId = data.user?.id || '';
        userEmail = data.user?.email || userEmail;
        console.log('=== Supabase user created ===', { userId, userEmail });
      } else {
        console.log('=== Supabase signInWithPassword ===');
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        userId = data.user?.id || '';
        userEmail = data.user?.email || userEmail;
        console.log('=== Supabase user signed in ===', { userId, userEmail });
      }
      
      // Save user data to AsyncStorage
      await saveUserAuth({
        uid: userId,
        email: userEmail,
        displayName: formData.name || userEmail?.split('@')[0] || 'User',
      });
      
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
    await ensureModulesLoaded();
    if (!GoogleSignin || !supabaseClient) {
      Alert.alert(t('Error'), t('Google sign-in not available'));
      return;
    }
    
    console.log('[GOOGLE_SIGNIN] Starting Google Sign-In process');
    setSocialLoading('Google');
    try {
      // First check if Google Play Services are available (Android)
      if (Platform.OS === 'android') {
        console.log('[GOOGLE_SIGNIN] Checking Play Services (Android)');
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      
      // Check if user is already signed in and sign out first to avoid conflicts
      console.log('[GOOGLE_SIGNIN] Checking current sign-in status');
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          console.log('[GOOGLE_SIGNIN] Already signed in, signing out first');
          await GoogleSignin.signOut();
        }
      } catch (e) {
        console.log('[GOOGLE_SIGNIN] No current user');
      }
      
      // Get the users ID token
      console.log('[GOOGLE_SIGNIN] Initiating Google Sign-In flow');
      const userInfo = await GoogleSignin.signIn();
      console.log('[GOOGLE_SIGNIN] Sign-In successful, userInfo keys:', Object.keys(userInfo || {}));

      let idToken: string | undefined = (userInfo as any)?.idToken;
      if (!idToken) {
        // Fallback for some environments
        console.log('[GOOGLE_SIGNIN] No idToken on signIn result, attempting getTokens() fallback');
        const tokens = await GoogleSignin.getTokens();
        idToken = (tokens as any)?.idToken;
      }
      if (!idToken) throw new Error('No ID token received from Google');

      // Sign in with Supabase using the Google ID token
      console.log('[GOOGLE_SIGNIN] Authenticating with Supabase');
      const { data, error } = await supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
      
      // Save user data to AsyncStorage
      await saveUserAuth({
        uid: data.user?.id || '',
        email: data.user?.email || '',
        displayName: data.user?.email?.split('@')[0] || 'User',
      });
      
      console.log('[GOOGLE_SIGNIN] Supabase authentication successful');
      onComplete();
    } catch (error: any) {
      console.error('[GOOGLE_SIGNIN] Error occurred:', {
        message: error.message,
        code: error.code,
        error: error,
      });
      
      let errorMessage = t('Google sign-in failed');
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign-in was cancelled';
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        errorMessage = t('Sign-in already in progress');
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = t('Google Play Services not available');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('Authentication Error'), errorMessage);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    await ensureModulesLoaded();
    if (!AppleAuthentication || !supabaseClient) {
      Alert.alert(t('Error'), t('Apple Sign-In not available'));
      return;
    }
    
    setSocialLoading('Apple');
    try {
      console.log('=== Starting Apple Sign-In ===');
      
      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('Apple Sign-In available:', isAvailable);
      
      if (!isAvailable) {
        Alert.alert(t('Error'), t('Apple Sign-In is not available on this device'));
        return;
      }

      console.log('=== Requesting Apple credential ===');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('=== Apple credential received ===', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: !!credential.identityToken,
        authorizationCode: !!credential.authorizationCode,
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Sign in with Supabase using the Apple identity token
      console.log('=== Signing in with Apple token (Supabase) ===');
      const { data, error } = await supabaseClient.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });
      if (error) throw error;
      
      // Save user data to AsyncStorage
      await saveUserAuth({
        uid: data.user?.id || '',
        email: data.user?.email || credential.email || 'user@apple.com',
        displayName: credential.fullName ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : 'User',
      });
      
      console.log('=== Apple sign-in successful ===');
      onComplete();
    } catch (error: any) {
      console.log('=== Apple sign-in error ===', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'ERR_CANCELED') {
        // User cancelled the login flow
        console.log('User cancelled Apple sign-in');
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        Alert.alert(t('Authentication Error'), t('Invalid response from Apple. Please try again.'));
      } else if (error.code === 'ERR_REQUEST_FAILED') {
        Alert.alert(t('Authentication Error'), t('Apple Sign-In request failed. Please try again.'));
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
              {isSignUp ? t('Start your journey with Skoya AI') : t('Sign in to continue your adventure')}
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

            {/* TEMPORARILY DISABLED - Google and Apple Sign-In
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
            */}

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