import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Heading, BodyText, Button, PainOrb } from '@/src/components/ui';
import { useOnboarding } from '@/src/hooks/useOnboarding';

function getPainDescriptor(level: number): string {
  if (level <= 1) return Strings.onboarding.painDescriptors.none;
  if (level <= 3) return Strings.onboarding.painDescriptors.mild;
  if (level <= 5) return Strings.onboarding.painDescriptors.moderate;
  if (level <= 7) return Strings.onboarding.painDescriptors.significant;
  return Strings.onboarding.painDescriptors.severe;
}

export default function BaselineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { saveBaseline } = useOnboarding();
  const [painLevel, setPainLevel] = useState(5);
  const descriptorOpacity = useSharedValue(1);

  const handlePainChange = (level: number) => {
    descriptorOpacity.value = withTiming(0, { duration: 100 }, () => {
      runOnJS(setPainLevel)(level);
      descriptorOpacity.value = withTiming(1, { duration: 200 });
    });
  };

  const descriptorAnim = useAnimatedStyle(() => ({
    opacity: descriptorOpacity.value,
  }));

  const handleNext = async () => {
    await saveBaseline(painLevel, 'easy');
    router.push('/onboarding/reminder');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Heading level={2}>{Strings.onboarding.baselineTitle}</Heading>

          <PainOrb
            level={painLevel}
            onLevelChange={handlePainChange}
            size="large"
            interactive
          />

          <Animated.View style={descriptorAnim}>
            <BodyText
              variant="secondary"
              style={{ textAlign: 'center', fontSize: 18 }}
            >
              {getPainDescriptor(painLevel)}
            </BodyText>
          </Animated.View>

          <BodyText variant="muted" style={{ textAlign: 'center' }}>
            Drag the orb to adjust
          </BodyText>
        </View>

        <Button title="Continue" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' },
});
