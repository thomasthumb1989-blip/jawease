// Analytics stub — plug in PostHog, Amplitude, or similar later
type EventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'exercise_started'
  | 'exercise_completed'
  | 'pain_logged'
  | 'paywall_shown'
  | 'paywall_purchased'
  | 'paywall_dismissed'
  | 'streak_milestone';

type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(
  _name: EventName,
  _properties?: EventProperties
): void {
  // no-op until analytics SDK is configured
}

export function identifyUser(_userId: string): void {
  // no-op
}

export function resetUser(): void {
  // no-op
}
