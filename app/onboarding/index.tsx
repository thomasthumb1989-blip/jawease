import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button } from '@/src/components/ui';
import { trackEvent } from '@/src/utils/analytics';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = () => {
    trackEvent('onboarding_started');
    router.push('/onboarding/symptoms');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Heading>{Strings.onboarding.welcome}</Heading>
          <BodyText variant="secondary" style={styles.subtitle}>
            Your personalized TMJ relief program. Track pain, do guided
            exercises, and see real progress.
          </BodyText>
        </View>
        <Button title="Get Started" onPress={handleStart} size="lg" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  subtitle: { lineHeight: 26 },
});
