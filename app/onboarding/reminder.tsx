import React, { useState } from 'react';
import { View, StyleSheet, Switch, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button, Card } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';

export default function ReminderScreen() {
  const router = useRouter();
  const { saveReminder } = useOnboarding();
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('09:00');

  const handleNext = async () => {
    await saveReminder(enabled, enabled ? time : undefined);
    router.push('/onboarding/email');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Heading level={2}>{Strings.onboarding.reminderTitle}</Heading>
          <BodyText variant="secondary">
            A daily reminder helps build your exercise habit.
          </BodyText>

          <Card>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Daily Reminder</Text>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{
                  false: Colors.light.border,
                  true: Colors.light.primary,
                }}
              />
            </View>
            {enabled && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Time</Text>
                <Text style={styles.timeValue}>{time}</Text>
              </View>
            )}
          </Card>
        </View>

        <Button title="Continue" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { gap: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 16, color: Colors.light.text },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  timeLabel: { fontSize: 16, color: Colors.light.text },
  timeValue: { fontSize: 16, color: Colors.light.primary, fontWeight: '500' },
});
