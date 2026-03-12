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
  ScrollView
} from 'react-native';
import { ArrowLeft, Dumbbell, Brain, Sun, Sunset, Moon, Clock } from 'lucide-react-native';

import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddHabitScreen({ navigation }) {
  const [nuevoHabit, setNuevoHabit] = useState('');
  const [category, setCategory] = useState('cuerpo'); 
  const [horario, setHorario] = useState('cualquiera');
  const [iconoSeleccionado, setIconoSeleccionado] = useState('⭐');
  const [loading, setLoading] = useState(false);

  const iconos = ["🏃", "📚", "🥗", "🧘", "💧", "🚴", "🧠", "🦷", "🐕", "⭐", "🚭", "💻", "💤"];

  const crearHabit = async () => {
    // 1. Validaciones iniciales
    if (nuevoHabit.trim() === "") {
      Alert.alert("Atención", "Escribe un nombre para el hábito.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error Crítico", "No hay sesión activa. Cierra sesión y vuelve a entrar.");
      return;
    }

    setLoading(true);

    try {
      // 2. Intento de escritura en la Base de Datos
      console.log("Intentando guardar en Firestore para el usuario:", user.uid);
      
      await addDoc(collection(db, 'habitos'), {
        user_id: user.uid,
        titulo: nuevoHabit.trim(),
        categoria: category,
        icono: iconoSeleccionado,
        horario: horario, 
        frecuencia: 'diario',
        valor_xp: category === 'cuerpo' ? 20 : 15,
        activo: true,
        created_at: serverTimestamp()
      });

      console.log("Guardado exitoso.");
      setLoading(false);
      setNuevoHabit('');
      
      // Volvemos a la pantalla principal
      navigation.navigate('Inicio'); 

    } catch (error) {
      setLoading(false);
      console.error("FIREBASE ERROR DETALLADO:", error);
      // Imprimimos el error real de Firebase en la pantalla para dejar de adivinar
      Alert.alert("Fallo de Base de Datos", error.message);
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
          
          <TextInput
            placeholder="Nombre del hábito (Ej. Correr 2 km)"
            style={styles.input}
            value={nuevoHabit}
            onChangeText={setNuevoHabit}
            maxLength={30}
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
            <Text style={styles.label}>Horario</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Elige un icono</Text>
            <View style={styles.iconosGrid}>
              {iconos.map((icon, index) => (
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
              <Text style={styles.textoBoton}>+ Crear hábito</Text>
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
  input: { borderWidth: 1, borderColor: "#ccc", width: "100%", padding: 15, borderRadius: 12, marginBottom: 25, fontSize: 16, backgroundColor: '#f9f9f9' },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10, textTransform: 'uppercase' },
  
  categoryContainer: { flexDirection: 'row', gap: 10 },
  categoryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#f3f3f3', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  categoryBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  categoryText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  categoryTextActive: { color: '#FFFFFF' },
  
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f3f3', borderWidth: 1, borderColor: 'transparent', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  timeBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  timeTextActive: { color: '#FFFFFF' },

  iconosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  iconoBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconoBtnActive: { borderColor: '#4CAF50', backgroundColor: '#e8f5e9' },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  botonCrear: { backgroundColor: "#4CAF50", padding: 16, borderRadius: 12, alignItems: 'center' },
  botonCrearDisabled: { backgroundColor: "#A5D6A7" },
  textoBoton: { color: "white", fontWeight: "bold", fontSize: 18 }
});