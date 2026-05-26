export const Config = {
  revenueCat: {
    iosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
    androidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  },
  resend: {
    apiKey: process.env.EXPO_PUBLIC_RESEND_API_KEY ?? '',
    audienceId: process.env.EXPO_PUBLIC_RESEND_AUDIENCE_ID ?? '',
  },
  store: {
    iosAppId: process.env.EXPO_PUBLIC_IOS_APP_ID ?? '',
    androidPackage: 'uk.karamafandi.jawease',
  },
} as const;
