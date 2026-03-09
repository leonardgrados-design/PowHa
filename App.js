import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

// 1. Importaciones críticas de Firebase
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Este listener es el verdadero motor. 
    // Escucha si Firebase logró iniciar sesión y actualiza el estado global automáticamente.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  console.log("Firebase detectó usuario:", currentUser ? currentUser.uid : "NINGUNO");
  setUser(currentUser);
  setLoading(false);
});

    return unsubscribe;
  }, []);

  // 3. Evita que la pantalla parpadee mientras Firebase revisa si hay una sesión guardada.
  if (loading) {
    return null; 
  }

  return (
    <NavigationContainer>
      {/* 4. Le pasamos el estado real de Firebase al navegador */}
      <AppNavigator user={user} />
    </NavigationContainer>
  );
}