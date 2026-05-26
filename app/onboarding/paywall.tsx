import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
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
import type { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button, GlassCard, Caption } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useUserContext } from '@/src/contexts/UserContext';
import { useSubscription } from '@/src/hooks/useSubscription';
import { trackEvent } from '@/src/utils/analytics';

// ─── Map RevenueCat package identifiers to display ──────
const PACKAGE_META: Record<string, { label: string; badge?: string }> = {
  $rc_monthly: { label: 'Monthly' },
  $rc_annual: { label: 'Annual', badge: 'SAVE 50%' },
  $rc_lifetime: { label: 'Lifetime' },
};

// Fallback static plans when offerings unavailable
const FALLBACK_PLANS = [
  { label: 'Monthly', price: Strings.onboarding.paywallMonthly, id: '$rc_monthly' },
  { label: 'Annual', price: Strings.onboarding.paywallAnnual, id: '$rc_annual', badge: Strings.onboarding.paywallAnnualBadge },
  { label: 'Lifetime', price: Strings.onboarding.paywallLifetime, id: '$rc_lifetime' },
];

// ─── Benefit row with slide-in ──────────────────────────
function BenefitRow({ text, delay }: { text: string; delay: number }) {
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

// ─── Main ────────────────────────────────────────────────
export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { completeOnboarding } = useOnboarding();
  const { profile } = useUserContext();
  const { offerings, purchase, restore, loading: subLoading } = useSubscription();

  const [selectedIdx, setSelectedIdx] = useState(1); // default annual
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('paywall_shown');
  }, []);

  // Build plan list from RevenueCat offerings (fallback to static)
  const packages = useMemo(() => {
    const pkgs = offerings?.current?.availablePackages;
    if (!pkgs || pkgs.length === 0) return null;
    return pkgs;
  }, [offerings]);

  const symptomNames = (profile?.symptoms ?? [])
    .slice(0, 3)
    .map((s) => Strings.symptoms[s])
    .join(', ');

  const personalMessage = symptomNames
    ? `Based on your ${symptomNames}, we've created a targeted recovery plan.`
    : "We've created a personalised recovery plan for you.";

  const handlePurchase = async () => {
    setErrorMsg(null);
    setPurchasing(true);

    try {
      if (packages) {
        const pkg = packages[selectedIdx] ?? packages[0];
        const success = await purchase(pkg);
        if (!success) {
          // User cancelled or error — stay on screen
          setPurchasing(false);
          return;
        }
        trackEvent('paywall_purchased', { package: pkg.identifier });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await completeOnboarding();
      router.replace('/(tabs)');
    } catch {
      setErrorMsg(Strings.onboarding.paywallError);
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setErrorMsg(null);
    try {
      const success = await restore();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await completeOnboarding();
        router.replace('/(tabs)');
      } else {
        setErrorMsg(Strings.onboarding.paywallRestoreNone);
      }
    } catch {
      setErrorMsg(Strings.onboarding.paywallRestoreFailed);
    } finally {
      setRestoring(false);
    }
  };

  const handleDismiss = async () => {
    trackEvent('paywall_dismissed');
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  // ── Render plan card (RevenueCat or fallback) ──
  const renderPlanCard = (
    id: string,
    label: string,
    price: string,
    badge: string | undefined,
    index: number,
  ) => {
    const active = selectedIdx === index;
    return (
      <Pressable
        key={id}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedIdx(index);
        }}
        style={[
          styles.planCard,
          {
            borderColor: active ? theme.accent : theme.border,
            backgroundColor: active ? theme.accent + '15' : theme.card,
          },
        ]}
      >
        {badge && (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Text
          style={[
            styles.planLabel,
            { color: active ? theme.accent : theme.textSecondary },
          ]}
        >
          {label}
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
          {price}
        </Text>
      </Pressable>
    );
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

          {/* Price cards — real or fallback */}
          {subLoading ? (
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
              style={{ marginVertical: 16 }}
            />
          ) : (
            <View style={styles.plans}>
              {packages
                ? packages.map((pkg: PurchasesPackage, i: number) => {
                    const meta = PACKAGE_META[pkg.identifier] ?? {
                      label: pkg.packageType ?? pkg.identifier,
                    };
                    return renderPlanCard(
                      pkg.identifier,
                      meta.label,
                      pkg.product.priceString,
                      meta.badge,
                      i,
                    );
                  })
                : FALLBACK_PLANS.map((p, i) =>
                    renderPlanCard(p.id, p.label, p.price, p.badge, i),
                  )}
            </View>
          )}

          {errorMsg && (
            <Caption style={{ color: theme.error, textAlign: 'center' }}>
              {errorMsg}
            </Caption>
          )}
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <Button
            title={
              purchasing
                ? Strings.common.processing
                : Strings.onboarding.paywallCta
            }
            onPress={handlePurchase}
            variant="accent"
            size="lg"
            disabled={purchasing || restoring}
          />
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            style={styles.restoreButton}
          >
            <Text style={[styles.restoreText, { color: theme.textMuted }]}>
              {restoring ? Strings.common.restoring : Strings.onboarding.paywallRestore}
            </Text>
          </Pressable>
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
  dismissX: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 24, paddingTop: 48, gap: 24 },
  benefits: { gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkIcon: { fontSize: 18, fontWeight: '700' },
  plans: { flexDirection: 'row', gap: 10 },
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
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planLabel: { fontSize: 13, marginTop: 12 },
  planPrice: { fontSize: 15 },
  footer: { padding: 24, paddingTop: 8, gap: 12 },
  restoreButton: { alignItems: 'center', paddingVertical: 8 },
  restoreText: { fontSize: 14 },
});
