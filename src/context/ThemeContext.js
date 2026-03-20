import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getTheme } from '../theme';

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext({
  isDark:      true,
  theme:       getTheme(true),
  toggleTheme: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }) {
  // Start with system preference
  const systemDark = Appearance.getColorScheme() === 'dark';
  const [isDark, setIsDark] = useState(systemDark);

  // Listen to system changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      // Only follow system if no user override stored yet
      // (Firestore listener below will override once loaded)
    });
    return () => sub.remove();
  }, []);

  // Listen to Firestore dark_mode preference for logged-in users
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(
      doc(db, 'usuarios', user.uid),
      (snap) => {
        if (snap.exists()) {
          const val = snap.data().dark_mode;
          // If field exists use it, else fall back to system
          if (val !== undefined) {
            setIsDark(Boolean(val));
          } else {
            setIsDark(Appearance.getColorScheme() === 'dark');
          }
        }
      },
      (e) => { if (e.code !== 'permission-denied') console.error(e); }
    );

    return () => unsub();
  }, [auth.currentUser?.uid]);

  // Toggle — updates local state + Firestore
  const toggleTheme = async (val) => {
    setIsDark(val);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'usuarios', user.uid), { dark_mode: val });
      }
    } catch (e) {
      console.error('ThemeContext toggleTheme error:', e);
    }
  };

  const theme = getTheme(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme() {
  return useContext(ThemeContext);
}