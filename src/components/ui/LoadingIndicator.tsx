import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const SIZE_MAP = { sm: 24, md: 40, lg: 60 } as const;

export function LoadingIndicator({
  size = 'md',
  fullScreen = false,
}: LoadingIndicatorProps) {
  const theme = useTheme();
  const px = SIZE_MAP[size];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const orb = (
    <Animated.View
      style={[
        {
          width: px,
          height: px,
          borderRadius: px / 2,
          backgroundColor: theme.primary,
        },
        animStyle,
      ]}
    />
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
        {orb}
      </View>
    );
  }

  return orb;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingIndicator;
