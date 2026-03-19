import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { auth, db } from './src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import AppNavigator from './src/navigation/AppNavigator';
import { C } from './src/theme';

export default function App() {
  const [user,                 setUser]                 = useState(undefined); // undefined = loading
  const [onboardingCompleted,  setOnboardingCompleted]  = useState(null);      // null = loading

  useEffect(() => {
    // Listen to auth state
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);

      if (!firebaseUser) {
        // Logged out — reset onboarding state
        setOnboardingCompleted(null);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to user doc for onboarding_completed field
    const unsubDoc = onSnapshot(
      doc(db, 'usuarios', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // If field doesn't exist yet (old accounts), treat as completed
          setOnboardingCompleted(data.onboarding_completed ?? true);
        } else {
          setOnboardingCompleted(null);
        }
      },
      (e) => {
        if (e.code !== 'permission-denied') console.error(e);
        // On error default to completed to avoid stuck state
        setOnboardingCompleted(true);
      }
    );

    return () => unsubDoc();
  }, [user]);

  // Show spinner while auth state is resolving
  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.accentIndigo} />
      </View>
    );
  }

  // Show spinner while Firestore doc is loading (user is logged in but we don't know onboarding state yet)
  if (user && onboardingCompleted === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.accentIndigo} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator user={user} onboardingCompleted={onboardingCompleted} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: C.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
});