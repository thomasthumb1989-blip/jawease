import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { exercises as allExerciseData } from '@/src/constants/exercises';
import {
  Heading,
  BodyText,
  Button,
  Card,
  ExerciseTimer,
  GlassCard,
  PainOrb,
  Caption,
} from '@/src/components/ui';
import { useExercises, REST_DURATION } from '@/src/hooks/useExercises';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useStreak } from '@/src/hooks/useStreak';
import { useUserContext } from '@/src/contexts/UserContext';
import { useSubscriptionContext } from '@/src/contexts/SubscriptionContext';
import { trackEvent } from '@/src/utils/analytics';
import type { Exercise, CompletedExercise } from '@/src/types';

type FlowPhase = 'pre' | 'countdown' | 'exercise' | 'rest' | 'complete';

// ─── Countdown Overlay ──────────────────────────────────────────────
function CountdownOverlay({ onComplete }: { onComplete: () => void }) {
  const theme = useTheme();
  const [number, setNumber] = useState(3);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (number > 0) {
      scale.value = 0.5;
      opacity.value = 0;
      scale.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.back(2)),
      });
      opacity.value = withTiming(1, { duration: 200 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const fadeTimer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
      }, 700);

      const nextTimer = setTimeout(() => {
        setNumber((n) => n - 1);
      }, 1000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(nextTimer);
      };
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  }, [number, scale, opacity, onComplete]);

  if (number <= 0) return null;

  return (
    <View style={styles.countdownContainer}>
      <Animated.Text
        style={[styles.countdownNumber, { color: theme.primary }, animStyle]}
      >
        {number}
      </Animated.Text>
    </View>
  );
}

// ─── Instruction Text ───────────────────────────────────────────────
function getInstruction(
  exercise: Exercise,
  remaining: number
): string {
  const elapsed = exercise.durationSeconds - remaining;
  const repDuration = exercise.durationSeconds / Math.max(exercise.reps, 1);
  const currentRep = Math.min(
    Math.floor(elapsed / repDuration) + 1,
    exercise.reps
  );

  if (exercise.holdSeconds > 0) {
    const withinRep = elapsed % repDuration;
    const isHolding = withinRep < exercise.holdSeconds;
    const action = isHolding
      ? Strings.exerciseFlow.hold
      : Strings.exerciseFlow.release;
    return `${action} (${Strings.exerciseFlow.rep} ${currentRep} of ${exercise.reps})`;
  }

  if (exercise.reps > 1) {
    return `${Strings.exerciseFlow.rep} ${currentRep} of ${exercise.reps}`;
  }

  return Strings.exerciseFlow.continue;
}

