import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '@/src/types';
import { getItem, setItem, KEYS } from '@/src/utils/storage';

interface UserState {
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserState>({
  profile: null,
  updateProfile: async () => {},
  onboardingComplete: false,
  setOnboardingComplete: async () => {},
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingComplete, setOnboardingDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [savedProfile, savedOnboarding] = await Promise.all([
        getItem<UserProfile>(KEYS.USER_PROFILE),
        getItem<boolean>(KEYS.ONBOARDING_COMPLETE),
      ]);
      if (savedProfile) setProfile(savedProfile);
      if (savedOnboarding) setOnboardingDone(true);
      setLoading(false);
    })();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates } as UserProfile;
    setProfile(updated);
    await setItem(KEYS.USER_PROFILE, updated);
  };

  const setOnboardingComplete = async (complete: boolean) => {
    setOnboardingDone(complete);
    await setItem(KEYS.ONBOARDING_COMPLETE, complete);
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        updateProfile,
        onboardingComplete,
        setOnboardingComplete,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
