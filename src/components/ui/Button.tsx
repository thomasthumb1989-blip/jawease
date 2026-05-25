import React, { useCallback } from 'react';
import { Text, Pressable, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP = { sm: 40, md: 48, lg: 56 } as const;
const FONT_MAP = { sm: 14, md: 16, lg: 18 } as const;
const PH_MAP = { sm: 16, md: 24, lg: 32 } as const;

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, loading, onPress]);

  const height = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const paddingHorizontal = PH_MAP[size];

  const isGradient = variant === 'primary' || variant === 'accent';

  const containerStyle: ViewStyle = {
    height,
    paddingHorizontal,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(variant === 'secondary' && {
      borderWidth: 1.5,
      borderColor: theme.primary,
      backgroundColor: 'transparent',
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
    ...(disabled && { opacity: 0.5 }),
  };

  const textColor =
    variant === 'primary' || variant === 'accent'
      ? '#FFFFFF'
      : theme.primary;

  const gradientColors: [string, string] =
    variant === 'accent'
      ? [theme.accent, theme.accentGlow]
      : [theme.primary, theme.primaryLight];

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <Text style={[styles.text, { fontSize, color: textColor }]}>{title}</Text>
  );

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Animated.View>
        {isGradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[containerStyle]}
          >
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handlePress}
              disabled={disabled || loading}
              style={styles.pressable}
            >
              {content}
            </Pressable>
          </LinearGradient>
        ) : (
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled || loading}
            style={[containerStyle, styles.pressable]}
          >
            {content}
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: { fontWeight: '600' },
  pressable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
