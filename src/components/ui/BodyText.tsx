import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

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
  const theme = useTheme();

  const colorMap = {
    primary: theme.text,
    secondary: theme.textSecondary,
    muted: theme.textMuted,
  };

  return (
    <Text style={[styles.base, { color: colorMap[variant] }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 16, lineHeight: 24 },
});

export default BodyText;
