import { useSubscriptionContext } from '@/src/contexts/SubscriptionContext';

export function useSubscription() {
  return useSubscriptionContext();
}
