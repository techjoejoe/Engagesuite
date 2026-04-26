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
    price: '$10',
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
