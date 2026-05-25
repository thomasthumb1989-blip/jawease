import { useExerciseContext } from '@/src/contexts/ExerciseContext';

export function useStreak() {
  const { streak } = useExerciseContext();

  const isActiveToday = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return streak.lastCompletedDate === today;
  };

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCompletedDate: streak.lastCompletedDate,
    isActiveToday,
  };
}
