import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// ─── Foreground behavior ──────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ─── Shift → hour mapping ─────────────────────────────────────────────────────
export const HORARIO_HOURS = {
  mañana:     { hour: 8,  minute: 0 },
  tarde:      { hour: 15, minute: 0 },
  noche:      { hour: 21, minute: 0 },
  cualquiera: { hour: 9,  minute: 0 },
};

// ─── Frequency check ──────────────────────────────────────────────────────────
function habitIsForToday(habit) {
  const day = new Date().getDay();
  switch (habit.frecuencia) {
    case 'diario':           return true;
    case 'entre_semana':     return day >= 1 && day <= 5;
    case 'fines_semana':     return day === 0 || day === 6;
    case 'dias_especificos': return Array.isArray(habit.dias_semana) && habit.dias_semana.includes(day);
    case 'cada_x_dias': {
      if (!habit.fecha_inicio || !habit.cada_x_dias) return true;
      const start = new Date(habit.fecha_inicio); start.setHours(0, 0, 0, 0);
      const now   = new Date();                   now.setHours(0, 0, 0, 0);
      const diff  = Math.round((now - start) / 86400000);
      return diff >= 0 && diff % habit.cada_x_dias === 0;
    }
    default: return true;
  }
}

// ─── Request permissions ──────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('trackly-habitos', {
      name:             'Recordatorios de hábitos',
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#6366F1',
      sound:            'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Build trigger — FIX: now uses type:'daily' as required by new Expo SDK ───
function buildDailyTrigger(hour, minute) {
  // The trigger format changed in expo-notifications SDK 51+
  // Must include explicit 'type' field
  return {
    type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
    hour,
    minute,
  };
}

function buildReminderTrigger(hour, minute) {
  return {
    type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
    hour,
    minute,
  };
}

// ─── Schedule a single habit notification ─────────────────────────────────────
export async function scheduleHabitNotification(habit) {
  const cfg = HORARIO_HOURS[habit.horario] ?? HORARIO_HOURS.cualquiera;

  await cancelHabitNotification(habit.id);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}`,
      content: {
        title:  `${habit.icono} ${habit.titulo}`,
        body:   `¡Hora de completar tu hábito y ganar +${habit.valor_xp || 10} XP! 💪`,
        data:   { habitId: habit.id },
        sound:  'default',
        ...(Platform.OS === 'android' && { channelId: 'trackly-habitos' }),
      },
      trigger: buildDailyTrigger(cfg.hour, cfg.minute),
    });
  } catch (e) {
    console.error(`[Notifications] scheduleHabitNotification error for ${habit.id}:`, e);
  }
}

// ─── Schedule reminder 2h after shift ────────────────────────────────────────
export async function scheduleCompletionReminder(habit) {
  const cfg         = HORARIO_HOURS[habit.horario] ?? HORARIO_HOURS.cualquiera;
  const reminderHour = Math.min(cfg.hour + 2, 22);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${habit.id}`,
      content: {
        title:  `⏰ ¿Ya completaste "${habit.titulo}"?`,
        body:   `No pierdas tu racha — aún puedes ganar +${habit.valor_xp || 10} XP hoy.`,
        data:   { habitId: habit.id },
        sound:  'default',
        ...(Platform.OS === 'android' && { channelId: 'trackly-habitos' }),
      },
      trigger: buildReminderTrigger(reminderHour, cfg.minute),
    });
  } catch (e) {
    console.error(`[Notifications] scheduleCompletionReminder error for ${habit.id}:`, e);
  }
}

// ─── Cancel both notifications for a habit ───────────────────────────────────
export async function cancelHabitNotification(habitId) {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`),
    Notifications.cancelScheduledNotificationAsync(`reminder-${habitId}`),
  ]);
}

// ─── Called when user completes a habit ──────────────────────────────────────
export async function onHabitCompleted(habitId) {
  await cancelHabitNotification(habitId);
}

// ─── Called when user uncompletes a habit ────────────────────────────────────
export async function onHabitUncompleted(habit) {
  await scheduleHabitNotification(habit);
  await scheduleCompletionReminder(habit);
}

// ─── Bootstrap: schedule all active habits ───────────────────────────────────
export async function scheduleAllHabits(completedTodayIds = []) {
  const user = auth.currentUser;
  if (!user) return;

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.warn('[Notifications] Permission denied');
    return;
  }

  try {
    const snap = await getDocs(
      query(
        collection(db, 'habitos'),
        where('user_id', '==', user.uid),
        where('activo',  '==', true),
      )
    );

    for (const doc of snap.docs) {
      const habit = { id: doc.id, ...doc.data() };

      if (!habitIsForToday(habit)) {
        await cancelHabitNotification(habit.id);
        continue;
      }

      if (completedTodayIds.includes(habit.id)) {
        await cancelHabitNotification(habit.id);
      } else {
        await scheduleHabitNotification(habit);
        await scheduleCompletionReminder(habit);
      }
    }

    console.log(`[Notifications] Scheduled ${snap.size} habits`);
  } catch (e) {
    console.error('[Notifications] scheduleAllHabits error:', e);
  }
}

// ─── Cancel all (logout / disable) ───────────────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  try { await Notifications.setBadgeCountAsync(0); } catch (_) {}
}