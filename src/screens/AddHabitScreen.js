import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Animated,
} from 'react-native';
import {
  ArrowLeft, Dumbbell, Brain, Sun, Sunset,
  Moon, Clock, Zap, Repeat, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react-native';

import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { C, S, R, F, common } from '../theme';
import { scheduleHabitNotification, scheduleCompletionReminder, requestNotificationPermissions } from '../services/NotificationService';

const SUGERENCIAS = [
  { titulo: 'Beber 2L de agua', categoria: 'cuerpo', icono: '💧' },
  { titulo: 'Leer 15 min',      categoria: 'mente',  icono: '📚' },
  { titulo: 'Caminar 30 min',   categoria: 'cuerpo', icono: '🚶' },
  { titulo: 'Meditar 10 min',   categoria: 'mente',  icono: '🧘' },
  { titulo: 'Comer fruta',      categoria: 'cuerpo', icono: '🍎' },
  { titulo: 'Sin redes 1h',     categoria: 'mente',  icono: '🧠' },
];

const ICONOS = ['🏃','📚','🥗','🧘','💧','🚶','🍎','🚴','🧠','🦷','🐕','⭐','🚭','💻','💤','🎯','🏋️','✍️'];

const HORARIOS = [
  { key: 'cualquiera', label: 'Libre',   Icon: Clock  },
  { key: 'mañana',     label: 'Mañana',  Icon: Sun    },
  { key: 'tarde',      label: 'Tarde',   Icon: Sunset },
  { key: 'noche',      label: 'Noche',   Icon: Moon   },
];

const DIAS = [
  { key: 1, label: 'L' }, { key: 2, label: 'M' }, { key: 3, label: 'X' },
  { key: 4, label: 'J' }, { key: 5, label: 'V' }, { key: 6, label: 'S' },
  { key: 0, label: 'D' },
];

const FRECUENCIAS = [
  { key: 'diario',           label: 'Diario',          sub: 'Todos los días',      Icon: Repeat   },
  { key: 'entre_semana',     label: 'Entre semana',     sub: 'Lun → Vie',           Icon: Calendar },
  { key: 'fines_semana',     label: 'Fines de semana',  sub: 'Sáb y Dom',           Icon: Calendar },
  { key: 'dias_especificos', label: 'Días específicos', sub: 'Elige cuáles',        Icon: Calendar },
  { key: 'cada_x_dias',      label: 'Cada X días',      sub: 'Define el intervalo', Icon: Repeat   },
];

function Chip({ label, active, onPress, color = C.accentIndigo, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,   useNativeDriver: true, tension: 200 }).start()}
        style={[common.chip, active && { backgroundColor: color + '22', borderColor: color }]}>
        {children}
        <Text style={[common.chipLabel, active && { color }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AddHabitScreen({
  const { theme } = useTheme(); navigation }) {
  const [titulo,       setTitulo]       = useState('');
  const [categoria,    setCategoria]    = useState('cuerpo');
  const [horario,      setHorario]      = useState('cualquiera');
  const [icono,        setIcono]        = useState('⭐');
  const [loading,      setLoading]      = useState(false);
  const [frecuencia,   setFrecuencia]   = useState('diario');
  const [diasSemana,   setDiasSemana]   = useState([1, 2, 3, 4, 5]);
  const [cadaXDias,    setCadaXDias]    = useState(2);
  const [freqExpanded, setFreqExpanded] = useState(false);

  const inputRef = useRef(null);
  const btnScale = useRef(new Animated.Value(1)).current;
  const canSave  = titulo.trim().length > 0 && !loading;

  const aplicarSugerencia = (s) => {
    setTitulo(s.titulo); setCategoria(s.categoria); setIcono(s.icono);
    inputRef.current?.blur();
  };
  const toggleDia = (d) => setDiasSemana(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const buildFreq = () => {
    switch (frecuencia) {
      case 'diario':           return { frecuencia: 'diario',           dias_semana: [0,1,2,3,4,5,6], cada_x_dias: null };
      case 'entre_semana':     return { frecuencia: 'entre_semana',     dias_semana: [1,2,3,4,5],     cada_x_dias: null };
      case 'fines_semana':     return { frecuencia: 'fines_semana',     dias_semana: [0,6],           cada_x_dias: null };
      case 'dias_especificos': return { frecuencia: 'dias_especificos', dias_semana: diasSemana,      cada_x_dias: null };
      case 'cada_x_dias':      return { frecuencia: 'cada_x_dias',      dias_semana: null,            cada_x_dias: cadaXDias };
      default:                 return { frecuencia: 'diario',           dias_semana: [0,1,2,3,4,5,6], cada_x_dias: null };
    }
  };

  const crearHabit = async () => {
    if (!canSave) return;
    if (frecuencia === 'dias_especificos' && diasSemana.length === 0) {
      Alert.alert('Atención', 'Selecciona al menos un día.');
      return;
    }
    const user = auth.currentUser;
    if (!user) { Alert.alert('Error', 'No hay sesión activa.'); return; }

    setLoading(true);
    try {
      const freqPayload = buildFreq();
      const docRef = await addDoc(collection(db, 'habitos'), {
        user_id:      user.uid,
        titulo:       titulo.trim(),
        categoria,
        icono,
        horario,
        valor_xp:     categoria === 'cuerpo' ? 20 : 15,
        activo:       true,
        fecha_inicio: new Date().toISOString().split('T')[0],
        ...freqPayload,
        created_at:   serverTimestamp(),
      });

      // Schedule notification for the new habit
      const granted = await requestNotificationPermissions();
      if (granted) {
        const newHabit = {
          id:       docRef.id,
          titulo:   titulo.trim(),
          icono,
          horario,
          valor_xp: categoria === 'cuerpo' ? 20 : 15,
          ...freqPayload,
        };
        await scheduleHabitNotification(newHabit);
        await scheduleCompletionReminder(newHabit);
      }

      // Reset form
      setTitulo(''); setCategoria('cuerpo'); setHorario('cualquiera');
      setIcono('⭐'); setFrecuencia('diario'); setDiasSemana([1,2,3,4,5]); setCadaXDias(2);
      navigation.navigate('Inicio');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el hábito.');
    } finally {
      setLoading(false);
    }
  };

  const catColor  = categoria === 'cuerpo' ? C.accentTeal : C.accentPink;
  const xpValue   = categoria === 'cuerpo' ? 20 : 15;
  const freqLabel = FRECUENCIAS.find(f => f.key === frecuencia)?.label || 'Diario';
  const freqSub   = frecuencia === 'dias_especificos' ? `${diasSemana.length}d/sem`
                  : frecuencia === 'cada_x_dias'      ? `Cada ${cadaXDias} días`
                  : FRECUENCIAS.find(f => f.key === frecuencia)?.sub;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bgBase }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        <View style={common.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={common.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowLeft size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={common.topBarTitle}>Nuevo hábito</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill, borderWidth: 0.5, borderColor: catColor + '60', backgroundColor: catColor + '18' }}>
            <Zap size={11} color={catColor} />
            <Text style={{ fontSize: F.small, fontWeight: '700', color: catColor }}>+{xpValue} XP</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: S.lg, paddingTop: S.lg }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Suggestions */}
          <Text style={common.sectionLabel}>Sugerencias rápidas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm, marginBottom: S.lg }}>
            {SUGERENCIAS.map((s, i) => (
              <TouchableOpacity key={i} activeOpacity={0.7}
                style={[styles.suggChip, titulo === s.titulo && { borderColor: catColor, backgroundColor: catColor + '18' }]}
                onPress={() => aplicarSugerencia(s)}>
                <Text style={{ fontSize: 15 }}>{s.icono}</Text>
                <Text style={[styles.suggText, titulo === s.titulo && { color: theme.textPrimary }]}>{s.titulo}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Name */}
          <Text style={common.sectionLabel}>Nombre del hábito</Text>
          <View style={[common.inputWrap, { marginBottom: 28 }]}>
            <Text style={{ fontSize: 22 }}>{icono}</Text>
            <TextInput ref={inputRef} style={styles.input} placeholder="Ej. Correr 5 km"
              placeholderTextColor={theme.textMuted} value={titulo} onChangeText={setTitulo}
              maxLength={40} returnKeyType="done" />
            {titulo.length > 0 && <Text style={{ fontSize: F.caption, color: theme.textMuted }}>{titulo.length}/40</Text>}
          </View>

          {/* Category */}
          <Text style={common.sectionLabel}>Categoría</Text>
          <View style={{ flexDirection: 'row', gap: S.sm, marginBottom: 28 }}>
            {[{ key: 'cuerpo', label: 'Físico', color: C.accentTeal, Icon: Dumbbell },
              { key: 'mente',  label: 'Mental', color: C.accentPink, Icon: Brain   }].map(({ key, label, color, Icon }) => (
              <TouchableOpacity key={key} activeOpacity={0.8} onPress={() => setCategoria(key)}
                style={[styles.catBtn, categoria === key && { borderColor: color, backgroundColor: color + '18' }]}>
                <Icon size={18} color={categoria === key ? color : theme.textMuted} />
                <Text style={[styles.catLabel, categoria === key && { color }]}>{label}</Text>
                {categoria === key && <View style={[styles.catDot, { backgroundColor: color }]} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Schedule */}
          <Text style={common.sectionLabel}>Momento del día</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: 28 }}>
            {HORARIOS.map(({ key, label, Icon }) => (
              <Chip key={key} label={label} active={horario === key} onPress={() => setHorario(key)} color={C.accentIndigo}>
                <Icon size={14} color={horario === key ? C.accentIndigo : theme.textMuted} style={{ marginRight: 4 }} />
              </Chip>
            ))}
          </View>

          {/* Repetition */}
          <Text style={common.sectionLabel}>Repetición</Text>
          <TouchableOpacity style={styles.freqHeader} onPress={() => setFreqExpanded(v => !v)} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.freqIcon, { backgroundColor: C.accentIndigo + '20' }]}>
                <Repeat size={16} color={C.accentIndigo} />
              </View>
              <View>
                <Text style={styles.freqHeaderTitle}>{freqLabel}</Text>
                <Text style={styles.freqHeaderSub}>{freqSub}</Text>
              </View>
            </View>
            {freqExpanded ? <ChevronUp size={18} color={theme.textMuted} /> : <ChevronDown size={18} color={theme.textMuted} />}
          </TouchableOpacity>

          {freqExpanded && (
            <View style={styles.freqPanel}>
              {FRECUENCIAS.map(({ key, label, sub, Icon }) => (
                <TouchableOpacity key={key} activeOpacity={0.8} onPress={() => setFrecuencia(key)}
                  style={[styles.freqOption, frecuencia === key && { backgroundColor: C.accentIndigo + '12' }]}>
                  <View style={[styles.freqOptionIcon, frecuencia === key && { backgroundColor: C.accentIndigo + '30' }]}>
                    <Icon size={15} color={frecuencia === key ? C.accentIndigoL : theme.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.freqOptionLabel, frecuencia === key && { color: theme.accentIndigoL }]}>{label}</Text>
                    <Text style={styles.freqOptionSub}>{sub}</Text>
                  </View>
                  {frecuencia === key && (
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.accentIndigo, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {frecuencia === 'dias_especificos' && (
                <View style={styles.extraPanel}>
                  <Text style={styles.extraLabel}>Elige los días</Text>
                  <View style={{ flexDirection: 'row', gap: S.sm, justifyContent: 'center' }}>
                    {DIAS.map(({ key, label }) => (
                      <TouchableOpacity key={key} activeOpacity={0.8} onPress={() => toggleDia(key)}
                        style={[styles.dayBtn, diasSemana.includes(key) && { backgroundColor: C.accentIndigo, borderColor: C.accentIndigo }]}>
                        <Text style={[styles.dayBtnText, diasSemana.includes(key) && { color: '#fff', fontWeight: '700' }]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {frecuencia === 'cada_x_dias' && (
                <View style={styles.extraPanel}>
                  <Text style={styles.extraLabel}>Cada cuántos días</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.lg }}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setCadaXDias(v => Math.max(1, v - 1))}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', minWidth: 60 }}>
                      <Text style={styles.stepValue}>{cadaXDias}</Text>
                      <Text style={{ fontSize: F.small, color: theme.textMuted, marginTop: -2 }}>días</Text>
                    </View>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setCadaXDias(v => Math.min(30, v + 1))}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Icons */}
          <Text style={[common.sectionLabel, { marginTop: 28 }]}>Ícono</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.sm }}>
            {ICONOS.map((ic, i) => (
              <TouchableOpacity key={i} onPress={() => setIcono(ic)} activeOpacity={0.7}
                style={[styles.iconBtn, icono === ic && { borderColor: catColor, backgroundColor: catColor + '18' }]}>
                <Text style={{ fontSize: 24 }}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Save */}
        <View style={{ paddingHorizontal: S.lg, paddingVertical: S.md, borderTopWidth: 0.5, borderTopColor: theme.borderDefault, backgroundColor: theme.bgBase }}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity onPress={crearHabit} disabled={!canSave} activeOpacity={1}
              onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start()}
              onPressOut={() => Animated.spring(btnScale, { toValue: 1,   useNativeDriver: true, tension: 200 }).start()}
              style={[common.primaryBtn, { backgroundColor: canSave ? C.accentIndigo : C.bgElevated }]}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Zap size={18} color={canSave ? '#fff' : theme.textMuted} fill={canSave ? '#fff' : 'none'} />
                  <Text style={[common.primaryBtnText, !canSave && { color: theme.textMuted }]}>Guardar hábito</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: theme.bgBase, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  input:           { flex: 1, fontSize: F.body, color: theme.textPrimary, fontWeight: '500' },
  suggChip:        { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill },
  suggText:        { fontSize: F.label, color: theme.textSecondary, fontWeight: '500' },
  catBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, borderRadius: R.lg, paddingVertical: S.md },
  catLabel:        { fontSize: F.body, fontWeight: '700', color: theme.textMuted },
  catDot:          { position: 'absolute', bottom: 8, width: 5, height: 5, borderRadius: 3 },
  freqHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, borderRadius: R.lg, padding: 14, marginBottom: S.sm },
  freqIcon:        { width: 36, height: 36, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  freqHeaderTitle: { fontSize: F.body, fontWeight: '600', color: theme.textPrimary },
  freqHeaderSub:   { fontSize: F.small, color: theme.textMuted, marginTop: 1 },
  freqPanel:       { backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, borderRadius: R.lg, overflow: 'hidden', marginBottom: 28 },
  freqOption:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: C.borderDefault },
  freqOptionIcon:  { width: 32, height: 32, borderRadius: S.sm, backgroundColor: theme.bgElevated, alignItems: 'center', justifyContent: 'center' },
  freqOptionLabel: { fontSize: F.label, fontWeight: '600', color: theme.textSecondary },
  freqOptionSub:   { fontSize: F.small, color: theme.textMuted, marginTop: 1 },
  extraPanel:      { padding: 14, borderTopWidth: 0.5, borderTopColor: theme.borderDefault },
  extraLabel:      { fontSize: F.small, color: theme.textMuted, fontWeight: '600', marginBottom: S.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayBtn:          { width: 38, height: 38, borderRadius: R.md, backgroundColor: theme.bgElevated, borderWidth: 0.5, borderColor: theme.borderStrong, alignItems: 'center', justifyContent: 'center' },
  dayBtnText:      { fontSize: F.label, fontWeight: '600', color: theme.textMuted },
  stepBtn:         { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.bgElevated, borderWidth: 0.5, borderColor: theme.borderStrong, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:     { fontSize: 22, color: theme.accentIndigoL, fontWeight: '300', lineHeight: 26 },
  stepValue:       { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -1 },
  iconBtn:         { width: 54, height: 54, borderRadius: R.lg, backgroundColor: theme.bgCard, borderWidth: 0.5, borderColor: theme.borderStrong, alignItems: 'center', justifyContent: 'center' },
});