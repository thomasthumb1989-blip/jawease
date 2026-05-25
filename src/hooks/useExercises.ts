import { useMemo } from 'react';
import { exercises } from '@/src/constants/exercises';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import { useUserContext } from '@/src/contexts/UserContext';
import type { Exercise, ExerciseSession, CompletedExercise } from '@/src/types';

export function useExercises() {
  const { sessions, addSession } = useExerciseContext();
  const { profile } = useUserContext();

  const todayExercises = useMemo(() => {
    // Filter exercises based on user difficulty preference
    const maxDifficulty = profile?.difficulty === 'easy' ? 1 : 2;
    return exercises.filter((e) => e.difficulty <= maxDifficulty);
  }, [profile]);

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter((s) => s.date.startsWith(today));
  }, [sessions]);

  const completeExercise = async (
    exercise: Exercise,
    painBefore: number,
    painAfter: number
  ) => {
    const completed: CompletedExercise = {
      exerciseId: exercise.id,
      durationSeconds: exercise.durationSeconds,
      repsCompleted: exercise.reps,
    };

    const session: ExerciseSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: [completed],
      totalDuration: exercise.durationSeconds,
      painBefore,
      painAfter,
    };

    await addSession(session);
  };

  return {
    allExercises: exercises,
    todayExercises,
    completedToday,
    completeExercise,
  };
}
