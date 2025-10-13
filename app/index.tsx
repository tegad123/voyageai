import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading, hasSeenOnboarding } = useAuth();

  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6B5B95" />
      </View>
    );
  }

  // If user is logged in, go to main app
  if (user) {
    return <Redirect href="/tabs" />;
  }

  // If user hasn't seen onboarding, show onboarding
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Otherwise, show login
  return <Redirect href="/login" />;
}
