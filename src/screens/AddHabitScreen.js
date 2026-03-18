import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Switch
} from 'react-native';
import { ArrowLeft, Dumbbell, Brain, Sun, Sunset, Moon, Clock, Bell, BellOff } from 'lucide-react-native';

import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 1. DICCIONARIO DE HÁBITOS PREDETERMINADOS (Mejora de UX)
const SUGERENCIAS = [
  { titulo: "Beber 2L de agua", categoria: "cuerpo", icono: "💧" },
  { titulo: "Leer 15 min", categoria: "mente", icono: "📚" },
  { titulo: "Caminar 30 min", categoria: "cuerpo", icono: "🚶" },
  { titulo: "Meditar 10 min", categoria: "mente", icono: "🧘" },
  { titulo: "Comer fruta", categoria: "cuerpo", icono: "🍎" },
];

const ICONOS = ["🏃", "📚", "🥗", "🧘", "💧", "🚶", "🍎", "🚴", "🧠", "🦷", "🐕", "⭐", "🚭", "💻", "💤"];

export default function AddHabitScreen({ navigation }) {
  const [nuevoHabit, setNuevoHabit] = useState('');
  const [category, setCategory] = useState('cuerpo'); 
  const [horario, setHorario] = useState('cualquiera');
  const [iconoSeleccionado, setIconoSeleccionado] = useState('⭐');
  
  // NUEVOS ESTADOS DE RIESGO
  const [horaExacta, setHoraExacta] = useState('');
  const [recordatorio, setRecordatorio] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Autocompletar formulario al tocar una sugerencia
  const aplicarSugerencia = (sugerencia) => {
    setNuevoHabit(sugerencia.titulo);
    setCategory(sugerencia.categoria);
    setIconoSeleccionado(sugerencia.icono);
  };

  const crearHabit = async () => {
    if (nuevoHabit.trim() === "") {
      Alert.alert("Atención", "Escribe un nombre para el hábito.");
      return;
    }

    // Validación simple de formato de hora si el usuario escribió algo
    if (horaExacta.trim() !== "") {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(horaExacta.trim())) {
        Alert.alert("Formato Inválido", "La hora exacta debe estar en formato HH:MM (Ej. 14:30 o 08:15).");
        return;
      }
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error Crítico", "No hay sesión activa.");
      return;
    }

    setLoading(true);

    try {
      // INYECCIÓN DE LOS NUEVOS CAMPOS A FIREBASE
      await addDoc(collection(db, 'habitos'), {
        user_id: user.uid,
        titulo: nuevoHabit.trim(),
        categoria: category,
        icono: iconoSeleccionado,
        horario: horario, 
        hora_exacta: horaExacta.trim() || null, // null si no definió hora
        recordatorio: recordatorio, // Guardamos la preferencia
        frecuencia: 'diario',
        valor_xp: category === 'cuerpo' ? 20 : 15,
        activo: true,
        created_at: serverTimestamp()
      });

      setLoading(false);
      setNuevoHabit('');
      setHoraExacta('');
      setRecordatorio(false);
      
      navigation.navigate('Inicio'); 

    } catch (error) {
      setLoading(false);
      console.error("Error BD:", error);
      Alert.alert("Fallo de Base de Datos", "No se pudo guardar el hábito.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo hábito</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* SECCIÓN DE SUGERENCIAS RÁPIDAS */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sugerencias Rápidas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sugerenciasContainer}>
              {SUGERENCIAS.map((sug, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.sugerenciaBadge}
                  onPress={() => aplicarSugerencia(sug)}
                >
                  <Text style={styles.sugerenciaEmoji}>{sug.icono}</Text>
                  <Text style={styles.sugerenciaText}>{sug.titulo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            placeholder="O escribe el tuyo (Ej. Correr 2 km)"
            style={styles.input}
            value={nuevoHabit}
            onChangeText={setNuevoHabit}
            maxLength={40}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoryContainer}>
              <TouchableOpacity 
                style={[styles.categoryBtn, category === 'cuerpo' && styles.categoryBtnActive]}
                onPress={() => setCategory('cuerpo')}
              >
                <Dumbbell size={20} color={category === 'cuerpo' ? '#FFFFFF' : '#4B5563'} />
                <Text style={[styles.categoryText, category === 'cuerpo' && styles.categoryTextActive]}>Físico</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.categoryBtn, category === 'mente' && styles.categoryBtnActive]}
                onPress={() => setCategory('mente')}
              >
                <Brain size={20} color={category === 'mente' ? '#FFFFFF' : '#4B5563'} />
                <Text style={[styles.categoryText, category === 'mente' && styles.categoryTextActive]}>Mental</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Momento del día</Text>
            <View style={styles.timeGrid}>
              <TouchableOpacity style={[styles.timeBtn, horario === 'cualquiera' && styles.timeBtnActive]} onPress={() => setHorario('cualquiera')}>
                <Clock size={18} color={horario === 'cualquiera' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'cualquiera' && styles.timeTextActive]}>Libre</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.timeBtn, horario === 'mañana' && styles.timeBtnActive]} onPress={() => setHorario('mañana')}>
                <Sun size={18} color={horario === 'mañana' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'mañana' && styles.timeTextActive]}>Mañana</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.timeBtn, horario === 'tarde' && styles.timeBtnActive]} onPress={() => setHorario('tarde')}>
                <Sunset size={18} color={horario === 'tarde' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'tarde' && styles.timeTextActive]}>Tarde</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.timeBtn, horario === 'noche' && styles.timeBtnActive]} onPress={() => setHorario('noche')}>
                <Moon size={18} color={horario === 'noche' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'noche' && styles.timeTextActive]}>Noche</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NUEVA SECCIÓN DE HORA Y ALERTAS */}
          <View style={styles.advancedGroup}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <Text style={styles.label}>Hora Específica (Opcional)</Text>
              <TextInput
                placeholder="HH:MM (Ej. 14:30)"
                style={styles.timeInput}
                value={horaExacta}
                onChangeText={setHoraExacta}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Recordatorio</Text>
              <View style={styles.switchRow}>
                {recordatorio ? <Bell size={20} color="#3B82F6" /> : <BellOff size={20} color="#9CA3AF" />}
                <Switch
                  value={recordatorio}
                  onValueChange={setRecordatorio}
                  trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
                  thumbColor={recordatorio ? "#3B82F6" : "#F3F4F6"}
                  style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], marginLeft: 8 }}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Elige un icono</Text>
            <View style={styles.iconosGrid}>
              {ICONOS.map((icon, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setIconoSeleccionado(icon)}
                  style={[styles.iconoBtn, iconoSeleccionado === icon && styles.iconoBtnActive]}
                >
                  <Text style={{ fontSize: 28 }}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.botonCrear, (!nuevoHabit.trim() || loading) && styles.botonCrearDisabled]} 
            onPress={crearHabit}
            disabled={!nuevoHabit.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBoton}>+ Guardar hábito</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  content: { flex: 1, padding: 20 },
  
  // Sugerencias
  sugerenciasContainer: { flexDirection: 'row', paddingBottom: 10, marginHorizontal: -20, paddingHorizontal: 20 },
  sugerenciaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  sugerenciaEmoji: { fontSize: 16, marginRight: 6 },
  sugerenciaText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },

  input: { borderWidth: 1, borderColor: "#E5E7EB", width: "100%", padding: 16, borderRadius: 12, marginBottom: 25, fontSize: 16, backgroundColor: '#F9FAFB', color: '#1F2937', fontWeight: '500' },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  categoryContainer: { flexDirection: 'row', gap: 10 },
  categoryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  categoryBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  categoryText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563' },
  categoryTextActive: { color: '#FFFFFF' },
  
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  timeBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#4B5563' },
  timeTextActive: { color: '#FFFFFF' },

  // Avanzado
  advancedGroup: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  timeInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, fontSize: 16, textAlign: 'center', fontWeight: '500', color: '#1F2937' },
  switchContainer: { alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },

  iconosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  iconoBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  iconoBtnActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: 'white' },
  botonCrear: { backgroundColor: "#10B981", padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  botonCrearDisabled: { backgroundColor: "#A7F3D0", shadowOpacity: 0 },
  textoBoton: { color: "white", fontWeight: "bold", fontSize: 18 }
});