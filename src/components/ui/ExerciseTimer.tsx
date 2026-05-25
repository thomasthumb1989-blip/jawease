import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

interface ExerciseTimerProps {
  durationSeconds: number;
  onComplete: () => void;
  exerciseName?: string;
  autoStart?: boolean;
}

const RING_RADIUS = 120;
const STROKE_WIDTH = 8;
const GLOW_STROKE = 12;
const SVG_SIZE = (RING_RADIUS + STROKE_WIDTH + 4) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ExerciseTimer({
  durationSeconds,
  onComplete,
  exerciseName,
  autoStart = false,
}: ExerciseTimerProps) {
  const theme = useTheme();
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(autoStart);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!running || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRunning(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, remaining, onComplete]);

  // Animate progress ring smoothly
  useEffect(() => {
    const p = 1 - remaining / durationSeconds;
    progress.value = withTiming(p, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [remaining, durationSeconds, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const toggleTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (remaining <= 0) {
      setRemaining(durationSeconds);
      progress.value = 0;
      setRunning(true);
    } else {
      setRunning((prev) => !prev);
    }
  }, [remaining, durationSeconds, progress]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const cx = SVG_SIZE / 2;
  const cy = SVG_SIZE / 2;

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleTimer}>
        <View style={styles.ringWrapper}>
          <Svg width={SVG_SIZE} height={SVG_SIZE}>
            {/* Background track */}
            <SvgCircle
              cx={cx}
              cy={cy}
              r={RING_RADIUS}
              stroke={theme.primary + '1A'}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />

            {/* Glow ring behind */}
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={RING_RADIUS}
              stroke={theme.primary + '33'}
              strokeWidth={GLOW_STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={glowAnimatedProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />

            {/* Main progress ring */}
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={RING_RADIUS}
              stroke={theme.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </Svg>

          {/* Center content */}
          <View style={styles.centerContent}>
            <Text style={[styles.time, { color: theme.text }]}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
            <Text style={[styles.action, { color: theme.textMuted }]}>
              {remaining <= 0 ? 'Restart' : running ? 'Tap to pause' : 'Tap to start'}
            </Text>
          </View>
        </View>
      </Pressable>

      {exerciseName && (
        <Text style={[styles.exerciseName, { color: theme.textSecondary }]}>
          {exerciseName}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  ringWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  time: {
    fontSize: 48,
    fontWeight: '700',
  },
  action: {
    fontSize: 14,
    marginTop: 4,
  },
  exerciseName: {
    fontSize: 16,
  },
});

export default ExerciseTimer;
