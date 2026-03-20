import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  SafeAreaView, Platform, TouchableOpacity, Animated,
} from 'react-native';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { C, S, R, F } from '../theme';

// ─── Badge definitions ────────────────────────────────────────────────────────
export const BADGES = [
  // Primeros pasos
  { id: 'first_habit',   emoji: '🌱', title: 'Primer paso',      desc: 'Completa tu primer hábito',           category: 'Primeros pasos' },
  { id: 'habits_10',     emoji: '🔟', title: '10 completados',   desc: 'Completa 10 hábitos en total',         category: 'Primeros pasos' },
  { id: 'habits_50',     emoji: '⭐', title: '50 completados',   desc: 'Completa 50 hábitos en total',         category: 'Constancia'     },
  { id: 'habits_100',    emoji: '💯', title: '100 completados',  desc: 'Completa 100 hábitos en total',        category: 'Leyenda'        },
  // Rachas
  { id: 'streak_3',      emoji: '🔥', title: 'En racha',         desc: 'Mantén una racha de 3 días',           category: 'Rachas'         },
  { id: 'streak_7',      emoji: '🌶️', title: 'Semana perfecta',  desc: 'Mantén una racha de 7 días',           category: 'Rachas'         },
  { id: 'streak_30',     emoji: '🏆', title: 'Mes imparable',    desc: 'Mantén una racha de 30 días',          category: 'Rachas'         },
  // Niveles
  { id: 'level_3',       emoji: '💫', title: 'Nivel 3',          desc: 'Alcanza el nivel 3',                   category: 'Niveles'        },
  { id: 'level_5',       emoji: '🚀', title: 'Nivel 5',          desc: 'Alcanza el nivel 5',                   category: 'Niveles'        },
  { id: 'level_10',      emoji: '👑', title: 'Maestro',          desc: 'Alcanza el nivel 10',                  category: 'Niveles'        },
];

// ─── Check which badges are unlocked ─────────────────────────────────────────
export function getUnlockedBadges(userData, totalHabitsCompleted) {
  const unlocked = new Set();
  const xp     = userData?.xp_total     || 0;
  const nivel  = userData?.nivel        || Math.floor(xp / 50) + 1;
  const racha  = userData?.racha_actual || 0;

  if (totalHabitsCompleted >= 1)   unlocked.add('first_habit');
  if (totalHabitsCompleted >= 10)  unlocked.add('habits_10');
  if (totalHabitsCompleted >= 50)  unlocked.add('habits_50');
  if (totalHabitsCompleted >= 100) unlocked.add('habits_100');
  if (racha >= 3)                  unlocked.add('streak_3');
  if (racha >= 7)                  unlocked.add('streak_7');
  if (racha >= 30)                 unlocked.add('streak_30');
  if (nivel >= 3)                  unlocked.add('level_3');
  if (nivel >= 5)                  unlocked.add('level_5');
  if (nivel >= 10)                 unlocked.add('level_10');

  return unlocked;
}

// ─── Single badge card ────────────────────────────────────────────────────────
function BadgeCard({ badge, unlocked, index }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scale   = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, delay: index * 60, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, delay: index * 60, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.badgeCard, !unlocked && styles.badgeCardLocked, { transform: [{ scale }], opacity }]}>
      <View style={[styles.badgeEmoji, !unlocked && styles.badgeEmojiLocked]}>
        <Text style={{ fontSize: 32, opacity: unlocked ? 1 : 0.3 }}>{badge.emoji}</Text>
        {!unlocked && (
          <View style={styles.lockIcon}>
            <Lock size={12} color={theme.textMuted} />
          </View>
        )}
      </View>
      <Text style={[styles.badgeTitle, !unlocked && { color: theme.textMuted }]} numberOfLines={1}>
        {badge.title}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
      {unlocked && <View style={styles.unlockedDot} />}
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AchievementsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [userData,             setUserData]             = useState(null);
  const [totalHabitsCompleted, setTotalHabitsCompleted] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to user doc
    const unsubUser = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    // Count total habits completed
    getDocs(query(collection(db, 'registros_habito'), where('user_id', '==', user.uid)))
      .then(snap => setTotalHabitsCompleted(snap.size))
      .catch(console.error);

    return () => unsubUser();
  }, []);

  const unlockedBadges = getUnlockedBadges(userData, totalHabitsCompleted);
  const unlockedCount  = unlockedBadges.size;

  // Group by category
  const categories = [...new Set(BADGES.map(b => b.category))];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bgBase }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={22} color={theme.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Logros</Text>
          <Text style={styles.subtitle}>{unlockedCount} de {BADGES.length} desbloqueados</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressBg]}>
          <Animated.View style={[styles.progressFill, { width: `${(unlockedCount / BADGES.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round((unlockedCount / BADGES.length) * 100)}%</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {categories.map(cat => {
          const catBadges = BADGES.filter(b => b.category === cat);
          return (
            <View key={cat} style={styles.section}>
              <Text style={styles.catLabel}>{cat}</Text>
              <View style={styles.badgeGrid}>
                {catBadges.map((badge, i) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    unlocked={unlockedBadges.has(badge.id)}
                    index={i}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (theme) => StyleSheet.create({
  root:           { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: theme.borderDefault },
  backBtn:        { width: 36, height: 36, borderRadius: R.md, backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, alignItems: 'center', justifyContent: 'center' },
  title:          { fontSize: F.h2, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
  subtitle:       { fontSize: F.small, color: theme.textMuted, marginTop: 2 },
  progressWrap:   { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.lg, paddingVertical: S.md },
  progressBg:     { flex: 1, height: 6, backgroundColor: theme.bgElevated, borderRadius: R.pill, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: C.accentIndigo, borderRadius: R.pill },
  progressText:   { fontSize: F.small, fontWeight: '700', color: C.accentIndigoL, minWidth: 36 },
  section:        { marginTop: S.lg, paddingHorizontal: S.lg },
  catLabel:       { fontSize: F.caption, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: S.md },
  badgeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  badgeCard:      { width: '30%', backgroundColor: theme.bgCard, borderRadius: R.lg, borderWidth: 0.5, borderColor: theme.borderDefault, padding: S.sm, alignItems: 'center', gap: 6, position: 'relative' },
  badgeCardLocked:{ opacity: 0.6 },
  badgeEmoji:     { width: 60, height: 60, borderRadius: R.lg, backgroundColor: theme.bgElevated, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badgeEmojiLocked:{ backgroundColor: theme.bgElevated },
  lockIcon:       { position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, alignItems: 'center', justifyContent: 'center' },
  badgeTitle:     { fontSize: F.small, fontWeight: '700', color: theme.textPrimary, textAlign: 'center' },
  badgeDesc:      { fontSize: 10, color: theme.textMuted, textAlign: 'center', lineHeight: 14 },
  unlockedDot:    { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accentGreen },
});