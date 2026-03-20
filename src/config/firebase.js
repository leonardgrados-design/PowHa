import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey:            "AIzaSyBhLVBNoyqu68yRpO5W7IQU1E2fxcOlqXk",
  authDomain:        "trackly-c0023.firebaseapp.com",
  projectId:         "trackly-c0023",
  storageBucket:     "trackly-c0023.firebasestorage.app",
  messagingSenderId: "71512454186",
  appId:             "1:71512454186:web:eea5a209688dc53e51ff53",
  measurementId:     "G-6XC531FPMP",
};

const app = initializeApp(firebaseConfig);

// ── Auth: use AsyncStorage persistence on native, default (indexedDB) on web ──
let auth;

if (Platform.OS === 'web') {
  // Web: Firebase handles persistence automatically via indexedDB
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  // Native (iOS/Android): persist session across app restarts
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export { auth };
export const db      = getFirestore(app);
export const storage = getStorage(app);