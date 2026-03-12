import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const user = {
    name: "Jonathan",
    email: "clothing@upvm.com"
  };

  return (

    <ScrollView style={styles.container}>

      <View style={styles.profileCard}>
        <Ionicons name="person-circle" size={90} color="#3B82F6" />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Cuenta</Text>

      <TouchableOpacity style={styles.option}>
        <Ionicons name="create-outline" size={22} color="white" />
        <Text style={styles.optionText}>Editar perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option}>
        <Ionicons name="lock-closed-outline" size={22} color="white" />
        <Text style={styles.optionText}>Cambiar contraseña</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Configuración</Text>

      <View style={styles.option}>
        <Ionicons name="notifications-outline" size={22} color="white" />
        <Text style={styles.optionText}>Notificaciones</Text>
        <Switch
          value={notifications}
          onValueChange={() => setNotifications(!notifications)}
        />
      </View>

      <View style={styles.option}>
        <Ionicons name="moon-outline" size={22} color="white" />
        <Text style={styles.optionText}>Modo oscuro</Text>
        <Switch
          value={darkMode}
          onValueChange={() => setDarkMode(!darkMode)}
        />
      </View>

      <Text style={styles.sectionTitle}>Datos</Text>

      <TouchableOpacity style={styles.option}>
        <Ionicons name="refresh-outline" size={22} color="white" />
        <Text style={styles.optionText}>Restablecer progreso</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Privacidad</Text>

      <TouchableOpacity style={styles.option}>
        <Ionicons name="shield-checkmark-outline" size={22} color="white" />
        <Text style={styles.optionText}>Política de privacidad</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout}>
        <Ionicons name="log-out-outline" size={22} color="white" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

    </ScrollView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 20
  },

  profileCard: {
    alignItems: "center",
    marginBottom: 25
  },

  name: {
    color: "black",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5
  },

  email: {
    color: "#94A3B8",
    fontSize: 14
  },

  sectionTitle: {
    color: "#94A3B8",
    marginTop: 20,
    marginBottom: 10
  },

  option: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  optionText: {
    color: "white",
    flex: 1,
    marginLeft: 10
  },

  logout: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center"
  },

  logoutText: {
    color: "white",
    marginLeft: 10,
    fontWeight: "bold"
  }

});