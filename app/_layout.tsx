import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { UserProvider, useUserContext } from '@/src/contexts/UserContext';
import { ExerciseProvider } from '@/src/contexts/ExerciseContext';
import { SubscriptionProvider } from '@/src/contexts/SubscriptionContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { onboardingComplete, loading } = useUserContext();

  useEffect(() => {
    if (loading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingComplete && inOnboarding) {
      router.replace('/(tabs)');
    }

    SplashScreen.hideAsync();
  }, [onboardingComplete, loading, segments, router]);

  return (
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
  );
}

export default function RootLayout() {
  return (
    <SubscriptionProvider>
      <UserProvider>
        <ExerciseProvider>
          <RootNavigator />
        </ExerciseProvider>
      </UserProvider>
    </SubscriptionProvider>
  );
}
