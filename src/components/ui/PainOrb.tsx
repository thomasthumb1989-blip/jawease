import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { Fonts } from '@/src/constants/fonts';

// Skia crashes on web (no CanvasKit) — lazy import for native only
let Canvas: any;
let SkiaCircle: any;
let RadialGradient: any;
let vec: any;
let BlurMask: any;

if (Platform.OS !== 'web') {
  const Skia = require('@shopify/react-native-skia');
  Canvas = Skia.Canvas;
  SkiaCircle = Skia.Circle;
  RadialGradient = Skia.RadialGradient;
  vec = Skia.vec;
  BlurMask = Skia.BlurMask;
}

interface PainOrbProps {
  level: number;
  onLevelChange?: (level: number) => void;
  size?: 'small' | 'large';
  interactive?: boolean;
}

const SIZE_MAP = { small: 80, large: 200 } as const;
const FONT_MAP = { small: 24, large: 48 } as const;

function getPainLabel(level: number): string {
  if (level === 0) return 'No pain';
  if (level <= 2) return 'Mild';
  if (level <= 4) return 'Moderate';
  if (level <= 6) return 'Uncomfortable';
  if (level <= 8) return 'Severe';
  return 'Extreme';
}

export const PainOrb = React.memo(function PainOrb({
  level,
  onLevelChange,
  size = 'large',
  interactive = false,
}: PainOrbProps) {
  const theme = useTheme();
  const px = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const radius = px / 2;
  const glowRadius = radius * 1.1;
  const canvasSize = px * 1.3;
  const center = canvasSize / 2;

  const painValue = useSharedValue(level);
  const lastIntLevel = useSharedValue(Math.round(level));

  useEffect(() => {
    painValue.value = withSpring(level, { damping: 20, stiffness: 150 });
    lastIntLevel.value = Math.round(level);
  }, [level, painValue, lastIntLevel]);

  const fireHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const updateLevel = useCallback(
    (val: number) => {
      onLevelChange?.(val);
    },
    [onLevelChange],
  );

  // Derive colors from painValue
  const colorOuter = useDerivedValue(() => {
    const v = painValue.value;
    if (v <= 3) return theme.primary;
    if (v <= 6) return theme.accent;
    return theme.error;
  });

  const colorInner = useDerivedValue(() => {
    const v = painValue.value;
    if (v <= 3) return theme.primaryLight;
    if (v <= 6) return theme.accentGlow;
    return '#E86B6B';
  });

  const displayLevel = useDerivedValue(() => Math.round(painValue.value));

  // Pan gesture for interactive mode
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!interactive) return;
      // Drag up = increase, drag down = decrease
      const delta = -e.translationY / 30;
      const newVal = Math.max(0, Math.min(10, level + delta));
      painValue.value = newVal;

      const rounded = Math.round(newVal);
      if (rounded !== lastIntLevel.value) {
        lastIntLevel.value = rounded;
        runOnJS(fireHaptic)();
        runOnJS(updateLevel)(rounded);
      }
    })
    .onEnd(() => {
      painValue.value = withSpring(Math.round(painValue.value), {
        damping: 20,
        stiffness: 150,
      });
    });

  // Static color derivation for Skia (Skia can't use animated values directly for colors)
  const outerColor = level <= 3 ? theme.primary : level <= 6 ? theme.accent : theme.error;
  const innerColor = level <= 3 ? theme.primaryLight : level <= 6 ? theme.accentGlow : '#E86B6B';
  const glowColor = outerColor + '4D'; // 30% opacity

  // Web fallback: CSS gradient circle (no Skia)
  const webOrb = (
    <View style={[styles.wrapper, { width: canvasSize, height: canvasSize }]}>
      <View
        style={[
          styles.webGlow,
          {
            width: glowRadius * 2,
            height: glowRadius * 2,
            borderRadius: glowRadius,
            backgroundColor: glowColor,
            top: center - glowRadius,
            left: center - glowRadius,
          },
        ]}
      />
      <View
        style={[
          styles.webOrb,
          {
            width: px,
            height: px,
            borderRadius: radius,
            backgroundColor: outerColor,
            top: center - radius,
            left: center - radius,
          },
        ]}
      >
        <View
          style={[
            styles.webHighlight,
            {
              width: radius * 0.7,
              height: radius * 0.7,
              borderRadius: radius * 0.35,
              top: radius * 0.15,
              left: radius * 0.15,
            },
          ]}
        />
      </View>
      <View style={[styles.numberOverlay, { width: canvasSize, height: canvasSize }]}>
        <Text style={[styles.number, { fontSize }]}>
          {Math.round(level)}
        </Text>
      </View>
    </View>
  );

  // Native: full Skia orb
  const nativeOrb = Platform.OS !== 'web' ? (
    <View style={[styles.wrapper, { width: canvasSize, height: canvasSize }]}>
      <Canvas style={{ width: canvasSize, height: canvasSize }}>
        {/* Outer glow ring */}
        <SkiaCircle cx={center} cy={center} r={glowRadius}>
          <RadialGradient
            c={vec(center, center)}
            r={glowRadius}
            colors={[glowColor, 'transparent']}
          />
          <BlurMask blur={8} style="normal" />
        </SkiaCircle>

        {/* Main orb with radial gradient */}
        <SkiaCircle cx={center} cy={center} r={radius}>
          <RadialGradient
            c={vec(center * 0.85, center * 0.85)}
            r={radius * 1.4}
            colors={[innerColor, outerColor]}
          />
        </SkiaCircle>

        {/* Inner highlight for glass refraction */}
        <SkiaCircle cx={center * 0.8} cy={center * 0.75} r={radius * 0.35}>
          <RadialGradient
            c={vec(center * 0.8, center * 0.75)}
            r={radius * 0.35}
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
          />
        </SkiaCircle>
      </Canvas>

      <View style={[styles.numberOverlay, { width: canvasSize, height: canvasSize }]}>
        <Text style={[styles.number, { fontSize }]}>
          {Math.round(level)}
        </Text>
      </View>
    </View>
  ) : null;

  const orbContent = Platform.OS === 'web' ? webOrb : nativeOrb;

  return (
    <View style={styles.container}>
      {interactive ? (
        <GestureDetector gesture={panGesture}>
          <Animated.View>{orbContent}</Animated.View>
        </GestureDetector>
      ) : (
        orbContent
      )}
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {getPainLabel(Math.round(level))}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  wrapper: { position: 'relative' },
  numberOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: Fonts.heading,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Web fallback styles
  webGlow: {
    position: 'absolute',
    opacity: 0.3,
  },
  webOrb: {
    position: 'absolute',
    overflow: 'hidden',
  },
  webHighlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});

export default PainOrb;
PainOrb.displayName = 'PainOrb';
