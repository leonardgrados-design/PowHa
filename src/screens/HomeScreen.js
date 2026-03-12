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
import { 
  Check, 
  LogOut, 
  Flame,
  ChevronRight,
  Inbox
} from 'lucide-react-native';

// Importaciones críticas de Firebase
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
// Añadimos updateDoc e increment a las importaciones
import { collection, query, where, onSnapshot, addDoc, getDocs, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';

export default function HomeScreen() {
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0 }); 
  const [habits, setHabits] = useState([]);
  
  // NUEVO ESTADO: Guarda los IDs de los hábitos que ya tienen un registro con la fecha de hoy
  const [completedTodayIds, setCompletedTodayIds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false); // Previene doble-clicks rápidos

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date().toLocaleDateString('en-CA'); 

    // 0. Listener del Perfil de Usuario (NUEVO)
    // Escucha en tiempo real la XP y calcula el nivel automáticamente
    const unsubscribeUser = onSnapshot(doc(db, 'usuarios', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setStats({
          xp: userData.xp_total || 0,
          level: Math.floor((userData.xp_total || 0) / 50) + 1, // Cálculo dinámico seguro
          streak: userData.racha_actual || 0
        });
      }
    }, (error) => console.error("Error perfil:", error));

    // 1. Listener de Hábitos
    const qHabits = query(collection(db, 'habitos'), where('user_id', '==', user.uid));
    const unsubscribeHabits = onSnapshot(qHabits, (querySnapshot) => {
      const habitosDescargados = [];
      querySnapshot.forEach((doc) => {
        habitosDescargados.push({ id: doc.id, ...doc.data() });
      });
      setHabits(habitosDescargados);
    }, (error) => console.error("Error hábitos:", error));

    // 2. Listener del HISTORIAL DE HOY (La arquitectura correcta)
    const qRegistros = query(
      collection(db, 'registros_habito'), 
      where('user_id', '==', user.uid),
      where('fecha_completado', '==', today)
    );
    
    const unsubscribeRegistros = onSnapshot(qRegistros, (querySnapshot) => {
      // Extraemos solo los IDs de los hábitos que se completaron hoy
      const completados = querySnapshot.docs.map(doc => doc.data().habit_id);
      setCompletedTodayIds(completados);
      setLoading(false);
    }, (error) => {
      console.error("Error registros:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeUser(); // Limpiamos el nuevo listener
      unsubscribeHabits();
      unsubscribeRegistros();
    };
  }, []);

  // ELIMINADO: Ya no necesitamos el useEffect local para calcular el nivel, el snapshot lo hace.

  // Lógica REAL de marcado/desmarcado conectada a la base de datos
  const toggleHabit = async (habit) => {
    if (isToggling) return; // Bloqueo temporal para evitar spam a la base de datos
    setIsToggling(true);

    const today = new Date().toLocaleDateString('en-CA');
    const isCompleted = completedTodayIds.includes(habit.id);
    const userRef = doc(db, 'usuarios', auth.currentUser.uid); // Referencia directa al documento del usuario

    try {
      if (isCompleted) {
        // DESMARCAR: Buscar el registro exacto de hoy y borrarlo
        const q = query(
          collection(db, 'registros_habito'), 
          where('habit_id', '==', habit.id), 
          where('fecha_completado', '==', today)
        );
        const snapshot = await getDocs(q);
        
        // Usamos forEach por si hay duplicados por error, borrar todos los de hoy
        snapshot.forEach(async (documento) => {
          await deleteDoc(doc(db, 'registros_habito', documento.id));
        });

        // Actualización atómica en Firebase: Restar XP
        await updateDoc(userRef, {
          xp_total: increment(-(habit.valor_xp || 10))
        });

      } else {
        // MARCAR: Insertar un nuevo registro (Log) de que se hizo hoy
        await addDoc(collection(db, 'registros_habito'), {
          user_id: auth.currentUser.uid,
          habit_id: habit.id,
          fecha_completado: today,
          xp_otorgada: habit.valor_xp || 10
        });

        // Actualización atómica en Firebase: Sumar XP
        await updateDoc(userRef, {
          xp_total: increment(habit.valor_xp || 10)
        });
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      Alert.alert("Error", "No se pudo actualizar el hábito.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth).catch((error) => console.log("Error al cerrar sesión:", error));
  };

  // Inyectamos el estado de 'completado_hoy' basado en el arreglo que viene del listener de registros
  const mappedHabits = habits.map(h => ({
    ...h,
    completado_hoy: completedTodayIds.includes(h.id)
  }));

  const physicalHabits = mappedHabits.filter(h => h.categoria === 'cuerpo');
  const mentalHabits = mappedHabits.filter(h => h.categoria === 'mente');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingText}>Hola, Explorador</Text>
            <Text style={styles.subGreetingText}>Es hora de evolucionar.</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.streakBadge}>
              <Flame size={18} color="#F97316" fill="#F97316" />
              <Text style={styles.streakText}>{stats.streak}</Text>
            </View>
            
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
              <LogOut size={20} color="#EF4444" />
            </TouchableOpacity>
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
               <Text style={styles.progressText}>{stats.xp % 50}/50 XP</Text>
            </View>
          </View>
          <View style={styles.avatarContainer}>
             <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{stats.level >= 5 ? "😎" : stats.level >= 3 ? "🙂" : "😐"}</Text>
             </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Sincronizando con la base de datos...</Text>
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Inbox size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No tienes hábitos activos</Text>
            <Text style={styles.emptyStateDesc}>Toca el botón central "+" en el menú inferior para crear tu primer objetivo diario.</Text>
          </View>
        ) : (
          <>
            {physicalHabits.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Cuerpo & Físico</Text>
                  <ChevronRight size={20} color="#1F2937" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <View style={styles.horizontalContainer}>
                    {physicalHabits.map(habit => (
                      <TouchableOpacity 
                        key={habit.id} 
                        style={[styles.habitCard, habit.completado_hoy && styles.habitCardCompleted]} 
                        onPress={() => toggleHabit(habit)} 
                        activeOpacity={0.8}
                        disabled={isToggling}
                      >
                        <View style={[styles.iconCircle, habit.completado_hoy && styles.iconCircleCompleted]}>
                          {habit.completado_hoy ? <Check size={30} color="#10B981" /> : <Text style={styles.emojiIcon}>{habit.icono}</Text>}
                        </View>
                        <Text style={[styles.habitTitle, habit.completado_hoy && styles.habitTitleCompleted]} numberOfLines={1}>{habit.titulo}</Text>
                        <Text style={styles.xpBadge}>+{habit.valor_xp || 10} XP</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {mentalHabits.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mente & Enfoque</Text>
                  <ChevronRight size={20} color="#1F2937" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <View style={styles.horizontalContainer}>
                    {mentalHabits.map(habit => (
                      <TouchableOpacity 
                        key={habit.id} 
                        style={[styles.habitCard, habit.completado_hoy && styles.habitCardCompleted]} 
                        onPress={() => toggleHabit(habit)} 
                        activeOpacity={0.8}
                        disabled={isToggling}
                      >
                        <View style={[styles.iconCircle, habit.completado_hoy && styles.iconCircleCompleted]}>
                          {habit.completado_hoy ? <Check size={30} color="#10B981" /> : <Text style={styles.emojiIcon}>{habit.icono}</Text>}
                        </View>
                        <Text style={[styles.habitTitle, habit.completado_hoy && styles.habitTitleCompleted]} numberOfLines={1}>{habit.titulo}</Text>
                        <Text style={styles.xpBadge}>+{habit.valor_xp || 15} XP</Text>
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
  greetingText: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  subGreetingText: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEDD5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakText: { color: '#EA580C', fontWeight: 'bold', fontSize: 16, marginLeft: 4 },
  logoutButton: { backgroundColor: '#FEE2E2', padding: 8, borderRadius: 10 },
  bannerContainer: { backgroundColor: '#F3F4F6', borderRadius: 20, marginHorizontal: 16, marginTop: 24, padding: 20, flexDirection: 'row', alignItems: 'center' },
  bannerTextContainer: { flex: 1, paddingRight: 10 },
  bannerTitle: { fontSize: 24, fontWeight: 'black', color: '#1F2937' },
  bannerSubtitle: { fontSize: 14, color: '#4B5563', marginTop: 4, marginBottom: 12 },
  progressContainer: { width: '100%' },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressText: { fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: 'bold' },
  avatarContainer: { justifyContent: 'center', alignItems: 'center' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, elevation: 4 },
  avatarEmoji: { fontSize: 40 },
  
  centerContent: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14, fontWeight: '500' },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30, backgroundColor: '#F9FAFB', marginHorizontal: 16, borderRadius: 16, paddingVertical: 40, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 16, marginBottom: 8 },
  emptyStateDesc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 35, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginRight: 4 },
  horizontalScroll: { paddingLeft: 16 },
  horizontalContainer: { flexDirection: 'row', paddingRight: 16 },
  habitCard: { width: 130, padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, alignItems: 'center', marginRight: 16 },
  habitCardCompleted: { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconCircleCompleted: { backgroundColor: '#ECFDF5' },
  emojiIcon: { fontSize: 28 },
  habitTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 4 },
  habitTitleCompleted: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  xpBadge: { fontSize: 12, fontWeight: 'bold', color: '#F97316' },
});