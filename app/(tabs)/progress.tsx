import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Rect,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle as SvgCircle,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import {
  Heading,
  BodyText,
  Card,
  GlassCard,
  Caption,
  EmptyState,
  PaywallGate,
  LoadingIndicator,
} from '@/src/components/ui';
import { Fonts } from '@/src/constants/fonts';
import { useStreak } from '@/src/hooks/useStreak';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import { useInsights } from '@/src/hooks/useInsights';
import { exercises as allExerciseData } from '@/src/constants/exercises';

const DAY_MS = 86_400_000;
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Helpers ──────────────────────────────────────────────
function isoDate(offset: number): string {
  return new Date(Date.now() + offset * DAY_MS).toISOString().split('T')[0];
}

function shortDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── FadeIn ───────────────────────────────────────────────
function FadeIn({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 20, stiffness: 150 }),
    );
  }, [delay, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Animated number (count-up) ───────────────────────────
function AnimatedNumber({
  value,
  color,
  size = 28,
}: {
  value: number;
  color: string;
  size?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let frame = 0;
    const total = 30; // frames
    const step = value / total;
    const interval = setInterval(() => {
      frame++;
      if (frame >= total) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.round(step * frame));
      }
    }, 20);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <Text style={[styles.animNum, { color, fontSize: size }]}>{display}</Text>
  );
}

