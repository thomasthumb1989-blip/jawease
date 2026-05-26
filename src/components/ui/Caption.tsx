import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { Fonts } from '@/src/constants/fonts';

interface CaptionProps {
  children: React.ReactNode;
  muted?: boolean;
  animated?: boolean;
  style?: TextStyle;
}

export function Caption({
  children,
  muted = false,
  animated = false,
  style,
}: CaptionProps) {
  const theme = useTheme();
  const opacity = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [animated, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        { fontSize: 13, lineHeight: 18, fontFamily: Fonts.body },
        { color: muted ? theme.textMuted : theme.textSecondary },
        animStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

export default Caption;
