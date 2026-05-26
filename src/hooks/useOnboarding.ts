import { useUserContext } from '@/src/contexts/UserContext';
import { trackEvent } from '@/src/utils/analytics';
import type { Symptom, Difficulty } from '@/src/types';

export function useOnboarding() {
  const { updateProfile, setOnboardingComplete } = useUserContext();

  const saveSymptoms = async (symptoms: Symptom[]) => {
    await updateProfile({ symptoms });
    trackEvent('onboarding_started', { symptomCount: symptoms.length });
  };

  const saveBaseline = async (baselinePain: number, difficulty: Difficulty) => {
    await updateProfile({ baselinePain, difficulty });
  };

  const saveReminder = async (
    reminderEnabled: boolean,
    reminderTime?: string
  ) => {
    await updateProfile({ reminderEnabled, reminderTime });
  };

  const saveEmail = async (email: string) => {
    await updateProfile({ email });
  };

  const completeOnboarding = async () => {
    await updateProfile({ createdAt: new Date().toISOString() });
    await setOnboardingComplete(true);
    trackEvent('onboarding_completed');
  };

  return {
    saveSymptoms,
    saveBaseline,
    saveReminder,
    saveEmail,
    completeOnboarding,
  };
}
