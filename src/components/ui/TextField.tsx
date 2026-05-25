import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface TextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  secureTextEntry?: boolean;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  label,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
}: TextFieldProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
});
