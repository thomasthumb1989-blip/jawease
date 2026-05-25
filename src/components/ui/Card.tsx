import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
}

export function Card({
  children,
  style,
  variant = 'default',
  onPress,
}: CardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const cardStyle: ViewStyle = {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    ...(variant === 'elevated' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 32,
      elevation: 8,
    }),
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: 'transparent',
    }),
  };

  if (onPress) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={cardStyle}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[cardStyle, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

export default Card;
