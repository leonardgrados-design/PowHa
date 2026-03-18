import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart2, Bell, User } from 'lucide-react-native';

// ── Screen imports — verify these paths match your project structure ──────────
import LoginScreen         from '../screens/LoginScreen';
import HomeScreen          from '../screens/HomeScreen';
import AddHabitScreen      from '../screens/AddHabitScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import StatusScreen        from '../screens/StatusScreen';
import ProfileScreen       from '../screens/ProfileScreen';

import { C, R } from '../theme';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── Animated tab icon ────────────────────────────────────────────────────────
function TabIcon({ Icon, focused }) {
  const scale   = useRef(new Animated.Value(focused ? 1.1 : 0.9)).current;
  const dotAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: focused ? 1.1 : 0.9, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(dotAnim, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabIconWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon size={24} color={focused ? C.accentIndigo : C.textMuted} strokeWidth={focused ? 2.2 : 1.8} />
      </Animated.View>
      <Animated.View style={[styles.tabDot, { opacity: dotAnim }]} />
    </View>
  );
}

// ─── Center add button ────────────────────────────────────────────────────────
function AddButton({ focused }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: focused ? 0.92 : 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(rotate, { toValue: focused ? 1 : 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <Animated.View style={[styles.addButton, { transform: [{ scale }] }, focused && styles.addButtonActive]}>
      <Animated.Text style={[styles.addButtonIcon, { transform: [{ rotate: rotateDeg }] }, focused && { color: '#fff' }]}>
        +
      </Animated.Text>
    </Animated.View>
  );
}

// ─── Main tab navigator ───────────────────────────────────────────────────────
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:    false,
        tabBarShowLabel: false,
        tabBarStyle:    styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home}     focused={focused} /> }}
      />
      <Tab.Screen
        name="Estadisticas"
        component={StatusScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={BarChart2} focused={focused} /> }}
      />
      <Tab.Screen
        name="Agregar"
        component={AddHabitScreen}
        options={{ tabBarIcon: ({ focused }) => <AddButton focused={focused} /> }}
      />
      <Tab.Screen
        name="Notificaciones"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Bell} focused={focused} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
export default function AppNavigator({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ animationEnabled: false }} />
      ) : (
        <Stack.Screen name="Login"    component={LoginScreen}      options={{ animationEnabled: false }} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bgCard,
    borderTopWidth:  0.5,
    borderTopColor:  C.borderDefault,
    height:          Platform.OS === 'ios' ? 88 : 68,
    paddingBottom:   Platform.OS === 'ios' ? 28 : 10,
    paddingTop:      10,
    elevation:       0,
    shadowOpacity:   0,
  },
  tabIconWrap: { alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 2 },
  tabDot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accentIndigo },
  addButton: {
    width: 52, height: 52, borderRadius: R.lg,
    backgroundColor: C.bgCard,
    borderWidth: 1.5, borderColor: C.bgIndigoL,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -16,
    shadowColor: C.accentIndigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  addButtonActive: { backgroundColor: C.accentIndigo, borderColor: C.accentIndigo, shadowOpacity: 0.5 },
  addButtonIcon:   { fontSize: 28, color: C.accentIndigo, fontWeight: '300', lineHeight: 32, marginTop: -1 },
});