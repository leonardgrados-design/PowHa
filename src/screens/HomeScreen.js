import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, SafeAreaView,
  Platform, StatusBar, TouchableOpacity,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { Check, Flame, Inbox, CheckCircle2, Zap } from 'lucide-react-native';

import { auth, db } from '../config/firebase';
import {
  collection, query, where, onSnapshot,
  addDoc, getDocs, deleteDoc, doc,
  updateDoc, increment, getDoc,
} from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { C, S, R, F, common, CATEGORY_CONFIG } from '../theme';
import {
  scheduleAllHabits,
  onHabitCompleted,
  onHabitUncompleted,
} from '../services/NotificationService';

const getStyles = (theme) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: theme.bgBase, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.sm },
  greeting:      { fontSize: F.h2, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
  subGreeting:   { fontSize: F.label, color: theme.textMuted, marginTop: 2 },
  banner:        { marginHorizontal: S.lg, marginTop: S.md, backgroundColor: theme.bgCard, borderRadius: R.xl, borderWidth: 0.5, borderColor: theme.borderDefault, padding: S.lg, flexDirection: 'row', alignItems: 'center' },
  bannerLevel:   { fontSize: 26, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
  bannerXP:      { fontSize: F.label, color: theme.accentIndigoL, fontWeight: '600', marginBottom: 12 },
  xpBarLabel:    { fontSize: F.caption, color: theme.textMuted, fontWeight: '500', marginTop: 5 },
  skippedNotice: { marginHorizontal: S.lg, marginTop: S.sm, backgroundColor: theme.bgElevated, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: S.sm },
  skippedText:   { fontSize: F.small, color: theme.textMuted, textAlign: 'center' },
  allDone:       { marginHorizontal: S.lg, marginTop: S.lg, backgroundColor: theme.bgGreen, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.bgGreenL, paddingVertical: S.lg, alignItems: 'center' },
  allDoneTitle:  { fontSize: F.h4, fontWeight: '700', color: C.accentGreen, marginTop: S.sm },
  allDoneDesc:   { fontSize: F.label, color: '#34D399', marginTop: 4 },
  section:       { marginTop: 28, paddingHorizontal: S.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: 12 },
  sectionDot:    { width: 6, height: 6, borderRadius: 3 },
  sectionTitle:  { fontSize: F.caption, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  sectionCount:  { fontSize: F.small, fontWeight: '700', color: theme.textMuted, backgroundColor: theme.bgElevated, paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.pill },
  habitCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.bgCard, borderRadius: R.lg, borderWidth: 0.5, borderColor: theme.borderDefault, borderLeftWidth: 3, padding: 14, marginBottom: S.sm },
  habitCardDone: { opacity: 0.5 },
  habitIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  habitEmoji:    { fontSize: 22 },
  habitText:     { flex: 1 },
  habitTitle:    { fontSize: F.body, fontWeight: '600', color: theme.textPrimary },
  habitTitleDone:{ textDecorationLine: 'line-through', color: theme.textMuted },
  habitMetaRow:  { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: 3, flexWrap: 'wrap' },
  habitMeta:     { fontSize: F.small, color: theme.textMuted },
  freqBadge:     { backgroundColor: theme.bgElevated, borderRadius: R.pill, paddingHorizontal: 6, paddingVertical: 1 },
  freqBadgeText: { fontSize: 10, color: theme.textMuted, fontWeight: '600' },
  habitRight:    { alignItems: 'flex-end', gap: S.sm },
  xpPill:        { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.bgIndigo, paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.pill, borderWidth: 0.5, borderColor: C.bgIndigoL },
  xpText:        { fontSize: F.caption, fontWeight: '700', color: theme.accentIndigoL },
  checkCircle:   { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: theme.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: C.accentGreen, borderColor: C.accentGreen },
});


