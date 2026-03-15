// Subscription & Tier Management
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'unlimited';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  trialEndsAt?: number | null;
  currentPeriodEnd?: number | null;
  createdAt: number;
  updatedAt: number;
}

// Tier limits configuration
export const TIER_LIMITS: Record<SubscriptionTier, {
  maxClasses: number;
  maxStudentsPerClass: number;
  tools: string[];
  label: string;
  price: string;
}> = {
  free: {
    maxClasses: 0,
    maxStudentsPerClass: 0,
    tools: [],
    label: 'Free (Student)',
    price: 'Free',
  },
  starter: {
    maxClasses: 1,
    maxStudentsPerClass: 15,
    tools: ['quizbattle', 'poll'],
    label: 'Starter',
    price: '$9.99/mo',
  },
  pro: {
    maxClasses: 3,
    maxStudentsPerClass: 30,
    tools: ['quizbattle', 'poll', 'wordstorm', 'tickr', 'picpick'],
    label: 'Pro',
    price: '$15/mo',
  },
  unlimited: {
    maxClasses: 999,
    maxStudentsPerClass: 999,
    tools: ['quizbattle', 'poll', 'wordstorm', 'tickr', 'picpick', 'buzzer', 'randomizer', 'commitment', 'coin', 'dice', 'badges', 'design'],
    label: 'Unlimited',
    price: '$20/mo',
  },
};

// Get user subscription
export async function getSubscription(uid: string): Promise<Subscription | null> {
  try {
    const subRef = doc(db, 'subscriptions', uid);
    const subSnap = await getDoc(subRef);
    if (!subSnap.exists()) return null;
    return subSnap.data() as Subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

// Create trial subscription for new trainers
export async function createTrialSubscription(uid: string): Promise<Subscription> {
  const trialDays = 14;
  const sub: Subscription = {
    tier: 'pro',
    status: 'trialing',
    trialEndsAt: Date.now() + (trialDays * 24 * 60 * 60 * 1000),
    currentPeriodEnd: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'subscriptions', uid), sub);
  return sub;
}

// Update subscription from Stripe webhook
export async function updateSubscription(uid: string, data: Partial<Subscription>): Promise<void> {
  const subRef = doc(db, 'subscriptions', uid);
  await setDoc(subRef, { ...data, updatedAt: Date.now() }, { merge: true });
}

// Get effective tier (checks trial expiry)
export function getEffectiveTier(sub: Subscription | null): SubscriptionTier {
  if (!sub) return 'free';

  if (sub.status === 'trialing') {
    if (sub.trialEndsAt && Date.now() > sub.trialEndsAt) {
      return 'free'; // Trial expired
    }
    return sub.tier;
  }

  if (sub.status === 'active') return sub.tier;
  if (sub.status === 'past_due') return sub.tier; // Grace period

  return 'free';
}

// Check if user can create more classes
export function canCreateClass(tier: SubscriptionTier, currentClassCount: number): boolean {
  return currentClassCount < TIER_LIMITS[tier].maxClasses;
}

// Check if tool is available for tier
export function isToolAvailable(tier: SubscriptionTier, toolName: string): boolean {
  if (tier === 'unlimited') return true;
  return TIER_LIMITS[tier].tools.includes(toolName);
}

// Get days remaining in trial
export function getTrialDaysRemaining(sub: Subscription | null): number {
  if (!sub || sub.status !== 'trialing' || !sub.trialEndsAt) return 0;
  const remaining = sub.trialEndsAt - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
