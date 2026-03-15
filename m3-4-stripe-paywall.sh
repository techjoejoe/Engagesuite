#!/bin/bash
# ================================================================
# M3.4: Paywall & Stripe Integration
# Run in Codespace: bash m3-4-stripe-paywall.sh
#
# PREREQUISITES:
# 1. Create Stripe account at https://stripe.com
# 2. Get API keys from Stripe Dashboard > Developers > API keys
# 3. Create 3 products/prices in Stripe (see instructions at end)
# 4. Add keys to .env.local (script will prompt)
# ================================================================

set -e
cd /workspaces/Engagesuite

echo "=========================================="
echo "M3.4: Paywall & Stripe Integration"
echo "=========================================="

# ------------------------------------------------
# 0. INSTALL STRIPE
# ------------------------------------------------
echo "[0/8] Installing Stripe SDK..."
npm install stripe --save
echo "  Stripe installed"

# ------------------------------------------------
# 1. CREATE lib/subscription.ts
# ------------------------------------------------
echo "[1/8] Creating lib/subscription.ts..."

cat > lib/subscription.ts << 'SUBEOF'
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
SUBEOF

echo "  Created lib/subscription.ts"

# ------------------------------------------------
# 2. CREATE Pricing Page
# ------------------------------------------------
echo "[2/8] Creating pricing page..."
mkdir -p app/pricing

cat > app/pricing/page.tsx << 'PRICEEOF'
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { getSubscription, getEffectiveTier, SubscriptionTier, TIER_LIMITS } from '@/lib/subscription';
import { User } from 'firebase/auth';

const TIERS = [
  {
    id: 'starter' as SubscriptionTier,
    name: 'Starter',
    price: '$9.99',
    period: '/month',
    description: 'Perfect for trying out training tools',
    features: [
      '1 class',
      'Up to 15 students per class',
      '2 tools (QuizBattle + Live Vote)',
      'Basic support',
    ],
    cta: 'Start Starter',
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/5',
    popular: false,
  },
  {
    id: 'pro' as SubscriptionTier,
    name: 'Pro',
    price: '$15',
    period: '/month',
    description: 'For active trainers running regular sessions',
    features: [
      '3 classes',
      'Up to 30 students per class',
      '5 tools (QB, Vote, WordStorm, Tickr, PicPick)',
      'Designer Studio (workbooks)',
      'Basic analytics',
      '14-day free trial',
    ],
    cta: 'Start Free Trial',
    color: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/5',
    popular: true,
  },
  {
    id: 'unlimited' as SubscriptionTier,
    name: 'Unlimited',
    price: '$20',
    period: '/month',
    description: 'For training companies and power users',
    features: [
      'Unlimited classes',
      'Unlimited students',
      'All tools unlocked',
      'Full analytics dashboard',
      'Priority support',
      'Admin code management',
    ],
    cta: 'Go Unlimited',
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/5',
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const sub = await getSubscription(currentUser.uid);
        setCurrentTier(getEffectiveTier(sub));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = async (tierId: SubscriptionTier) => {
    if (!user) {
      router.push('/signup');
      return;
    }

    setCheckoutLoading(tierId);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, uid: user.uid, email: user.email }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">🚀</div>
            <span className="text-lg font-bold text-white">Trainer-Toolbox</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Start with a free trial. Upgrade when you need more tools and students.
          </p>

          {currentTier !== 'free' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
              <span className="text-indigo-300 text-sm">Current plan: <strong>{TIER_LIMITS[currentTier].label}</strong></span>
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
              >
                Manage Subscription
              </button>
            </div>
          )}
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => {
            const isCurrentTier = currentTier === tier.id;
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border p-8 transition-all ${
                  tier.popular
                    ? `${tier.borderColor} ${tier.bgColor} shadow-lg shadow-indigo-500/10`
                    : 'border-white/10 bg-white/5'
                } ${isCurrentTier ? 'ring-2 ring-green-500/50' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-bold text-green-400">
                    Current Plan
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-white/40 text-sm">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-white/40">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isCurrentTier || checkoutLoading !== null}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isCurrentTier
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                      : tier.popular
                      ? `bg-gradient-to-r ${tier.color} text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5`
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {checkoutLoading === tier.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Processing...
                    </span>
                  ) : isCurrentTier ? 'Current Plan' : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ / Footer */}
        <div className="text-center pb-8">
          <p className="text-white/30 text-sm">
            All plans include a 14-day money-back guarantee.{' '}
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300">Back to Dashboard</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
PRICEEOF

echo "  Created app/pricing/page.tsx"

# ------------------------------------------------
# 3. CREATE Stripe Checkout API Route
# ------------------------------------------------
echo "[3/8] Creating Stripe API routes..."
mkdir -p app/api/stripe/checkout
mkdir -p app/api/stripe/webhook
mkdir -p app/api/stripe/portal

cat > app/api/stripe/checkout/route.ts << 'CHECKOUTEOF'
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

// Map tiers to Stripe Price IDs (set these in .env.local)
const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  unlimited: process.env.STRIPE_PRICE_UNLIMITED || '',
};

