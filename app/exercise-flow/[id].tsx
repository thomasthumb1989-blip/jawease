import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import {
  Heading,
  BodyText,
  Button,
  Card,
  ExerciseTimer,
} from '@/src/components/ui';
import { exercises } from '@/src/constants/exercises';
import { useExercises } from '@/src/hooks/useExercises';

type Phase = 'intro' | 'exercise' | 'complete';

export default function ExerciseFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { completeExercise } = useExercises();
  const [phase, setPhase] = useState<Phase>('intro');

  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <BodyText>Exercise not found</BodyText>
        <Button title="Go Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const handleComplete = async () => {
    await completeExercise(exercise, 0, 0);
    setPhase('complete');
  };

  if (phase === 'complete') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Heading level={2}>Exercise Complete!</Heading>
          <BodyText variant="secondary">
            Great job completing {exercise.name}.
          </BodyText>
          <Button title="Done" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'exercise') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.exerciseContainer}>
          <Heading level={2}>{exercise.name}</Heading>
          <ExerciseTimer
            durationSeconds={exercise.durationSeconds}
            onComplete={handleComplete}
          />
          <BodyText variant="secondary" style={styles.repInfo}>
            {exercise.reps} reps
            {exercise.holdSeconds > 0 && ` · ${exercise.holdSeconds}s hold each`}
          </BodyText>
          <Button
            title="Skip & Complete"
            onPress={handleComplete}
            variant="ghost"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Intro phase
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Heading level={2}>{exercise.name}</Heading>
        <BodyText variant="secondary">{exercise.description}</BodyText>

        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          {exercise.instructions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
              <BodyText style={styles.stepText}>{step}</BodyText>
            </View>
          ))}
        </Card>

        <Card>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>
                {Math.ceil(exercise.durationSeconds / 60)} min
              </Text>
              <Text style={styles.metaLabel}>Duration</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{exercise.reps}</Text>
              <Text style={styles.metaLabel}>Reps</Text>
            </View>
            {exercise.holdSeconds > 0 && (
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{exercise.holdSeconds}s</Text>
                <Text style={styles.metaLabel}>Hold</Text>
              </View>
            )}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Start Exercise"
          onPress={() => setPhase('exercise')}
          size="lg"
        />
        <Button title="Go Back" onPress={() => router.back()} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 24, gap: 20 },
  instructionsCard: { gap: 12 },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
  stepText: { flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center' },
  metaValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.accent,
  },
  metaLabel: { fontSize: 12, color: Colors.light.textMuted, marginTop: 2 },
  footer: { padding: 24, gap: 8 },
  exerciseContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  repInfo: { textAlign: 'center' },
  completeContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  completeEmoji: { fontSize: 64 },
});
