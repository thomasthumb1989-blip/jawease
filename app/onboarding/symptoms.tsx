import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import type { Symptom } from '@/src/types';

const symptomKeys = Object.keys(Strings.symptoms) as Symptom[];

export default function SymptomsScreen() {
  const router = useRouter();
  const { saveSymptoms } = useOnboarding();
  const [selected, setSelected] = useState<Symptom[]>([]);

  const toggle = (symptom: Symptom) => {
    setSelected((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleNext = async () => {
    await saveSymptoms(selected);
    router.push('/onboarding/baseline');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Heading level={2}>{Strings.onboarding.symptomsTitle}</Heading>
        <BodyText variant="secondary">Select all that apply</BodyText>

        <View style={styles.grid}>
          {symptomKeys.map((key) => (
            <Pressable
              key={key}
              onPress={() => toggle(key)}
              style={[
                styles.chip,
                selected.includes(key) && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected.includes(key) && styles.chipTextSelected,
                ]}
              >
                {Strings.symptoms[key]}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleNext}
          disabled={selected.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 24, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  chipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
  },
  chipText: { fontSize: 15, color: Colors.light.text },
  chipTextSelected: { color: Colors.light.primary, fontWeight: '600' },
  footer: { padding: 24 },
});
