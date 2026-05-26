import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import {
  Heading,
  BodyText,
  Button,
  TextField,
  Caption,
} from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useEmailCapture } from '@/src/hooks/useEmailCapture';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { saveEmail } = useOnboarding();
  const { submit, submitting } = useEmailCapture();
  const [email, setEmail] = useState('');

  const isValid = useMemo(() => EMAIL_REGEX.test(email), [email]);

  const handleContinue = async () => {
    if (!isValid) return;

    // Save locally first — never block on API
    await saveEmail(email);

    // Fire-and-forget email capture
    submit(email).catch(() => {});

    router.push('/onboarding/paywall');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Heading level={2}>{Strings.onboarding.emailTitle}</Heading>
          <BodyText variant="secondary">
            {Strings.onboarding.emailSubtext}
          </BodyText>

          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder={Strings.onboarding.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            label={Strings.onboarding.emailLabel}
          />

          <Caption muted>{Strings.onboarding.emailCaption}</Caption>
        </View>

        <Button
          title={Strings.onboarding.emailCta}
          onPress={handleContinue}
          disabled={!isValid}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { gap: 20 },
});
