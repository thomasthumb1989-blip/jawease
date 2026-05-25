import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ExerciseSession, Streak } from '@/src/types';
import { getItem, setItem, KEYS } from '@/src/utils/storage';

interface ExerciseState {
  sessions: ExerciseSession[];
  streak: Streak;
  addSession: (session: ExerciseSession) => Promise<void>;
  loading: boolean;
}

const defaultStreak: Streak = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: '',
};

const ExerciseContext = createContext<ExerciseState>({
  sessions: [],
  streak: defaultStreak,
  addSession: async () => {},
  loading: true,
});

export function ExerciseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [streak, setStreak] = useState<Streak>(defaultStreak);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [savedSessions, savedStreak] = await Promise.all([
        getItem<ExerciseSession[]>(KEYS.EXERCISE_SESSIONS),
        getItem<Streak>(KEYS.STREAK),
      ]);
      if (savedSessions) setSessions(savedSessions);
      if (savedStreak) setStreak(savedStreak);
      setLoading(false);
    })();
  }, []);

  const addSession = async (session: ExerciseSession) => {
    const updated = [session, ...sessions];
    setSessions(updated);
    await setItem(KEYS.EXERCISE_SESSIONS, updated);

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    let newStreak = { ...streak };
    if (streak.lastCompletedDate === yesterday) {
      newStreak.currentStreak += 1;
    } else if (streak.lastCompletedDate !== today) {
      newStreak.currentStreak = 1;
    }
    newStreak.lastCompletedDate = today;
    newStreak.longestStreak = Math.max(
      newStreak.longestStreak,
      newStreak.currentStreak
    );
    setStreak(newStreak);
    await setItem(KEYS.STREAK, newStreak);
  };

  return (
    <ExerciseContext.Provider value={{ sessions, streak, addSession, loading }}>
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExerciseContext() {
  return useContext(ExerciseContext);
}
