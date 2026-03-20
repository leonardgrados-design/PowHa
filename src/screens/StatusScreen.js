import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Flame, TrendingUp, Target, Activity, Zap, Award } from 'lucide-react-native';

import { auth, db } from '../config/firebase';
import { doc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { C, S, R, F, common } from '../theme';

const getStyles = (theme) => StyleSheet.create({
  root:         { flex: 1, backgroundColor: theme.bgBase, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scroll:       { paddingHorizontal: S.lg, paddingBottom: 48, paddingTop: S.lg },
  pageTitle:    { fontSize: F.h1, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5, marginBottom: S.lg },
  heroXPNum:    { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -1 },
  heroXPSub:    { fontSize: F.h4, fontWeight: '600', color: theme.textMuted },
  statCard:     { flex: 1, backgroundColor: theme.bgCard, borderRadius: R.lg, borderWidth: 0.5, borderColor: theme.borderDefault, padding: 14, alignItems: 'center' },
  statIconWrap: { width: 32, height: 32, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginBottom: S.sm },
  statValue:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel:    { fontSize: F.caption, color: theme.textMuted, marginTop: 2, textAlign: 'center' },
  statSub:      { fontSize: 10, color: theme.textMuted, textAlign: 'center' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: 14 },
  cardTitle:    { fontSize: F.body, fontWeight: '700', color: theme.textPrimary },
  cardSub:      { fontSize: F.label, color: theme.textMuted, marginTop: S.sm, lineHeight: 18 },
  barsContainer:{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: S.sm },
  barCol:       { flex: 1, alignItems: 'center', gap: 4 },
  barTrack:     { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill:      { width: '100%', borderRadius: 4 },
  barCount:     { fontSize: 10, color: theme.textMuted, fontWeight: '600' },
  barLabel:     { fontSize: 10, color: theme.textMuted },
  analysisRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: S.sm },
  analysisLabel:{ fontSize: F.label, color: theme.textSecondary },
  analysisValue:{ fontSize: F.label, fontWeight: '700' },
});


function StatCard({ label, value, sub, color = C.accentIndigo, icon }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8, delay: 100 }).start(); }, []);
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: anim }] }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>{icon}</View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Animated.View>
  );
}

