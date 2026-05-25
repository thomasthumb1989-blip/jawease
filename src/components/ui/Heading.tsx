import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  animated?: boolean;
  style?: TextStyle;
}

const SIZES = {
  1: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  2: { fontSize: 22, lineHeight: 30, fontWeight: '600' as const },
  3: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
};

export function Heading({
  children,
  level = 1,
  animated = false,
  style,
}: HeadingProps) {
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
        { color: theme.text, ...SIZES[level] },
        animStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

export default Heading;
