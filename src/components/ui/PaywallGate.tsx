import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
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
  const { isPremium } = useSubscriptionContext();
  const router = useRouter();

  if (isPremium) {
    return <>{children}</>;
  }

  const handleUnlock = () => {
    router.push('/onboarding/paywall');
  };

  return (
    <View style={styles.container}>
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
            <View style={styles.lockContent}>
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
          </BlurView>
        ) : (
          <View
            style={[
              styles.blur,
              { backgroundColor: theme.background + 'E6' },
            ]}
          >
            <View style={styles.lockContent}>
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
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
