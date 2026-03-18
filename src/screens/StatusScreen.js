import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { UserCircle, Flame, TrendingUp, Target, Activity } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";

// Importaciones de Firebase
import { auth, db } from '../config/firebase';
import { doc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

const screenWidth = Dimensions.get("window").width;

export default function StatusScreen() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ xp_total: 0, nivel: 1, racha_actual: 0 });
  const [chartData, setChartData] = useState({
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"], 
    data: [0, 0, 0, 0, 0, 0, 0] 
  });
  const [stats, setStats] = useState({
    totalHabitos: 0,
    completadosEsteMes: 0,
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribeUser = onSnapshot(doc(db, 'usuarios', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA');
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');
        
        let displayStreak = data.racha_actual || 0;
        const ultimaFecha = data.ultima_fecha_racha;

        if (ultimaFecha && ultimaFecha !== todayStr && ultimaFecha !== yesterdayStr) {
            displayStreak = 0; 
        }

        setUserData({
          ...data,
          racha_actual: displayStreak 
        });
      }
    }, (error) => {
      // PARCHE CRÍTICO: Evitar crash al cerrar sesión
      if (error.code === 'permission-denied') return;
      console.error("Error en Snapshot de Status:", error);
    });

    const fetchAnalytics = async () => {
      try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); 
        
        const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

        const qRegistros = query(
          collection(db, 'registros_habito'),
          where('user_id', '==', user.uid),
          where('fecha_completado', '>=', startDateStr)
        );

        const querySnapshot = await getDocs(qRegistros);
        
        const activityByDate = {};
        let completadosMes = 0;
        
        const daysLabels = [];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const shortDay = d.toLocaleDateString('es-ES', { weekday: 'short' }); 
            
            activityByDate[dateStr] = 0;
            daysLabels.push(shortDay.charAt(0).toUpperCase() + shortDay.slice(1));
        }

        querySnapshot.forEach((documentSnapshot) => {
          const data = documentSnapshot.data();
          const fecha = data.fecha_completado;
          
          if (activityByDate[fecha] !== undefined) {
              activityByDate[fecha] += 1; 
          }
          
          completadosMes++; 
        });

        const dataValues = Object.values(activityByDate);

        setChartData({
            labels: daysLabels,
            data: dataValues.some(val => val > 0) ? dataValues : [0,0,0,0,0,0,0] 
        });

        const qHabitos = query(collection(db, 'habitos'), where('user_id', '==', user.uid), where('activo', '==', true));
        const habitosSnap = await getDocs(qHabitos);
        
        setStats({
            totalHabitos: habitosSnap.size,
            completadosEsteMes: completadosMes
        });

      } catch (error) {
        if (error.code === 'permission-denied') return;
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    return () => unsubscribeUser();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Calculando métricas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <Text style={styles.title}>Tu Progreso</Text>

      <View style={styles.avatarCard}>
        <UserCircle size={90} color="#3B82F6" strokeWidth={1.5} />
        <Text style={styles.avatarText}>
          Nivel Actual: {userData?.nivel || 1}
        </Text>
        <Text style={styles.xpText}>
          {userData?.xp_total || 0} XP Acumulada
        </Text>
      </View>


      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Flame size={24} color="#F97316" fill={userData?.racha_actual > 0 ? "#F97316" : "transparent"} />
            <Text style={styles.cardTitle}>Racha de Constancia</Text>
        </View>
        <Text style={styles.bigText}>{userData?.racha_actual || 0} días</Text>
        <Text style={styles.smallText}>
          {userData?.racha_actual > 0 
            ? "¡Mantén el fuego vivo! Completa un hábito hoy." 
            : "Racha inactiva. Inicia hoy para empezar a contar."}
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.chartTitle}>Actividad (Últimos 7 días)</Text>
        </View>

        {Math.max(...(chartData?.data || [0])) === 0 ? (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                <Activity size={40} color="#475569" />
                <Text style={{ color: '#94A3B8', marginTop: 10 }}>Aún no hay actividad reciente.</Text>
            </View>
        ) : (
            <LineChart
            data={{
                labels: chartData.labels,
                datasets: [
                {
                    data: chartData.data
                }
                ]
            }}
            width={screenWidth - 70} 
            height={220}
            yAxisSuffix=""
            yAxisInterval={1} 
            fromZero={true}
            chartConfig={{
                backgroundColor: "#1E293B",
                backgroundGradientFrom: "#1E293B",
                backgroundGradientTo: "#1E293B",
                decimalPlaces: 0, 
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(203, 213, 245, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#2563EB"
                }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
            />
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Target size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Análisis General</Text>
        </View>

        <Text style={styles.info}>
          Hábitos activos en seguimiento: <Text style={{fontWeight: 'bold', color: 'white'}}>{stats.totalHabitos}</Text>
        </Text>

        <Text style={styles.info}>
          Completados recientemente: <Text style={{fontWeight: 'bold', color: 'white'}}>{stats.completadosEsteMes}</Text>
        </Text>

        <Text style={styles.info}>
          Tendencia: {stats.completadosEsteMes > 5 ? '¡Excelente ritmo! 🔥' : 'Necesitas enfocarte más. 🎯'}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", 
    paddingTop: 60,
    paddingHorizontal: 20
  },
  title: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20
  },
  avatarCard: {
    backgroundColor: "#1E293B",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10
  },
  xpText: {
      color: "#3B82F6",
      fontWeight: "bold",
      marginTop: 5
  },
  card: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardTitle: {
    color: "#CBD5F5",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8
  },
  bigText: {
    color: "white",
    fontSize: 32,
    fontWeight: "black",
    marginTop: 5
  },
  smallText: {
    color: "#94A3B8",
    marginTop: 8,
    lineHeight: 20
  },
  info: {
    color: "#CBD5F5",
    marginTop: 10,
    fontSize: 15
  },
  chartContainer: {
    backgroundColor: "#1E293B",
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  chartTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8
  }
});