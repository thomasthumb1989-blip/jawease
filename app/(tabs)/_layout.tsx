import { Tabs } from 'expo-router';
import { TabBar } from '@/src/components/ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...(props as Parameters<typeof TabBar>[0])} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="exercises" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
