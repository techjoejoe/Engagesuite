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
