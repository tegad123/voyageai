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
      bundleIdentifier: process.env.IOS_BUNDLE_ID || 'com.example.voyageai'
    },
    android: {
      package: process.env.ANDROID_PACKAGE || 'com.example.voyageai',
      adaptiveIcon: {
        backgroundColor: '#121212'
      }
    },
    extra: {
      openAiKey: process.env.OPENAI_API_KEY,
      googlePlacesKey: process.env.GOOGLE_PLACES_KEY,
      apiHost: process.env.EXPO_PUBLIC_API_HOST,
      apiBase: process.env.EXPO_PUBLIC_API_BASE,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || ''
      }
    }
  }
}; 