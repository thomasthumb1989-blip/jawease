import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn as RFadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import {
  Heading,
  BodyText,
  Card,
  Caption,
  Button,
  TextField,
  EmptyState,
  PaywallGate,
} from '@/src/components/ui';
import { useExercises } from '@/src/hooks/useExercises';
import type { Exercise, ExerciseCategory } from '@/src/types';

// ─── Category map ─────────────────────────────────────────
const CATEGORIES: { key: ExerciseCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'stretch', label: 'Mobility' },
  { key: 'strengthen', label: 'Strengthening' },
  { key: 'relaxation', label: 'Relaxation' },
  { key: 'massage', label: 'Massage' },
  { key: 'posture', label: 'Posture' },
];

// ─── Filter pill ──────────────────────────────────────────
function FilterPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 300 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 80);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress, scale]);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.pill,
          {
            backgroundColor: selected ? theme.primary : theme.card,
            borderColor: selected ? theme.primary : theme.border,
          },
        ]}
      >
        <Text
          style={[
            styles.pillText,
            { color: selected ? '#FFFFFF' : theme.text },
            selected && styles.pillTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Exercise card ────────────────────────────────────────
function ExerciseCard({
  exercise,
  onPress,
}: {
  exercise: Exercise;
  onPress: () => void;
}) {
  const theme = useTheme();

  const durationText =
    exercise.holdSeconds > 0
      ? `${exercise.reps} reps × ${exercise.holdSeconds}s hold`
      : `${Math.ceil(exercise.durationSeconds / 60)} min`;

  const categoryLabel =
    CATEGORIES.find((c) => c.key === exercise.category)?.label ??
    exercise.category;

  return (
    <Card variant="elevated" onPress={onPress} style={styles.exerciseCard}>
      <View style={styles.exerciseTop}>
        <Text style={[styles.exerciseName, { color: theme.text }]}>
          {exercise.name}
        </Text>
        <View
          style={[styles.categoryBadge, { backgroundColor: theme.primary + '15' }]}
        >
          <Text style={[styles.categoryText, { color: theme.primary }]}>
            {categoryLabel}
          </Text>
        </View>
      </View>

      <Caption muted>{durationText}</Caption>

      <View style={styles.difficultyRow}>
        {[1, 2, 3].map((d) => (
          <View
            key={d}
            style={[
              styles.dot,
              {
                backgroundColor:
                  d <= exercise.difficulty ? theme.primary : theme.border,
              },
            ]}
          />
        ))}
      </View>
    </Card>
  );
}

// ─── Exercise detail (inline expanded) ────────────────────
function ExerciseDetail({
  exercise,
  onClose,
  onStart,
}: {
  exercise: Exercise;
  onClose: () => void;
  onStart: () => void;
}) {
  const theme = useTheme();

  const durationText =
    exercise.holdSeconds > 0
      ? `${exercise.reps} reps × ${exercise.holdSeconds}s hold`
      : `${Math.ceil(exercise.durationSeconds / 60)} min`;

  const categoryLabel =
    CATEGORIES.find((c) => c.key === exercise.category)?.label ??
    exercise.category;

  return (
    <Animated.View entering={RFadeIn.duration(200)}>
      <Card variant="elevated" style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Heading level={2} style={{ flex: 1 }}>
            {exercise.name}
          </Heading>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={theme.textMuted} />
          </Pressable>
        </View>

        <View style={styles.detailMeta}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: theme.primary + '15' },
            ]}
          >
            <Text style={[styles.categoryText, { color: theme.primary }]}>
              {categoryLabel}
            </Text>
          </View>
          <Caption muted>{durationText}</Caption>
          <View style={styles.difficultyRow}>
            {[1, 2, 3].map((d) => (
              <View
                key={d}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      d <= exercise.difficulty ? theme.primary : theme.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <BodyText variant="secondary">{exercise.description}</BodyText>

        <View style={styles.instructionsList}>
          {exercise.instructions.map((step, i) => (
            <View key={i} style={styles.instructionRow}>
              <Text style={[styles.stepNumber, { color: theme.primary }]}>
                {i + 1}
              </Text>
              <Text style={[styles.stepText, { color: theme.text }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <PaywallGate feature="Guided Exercises">
          <Button
            title={Strings.exerciseFlow.startExercise}
            onPress={onStart}
            variant="primary"
            size="lg"
          />
        </PaywallGate>
      </Card>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────
export default function ExercisesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { allExercises } = useExercises();

  const [activeCategory, setActiveCategory] = useState<
    ExerciseCategory | 'all'
  >('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = allExercises;
    if (activeCategory !== 'all') {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, activeCategory, search]);

  const selectedExercise = useMemo(
    () => (selectedId ? allExercises.find((e) => e.id === selectedId) : null),
    [selectedId, allExercises],
  );

  const handleCardPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleStart = useCallback(
    (id: string) => {
      router.push(`/exercise-flow/${id}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => {
      if (selectedExercise?.id === item.id) {
        return (
          <ExerciseDetail
            exercise={item}
            onClose={() => setSelectedId(null)}
            onStart={() => handleStart(item.id)}
          />
        );
      }
      return (
        <ExerciseCard
          exercise={item}
          onPress={() => handleCardPress(item.id)}
        />
      );
    },
    [selectedExercise, handleCardPress, handleStart],
  );

  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Heading>{Strings.exercises.heading}</Heading>

        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textMuted}
            style={styles.searchIcon}
          />
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {CATEGORIES.map((cat) => (
            <FilterPill
              key={cat.key}
              label={cat.label}
              selected={activeCategory === cat.key}
              onPress={() => setActiveCategory(cat.key)}
            />
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title={Strings.exercises.noResults}
          message={Strings.exercises.noResultsHint}
        />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  searchRow: { position: 'relative' },
  searchIcon: {
    position: 'absolute',
    left: 4,
    top: 16,
    zIndex: 1,
  },
  pillRow: { gap: 8, paddingBottom: 4 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillText: { fontSize: 14 },
  pillTextActive: { fontWeight: '600' },

  listContent: { padding: 20, gap: 12 },

  // Card
  exerciseCard: { gap: 6 },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseName: { fontSize: 17, fontWeight: '600', flex: 1 },
  categoryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  categoryText: { fontSize: 12, fontWeight: '600' },
  difficultyRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  // Detail
  detailCard: { gap: 14 },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionsList: { gap: 10 },
  instructionRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNumber: { fontSize: 15, fontWeight: '700', width: 20 },
  stepText: { fontSize: 15, lineHeight: 22, flex: 1 },
});
