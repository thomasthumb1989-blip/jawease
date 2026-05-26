import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button, Caption } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';

type TimePreset = 'morning' | 'evening' | 'custom';

export default function ReminderScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { saveReminder } = useOnboarding();
  const [selectedPreset, setSelectedPreset] = useState<TimePreset>('morning');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const presets: { key: TimePreset; label: string; time: string }[] = [
    { key: 'morning', label: Strings.onboarding.reminderMorning, time: '08:00' },
    { key: 'evening', label: Strings.onboarding.reminderEvening, time: '19:00' },
    { key: 'custom', label: Strings.onboarding.reminderCustom, time: '12:00' },
  ];

  const handlePreset = (key: TimePreset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreset(key);
  };

  const handleNext = async () => {
    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      setPermissionDenied(true);
    }

    const preset = presets.find((p) => p.key === selectedPreset);
    await saveReminder(finalStatus === 'granted', preset?.time);
    router.push('/onboarding/email');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Heading level={2}>{Strings.onboarding.reminderTitle}</Heading>
          <BodyText variant="secondary">
            {Strings.onboarding.reminderSubtext}
          </BodyText>

          <View style={styles.presets}>
            {presets.map((preset) => {
              const active = selectedPreset === preset.key;
              return (
                <Pressable
                  key={preset.key}
                  onPress={() => handlePreset(preset.key)}
                  style={[
                    styles.presetCard,
                    {
                      borderColor: active ? theme.primary : theme.border,
                      backgroundColor: active
                        ? theme.primary + '12'
                        : theme.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetLabel,
                      {
                        color: active ? theme.primary : theme.text,
                        fontWeight: active ? '600' : '400',
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {permissionDenied && (
            <Caption muted style={{ textAlign: 'center' }}>
              {Strings.onboarding.reminderDenied}
            </Caption>
          )}
        </View>

        <Button title={Strings.common.continue} onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { gap: 24 },
  presets: { gap: 12 },
  presetCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  presetLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
});
