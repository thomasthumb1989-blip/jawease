import { useSubscriptionContext } from '@/src/contexts/SubscriptionContext';

export function useSubscription() {
  const { status, isPremium, loading, restore } = useSubscriptionContext();

  const purchase = async () => {
    // TODO: RevenueCat purchase flow
    // const offerings = await Purchases.getOfferings();
    // await Purchases.purchasePackage(offerings.current.availablePackages[0]);
  };

  return { status, isPremium, loading, restore, purchase };
}