// ─── Rest Phase ─────────────────────────────────────────────────────
function RestPhase({
  nextExercise,
  onComplete,
  onSkip,
}: {
  nextExercise: Exercise;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const theme = useTheme();
  const [remaining, setRemaining] = useState(REST_DURATION);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  return (
    <View style={styles.restContainer}>
      <Text style={[styles.restLabel, { color: theme.textMuted }]}>
        {Strings.exerciseFlow.rest}
      </Text>
      <Text style={[styles.restTimer, { color: theme.textSecondary }]}>
        {remaining}
      </Text>
      <View style={styles.restNext}>
        <Caption muted>{Strings.exerciseFlow.nextUp}</Caption>
        <BodyText style={{ textAlign: 'center' }}>{nextExercise.name}</BodyText>
      </View>
      <Button
        title={Strings.exerciseFlow.skipRest}
        onPress={onSkip}
        variant="ghost"
      />
    </View>
  );
}

// ─── Completion Stat Card ───────────────────────────────────────────
function StatCard({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const cfg = { duration: 500, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(delay, withTiming(1, cfg));
    translateY.value = withDelay(delay, withTiming(0, cfg));
  }, [delay, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, animStyle]}>
      <GlassCard style={styles.statGlass}>
        <Text style={[styles.statValue, { color: theme.accent }]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>
          {label}
        </Text>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Flow Screen ───────────────────────────────────────────────
export default function ExerciseFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { profile } = useUserContext();
  const { isPremium } = useSubscriptionContext();
  const { todayExercises, saveSession, routineDuration } = useExercises();
  const { todayAverage } = usePainLog();
  const { currentStreak } = useStreak();

  const [phase, setPhase] = useState<FlowPhase>('pre');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [painAfter, setPainAfter] = useState(5);
  const [instruction, setInstruction] = useState('');
  const [completedExercises, setCompletedExercises] = useState<
    CompletedExercise[]
  >([]);
  const startTimeRef = useRef(Date.now());
  const prevInstructionRef = useRef('');

  // Build routine: "routine" → today's set, otherwise single exercise
  const routine = useMemo(() => {
    if (id === 'routine') return todayExercises;
    const single = allExerciseData.find((e) => e.id === id);
    return single ? [single] : [];
  }, [id, todayExercises]);

  const currentExercise = routine[exerciseIndex];
  const painBefore = todayAverage() >= 0 ? todayAverage() : 5;
  const totalMinutes = Math.ceil(routineDuration / 60);

  // Not found
  if (routine.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <BodyText>{Strings.exerciseFlow.notFound}</BodyText>
          <Button title={Strings.common.goBack} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────
  const handleBegin = () => {
    if (!isPremium) {
      router.push('/paywall?mode=upgrade');
      return;
    }
    trackEvent('exercise_started', { count: routine.length });
    startTimeRef.current = Date.now();
    setPhase('countdown');
  };

  const handleCountdownDone = useCallback(() => {
    setPhase('exercise');
  }, []);

  const handleExerciseComplete = useCallback(() => {
    if (!currentExercise) return;
    setCompletedExercises((prev) => [
      ...prev,
      {
        exerciseId: currentExercise.id,
        durationSeconds: currentExercise.durationSeconds,
        repsCompleted: currentExercise.reps,
      },
    ]);

    if (exerciseIndex < routine.length - 1) {
      setPhase('rest');
    } else {
      setPhase('complete');
    }
  }, [currentExercise, exerciseIndex, routine.length]);

  const handleSkipExercise = useCallback(() => {
    handleExerciseComplete();
  }, [handleExerciseComplete]);

  const handleRestDone = useCallback(() => {
    setExerciseIndex((i) => i + 1);
    setPaused(false);
    setPhase('exercise');
  }, []);

  const handleTick = useCallback(
    (remaining: number) => {
      if (!currentExercise) return;
      const text = getInstruction(currentExercise, remaining);
      if (text !== prevInstructionRef.current) {
        prevInstructionRef.current = text;
        setInstruction(text);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [currentExercise]
  );

  const handleDone = async () => {
    const totalDuration = Math.round(
      (Date.now() - startTimeRef.current) / 1000
    );
    await saveSession(completedExercises, totalDuration, painBefore, painAfter);
    router.back();
  };

  // ── PRE-EXERCISE PHASE ────────────────────────────────────────────
  if (phase === 'pre') {
    return (
      <LinearGradient
        colors={[theme.primary + '30', theme.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={styles.flex}
      >
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.preContent}>
            <Heading level={2}>{Strings.exerciseFlow.routineTitle}</Heading>
            <BodyText variant="secondary">
              {routine.length} exercises, ~{totalMinutes} min
            </BodyText>

            <View style={styles.exerciseList}>
              {routine.map((ex, i) => (
                <Card key={ex.id} style={styles.preExerciseCard}>
                  <View style={styles.preExerciseRow}>
                    <View
                      style={[
                        styles.preExerciseNumber,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text style={styles.preExerciseNumberText}>{i + 1}</Text>
                    </View>
                    <View style={styles.preExerciseInfo}>
                      <Text
                        style={[styles.preExerciseName, { color: theme.text }]}
                      >
                        {ex.name}
                      </Text>
                      <Caption muted>
                        {Math.ceil(ex.durationSeconds / 60)} min
                        {ex.reps > 1 ? ` · ${ex.reps} reps` : ''}
                      </Caption>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Caption muted style={styles.disclaimerNotice}>
              {Strings.disclaimer.exerciseNotice}
            </Caption>
            <Button
              title={Strings.exerciseFlow.begin}
              onPress={handleBegin}
              variant="accent"
              size="lg"
            />
            <Button
              title={Strings.common.goBack}
              onPress={() => router.back()}
              variant="ghost"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── COUNTDOWN PHASE ───────────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <CountdownOverlay onComplete={handleCountdownDone} />
      </SafeAreaView>
    );
  }

  // ── REST PHASE ────────────────────────────────────────────────────
  if (phase === 'rest') {
    const nextExercise = routine[exerciseIndex + 1];
    if (!nextExercise) {
      // Edge case: shouldn't happen, go to complete
      setPhase('complete');
      return null;
    }
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <RestPhase
          nextExercise={nextExercise}
          onComplete={handleRestDone}
          onSkip={handleRestDone}
        />
      </SafeAreaView>
    );
  }

  // ── COMPLETION PHASE ──────────────────────────────────────────────
  if (phase === 'complete') {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const durationMin = Math.floor(elapsed / 60);
    const durationSec = elapsed % 60;
    const durationStr = `${durationMin}:${durationSec
      .toString()
      .padStart(2, '0')}`;
    const painDelta = painBefore - painAfter;

    return (
      <LinearGradient
        colors={[theme.primary + '20', theme.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={styles.flex}
      >
        <SafeAreaView style={styles.safe}>
          <ScrollView
            contentContainerStyle={styles.completeContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.completeCheck, { color: theme.success }]}>
              ✓
            </Text>
            <Heading animated>
              {Strings.exerciseFlow.sessionComplete}
            </Heading>
            <BodyText variant="secondary">
              {Strings.exerciseFlow.greatWork}
            </BodyText>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard
                value={durationStr}
                label={Strings.exerciseFlow.duration}
                delay={200}
              />
              <StatCard
                value={`${completedExercises.length}/${routine.length}`}
                label={Strings.exerciseFlow.exercisesDone}
                delay={400}
              />
              <StatCard
                value={
                  currentStreak > 1
                    ? `${currentStreak} 🔥`
                    : `${currentStreak}`
                }
                label={Strings.exerciseFlow.streakLabel}
                delay={600}
              />
            </View>

            {/* Post-session pain log */}
            <View style={styles.painSection}>
              <BodyText variant="secondary" style={{ textAlign: 'center' }}>
                {Strings.exerciseFlow.howsYourJaw}
              </BodyText>
              <PainOrb
                level={painAfter}
                onLevelChange={setPainAfter}
                size="large"
                interactive
              />
              {painDelta > 0 && (
                <Text style={[styles.painDelta, { color: theme.success }]}>
                  Pain: {painBefore} → {painAfter} —{' '}
                  {Strings.exerciseFlow.painImproved}
                </Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={Strings.exerciseFlow.done}
              onPress={handleDone}
              size="lg"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── EXERCISE PHASE ────────────────────────────────────────────────
  if (!currentExercise) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.exerciseContainer}>
        {/* Top: exercise info */}
        <View style={styles.exerciseTop}>
          <Caption muted>
            {exerciseIndex + 1} of {routine.length}
          </Caption>
          <Heading level={2}>{currentExercise.name}</Heading>
          <BodyText variant="secondary" style={{ textAlign: 'center' }}>
            {currentExercise.description}
          </BodyText>
        </View>

        {/* Center: timer */}
        <ExerciseTimer
          key={exerciseIndex}
          durationSeconds={currentExercise.durationSeconds}
          onComplete={handleExerciseComplete}
          autoStart
          isPaused={paused}
          onPauseChange={setPaused}
          onTick={handleTick}
        />

        {/* Instruction prompt */}
        <Text style={[styles.instruction, { color: theme.primary }]}>
          {instruction}
        </Text>

        {/* Controls */}
        <View style={styles.exerciseControls}>
          <Button
            title={
              paused
                ? Strings.exerciseFlow.resume
                : Strings.exerciseFlow.pause
            }
            onPress={() => setPaused((p) => !p)}
            variant="ghost"
          />
          <Button
            title={Strings.exerciseFlow.skip}
            onPress={handleSkipExercise}
            variant="ghost"
            size="sm"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },

  // Pre phase
  preContent: { padding: 24, gap: 16 },
  exerciseList: { gap: 8 },
  preExerciseCard: { paddingVertical: 14, paddingHorizontal: 16 },
  preExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preExerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preExerciseNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  preExerciseInfo: { flex: 1, gap: 2 },
  preExerciseName: { fontSize: 16, fontWeight: '600' },

  // Countdown
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '700',
  },

  // Exercise
  exerciseContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  exerciseTop: { alignItems: 'center', gap: 8 },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 24,
  },
  exerciseControls: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },

  // Rest
  restContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  restLabel: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  restTimer: {
    fontSize: 64,
    fontWeight: '700',
  },
  restNext: { alignItems: 'center', gap: 4, marginTop: 16 },

  // Complete
  completeContent: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
  },
  completeCheck: { fontSize: 64 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  statCard: { flex: 1 },
  statGlass: { alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  painSection: { alignItems: 'center', gap: 16, marginTop: 8 },
  painDelta: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Shared
  footer: { padding: 24, gap: 8 },
  disclaimerNotice: { textAlign: 'center', marginBottom: 4 },
});
