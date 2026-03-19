import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, TextInput, ScrollView, Image } from 'react-native';
import { User, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { C, S, R, F, common } from '../theme';

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'Este correo ya está registrado.',
  'auth/invalid-email':        'El formato del correo es inválido.',
  'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-credential':   'Correo o contraseña incorrectos.',
  'auth/user-not-found':       'No existe una cuenta con ese correo.',
  'auth/wrong-password':       'Contraseña incorrecta.',
  'auth/too-many-requests':    'Demasiados intentos. Espera un momento.',
};

function Field({ icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, error }) {
  const [focused,  setFocused]  = useState(false);
  const [visible,  setVisible]  = useState(!secureTextEntry);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => { setFocused(true);  Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start(); };
  const onBlur  = () => { setFocused(false); Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.accentRed : theme.borderStrong, error ? C.accentRed : C.borderFocus],
  });

  return (
    <View style={{ marginBottom: 14 }}>
      <Animated.View style={[common.inputWrap, { borderColor }]}>
        <Icon size={17} color={focused ? C.accentIndigoL : theme.textMuted} style={{ flexShrink: 0 }} />
        <TextInput style={styles.fieldInput} placeholder={placeholder} placeholderTextColor={theme.textMuted}
          value={value} onChangeText={onChangeText} onFocus={onFocus} onBlur={onBlur}
          secureTextEntry={secureTextEntry && !visible} keyboardType={keyboardType}
          autoCapitalize="none" autoCorrect={false} />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {visible ? <EyeOff size={17} color={theme.textMuted} /> : <Eye size={17} color={theme.textMuted} />}
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formSlide   = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;
  const modeAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 8,  useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400,              useNativeDriver: true }),
      Animated.timing(formSlide,   { toValue: 0, duration: 450, delay: 150,  useNativeDriver: true }),
      Animated.timing(formOpacity, { toValue: 1, duration: 450, delay: 150,  useNativeDriver: true }),
    ]).start();
  }, []);

  const switchMode = () => {
    setErrors({});
    Animated.sequence([
      Animated.timing(modeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(modeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    setIsRegistering(v => !v);
  };

  const validate = () => {
    const e = {};
    if (!email.trim())              e.email    = 'El correo es obligatorio.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Formato inválido.';
    if (!password.trim())           e.password = 'La contraseña es obligatoria.';
    else if (password.length < 6)   e.password = 'Mínimo 6 caracteres.';
    if (isRegistering) {
      const clean = username.trim().toLowerCase();
      if (!clean)          e.username = 'El nombre es obligatorio.';
      else if (clean.length < 3) e.username = 'Mínimo 3 caracteres.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isRegistering) {
        const clean = username.trim().toLowerCase();
        const snap  = await getDocs(query(collection(db, 'usuarios'), where('username_lower', '==', clean)));
        if (!snap.empty) {
          setErrors({ username: 'Ese nombre ya está en uso.' });
          setLoading(false);
          return;
        }

        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, 'usuarios', user.uid), {
          username: username.trim(), username_lower: clean,
          email: email.trim(), nivel: 1, xp_total: 0, racha_actual: 0,
          avatar_id: 'a1', photo_url: null, notif_enabled: true, dark_mode: true,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      console.error('AUTH ERROR CODE:', error.code);
      console.error('AUTH ERROR MSG:', error.message);
      const msg = AUTH_ERRORS[error.code] || 'Ocurrió un error inesperado.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') setErrors({ password: msg });
      else if (error.code?.includes('email')) setErrors({ email: msg });
      else setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const formTranslate = modeAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 6, 0] });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.root, { backgroundColor: theme.bgBase }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Animated.View style={[styles.logoSection, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoCircle}>
            <Image 
            source={require('../../assets/icon.png')}
            style={{ width: 50, height: 50, resizeMode: 'contain' }}
           />
          </View>
          <Text style={styles.appName}>Trackly</Text>
          <Text style={styles.appTagline}>{isRegistering ? 'Crea tu identidad.' : 'Bienvenido de vuelta.'}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formSlide }, { translateX: formTranslate }] }}>
          {errors.general && (
            <View style={styles.generalError}>
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          )}

          {isRegistering && (
            <Field icon={User} placeholder="Nombre de usuario" value={username}
              onChangeText={t => { setUsername(t); setErrors(e => ({ ...e, username: null })); }}
              error={errors.username} />
          )}
          <Field icon={Mail} placeholder="Correo electrónico" value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: null })); }}
            keyboardType="email-address" error={errors.email} />
          <Field icon={Lock} placeholder="Contraseña" value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: null })); }}
            secureTextEntry error={errors.password} />

          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: S.sm }}>
            <TouchableOpacity
              style={[common.primaryBtn, loading && { backgroundColor: C.accentIndigo + '80' }]}
              onPress={handleAuth}
              onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start()}
              onPressOut={() => Animated.spring(btnScale, { toValue: 1,   useNativeDriver: true, tension: 200 }).start()}
              disabled={loading} activeOpacity={1}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={common.primaryBtnText}>{isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
                  <ArrowRight size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={switchMode} disabled={loading} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isRegistering ? '¿Ya tienes cuenta? ' : '¿Nuevo aquí? '}
              <Text style={styles.switchAccent}>{isRegistering ? 'Inicia sesión' : 'Regístrate'}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: theme.bgBase },
  scroll:           { flexGrow: 1, justifyContent: 'center', padding: S.lg, paddingBottom: 48 },
  logoSection:      { alignItems: 'center', marginBottom: 44 },
  logoCircle:       { width: 80, height: 80, borderRadius: 22, backgroundColor: theme.bgIndigo, borderWidth: 1.5, borderColor: C.bgIndigoL, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  appName:          { fontSize: 34, fontWeight: '900', color: theme.textPrimary, letterSpacing: -1 },
  appTagline:       { fontSize: F.body, color: theme.textMuted, marginTop: 5 },
  fieldInput:       { flex: 1, fontSize: F.body, color: theme.textPrimary, fontWeight: '500' },
  fieldError:       { fontSize: F.small, color: C.accentRed, marginTop: 5, marginLeft: 4 },
  generalError:     { backgroundColor: C.accentRed + '18', borderWidth: 0.5, borderColor: C.accentRed + '50', borderRadius: R.md, padding: 12, marginBottom: 14 },
  generalErrorText: { color: C.accentRed, fontSize: F.label, fontWeight: '500', textAlign: 'center' },
  switchBtn:        { alignItems: 'center', marginTop: 22, padding: S.sm },
  switchText:       { fontSize: F.label, color: theme.textMuted },
  switchAccent:     { color: theme.accentIndigoL, fontWeight: '700' },
});