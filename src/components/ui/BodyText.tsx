import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { Fonts } from '@/src/constants/fonts';

interface BodyTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'muted';
  animated?: boolean;
  style?: TextStyle;
}

export function BodyText({
  children,
  variant = 'primary',
  animated = false,
  style,
}: BodyTextProps) {
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

  const colorMap = {
    primary: theme.text,
    secondary: theme.textSecondary,
    muted: theme.textMuted,
  };

  return (
    <Animated.Text
      style={[
        { fontSize: 16, lineHeight: 24, fontFamily: Fonts.body },
        { color: colorMap[variant] },
        animStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

export default BodyText;
