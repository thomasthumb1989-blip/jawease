import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button, GlassCard } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useUserContext } from '@/src/contexts/UserContext';
import { useSubscription } from '@/src/hooks/useSubscription';
import { trackEvent } from '@/src/utils/analytics';

type PricePlan = 'monthly' | 'annual' | 'lifetime';

const PLANS: { key: PricePlan; label: string; price: string; badge?: string }[] = [
  { key: 'monthly', label: 'Monthly', price: Strings.onboarding.paywallMonthly },
  {
    key: 'annual',
    label: 'Annual',
    price: Strings.onboarding.paywallAnnual,
    badge: Strings.onboarding.paywallAnnualBadge,
  },
  { key: 'lifetime', label: 'Lifetime', price: Strings.onboarding.paywallLifetime },
];

function BenefitRow({
  text,
  delay,
}: {
  text: string;
  delay: number;
}) {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-12);

  useEffect(() => {
    const cfg = { duration: 400, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(delay, withTiming(1, cfg));
    translateX.value = withDelay(delay, withTiming(0, cfg));
  }, [delay, opacity, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.benefitRow, animStyle]}>
      <Text style={[styles.checkIcon, { color: theme.success }]}>✓</Text>
      <BodyText>{text}</BodyText>
    </Animated.View>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { completeOnboarding } = useOnboarding();
  const { profile } = useUserContext();
  const { purchase } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PricePlan>('annual');

  useEffect(() => {
    trackEvent('paywall_shown');
  }, []);

  const symptomNames = (profile?.symptoms ?? [])
    .slice(0, 3)
    .map((s) => Strings.symptoms[s])
    .join(', ');

  const personalMessage = symptomNames
    ? `Based on your ${symptomNames}, we've created a targeted recovery plan.`
    : "We've created a personalised recovery plan for you.";

  const handlePurchase = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await purchase();
    trackEvent('paywall_purchased');
    await completeOnboarding('trial');
    router.replace('/(tabs)');
  };

  const handleDismiss = async () => {
    trackEvent('paywall_dismissed');
    await completeOnboarding('preview');
    router.replace('/(tabs)');
  };

  const selectPlan = (plan: PricePlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  return (
    <LinearGradient
      colors={[theme.primary, theme.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.5 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* X dismiss (Apple required) */}
        <Pressable
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={16}
        >
          <Text style={styles.dismissX}>✕</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Heading style={{ color: '#FFFFFF', textAlign: 'center' }}>
            {Strings.onboarding.paywallHeading}
          </Heading>

          {/* Personalised message card */}
          <GlassCard>
            <BodyText style={{ textAlign: 'center' }}>
              {personalMessage}
            </BodyText>
          </GlassCard>

          {/* Benefits */}
          <View style={styles.benefits}>
            {Strings.onboarding.paywallBenefits.map((benefit, i) => (
              <BenefitRow key={benefit} text={benefit} delay={200 + i * 120} />
            ))}
          </View>

          {/* Price cards */}
          <View style={styles.plans}>
            {PLANS.map((plan) => {
              const active = selectedPlan === plan.key;
              return (
                <Pressable
                  key={plan.key}
                  onPress={() => selectPlan(plan.key)}
                  style={[
                    styles.planCard,
                    {
                      borderColor: active ? theme.accent : theme.border,
                      backgroundColor: active
                        ? theme.accent + '15'
                        : theme.card,
                    },
                  ]}
                >
                  {plan.badge && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: theme.accent },
                      ]}
                    >
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.planLabel,
                      { color: active ? theme.accent : theme.textSecondary },
                    ]}
                  >
                    {plan.label}
                  </Text>
                  <Text
                    style={[
                      styles.planPrice,
                      {
                        color: active ? theme.text : theme.textSecondary,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {plan.price}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <Button
            title={Strings.onboarding.paywallCta}
            onPress={handlePurchase}
            variant="accent"
            size="lg"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  dismissButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissX: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    gap: 24,
  },
  benefits: { gap: 12 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  plans: {
    flexDirection: 'row',
    gap: 10,
  },
  planCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planLabel: {
    fontSize: 13,
    marginTop: 12,
  },
  planPrice: {
    fontSize: 15,
  },
  footer: { padding: 24, paddingTop: 8 },
});
