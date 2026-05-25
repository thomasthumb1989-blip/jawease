import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import {
  Heading,
  BodyText,
  Button,
  TextField,
} from '@/src/components/ui';
import { useEmailCapture } from '@/src/hooks/useEmailCapture';

export default function EmailScreen() {
  const router = useRouter();
  const { submit, submitting, submitted } = useEmailCapture();
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (email.includes('@')) {
      await submit(email);
    }
    router.push('/onboarding/paywall');
  };

  const handleSkip = () => {
    router.push('/onboarding/paywall');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Heading level={2}>{Strings.onboarding.emailTitle}</Heading>
          <BodyText variant="secondary">
            Get weekly TMJ tips, exercise reminders, and recovery insights.
          </BodyText>

          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            label="Email address"
          />
        </View>

        <View style={styles.buttons}>
          <Button
            title={submitted ? 'Subscribed!' : 'Subscribe & Continue'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!email.includes('@') && !submitted}
          />
          <Button title="Skip" onPress={handleSkip} variant="ghost" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { gap: 20 },
  buttons: { gap: 8 },
});