// ─── Filter pill ──────────────────────────────────────────
function RangePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.rangePill,
        {
          backgroundColor: selected ? theme.primary : theme.card,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.rangePillText,
          { color: selected ? '#FFFFFF' : theme.text },
          selected && { fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Pain Chart (SVG line) ────────────────────────────────
const CHART_W = 320;
const CHART_H = 160;
const CHART_PAD_L = 28;
const CHART_PAD_R = 8;
const CHART_PAD_T = 8;
const CHART_PAD_B = 24;
const PLOT_W = CHART_W - CHART_PAD_L - CHART_PAD_R;
const PLOT_H = CHART_H - CHART_PAD_T - CHART_PAD_B;

function PainChart({
  data,
  labels,
}: {
  data: { date: string; value: number }[];
  labels: string[];
}) {
  const theme = useTheme();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    val: number;
    date: string;
  } | null>(null);

  // Animated line draw
  const dashProgress = useSharedValue(0);
  useEffect(() => {
    dashProgress.value = 0;
    dashProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [data, dashProgress]);

  if (data.length < 2) return null;

  const maxY = 10;
  const toX = (i: number) =>
    CHART_PAD_L + (i / (data.length - 1)) * PLOT_W;
  const toY = (v: number) =>
    CHART_PAD_T + PLOT_H - (v / maxY) * PLOT_H;

  // Build path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`)
    .join(' ');

  // Area path (fill under line)
  const areaPath =
    linePath +
    ` L${toX(data.length - 1).toFixed(1)},${(CHART_PAD_T + PLOT_H).toFixed(1)}` +
    ` L${toX(0).toFixed(1)},${(CHART_PAD_T + PLOT_H).toFixed(1)} Z`;

  // Estimate total path length for dash animation
  let pathLen = 0;
  for (let i = 1; i < data.length; i++) {
    const dx = toX(i) - toX(i - 1);
    const dy = toY(data[i].value) - toY(data[i - 1].value);
    pathLen += Math.sqrt(dx * dx + dy * dy);
  }

  const animatedLineProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLen * (1 - dashProgress.value),
  }));

  // Grid lines
  const gridLevels = [0, 2, 4, 6, 8, 10];

  // X-axis labels: show max 7
  const step = Math.max(1, Math.floor(data.length / 7));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={theme.primary} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Grid */}
        {gridLevels.map((lv) => (
          <Line
            key={lv}
            x1={CHART_PAD_L}
            y1={toY(lv)}
            x2={CHART_W - CHART_PAD_R}
            y2={toY(lv)}
            stroke={theme.border}
            strokeWidth={0.5}
          />
        ))}

        {/* Y-axis labels */}
        {gridLevels.map((lv) => (
          <SvgText
            key={`y-${lv}`}
            x={CHART_PAD_L - 6}
            y={toY(lv) + 4}
            fill={theme.textMuted}
            fontSize={10}
            textAnchor="end"
          >
            {lv}
          </SvgText>
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaFill)" />

        {/* Animated line */}
        <AnimatedPath
          d={linePath}
          stroke={theme.primary}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          animatedProps={animatedLineProps}
        />

        {/* Data points */}
        {data.map((d, i) => (
          <SvgCircle
            key={i}
            cx={toX(i)}
            cy={toY(d.value)}
            r={3.5}
            fill={theme.primary}
            onPress={() =>
              setTooltip(
                tooltip?.date === d.date
                  ? null
                  : { x: toX(i), y: toY(d.value), val: d.value, date: d.date },
              )
            }
          />
        ))}

        {/* Tooltip */}
        {tooltip && (
          <>
            <Rect
              x={tooltip.x - 28}
              y={tooltip.y - 28}
              width={56}
              height={22}
              rx={6}
              fill={theme.text}
            />
            <SvgText
              x={tooltip.x}
              y={tooltip.y - 14}
              fill={theme.background}
              fontSize={11}
              fontWeight="600"
              textAnchor="middle"
            >
              {tooltip.val}/10
            </SvgText>
          </>
        )}

        {/* X-axis labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          return (
            <SvgText
              key={`x-${i}`}
              x={toX(idx)}
              y={CHART_H - 4}
              fill={theme.textMuted}
              fontSize={9}
              textAnchor="middle"
            >
              {shortDate(d.date)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Heatmap (28-day calendar grid) ──────────────────────
const CELL = 16;
const GAP = 3;
const HEAT_COLS = 7;
const HEAT_ROWS = 4;

function Heatmap({ sessionDates }: { sessionDates: Set<string> }) {
  const theme = useTheme();
  const today = isoDate(0);

  const cells: { date: string; active: boolean; isToday: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = isoDate(-i);
    cells.push({
      date: d,
      active: sessionDates.has(d),
      isToday: d === today,
    });
  }

  const w = HEAT_COLS * (CELL + GAP) - GAP;
  const h = HEAT_ROWS * (CELL + GAP) - GAP;

  return (
    <Svg width={w} height={h}>
      {cells.map((cell, idx) => {
        const col = idx % HEAT_COLS;
        const row = Math.floor(idx / HEAT_COLS);
        return (
          <Rect
            key={cell.date}
            x={col * (CELL + GAP)}
            y={row * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={4}
            fill={cell.active ? theme.success : theme.border + '40'}
            stroke={cell.isToday ? theme.accent : 'none'}
            strokeWidth={cell.isToday ? 2 : 0}
          />
        );
      })}
    </Svg>
  );
}

// ─── Confidence bar ───────────────────────────────────────
function ConfidenceBar({ value, color }: { value: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.confTrack, { backgroundColor: theme.border + '40' }]}>
      <View
        style={[
          styles.confFill,
          { width: `${Math.round(value * 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────
export default function ProgressScreen() {
  const theme = useTheme();
  const { currentStreak, longestStreak } = useStreak();
  const { logs, loading: painLoading } = usePainLog();
  const { sessions, loading: exerciseLoading } = useExerciseContext();
  const insights = useInsights();

  const [refreshing, setRefreshing] = useState(false);
  const [chartRange, setChartRange] = useState<7 | 30 | 90>(7);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // ── Hero metric: this-week avg + last-week avg ──
  const { thisWeekAvg, lastWeekAvg, trendDirection, trendPct } = useMemo(() => {
    const calcAvg = (startOff: number, endOff: number) => {
      const start = isoDate(startOff);
      const end = isoDate(endOff);
      const filtered = logs.filter((l) => {
        const d = l.date.split('T')[0];
        return d >= start && d <= end;
      });
      if (filtered.length === 0) return -1;
      return filtered.reduce((s, l) => s + l.painLevel, 0) / filtered.length;
    };

    const tw = calcAvg(-6, 0);
    const lw = calcAvg(-13, -7);
    let dir: 'down' | 'up' | 'flat' = 'flat';
    let pct = 0;
    if (tw >= 0 && lw >= 0 && lw > 0) {
      pct = Math.round(((lw - tw) / lw) * 100);
      dir = pct > 5 ? 'down' : pct < -5 ? 'up' : 'flat';
    }
    return { thisWeekAvg: tw, lastWeekAvg: lw, trendDirection: dir, trendPct: pct };
  }, [logs]);

  // ── Chart data ──
  const chartData = useMemo(() => {
    const days = chartRange;
    const byDate: Record<string, { sum: number; count: number }> = {};
    logs.forEach((l) => {
      const d = l.date.split('T')[0];
      if (!byDate[d]) byDate[d] = { sum: 0, count: 0 };
      byDate[d].sum += l.painLevel;
      byDate[d].count += 1;
    });

    const result: { date: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = isoDate(-i);
      if (byDate[d]) {
        result.push({ date: d, value: Math.round(byDate[d].sum / byDate[d].count) });
      }
    }
    return result;
  }, [logs, chartRange]);

  // ── Session dates for heatmap ──
  const sessionDates = useMemo(
    () => new Set(sessions.map((s) => s.date.split('T')[0])),
    [sessions],
  );

  // ── Exercise stats ──
  const { totalSessions, totalMinutes, topExerciseName } = useMemo(() => {
    const total = sessions.length;
    const mins = Math.round(
      sessions.reduce((s, ses) => s + ses.totalDuration, 0) / 60,
    );

    // Most completed exercise
    const counts: Record<string, number> = {};
    sessions.forEach((ses) =>
      ses.exercises.forEach((e) => {
        counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1;
      }),
    );
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topName = topId
      ? allExerciseData.find((e) => e.id === topId)?.name ?? 'Unknown'
      : '—';

    return { totalSessions: total, totalMinutes: mins, topExerciseName: topName };
  }, [sessions]);

  // Flame scale
  const flameSize = currentStreak >= 8 ? 32 : currentStreak >= 4 ? 24 : 18;

  if (painLoading || exerciseLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <LoadingIndicator />
      </SafeAreaView>
    );
  }

  const hasEnoughData = logs.length >= 1;

  // Hero trend arrow + color
  const trendArrow = trendDirection === 'down' ? '↓' : trendDirection === 'up' ? '↑' : '→';
  const trendColor =
    trendDirection === 'down'
      ? theme.success
      : trendDirection === 'up'
        ? theme.error
        : theme.accent;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <Heading>Progress</Heading>

        {/* ── 1. Hero Metric ── */}
        <FadeIn delay={0}>
          {!hasEnoughData ? (
            <GlassCard>
              <EmptyState
                title="No data yet"
                message="Log your pain to see trends"
              />
            </GlassCard>
          ) : (
            <GlassCard style={styles.heroCard}>
              <View style={styles.heroRow}>
                <Text style={[styles.heroNumber, { color: theme.text }]}>
                  {thisWeekAvg >= 0 ? thisWeekAvg.toFixed(1) : '—'}
                </Text>
                <Text style={[styles.heroArrow, { color: trendColor }]}>
                  {trendArrow}
                </Text>
              </View>
              <Caption muted>Average pain this week</Caption>
              {lastWeekAvg >= 0 && Math.abs(trendPct) >= 5 && (
                <Caption muted>
                  {trendDirection === 'down' ? 'Down' : 'Up'} from{' '}
                  {lastWeekAvg.toFixed(1)} last week
                </Caption>
              )}
            </GlassCard>
          )}
        </FadeIn>

        {/* ── 2. Streak + Heatmap ── */}
        <FadeIn delay={100}>
          <PaywallGate feature="Streak Tracking">
            <Card variant="elevated">
              <View style={styles.streakRow}>
                <View style={styles.streakLeft}>
                  <Text style={[styles.streakNum, { color: theme.accent }]}>
                    {currentStreak}
                  </Text>
                  <Text style={[styles.streakLabel, { color: theme.text }]}>
                    Day Streak
                  </Text>
                  <Text style={{ fontSize: flameSize }}>{'🔥'}</Text>
                </View>
                <View style={styles.streakRight}>
                  <Caption muted>
                    Personal best: {longestStreak} days
                  </Caption>
                </View>
              </View>

              <View style={styles.heatmapContainer}>
                <Caption muted style={{ marginBottom: 8 }}>
                  Last 28 days
                </Caption>
                <Heatmap sessionDates={sessionDates} />
              </View>
            </Card>
          </PaywallGate>
        </FadeIn>

        {/* ── 3. Pain Chart ── */}
        <FadeIn delay={200}>
          <PaywallGate feature="Pain Analytics">
            <Card variant="elevated">
              <Heading level={3}>Pain History</Heading>

              <View style={styles.rangeRow}>
                {([7, 30, 90] as const).map((r) => (
                  <RangePill
                    key={r}
                    label={`${r} Days`}
                    selected={chartRange === r}
                    onPress={() => setChartRange(r)}
                  />
                ))}
              </View>

              {chartData.length < 3 ? (
                <View style={styles.chartEmpty}>
                  <Caption muted>
                    Keep logging to see your chart (need 3+ entries)
                  </Caption>
                </View>
              ) : (
                <PainChart data={chartData} labels={[]} />
              )}
            </Card>
          </PaywallGate>
        </FadeIn>

        {/* ── 4. Insights ── */}
        <FadeIn delay={300}>
          <PaywallGate feature="Smart Insights">
            <View style={styles.insightsSection}>
              <Heading level={3}>Smart Insights</Heading>

              {logs.length < 7 ? (
                <Card>
                  <Caption muted>
                    Keep logging for 7 days to unlock insights
                  </Caption>
                </Card>
              ) : insights.length === 0 ? (
                <Card>
                  <Caption muted>
                    Not enough patterns yet — keep logging!
                  </Caption>
                </Card>
              ) : (
                insights.slice(0, 3).map((insight) => (
                  <GlassCard key={insight.id} style={styles.insightCard}>
                    <View
                      style={[
                        styles.insightAccent,
                        { backgroundColor: theme.accent },
                      ]}
                    />
                    <View style={styles.insightContent}>
                      <Text
                        style={[styles.insightTitle, { color: theme.text }]}
                      >
                        {insight.title}
                      </Text>
                      <BodyText variant="secondary">{insight.message}</BodyText>
                      {insight.confidence != null && (
                        <ConfidenceBar
                          value={insight.confidence}
                          color={theme.primary}
                        />
                      )}
                    </View>
                  </GlassCard>
                ))
              )}
            </View>
          </PaywallGate>
        </FadeIn>

        {/* ── 5. Exercise Stats ── */}
        <FadeIn delay={400}>
          <Card variant="elevated">
            <Heading level={3}>Exercise Stats</Heading>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <AnimatedNumber
                  value={totalSessions}
                  color={theme.accent}
                  size={32}
                />
                <Caption muted>Sessions</Caption>
              </View>
              <View style={styles.statBlock}>
                <AnimatedNumber
                  value={totalMinutes}
                  color={theme.accent}
                  size={32}
                />
                <Caption muted>Minutes</Caption>
              </View>
            </View>
            {topExerciseName !== '—' && (
              <View style={[styles.topExercise, { borderTopColor: theme.border }]}>
                <Caption muted>Most completed</Caption>
                <Text style={[styles.topName, { color: theme.text }]}>
                  {topExerciseName}
                </Text>
              </View>
            )}
          </Card>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },

  // Hero
  heroCard: { alignItems: 'center', gap: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  heroNumber: { fontSize: 48, fontWeight: '700', fontFamily: Fonts.heading },
  heroArrow: { fontSize: 32, fontWeight: '700', fontFamily: Fonts.heading },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  streakLeft: { alignItems: 'center', gap: 2 },
  streakRight: {},
  streakNum: { fontSize: 40, fontWeight: '700', fontFamily: Fonts.heading },
  streakLabel: { fontSize: 14, fontWeight: '600' },
  heatmapContainer: { alignItems: 'center' },

  // Chart
  rangeRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  rangePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  rangePillText: { fontSize: 13 },
  chartEmpty: { height: 100, justifyContent: 'center', alignItems: 'center' },

  // Insights
  insightsSection: { gap: 12 },
  insightCard: { flexDirection: 'row', overflow: 'hidden' },
  insightAccent: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  insightContent: { flex: 1, gap: 6 },
  insightTitle: { fontSize: 16, fontWeight: '600' },

  // Confidence bar
  confTrack: { height: 4, borderRadius: 2, marginTop: 4 },
  confFill: { height: 4, borderRadius: 2 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  statBlock: { flex: 1, alignItems: 'center', gap: 4 },
  animNum: { fontWeight: '700' },
  topExercise: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  topName: { fontSize: 16, fontWeight: '600' },
});
