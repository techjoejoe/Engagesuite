'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { createAccessCode, getAllAccessCodes, deactivateAccessCode, deleteAccessCode, AccessCode } from '@/lib/accessCodes';
import { User } from 'firebase/auth';

type Tier = 'starter' | 'pro' | 'unlimited' | 'trial';

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter ($9.99)', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  pro: { label: 'Pro ($15)', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  unlimited: { label: 'Unlimited ($20)', color: 'text-teal-400', bg: 'bg-teal-500/20' },
  trial: { label: '14-Day Trial', color: 'text-amber-400', bg: 'bg-amber-500/20' },
};

export default function AdminCodesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>('pro');
  const [batchCount, setBatchCount] = useState(1);
  const [expiryDays, setExpiryDays] = useState<number>(0);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (!currentUser) { router.push('/login'); return; }
      const profile = await getUserProfile(currentUser.uid);
      if (profile?.role !== 'host') { router.push('/student/dashboard'); return; }
      setUser(currentUser);
      await loadCodes();
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadCodes = async () => {
    const allCodes = await getAllAccessCodes();
    allCodes.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0;
      const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
      return bTime - aTime;
    });
    setCodes(allCodes);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setNewCodes([]);
    try {
      const generated: string[] = [];
      for (let i = 0; i < batchCount; i++) {
        const code = await createAccessCode(user.uid, selectedTier, {
          maxUses: 1, expiresInDays: expiryDays > 0 ? expiryDays : undefined,
        });
        generated.push(code);
      }
      setNewCodes(generated);
      await loadCodes();
    } catch (err) { console.error('Error generating codes:', err); }
    finally { setGenerating(false); }
  };

  const handleDeactivate = async (code: string) => { await deactivateAccessCode(code); await loadCodes(); };
  const handleDelete = async (code: string) => { if (confirm('Delete this code?')) { await deleteAccessCode(code); await loadCodes(); } };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(null), 2000); };

  const formatDate = (timestamp: number | any): string => {
    if (!timestamp) return 'N/A';
    const ms = typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || 0;
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (code: AccessCode): boolean => {
    if (!code.expiresAt) return false;
    const ms = typeof code.expiresAt === 'number' ? code.expiresAt : code.expiresAt.toMillis?.() || 0;
    return Date.now() > ms;
  };

  if (loading) return (<main className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" /></main>);

  const activeCount = codes.filter(c => c.active && !isExpired(c)).length;
  const usedCount = codes.filter(c => c.currentUses > 0).length;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-white/50 hover:text-white text-sm mb-2 transition-colors">← Back to Dashboard</button>
            <h1 className="text-2xl font-bold">Access Code Manager</h1>
            <p className="text-white/50 text-sm mt-1">Generate and manage trainer access codes</p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"><div className="text-xl font-bold text-indigo-400">{activeCount}</div><div className="text-xs text-white/40">Active</div></div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"><div className="text-xl font-bold text-teal-400">{usedCount}</div><div className="text-xs text-white/40">Used</div></div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"><div className="text-xl font-bold text-white/60">{codes.length}</div><div className="text-xs text-white/40">Total</div></div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Generate New Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Tier</label>
              <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value as Tier)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                <option value="trial">14-Day Trial</option><option value="starter">Starter ($9.99/mo)</option><option value="pro">Pro ($15/mo)</option><option value="unlimited">Unlimited ($20/mo)</option>
              </select>
            </div>
            <div><label className="block text-xs text-white/50 mb-1">Quantity</label><input type="number" min={1} max={50} value={batchCount} onChange={(e) => setBatchCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500" /></div>
            <div><label className="block text-xs text-white/50 mb-1">Expires in (days, 0=never)</label><input type="number" min={0} value={expiryDays} onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500" /></div>
            <div className="flex items-end"><button onClick={handleGenerate} disabled={generating} className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50">{generating ? 'Generating...' : `Generate ${batchCount} Code${batchCount > 1 ? 's' : ''}`}</button></div>
          </div>
          {newCodes.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
              <div className="text-green-400 font-semibold text-sm mb-2">Generated {newCodes.length} code{newCodes.length > 1 ? 's' : ''}:</div>
              <div className="flex flex-wrap gap-2">{newCodes.map((code) => (<button key={code} onClick={() => copyToClipboard(code)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg font-mono text-sm hover:bg-white/10 transition-all">{code}<span className="text-xs text-white/40">{copied === code ? 'Copied!' : 'Click to copy'}</span></button>))}</div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10"><h2 className="font-semibold">All Codes ({codes.length})</h2></div>
          {codes.length === 0 ? (<div className="p-12 text-center text-white/40">No access codes yet. Generate your first code above.</div>) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10 text-xs text-white/40 uppercase tracking-wider"><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Tier</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Created</th><th className="px-4 py-3 text-left">Expires</th><th className="px-4 py-3 text-left">Used</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody>{codes.map((code) => {
                  const expired = isExpired(code);
                  const fullyUsed = code.maxUses > 0 && code.currentUses >= code.maxUses;
                  return (
                    <tr key={code.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3"><button onClick={() => copyToClipboard(code.code)} className="font-mono text-sm hover:text-indigo-400 transition-colors">{code.code}{copied === code.code && <span className="ml-2 text-xs text-green-400">Copied!</span>}</button></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${TIER_CONFIG[code.tier]?.bg || 'bg-white/10'} ${TIER_CONFIG[code.tier]?.color || 'text-white/60'}`}>{TIER_CONFIG[code.tier]?.label || code.tier}</span></td>
                      <td className="px-4 py-3">{!code.active || expired || fullyUsed ? (<span className="text-xs text-red-400">{expired ? 'Expired' : fullyUsed ? 'Used' : 'Inactive'}</span>) : (<span className="text-xs text-green-400">Active</span>)}</td>
                      <td className="px-4 py-3 text-sm text-white/50">{formatDate(code.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-white/50">{code.expiresAt ? formatDate(code.expiresAt) : 'Never'}</td>
                      <td className="px-4 py-3 text-sm text-white/50">{code.currentUses}/{code.maxUses || '∞'}</td>
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2">{code.active && !expired && (<button onClick={() => handleDeactivate(code.code)} className="text-xs px-2 py-1 text-amber-400 hover:bg-amber-500/10 rounded transition-colors">Deactivate</button>)}<button onClick={() => handleDelete(code.code)} className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded transition-colors">Delete</button></div></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
