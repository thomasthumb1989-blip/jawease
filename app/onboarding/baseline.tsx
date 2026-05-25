import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button, PainOrb } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import type { Difficulty } from '@/src/types';
export default function BaselineScreen() {
  const router = useRouter();
  const { saveBaseline } = useOnboarding();
  const [painLevel, setPainLevel] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const handleNext = async () => {
    await saveBaseline(painLevel, difficulty);
    router.push('/onboarding/reminder');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Heading level={2}>{Strings.onboarding.baselineTitle}</Heading>

          <PainOrb level={painLevel} size="large" />

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Pain Level: {painLevel}</Text>
            {/* Slider placeholder — using Text-based selector */}
            <View style={styles.painButtons}>
              {Array.from({ length: 11 }, (_, i) => (
                <Text
                  key={i}
                  onPress={() => setPainLevel(i)}
                  style={[
                    styles.painButton,
                    painLevel === i && styles.painButtonActive,
                  ]}
                >
                  {i}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.difficultySection}>
            <BodyText>Exercise intensity preference:</BodyText>
            <View style={styles.difficultyRow}>
              {(['easy', 'moderate', 'challenging'] as Difficulty[]).map(
                (d) => (
                  <Text
                    key={d}
                    onPress={() => setDifficulty(d)}
                    style={[
                      styles.diffChip,
                      difficulty === d && styles.diffChipActive,
                    ]}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                )
              )}
            </View>
          </View>
        </View>

        <Button title="Continue" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { gap: 24, alignItems: 'center' },
  sliderContainer: { width: '100%', gap: 8 },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  painButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  painButton: {
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 13,
    color: Colors.light.textMuted,
    borderRadius: 14,
    overflow: 'hidden',
  },
  painButtonActive: {
    backgroundColor: Colors.light.primary,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  difficultySection: { width: '100%', gap: 12 },
  difficultyRow: { flexDirection: 'row', gap: 8 },
  diffChip: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    fontSize: 14,
    color: Colors.light.text,
    overflow: 'hidden',
  },
  diffChipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
