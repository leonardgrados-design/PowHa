import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationsScreen() {

  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Hábito completado",
      message: "Completaste 'Beber 2L de agua'",
      time: "Hace 5 min",
      read: false
    },
    {
      id: "2",
      title: "Recordatorio",
      message: "No olvides tu hábito 'Leer 30 minutos'",
      time: "Hace 1 hora",
      read: false
    },
    {
      id: "3",
      title: "Progreso diario",
      message: "Has completado 50% de tus hábitos hoy",
      time: "Hace 3 horas",
      read: true
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.read ? "notifications-outline" : "notifications"}
          size={24}
          color={item.read ? "#64748B" : "#3B82F6"}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>

        <TouchableOpacity onPress={clearNotifications}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#94A3B8" />
          <Text style={styles.emptyText}>
            No tienes notificaciones
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
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
    marginBottom: 25
  },

  headerTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold"
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12
  },

  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6"
  },

  iconContainer: {
    marginRight: 12
  },

  textContainer: {
    flex: 1
  },

  title: {
    color: "white",
    fontSize: 15,
    fontWeight: "600"
  },

  message: {
    color: "#CBD5F5",
    fontSize: 14,
    marginTop: 2
  },

  time: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 6
  },

  unreadDot: {
    width: 10,
    height: 10,
    backgroundColor: "#3B82F6",
    borderRadius: 5
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  emptyText: {
    marginTop: 15,
    color: "#94A3B8",
    fontSize: 16
  }

});