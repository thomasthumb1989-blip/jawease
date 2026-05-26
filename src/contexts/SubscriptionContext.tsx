import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type PurchasesOfferings,
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';
import { Config } from '@/src/constants/config';
import type { SubscriptionStatus } from '@/src/types';

// ─── Helpers ─────────────────────────────────────────────
function statusFromCustomerInfo(info: CustomerInfo): SubscriptionStatus {
  const pro = info.entitlements.active['pro'];
  if (!pro) return 'preview';
  // isActive covers trial + paid
  if (pro.periodType === 'TRIAL') return 'trial';
  if (pro.isActive) return 'active';
  return 'expired';
}

// ─── Context shape ───────────────────────────────────────
interface SubscriptionState {
  status: SubscriptionStatus;
  isPremium: boolean;
  loading: boolean;
  error: string | null;
  offerings: PurchasesOfferings | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  status: 'loading',
  isPremium: false,
  loading: true,
  error: null,
  offerings: null,
  purchase: async () => false,
  restore: async () => false,
});

// ─── Provider ────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const configured = useRef(false);

  // ── Init RevenueCat ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const apiKey = Platform.select({
        ios: Config.revenueCat.iosKey,
        android: Config.revenueCat.androidKey,
        default: '',
      }) as string;

      // Guard: no key → preview mode (never crash)
      if (!apiKey) {
        if (!cancelled) {
          setStatus('preview');
          setLoading(false);
        }
        return;
      }

      try {
        if (!configured.current) {
          Purchases.configure({ apiKey });
          configured.current = true;
        }

        // Fetch initial state in parallel
        const [info, offers] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);

        if (cancelled) return;
        setStatus(statusFromCustomerInfo(info));
        setOfferings(offers);
      } catch (e: unknown) {
        if (cancelled) return;
        // RevenueCat failed → app still works in preview mode
        setStatus('preview');
        setError(e instanceof Error ? e.message : 'RevenueCat init failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Listen for customer info changes ──
  useEffect(() => {
    if (!configured.current) return;

    const listener = (info: CustomerInfo) => {
      setStatus(statusFromCustomerInfo(info));
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [loading]); // re-attach after init completes

  // ── Purchase ──
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      setError(null);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setStatus(statusFromCustomerInfo(customerInfo));
      return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    } catch (e: unknown) {
      // User cancelled = not an error
      const err = e as { userCancelled?: boolean; message?: string };
      if (err.userCancelled) return false;
      setError(err.message ?? 'Purchase failed');
      return false;
    }
  }, []);

  // ── Restore ──
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const info = await Purchases.restorePurchases();
      setStatus(statusFromCustomerInfo(info));
      return typeof info.entitlements.active['pro'] !== 'undefined';
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Restore failed');
      return false;
    }
  }, []);

  const isPremium = status === 'trial' || status === 'active';

  return (
    <SubscriptionContext.Provider
      value={{ status, isPremium, loading, error, offerings, purchase, restore }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  return useContext(SubscriptionContext);
}
