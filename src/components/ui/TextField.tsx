import React, { useState, useCallback } from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';

interface TextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  secureTextEntry?: boolean;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    if (!value) {
      focusAnim.value = withTiming(0, { duration: 200 });
    }
  }, [focusAnim, value]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: focusAnim.value === 1 || value ? -24 : 0,
      },
    ],
    fontSize: focusAnim.value === 1 || value ? 12 : 16,
  }));

  const borderColor = error
    ? theme.error
    : focused
    ? theme.primary
    : theme.textSecondary;
  const borderWidth = focused ? 2 : 1;
  const bgTint = focused ? theme.primary + '08' : 'transparent';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            borderBottomColor: borderColor,
            borderBottomWidth: borderWidth,
            backgroundColor: bgTint,
          },
        ]}
      >
        {label && (
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                color: focused ? theme.primary : theme.textSecondary,
              },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={label ? undefined : placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: theme.text,
              paddingTop: label ? 20 : 14,
            },
          ]}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  inputContainer: {
    position: 'relative',
    paddingHorizontal: 4,
  },
  floatingLabel: {
    position: 'absolute',
    left: 4,
    top: 14,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
});

export default TextField;
