import { useMemo } from 'react';
import type { Insight } from '@/src/types';
import { usePainLog } from './usePainLog';
import { useStreak } from './useStreak';

export function useInsights(): Insight[] {
  const { logs, weeklyTrend } = usePainLog();
  const { currentStreak } = useStreak();

  return useMemo(() => {
    const insights: Insight[] = [];

    // Streak insight
    if (currentStreak >= 3) {
      insights.push({
        id: 'streak',
        type: 'streak',
        title: `${currentStreak}-day streak!`,
        message: 'Consistency is key to TMJ recovery. Keep it up!',
        date: new Date().toISOString(),
      });
    }

    // Pain trend insight
    const trend = weeklyTrend();
    const validDays = trend.filter((d) => d >= 0);
    if (validDays.length >= 3) {
      const recent = validDays.slice(-3);
      const earlier = validDays.slice(0, Math.min(3, validDays.length - 3));
      if (earlier.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg =
          earlier.reduce((a, b) => a + b, 0) / earlier.length;
        if (recentAvg < earlierAvg) {
          insights.push({
            id: 'improving',
            type: 'improvement',
            title: 'Pain is trending down',
            message:
              'Your average pain level has decreased over the past few days.',
            date: new Date().toISOString(),
          });
        }
      }
    }

    // Trigger correlation
    if (logs.length >= 5) {
      const triggerCounts: Record<string, number> = {};
      logs.forEach((log) => {
        log.triggers?.forEach((t) => {
          triggerCounts[t] = (triggerCounts[t] || 0) + 1;
        });
      });
      const topTrigger = Object.entries(triggerCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];
      if (topTrigger && topTrigger[1] >= 3) {
        insights.push({
          id: 'trigger',
          type: 'trigger',
          title: `${topTrigger[0]} may be a trigger`,
          message: `You've reported ${topTrigger[0]} ${topTrigger[1]} times alongside jaw pain.`,
          date: new Date().toISOString(),
        });
      }
    }

    return insights;
  }, [logs, currentStreak, weeklyTrend]);
}
