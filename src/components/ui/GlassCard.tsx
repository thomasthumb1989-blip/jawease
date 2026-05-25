import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/src/constants/colors';

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
  // BlurView works on iOS; fallback to semi-transparent card on Android/web
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="light" style={[styles.card, style]}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.card, styles.fallback, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: Colors.light.card + 'E6',
  },
});
