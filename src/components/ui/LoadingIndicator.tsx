import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingIndicator({
  size = 'large',
  fullScreen = false,
}: LoadingIndicatorProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={Colors.light.primary} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={Colors.light.primary} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
});
