import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

// Auth con persistencia real — la sesión sobrevive cierres de app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db      = getFirestore(app);
export const storage = getStorage(app);