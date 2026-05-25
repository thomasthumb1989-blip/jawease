import { useUserContext } from '@/src/contexts/UserContext';
import { trackEvent } from '@/src/utils/analytics';
import type { Symptom, Trigger, Difficulty } from '@/src/types';

export function useOnboarding() {
  const { updateProfile, setOnboardingComplete } = useUserContext();

  const saveSymptoms = async (symptoms: Symptom[]) => {
    await updateProfile({ symptoms });
  };

  const saveBaseline = async (
    baselinePain: number,
    difficulty: Difficulty
  ) => {
    await updateProfile({ baselinePain, difficulty });
  };

  const saveReminder = async (
    reminderEnabled: boolean,
    reminderTime?: string
  ) => {
    await updateProfile({ reminderEnabled, reminderTime });
  };

  const completeOnboarding = async () => {
    await setOnboardingComplete(true);
    trackEvent('onboarding_completed');
  };

  return {
    saveSymptoms,
    saveBaseline,
    saveReminder,
    completeOnboarding,
  };
}
