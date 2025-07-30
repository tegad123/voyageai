import axios from 'axios';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

// Dynamically derive the LAN IP that the app is loaded from so you don't have
// to hard-code a new address every time Wi-Fi / hotspot changes.
// • In Expo Go / dev builds, `Constants.manifest?.debuggerHost` (SDK <= 48) or
//   `Constants.expoConfig?.hostUri` (SDK 49+) contains something like
//   "192.168.0.42:19000" – we grab the ip part and tack ":3001".
// • If those aren't available (e.g. production build) we fall back to
//   localhost (works for emulators).  You can still override via
//   ENV var EXPO_PUBLIC_API_BASE.

const resolvedHost =
  // 1️⃣ Expo SDK 49+
  (Constants.expoConfig?.hostUri as string | undefined)?.split(':')[0] ||
  // 2️⃣ Expo SDK ≤ 48
  (Constants.manifest as any)?.debuggerHost?.split(':')[0] ||
  // 3️⃣ Manual override set at build time
  process.env.EXPO_PUBLIC_API_HOST ||
  // 4️⃣ Fallback
  'localhost';

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase || `http://${resolvedHost}:3001`;

console.log('API Base URL:', API_BASE);

const instance = axios.create({
  baseURL: API_BASE,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Constants.expoConfig?.extra?.openAiKey}`,
  },
});

// Development logging
if (__DEV__) {
  instance.interceptors.request.use(request => {
    console.log(`[REQ] ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`);
    console.log('[REQ] Headers:', request.headers);
    console.log('➡️ Sending auth token:', request.headers['Authorization']);
    return request;
  });

  instance.interceptors.response.use(
    response => {
      console.log(`[RES] ${response.status} ${response.config.url}`);
      return response;
    },
    error => {
      if (error.code === 'ECONNABORTED') {
        Toast.show({
          type: 'error',
          text1: 'Request Timeout',
          text2: 'The server took too long to respond. Please try again.',
        });
      } else if (error.response?.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Invalid or missing API key',
        });
      } else if (!error.response) {
        Toast.show({
          type: 'error',
          text1: 'Network Error',
          text2: 'Could not connect to the server. Please check your connection.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message,
        });
      }
      console.log('[ERR]', error.message, error?.response?.data);
      return Promise.reject(error);
    }
  );
}

// Error handling
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 500) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'Something went wrong. Please try again later.'
      });
      Sentry.captureException(error);
    }
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  response => {
    console.log('📥 [CHAT RES]', response.status, response.data);
    return response;
  },
  error => {
    console.error('📤 [CHAT ERR RESP]', error.response?.status, error.response?.data, error.message);
    return Promise.reject(error);
  }
);

instance.interceptors.request.use(req => {
  const url = (req.baseURL || '') + (req.url || '');
  console.log('📤 [CHAT REQ]', url, req.data);
  return req;
});

export default instance; 