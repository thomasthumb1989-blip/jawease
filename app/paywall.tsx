import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
const PACKAGE_META: Record<string, { label: string; badge?: string; trialTerms: (price: string) => string }> = {
  $rc_monthly: { label: 'Monthly', trialTerms: (p) => `3-day free trial, then ${p}/mo` },
  $rc_annual: { label: 'Annual', badge: 'SAVE 50%', trialTerms: (p) => `3-day free trial, then ${p}/yr` },
  $rc_lifetime: { label: 'Lifetime', trialTerms: () => 'One-time purchase' },
};

// Fallback static plans when offerings unavailable
const FALLBACK_PLANS = [
  { label: 'Monthly', price: Strings.onboarding.paywallMonthly, id: '$rc_monthly', trialTerms: '3-day free trial, then £4.99/mo' },
  { label: 'Annual', price: Strings.onboarding.paywallAnnual, id: '$rc_annual', badge: Strings.onboarding.paywallAnnualBadge, trialTerms: '3-day free trial, then £29.99/yr' },
  { label: 'Lifetime', price: Strings.onboarding.paywallLifetime, id: '$rc_lifetime', trialTerms: 'One-time purchase' },
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
  const { profile, onboardingComplete } = useUserContext();
  const { offerings, purchase, restore, loading: subLoading } = useSubscription();
  const params = useLocalSearchParams<{ mode?: string | string[] }>();

  // ── Mode ──
  // useLocalSearchParams returns string | string[] | undefined — never a
  // narrowed union. Normalise defensively: only the literal 'onboarding'
  // opts in; everything else (undefined, unknown strings, arrays) is
  // 'upgrade'. A returning user can never re-run onboarding completion.
  const mode: 'onboarding' | 'upgrade' = useMemo(() => {
    const raw = Array.isArray(params.mode) ? params.mode[0] : params.mode;
    if (raw !== 'onboarding') return 'upgrade';
    return onboardingComplete ? 'upgrade' : 'onboarding';
  }, [params.mode, onboardingComplete]);

  // Upgrade-mode exit. /paywall is a top-level route, so it can be reached
  // with an empty history stack (deep link, cold start). router.back() on an
  // empty stack is a no-op, so fall back to the tabs.
  const dismiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

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
      } else if (mode === 'upgrade') {
        // No offerings to buy. In upgrade mode this is a no-op — never grant
        // entry and never navigate. (Onboarding mode keeps its original
        // fall-through below.)
        setPurchasing(false);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (mode === 'onboarding') {
        // completeOnboarding() writes to AsyncStorage — must settle before
        // navigating, or the root guard can fire on stale state.
        await completeOnboarding();
        router.replace('/(tabs)');
      } else {
        dismiss();
      }
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
        if (mode === 'onboarding') {
          await completeOnboarding();
          router.replace('/(tabs)');
        } else {
          dismiss();
        }
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
    if (mode === 'onboarding') {
      await completeOnboarding();
      router.replace('/(tabs)');
      return;
    }
    dismiss();
  };

  // ── Render plan card (RevenueCat or fallback) ──
  const renderPlanCard = (
    id: string,
    label: string,
    price: string,
    badge: string | undefined,
    index: number,
    trialTerms: string,
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
              fontWeight: '700',
            },
          ]}
        >
          {price}
        </Text>
        <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center' }}>
          {trialTerms}
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
                      trialTerms: () => '',
                    };
                    return renderPlanCard(
                      pkg.identifier,
                      meta.label,
                      pkg.product.priceString,
                      meta.badge,
                      i,
                      meta.trialTerms(pkg.product.priceString),
                    );
                  })
                : FALLBACK_PLANS.map((p, i) =>
                    renderPlanCard(p.id, p.label, p.price, p.badge, i, p.trialTerms),
                  )}
            </View>
          )}

          <Text
            style={{
              fontSize: 12,
              color: theme.textMuted,
              textAlign: 'center',
              paddingHorizontal: 16,
            }}
          >
            After your 3-day free trial, your subscription will automatically
            renew at the price shown above. Cancel anytime in Settings {'>'}{' '}
            Apple ID {'>'} Subscriptions at least 24 hours before the current
            period ends. Payment is charged to your Apple ID account.
          </Text>

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
  planPrice: { fontSize: 18 },
  footer: { padding: 24, paddingTop: 8, gap: 12 },
  restoreButton: { alignItems: 'center', paddingVertical: 8 },
  restoreText: { fontSize: 14 },
});
