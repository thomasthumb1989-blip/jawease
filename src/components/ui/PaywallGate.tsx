import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  type LayoutChangeEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme, useColorSchemeValue } from '@/src/hooks/useTheme';
import { useSubscriptionContext } from '@/src/contexts/SubscriptionContext';
import { Button } from './Button';
import { Heading } from './Heading';
import { BodyText } from './BodyText';

interface PaywallGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function PaywallGate({ children, feature }: PaywallGateProps) {
  const theme = useTheme();
  const scheme = useColorSchemeValue();
  const { isPremium, status } = useSubscriptionContext();
  const router = useRouter();

  // The lock overlay is position:'absolute', so it contributes no height and
  // the container would otherwise size to the wrapped child alone. Where the
  // child is shorter than the overlay the Unlock button ended up outside the
  // container's bounds — clipped by overflow:'hidden' AND undeliverable, since
  // neither iOS nor Android dispatches touches to a subview outside its
  // parent's bounds. Measuring the overlay's own natural height and applying it
  // as the container's minHeight makes the container as tall as whichever is
  // taller, child or overlay, with no call site passing a height and no child
  // height hardcoded. Flexbox cannot express max() of two siblings, which is
  // why this is measured rather than declared.
  const [lockHeight, setLockHeight] = useState(0);

  const onLockLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    // Ignore sub-pixel churn, or this re-renders forever.
    setLockHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, []);

  // Still checking — show children with spinner overlay
  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>{children}</View>
        <View style={[styles.overlay, styles.blur, { backgroundColor: theme.background + 'CC' }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  const handleUnlock = () => {
    router.push('/paywall?mode=upgrade');
  };

  // Single definition so both platform branches measure the same thing.
  const lockBody = (
    <View style={styles.lockContent} onLayout={onLockLayout}>
      <Heading level={3}>Unlock {feature ?? 'this feature'}</Heading>
      <BodyText variant="secondary">
        Upgrade to JawEase Premium for full access.
      </BodyText>
      <Button
        title="Unlock"
        onPress={handleUnlock}
        variant="accent"
        size="md"
      />
    </View>
  );

  return (
    <View
      style={[styles.container, lockHeight > 0 && { minHeight: lockHeight }]}
    >
      {/* Render children behind blur */}
      <View style={styles.content}>{children}</View>

      {/* Blur overlay */}
      <Pressable style={styles.overlay} onPress={handleUnlock}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={25}
            tint={scheme === 'dark' ? 'dark' : 'light'}
            style={styles.blur}
          >
            {lockBody}
          </BlurView>
        ) : (
          <View
            style={[
              styles.blur,
              { backgroundColor: theme.background + 'E6' },
            ]}
          >
            {lockBody}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // overflow:'hidden' is retained deliberately. The container has no
  // borderRadius and the BlurView is bounded by the absolutely-positioned
  // overlay, so it clips nothing in the steady state — but on the first frame,
  // before onLayout has reported, it stops the oversized overlay spilling onto
  // neighbouring UI. minHeight below is what actually fixes the bounds.
  container: { position: 'relative', overflow: 'hidden' },
  content: { opacity: 0.3 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
});

export default PaywallGate;
