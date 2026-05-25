import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Card, PainOrb } from '@/src/components/ui';
import { useUserContext } from '@/src/contexts/UserContext';
import { useStreak } from '@/src/hooks/useStreak';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useExercises } from '@/src/hooks/useExercises';

export default function TodayScreen() {
  const router = useRouter();
  const { profile, onboardingComplete } = useUserContext();
  const { currentStreak, isActiveToday } = useStreak();
  const { todayAverage } = usePainLog();
  const { todayExercises, completedToday } = useExercises();

  useEffect(() => {
    if (!onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [onboardingComplete]);

  const painLevel = todayAverage();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Heading>
          {Strings.app.name}
        </Heading>
        <BodyText variant="secondary">{Strings.app.tagline}</BodyText>

        {/* Pain Status */}
        <Pressable onPress={() => router.push('/pain-log')}>
          <Card variant="elevated" style={styles.painCard}>
            <PainOrb level={painLevel >= 0 ? painLevel : 0} />
            {painLevel < 0 && (
              <Text style={styles.logPrompt}>Tap to log today's pain</Text>
            )}
          </Card>
        </Pressable>

        {/* Streak */}
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <View>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakSub}>
                {isActiveToday() ? 'Active today!' : 'Do an exercise to continue'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Exercise List */}
        <Heading level={3}>Today's Exercises</Heading>
        {todayExercises.slice(0, 3).map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => router.push(`/exercise-flow/${exercise.id}`)}
          >
            <Card style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDesc}>{exercise.description}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  painCard: { alignItems: 'center', paddingVertical: 32 },
  logPrompt: {
    color: Colors.light.primary,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  streakCard: {},
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.light.accent,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  streakSub: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  exerciseItem: { gap: 4 },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  exerciseDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
