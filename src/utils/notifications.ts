import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getItem, KEYS } from './storage';
import type { ExerciseSession } from '@/src/types';

// ─── Setup ────────────────────────────────────────────────
export async function setupNotifications(): Promise<void> {
  // Set handler to show notifications when app is foregrounded
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('jawease-reminders', {
      name: 'JawEase Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3A7D6E',
    });
  }
}

// ─── Permissions ──────────────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Cancel all ───────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Daily exercise reminder ──────────────────────────────
export async function scheduleDailyReminder(time: Date): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel existing exercise reminders
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if ((n.content.data as Record<string, unknown>)?.type === 'exercise_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for your jaw exercises',
      body: 'A few minutes for a better day',
      data: { type: 'exercise_reminder', route: '/exercise-flow/routine' },
      ...(Platform.OS === 'android' && { channelId: 'jawease-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.getHours(),
      minute: time.getMinutes(),
    },
  });
}

// ─── Pain check-in reminders ──────────────────────────────
export async function schedulePainCheckIn(
  morning: boolean,
  evening: boolean,
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel existing pain reminders
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if ((n.content.data as Record<string, unknown>)?.type === 'pain_checkin') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  if (morning) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Quick check-in',
        body: "How's your jaw right now?",
        data: { type: 'pain_checkin', route: '/pain-log' },
        ...(Platform.OS === 'android' && { channelId: 'jawease-reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  }

  if (evening) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'How was your jaw today?',
        body: 'Log your pain in 5 seconds',
        data: { type: 'pain_checkin', route: '/pain-log' },
        ...(Platform.OS === 'android' && { channelId: 'jawease-reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
  }
}

// ─── Streak reminder (8pm if no exercise today) ───────────
export async function scheduleStreakReminder(
  currentStreak: number,
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel existing streak reminders
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if ((n.content.data as Record<string, unknown>)?.type === 'streak_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  if (currentStreak < 1) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't break your streak!",
      body: `Your ${currentStreak}-day streak is at risk. Quick session?`,
      data: { type: 'streak_reminder', route: '/exercise-flow/routine' },
      ...(Platform.OS === 'android' && { channelId: 'jawease-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

// ─── Cancel by type ───────────────────────────────────────
export async function cancelNotificationsByType(type: string): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if ((n.content.data as Record<string, unknown>)?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
