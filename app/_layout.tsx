import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { useFonts } from '@expo-google-fonts/outfit/useFonts';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { UserProvider, useUserContext } from '@/src/contexts/UserContext';
import { ExerciseProvider } from '@/src/contexts/ExerciseContext';
import { SubscriptionProvider } from '@/src/contexts/SubscriptionContext';
import { AppErrorBoundary } from '@/src/components/ErrorBoundary';
import { setupNotifications } from '@/src/utils/notifications';
import { useEmailSequence } from '@/src/hooks/useEmailSequence';

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

  // ── Email sequences (fire-and-forget on every app open) ──
  useEmailSequence();

  // ── Handle notification taps ──
  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        const route = data?.route;
        if (typeof route === 'string') {
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
      <Stack.Screen name="sources" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_700Bold,
    Outfit_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  // Keep splash visible until fonts load (or fail — app works with system fonts)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Splash hidden later by RootNavigator after data check
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts resolved (loaded or errored)
  if (!fontsLoaded && !fontError) return null;

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