function ActivityBars({ data, labels }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const max = Math.max(...data, 1);
  return (
    <View style={styles.barsContainer}>
      {data.map((val, i) => {
        const isToday = i === data.length - 1;
        return (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: `${Math.max((val / max) * 100, val > 0 ? 8 : 0)}%`, backgroundColor: isToday ? C.accentIndigo : val > 0 ? C.accentIndigoL + 'AA' : C.bgElevated }]} />
            </View>
            {val > 0 && <Text style={[styles.barCount, isToday && { color: theme.accentIndigoL }]}>{val}</Text>}
            <Text style={[styles.barLabel, isToday && { color: theme.textSecondary }]}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StreakRow({ streak }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const flames = Math.min(streak, 7);
  return (
    <View style={{ flexDirection: 'row', gap: S.sm, alignItems: 'center' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Flame key={i} size={22} color={i < flames ? C.accentAmber : C.bgElevated} fill={i < flames ? C.accentAmber : C.bgElevated} />
      ))}
      {streak > 7 && <Text style={{ fontSize: F.label, color: C.accentAmber, fontWeight: '700', marginLeft: 4 }}>+{streak - 7}</Text>}
    </View>
  );
}

export default function StatusScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [loading,   setLoading]   = useState(true);
  const [userData,  setUserData]  = useState({ xp_total: 0, nivel: 1, racha_actual: 0 });
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [stats,     setStats]     = useState({ totalHabitos: 0, completadosReciente: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    const unsubUser = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      const today = new Date().toLocaleDateString('en-CA');
      const yStr  = (() => { const y = new Date(); y.setDate(y.getDate() - 1); return y.toLocaleDateString('en-CA'); })();
      let streak  = d.racha_actual || 0;
      if (d.ultima_fecha_racha && d.ultima_fecha_racha !== today && d.ultima_fecha_racha !== yStr) streak = 0;
      setUserData({ ...d, racha_actual: streak });
    }, (e) => { if (e.code !== 'permission-denied') console.error(e); });

    const fetchAnalytics = async () => {
      try {
        const today = new Date();
        const labels = []; const activityMap = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today); d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const short   = d.toLocaleDateString('es-MX', { weekday: 'short' });
          activityMap[dateStr] = 0;
          labels.push(short.charAt(0).toUpperCase() + short.slice(1, 3));
        }
        const startDate   = Object.keys(activityMap)[0];
        const recordsSnap = await getDocs(query(collection(db, 'registros_habito'), where('user_id', '==', user.uid), where('fecha_completado', '>=', startDate)));
        recordsSnap.forEach(d => { const f = d.data().fecha_completado; if (activityMap[f] !== undefined) activityMap[f]++; });
        const habitsSnap  = await getDocs(query(collection(db, 'habitos'), where('user_id', '==', user.uid), where('activo', '==', true)));
        setChartData({ labels, data: Object.values(activityMap) });
        setStats({ totalHabitos: habitsSnap.size, completadosReciente: recordsSnap.size });
      } catch (e) { if (e.code !== 'permission-denied') console.error(e); }
      finally     { setLoading(false); Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }
    };

    fetchAnalytics();
    return () => unsubUser();
  }, []);

  const xp         = userData.xp_total || 0;
  const nivel      = userData.nivel || Math.floor(xp / 50) + 1;
  const xpPct      = (xp % 50) / 50;
  const levelEmoji = nivel >= 10 ? '👑' : nivel >= 5 ? '😎' : nivel >= 3 ? '🔥' : '😐';
  const hasActivity = (chartData.data || []).some(v => v > 0);
  const tendencia  = stats.completadosReciente > 5 ? '¡Excelente ritmo! 🔥' : stats.completadosReciente > 0 ? 'Sigue así 💪' : 'Empieza hoy 🎯';

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accentIndigo} />
        <Text style={{ marginTop: 12, color: theme.textMuted, fontSize: F.label }}>Calculando métricas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bgBase }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgBase} />
      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.pageTitle}>Tu Progreso</Text>

        {/* Hero */}
        <View style={[common.card, { flexDirection: 'row', alignItems: 'center', marginBottom: S.md }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={[common.levelBadge, { alignSelf: 'flex-start', marginBottom: S.sm, flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
              <Award size={12} color={C.accentIndigoL} />
              <Text style={common.levelBadgeText}>Nivel {nivel}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 }}>
              <Text style={styles.heroXPNum}>{xp}</Text>
              <Text style={styles.heroXPSub}> XP</Text>
            </View>
            <View style={common.xpBarBg}>
              <View style={[common.xpBarFill, { width: `${xpPct * 100}%` }]} />
            </View>
            <Text style={{ fontSize: F.caption, color: theme.textMuted, marginTop: 5 }}>{xp % 50}/50 XP → Nivel {nivel + 1}</Text>
          </View>
          <View style={[common.avatarCircle, { width: 72, height: 72, borderRadius: R.lg }]}>
            <Text style={{ fontSize: 36 }}>{levelEmoji}</Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', gap: S.sm, marginBottom: S.md }}>
          <StatCard label="Racha" value={`${userData.racha_actual || 0}`} sub="días" color={C.accentAmber}
            icon={<Flame size={16} color={C.accentAmber} fill={userData.racha_actual > 0 ? C.accentAmber : 'none'} />} />
          <StatCard label="Hábitos" value={`${stats.totalHabitos}`} sub="activos" color={C.accentTeal}
            icon={<Target size={16} color={C.accentTeal} />} />
          <StatCard label="Semana" value={`${stats.completadosReciente}`} sub="completados" color={C.accentGreen}
            icon={<TrendingUp size={16} color={C.accentGreen} />} />
        </View>

        {/* Streak flames */}
        {(userData.racha_actual || 0) > 0 && (
          <View style={[common.card, { marginBottom: S.md }]}>
            <View style={styles.cardHeader}>
              <Flame size={18} color={C.accentAmber} fill={C.accentAmber} />
              <Text style={styles.cardTitle}>Racha de constancia</Text>
            </View>
            <StreakRow streak={userData.racha_actual || 0} />
            <Text style={styles.cardSub}>{userData.racha_actual >= 7 ? '¡Una semana perfecta! Sigue así.' : '¡Mantén el fuego vivo! Completa un hábito hoy.'}</Text>
          </View>
        )}

        {/* Activity chart */}
        <View style={[common.card, { marginBottom: S.md }]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={18} color={C.accentGreen} />
            <Text style={styles.cardTitle}>Actividad — últimos 7 días</Text>
          </View>
          {hasActivity ? <ActivityBars data={chartData.data} labels={chartData.labels} /> : (
            <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', gap: S.sm }}>
              <Activity size={32} color={theme.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: F.label, color: theme.textMuted }}>Aún no hay actividad reciente.</Text>
            </View>
          )}
        </View>

        {/* Analysis */}
        <View style={[common.card, { marginBottom: S.md }]}>
          <View style={styles.cardHeader}>
            <Zap size={18} color={C.accentIndigo} />
            <Text style={styles.cardTitle}>Análisis general</Text>
          </View>
          {[
            { label: 'Hábitos en seguimiento', value: stats.totalHabitos,       color: C.accentTeal    },
            { label: 'Completados esta semana', value: stats.completadosReciente, color: C.accentGreen  },
            { label: 'XP acumulada',            value: xp,                       color: theme.accentIndigoL },
            { label: 'Tendencia',               value: tendencia,                color: theme.textPrimary   },
          ].map((row, i, arr) => (
            <React.Fragment key={i}>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>{row.label}</Text>
                <Text style={[styles.analysisValue, { color: row.color }]}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={common.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}