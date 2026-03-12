import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function StatusScreen() {

  const stats = {
    streak: 12,
    bestStreak: 20,
    activeDaysMonth: 18,

    body: {
      weightStart: 78,
      weightCurrent: 74,
      imc: 23.5,
      muscleMass: 41
    },

    workouts: {
      sessionsWeek: 4,
      minutesWeek: 160,
      favoriteExercise: "Cardio"
    },

    progress: [78, 77, 76, 75, 74]
  };

  return (

    <ScrollView style={styles.container}>

      <Text style={styles.title}>Tu progreso</Text>

      <View style={styles.avatarCard}>
        <Ionicons name="person-circle" size={100} color="#3B82F6" />
        <Text style={styles.avatarText}>
          Avatar evoluciona con tu progreso
        </Text>
      </View>


      <View style={styles.card}>
        <Ionicons name="flame" size={30} color="#F97316" />
        <Text style={styles.cardTitle}>Racha actual</Text>
        <Text style={styles.bigText}>{stats.streak} días</Text>
        <Text style={styles.smallText}>
          Mejor racha: {stats.bestStreak} días
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="body" size={30} color="#3B82F6" />
        <Text style={styles.cardTitle}>Evolución corporal</Text>

        <Text style={styles.info}>
          Peso inicial: {stats.body.weightStart} kg
        </Text>

        <Text style={styles.info}>
          Peso actual: {stats.body.weightCurrent} kg
        </Text>

        <Text style={styles.info}>
          IMC: {stats.body.imc}
        </Text>

        <Text style={styles.info}>
          Masa muscular: {stats.body.muscleMass} %
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="barbell" size={30} color="#22C55E" />
        <Text style={styles.cardTitle}>Actividad semanal</Text>

        <Text style={styles.info}>
          Sesiones esta semana: {stats.workouts.sessionsWeek}
        </Text>

        <Text style={styles.info}>
          Minutos entrenados: {stats.workouts.minutesWeek}
        </Text>

        <Text style={styles.info}>
          Ejercicio favorito: {stats.workouts.favoriteExercise}
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Evolución de peso</Text>

        <LineChart
          data={{
            labels: ["Sem1", "Sem2", "Sem3", "Sem4", "Hoy"],
            datasets: [
              {
                data: stats.progress
              }
            ]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#1E293B",
            backgroundGradientFrom: "#1E293B",
            backgroundGradientTo: "#1E293B",
            decimalPlaces: 1,
            color: () => "#3B82F6",
            labelColor: () => "#CBD5F5"
          }}
          style={{
            borderRadius: 16
          }}
        />
      </View>


      <View style={styles.card}>
        <Ionicons name="analytics" size={30} color="#8B5CF6" />
        <Text style={styles.cardTitle}>Análisis</Text>

        <Text style={styles.info}>
          Días activos este mes: {stats.activeDaysMonth}
        </Text>

        <Text style={styles.info}>
          Constancia estimada: 82%
        </Text>

        <Text style={styles.info}>
          Tendencia: Mejora constante
        </Text>
      </View>

    </ScrollView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    marginBottom: 15
  },

  avatarText: {
    color: "#94A3B8",
    marginTop: 10
  },

  card: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15
  },

  cardTitle: {
    color: "#CBD5F5",
    marginTop: 8,
    fontSize: 16
  },

  bigText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold"
  },

  smallText: {
    color: "#94A3B8",
    marginTop: 5
  },

  info: {
    color: "#CBD5F5",
    marginTop: 5
  },

  chartContainer: {
    backgroundColor: "#1E293B",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15
  },

  chartTitle: {
    color: "white",
    marginBottom: 10,
    fontSize: 16
  }

});