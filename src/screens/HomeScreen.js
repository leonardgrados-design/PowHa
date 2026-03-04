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
} from 'react-native';
import { 
  Check, 
  LogOut, // Importamos el icono de cerrar sesión
  Flame,
  ChevronRight
} from 'lucide-react-native';

// Importamos Firebase para poder cerrar sesión
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

export default function HomeScreen() {
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 3 });
  
  const [habits, setHabits] = useState([
    { id: 1, title: "Tomar agua", category: "cuerpo", completed: false, xpValue: 10, icon: "💧" },
    { id: 2, title: "Gym (1 hr)", category: "cuerpo", completed: false, xpValue: 20, icon: "🏋️" },
    { id: 3, title: "Leer 10 min", category: "mente", completed: false, xpValue: 15, icon: "📚" },
  ]);

  useEffect(() => {
    const newLevel = Math.floor(stats.xp / 50) + 1;
    if (newLevel !== stats.level) setStats(prev => ({ ...prev, level: newLevel }));
  }, [stats.xp]);

  const toggleHabit = (id) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const isCompleting = !habit.completed;
        const xpChange = isCompleting ? habit.xpValue : -habit.xpValue;
        setStats(prev => ({ ...prev, xp: prev.xp + xpChange }));
        return { ...habit, completed: !habit.completed };
      }
      return habit;
    }));
  };

  // Función crítica: Esto mata la sesión en Firebase y obligará a App.js a mostrar el Login
  const handleSignOut = () => {
    signOut(auth).catch((error) => console.log("Error al cerrar sesión:", error));
  };

  const physicalHabits = habits.filter(h => h.category === 'cuerpo');
  const mentalHabits = habits.filter(h => h.category === 'mente');

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
            
            {/* BOTÓN DE CERRAR SESIÓN */}
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cuerpo & Físico</Text>
          <ChevronRight size={20} color="#1F2937" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.horizontalContainer}>
            {physicalHabits.map(habit => (
              <TouchableOpacity key={habit.id} style={[styles.habitCard, habit.completed && styles.habitCardCompleted]} onPress={() => toggleHabit(habit.id)} activeOpacity={0.8}>
                <View style={[styles.iconCircle, habit.completed && styles.iconCircleCompleted]}>
                  {habit.completed ? <Check size={30} color="#10B981" /> : <Text style={styles.emojiIcon}>{habit.icon}</Text>}
                </View>
                <Text style={[styles.habitTitle, habit.completed && styles.habitTitleCompleted]} numberOfLines={1}>{habit.title}</Text>
                <Text style={styles.xpBadge}>+{habit.xpValue} XP</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mente & Enfoque</Text>
          <ChevronRight size={20} color="#1F2937" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.horizontalContainer}>
            {mentalHabits.map(habit => (
              <TouchableOpacity key={habit.id} style={[styles.habitCard, habit.completed && styles.habitCardCompleted]} onPress={() => toggleHabit(habit.id)} activeOpacity={0.8}>
                <View style={[styles.iconCircle, habit.completed && styles.iconCircleCompleted]}>
                  {habit.completed ? <Check size={30} color="#10B981" /> : <Text style={styles.emojiIcon}>{habit.icon}</Text>}
                </View>
                <Text style={[styles.habitTitle, habit.completed && styles.habitTitleCompleted]} numberOfLines={1}>{habit.title}</Text>
                <Text style={styles.xpBadge}>+{habit.xpValue} XP</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scrollContent: { paddingBottom: 20 },
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