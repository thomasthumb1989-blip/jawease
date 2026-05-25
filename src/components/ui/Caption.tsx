import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface CaptionProps {
  children: React.ReactNode;
  muted?: boolean;
  style?: TextStyle;
}

export function Caption({ children, muted = false, style }: CaptionProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        styles.caption,
        { color: muted ? theme.textMuted : theme.textSecondary },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default Caption;
