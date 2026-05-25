import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import {
  Heading,
  BodyText,
  Button,
  PainOrb,
  TextField,
} from '@/src/components/ui';
import { usePainLog } from '@/src/hooks/usePainLog';
import type { Trigger } from '@/src/types';

const triggerKeys = Object.keys(Strings.triggers) as Trigger[];

export default function PainLogScreen() {
  const router = useRouter();
  const { addLog } = usePainLog();
  const [painLevel, setPainLevel] = useState(5);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const toggleTrigger = (trigger: Trigger) => {
    setTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleSave = async () => {
    await addLog({
      date: new Date().toISOString(),
      painLevel,
      triggers,
      notes: notes || undefined,
    });
    setSaved(true);
    setTimeout(() => router.back(), 1200);
  };

  if (saved) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.savedContainer}>
          <Text style={styles.savedEmoji}>✓</Text>
          <Heading level={2}>Pain Logged</Heading>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Heading level={2}>Log Your Pain</Heading>

        <PainOrb level={painLevel} size={120} />

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

        <BodyText variant="secondary">Any triggers today?</BodyText>
        <View style={styles.triggersGrid}>
          {triggerKeys.map((key) => (
            <Pressable
              key={key}
              onPress={() => toggleTrigger(key)}
              style={[
                styles.chip,
                triggers.includes(key) && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  triggers.includes(key) && styles.chipTextActive,
                ]}
              >
                {Strings.triggers[key]}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextField
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          label="Notes (optional)"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Save" onPress={handleSave} />
        <Button title="Cancel" onPress={() => router.back()} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 24, gap: 20, alignItems: 'center' },
  painButtons: { flexDirection: 'row', gap: 4 },
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
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  chipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
  },
  chipText: { fontSize: 14, color: Colors.light.text },
  chipTextActive: { color: Colors.light.primary, fontWeight: '600' },
  footer: { padding: 24, gap: 8 },
  savedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  savedEmoji: {
    fontSize: 64,
    color: Colors.light.success,
  },
});
