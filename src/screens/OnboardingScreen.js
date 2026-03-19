import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Animated, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { Zap, ArrowRight, Check } from 'lucide-react-native';

import { auth, db } from '../config/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { C, S, R, F, common } from '../theme';

// ─── Slides ───────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1, emoji: '🎯',
    title: 'Construye hábitos que duran',
    body:  'Elige qué quieres mejorar — cuerpo, mente o ambos. Trackly te ayuda a hacerlo de forma constante, un día a la vez.',
    accent: C.accentIndigo, bg: '#1E1E40',
  },
  {
    id: 2, emoji: '⚡',
    title: 'Gana XP con cada logro',
    body:  'Cada hábito completado te da puntos de experiencia. Sube de nivel, desbloquea rachas y ve tu progreso crecer cada semana.',
    accent: C.accentAmber, bg: '#2D1A05',
  },
  {
    id: 3, emoji: '🔥',
    title: 'Mantén tu racha viva',
    body:  'La constancia es la clave. No rompas la cadena — cada día que completes tus hábitos suma a tu racha y fortalece el hábito.',
    accent: C.accentGreen, bg: '#052E1A',
  },
];

// ─── Suggested habits ─────────────────────────────────────────────────────────
const SUGGESTED = [
  { titulo: 'Beber 2L de agua',      categoria: 'cuerpo', icono: '💧', valor_xp: 20 },
  { titulo: 'Caminar 30 min',        categoria: 'cuerpo', icono: '🚶', valor_xp: 20 },
  { titulo: 'Leer 15 min',           categoria: 'mente',  icono: '📚', valor_xp: 15 },
  { titulo: 'Meditar 10 min',        categoria: 'mente',  icono: '🧘', valor_xp: 15 },
  { titulo: 'Ejercicio 20 min',      categoria: 'cuerpo', icono: '🏃', valor_xp: 20 },
  { titulo: 'Sin redes sociales 1h', categoria: 'mente',  icono: '🧠', valor_xp: 15 },
  { titulo: 'Dormir 8 horas',        categoria: 'cuerpo', icono: '💤', valor_xp: 20 },
  { titulo: 'Escribir en diario',    categoria: 'mente',  icono: '✍️', valor_xp: 15 },
  { titulo: 'Comer fruta',           categoria: 'cuerpo', icono: '🍎', valor_xp: 20 },
  { titulo: 'Aprender algo nuevo',   categoria: 'mente',  icono: '🎯', valor_xp: 15 },
];

