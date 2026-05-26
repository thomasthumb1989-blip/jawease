import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { Heading, Card, Caption } from '@/src/components/ui';
import { useExercises } from '@/src/hooks/useExercises';

export default function ExercisesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { allExercises } = useExercises();

  const categories = [...new Set(allExercises.map((e) => e.category))];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Heading>Exercises</Heading>

        {categories.map((category) => (
          <View key={category} style={styles.section}>
            <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            {allExercises
              .filter((e) => e.category === category)
              .map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() =>
                    router.push(`/exercise-flow/${exercise.id}`)
                  }
                >
                  <Card style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={[styles.exerciseName, { color: theme.text }]}>
                        {exercise.name}
                      </Text>
                      <Caption>
                        {Math.ceil(exercise.durationSeconds / 60)} min
                      </Caption>
                    </View>
                    <Text style={[styles.exerciseDesc, { color: theme.textSecondary }]}>
                      {exercise.description}
                    </Text>
                    <View style={styles.meta}>
                      <Caption>
                        {exercise.reps} reps
                        {exercise.holdSeconds > 0 &&
                          ` · ${exercise.holdSeconds}s hold`}
                      </Caption>
                      <View style={styles.difficultyDots}>
                        {[1, 2, 3].map((d) => (
                          <View
                            key={d}
                            style={[
                              styles.dot,
                              { backgroundColor: theme.border },
                              d <= exercise.difficulty && {
                                backgroundColor: theme.primary,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  section: { gap: 8 },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginTop: 8,
  },
  exerciseCard: { gap: 6 },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  exerciseDesc: { fontSize: 14 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  difficultyDots: { flexDirection: 'row', gap: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
