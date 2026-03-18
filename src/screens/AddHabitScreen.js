import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Check, Flame, ChevronRight, Inbox, CheckCircle2 } from 'lucide-react-native';

import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, deleteDoc, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0 }); 
  const [habits, setHabits] = useState([]);
  const [completedTodayIds, setCompletedTodayIds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA'); 

    // 1. LISTENER DE PERFIL
    const unsubscribeUser = onSnapshot(doc(db, 'usuarios', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');
        
        let displayStreak = userData.racha_actual || 0;
        const ultimaFecha = userData.ultima_fecha_racha;

        if (ultimaFecha && ultimaFecha !== todayStr && ultimaFecha !== yesterdayStr) {
            displayStreak = 0;
        }

        setStats({
          xp: userData.xp_total || 0,
          level: Math.floor((userData.xp_total || 0) / 50) + 1,
          streak: displayStreak
        });
      }
    }, (error) => {
      // PARCHE DE RACE CONDITION: Si el error es por falta de permisos (cierre de sesión), lo ignoramos silenciosamente.
      if (error.code === 'permission-denied') return;
      console.error("Error perfil:", error);
    });

    // 2. LISTENER DE HÁBITOS
    const qHabits = query(
      collection(db, 'habitos'), 
      where('user_id', '==', user.uid),
      where('activo', '==', true) 
    );
    const unsubscribeHabits = onSnapshot(qHabits, (querySnapshot) => {
      const habitosDescargados = [];
      querySnapshot.forEach((documento) => {
        habitosDescargados.push({ id: documento.id, ...documento.data() });
      });
      setHabits(habitosDescargados);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.error("Error hábitos:", error);
    });

    // 3. LISTENER DEL HISTORIAL DE HOY
    const qRegistros = query(
      collection(db, 'registros_habito'), 
      where('user_id', '==', user.uid),
      where('fecha_completado', '==', todayStr)
    );
    const unsubscribeRegistros = onSnapshot(qRegistros, (querySnapshot) => {
      const completados = querySnapshot.docs.map(doc => doc.data().habit_id);
      setCompletedTodayIds(completados);
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.error("Error registros:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeHabits();
      unsubscribeRegistros();
    };
  }, []);

  const toggleHabit = async (habit) => {
    if (isToggling) return; 
    setIsToggling(true);

    const todayStr = new Date().toLocaleDateString('en-CA');
    const isCompleted = completedTodayIds.includes(habit.id);
    const userRef = doc(db, 'usuarios', auth.currentUser.uid); 

    try {
      if (isCompleted) {
        const q = query(collection(db, 'registros_habito'), where('habit_id', '==', habit.id), where('fecha_completado', '==', todayStr));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (documento) => {
          await deleteDoc(doc(db, 'registros_habito', documento.id));
        });
        await updateDoc(userRef, { xp_total: increment(-(habit.valor_xp || 10)) });
      } else {
        await addDoc(collection(db, 'registros_habito'), {
          user_id: auth.currentUser.uid,
          habit_id: habit.id,
          fecha_completado: todayStr,
          xp_otorgada: habit.valor_xp || 10
        });

        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        const ultimaFecha = userData.ultima_fecha_racha;
        const rachaActual = userData.racha_actual || 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');

        let updateData = { xp_total: increment(habit.valor_xp || 10) };

        if (ultimaFecha !== todayStr) {
          if (ultimaFecha === yesterdayStr) {
            updateData.racha_actual = rachaActual + 1; 
          } else {
            updateData.racha_actual = 1; 
          }
          updateData.ultima_fecha_racha = todayStr;
        }
        await updateDoc(userRef, updateData);
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      Alert.alert("Error de Sincronización", "No se pudo guardar el progreso.");
    } finally {
      setIsToggling(false);
    }
  };

  const mappedHabits = habits.map(h => ({
    ...h,
    completado_hoy: completedTodayIds.includes(h.id)
  }));

  const pendingPhysical = mappedHabits.filter(h => h.categoria === 'cuerpo' && !h.completado_hoy);
  const pendingMental = mappedHabits.filter(h => h.categoria === 'mente' && !h.completado_hoy);
  const completedToday = mappedHabits.filter(h => h.completado_hoy);
  const isAllDone = pendingPhysical.length === 0 && pendingMental.length === 0 && completedToday.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingText}>Hola de nuevo</Text>
            <Text style={styles.subGreetingText}>Es hora de evolucionar.</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.streakBadge}>
              <Flame size={18} color="#F97316" fill={stats.streak > 0 ? "#F97316" : "transparent"} />
              <Text style={styles.streakText}>{stats.streak}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bannerContainer}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Nivel {stats.level}</Text>
            <Text style={styles.bannerSubtitle}>{stats.xp} XP Total Acumulada</Text>
            <View style={styles.progressContainer}>
               <View style={styles.progressBarBg}>
                 <View style={[styles.progressBarFill, { width: `${(stats.xp % 50) * 2}%` }]} />
               </View>
               <Text style={styles.progressText}>{stats.xp % 50}/50 XP para el siguiente nivel</Text>
            </View>
          </View>
          <View style={styles.avatarContainer}>
             <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{stats.level >= 5 ? "😎" : stats.level >= 3 ? "🔥" : "😐"}</Text>
             </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Inbox size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No tienes hábitos activos</Text>
            <Text style={styles.emptyStateDesc}>Toca el botón "+" en el menú inferior para crear tu primer objetivo.</Text>
          </View>
        ) : (
          <>
            {isAllDone && (
              <View style={styles.allDoneContainer}>
                <CheckCircle2 size={40} color="#10B981" />
                <Text style={styles.allDoneTitle}>¡Día completado!</Text>
                <Text style={styles.allDoneDesc}>Has terminado todos tus objetivos por hoy.</Text>
              </View>
            )}

            {pendingPhysical.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Cuerpo & Físico</Text>
                  <ChevronRight size={20} color="#1F2937" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <View style={styles.horizontalContainer}>
                    {pendingPhysical.map(habit => (
                      <TouchableOpacity key={habit.id} style={styles.habitCard} onPress={() => toggleHabit(habit)} activeOpacity={0.8} disabled={isToggling}>
                        <View style={styles.iconCircle}>
                          <Text style={styles.emojiIcon}>{habit.icono}</Text>
                        </View>
                        <Text style={styles.habitTitle} numberOfLines={1}>{habit.titulo}</Text>
                        <Text style={styles.xpBadge}>+{habit.valor_xp || 10} XP</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {pendingMental.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mente & Enfoque</Text>
                  <ChevronRight size={20} color="#1F2937" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <View style={styles.horizontalContainer}>
                    {pendingMental.map(habit => (
                      <TouchableOpacity key={habit.id} style={styles.habitCard} onPress={() => toggleHabit(habit)} activeOpacity={0.8} disabled={isToggling}>
                        <View style={styles.iconCircle}>
                          <Text style={styles.emojiIcon}>{habit.icono}</Text>
                        </View>
                        <Text style={styles.habitTitle} numberOfLines={1}>{habit.titulo}</Text>
                        <Text style={styles.xpBadge}>+{habit.valor_xp || 15} XP</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {completedToday.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: pendingPhysical.length === 0 && pendingMental.length === 0 ? 15 : 40 }]}>
                  <Text style={[styles.sectionTitle, { color: '#9CA3AF' }]}>Completados Hoy</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <View style={styles.horizontalContainer}>
                    {completedToday.map(habit => (
                      <TouchableOpacity key={habit.id} style={[styles.habitCard, styles.habitCardCompleted]} onPress={() => toggleHabit(habit)} activeOpacity={0.8} disabled={isToggling}>
                        <View style={[styles.iconCircle, styles.iconCircleCompleted]}>
                          <Check size={30} color="#10B981" />
                        </View>
                        <Text style={[styles.habitTitle, styles.habitTitleCompleted]} numberOfLines={1}>{habit.titulo}</Text>
                        <Text style={[styles.xpBadge, { color: '#9CA3AF' }]}>Hecho</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scrollContent: { paddingBottom: 40 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 10 },
  greetingText: { fontSize: 22, fontWeight: '900', color: '#1F2937' },
  subGreetingText: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEDD5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  streakText: { color: '#EA580C', fontWeight: 'bold', fontSize: 16, marginLeft: 6 },
  bannerContainer: { backgroundColor: '#F3F4F6', borderRadius: 20, marginHorizontal: 16, marginTop: 24, padding: 20, flexDirection: 'row', alignItems: 'center' },
  bannerTextContainer: { flex: 1, paddingRight: 10 },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#1F2937' },
  bannerSubtitle: { fontSize: 14, color: '#4B5563', marginTop: 4, marginBottom: 12, fontWeight: '500' },
  progressContainer: { width: '100%' },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressText: { fontSize: 11, color: '#6B7280', marginTop: 6, fontWeight: '600' },
  avatarContainer: { justifyContent: 'center', alignItems: 'center' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, elevation: 4 },
  avatarEmoji: { fontSize: 40 },
  centerContent: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30, backgroundColor: '#F9FAFB', marginHorizontal: 16, borderRadius: 16, paddingVertical: 40, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 16, marginBottom: 8 },
  emptyStateDesc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  allDoneContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, marginHorizontal: 16, backgroundColor: '#ECFDF5', borderRadius: 16, marginTop: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  allDoneTitle: { fontSize: 18, fontWeight: 'bold', color: '#065F46', marginTop: 10 },
  allDoneDesc: { fontSize: 14, color: '#047857', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 35, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginRight: 4 },
  horizontalScroll: { paddingLeft: 16 },
  horizontalContainer: { flexDirection: 'row', paddingRight: 16 },
  habitCard: { width: 130, padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, alignItems: 'center', marginRight: 16 },
  habitCardCompleted: { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconCircleCompleted: { backgroundColor: '#ECFDF5' },
  emojiIcon: { fontSize: 28 },
  habitTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 4 },
  habitTitleCompleted: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  xpBadge: { fontSize: 12, fontWeight: 'bold', color: '#F97316' },
});