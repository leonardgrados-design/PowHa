import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart2, PlusCircle, Bell, User } from 'lucide-react-native';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Pantallas falsas temporales. Si no ponemos esto, el router crasheará
// al intentar navegar a una pestaña que no tiene un componente asignado.
const DummyScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>Pantalla en construcción:</Text>
    <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 10 }}>{name}</Text>
  </View>
);

// Este es tu nuevo motor de pestañas inferiores
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Oculta el encabezado gris nativo
        tabBarShowLabel: false, // Oculta los textos debajo de los iconos
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 80, // Altura suficiente para el diseño
          paddingBottom: 20,
          paddingTop: 10,
          elevation: 0, // Quita sombra fea en Android
        },
        tabBarIcon: ({ focused }) => {
          // Color e icono dinámico dependiendo de si estás en esa pestaña
          const color = focused ? '#1F2937' : '#9CA3AF';
          
          if (route.name === 'Inicio') return <Home size={28} color={color} />;
          if (route.name === 'Estadisticas') return <BarChart2 size={28} color={color} />;
          
          // El botón central flotante tiene un diseño distinto
          if (route.name === 'Agregar') return (
            <View style={{
              backgroundColor: '#3B82F6',
              width: 56,
              height: 56,
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -30, // Esto lo empuja hacia arriba rompiendo la barra
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              elevation: 5,
            }}>
              <PlusCircle size={32} color="#FFFFFF" />
            </View>
          );
          
          if (route.name === 'Notificaciones') return <Bell size={28} color={color} />;
          if (route.name === 'Perfil') return <User size={28} color={color} />;
        },
      })}
    >
      {/* Definición de las 5 rutas */}
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Estadisticas">
        {() => <DummyScreen name="Estadísticas / Progreso" />}
      </Tab.Screen>
      <Tab.Screen name="Agregar">
        {() => <DummyScreen name="Crear Nuevo Hábito" />}
      </Tab.Screen>
      <Tab.Screen name="Notificaciones">
        {() => <DummyScreen name="Centro de Notificaciones" />}
      </Tab.Screen>
      <Tab.Screen name="Perfil">
        {() => <DummyScreen name="Perfil de Usuario" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Si hay usuario, cargamos TODO el sistema de pestañas
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        // Si no, lo dejamos atrapado en el Login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}