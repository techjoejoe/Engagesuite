'use client';

import { useState, useEffect } from 'react';
import { getSubscription, getEffectiveTier, getTrialDaysRemaining, Subscription, SubscriptionTier } from './subscription';

export function useSubscription(uid: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [trialDays, setTrialDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const loadSub = async () => {
      const sub = await getSubscription(uid);
      setSubscription(sub);
      setTier(getEffectiveTier(sub));
      setTrialDays(getTrialDaysRemaining(sub));
      setLoading(false);
    };

    loadSub();
  }, [uid]);

  return { subscription, tier, trialDays, loading };
}
