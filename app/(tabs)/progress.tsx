import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { Heading, Card, BodyText, ProgressRing } from '@/src/components/ui';
import { useStreak } from '@/src/hooks/useStreak';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import { useInsights } from '@/src/hooks/useInsights';

export default function ProgressScreen() {
  const theme = useTheme();
  const { currentStreak, longestStreak } = useStreak();
  const { logs, weeklyTrend } = usePainLog();
  const { sessions } = useExerciseContext();
  const insights = useInsights();
  const trend = weeklyTrend();

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Heading>Progress</Heading>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.accent }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Current Streak
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.accent }]}>
              {longestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Best Streak
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.accent }]}>
              {sessions.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Sessions
            </Text>
          </Card>
        </View>

        {/* Weekly Pain Trend */}
        <Card variant="elevated">
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Pain This Week
          </Text>
          <View style={styles.trendRow}>
            {trend.map((val, i) => (
              <View key={i} style={styles.trendItem}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: val >= 0 ? Math.max(val * 8, 4) : 4,
                      backgroundColor:
                        val >= 0 ? theme.primary : theme.border,
                    },
                  ]}
                />
                <Text style={[styles.trendLabel, { color: theme.textMuted }]}>
                  {dayLabels[i]}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Insights
            </Text>
            {insights.map((insight) => (
              <Card key={insight.id} style={styles.insightCard}>
                <Text style={[styles.insightTitle, { color: theme.text }]}>
                  {insight.title}
                </Text>
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
  safe: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 16 },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  trendLabel: { fontSize: 11 },
  insightsSection: { gap: 8 },
  insightCard: { gap: 4 },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});
