import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform,
  Modal, Animated, Image, SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import {
  Edit3, Lock, Bell, Moon, RefreshCw, Shield,
  LogOut, Camera, ChevronRight, Check, X,
  ImagePlus, Eye, EyeOff, Trash2, AlertTriangle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
// FIX: import from legacy path for SDK 54+
import { ref } from 'firebase/storage';

import { auth, db, storage } from '../config/firebase';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { C, S, R, F, common } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { cancelAllNotifications, scheduleAllHabits } from '../services/NotificationService';

const getStyles = (theme) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: theme.bgBase, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scroll:        { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: 48 },
  hero:          { alignItems: 'center', marginBottom: S.lg, paddingTop: S.sm },
  heroName:      { fontSize: F.h2, fontWeight: '800', color: theme.textPrimary, marginTop: 14, letterSpacing: -0.3 },
  heroEmail:     { fontSize: F.label, color: theme.textMuted, marginTop: 3, marginBottom: 10 },
  heroXpRow:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.sm, width: '70%' },
  statsStrip:    { flexDirection: 'row', backgroundColor: theme.bgCard, borderRadius: R.lg, borderWidth: 0.5, borderColor: theme.borderDefault, paddingVertical: S.md, marginBottom: 28 },
  sectionTitle:  { fontSize: F.caption, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  photoBtn:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.bgElevated, borderRadius: R.lg, borderWidth: 0.5, borderColor: theme.borderStrong, padding: 14 },
  photoBtnTitle: { fontSize: F.body, fontWeight: '600', color: theme.textPrimary },
  photoBtnSub:   { fontSize: F.small, color: theme.textMuted, marginTop: 2 },
  orDivider:     { textAlign: 'center', fontSize: F.small, color: theme.textMuted, marginVertical: S.md },
  avatarGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, justifyContent: 'center' },
  avatarGridItem:{ alignItems: 'center', padding: 6, borderRadius: R.lg, borderWidth: 1.5, borderColor: 'transparent', position: 'relative' },
  avatarGridFace:{ width: 60, height: 60, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  avatarCheckBadge: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: C.accentIndigo, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.bgCard },
  modalDesc:     { fontSize: F.label, color: theme.textMuted, marginBottom: S.md, lineHeight: 20 },
  modalInput:    { flex: 1, fontSize: F.body, color: theme.textPrimary, fontWeight: '500' },
  fieldError:    { fontSize: F.small, color: C.accentRed, marginBottom: S.sm, marginLeft: 4 },
  warningBox:    { flexDirection: 'row', gap: S.sm, backgroundColor: theme.bgAmber, borderWidth: 0.5, borderColor: C.bgAmberL, borderRadius: R.md, padding: 14, alignItems: 'flex-start' },
  warningText:   { flex: 1, fontSize: F.small, color: C.accentAmber, lineHeight: 18 },
  amberBtn:      { height: 52, backgroundColor: theme.bgAmber, borderWidth: 0.5, borderColor: C.bgAmberL, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm },
  amberBtnText:  { color: C.accentAmber, fontWeight: '700', fontSize: F.body },
  privacyTitle:  { fontSize: F.label, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  privacyBody:   { fontSize: F.small, color: theme.textSecondary, lineHeight: 20 },
});


// ─── Avatars ──────────────────────────────────────────────────────────────────
const AVATARS = [
  { id: 'a1',  face: '😎', bg: '#1E1E40' }, { id: 'a2',  face: '🧑‍💻', bg: '#0A2420' },
  { id: 'a3',  face: '🦸', bg: '#2A0A20' }, { id: 'a4',  face: '🧘', bg: '#1A2A0A' },
  { id: 'a5',  face: '🤓', bg: '#2A1A0A' }, { id: 'a6',  face: '🥷', bg: '#1A0A2A' },
  { id: 'a7',  face: '🧙', bg: '#0A1A2A' }, { id: 'a8',  face: '🦊', bg: '#2A1A00' },
  { id: 'a9',  face: '🐉', bg: '#1A0A0A' }, { id: 'a10', face: '🤖', bg: '#0A2A2A' },
  { id: 'a11', face: '👽', bg: '#0A2A1A' }, { id: 'a12', face: '🦁', bg: '#2A2A0A' },
  { id: 'a13', face: '🐺', bg: '#1A1A2A' }, { id: 'a14', face: '🦅', bg: '#0A1A1A' },
  { id: 'a15', face: '🧊', bg: '#0A0A2A' }, { id: 'a16', face: '🔥', bg: '#2A0A0A' },
];

