import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface CaptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function Caption({ children, style }: CaptionProps) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
  },
});
