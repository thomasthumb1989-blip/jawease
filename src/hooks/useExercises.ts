import { useMemo, useCallback } from 'react';
import { exercises } from '@/src/constants/exercises';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import { useUserContext } from '@/src/contexts/UserContext';
import { trackEvent } from '@/src/utils/analytics';
import type { Exercise, ExerciseSession, CompletedExercise } from '@/src/types';

export const REST_DURATION = 15; // seconds between exercises

function dateSeed(): number {
  const d = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = ((hash << 5) - hash + d.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function useExercises() {
  const { sessions, addSession } = useExerciseContext();
  const { profile } = useUserContext();

  const todayExercises = useMemo(() => {
    const diff = profile?.difficulty ?? 'easy';
    const maxDifficulty = diff === 'challenging' ? 3 : diff === 'moderate' ? 2 : 1;
    const count = diff === 'challenging' ? 5 : diff === 'moderate' ? 4 : 3;
    const eligible = exercises.filter((e) => e.difficulty <= maxDifficulty);
    const shuffled = seededShuffle(eligible, dateSeed());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }, [profile]);

  const routineDuration = useMemo(() => {
    const exerciseTime = todayExercises.reduce(
      (sum, e) => sum + e.durationSeconds,
      0
    );
    const restTime = Math.max(0, todayExercises.length - 1) * REST_DURATION;
    return exerciseTime + restTime;
  }, [todayExercises]);

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter((s) => s.date.startsWith(today));
  }, [sessions]);

  const todayCompleted = completedToday.length > 0;

  const saveSession = useCallback(
    async (
      completedExercises: CompletedExercise[],
      totalDuration: number,
      painBefore: number,
      painAfter: number
    ) => {
      const session: ExerciseSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        exercises: completedExercises,
        totalDuration,
        painBefore,
        painAfter,
      };
      await addSession(session);
      trackEvent('exercise_completed', {
        count: completedExercises.length,
        duration: totalDuration,
      });
    },
    [addSession]
  );

  const completeExercise = useCallback(
    async (exercise: Exercise, painBefore: number, painAfter: number) => {
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
    },
    [addSession]
  );

  return {
    allExercises: exercises,
    todayExercises,
    routineDuration,
    completedToday,
    todayCompleted,
    completeExercise,
    saveSession,
  };
}
