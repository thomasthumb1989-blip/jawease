import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button, Card } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useSubscription } from '@/src/hooks/useSubscription';
import { trackEvent } from '@/src/utils/analytics';

const features = [
  'Unlimited exercise programs',
  'Advanced pain analytics',
  'Personalized recovery insights',
  'Priority support',
];

export default function PaywallScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { purchase } = useSubscription();

  React.useEffect(() => {
    trackEvent('paywall_shown');
  }, []);

  const handlePurchase = async () => {
    await purchase();
    trackEvent('paywall_purchased');
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    trackEvent('paywall_dismissed');
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Heading level={2}>{Strings.onboarding.paywallTitle}</Heading>

          <Card variant="elevated" style={styles.featuresCard}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.check}>✓</Text>
                <BodyText>{feature}</BodyText>
              </View>
            ))}
          </Card>

          <Card style={styles.priceCard}>
            <Text style={styles.price}>$4.99/month</Text>
            <Text style={styles.trial}>Start with 7-day free trial</Text>
          </Card>
        </View>

        <View style={styles.buttons}>
          <Button title="Start Free Trial" onPress={handlePurchase} size="lg" />
          <Button
            title="Continue with Free"
            onPress={handleSkip}
            variant="ghost"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { gap: 24 },
  featuresCard: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { fontSize: 18, color: Colors.light.success },
  priceCard: { alignItems: 'center', paddingVertical: 24 },
  price: { fontSize: 28, fontWeight: '700', color: Colors.light.text },
  trial: { fontSize: 14, color: Colors.light.textMuted, marginTop: 4 },
  buttons: { gap: 8 },
});
