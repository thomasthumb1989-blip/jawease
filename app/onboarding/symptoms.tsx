import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import type { Symptom } from '@/src/types';

const symptomKeys = Object.keys(Strings.symptoms) as Symptom[];

function SymptomPill({
  symptom,
  selected,
  onToggle,
}: {
  symptom: Symptom;
  selected: boolean;
  onToggle: (s: Symptom) => void;
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
    onToggle(symptom);
  }, [symptom, onToggle, scale]);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.chip,
          {
            borderColor: selected ? theme.primary : theme.border,
            backgroundColor: selected ? theme.primary : theme.card,
          },
        ]}
      >
        {selected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
        <Text
          style={[
            styles.chipText,
            { color: selected ? '#FFFFFF' : theme.text },
            selected && styles.chipTextSelected,
          ]}
        >
          {Strings.symptoms[symptom]}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function SymptomsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { saveSymptoms } = useOnboarding();
  const [selected, setSelected] = useState<Symptom[]>([]);

  const toggle = useCallback((symptom: Symptom) => {
    setSelected((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  }, []);

  const handleNext = async () => {
    await saveSymptoms(selected);
    router.push('/onboarding/baseline');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Heading level={2}>{Strings.onboarding.symptomsTitle}</Heading>
        <BodyText variant="secondary">{Strings.onboarding.symptomsSubtext}</BodyText>

        <View style={styles.grid}>
          {symptomKeys.map((key) => (
            <SymptomPill
              key={key}
              symptom={key}
              selected={selected.includes(key)}
              onToggle={toggle}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={Strings.common.continue}
          onPress={handleNext}
          disabled={selected.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipText: { fontSize: 15 },
  chipTextSelected: { fontWeight: '600' },
  footer: { padding: 24 },
});
