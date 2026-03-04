// Importamos las funciones necesarias del SDK de Firebase v9+
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// PEGA AQUÍ LOS DATOS QUE TE DIO LA CONSOLA DE FIREBASE EN EL PASO 1
// NUNCA subas estos datos a un repositorio público (GitHub) sin usar variables de entorno (.env).
// Por ahora, para desarrollo local, ponlos directamente aquí.
const firebaseConfig = {
  apiKey: "AIzaSyBhLVBNoyqu68yRpO5W7IQU1E2fxcOlqXk",
  authDomain: "trackly-c0023.firebaseapp.com",
  projectId: "trackly-c0023",
  storageBucket: "trackly-c0023.firebasestorage.app",
  messagingSenderId: "71512454186",
  appId: "1:71512454186:web:eea5a209688dc53e51ff53",
  measurementId: "G-6XC531FPMP"
};

// Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Exportamos los servicios de Autenticación y Base de Datos (Firestore)
// Esto es lo que importaremos en LoginScreen y HomeScreen
export const auth = getAuth(app);
export const db = getFirestore(app);