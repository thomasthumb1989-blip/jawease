import { useMemo } from 'react';
import type { Insight, PainLog } from '@/src/types';
import { Strings } from '@/src/constants/strings';
import { usePainLog } from './usePainLog';
import { useStreak } from './useStreak';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';

const DAY_MS = 86_400_000;

/** Average pain for logs in a date range (ISO date strings, inclusive) */
function avgPainForRange(logs: PainLog[], startDate: string, endDate: string): number {
  const filtered = logs.filter((l) => {
    const d = l.date.split('T')[0];
    return d >= startDate && d <= endDate;
  });
  if (filtered.length === 0) return -1;
  return filtered.reduce((s, l) => s + l.painLevel, 0) / filtered.length;
}

function isoDate(offset: number): string {
  return new Date(Date.now() + offset * DAY_MS).toISOString().split('T')[0];
}

export function useInsights(): Insight[] {
  const { logs } = usePainLog();
  const { currentStreak } = useStreak();
  const { sessions } = useExerciseContext();

  return useMemo(() => {
    const insights: Insight[] = [];
    const now = new Date().toISOString();

    // ── Streak insight ──
    if (currentStreak >= 3) {
      insights.push({
        id: 'streak',
        type: 'streak',
        title: `${currentStreak}-day streak!`,
        message: 'Consistency is key to TMJ recovery. Keep it up!',
        date: now,
        confidence: Math.min(currentStreak / 14, 1),
      });
    }

    // ── Pain trend: this week vs last week ──
    const thisWeekAvg = avgPainForRange(logs, isoDate(-6), isoDate(0));
    const lastWeekAvg = avgPainForRange(logs, isoDate(-13), isoDate(-7));
    if (thisWeekAvg >= 0 && lastWeekAvg >= 0) {
      const diff = lastWeekAvg - thisWeekAvg;
      const pct = lastWeekAvg > 0 ? Math.round((diff / lastWeekAvg) * 100) : 0;
      if (Math.abs(pct) >= 5) {
        const improving = diff > 0;
        insights.push({
          id: 'weekly-trend',
          type: 'improvement',
          title: improving
            ? `Pain down ${Math.abs(pct)}% this week`
            : `Pain up ${Math.abs(pct)}% this week`,
          message: improving
            ? `Average dropped from ${lastWeekAvg.toFixed(1)} to ${thisWeekAvg.toFixed(1)}.`
            : `Average rose from ${lastWeekAvg.toFixed(1)} to ${thisWeekAvg.toFixed(1)}. Take it easy.`,
          date: now,
          confidence: Math.min(Math.abs(pct) / 50, 1),
        });
      }
    }

    // ── Exercise impact: pain on exercise days vs rest days ──
    if (logs.length >= 5 && sessions.length >= 3) {
      const exerciseDates = new Set(
        sessions.map((s) => s.date.split('T')[0]),
      );
      const exerciseDayPain: number[] = [];
      const restDayPain: number[] = [];

      // Group logs by date
      const logsByDate: Record<string, number[]> = {};
      logs.forEach((l) => {
        const d = l.date.split('T')[0];
        if (!logsByDate[d]) logsByDate[d] = [];
        logsByDate[d].push(l.painLevel);
      });

      Object.entries(logsByDate).forEach(([date, levels]) => {
        const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
        if (exerciseDates.has(date)) {
          exerciseDayPain.push(avg);
        } else {
          restDayPain.push(avg);
        }
      });

      if (exerciseDayPain.length >= 3 && restDayPain.length >= 2) {
        const exAvg =
          exerciseDayPain.reduce((a, b) => a + b, 0) / exerciseDayPain.length;
        const restAvg =
          restDayPain.reduce((a, b) => a + b, 0) / restDayPain.length;
        if (restAvg > 0) {
          const pctLower = Math.round(((restAvg - exAvg) / restAvg) * 100);
          if (pctLower > 5) {
            insights.push({
              id: 'exercise-impact',
              type: 'exercise_impact',
              title: 'Exercise helps your jaw',
              message: `Pain is ${pctLower}% lower on days you exercise (${exAvg.toFixed(1)} vs ${restAvg.toFixed(1)}).`,
              date: now,
              confidence: Math.min(
                (exerciseDayPain.length + restDayPain.length) / 20,
                1,
              ),
            });
          }
        }
      }
    }

    // ── Trigger correlations ──
    if (logs.length >= 5) {
      const triggerKeys = Object.keys(Strings.triggers) as Array<
        keyof typeof Strings.triggers
      >;

      triggerKeys.forEach((trigger) => {
        const withTrigger: number[] = [];
        const withoutTrigger: number[] = [];

        logs.forEach((log) => {
          if (log.triggers?.includes(trigger)) {
            withTrigger.push(log.painLevel);
          } else {
            withoutTrigger.push(log.painLevel);
          }
        });

        if (withTrigger.length >= 3 && withoutTrigger.length >= 3) {
          const avgWith =
            withTrigger.reduce((a, b) => a + b, 0) / withTrigger.length;
          const avgWithout =
            withoutTrigger.reduce((a, b) => a + b, 0) / withoutTrigger.length;
          const diff = avgWith - avgWithout;

          if (diff > 0.5) {
            const label =
              Strings.triggers[trigger as keyof typeof Strings.triggers];
            insights.push({
              id: `trigger-${trigger}`,
              type: 'trigger',
              title: `${label} affects your pain`,
              message: `Pain averages ${avgWith.toFixed(1)} with ${label.toLowerCase()} vs ${avgWithout.toFixed(1)} without.`,
              date: now,
              confidence: Math.min(
                (withTrigger.length / 10) * (diff / 3),
                1,
              ),
            });
          }
        }
      });
    }

    // ── Best / worst day of week ──
    if (logs.length >= 14) {
      const dayTotals: Record<number, { sum: number; count: number }> = {};
      logs.forEach((l) => {
        const day = new Date(l.date).getDay();
        if (!dayTotals[day]) dayTotals[day] = { sum: 0, count: 0 };
        dayTotals[day].sum += l.painLevel;
        dayTotals[day].count += 1;
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayAvgs = Object.entries(dayTotals)
        .filter(([, v]) => v.count >= 2)
        .map(([d, v]) => ({ day: Number(d), avg: v.sum / v.count, count: v.count }));

      if (dayAvgs.length >= 5) {
        const sorted = [...dayAvgs].sort((a, b) => a.avg - b.avg);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        if (worst.avg - best.avg > 1) {
          insights.push({
            id: 'day-pattern',
            type: 'trigger',
            title: `${dayNames[worst.day]}s are toughest`,
            message: `Average pain is ${worst.avg.toFixed(1)} on ${dayNames[worst.day]}s vs ${best.avg.toFixed(1)} on ${dayNames[best.day]}s.`,
            date: now,
            confidence: Math.min(
              (best.count + worst.count) / 20,
              1,
            ),
          });
        }
      }
    }

    // Sort by confidence descending, return top insights
    return insights
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .slice(0, 5);
  }, [logs, currentStreak, sessions]);
}
