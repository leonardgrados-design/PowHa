import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Trophy, User, Lock, Mail, ArrowRight } from 'lucide-react-native';
// Importamos nuestro componente personalizado para no repetir código
import CustomInput from '../components/CustomInput';

// Recibimos la función 'onLogin' desde el AppNavigator.
// Esta función es el "puente" para avisarle a la App que el usuario entró correctamente.
export default function LoginScreen({ onLogin }) {
  // Estado local para controlar si mostramos el formulario de registro o el de login
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados para guardar lo que escribe el usuario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  return (
    // KeyboardAvoidingView: Evita que el teclado tape los inputs al abrirse.
    // En iOS usamos "padding" y en Android "height" para que funcione bien.
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* SECCIÓN VISUAL (Logo y Título) */}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Trophy size={60} color="#2563EB" />
        </View>
        <Text style={styles.appTitle}>Trackly</Text>
        {/* Texto dinámico: Cambia según si se está registrando o no */}
        <Text style={styles.appSlogan}>
          {isRegistering ? "Crea tu identidad." : "Bienvenido de nuevo."}
        </Text>
      </View>

      {/* SECCIÓN DEL FORMULARIO */}
      <View style={styles.formSection}>
        
        {/* Renderizado Condicional: El campo "Usuario" SOLO se ve si isRegistering es true */}
        {isRegistering && (
           <CustomInput 
             icon={User} 
             placeholder="Nombre de Usuario" 
             value={username} 
             onChangeText={setUsername} 
           />
        )}

        <CustomInput 
          icon={Mail} 
          placeholder="Correo Electrónico" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" // Muestra el teclado con @
          autoCapitalize="none" // Evita mayúsculas automáticas en emails
        />

        <CustomInput 
          icon={Lock} 
          placeholder="Contraseña" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry // Oculta los caracteres (puntitos)
        />

        {/* Botón Principal: Al presionar, ejecuta onLogin pasando los datos */}
        <TouchableOpacity style={styles.loginButton} onPress={() => onLogin(username, email)}>
          <Text style={styles.loginButtonText}>
            {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
          </Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>

        {/* Botón Secundario: Cambia el modo (Login <-> Registro) */}
        <TouchableOpacity 
          onPress={() => setIsRegistering(!isRegistering)} 
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿Nuevo aquí? Regístrate"}
          </Text>
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