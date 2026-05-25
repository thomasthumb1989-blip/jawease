import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_PROFILE: 'jawease_user_profile',
  PAIN_LOGS: 'jawease_pain_logs',
  EXERCISE_SESSIONS: 'jawease_exercise_sessions',
  STREAK: 'jawease_streak',
  ONBOARDING_COMPLETE: 'jawease_onboarding_complete',
} as const;

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently fail — storage write errors are non-critical
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silently fail
  }
}

export { KEYS };
