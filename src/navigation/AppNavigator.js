import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

// Creamos el objeto Stack (la pila de cartas/pantallas)
const Stack = createStackNavigator();

export default function AppNavigator({ user, onLogin }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // --- ZONA PRIVADA (Si hay usuario) ---
        // Al poner esto aquí, si hay usuario, la pantalla "Login" NO EXISTE para el router.
        // Esto es seguridad básica: no pueden volver atrás al login.
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        // --- ZONA PÚBLICA (Si no hay usuario) ---
        <Stack.Screen name="Login">
          {/* Usamos este truco para pasarle la función onLogin a la pantalla */}
          {(props) => <LoginScreen {...props} onLogin={onLogin} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}