import 'dotenv/config';

export default {
  expo: {
    name: 'VoyageAI',
    slug: 'voyageai',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'voyageai',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.IOS_BUNDLE_ID || 'com.jmotech.voyageai',
      buildNumber: '4',
      infoPlist: {
        NSCameraUsageDescription:
          'This app uses the camera to allow you to add photos to your travel itineraries and profile.',
        NSMicrophoneUsageDescription:
          'This app uses the microphone to record audio for videos you may add to your travel itineraries.',
      },
    },
    android: {
      package: process.env.ANDROID_PACKAGE || 'com.example.voyageai',
      adaptiveIcon: {
        backgroundColor: '#121212'
      }
    },
    extra: {
      openAiKey: process.env.OPENAI_API_KEY,
      apiKey: process.env.API_KEY,
      googlePlacesKey: process.env.GOOGLE_PLACES_KEY,
      apiHost: process.env.EXPO_PUBLIC_API_HOST,
      apiBase: process.env.EXPO_PUBLIC_API_BASE,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || ''
      }
    }
  }
}; 