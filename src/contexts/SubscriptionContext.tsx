import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SubscriptionStatus } from '@/src/types';

interface SubscriptionState {
  status: SubscriptionStatus;
  isPremium: boolean;
  loading: boolean;
  restore: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  status: 'free',
  isPremium: false,
  loading: true,
  restore: async () => {},
});

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Initialize RevenueCat and check subscription status
    // Purchases.configure({ apiKey: Config.revenueCat.iosKey });
    setLoading(false);
  }, []);

  const restore = async () => {
    // TODO: Purchases.restorePurchases()
  };

  return (
    <SubscriptionContext.Provider
      value={{
        status,
        isPremium: status === 'premium' || status === 'trial',
        loading,
        restore,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  return useContext(SubscriptionContext);
}
