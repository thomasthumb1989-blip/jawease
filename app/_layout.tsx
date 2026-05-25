import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { UserProvider } from '@/src/contexts/UserContext';
import { ExerciseProvider } from '@/src/contexts/ExerciseContext';
import { SubscriptionProvider } from '@/src/contexts/SubscriptionContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SubscriptionProvider>
      <UserProvider>
        <ExerciseProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="exercise-flow/[id]"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="pain-log"
              options={{ presentation: 'modal' }}
            />
          </Stack>
        </ExerciseProvider>
      </UserProvider>
    </SubscriptionProvider>
  );
}
