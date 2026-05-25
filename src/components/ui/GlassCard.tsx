import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme, useColorSchemeValue } from '@/src/hooks/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 40,
}: GlassCardProps) {
  const theme = useTheme();
  const scheme = useColorSchemeValue();
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
    opacity.value = withSpring(1, { damping: 20, stiffness: 150 });
  }, [translateY, opacity]);

  const entryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const bgColor =
    scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)';
  const borderColor = 'rgba(255,255,255,0.15)';
  const tint = scheme === 'dark' ? 'dark' : 'light';

  const cardStyle: ViewStyle = {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
    // Triple shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  };

  return (
    <Animated.View style={[entryStyle, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={tint} style={cardStyle}>
          <View style={{ backgroundColor: bgColor, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          {children}
        </BlurView>
      ) : (
        <View style={[cardStyle, { backgroundColor: bgColor }]}>
          {children}
        </View>
      )}
    </Animated.View>
  );
}

export default GlassCard;
