import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { UserProvider, useUserContext } from '@/src/contexts/UserContext';
import { ExerciseProvider } from '@/src/contexts/ExerciseContext';
import { SubscriptionProvider } from '@/src/contexts/SubscriptionContext';
import { AppErrorBoundary } from '@/src/components/ErrorBoundary';
import { setupNotifications } from '@/src/utils/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { onboardingComplete, loading } = useUserContext();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ── Notification setup (once) ──
  useEffect(() => {
    setupNotifications();
  }, []);

  // ── Handle notification taps ──
  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        const route = data?.route;
        if (typeof route === 'string') {
          // Small delay so navigation stack is ready
          setTimeout(() => router.push(route as never), 300);
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, [router]);

  // ── Auth routing ──
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
    <AppErrorBoundary>
      <SubscriptionProvider>
        <UserProvider>
          <ExerciseProvider>
            <RootNavigator />
          </ExerciseProvider>
        </UserProvider>
      </SubscriptionProvider>
    </AppErrorBoundary>
  );
}
