import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Heading, Card, BodyText, ProgressRing } from '@/src/components/ui';
import { useStreak } from '@/src/hooks/useStreak';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import { useInsights } from '@/src/hooks/useInsights';

export default function ProgressScreen() {
  const { currentStreak, longestStreak } = useStreak();
  const { logs, weeklyTrend } = usePainLog();
  const { sessions } = useExerciseContext();
  const insights = useInsights();
  const trend = weeklyTrend();

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Heading>Progress</Heading>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </Card>
        </View>

        {/* Weekly Pain Trend */}
        <Card variant="elevated">
          <Text style={styles.sectionTitle}>Pain This Week</Text>
          <View style={styles.trendRow}>
            {trend.map((val, i) => (
              <View key={i} style={styles.trendItem}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: val >= 0 ? Math.max(val * 8, 4) : 4,
                      backgroundColor:
                        val >= 0 ? Colors.light.primary : Colors.light.border,
                    },
                  ]}
                />
                <Text style={styles.trendLabel}>{dayLabels[i]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {insights.map((insight) => (
              <Card key={insight.id} style={styles.insightCard}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <BodyText variant="secondary">{insight.message}</BodyText>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 16 },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.accent,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  trendItem: { alignItems: 'center', gap: 4, flex: 1 },
  trendBar: { width: 20, borderRadius: 4 },
  trendLabel: { fontSize: 11, color: Colors.light.textMuted },
  insightsSection: { gap: 8 },
  insightCard: { gap: 4 },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
