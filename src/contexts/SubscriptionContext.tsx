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
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  status: 'loading',
  isPremium: false,
  loading: true,
  error: null,
  offerings: null,
  purchase: async () => false,
  restore: async () => false,
  refresh: async () => {},
});

// ─── Provider ────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const configured = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Init / refresh RevenueCat ──
  // Callable so the paywall can retry a failed fetch. Resolves only once the
  // fetch has settled, so callers can await it to gate a retry button.
  const refresh = useCallback(async (): Promise<void> => {
    // Clear any prior error first, or a stale message survives a successful
    // retry and the user is told it failed when it did not.
    setError(null);
    setLoading(true);

    const apiKey = Platform.select({
      ios: Config.revenueCat.iosKey,
      android: Config.revenueCat.androidKey,
      default: '',
    }) as string;

    // Guard: no key → preview mode (never crash)
    if (!apiKey) {
      // Web-only: allow localStorage override for dev/screenshots
      if (Platform.OS === 'web') {
        try {
          const override = window.localStorage.getItem('jawease_subscription_override');
          if (override === 'active' || override === 'trial') {
            if (mounted.current) {
              setStatus(override as SubscriptionStatus);
              setLoading(false);
            }
            return;
          }
        } catch { /* ignore */ }
      }
      if (mounted.current) {
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
      const [info, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      if (!mounted.current) return;
      setStatus(statusFromCustomerInfo(info));
      const offering = offerings.all["jawease_pro"] || offerings.current;
      setOfferings({ ...offerings, current: offering });
    } catch (e: unknown) {
      if (!mounted.current) return;
      // RevenueCat failed → app still works in preview mode
      setStatus('preview');
      setError(e instanceof Error ? e.message : 'RevenueCat init failed');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      value={{ status, isPremium, loading, error, offerings, purchase, restore, refresh }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  return useContext(SubscriptionContext);
}
