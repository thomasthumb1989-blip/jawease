import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import {
  Heading,
  BodyText,
  Button,
  PainOrb,
  GlassCard,
  TextField,
} from '@/src/components/ui';
import { usePainLog } from '@/src/hooks/usePainLog';
import type { Trigger } from '@/src/types';

const triggerKeys = Object.keys(Strings.triggers) as Trigger[];

function getPainDescriptor(level: number): string {
  if (level <= 1) return Strings.onboarding.painDescriptors.none;
  if (level <= 3) return Strings.onboarding.painDescriptors.mild;
  if (level <= 5) return Strings.onboarding.painDescriptors.moderate;
  if (level <= 7) return Strings.onboarding.painDescriptors.significant;
  return Strings.onboarding.painDescriptors.severe;
}

function TriggerPill({
  trigger,
  selected,
  onToggle,
}: {
  trigger: Trigger;
  selected: boolean;
  onToggle: (t: Trigger) => void;
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
    onToggle(trigger);
  }, [trigger, onToggle, scale]);

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
        {selected && <Text style={styles.checkmark}>✓</Text>}
        <Text
          style={[
            styles.chipText,
            { color: selected ? '#FFFFFF' : theme.text },
            selected && styles.chipTextSelected,
          ]}
        >
          {Strings.triggers[trigger]}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function PainLogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addLog } = usePainLog();
  const [painLevel, setPainLevel] = useState(5);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const descriptorOpacity = useSharedValue(1);

  const handlePainChange = useCallback(
    (level: number) => {
      descriptorOpacity.value = withTiming(0, { duration: 100 }, () => {
        runOnJS(setPainLevel)(level);
        descriptorOpacity.value = withTiming(1, { duration: 200 });
      });
    },
    [descriptorOpacity],
  );

  const descriptorAnim = useAnimatedStyle(() => ({
    opacity: descriptorOpacity.value,
  }));

  const toggleTrigger = useCallback((trigger: Trigger) => {
    setTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger],
    );
  }, []);

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.savedContainer}>
          <Text style={[styles.savedEmoji, { color: theme.success }]}>✓</Text>
          <Heading level={2}>{Strings.painLog.logged}</Heading>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Heading level={2}>{Strings.painLog.title}</Heading>

          <PainOrb
            level={painLevel}
            onLevelChange={handlePainChange}
            size="large"
            interactive
          />

          <Animated.View style={descriptorAnim}>
            <BodyText
              variant="secondary"
              style={{ textAlign: 'center', fontSize: 18 }}
            >
              {getPainDescriptor(painLevel)}
            </BodyText>
          </Animated.View>

          <BodyText variant="muted" style={{ textAlign: 'center' }}>
            {Strings.painLog.orbHint}
          </BodyText>

          {/* Triggers */}
          <GlassCard style={styles.triggersCard}>
            <BodyText variant="secondary">{Strings.painLog.triggersPrompt}</BodyText>
            <View style={styles.triggersGrid}>
              {triggerKeys.map((key) => (
                <TriggerPill
                  key={key}
                  trigger={key}
                  selected={triggers.includes(key)}
                  onToggle={toggleTrigger}
                />
              ))}
            </View>
          </GlassCard>

          <TextField
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            label="Notes (optional)"
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button title={Strings.common.save} onPress={handleSave} variant="accent" />
          <Button
            title={Strings.common.cancel}
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 24, gap: 20, alignItems: 'center' },
  triggersCard: { width: '100%', gap: 12 },
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
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
  footer: { padding: 24, gap: 8 },
  savedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  savedEmoji: {
    fontSize: 64,
    fontWeight: '700',
  },
});
