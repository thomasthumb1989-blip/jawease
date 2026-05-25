import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface ExerciseTimerProps {
  durationSeconds: number;
  onComplete: () => void;
  autoStart?: boolean;
}

export function ExerciseTimer({
  durationSeconds,
  onComplete,
  autoStart = false,
}: ExerciseTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    if (!running || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRunning(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, remaining, onComplete]);

  const toggleTimer = useCallback(() => {
    if (remaining <= 0) {
      setRemaining(durationSeconds);
      setRunning(true);
    } else {
      setRunning((prev) => !prev);
    }
  }, [remaining, durationSeconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = 1 - remaining / durationSeconds;

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleTimer} style={styles.timerCircle}>
        <View
          style={[
            styles.progressBg,
            {
              transform: [{ scaleX: progress }],
            },
          ]}
        />
        <Text style={styles.time}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.action}>
          {remaining <= 0 ? 'Restart' : running ? 'Pause' : 'Start'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.light.primary,
    overflow: 'hidden',
  },
  progressBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.primary + '15',
    transformOrigin: 'left',
  },
  time: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.light.text,
  },
  action: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
});
