import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  style?: TextStyle;
}

export function Heading({ children, level = 1, style }: HeadingProps) {
  return (
    <Text style={[styles.base, styles[`h${level}`], style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  base: { color: Colors.light.text, fontWeight: '700' },
  h1: { fontSize: 32, lineHeight: 40 },
  h2: { fontSize: 24, lineHeight: 32 },
  h3: { fontSize: 20, lineHeight: 28 },
});