// ─── Components ───────────────────────────────────────────────────────────────
function AvatarDisplay({ avatarId, photoUrl, size = 96, onPress }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 200 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();
  const av       = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  const br       = size * 0.28;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        activeOpacity={1} style={{ position: 'relative' }}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }}
            style={{ width: size, height: size, borderRadius: br, borderWidth: 2, borderColor: C.accentIndigo }}
            onError={() => {}} />
        ) : (
          <View style={{ width: size, height: size, borderRadius: br, backgroundColor: av.bg,
            borderWidth: 2, borderColor: C.accentIndigo + '80', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: size * 0.5 }}>{av.face}</Text>
          </View>
        )}
        {onPress && (
          <View style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28,
            borderRadius: 8, backgroundColor: C.accentIndigo, alignItems: 'center',
            justifyContent: 'center', borderWidth: 2, borderColor: C.bgBase }}>
            <Camera size={13} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function BottomModal({ visible, onClose, title, children }) {
  const { theme } = useTheme();
  const slide = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: visible ? 0 : 400, useNativeDriver: true, tension: 70, friction: 12 }).start();
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={common.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[common.modalSheet, { transform: [{ translateY: slide }], paddingBottom: 40 }]}>
          <View style={common.modalHandle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.lg }}>
            <Text style={common.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={common.modalClose}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function OptionRow({ icon, label, onPress, right, danger }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[common.optionRow, danger && { backgroundColor: theme.bgRed }]}>
      <View style={[common.optionIcon, danger && { backgroundColor: '#2D0808' }]}>{icon}</View>
      <Text style={[common.optionLabel, danger && { color: theme.accentRed }]}>{label}</Text>
      {right !== undefined ? right : <ChevronRight size={16} color={theme.textMuted} />}
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { isDark, theme, toggleTheme } = useTheme();
  const styles = getStyles(theme);
  const [userData,       setUserData]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarId,       setAvatarId]       = useState('a1');
  const [photoUrl,       setPhotoUrl]       = useState(null);
  const [notifEnabled,   setNotifEnabled]   = useState(true);

  const [showAvatarPicker,  setShowAvatarPicker]  = useState(false);
  const [showEditUsername,  setShowEditUsername]  = useState(false);
  const [showChangePass,    setShowChangePass]    = useState(false);
  const [showResetProgress, setShowResetProgress] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showPrivacy,       setShowPrivacy]       = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [savingUser,  setSavingUser]  = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passErr,     setPassErr]     = useState('');
  const [savingPass,  setSavingPass]  = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [deletePass,  setDeletePass]  = useState('');
  const [deletingAcc, setDeletingAcc] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setUserData({ email: user.email, ...d });
        if (d.avatar_id != null)     setAvatarId(d.avatar_id);
        if (d.photo_url != null)     setPhotoUrl(d.photo_url);
        if (d.notif_enabled != null) setNotifEnabled(d.notif_enabled);
      }
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, (e) => { if (e.code !== 'permission-denied') console.error(e); setLoading(false); });
    return () => unsub();
  }, []);

  const userRef = () => doc(db, 'usuarios', auth.currentUser.uid);

  // ── Preferences ───────────────────────────────────────────────────────────
  const toggleNotif = async (val) => {
    setNotifEnabled(val);
    try {
      await updateDoc(userRef(), { notif_enabled: val });
      if (val) { await scheduleAllHabits(); } else { await cancelAllNotifications(); }
    } catch (e) { console.error(e); }
  };

  // Dark mode handled by ThemeContext — toggleTheme updates Firestore + local state
  const toggleDark = (val) => toggleTheme(val);

  // ── Upload photo ──────────────────────────────────────────────────────────
  // Hermes (React Native JS engine) does NOT support Blob from ArrayBuffer,
  // uploadBytesResumable, or uploadString — all fail internally.
  // The ONLY reliable method in React Native is: fetch(localUri) → blob via RN polyfill
  // then upload using XMLHttpRequest directly to the Firebase Storage REST API.
  const uploadPhoto = async (uri) => {
    setUploadingPhoto(true);
    try {
      const uid   = auth.currentUser.uid;
      const token = await auth.currentUser.getIdToken();
      const bucket      = 'trackly-c0023.firebasestorage.app';
      const storagePath = `avatars/${uid}/profile.jpg`;
      const encodedPath = encodeURIComponent(storagePath);
      const uploadUrl   = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodedPath}`;

      // Delete old photo if exists
      if (photoUrl) {
        try {
          const deleteUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}`;
          await fetch(deleteUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        } catch (_) {}
      }

      // React Native's fetch polyfill correctly reads file:// URIs as binary
      const fileResponse = await fetch(uri);
      const blob         = await fileResponse.blob();

      // Upload via XHR — bypasses the Hermes Blob limitation
      const downloadUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'image/jpeg');
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const res   = JSON.parse(xhr.responseText);
              const dlUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${res.downloadTokens}`;
              resolve(dlUrl);
            } catch (parseErr) {
              reject(new Error('Could not parse upload response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(blob);
      });

      setPhotoUrl(downloadUrl);
      await updateDoc(userRef(), { photo_url: downloadUrl, avatar_id: null });
    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert('Error al subir foto', 'No se pudo guardar la imagen. Intenta de nuevo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Gallery permission ────────────────────────────────────────────────────
  const handlePickFromGallery = async () => {
    try {
      // Check status before requesting — avoids silent iOS block
      const { status: current } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (current === 'denied') {
        Alert.alert(
          'Acceso denegado',
          'Activa el acceso en:\nConfiguración > Expo Go > Fotos\ny selecciona "Todas las fotos".',
          [{ text: 'Entendido' }]
        );
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para elegir una imagen de perfil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setShowAvatarPicker(false);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Gallery error:', e);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  // ── Camera permission ─────────────────────────────────────────────────────
  const handleTakePhoto = async () => {
    try {
      const { status: current } = await ImagePicker.getCameraPermissionsAsync();

      if (current === 'denied') {
        Alert.alert(
          'Acceso denegado',
          'Activa el acceso en:\nConfiguración > Expo Go > Cámara.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar tu foto de perfil.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setShowAvatarPicker(false);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Camera error:', e);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  // ── Select illustrated avatar ─────────────────────────────────────────────
  const handleSelectAvatar = async (id) => {
    setAvatarId(id); setPhotoUrl(null); setShowAvatarPicker(false);
    try { await updateDoc(userRef(), { avatar_id: id, photo_url: null }); } catch (e) { console.error(e); }
  };

  // ── Edit username ─────────────────────────────────────────────────────────
  const handleSaveUsername = async () => {
    const clean = newUsername.trim().toLowerCase();
    if (!clean || clean.length < 3) { setUsernameErr('Mínimo 3 caracteres.'); return; }
    if (clean === userData?.username_lower) { setShowEditUsername(false); return; }
    setSavingUser(true);
    try {
      const snap = await getDocs(query(collection(db, 'usuarios'), where('username_lower', '==', clean)));
      if (!snap.empty) { setUsernameErr('Ese nombre ya está en uso.'); return; }
      await updateDoc(userRef(), { username: newUsername.trim(), username_lower: clean });
      setShowEditUsername(false); setNewUsername(''); setUsernameErr('');
    } catch (e) { setUsernameErr('No se pudo guardar.'); }
    finally     { setSavingUser(false); }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPass)           { setPassErr('Ingresa tu contraseña actual.'); return; }
    if (newPass.length < 6)     { setPassErr('Mínimo 6 caracteres.'); return; }
    if (newPass !== confirmPass) { setPassErr('Las contraseñas no coinciden.'); return; }
    setSavingPass(true);
    try {
      const user       = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      setShowChangePass(false);
      setCurrentPass(''); setNewPass(''); setConfirmPass(''); setPassErr('');
      Alert.alert('¡Listo!', 'Tu contraseña fue actualizada.');
    } catch (e) {
      setPassErr(e.code?.includes('credential') ? 'Contraseña actual incorrecta.' : 'Ocurrió un error.');
    } finally { setSavingPass(false); }
  };

  // ── Reset progress ────────────────────────────────────────────────────────
  const handleResetProgress = async () => {
    try {
      const uid   = auth.currentUser.uid;
      const batch = writeBatch(db);
      batch.update(doc(db, 'usuarios', uid), { xp_total: 0, nivel: 1, racha_actual: 0, ultima_fecha_racha: null });
      const snap = await getDocs(query(collection(db, 'registros_habito'), where('user_id', '==', uid)));
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setShowResetProgress(false);
      Alert.alert('Progreso restablecido', 'Tu XP y racha han sido reiniciados.');
    } catch (e) { Alert.alert('Error', 'No se pudo restablecer el progreso.'); }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePass) { Alert.alert('Atención', 'Ingresa tu contraseña para confirmar.'); return; }
    setDeletingAcc(true);
    try {
      const user       = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, deletePass);
      await reauthenticateWithCredential(user, credential);
      const uid   = user.uid;
      const batch = writeBatch(db);
      const [habSnap, regSnap] = await Promise.all([
        getDocs(query(collection(db, 'habitos'),          where('user_id', '==', uid))),
        getDocs(query(collection(db, 'registros_habito'), where('user_id', '==', uid))),
      ]);
      habSnap.forEach(d => batch.delete(d.ref));
      regSnap.forEach(d => batch.delete(d.ref));
      batch.delete(doc(db, 'usuarios', uid));
      await batch.commit();
      if (photoUrl) {
        try {
          const t2  = await auth.currentUser.getIdToken();
          const enc = encodeURIComponent(`avatars/${uid}/profile.jpg`);
          await fetch(`https://firebasestorage.googleapis.com/v0/b/trackly-c0023.firebasestorage.app/o/${enc}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${t2}` },
          });
        } catch (_) {}
      }
      await cancelAllNotifications();
      await deleteUser(user);
    } catch (e) {
      Alert.alert('Error', e.code?.includes('credential') ? 'Contraseña incorrecta.' : 'No se pudo eliminar la cuenta.');
    } finally { setDeletingAcc(false); }
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
        await cancelAllNotifications();
        signOut(auth);
      }},
    ]);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const xp         = userData?.xp_total || 0;
  const nivel      = userData?.nivel || Math.floor(xp / 50) + 1;
  const xpPct      = (xp % 50) / 50;
  const levelEmoji = nivel >= 10 ? '👑' : nivel >= 5 ? '😎' : nivel >= 3 ? '🔥' : '😐';

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accentIndigo} />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center', padding: S.lg }]}>
        <Text style={{ color: C.accentRed, marginBottom: 20 }}>Sesión no encontrada.</Text>
        <TouchableOpacity style={common.dangerBtn} onPress={() => signOut(auth)}>
          <LogOut size={18} color={C.accentRed} />
          <Text style={common.dangerBtnText}>Forzar cierre de sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bgBase }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgBase} />
      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          {uploadingPhoto ? (
            <View style={{ width: 96, height: 96, borderRadius: 27, backgroundColor: theme.bgCard,
              alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.accentIndigo }}>
              <ActivityIndicator color={C.accentIndigo} />
              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>Subiendo...</Text>
            </View>
          ) : (
            <AvatarDisplay avatarId={avatarId} photoUrl={photoUrl} size={96} onPress={() => setShowAvatarPicker(true)} />
          )}
          <Text style={styles.heroName}>{userData.username || 'Usuario'}</Text>
          <Text style={styles.heroEmail}>{userData.email}</Text>
          <View style={common.levelBadge}>
            <Text style={common.levelBadgeText}>Nivel {nivel} {levelEmoji}</Text>
          </View>
          <View style={styles.heroXpRow}>
            <View style={common.xpBarBg}>
              <View style={[common.xpBarFill, { width: `${xpPct * 100}%` }]} />
            </View>
            <Text style={{ fontSize: F.caption, color: theme.textMuted, minWidth: 50 }}>{xp % 50}/50 XP</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsStrip}>
          {[
            { val: xp,                               label: 'XP total', color: theme.accentIndigoL },
            { val: `${userData.racha_actual || 0}🔥`, label: 'Racha',   color: C.accentAmber  },
            { val: nivel,                             label: 'Nivel',    color: C.accentGreen   },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: F.h3, fontWeight: '800', letterSpacing: -0.5, color: s.color }}>{s.val}</Text>
                <Text style={{ fontSize: F.caption, color: theme.textMuted, marginTop: 3 }}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ width: 0.5, backgroundColor: C.borderDefault }} />}
            </React.Fragment>
          ))}
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={common.group}>
          <OptionRow icon={<Camera size={18} color={C.accentIndigo} />} label="Cambiar avatar" onPress={() => setShowAvatarPicker(true)} />
          <View style={common.divider} />
          <OptionRow icon={<Edit3 size={18} color={theme.textSecondary} />} label="Editar nombre de usuario"
            onPress={() => { setNewUsername(userData.username || ''); setUsernameErr(''); setShowEditUsername(true); }} />
          <View style={common.divider} />
          <OptionRow icon={<Lock size={18} color={theme.textSecondary} />} label="Cambiar contraseña"
            onPress={() => { setCurrentPass(''); setNewPass(''); setConfirmPass(''); setPassErr(''); setShowChangePass(true); }} />
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Configuración</Text>
        <View style={common.group}>
          <OptionRow icon={<Bell size={18} color={theme.textSecondary} />} label="Notificaciones"
            right={<Switch value={notifEnabled} onValueChange={toggleNotif} trackColor={{ false: theme.bgElevated, true: C.accentIndigo }} thumbColor="#fff" />} />
          <View style={common.divider} />
          <OptionRow icon={<Moon size={18} color={theme.textSecondary} />} label="Modo oscuro"
            right={<Switch value={isDark} onValueChange={toggleDark} trackColor={{ false: theme.bgElevated, true: theme.accentIndigo }} thumbColor="#fff" />} />
        </View>

        {/* Data */}
        <Text style={styles.sectionTitle}>Datos</Text>
        <View style={common.group}>
          <OptionRow icon={<RefreshCw size={18} color={C.accentAmber} />} label="Restablecer progreso" onPress={() => setShowResetProgress(true)} />
          <View style={common.divider} />
          <OptionRow icon={<Trash2 size={18} color={C.accentRed} />} label="Eliminar cuenta"
            onPress={() => { setDeletePass(''); setShowDeleteAccount(true); }} danger />
        </View>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>Privacidad</Text>
        <View style={common.group}>
          <OptionRow icon={<Shield size={18} color={theme.textSecondary} />} label="Política de privacidad" onPress={() => setShowPrivacy(true)} />
        </View>

        <TouchableOpacity style={common.dangerBtn} onPress={handleLogout}>
          <LogOut size={18} color={C.accentRed} />
          <Text style={common.dangerBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <View style={{ height: 48 }} />
      </Animated.ScrollView>

      {/* ── AVATAR PICKER ── */}
      <BottomModal visible={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} title="Elige tu avatar">
        <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
          <View style={[common.optionIcon, { backgroundColor: theme.bgIndigo, width: 44, height: 44 }]}>
            <Camera size={20} color={C.accentIndigo} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoBtnTitle}>Tomar foto</Text>
            <Text style={styles.photoBtnSub}>Usar la cámara ahora</Text>
          </View>
          <ChevronRight size={16} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.photoBtn, { marginTop: S.sm }]} onPress={handlePickFromGallery}>
          <View style={[common.optionIcon, { backgroundColor: theme.bgIndigo, width: 44, height: 44 }]}>
            <ImagePlus size={20} color={C.accentIndigo} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoBtnTitle}>Elegir de galería</Text>
            <Text style={styles.photoBtnSub}>Se guarda en la nube</Text>
          </View>
          <ChevronRight size={16} color={theme.textMuted} />
        </TouchableOpacity>

        <Text style={styles.orDivider}>— o elige un personaje —</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
          <View style={styles.avatarGrid}>
            {AVATARS.map(av => {
              const selected = !photoUrl && avatarId === av.id;
              return (
                <TouchableOpacity key={av.id} onPress={() => handleSelectAvatar(av.id)}
                  style={[styles.avatarGridItem, selected && { borderColor: C.accentIndigo, borderWidth: 2 }]}>
                  <View style={[styles.avatarGridFace, { backgroundColor: av.bg }]}>
                    <Text style={{ fontSize: 28 }}>{av.face}</Text>
                  </View>
                  {selected && (
                    <View style={styles.avatarCheckBadge}>
                      <Check size={9} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </BottomModal>

      {/* ── EDIT USERNAME ── */}
      <BottomModal visible={showEditUsername} onClose={() => setShowEditUsername(false)} title="Editar nombre">
        <Text style={styles.modalDesc}>Tu nombre de usuario es visible para otros.</Text>
        <View style={[common.inputWrap, { marginBottom: usernameErr ? 6 : 20 }]}>
          <Edit3 size={17} color={theme.textMuted} />
          <TextInput style={styles.modalInput} placeholder="Nuevo nombre de usuario"
            placeholderTextColor={theme.textMuted} value={newUsername}
            onChangeText={t => { setNewUsername(t); setUsernameErr(''); }}
            autoCapitalize="none" autoCorrect={false} maxLength={20} />
        </View>
        {usernameErr ? <Text style={styles.fieldError}>{usernameErr}</Text> : null}
        <TouchableOpacity style={[common.primaryBtn, { marginTop: 4 }]} onPress={handleSaveUsername} disabled={savingUser}>
          {savingUser ? <ActivityIndicator color="#fff" /> : <Text style={common.primaryBtnText}>Guardar</Text>}
        </TouchableOpacity>
      </BottomModal>

      {/* ── CHANGE PASSWORD ── */}
      <BottomModal visible={showChangePass} onClose={() => setShowChangePass(false)} title="Cambiar contraseña">
        {[
          { placeholder: 'Contraseña actual',    value: currentPass, setter: setCurrentPass, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
          { placeholder: 'Nueva contraseña',     value: newPass,     setter: setNewPass,     show: showNew,    toggle: () => setShowNew(v => !v)     },
          { placeholder: 'Confirmar contraseña', value: confirmPass, setter: setConfirmPass, show: showNew,    toggle: null },
        ].map(({ placeholder, value, setter, show, toggle }, i) => (
          <View key={i} style={[common.inputWrap, { marginBottom: 12 }]}>
            <Lock size={17} color={theme.textMuted} />
            <TextInput style={styles.modalInput} placeholder={placeholder} placeholderTextColor={theme.textMuted}
              value={value} onChangeText={t => { setter(t); setPassErr(''); }}
              secureTextEntry={!show} autoCapitalize="none" />
            {toggle && (
              <TouchableOpacity onPress={toggle}>
                {show ? <EyeOff size={17} color={theme.textMuted} /> : <Eye size={17} color={theme.textMuted} />}
              </TouchableOpacity>
            )}
          </View>
        ))}
        {passErr ? <Text style={[styles.fieldError, { marginBottom: 8 }]}>{passErr}</Text> : null}
        <TouchableOpacity style={[common.primaryBtn, { marginTop: 4 }]} onPress={handleChangePassword} disabled={savingPass}>
          {savingPass ? <ActivityIndicator color="#fff" /> : <Text style={common.primaryBtnText}>Actualizar contraseña</Text>}
        </TouchableOpacity>
      </BottomModal>

      {/* ── RESET PROGRESS ── */}
      <BottomModal visible={showResetProgress} onClose={() => setShowResetProgress(false)} title="Restablecer progreso">
        <View style={styles.warningBox}>
          <AlertTriangle size={20} color={C.accentAmber} />
          <Text style={styles.warningText}>Esto eliminará toda tu XP, racha y registros. Tus hábitos no se borrarán. No se puede deshacer.</Text>
        </View>
        <TouchableOpacity style={[styles.amberBtn, { marginTop: S.md }]} onPress={handleResetProgress}>
          <RefreshCw size={18} color={C.accentAmber} />
          <Text style={styles.amberBtnText}>Sí, restablecer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[common.primaryBtn, { marginTop: S.sm, backgroundColor: theme.bgElevated }]}
          onPress={() => setShowResetProgress(false)}>
          <Text style={[common.primaryBtnText, { color: theme.textSecondary }]}>Cancelar</Text>
        </TouchableOpacity>
      </BottomModal>

      {/* ── DELETE ACCOUNT ── */}
      <BottomModal visible={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} title="Eliminar cuenta">
        <View style={[styles.warningBox, { borderColor: C.bgRedL, backgroundColor: theme.bgRed }]}>
          <Trash2 size={20} color={C.accentRed} />
          <Text style={[styles.warningText, { color: C.accentRed }]}>Acción permanente. Se eliminarán tu cuenta, hábitos, progreso y foto. No se puede deshacer.</Text>
        </View>
        <Text style={[styles.modalDesc, { marginTop: S.md }]}>Ingresa tu contraseña para confirmar:</Text>
        <View style={[common.inputWrap, { marginBottom: S.md }]}>
          <Lock size={17} color={theme.textMuted} />
          <TextInput style={styles.modalInput} placeholder="Tu contraseña" placeholderTextColor={theme.textMuted}
            value={deletePass} onChangeText={setDeletePass} secureTextEntry autoCapitalize="none" />
        </View>
        <TouchableOpacity style={common.dangerBtn} onPress={handleDeleteAccount} disabled={deletingAcc}>
          {deletingAcc ? <ActivityIndicator color={C.accentRed} /> : (
            <><Trash2 size={18} color={C.accentRed} /><Text style={common.dangerBtnText}>Eliminar mi cuenta</Text></>
          )}
        </TouchableOpacity>
      </BottomModal>

      {/* ── PRIVACY ── */}
      <BottomModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} title="Política de privacidad">
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {[
            { title: 'Datos que recopilamos',   body: 'Recopilamos tu correo electrónico, nombre de usuario, foto de perfil opcional, y los hábitos y registros que tú mismo creas dentro de la app.' },
            { title: 'Cómo usamos tus datos',   body: 'Tus datos se usan exclusivamente para mostrar tu progreso dentro de Trackly. No compartimos, vendemos ni cedemos tu información a terceros.' },
            { title: 'Almacenamiento',          body: 'Todos tus datos se almacenan en Firebase (Google Cloud). Las fotos de perfil se guardan en Firebase Storage. Puedes eliminar tu cuenta en cualquier momento desde esta pantalla.' },
            { title: 'Seguridad',               body: 'Usamos autenticación segura de Firebase. Las contraseñas nunca se almacenan en texto plano. La comunicación está cifrada con TLS.' },
            { title: 'Notificaciones',          body: 'Las notificaciones locales se programan en tu dispositivo. Puedes desactivarlas desde Configuración.' },
            { title: 'Tus derechos',            body: 'Puedes editar tu nombre, cambiar tu foto, restablecer tu progreso o eliminar tu cuenta completamente desde esta pantalla.' },
          ].map((item, i) => (
            <View key={i} style={{ marginBottom: S.md }}>
              <Text style={styles.privacyTitle}>{item.title}</Text>
              <Text style={styles.privacyBody}>{item.body}</Text>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </BottomModal>
    </SafeAreaView>
  );
}