import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

export function EmptyState({
  title,
  message,
  actionTitle,
  onAction,
  illustration,
}: EmptyStateProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      {illustration && <View style={styles.illustration}>{illustration}</View>}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textMuted }]}>
        {message}
      </Text>
      {actionTitle && onAction && (
        <View style={styles.buttonWrapper}>
          <Button title={actionTitle} onPress={onAction} size="sm" />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  illustration: { marginBottom: 8 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonWrapper: { marginTop: 8 },
});

export default EmptyState;