export async function POST(req: NextRequest) {
  try {
    const { tier, uid, email } = await req.json();

    if (!tier || !uid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://quiz2-1a35d.firebaseapp.com';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success&tier=${tier}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      customer_email: email,
      metadata: { uid, tier },
      subscription_data: {
        metadata: { uid, tier },
      },
    };

    // Add trial for Pro tier
    if (tier === 'pro') {
      sessionParams.subscription_data!.trial_period_days = 14;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
CHECKOUTEOF

echo "  Created app/api/stripe/checkout/route.ts"

# ------------------------------------------------
# 4. CREATE Stripe Webhook API Route
# ------------------------------------------------
echo "[4/8] Creating webhook route..."

cat > app/api/stripe/webhook/route.ts << 'WEBHOOKEOF'
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

// Initialize Firebase Admin (server-side)
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'quiz2-1a35d',
  });
}
const adminDb = getFirestore();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        const tier = session.metadata?.tier;

        if (uid && tier) {
          await adminDb.collection('subscriptions').doc(uid).set({
            tier,
            status: session.subscription ? 'active' : 'active',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            currentPeriodEnd: null, // Will be set by subscription.updated
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata?.uid;
        const tier = subscription.metadata?.tier;

        if (uid) {
          const status = subscription.status === 'trialing' ? 'trialing' :
                         subscription.status === 'active' ? 'active' :
                         subscription.status === 'past_due' ? 'past_due' : 'canceled';

          await adminDb.collection('subscriptions').doc(uid).set({
            tier: tier || 'starter',
            status,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: subscription.current_period_end * 1000,
            trialEndsAt: subscription.trial_end ? subscription.trial_end * 1000 : null,
            updatedAt: Date.now(),
          }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata?.uid;

        if (uid) {
          await adminDb.collection('subscriptions').doc(uid).set({
            tier: 'free',
            status: 'canceled',
            currentPeriodEnd: null,
            updatedAt: Date.now(),
          }, { merge: true });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const uid = sub.metadata?.uid;
          if (uid) {
            await adminDb.collection('subscriptions').doc(uid).set({
              status: 'past_due',
              updatedAt: Date.now(),
            }, { merge: true });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
WEBHOOKEOF

echo "  Created app/api/stripe/webhook/route.ts"

# ------------------------------------------------
# 5. CREATE Stripe Customer Portal Route
# ------------------------------------------------
echo "[5/8] Creating portal route..."

cat > app/api/stripe/portal/route.ts << 'PORTALEOF'
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

if (!getApps().length) {
  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'quiz2-1a35d' });
}
const adminDb = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Get customer ID from subscription doc
    const subDoc = await adminDb.collection('subscriptions').doc(uid).get();
    const customerId = subDoc.data()?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const origin = req.headers.get('origin') || 'https://quiz2-1a35d.firebaseapp.com';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId as string,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
PORTALEOF

echo "  Created app/api/stripe/portal/route.ts"

# ------------------------------------------------
# 6. CREATE useSubscription hook
# ------------------------------------------------
echo "[6/8] Creating useSubscription hook..."

cat > lib/useSubscription.ts << 'HOOKEOF'
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
HOOKEOF

echo "  Created lib/useSubscription.ts"

# ------------------------------------------------
# 7. CREATE UpgradePrompt component
# ------------------------------------------------
echo "[7/8] Creating UpgradePrompt component..."

cat > components/UpgradePrompt.tsx << 'UPGRADEEOF'
'use client';

import { useRouter } from 'next/navigation';
import { SubscriptionTier, TIER_LIMITS } from '@/lib/subscription';

interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  feature: string;
  requiredTier?: SubscriptionTier;
}

export default function UpgradePrompt({ currentTier, feature, requiredTier = 'pro' }: UpgradePromptProps) {
  const router = useRouter();

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
      <div className="text-3xl mb-3">🔒</div>
      <h3 className="text-lg font-bold text-white mb-2">Upgrade Required</h3>
      <p className="text-white/60 text-sm mb-4">
        {feature} requires the <span className="text-amber-400 font-semibold">{TIER_LIMITS[requiredTier].label}</span> plan or higher.
        You are currently on <span className="text-white/80 font-semibold">{TIER_LIMITS[currentTier].label}</span>.
      </p>
      <button
        onClick={() => router.push('/pricing')}
        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
      >
        View Plans
      </button>
    </div>
  );
}
UPGRADEEOF

echo "  Created components/UpgradePrompt.tsx"

# ------------------------------------------------
# 8. UPDATE Firestore rules for subscriptions
# ------------------------------------------------
echo "[8/8] Updating Firestore rules..."

if ! grep -q "subscriptions" firestore.rules; then
  sed -i '/accessCodes/i\
    // SUBSCRIPTIONS\
    match /subscriptions/{userId} {\
      allow read: if isAuthenticated() && request.auth.uid == userId;\
      allow write: if false; // Only written by server (webhooks)\
    }\
' firestore.rules
  echo "  Updated firestore.rules"
else
  echo "  firestore.rules already has subscriptions rule"
fi

# ------------------------------------------------
# INSTALL firebase-admin for webhook
# ------------------------------------------------
echo ""
echo "Installing firebase-admin..."
npm install firebase-admin --save

# ------------------------------------------------
# BUILD VERIFICATION
# ------------------------------------------------
echo ""
echo "=========================================="
echo "Building to verify..."
echo "=========================================="

npm run build 2>&1 | tail -15

echo ""
echo "=========================================="
echo "M3.4 FILES CREATED:"
echo "=========================================="
echo "  NEW: lib/subscription.ts (tier management, limits)"
echo "  NEW: lib/useSubscription.ts (React hook)"
echo "  NEW: app/pricing/page.tsx (3-tier pricing page)"
echo "  NEW: app/api/stripe/checkout/route.ts (Stripe Checkout)"
echo "  NEW: app/api/stripe/webhook/route.ts (Stripe webhook)"
echo "  NEW: app/api/stripe/portal/route.ts (customer portal)"
echo "  NEW: components/UpgradePrompt.tsx (upgrade prompt)"
echo "  MODIFIED: firestore.rules (subscriptions collection)"
echo ""
echo "=========================================="
echo "STRIPE SETUP REQUIRED:"
echo "=========================================="
echo ""
echo "1. Go to https://dashboard.stripe.com/test/products"
echo ""
echo "2. Create 3 Products:"
echo "   - Starter: \$9.99/month recurring"
echo "   - Pro: \$15/month recurring"
echo "   - Unlimited: \$20/month recurring"
echo ""
echo "3. Copy each product's Price ID (starts with price_)"
echo ""
echo "4. Add to .env.local:"
echo "   STRIPE_SECRET_KEY=sk_test_..."
echo "   STRIPE_PRICE_STARTER=price_..."
echo "   STRIPE_PRICE_PRO=price_..."
echo "   STRIPE_PRICE_UNLIMITED=price_..."
echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "5. Set up Stripe webhook:"
echo "   URL: https://quiz2-1a35d.firebaseapp.com/api/stripe/webhook"
echo "   Events: checkout.session.completed, customer.subscription.updated,"
echo "           customer.subscription.deleted, invoice.payment_failed"
echo ""
echo "6. Deploy:"
echo "   git add . && git commit -m 'M3.4: Stripe paywall' && git push"
echo "   firebase deploy --only hosting,firestore:rules"
echo "=========================================="
