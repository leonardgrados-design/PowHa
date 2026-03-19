import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Bell, BellOff, Clock, CheckCircle2, ChevronRight, Zap } from 'lucide-react-native';

import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { C, S, R, F, common, HORARIO_CONFIG } from '../theme';

function NotifCard({ item, onPress, index }) {
  const slide = useRef(new Animated.Value(30)).current;
  const fade  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const cfg = HORARIO_CONFIG[item.horario] || HORARIO_CONFIG.cualquiera;

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }, { scale }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,   useNativeDriver: true, tension: 200 }).start()}
        style={[styles.card, { borderLeftColor: cfg.color }]}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.color + '20' }]}>
          <Text style={{ fontSize: 22 }}>{item.icono}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Clock size={11} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: cfg.color }]}>{cfg.label}</Text>
            <View style={styles.metaDot} />
            <Zap size={11} color={C.accentIndigoL} />
            <Text style={styles.metaXP}>+{item.valor_xp || 10} XP</Text>
          </View>
        </View>
        <ChevronRight size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen({
  const { theme } = useTheme(); navigation }) {
  const [habits,            setHabits]            = useState([]);
  const [completedTodayIds, setCompletedTodayIds] = useState([]);
  const [loading,           setLoading]           = useState(true);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    const today = new Date().toLocaleDateString('en-CA');

    const unsubHabits = onSnapshot(
      query(collection(db, 'habitos'), where('user_id', '==', user.uid), where('activo', '==', true)),
      (snap) => setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (e) => { if (e.code !== 'permission-denied') console.error(e); }
    );

    const unsubRecords = onSnapshot(
      query(collection(db, 'registros_habito'), where('user_id', '==', user.uid), where('fecha_completado', '==', today)),
      (snap) => { setCompletedTodayIds(snap.docs.map(d => d.data().habit_id)); setLoading(false); },
      (e) => { if (e.code !== 'permission-denied') console.error(e); setLoading(false); }
    );

    return () => { unsubHabits(); unsubRecords(); };
  }, []);

  const pending = habits.filter(h => !completedTodayIds.includes(h.id));
  const done    = habits.filter(h =>  completedTodayIds.includes(h.id));

  const groups = ['mañana', 'tarde', 'noche', 'cualquiera']
    .map(k => ({ key: k, ...HORARIO_CONFIG[k], items: pending.filter(h => h.horario === k) }))
    .filter(g => g.items.length > 0);

  const listData = [];
  groups.forEach(g => {
    listData.push({ type: 'header', key: `h-${g.key}`, label: g.label, color: g.color, count: g.items.length });
    g.items.forEach(item => listData.push({ type: 'card', key: item.id, item, index: listData.length }));
  });

  const renderItem = ({ item: row }) => {
    if (row.type === 'header') {
      return (
        <View style={styles.groupHeader}>
          <View style={[styles.groupDot, { backgroundColor: row.color }]} />
          <Text style={styles.groupLabel}>{row.label}</Text>
          <View style={[styles.groupCount, { backgroundColor: row.color + '20', borderColor: row.color + '40' }]}>
            <Text style={[styles.groupCountText, { color: row.color }]}>{row.count}</Text>
          </View>
        </View>
      );
    }
    return <NotifCard item={row.item} index={row.index} onPress={() => navigation.navigate('Inicio')} />;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accentIndigo} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bgBase }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgBase} />

      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <View>
          <Text style={styles.headerTitle}>Agenda diaria</Text>
          <Text style={styles.headerSub}>
            {pending.length > 0
              ? `${pending.length} pendiente${pending.length > 1 ? 's' : ''} · ${done.length} completado${done.length !== 1 ? 's' : ''}`
              : '¡Todo al día!'}
          </Text>
        </View>
        <View style={{ position: 'relative', marginTop: 4 }}>
          <Bell size={20} color={pending.length > 0 ? C.accentAmber : theme.textMuted} />
          {pending.length > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{pending.length}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {habits.length > 0 && (
        <View style={styles.progressWrap}>
          <View style={common.xpBarBg}>
            <View style={[common.xpBarFill, { width: `${(done.length / habits.length) * 100}%`, backgroundColor: C.accentGreen }]} />
          </View>
          <Text style={styles.progressLabel}>{done.length}/{habits.length}</Text>
        </View>
      )}

      {pending.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <CheckCircle2 size={44} color={C.accentGreen} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>¡Todo al día!</Text>
          <Text style={[common.emptyDesc, { textAlign: 'center' }]}>Has completado todos tus hábitos programados para hoy.</Text>
          {done.length > 0 && (
            <View style={[common.group, { width: '100%', marginTop: 28 }]}>
              {done.map((h, i) => (
                <React.Fragment key={h.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: 14 }}>
                    <Text style={{ fontSize: 18 }}>{h.icono}</Text>
                    <Text style={{ flex: 1, fontSize: F.label, color: theme.textMuted }}>{h.titulo}</Text>
                    <CheckCircle2 size={16} color={C.accentGreen} />
                  </View>
                  {i < done.length - 1 && <View style={common.divider} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={row => row.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: theme.bgBase, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: 14 },
  headerTitle:    { fontSize: F.h1, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
  headerSub:      { fontSize: F.label, color: theme.textMuted, marginTop: 3 },
  bellBadge:      { position: 'absolute', top: -5, right: -6, backgroundColor: C.accentAmber, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText:  { fontSize: 9, fontWeight: '800', color: '#000' },
  progressWrap:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.lg, gap: S.sm, marginBottom: S.sm },
  progressLabel:  { fontSize: F.caption, color: theme.textMuted, minWidth: 40 },
  listContent:    { paddingHorizontal: S.lg, paddingBottom: 48, paddingTop: 4 },
  groupHeader:    { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.lg, marginBottom: S.sm },
  groupDot:       { width: 6, height: 6, borderRadius: 3 },
  groupLabel:     { fontSize: F.small, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  groupCount:     { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.pill, borderWidth: 0.5 },
  groupCountText: { fontSize: F.caption, fontWeight: '700' },
  card:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.bgCard, borderRadius: R.lg, borderWidth: 0.5, borderColor: theme.borderDefault, borderLeftWidth: 3, padding: 14, marginBottom: S.sm },
  iconWrap:       { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle:      { fontSize: F.body, fontWeight: '600', color: theme.textPrimary },
  metaText:       { fontSize: F.small, fontWeight: '600' },
  metaXP:         { fontSize: F.small, color: theme.accentIndigoL, fontWeight: '600' },
  metaDot:        { width: 3, height: 3, borderRadius: 2, backgroundColor: theme.textMuted, marginHorizontal: 2 },
  emptyWrap:      { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyIconCircle:{ width: 88, height: 88, borderRadius: 24, backgroundColor: C.accentGreen + '18', borderWidth: 0.5, borderColor: C.accentGreen + '40', alignItems: 'center', justifyContent: 'center', marginBottom: S.lg },
  emptyTitle:     { fontSize: F.h3, fontWeight: '800', color: theme.textPrimary, marginBottom: S.sm },
});