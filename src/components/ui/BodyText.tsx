import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface BodyTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'muted';
  style?: TextStyle;
}

export function BodyText({
  children,
  variant = 'primary',
  style,
}: BodyTextProps) {
  return (
    <Text style={[styles.base, styles[variant], style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 16, lineHeight: 24 },
  primary: { color: Colors.light.text },
  secondary: { color: Colors.light.textSecondary },
  muted: { color: Colors.light.textMuted },
});
