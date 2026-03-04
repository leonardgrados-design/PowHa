import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Trophy, User, Lock, Mail, ArrowRight } from 'lucide-react-native';
import CustomInput from '../components/CustomInput';

// Importamos la lógica real de Firebase
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleAuthentication = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Campos incompletos.");
      return;
    }

    try {
      if (isRegistering) {
        if (!username) {
          Alert.alert("Error", "Falta el nombre de usuario.");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guarda el perfil inicial en Firestore
        await setDoc(doc(db, 'usuarios', user.uid), {
          username: username,
          email: email,
          nivel: 1,
          xp_total: 0,
          racha_actual: 0,
          created_at: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      Alert.alert("Error de autenticación", error.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}><Trophy size={60} color="#2563EB" /></View>
        <Text style={styles.appTitle}>Trackly</Text>
        <Text style={styles.appSlogan}>{isRegistering ? "Crea tu identidad." : "Bienvenido."}</Text>
      </View>

      <View style={styles.formSection}>
        {isRegistering && <CustomInput icon={User} placeholder="Nombre de Usuario" value={username} onChangeText={setUsername} />}
        <CustomInput icon={Mail} placeholder="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <CustomInput icon={Lock} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.loginButton} onPress={handleAuthentication}>
          <Text style={styles.loginButtonText}>{isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}</Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.switchButton}>
          <Text style={styles.switchText}>{isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿Nuevo aquí? Regístrate"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, elevation: 10 },
  appTitle: { fontSize: 32, fontWeight: '900', color: '#1F2937', marginBottom: 5 },
  appSlogan: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  formSection: { width: '100%' },
  loginButton: { backgroundColor: '#2563EB', flexDirection: 'row', height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 5 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  switchButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  switchText: { color: '#4B5563', fontWeight: '600' },
});