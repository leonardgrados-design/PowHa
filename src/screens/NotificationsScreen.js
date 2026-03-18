import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { Bell, BellOff, Clock, ChevronRight } from "lucide-react-native";

import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function NotificationsScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [completedTodayIds, setCompletedTodayIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toLocaleDateString('en-CA');

    const qHabits = query(
      collection(db, 'habitos'), 
      where('user_id', '==', user.uid),
      where('activo', '==', true)
    );
    
    const unsubscribeHabits = onSnapshot(qHabits, (snap) => {
      const loadedHabits = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(loadedHabits);
    }, (error) => {
      // PARCHE CRÍTICO: Evitar crash al cerrar sesión
      if (error.code === 'permission-denied') return;
      console.error("Error en Snapshot Notif-Habitos:", error);
    });

    const qRecords = query(
      collection(db, 'registros_habito'),
      where('user_id', '==', user.uid),
      where('fecha_completado', '==', today)
    );

    const unsubscribeRecords = onSnapshot(qRecords, (snap) => {
      const completed = snap.docs.map(doc => doc.data().habit_id);
      setCompletedTodayIds(completed);
      setLoading(false);
    }, (error) => {
      // PARCHE CRÍTICO: Evitar crash al cerrar sesión
      if (error.code === 'permission-denied') return;
      console.error("Error en Snapshot Notif-Records:", error);
    });

    return () => {
      unsubscribeHabits();
      unsubscribeRecords();
    };
  }, []);

  const pendingReminders = habits
    .filter(habit => !completedTodayIds.includes(habit.id))
    .map(habit => ({
      id: habit.id,
      titulo: "Recordatorio Pendiente",
      mensaje: `No olvides completar: ${habit.titulo}`,
      time: habit.horario === 'cualquiera' ? 'Para hoy' : `Turno: ${habit.horario}`,
      icono: habit.icono
    }));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Inicio')}
    >
      <View style={styles.iconContainer}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emojiText}>{item.icono}</Text>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.message}>{item.mensaje}</Text>
        <View style={styles.timeContainer}>
          <Clock size={12} color="#64748B" />
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>

      <ChevronRight size={20} color="#64748B" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda Diaria</Text>
        <Bell size={24} color="white" />
      </View>

      {pendingReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BellOff size={60} color="#475569" strokeWidth={1} />
          <Text style={styles.emptyText}>¡Todo al día!</Text>
          <Text style={styles.emptySubtext}>Has completado todos tus hábitos programados para hoy.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>Tienes {pendingReminders.length} tareas pendientes</Text>
          <FlatList
            data={pendingReminders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", 
    paddingTop: 60,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold"
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 20,
    fontWeight: "500"
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B" 
  },
  iconContainer: {
    marginRight: 15
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emojiText: {
    fontSize: 24
  },
  textContainer: {
    flex: 1
  },
  title: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold"
  },
  message: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4
  },
  time: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
    textTransform: 'capitalize'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50
  },
  emptyText: {
    marginTop: 15,
    color: "white",
    fontSize: 18,
    fontWeight: "bold"
  },
  emptySubtext: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20
  }
});