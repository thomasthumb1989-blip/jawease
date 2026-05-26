import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Card, PainOrb, Button, Caption } from '@/src/components/ui';
import { useUserContext } from '@/src/contexts/UserContext';
import { useStreak } from '@/src/hooks/useStreak';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useExercises } from '@/src/hooks/useExercises';

export default function TodayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile } = useUserContext();
  const { currentStreak, isActiveToday } = useStreak();
  const { todayAverage } = usePainLog();
  const { todayExercises, todayCompleted, routineDuration } = useExercises();

  const painLevel = todayAverage();
  const totalMinutes = Math.ceil(routineDuration / 60);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Heading>{Strings.app.name}</Heading>
        <BodyText variant="secondary">{Strings.app.tagline}</BodyText>

        {/* Pain Status */}
        <Pressable onPress={() => router.push('/pain-log')}>
          <Card variant="elevated" style={styles.painCard}>
            <PainOrb level={painLevel >= 0 ? painLevel : 0} />
            {painLevel < 0 && (
              <Text style={[styles.logPrompt, { color: theme.primary }]}>
                Tap to log today's pain
              </Text>
            )}
          </Card>
        </Pressable>

        {/* Streak */}
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={[styles.streakNumber, { color: theme.accent }]}>
              {currentStreak}
            </Text>
            <View>
              <Text style={[styles.streakLabel, { color: theme.text }]}>
                Day Streak
              </Text>
              <Text style={[styles.streakSub, { color: theme.textMuted }]}>
                {isActiveToday()
                  ? 'Active today!'
                  : 'Do an exercise to continue'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Today's Routine */}
        <Heading level={3}>{Strings.exerciseFlow.routineTitle}</Heading>

        {todayCompleted ? (
          <Card style={styles.completedCard}>
            <Text style={[styles.completedCheck, { color: theme.success }]}>
              ✓
            </Text>
            <BodyText>{Strings.exerciseFlow.routineCompleted}</BodyText>
          </Card>
        ) : (
          <>
            <Card style={styles.routineCard}>
              {todayExercises.map((exercise, i) => (
                <View key={exercise.id} style={styles.routineRow}>
                  <View
                    style={[
                      styles.routineDot,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                  <Text style={[styles.routineName, { color: theme.text }]}>
                    {exercise.name}
                  </Text>
                  <Caption muted>
                    {Math.ceil(exercise.durationSeconds / 60)}m
                  </Caption>
                </View>
              ))}
              <View style={styles.routineMeta}>
                <Caption muted>
                  {todayExercises.length} exercises · ~{totalMinutes} min
                </Caption>
              </View>
            </Card>

            <Button
              title={Strings.exerciseFlow.startRoutine}
              onPress={() => router.push('/exercise-flow/routine')}
              variant="accent"
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  painCard: { alignItems: 'center', paddingVertical: 32 },
  logPrompt: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  streakCard: {},
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakNumber: {
    fontSize: 40,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  streakSub: {
    fontSize: 13,
  },
  routineCard: { gap: 10 },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  routineMeta: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedCheck: {
    fontSize: 24,
    fontWeight: '700',
  },
});
