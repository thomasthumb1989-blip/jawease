import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, painLevelColors } from '@/src/constants/colors';

interface PainOrbProps {
  level: number; // 0-10
  size?: number;
  onPress?: () => void;
  showLabel?: boolean;
}

function getPainColor(level: number): string {
  if (level <= 2) return painLevelColors.none;
  if (level <= 4) return painLevelColors.mild;
  if (level <= 6) return painLevelColors.moderate;
  if (level <= 8) return painLevelColors.severe;
  return painLevelColors.extreme;
}

function getPainLabel(level: number): string {
  if (level === 0) return 'No pain';
  if (level <= 2) return 'Mild';
  if (level <= 4) return 'Moderate';
  if (level <= 6) return 'Uncomfortable';
  if (level <= 8) return 'Severe';
  return 'Extreme';
}

export function PainOrb({
  level,
  size = 120,
  onPress,
  showLabel = true,
}: PainOrbProps) {
  const color = getPainColor(level);

  const orbContent = (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <Text style={[styles.number, { fontSize: size * 0.35 }]}>
          {level}
        </Text>
      </View>
      {showLabel && <Text style={styles.label}>{getPainLabel(level)}</Text>}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{orbContent}</Pressable>;
  }
  return orbContent;
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8 },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  number: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
});
