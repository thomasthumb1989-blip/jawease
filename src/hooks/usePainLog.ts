import { useState, useEffect, useCallback } from 'react';
import type { PainLog } from '@/src/types';
import { getItem, setItem, KEYS } from '@/src/utils/storage';
import { trackEvent } from '@/src/utils/analytics';

export function usePainLog() {
  const [logs, setLogs] = useState<PainLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getItem<PainLog[]>(KEYS.PAIN_LOGS);
      if (saved) setLogs(saved);
      setLoading(false);
    })();
  }, []);

  const addLog = useCallback(
    async (log: Omit<PainLog, 'id'>) => {
      const newLog: PainLog = { ...log, id: Date.now().toString() };
      const updated = [newLog, ...logs];
      setLogs(updated);
      await setItem(KEYS.PAIN_LOGS, updated);
      trackEvent('pain_logged', { level: log.painLevel });
    },
    [logs]
  );

  const todayAverage = (): number => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter((l) => l.date.startsWith(today));
    if (todayLogs.length === 0) return -1;
    const sum = todayLogs.reduce((acc, l) => acc + l.painLevel, 0);
    return Math.round(sum / todayLogs.length);
  };

  const weeklyTrend = (): number[] => {
    const result: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000)
        .toISOString()
        .split('T')[0];
      const dayLogs = logs.filter((l) => l.date.startsWith(date));
      if (dayLogs.length === 0) {
        result.push(-1);
      } else {
        const avg =
          dayLogs.reduce((acc, l) => acc + l.painLevel, 0) / dayLogs.length;
        result.push(Math.round(avg));
      }
    }
    return result;
  };

  return { logs, loading, addLog, todayAverage, weeklyTrend };
}
