import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart2, Bell, User } from 'lucide-react-native';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

import LoginScreen         from '../screens/LoginScreen';
import HomeScreen          from '../screens/HomeScreen';
import AddHabitScreen      from '../screens/AddHabitScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import StatusScreen        from '../screens/StatusScreen';
import ProfileScreen       from '../screens/ProfileScreen';
import OnboardingScreen    from '../screens/OnboardingScreen';

import { C, R } from '../theme';
import { useTheme } from '../context/ThemeContext';

const getStyles = (theme) => StyleSheet.create({
  loading:         { flex: 1, backgroundColor: theme.bgBase, alignItems: 'center', justifyContent: 'center' },
  tabBar:          { backgroundColor: theme.bgCard, borderTopWidth: 0.5, borderTopColor: theme.borderDefault, height: Platform.OS === 'ios' ? 88 : 68, paddingBottom: Platform.OS === 'ios' ? 28 : 10, paddingTop: 10, elevation: 0, shadowOpacity: 0 },
  tabIconWrap:     { alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 2 },
  tabDot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accentIndigo },
  addButton:       { width: 52, height: 52, borderRadius: R.lg, backgroundColor: theme.bgCard, borderWidth: 1.5, borderColor: C.bgIndigoL, alignItems: 'center', justifyContent: 'center', marginTop: -16, shadowColor: C.accentIndigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  addButtonActive: { backgroundColor: C.accentIndigo, borderColor: C.accentIndigo, shadowOpacity: 0.5 },
  addButtonIcon:   { fontSize: 28, color: C.accentIndigo, fontWeight: '300', lineHeight: 32, marginTop: -1 },
});


const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── Tab icons ────────────────────────────────────────────────────────────────
function TabIcon({ Icon, focused }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scale   = useRef(new Animated.Value(focused ? 1.1 : 0.9)).current;
  const dotAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: focused ? 1.1 : 0.9, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(dotAnim, { toValue: focused ? 1 : 0,     duration: 200,         useNativeDriver: true }),
    ]).start();
  }, [focused]);
  return (
    <View style={styles.tabIconWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon size={24} color={focused ? C.accentIndigo : theme.textMuted} strokeWidth={focused ? 2.2 : 1.8} />
      </Animated.View>
      <Animated.View style={[styles.tabDot, { opacity: dotAnim }]} />
    </View>
  );
}

function AddButton({ focused }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scale  = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: focused ? 0.92 : 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(rotate, { toValue: focused ? 1 : 0,    duration: 250,         useNativeDriver: true }),
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

function MainTabs() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const tabBarStyle = {
    backgroundColor: theme.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: theme.borderDefault,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    elevation: 0,
    shadowOpacity: 0,
  };
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle }}>
      <Tab.Screen name="Inicio"         component={HomeScreen}          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home}     focused={focused} /> }} />
      <Tab.Screen name="Estadisticas"   component={StatusScreen}        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={BarChart2} focused={focused} /> }} />
      <Tab.Screen name="Agregar"        component={AddHabitScreen}      options={{ tabBarIcon: ({ focused }) => <AddButton focused={focused} /> }} />
      <Tab.Screen name="Notificaciones" component={NotificationsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Bell}     focused={focused} /> }} />
      <Tab.Screen name="Perfil"         component={ProfileScreen}       options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User}     focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [status, setStatus] = useState('loading');
  // status values:
  //   'loading'    → spinner
  //   'auth'       → show Login
  //   'onboarding' → show Onboarding
  //   'app'        → show MainTabs

  useEffect(() => {
    let firestoreUnsub = null;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous Firestore listener on auth change
      if (firestoreUnsub) {
        firestoreUnsub();
        firestoreUnsub = null;
      }

      if (!firebaseUser) {
        setStatus('auth');
        return;
      }

      // User logged in — listen to their Firestore doc
      setStatus('loading');

      firestoreUnsub = onSnapshot(
        doc(db, 'usuarios', firebaseUser.uid),
        (snap) => {
          if (!snap.exists()) {
            setStatus('app');
            return;
          }
          const val = snap.data().onboarding_completed;
          if (val === false) {
            setStatus('onboarding');
          } else {
            // true or undefined (old accounts without the field)
            setStatus('app');
          }
        },
        (e) => {
          if (e.code !== 'permission-denied') console.error(e);
          setStatus('app');
        }
      );
    });

    return () => {
      authUnsub();
      if (firestoreUnsub) firestoreUnsub();
    };
  }, []);

  // Spinner while resolving
  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.accentIndigo} />
      </View>
    );
  }

  // Single stack — only one screen defined at a time.
  // React Navigation watches which screens are in the Stack.
  // When the set changes it automatically navigates to the new first screen.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      {status === 'auth' && (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
      {status === 'onboarding' && (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
      {status === 'app' && (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}