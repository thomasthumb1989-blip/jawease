import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import {
  Heading,
  BodyText,
  Card,
  GlassCard,
  PainOrb,
  Button,
  Caption,
  PaywallGate,
  LoadingIndicator,
} from '@/src/components/ui';
import { useUserContext } from '@/src/contexts/UserContext';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import { useStreak } from '@/src/hooks/useStreak';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useExercises } from '@/src/hooks/useExercises';
import { useInsights } from '@/src/hooks/useInsights';

// ─── Helpers ──────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getTodayTip(): string {
  const d = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = ((hash << 5) - hash + d.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % Strings.tips.length;
  return Strings.tips[idx];
}

function formatTime(date: string): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ─── Staggered fade-in wrapper ────────────────────────────
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

// ─── Collapsible tip card ─────────────────────────────────
function TipCard() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(0);
  const tip = useMemo(getTodayTip, []);

  const toggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !expanded;
    setExpanded(next);
    height.value = withSpring(next ? 1 : 0, { damping: 20, stiffness: 150 });
  }, [expanded, height]);

  const bodyStyle = useAnimatedStyle(() => ({
    maxHeight: height.value * 80,
    opacity: height.value,
    marginTop: height.value * 10,
  }));

  return (
    <Card onPress={toggle}>
      <View style={styles.tipHeader}>
        <Ionicons name="bulb-outline" size={20} color={theme.accent} />
        <Text style={[styles.tipTitle, { color: theme.text }]}>
          Tip of the Day
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textMuted}
        />
      </View>
      <Animated.View style={[styles.tipBody, bodyStyle]}>
        <BodyText variant="secondary">{tip}</BodyText>
      </Animated.View>
    </Card>
  );
}

// ─── Main screen ──────────────────────────────────────────
export default function TodayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, loading: profileLoading } = useUserContext();
  const { loading: exerciseLoading } = useExerciseContext();
  const { currentStreak, isActiveToday } = useStreak();
  const { todayAverage, logs, loading: painLoading } = usePainLog();
  const { todayExercises, todayCompleted, completedToday, routineDuration } =
    useExercises();
  const insights = useInsights();

  const [refreshing, setRefreshing] = useState(false);

  const dataLoading = profileLoading || exerciseLoading || painLoading;

  const painLevel = todayAverage();
  const totalMinutes = Math.ceil(routineDuration / 60);
  const latestInsight = insights.length > 0 ? insights[0] : null;

  // Last pain log for ghost text
  const lastLog = logs.length > 0 ? logs[0] : null;
  const lastLogText = lastLog
    ? `Last: ${lastLog.painLevel}/10 at ${formatTime(lastLog.date)}`
    : undefined;

  // Completed session stats
  const latestSession =
    completedToday.length > 0 ? completedToday[completedToday.length - 1] : null;

  // Difficulty dots count
  const difficultyLevel = profile?.difficulty === 'challenging' ? 3 : profile?.difficulty === 'moderate' ? 2 : 1;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Force re-render by toggling state — hooks will re-evaluate
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  if (dataLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <LoadingIndicator />
      </SafeAreaView>
    );
  }

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
        {/* ── Greeting + Streak ── */}
        <FadeIn delay={0}>
          <Heading>{getGreeting()}</Heading>
        </FadeIn>

        <FadeIn delay={200}>
          {currentStreak > 0 ? (
            <Text style={[styles.streakBadge, { color: theme.accent }]}>
              Day {currentStreak} {'🔥'}
            </Text>
          ) : (
            <BodyText variant="muted">Start your first day!</BodyText>
          )}
        </FadeIn>

        {/* ── Today's Routine ── */}
        <FadeIn delay={100}>
          <PaywallGate feature="Guided Routines">
            <GlassCard>
              <Heading level={3}>{Strings.exerciseFlow.routineTitle}</Heading>

              {todayCompleted && latestSession ? (
                <View style={styles.completedBlock}>
                  <Text style={[styles.completedCheck, { color: theme.success }]}>
                    ✓
                  </Text>
                  <View style={styles.completedInfo}>
                    <Text style={[styles.completedLabel, { color: theme.text }]}>
                      {Strings.exerciseFlow.routineCompleted}
                    </Text>
                    <Caption muted>
                      {Math.ceil(latestSession.totalDuration / 60)} min ·{' '}
                      {latestSession.exercises.length} exercises
                    </Caption>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.routineMeta}>
                    <Caption muted>
                      {todayExercises.length} exercises · ~{totalMinutes} min
                    </Caption>
                    <View style={styles.difficultyDots}>
                      {[1, 2, 3].map((d) => (
                        <View
                          key={d}
                          style={[
                            styles.dot,
                            {
                              backgroundColor:
                                d <= difficultyLevel
                                  ? theme.primary
                                  : theme.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  {todayExercises.map((exercise) => (
                    <View key={exercise.id} style={styles.routineRow}>
                      <View
                        style={[styles.routineDot, { backgroundColor: theme.primary }]}
                      />
                      <Text style={[styles.routineName, { color: theme.text }]}>
                        {exercise.name}
                      </Text>
                      <Caption muted>
                        {Math.ceil(exercise.durationSeconds / 60)}m
                      </Caption>
                    </View>
                  ))}

                  <Button
                    title={Strings.exerciseFlow.startRoutine}
                    onPress={() => router.push('/exercise-flow/routine')}
                    variant="accent"
                    size="lg"
                  />
                </>
              )}
            </GlassCard>
          </PaywallGate>
        </FadeIn>

        {/* ── Quick Pain Log ── */}
        <FadeIn delay={200}>
          <PaywallGate feature="Pain Tracking">
            <Card
              variant="elevated"
              onPress={() => router.push('/pain-log')}
            >
              <View style={styles.painRow}>
                <PainOrb level={painLevel >= 0 ? painLevel : 0} size="small" />
                <View style={styles.painText}>
                  <Text style={[styles.painPrompt, { color: theme.text }]}>
                    How's your jaw right now?
                  </Text>
                  {lastLogText && <Caption muted>{lastLogText}</Caption>}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textMuted}
                />
              </View>
            </Card>
          </PaywallGate>
        </FadeIn>

        {/* ── Insight ── */}
        {latestInsight && (
          <FadeIn delay={300}>
            <GlassCard style={styles.insightCard}>
              <View style={[styles.insightAccent, { backgroundColor: theme.accent }]} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: theme.text }]}>
                  {latestInsight.title}
                </Text>
                <Caption muted>{latestInsight.message}</Caption>
              </View>
            </GlassCard>
          </FadeIn>
        )}

        {/* ── Tip of the Day ── */}
        <FadeIn delay={latestInsight ? 400 : 300}>
          <TipCard />
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },

  // Streak
  streakBadge: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -4,
  },

  // Routine
  routineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  routineDot: { width: 8, height: 8, borderRadius: 4 },
  routineName: { fontSize: 15, fontWeight: '500', flex: 1 },

  // Completed
  completedBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  completedCheck: { fontSize: 32, fontWeight: '700' },
  completedInfo: { gap: 2 },
  completedLabel: { fontSize: 16, fontWeight: '600' },

  // Pain
  painRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  painText: { flex: 1, gap: 2 },
  painPrompt: { fontSize: 16, fontWeight: '500' },

  // Insight
  insightCard: { flexDirection: 'row', overflow: 'hidden' },
  insightAccent: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  insightContent: { flex: 1, gap: 4 },
  insightTitle: { fontSize: 16, fontWeight: '600' },

  // Tip
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  tipBody: { overflow: 'hidden' },
});
