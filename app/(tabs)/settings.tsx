import React from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { Heading, Card } from '@/src/components/ui';
import { useSubscription } from '@/src/hooks/useSubscription';

export default function SettingsScreen() {
  const theme = useTheme();
  const { isPremium, restore } = useSubscription();

  const settingsItems = [
    { label: 'Subscription', value: isPremium ? 'Premium' : 'Free' },
    { label: 'Restore Purchases', onPress: restore },
    {
      label: 'Privacy Policy',
      onPress: () => Linking.openURL('https://jawease.app/privacy'),
    },
    {
      label: 'Terms of Service',
      onPress: () => Linking.openURL('https://jawease.app/terms'),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Heading>Settings</Heading>

        <Card>
          {settingsItems.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={[
                styles.row,
                index < settingsItems.length - 1 && [
                  styles.rowBorder,
                  { borderBottomColor: theme.border },
                ],
              ]}
            >
              <Text style={[styles.rowLabel, { color: theme.text }]}>
                {item.label}
              </Text>
              {item.value && (
                <Text style={[styles.rowValue, { color: theme.textMuted }]}>
                  {item.value}
                </Text>
              )}
              {item.onPress && !item.value && (
                <Text style={[styles.rowArrow, { color: theme.textMuted }]}>
                  ›
                </Text>
              )}
            </Pressable>
          ))}
        </Card>

        <Text style={[styles.version, { color: theme.textMuted }]}>
          JawEase v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 16 },
  rowArrow: { fontSize: 20 },
  version: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 20,
  },
});