// ─── Frequency filter ─────────────────────────────────────────────────────────
function habitIsForToday(habit) {
  const todayDay = new Date().getDay();
  const { frecuencia, dias_semana, cada_x_dias, fecha_inicio } = habit;
  switch (frecuencia) {
    case 'diario':           return true;
    case 'entre_semana':     return todayDay >= 1 && todayDay <= 5;
    case 'fines_semana':     return todayDay === 0 || todayDay === 6;
    case 'dias_especificos': return Array.isArray(dias_semana) && dias_semana.includes(todayDay);
    case 'cada_x_dias': {
      if (!fecha_inicio || !cada_x_dias) return true;
      const start = new Date(fecha_inicio); start.setHours(0, 0, 0, 0);
      const now   = new Date();             now.setHours(0, 0, 0, 0);
      const diff  = Math.round((now - start) / 86400000);
      return diff >= 0 && diff % cada_x_dias === 0;
    }
    default: return true;
  }
}

// ─── Habit Card ───────────────────────────────────────────────────────────────
function HabitCard({ habit, onPress, disabled }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scale     = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(habit.completado_hoy ? 1 : 0)).current;
  const cfg       = CATEGORY_CONFIG[habit.categoria] || CATEGORY_CONFIG.cuerpo;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: habit.completado_hoy ? 1 : 0,
      useNativeDriver: true, tension: 80, friction: 8,
    }).start();
  }, [habit.completado_hoy]);

  const pressIn    = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 200 }).start();
  const pressOut   = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();
  const checkScale = checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] });

  const freqLabel = (() => {
    switch (habit.frecuencia) {
      case 'entre_semana':     return 'Lun–Vie';
      case 'fines_semana':     return 'Sáb–Dom';
      case 'dias_especificos': return `${(habit.dias_semana || []).length}d/sem`;
      case 'cada_x_dias':      return `c/${habit.cada_x_dias}d`;
      default:                 return 'Diario';
    }
  })();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        disabled={disabled} activeOpacity={1}
        style={[styles.habitCard, habit.completado_hoy && styles.habitCardDone, { borderLeftColor: cfg.color, backgroundColor: theme.bgCard, borderColor: theme.borderDefault }]}
      >
        <View style={[styles.habitIconWrap, { backgroundColor: cfg.bg }]}>
          <Text style={styles.habitEmoji}>{habit.icono}</Text>
        </View>
        <View style={styles.habitText}>
          <Text style={[styles.habitTitle, habit.completado_hoy && styles.habitTitleDone]} numberOfLines={1}>
            {habit.titulo}
          </Text>
          <View style={styles.habitMetaRow}>
            <Text style={styles.habitMeta}>
              {cfg.label} · {habit.horario === 'cualquiera' ? 'Flexible' : habit.horario}
            </Text>
            <View style={styles.freqBadge}>
              <Text style={styles.freqBadgeText}>{freqLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.habitRight}>
          {!habit.completado_hoy && (
            <View style={styles.xpPill}>
              <Zap size={10} color={C.accentIndigo} />
              <Text style={styles.xpText}>+{habit.valor_xp || 10}</Text>
            </View>
          )}
          <Animated.View style={[
            styles.checkCircle,
            habit.completado_hoy && styles.checkCircleDone,
            { transform: [{ scale: checkScale }] },
          ]}>
            {habit.completado_hoy && <Check size={14} color="#fff" strokeWidth={3} />}
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [stats,             setStats]             = useState({ xp: 0, level: 1, streak: 0 });
  const [habits,            setHabits]            = useState([]);
  const [completedTodayIds, setCompletedTodayIds] = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [isToggling,        setIsToggling]        = useState(false);

  const xpBarAnim  = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.spring(xpBarAnim, {
      toValue: (stats.xp % 50) / 50,
      useNativeDriver: false, tension: 60, friction: 10,
    }).start();
  }, [stats.xp]);

  // ── Firebase listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const todayStr = new Date().toLocaleDateString('en-CA');

    const unsubUser = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (!snap.exists()) return;
      const d    = snap.data();
      const yStr = (() => { const y = new Date(); y.setDate(y.getDate() - 1); return y.toLocaleDateString('en-CA'); })();
      let streak = d.racha_actual || 0;
      if (d.ultima_fecha_racha && d.ultima_fecha_racha !== todayStr && d.ultima_fecha_racha !== yStr) streak = 0;
      setStats({ xp: d.xp_total || 0, level: Math.floor((d.xp_total || 0) / 50) + 1, streak });
    }, (e) => { if (e.code !== 'permission-denied') console.error(e); });

    const unsubHabits = onSnapshot(
      query(collection(db, 'habitos'), where('user_id', '==', user.uid), where('activo', '==', true)),
      (snap) => setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (e)    => { if (e.code !== 'permission-denied') console.error(e); }
    );

    const unsubRecords = onSnapshot(
      query(collection(db, 'registros_habito'), where('user_id', '==', user.uid), where('fecha_completado', '==', todayStr)),
      (snap) => {
        const ids = snap.docs.map(d => d.data().habit_id);
        setCompletedTodayIds(ids);
        setLoading(false);

        // Reschedule notifications whenever completed list changes
        scheduleAllHabits(ids).catch(console.error);
      },
      (e) => { if (e.code !== 'permission-denied') console.error(e); setLoading(false); }
    );

    return () => { unsubUser(); unsubHabits(); unsubRecords(); };
  }, []);

  // ── Toggle habit ──────────────────────────────────────────────────────────
  const toggleHabit = async (habit) => {
    if (isToggling) return;
    setIsToggling(true);

    const todayStr  = new Date().toLocaleDateString('en-CA');
    const completed = completedTodayIds.includes(habit.id);
    const userRef   = doc(db, 'usuarios', auth.currentUser.uid);

    try {
      if (completed) {
        // ── Uncomplete ──
        const snap = await getDocs(query(
          collection(db, 'registros_habito'),
          where('habit_id', '==', habit.id),
          where('fecha_completado', '==', todayStr)
        ));
        snap.forEach(async d => await deleteDoc(doc(db, 'registros_habito', d.id)));
        await updateDoc(userRef, { xp_total: increment(-(habit.valor_xp || 10)) });

        // Reschedule notification since it's no longer done
        await onHabitUncompleted(habit);
      } else {
        // ── Complete ──
        await addDoc(collection(db, 'registros_habito'), {
          user_id:          auth.currentUser.uid,
          habit_id:         habit.id,
          fecha_completado: todayStr,
          xp_otorgada:      habit.valor_xp || 10,
        });

        const ud   = (await getDoc(userRef)).data() || {};
        const yStr = (() => { const y = new Date(); y.setDate(y.getDate() - 1); return y.toLocaleDateString('en-CA'); })();
        let upd    = { xp_total: increment(habit.valor_xp || 10) };
        if (ud.ultima_fecha_racha !== todayStr) {
          upd.racha_actual       = ud.ultima_fecha_racha === yStr ? (ud.racha_actual || 0) + 1 : 1;
          upd.ultima_fecha_racha = todayStr;
        }
        await updateDoc(userRef, upd);

        // Cancel notification since it's done
        await onHabitCompleted(habit.id);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el progreso.');
    } finally {
      setIsToggling(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const todayHabits = habits.filter(habitIsForToday);
  const mapped      = todayHabits.map(h => ({ ...h, completado_hoy: completedTodayIds.includes(h.id) }));
  const pending     = mapped.filter(h => !h.completado_hoy);
  const done        = mapped.filter(h =>  h.completado_hoy);
  const allDone     = pending.length === 0 && done.length > 0;
  const skipped     = habits.length - todayHabits.length;

  const pendingByCat = {
    cuerpo: pending.filter(h => h.categoria === 'cuerpo'),
    mente:  pending.filter(h => h.categoria === 'mente'),
    other:  pending.filter(h => h.categoria !== 'cuerpo' && h.categoria !== 'mente'),
  };

  const xpWidth    = xpBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const levelEmoji = stats.level >= 10 ? '👑' : stats.level >= 5 ? '😎' : stats.level >= 3 ? '🔥' : '😐';
  const greeting   = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bgBase }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgBase} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subGreeting}>Es hora de evolucionar.</Text>
          </View>
          {stats.streak > 0 && (
            <View style={common.streakBadge}>
              <Flame size={16} color={C.accentAmber} fill={C.accentAmber} />
              <Text style={common.streakNum}>{stats.streak}</Text>
            </View>
          )}
        </Animated.View>

        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: theme.bgCard, borderColor: theme.borderDefault }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: 4 }}>
              <Text style={styles.bannerLevel}>Nivel {stats.level}</Text>
              <View style={common.levelBadge}><Text style={common.levelBadgeText}>{levelEmoji}</Text></View>
            </View>
            <Text style={styles.bannerXP}>{stats.xp} XP acumulada</Text>
            <View style={common.xpBarBg}>
              <Animated.View style={[common.xpBarFill, { width: xpWidth }]} />
            </View>
            <Text style={styles.xpBarLabel}>{stats.xp % 50}/50 XP → Nivel {stats.level + 1}</Text>
          </View>
          <View style={[common.avatarCircle, { width: 72, height: 72, borderRadius: R.lg }]}>
            <Text style={{ fontSize: 36 }}>{levelEmoji}</Text>
          </View>
        </View>

        {skipped > 0 && (
          <View style={styles.skippedNotice}>
            <Text style={styles.skippedText}>
              {skipped} hábito{skipped > 1 ? 's' : ''} no programado{skipped > 1 ? 's' : ''} para hoy
            </Text>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <ActivityIndicator size="large" color={C.accentIndigo} />
          </View>
        ) : habits.length === 0 ? (
          <View style={[common.emptyState, { marginHorizontal: S.lg, marginTop: 32 }]}>
            <Inbox size={44} color={theme.textMuted} strokeWidth={1.5} />
            <Text style={common.emptyTitle}>Sin hábitos todavía</Text>
            <Text style={common.emptyDesc}>Toca el botón + para crear tu primer objetivo.</Text>
          </View>
        ) : todayHabits.length === 0 ? (
          <View style={[common.emptyState, { marginHorizontal: S.lg, marginTop: 32 }]}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
            <Text style={common.emptyTitle}>¡Día libre!</Text>
            <Text style={common.emptyDesc}>Ningún hábito está programado para hoy.</Text>
          </View>
        ) : (
          <>
            {allDone && (
              <View style={styles.allDone}>
                <CheckCircle2 size={36} color={C.accentGreen} />
                <Text style={styles.allDoneTitle}>¡Día completado!</Text>
                <Text style={styles.allDoneDesc}>Todos tus hábitos de hoy están hechos.</Text>
              </View>
            )}

            {(['cuerpo', 'mente', 'other']).map(cat => {
              const list = pendingByCat[cat];
              if (!list?.length) return null;
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.cuerpo;
              return (
                <View key={cat} style={[styles.section]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: cfg.color }]} />
                    <Text style={styles.sectionTitle}>{cfg.label}</Text>
                    <Text style={styles.sectionCount}>{list.length}</Text>
                  </View>
                  {list.map(h => (
                    <HabitCard key={h.id} habit={h} onPress={() => toggleHabit(h)} disabled={isToggling} />
                  ))}
                </View>
              );
            })}

            {done.length > 0 && (
              <View style={[styles.section]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: C.accentGreen }]} />
                  <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Completados hoy</Text>
                  <Text style={styles.sectionCount}>{done.length}</Text>
                </View>
                {done.map(h => (
                  <HabitCard key={h.id} habit={h} onPress={() => toggleHabit(h)} disabled={isToggling} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}