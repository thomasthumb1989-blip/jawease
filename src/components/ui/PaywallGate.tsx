import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Button } from './Button';

interface PaywallGateProps {
  feature: string;
  onUpgrade: () => void;
}

export function PaywallGate({ feature, onUpgrade }: PaywallGateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.title}>Premium Feature</Text>
      <Text style={styles.message}>
        Unlock {feature} with JawEase Premium for your full recovery plan.
      </Text>
      <Button title="Upgrade" onPress={onUpgrade} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
  },
  lock: { fontSize: 40 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  message: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
