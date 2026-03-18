import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { UserCircle, Edit3, Lock, Bell, Moon, RefreshCw, Shield, LogOut } from "lucide-react-native";

import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'usuarios', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData({
          email: user.email,
          ...docSnap.data()
        });
      } else {
        console.warn("No se encontró el perfil en Firestore.");
      }
      setLoading(false);
    }, (error) => {
      // PARCHE DE RACE CONDITION
      if (error.code === 'permission-denied') return; 
      console.error("Error al cargar perfil:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const executeSignOut = () => {
    signOut(auth).catch((error) => {
      console.error("Error al cerrar sesión:", error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert("Hubo un problema al cerrar sesión.");
      } else {
        Alert.alert("Error", "Hubo un problema al intentar cerrar la sesión.");
      }
    });
  };

  const handleLogout = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmLogOut = window.confirm("¿Estás seguro de que deseas salir?");
      if (confirmLogOut) executeSignOut();
    } else {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro de que deseas salir?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: executeSignOut }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Cargando identidad...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#EF4444', marginBottom: 20 }}>Error crítico: Sesión no encontrada.</Text>
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Forzar cierre de sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <View style={styles.profileCard}>
        <UserCircle size={90} color="#3B82F6" strokeWidth={1} />
        <Text style={styles.name}>{userData?.username || "Usuario Desconocido"}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
        
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Nivel {userData?.nivel || 1}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Cuenta</Text>

      <TouchableOpacity style={styles.option}>
        <Edit3 size={22} color="white" />
        <Text style={styles.optionText}>Editar perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option}>
        <Lock size={22} color="white" />
        <Text style={styles.optionText}>Cambiar contraseña</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Configuración</Text>

      <View style={styles.option}>
        <Bell size={22} color="white" />
        <Text style={styles.optionText}>Notificaciones</Text>
        <Switch
          value={notifications}
          onValueChange={() => setNotifications(!notifications)}
          trackColor={{ false: "#4B5563", true: "#3B82F6" }}
        />
      </View>

      <View style={styles.option}>
        <Moon size={22} color="white" />
        <Text style={styles.optionText}>Modo oscuro</Text>
        <Switch
          value={darkMode}
          onValueChange={() => setDarkMode(!darkMode)}
          trackColor={{ false: "#4B5563", true: "#3B82F6" }}
        />
      </View>

      <Text style={styles.sectionTitle}>Datos</Text>

      <TouchableOpacity style={styles.option}>
        <RefreshCw size={22} color="white" />
        <Text style={styles.optionText}>Restablecer progreso</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Privacidad</Text>

      <TouchableOpacity style={styles.option}>
        <Shield size={22} color="white" />
        <Text style={styles.optionText}>Política de privacidad</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <LogOut size={22} color="white" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingHorizontal: 20
  },
  profileCard: {
    alignItems: "center",
    marginBottom: 25
  },
  name: {
    color: "#1F2937",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10
  },
  email: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 2
  },
  badgeContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  badgeText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    fontSize: 12
  },
  sectionTitle: {
    color: "#9CA3AF",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 12,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.5
  },
  option: {
    backgroundColor: "#1F2937",
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
    marginLeft: 12,
    fontWeight: "500"
  },
  logout: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  logoutText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 16
  }
});