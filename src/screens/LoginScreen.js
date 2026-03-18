import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Trophy, User, Lock, Mail, ArrowRight } from 'lucide-react-native';
import CustomInput from '../components/CustomInput';

import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
// Añadidas las importaciones para consultar si el usuario existe
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false); // Añadido para bloquear doble envíos

  const handleAuthentication = async () => {
    // 1. Validaciones de UI básicas
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        const cleanUsername = username.trim().toLowerCase();
        
        if (!cleanUsername) {
          Alert.alert("Error", "Falta el nombre de usuario.");
          setLoading(false);
          return;
        }

        if (cleanUsername.length < 3) {
          Alert.alert("Error", "El nombre de usuario debe tener al menos 3 caracteres.");
          setLoading(false);
          return;
        }

        // 2. PARCHE CRÍTICO: Verificar unicidad del username
        const usersRef = collection(db, 'usuarios');
        const q = query(usersRef, where('username_lower', '==', cleanUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          Alert.alert("Nombre no disponible", "Ese nombre de usuario ya está en uso. Por favor, elige otro.");
          setLoading(false);
          return;
        }

        // 3. Si el nombre está libre, creamos el Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // 4. Guardamos en Firestore incluyendo una versión en minúsculas para búsquedas exactas futuras
        await setDoc(doc(db, 'usuarios', user.uid), {
          username: username.trim(),
          username_lower: cleanUsername, 
          email: email.trim(),
          nivel: 1,
          xp_total: 0,
          racha_actual: 0,
          created_at: new Date().toISOString()
        });

      } else {
        // Inicio de sesión normal
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      // Traducir errores comunes de Firebase para el usuario
      let mensajeError = "Ocurrió un error inesperado.";
      if (error.code === 'auth/email-already-in-use') mensajeError = 'Este correo ya está registrado.';
      if (error.code === 'auth/invalid-email') mensajeError = 'El formato del correo es inválido.';
      if (error.code === 'auth/weak-password') mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      if (error.code === 'auth/invalid-credential') mensajeError = 'Correo o contraseña incorrectos.';

      Alert.alert("Error de autenticación", mensajeError);
    } finally {
      setLoading(false);
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
        {isRegistering && (
          <CustomInput 
            icon={User} 
            placeholder="Nombre de Usuario" 
            value={username} 
            onChangeText={setUsername} 
            autoCapitalize="none"
          />
        )}
        <CustomInput 
          icon={Mail} 
          placeholder="Correo Electrónico" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" 
          autoCapitalize="none" 
        />
        <CustomInput 
          icon={Lock} 
          placeholder="Contraseña" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleAuthentication}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>{isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setIsRegistering(!isRegistering)} 
          style={styles.switchButton}
          disabled={loading}
        >
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
  loginButtonDisabled: { backgroundColor: '#93C5FD', elevation: 0 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  switchButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  switchText: { color: '#4B5563', fontWeight: '600' },
});