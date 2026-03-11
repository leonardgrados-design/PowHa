import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart2, PlusCircle, Bell, User } from 'lucide-react-native';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AddHabitScreen from '../screens/AddHabitScreen'; // IMPORTACIÓN NUEVA
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Pantallas falsas para que el router no colapse mientras construyes el resto
const DummyScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>Pantalla en construcción:</Text>
    <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 10 }}>{name}</Text>
  </View>
);

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarIcon: ({ focused }) => {
          const color = focused ? '#1F2937' : '#9CA3AF';
          
          if (route.name === 'Inicio') return <Home size={28} color={color} />;
          if (route.name === 'Estadisticas') return <BarChart2 size={28} color={color} />;
          if (route.name === 'Agregar') return (
            <View style={{
              backgroundColor: '#3B82F6',
              width: 56,
              height: 56,
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -30,
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
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Estadisticas">{() => <DummyScreen name="Estadísticas" />}</Tab.Screen>
      {/* CONECTADO: La pestaña de 'Agregar' ahora abre AddHabitScreen */}
      <Tab.Screen name="Agregar" component={AddHabitScreen} />
      <Tab.Screen name="Notificaciones" component={NotificationsScreen} />
      <Tab.Screen name="Perfil">{() => <DummyScreen name="Perfil" />}</Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Firebase dice que SÍ hay usuario -> Pasa directo al Home
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        // Firebase dice que NO hay usuario -> Se queda en el Login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}