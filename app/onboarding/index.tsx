import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button } from '@/src/components/ui';
import { trackEvent } from '@/src/utils/analytics';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const headingOpacity = useSharedValue(0);
  const headingY = useSharedValue(20);
  const subtextOpacity = useSharedValue(0);
  const subtextY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonY = useSharedValue(20);

  useEffect(() => {
    const cfg = { duration: 600, easing: Easing.out(Easing.cubic) };
    headingOpacity.value = withTiming(1, cfg);
    headingY.value = withTiming(0, cfg);
    subtextOpacity.value = withDelay(200, withTiming(1, cfg));
    subtextY.value = withDelay(200, withTiming(0, cfg));
    buttonOpacity.value = withDelay(400, withTiming(1, cfg));
    buttonY.value = withDelay(400, withTiming(0, cfg));
  }, [headingOpacity, headingY, subtextOpacity, subtextY, buttonOpacity, buttonY]);

  const headingAnim = useAnimatedStyle(() => ({
    opacity: headingOpacity.value,
    transform: [{ translateY: headingY.value }],
  }));

  const subtextAnim = useAnimatedStyle(() => ({
    opacity: subtextOpacity.value,
    transform: [{ translateY: subtextY.value }],
  }));

  const buttonAnim = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonY.value }],
  }));

  const handleStart = () => {
    trackEvent('onboarding_started');
    router.push('/onboarding/symptoms');
  };

  return (
    <LinearGradient
      colors={[theme.primary, theme.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.hero}>
            <Animated.View style={headingAnim}>
              <Heading style={{ color: '#FFFFFF' }}>
                {Strings.onboarding.welcomeHeading}
              </Heading>
            </Animated.View>
            <Animated.View style={subtextAnim}>
              <BodyText style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 26 }}>
                {Strings.onboarding.welcomeSubtext}
              </BodyText>
            </Animated.View>
          </View>
          <Animated.View style={buttonAnim}>
            <Button
              title={Strings.onboarding.welcomeCta}
              onPress={handleStart}
              variant="accent"
              size="lg"
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
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
});
