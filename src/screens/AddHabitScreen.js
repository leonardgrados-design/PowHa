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
import { ArrowLeft, Save, Dumbbell, Brain, Sun, Sunset, Moon, Clock } from 'lucide-react-native';

// Importaciones de Firebase
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddHabitScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cuerpo'); // 'cuerpo' o 'mente'
  const [icon, setIcon] = useState('💧'); // Icono por defecto
  const [horario, setHorario] = useState('cualquiera'); // 'mañana', 'tarde', 'noche', 'cualquiera'
  const [loading, setLoading] = useState(false);

  // Opciones de iconos estáticas para evitar que el usuario meta basura
  const iconOptions = ['💧', '🏋️', '🏃', '🍎', '📚', '🧘', '💻', '💤'];

  const handleSaveHabit = async () => {
    // 1. Validación estricta
    if (!title.trim()) {
      Alert.alert("Error", "El hábito necesita un título.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error crítico", "No hay sesión de usuario activa.");
      return;
    }

    setLoading(true);

    try {
      // 2. Ejecución del addDoc en la colección 'habitos'
      // ATENCIÓN: Se agregaron 'horario' y 'frecuencia' para soportar la lógica de negocio futura.
      await addDoc(collection(db, 'habitos'), {
        user_id: user.uid,
        titulo: title.trim(),
        categoria: category,
        icono: icon,
        horario: horario, 
        frecuencia: 'diario', // HARDCODED: Evita la complejidad de programar días específicos para el MVP
        valor_xp: category === 'cuerpo' ? 20 : 15,
        activo: true,
        created_at: serverTimestamp()
      });

      // 3. Éxito: Limpiar y volver al Home
      setLoading(false);
      Alert.alert("Éxito", "Hábito creado correctamente.");
      navigation.navigate('Inicio'); 

    } catch (error) {
      setLoading(false);
      console.error("Error al guardar hábito:", error);
      Alert.alert("Error", "No se pudo conectar con la base de datos.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Hábito</Text>
          <View style={{ width: 40 }} /> {/* Espaciador */}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Campo Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>¿Qué quieres lograr?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Leer 10 páginas, Beber agua..."
              value={title}
              onChangeText={setTitle}
              maxLength={30}
            />
          </View>

          {/* Selección de Categoría */}
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

          {/* Selección de Horario (Nuevo) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Momento del día</Text>
            <View style={styles.timeGrid}>
              <TouchableOpacity 
                style={[styles.timeBtn, horario === 'cualquiera' && styles.timeBtnActive]}
                onPress={() => setHorario('cualquiera')}
              >
                <Clock size={18} color={horario === 'cualquiera' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'cualquiera' && styles.timeTextActive]}>Libre</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeBtn, horario === 'mañana' && styles.timeBtnActive]}
                onPress={() => setHorario('mañana')}
              >
                <Sun size={18} color={horario === 'mañana' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'mañana' && styles.timeTextActive]}>Mañana</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeBtn, horario === 'tarde' && styles.timeBtnActive]}
                onPress={() => setHorario('tarde')}
              >
                <Sunset size={18} color={horario === 'tarde' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'tarde' && styles.timeTextActive]}>Tarde</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeBtn, horario === 'noche' && styles.timeBtnActive]}
                onPress={() => setHorario('noche')}
              >
                <Moon size={18} color={horario === 'noche' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.timeText, horario === 'noche' && styles.timeTextActive]}>Noche</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selección de Icono */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Elige un icono</Text>
            <View style={styles.iconGrid}>
              {iconOptions.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.iconWrapper, icon === item && styles.iconWrapperActive]}
                  onPress={() => setIcon(item)}
                >
                  <Text style={styles.iconEmoji}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={{ height: 40 }} /> {/* Espaciador final para el scroll */}
        </ScrollView>

        {/* Botón de Guardar */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, (!title.trim() || loading) && styles.saveButtonDisabled]} 
            onPress={handleSaveHabit}
            disabled={!title.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Guardar Hábito</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  content: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937' },
  categoryContainer: { flexDirection: 'row', gap: 10 },
  categoryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  categoryBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  categoryText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  categoryTextActive: { color: '#FFFFFF' },
  
  // Nuevos estilos para el horario
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  timeBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  timeText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  timeTextActive: { color: '#FFFFFF' },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconWrapperActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  iconEmoji: { fontSize: 24 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  saveButton: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  saveButtonDisabled: { backgroundColor: '#9CA3AF' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});