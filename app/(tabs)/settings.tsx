import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  Switch,
  Alert,
  Linking,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/hooks/useTheme';
import { Strings } from '@/src/constants/strings';
import { Config } from '@/src/constants/config';
import {
  Heading,
  BodyText,
  Card,
  GlassCard,
  Caption,
  Button,
} from '@/src/components/ui';
import { useUserContext } from '@/src/contexts/UserContext';
import { useSubscription } from '@/src/hooks/useSubscription';
import { useExerciseContext } from '@/src/contexts/ExerciseContext';
import { usePainLog } from '@/src/hooks/usePainLog';
import { useStreak } from '@/src/hooks/useStreak';
import { useInsights } from '@/src/hooks/useInsights';
import {
  scheduleDailyReminder,
  schedulePainCheckIn,
  cancelNotificationsByType,
} from '@/src/utils/notifications';
import { generateReport } from '@/src/utils/report';
import type { Symptom, Difficulty } from '@/src/types';

const PRIVACY_URL =
  'https://thomasthumb1989-blip.github.io/jawease/privacy.html';
const TERMS_URL =
  'https://thomasthumb1989-blip.github.io/jawease/terms.html';

const symptomKeys = Object.keys(Strings.symptoms) as Symptom[];

// ─── FadeIn ───────────────────────────────────────────────
function FadeIn({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 20, stiffness: 150 }),
    );
  }, [delay, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Segmented Control ────────────────────────────────────
function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.segRow, { backgroundColor: theme.border + '30' }]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(opt.value);
            }}
            style={[
              styles.segOption,
              selected && { backgroundColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.segText,
                { color: selected ? '#FFFFFF' : theme.text },
                selected && { fontWeight: '600' },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Setting Row (pressable with chevron) ─────────────────
function SettingRow({
  label,
  value,
  onPress,
  isLast,
  caption,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  caption?: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
      style={[
        styles.settingRow,
        !isLast && [styles.settingRowBorder, { borderBottomColor: theme.border }],
      ]}
    >
      <View style={styles.settingRowLeft}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {label}
        </Text>
        {caption && <Caption muted>{caption}</Caption>}
      </View>
      {value && (
        <Text style={[styles.settingValue, { color: theme.textMuted }]}>
          {value}
        </Text>
      )}
      {onPress && !value && (
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      )}
    </Pressable>
  );
}

// ─── Toggle Row ───────────────────────────────────────────
function ToggleRow({
  label,
  value,
  onChange,
  isLast,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.settingRow,
        !isLast && [styles.settingRowBorder, { borderBottomColor: theme.border }],
      ]}
    >
      <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(v);
        }}
        trackColor={{ true: theme.primary, false: theme.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

// ─── Symptom Edit Modal ───────────────────────────────────
function SymptomPill({
  symptom,
  selected,
  onToggle,
}: {
  symptom: Symptom;
  selected: boolean;
  onToggle: (s: Symptom) => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 300 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 80);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(symptom);
  }, [symptom, onToggle, scale]);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.symptomChip,
          {
            borderColor: selected ? theme.primary : theme.border,
            backgroundColor: selected ? theme.primary : theme.card,
          },
        ]}
      >
        {selected && <Text style={styles.checkmark}>✓</Text>}
        <Text
          style={[
            styles.symptomText,
            { color: selected ? '#FFFFFF' : theme.text },
            selected && { fontWeight: '600' },
          ]}
        >
          {Strings.symptoms[symptom]}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function SymptomModal({
  visible,
  current,
  onSave,
  onClose,
}: {
  visible: boolean;
  current: Symptom[];
  onSave: (symptoms: Symptom[]) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<Symptom[]>(current);

  useEffect(() => {
    if (visible) setSelected(current);
  }, [visible, current]);

  const toggle = useCallback((s: Symptom) => {
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Heading level={2}>{Strings.settings.editSymptoms}</Heading>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </Pressable>
          </View>

          <View style={styles.symptomGrid}>
            {symptomKeys.map((key) => (
              <SymptomPill
                key={key}
                symptom={key}
                selected={selected.includes(key)}
                onToggle={toggle}
              />
            ))}
          </View>

          <Button
            title={Strings.common.save}
            onPress={() => {
              onSave(selected);
              onClose();
            }}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const theme = useTheme();
  const S = Strings.settings;

  const labelMap: Record<string, string> = {
    free: S.statusFree,
    trial: S.statusTrial,
    premium: S.statusPremium,
    active: S.statusActive,
    expired: S.statusExpired,
    preview: S.statusPreview,
    loading: S.statusLoading,
  };

  const colorMap: Record<string, string> = {
    free: theme.textMuted,
    trial: theme.accent,
    premium: theme.success,
    active: theme.success,
    expired: theme.error,
    preview: theme.textMuted,
    loading: theme.textMuted,
  };

  const bg = (colorMap[status] ?? theme.textMuted) + '20';
  const fg = colorMap[status] ?? theme.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>
        {labelMap[status] ?? status}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, updateProfile, setOnboardingComplete } = useUserContext();
  const { status, isPremium, restore } = useSubscription();
  const { sessions } = useExerciseContext();
  const { logs: painLogs } = usePainLog();
  const { currentStreak } = useStreak();
  const insights = useInsights();
  const S = Strings.settings;

  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Preference values with defaults
  const difficulty = profile?.difficulty ?? 'easy';
  const sessionLength = profile?.sessionLength ?? 8;
  const restDuration = profile?.restDuration ?? 15;
  const audioCues = profile?.audioCues ?? true;
  const hapticFeedback = profile?.hapticFeedback ?? true;
  const reminderEnabled = profile?.reminderEnabled ?? false;
  const painReminderEnabled = profile?.painReminderEnabled ?? false;

  // Map difficulty to segmented control values
  const diffOptions: { label: string; value: Difficulty }[] = [
    { label: S.difficultyGentle, value: 'easy' },
    { label: S.difficultyModerate, value: 'moderate' },
    { label: S.difficultyIntensive, value: 'challenging' },
  ];

  const sessionOptions = [
    { label: '5 min', value: 5 },
    { label: '8 min', value: 8 },
    { label: '12 min', value: 12 },
  ];

  const restOptions = [
    { label: S.restNone, value: 0 },
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
  ];

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await restore();
    setRestoring(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(S.restoreSuccess);
    } else {
      Alert.alert(S.restoreNone, S.restoreNoneMessage);
    }
  }, [restore]);

  const handleClearData = useCallback(() => {
    Alert.alert(S.clearDataTitle, S.clearDataMessage, [
      { text: S.clearDataCancel, style: 'cancel' },
      {
        text: S.clearDataConfirm,
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          await setOnboardingComplete(false);
          router.replace('/onboarding');
        },
      },
    ]);
  }, [setOnboardingComplete, router]);

  const handleSaveSymptoms = useCallback(
    (symptoms: Symptom[]) => {
      updateProfile({ symptoms });
    },
    [updateProfile],
  );

  // Check if user has been using app > 7 days
  const showRateApp = useMemo(() => {
    if (!profile?.createdAt) return false;
    const daysSince =
      (Date.now() - new Date(profile.createdAt).getTime()) / 86_400_000;
    return daysSince >= 7;
  }, [profile]);

  const subscriptionUrl = Platform.select({
    ios: 'https://apps.apple.com/account/subscriptions',
    android:
      'https://play.google.com/store/account/subscriptions',
    default: '',
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <Heading>{S.heading}</Heading>

        {/* ── 1. Profile ── */}
        <FadeIn delay={0}>
          <GlassCard>
            {profile?.email && (
              <Caption muted style={{ marginBottom: 8 }}>
                {profile.email}
              </Caption>
            )}

            {profile?.symptoms && profile.symptoms.length > 0 && (
              <View style={styles.symptomTags}>
                {profile.symptoms.map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.miniPill,
                      { backgroundColor: theme.border + '40' },
                    ]}
                  >
                    <Text
                      style={[styles.miniPillText, { color: theme.textSecondary }]}
                    >
                      {Strings.symptoms[s]}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSymptomModalOpen(true);
              }}
              style={styles.editLink}
            >
              <Text style={[styles.editLinkText, { color: theme.primary }]}>
                {S.editSymptoms}
              </Text>
            </Pressable>
          </GlassCard>
        </FadeIn>

        {/* ── 2. Routine Preferences ── */}
        <FadeIn delay={100}>
          <Heading level={3}>{S.routine}</Heading>
          <Card>
            <Text style={[styles.prefLabel, { color: theme.text }]}>
              {S.difficulty}
            </Text>
            <SegmentedControl
              options={diffOptions}
              value={difficulty}
              onChange={(v) => updateProfile({ difficulty: v })}
            />

            <Text style={[styles.prefLabel, { color: theme.text, marginTop: 16 }]}>
              {S.sessionLength}
            </Text>
            <SegmentedControl
              options={sessionOptions}
              value={sessionLength}
              onChange={(v) => updateProfile({ sessionLength: v })}
            />

            <Text style={[styles.prefLabel, { color: theme.text, marginTop: 16 }]}>
              {S.restBetween}
            </Text>
            <SegmentedControl
              options={restOptions}
              value={restDuration}
              onChange={(v) => updateProfile({ restDuration: v })}
            />
          </Card>
        </FadeIn>

        {/* ── 3. Experience ── */}
        <FadeIn delay={200}>
          <Heading level={3}>{S.experience}</Heading>
          <Card>
            <ToggleRow
              label={S.audioCues}
              value={audioCues}
              onChange={(v) => updateProfile({ audioCues: v })}
            />
            <ToggleRow
              label={S.hapticFeedback}
              value={hapticFeedback}
              onChange={(v) => updateProfile({ hapticFeedback: v })}
              isLast
            />
          </Card>
        </FadeIn>

        {/* ── 4. Reminders ── */}
        <FadeIn delay={300}>
          <Heading level={3}>{S.reminders}</Heading>
          <Card>
            <ToggleRow
              label={S.dailyReminder}
              value={reminderEnabled}
              onChange={async (v) => {
                updateProfile({ reminderEnabled: v });
                if (v) {
                  // Default 8 AM reminder
                  const t = profile?.reminderTime
                    ? new Date(`2000-01-01T${profile.reminderTime}`)
                    : new Date(2000, 0, 1, 8, 0);
                  await scheduleDailyReminder(t);
                } else {
                  await cancelNotificationsByType('exercise_reminder');
                }
              }}
            />
            <ToggleRow
              label={S.painReminder}
              value={painReminderEnabled}
              onChange={async (v) => {
                updateProfile({ painReminderEnabled: v });
                if (v) {
                  await schedulePainCheckIn(true, true);
                } else {
                  await cancelNotificationsByType('pain_checkin');
                }
              }}
              isLast
            />
          </Card>
        </FadeIn>

        {/* ── 5. Data ── */}
        <FadeIn delay={400}>
          <Heading level={3}>{S.yourData}</Heading>
          <Card>
            <SettingRow
              label={S.exportReport}
              value={exporting ? '...' : undefined}
              onPress={async () => {
                setExporting(true);
                try {
                  const html = generateReport({
                    painLogs,
                    sessions,
                    insights,
                    symptoms: profile?.symptoms ?? [],
                    streakDays: currentStreak,
                  });
                  const { uri } = await Print.printToFileAsync({ html });
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: S.shareReportTitle,
                    UTI: 'com.adobe.pdf',
                  });
                } catch {
                  Alert.alert(S.exportFailed, S.exportFailedMessage);
                } finally {
                  setExporting(false);
                }
              }}
            />
            <SettingRow
              label={S.clearData}
              onPress={handleClearData}
              isLast
            />
          </Card>
        </FadeIn>

        {/* ── 6. Subscription ── */}
        <FadeIn delay={500}>
          <Heading level={3}>{S.subscription}</Heading>
          <Card>
            <View style={[styles.subStatusRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {S.statusLabel}
              </Text>
              <StatusBadge status={status} />
            </View>

            <SettingRow
              label={S.manageSubscription}
              onPress={() => {
                if (subscriptionUrl) Linking.openURL(subscriptionUrl);
              }}
            />
            <SettingRow
              label={S.restorePurchases}
              value={restoring ? '...' : undefined}
              onPress={handleRestore}
              isLast={isPremium || status === 'trial'}
            />

            {!isPremium && status !== 'trial' && (
              <View style={styles.upgradeBlock}>
                <Button
                  title={S.upgradeToPro}
                  onPress={() => router.push('/paywall?mode=upgrade')}
                  variant="accent"
                />
              </View>
            )}
          </Card>
        </FadeIn>

        {/* ── 7. Legal ── */}
        <FadeIn delay={600}>
          <Heading level={3}>{S.legal}</Heading>
          <Card>
            <SettingRow
              label={Strings.disclaimer.title}
              onPress={() =>
                Alert.alert(Strings.disclaimer.title, Strings.disclaimer.body, [
                  { text: 'OK' },
                ])
              }
            />
            <SettingRow
              label={Strings.disclaimer.sourcesTitle}
              onPress={() => router.push('/sources')}
            />
            <SettingRow
              label={S.privacyPolicy}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            />
            <SettingRow
              label={S.termsOfService}
              onPress={() => Linking.openURL(TERMS_URL)}
              isLast
            />
          </Card>
        </FadeIn>

        {/* ── 8. App Info ── */}
        <FadeIn delay={700}>
          <View style={styles.appInfo}>
            <Caption muted>{S.version}</Caption>
            <Caption muted>{S.madeWith}</Caption>
            {showRateApp && (Config.store.iosAppId || Platform.OS === 'android') && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const storeUrl = Platform.select({
                    ios: Config.store.iosAppId
                      ? `https://apps.apple.com/app/jawease/id${Config.store.iosAppId}`
                      : '',
                    android: `https://play.google.com/store/apps/details?id=${Config.store.androidPackage}`,
                    default: '',
                  });
                  if (storeUrl) Linking.openURL(storeUrl);
                }}
              >
                <Text style={[styles.rateText, { color: theme.primary }]}>
                  {S.rateApp}
                </Text>
              </Pressable>
            )}
          </View>
        </FadeIn>
      </ScrollView>

      {/* Symptom Edit Modal */}
      <SymptomModal
        visible={symptomModalOpen}
        current={profile?.symptoms ?? []}
        onSave={handleSaveSymptoms}
        onClose={() => setSymptomModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },

  // Segmented Control
  segRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segText: { fontSize: 14 },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRowLeft: { flex: 1, gap: 2 },
  settingLabel: { fontSize: 16 },
  settingValue: { fontSize: 16 },

  // Pref labels
  prefLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },

  // Profile
  symptomTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  miniPillText: { fontSize: 12, fontWeight: '500' },
  editLink: { marginTop: 10 },
  editLinkText: { fontSize: 14, fontWeight: '600' },

  // Subscription
  subStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  upgradeBlock: { marginTop: 12 },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  checkmark: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  symptomText: { fontSize: 15 },

  // App Info
  appInfo: { alignItems: 'center', gap: 6, marginTop: 8 },
  rateText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
});
