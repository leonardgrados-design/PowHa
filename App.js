import 'react-native-gesture-handler'; // Obligatorio para evitar crasheos de navegación
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

// Importamos la conexión real a Firebase
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Este observador es el que decide qué pantalla ves.
    // Si tienes sesión guardada, 'currentUser' tendrá datos y saltará al Home.
    // Si cierras sesión, 'currentUser' será null y volverá al Login.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null; // Evita pantallas blancas o parpadeos mientras Firebase revisa la sesión
  }

  return (
    <NavigationContainer>
      <AppNavigator user={user} />
    </NavigationContainer>
  );
}