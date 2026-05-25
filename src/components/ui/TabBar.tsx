import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, useColorSchemeValue } from '@/src/hooks/useTheme';
// Inline type to avoid @react-navigation/bottom-tabs dependency
interface BottomTabBarProps {
  state: { routes: { key: string; name: string }[]; index: number };
  descriptors: Record<string, unknown>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  exercises: 'fitness-outline',
  progress: 'trending-up-outline',
  settings: 'settings-outline',
};

const TAB_ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  exercises: 'fitness',
  progress: 'trending-up',
  settings: 'settings',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  exercises: 'Exercises',
  progress: 'Progress',
  settings: 'Settings',
};

function TabIcon({
  routeName,
  focused,
  color,
}: {
  routeName: string;
  focused: boolean;
  color: string;
}) {
  const scale = useSharedValue(focused ? 1.15 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { duration: 200 });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = focused
    ? TAB_ICONS_ACTIVE[routeName] ?? TAB_ICONS[routeName]
    : TAB_ICONS[routeName];

  return (
    <Animated.View style={animStyle}>
      <Ionicons name={iconName ?? 'help-outline'} size={24} color={color} />
    </Animated.View>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const scheme = useColorSchemeValue();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (routeName: string, routeKey: string, focused: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  const barContent = (
    <View style={[styles.tabRow, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? theme.primary : theme.textSecondary;
        const label = TAB_LABELS[route.name] ?? route.name;

        return (
          <Pressable
            key={route.key}
            onPress={() => handlePress(route.name, route.key, focused)}
            style={styles.tab}
          >
            <TabIcon routeName={route.name} focused={focused} color={color} />
            <Text
              style={[
                styles.label,
                { color, fontWeight: focused ? '600' : '400' },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[styles.container, { borderTopColor: theme.border }]}
      >
        {barContent}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      ]}
    >
      {barContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
  },
});

export default TabBar;