// ─── Habit chip ───────────────────────────────────────────────────────────────
function HabitChip({ habit, selected, onPress }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 200 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();
  const color    = habit.categoria === 'cuerpo' ? C.accentTeal : C.accentPink;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}
        style={[styles.chip, selected && { borderColor: color, backgroundColor: color + '18' }]}>
        <Text style={{ fontSize: 16 }}>{habit.icono}</Text>
        <Text style={[styles.chipLabel, selected && { color: theme.textPrimary }]}>{habit.titulo}</Text>
        {selected && (
          <View style={[styles.chipCheck, { backgroundColor: color }]}>
            <Check size={10} color="#fff" strokeWidth={3} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen({
  const { theme } = useTheme(); navigation }) {
  const [step,     setStep]     = useState(0); // 0-2 = slides, 3 = habits
  const [selected, setSelected] = useState([]);
  const [saving,   setSaving]   = useState(false);

  const opacities = useRef([...SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)), new Animated.Value(0)]).current;
  // opacities[0..2] = slides, opacities[3] = habits screen

  const isHabits = step === SLIDES.length;

  // ── Fade transition ────────────────────────────────────────────────────────
  const fadeTo = (from, to) => {
    Animated.sequence([
      Animated.timing(opacities[from], { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(opacities[to],   { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
    setStep(to);
  };

  const goNext = () => fadeTo(step, step + 1);
  const goPrev = () => fadeTo(step, step - 1);
  const skip   = () => fadeTo(step, SLIDES.length); // jump to habits

  const toggle = (titulo) =>
    setSelected(prev => prev.includes(titulo) ? prev.filter(t => t !== titulo) : [...prev, titulo]);

  // ── Finish ────────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Create selected habits
      await Promise.all(
        selected.map(titulo => {
          const h = SUGGESTED.find(s => s.titulo === titulo);
          if (!h) return null;
          return addDoc(collection(db, 'habitos'), {
            user_id:     user.uid,
            titulo:      h.titulo,
            categoria:   h.categoria,
            icono:       h.icono,
            horario:     'cualquiera',
            valor_xp:    h.valor_xp,
            activo:      true,
            frecuencia:  'diario',
            dias_semana: [0, 1, 2, 3, 4, 5, 6],
            cada_x_dias: null,
            fecha_inicio: today,
            created_at:  serverTimestamp(),
          });
        }).filter(Boolean)
      );

      // Mark onboarding done
      await updateDoc(doc(db, 'usuarios', user.uid), {
        onboarding_completed: true,
      });

      // Navigate directly — replace so user can't go back to onboarding
      

    } catch (e) {
      console.error('Onboarding error:', e);
      // Even on error, navigate forward — don't leave user stuck
      
    } finally {
      setSaving(false);
    }
  };

  const slide       = SLIDES[step];
  const isLastSlide = step === SLIDES.length - 1;
  const nextLabel   = isHabits ? 'Empezar' : isLastSlide ? 'Elegir hábitos →' : 'Siguiente';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bgBase }]}>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: SLIDES.length + 1 }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
        ))}
      </View>

      {/* Content area */}
      <View style={styles.content}>

        {/* Slides */}
        {SLIDES.map((s, i) => (
          <Animated.View key={s.id} style={[styles.slideWrap, { opacity: opacities[i] }]} pointerEvents={step === i ? 'auto' : 'none'}>
            <View style={[styles.iconWrap, { backgroundColor: s.bg, borderColor: s.accent + '60' }]}>
              <Text style={styles.iconEmoji}>{s.emoji}</Text>
            </View>
            <Text style={[styles.slideTitle, { color: s.accent }]}>{s.title}</Text>
            <Text style={styles.slideBody}>{s.body}</Text>
          </Animated.View>
        ))}

        {/* Habits */}
        <Animated.View style={[styles.habitsWrap, { opacity: opacities[SLIDES.length] }]} pointerEvents={isHabits ? 'auto' : 'none'}>
          <Text style={styles.habitsTitle}>¿Qué quieres mejorar?</Text>
          <Text style={styles.habitsSub}>Elige con qué hábitos empezar.{'\n'}Puedes agregar más después.</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.habitsGrid}>
            {SUGGESTED.map(h => (
              <HabitChip key={h.titulo} habit={h} selected={selected.includes(h.titulo)} onPress={() => toggle(h.titulo)} />
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>
          {selected.length > 0 && (
            <View style={styles.countRow}>
              <Zap size={13} color={C.accentIndigo} />
              <Text style={styles.countText}>{selected.length} hábito{selected.length > 1 ? 's' : ''} seleccionado{selected.length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={step > 0 ? goPrev : undefined} style={styles.backBtn} disabled={step === 0}>
          <Text style={[styles.backText, step === 0 && { opacity: 0 }]}>Atrás</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isHabits ? handleFinish : goNext}
          disabled={saving}
          style={[styles.nextBtn, saving && { opacity: 0.7 }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.nextText}>{nextLabel}</Text>
              <ArrowRight size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Skip */}
      {!isHabits && (
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Saltar intro</Text>
        </TouchableOpacity>
      )}
      {isHabits && (
        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn} disabled={saving}>
          <Text style={styles.skipText}>Empezar sin hábitos</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.bgBase, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: S.lg, paddingBottom: S.sm },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.bgElevated },
  dotActive: { width: 20, backgroundColor: C.accentIndigo },
  dotDone:   { backgroundColor: C.accentIndigo + '50' },

  content:    { flex: 1, position: 'relative' },

  slideWrap:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.lg + 8 },
  iconWrap:   { width: 120, height: 120, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: S.xl },
  iconEmoji:  { fontSize: 60 },
  slideTitle: { fontSize: F.h1, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginBottom: S.md, lineHeight: 34 },
  slideBody:  { fontSize: F.body, color: theme.textSecondary, textAlign: 'center', lineHeight: 24 },

  habitsWrap:  { ...StyleSheet.absoluteFillObject, paddingHorizontal: S.lg, paddingTop: S.md },
  habitsTitle: { fontSize: F.h2, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5, marginBottom: S.sm },
  habitsSub:   { fontSize: F.label, color: theme.textMuted, lineHeight: 20, marginBottom: S.lg },
  habitsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  countRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: S.sm, paddingVertical: S.sm },
  countText:   { fontSize: F.label, color: theme.accentIndigoL, fontWeight: '600' },

  chip:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 10 },
  chipLabel: { fontSize: F.label, color: theme.textSecondary, fontWeight: '500' },
  chipCheck: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },

  nav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingVertical: S.sm },
  backBtn:  { padding: S.sm },
  backText: { fontSize: F.body, color: theme.textMuted, fontWeight: '500' },
  nextBtn:  { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.accentIndigo, paddingHorizontal: S.lg, paddingVertical: 14, borderRadius: R.lg },
  nextText: { fontSize: F.body, fontWeight: '700', color: '#fff' },
  skipBtn:  { alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? S.lg : S.md, paddingTop: 2 },
  skipText: { fontSize: F.small, color: theme.textMuted },
});