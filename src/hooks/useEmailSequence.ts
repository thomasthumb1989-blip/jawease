import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserContext } from '@/src/contexts/UserContext';
import { useSubscriptionContext } from '@/src/contexts/SubscriptionContext';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import {
  sendNudgeEmail,
  sendTrialExpiryEmail,
  sendWinBackEmail,
} from '@/src/utils/email';

const DAY_MS = 86_400_000;
const KEYS = {
  captured: 'jawease_email_captured_at',
  nudge: 'jawease_email_nudge_sent',
  trialExpiry: 'jawease_email_trial_expiry_sent',
  winBack: 'jawease_email_winback_sent',
};

/**
 * Runs on every app open. Checks if email sequence emails should fire.
 * All fire-and-forget. Failures never crash the app.
 */
export function useEmailSequence() {
  const { profile } = useUserContext();
  const { status, loading: subLoading } = useSubscriptionContext();
  const { sessions, loading: exLoading } = useExerciseContext();

  useEffect(() => {
    if (subLoading || exLoading) return;

    const email = profile?.email;
    if (!email) return;

    // Fire-and-forget
    runSequence(email, status, sessions.length).catch(() => {});
  }, [profile, status, subLoading, exLoading, sessions.length]);
}

async function runSequence(
  email: string,
  status: string,
  sessionCount: number,
): Promise<void> {
  // Ensure we have a capture timestamp
  let capturedStr = await AsyncStorage.getItem(KEYS.captured);
  if (!capturedStr) {
    capturedStr = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.captured, capturedStr);
  }
  const capturedAt = new Date(capturedStr).getTime();
  const daysSince = (Date.now() - capturedAt) / DAY_MS;

  // ── Day 1: Nudge if no exercise session ──
  if (daysSince >= 1 && sessionCount === 0) {
    const sent = await AsyncStorage.getItem(KEYS.nudge);
    if (!sent) {
      await sendNudgeEmail(email);
      await AsyncStorage.setItem(KEYS.nudge, new Date().toISOString());
    }
  }

  // ── Day 3: Trial expiry warning ──
  // 'free' only, never 'error': an SDK that failed to initialise means a
  // broken install, not a prospect to upsell.
  if (daysSince >= 3 && (status === 'expired' || status === 'free')) {
    const sent = await AsyncStorage.getItem(KEYS.trialExpiry);
    if (!sent) {
      await sendTrialExpiryEmail(email);
      await AsyncStorage.setItem(KEYS.trialExpiry, new Date().toISOString());
    }
  }

  // ── Day 7+: Win-back ──
  // 'free' only, never 'error' — same reasoning as the day-3 sequence.
  if (daysSince >= 7 && (status === 'expired' || status === 'free')) {
    const sent = await AsyncStorage.getItem(KEYS.winBack);
    if (!sent) {
      await sendWinBackEmail(email);
      await AsyncStorage.setItem(KEYS.winBack, new Date().toISOString());
    }
  }
}
