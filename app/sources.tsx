import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { sources } from '@/src/constants/sources';
import { Heading, BodyText, Card, Caption } from '@/src/components/ui';

export default function SourcesScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Card's onPress already fires a Light haptic — just open the link here.
  const openSource = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Heading level={2}>{Strings.disclaimer.sourcesTitle}</Heading>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <BodyText variant="secondary">{Strings.disclaimer.sourcesIntro}</BodyText>

        <View style={styles.list}>
          {sources.map((source) => (
            <Card
              key={source.url}
              onPress={() => openSource(source.url)}
              style={styles.row}
            >
              <View style={styles.rowInner}>
                <View style={styles.rowText}>
                  <Text style={[styles.sourceName, { color: theme.text }]}>
                    {source.name}
                  </Text>
                  <Caption muted>{source.url}</Caption>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.textMuted}
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { padding: 4 },
  content: { padding: 20, paddingTop: 8, gap: 16 },
  list: { gap: 12 },
  row: { paddingVertical: 16 },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  sourceName: { fontSize: 16, fontWeight: '600' },
});
