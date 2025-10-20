import 'dotenv/config';

export default {
  expo: {
    name: 'VoyageAI',
    slug: 'voyageai',
    version: '1.0.2',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'voyageai',
    icon: './assets/images/Resizedlogo.png', 
    splash: {
      backgroundColor: '#FFFFFF'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.IOS_BUNDLE_ID || 'com.jmotech.voyageai',
      buildNumber: '133',
      icon: './assets/images/Resizedlogo.png',
      splash: {
        backgroundColor: '#FFFFFF'
      },
      infoPlist: {
        NSCameraUsageDescription:
          'This app uses the camera to allow you to add photos to your travel itineraries and profile.',
        NSMicrophoneUsageDescription:
          'This app uses the microphone to record audio for videos you may add to your travel itineraries.',
        NSPhotoLibraryUsageDescription:
          'This app needs access to your photo library to let you select images for your profile and travel plans.',
        NSPhotoLibraryAddUsageDescription:
          'This app needs access to save photos to your library, such as images from your itinerary.',
        NSLocationWhenInUseUsageDescription:
          'VoyageAI uses your location to show relevant nearby attractions, restaurants, and activities when planning your trips.',
        ITSAppUsesNonExemptEncryption: false,
      },
      entitlements: {
        'com.apple.developer.applesignin': ['Default']
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
      apiKey: process.env.API_KEY || 'voyageai-secret',
      // Google Places API replaced with MapBox
      // googlePlacesKey: process.env.GOOGLE_PLACES_KEY,
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
      apiHost: process.env.EXPO_PUBLIC_API_HOST,
      apiBase: process.env.EXPO_PUBLIC_API_BASE || 'https://voyageai-backend.onrender.com',
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'e5674cc1-4e4b-4c7e-9c46-5d982bd95da1'
      }
    },
    privacy: 'public',
    _internal: {
      // ... internal config
    },
    plugins: [
      'expo-router',
      '@react-native-google-signin/google-signin',
      'expo-apple-authentication'
    ]
  }
}; 