import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Trophy, Check, Plus, Flame, User } from 'lucide-react-native';

// --- COMPONENTES INTERNOS ---
const Avatar = ({ level }) => {
  const getAvatarColor = () => {
    if (level >= 5) return "#FACC15"; 
    if (level >= 3) return "#60A5FA"; 
    return "#D1D5DB"; 
  };
  const getEmoji = () => {
    if (level >= 5) return "😎";
    if (level >= 3) return "🙂";
    return "😐";
  };
  return (
    <View style={styles.avatarContainer}>
      <View style={[styles.avatarCircle, { borderColor: getAvatarColor() }]}>
        <Text style={styles.avatarEmoji}>{getEmoji()}</Text>
      </View>
      <Text style={styles.levelText}>Nivel {level}</Text>
      <Text style={styles.subText}>Sigue así para evolucionar</Text>
    </View>
  );
};

const HabitCard = ({ habit, onToggle }) => {
  return (
    <TouchableOpacity onPress={() => onToggle(habit.id)} activeOpacity={0.7} style={[styles.card, habit.completed ? styles.cardCompleted : styles.cardActive]}>
      <View style={styles.cardLeft}>
        <View style={[styles.checkCircle, habit.completed && styles.checkCircleCompleted]}>
          {habit.completed && <Check size={14} color="white" />}
        </View>
        <Text style={[styles.habitTitle, habit.completed && styles.habitTitleCompleted]}>{habit.title}</Text>
      </View>
      <View style={styles.xpBadge}>
        <Flame size={16} color="#F97316" />
        <Text style={styles.xpText}>+{habit.xpValue} XP</Text>
      </View>
    </TouchableOpacity>
  );
};

// --- PANTALLA ---
export default function HomeScreen() {
  const [stats, setStats] = useState({ xp: 0, level: 1 });
  const [habits, setHabits] = useState([
    { id: 1, title: "Tomar agua", completed: false, xpValue: 10 },
    { id: 2, title: "Leer 10 min", completed: false, xpValue: 15 },
    { id: 3, title: "Ir al Gym", completed: false, xpValue: 20 },
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

  const addHabit = () => {
    const newId = Date.now();
    setHabits([...habits, { id: newId, title: "Nuevo Hábito", completed: false, xpValue: 10 }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.xpContainer}>
            <View style={styles.iconBox}><Trophy size={20} color="white" /></View>
            <View>
              <Text style={styles.labelXP}>TU XP TOTAL</Text>
              <Text style={styles.valueXP}>{stats.xp} XP</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.labelXP}>RACHA</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.streakText}>3 Días</Text>
              <Flame size={14} color="#FB923C" fill="#FB923C" />
            </View>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>Nvl {stats.level}</Text>
            <Text style={styles.progressText}>Nvl {stats.level + 1}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(stats.xp % 50) * 2}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Avatar level={stats.level} />
        <Text style={styles.sectionTitle}>Tus Objetivos de Hoy</Text>
        {habits.map(habit => <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} />)}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={addHabit}><Plus size={30} color="white" /></TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Check size={24} color="#2563EB" /><Text style={[styles.navText, { color: '#2563EB' }]}>Hábitos</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><User size={24} color="#9CA3AF" /><Text style={styles.navText}>Perfil</Text></TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: { backgroundColor: '#1F2937', padding: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  xpContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { backgroundColor: '#EAB308', padding: 8, borderRadius: 8 },
  labelXP: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  valueXP: { color: 'white', fontSize: 24, fontWeight: '900' },
  streakText: { color: '#FB923C', fontWeight: 'bold', marginRight: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressText: { color: '#9CA3AF', fontSize: 10 },
  progressBarBg: { height: 8, backgroundColor: '#374151', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#60A5FA', borderRadius: 4 },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 15, marginTop: 10 },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 5 },
  avatarEmoji: { fontSize: 50 },
  levelText: { marginTop: 10, fontSize: 18, fontWeight: 'bold', color: '#374151' },
  subText: { fontSize: 12, color: '#6B7280' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  cardActive: { backgroundColor: 'white', borderColor: '#E5E7EB', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  cardCompleted: { backgroundColor: '#ECFDF5', borderColor: '#10B981', opacity: 0.8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkCircleCompleted: { backgroundColor: '#10B981', borderColor: '#10B981' },
  habitTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  habitTitleCompleted: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpText: { fontSize: 12, fontWeight: 'bold', color: '#F97316' },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 8 },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingVertical: 10, paddingBottom: 25 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, fontWeight: 'bold', marginTop: 4, color: '#9CA3AF' },
});