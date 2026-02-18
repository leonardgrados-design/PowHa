import React, { useState } from 'react';
// Importamos el contenedor maestro de navegación.
// Este componente es vital: maneja el historial de pantallas y el botón "Atrás" de Android.
import { NavigationContainer } from '@react-navigation/native';

// Importamos nuestro "semáforo" de navegación que creamos en la carpeta src/navigation.
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // --- 1. ESTADO GLOBAL (La Memoria de la App) ---
  // Aquí guardamos la información del usuario actual.
  // 'null' significa que nadie ha iniciado sesión todavía.
  const [user, setUser] = useState(null);

  // --- 2. LÓGICA DE NEGOCIO (Acciones) ---
  // Esta función se la pasaremos a la pantalla de Login.
  // Se ejecutará cuando el usuario presione el botón azul de "Iniciar Sesión".
  const handleLogin = (username, email) => {
    console.log("Sesión iniciada para:", email);
    
    // Al actualizar 'user' con datos reales, React volverá a pintar la app.
    // Como 'user' ya no es null, el AppNavigator cambiará automáticamente a la pantalla Home.
    setUser({ name: username || "Gamer", email: email });
  };

  // --- 3. RENDERIZADO (Lo que se ve) ---
  return (
    // NavigationContainer debe ser el "padre" absoluto de toda la navegación.
    // Envuelve a toda la aplicación para gestionar las rutas.
    <NavigationContainer>
      
      {/* AppNavigator es nuestro gestor de pantallas.
         Le pasamos dos "props" (propiedades):
         - user: Para que sepa si mostrarnos el Login o el Home.
         - onLogin: Para que el Login pueda comunicarse con este archivo principal.
      */}
      <AppNavigator user={user} onLogin={handleLogin} />
      
    </NavigationContainer>
  );
}