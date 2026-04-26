'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { isAdmin, getAllUsers, grantSubscription, revokeSubscription, deleteUser, AdminUser } from '@/lib/admin';
import { SubscriptionTier, getEffectiveTier, getTrialDaysRemaining } from '@/lib/subscription';

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  starter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pro: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  unlimited: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  trialing: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400',
  trialing: 'text-amber-400',
  past_due: 'text-red-400',
  canceled: 'text-gray-400',
  expired: 'text-gray-500',
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'host' | 'player'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | SubscriptionTier>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [grantModal, setGrantModal] = useState<{ uid: string; name: string } | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('starter');

  useEffect(() => {
    const unsub = onAuthStateChange(async (user) => {
      if (!user || !isAdmin(user.email)) {
        router.push('/login');
        return;
      }
      setAuthorized(true);
      await loadUsers();
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleGrant = async () => {
    if (!grantModal) return;
    setActionLoading(grantModal.uid);
    try {
      await grantSubscription(grantModal.uid, selectedTier);
      await loadUsers();
    } catch (err) { console.error(err); }
    setActionLoading(null);
    setGrantModal(null);
  };

  const handleRevoke = async (uid: string) => {
    setActionLoading(uid);
    try {
      await revokeSubscription(uid);
      await loadUsers();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleDelete = async (uid: string) => {
    setActionLoading(uid);
    try {
      await deleteUser(uid);
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err) { console.error(err); }
    setActionLoading(null);
    setConfirmDelete(null);
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q) || u.uid.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const effectiveTier = getEffectiveTier(u.subscription || null);
      const matchTier = tierFilter === 'all' || effectiveTier === tierFilter;
      return matchSearch && matchRole && matchTier;
    });
  }, [users, search, roleFilter, tierFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const hosts = users.filter(u => u.role === 'host').length;
    const players = users.filter(u => u.role === 'player').length;
    const paid = users.filter(u => {
      const t = getEffectiveTier(u.subscription || null);
      return t !== 'free';
    }).length;
    const trialing = users.filter(u => u.subscription?.status === 'trialing').length;
    const today = new Date().toDateString();
    const newToday = users.filter(u => new Date(u.createdAt).toDateString() === today).length;
    return { total, hosts, players, paid, trialing, newToday };
  }, [users]);

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Tier', 'Status', 'Signed Up', 'Last Active'],
      ...filtered.map(u => [
        u.displayName, u.email, u.role,
        getEffectiveTier(u.subscription || null),
        u.subscription?.status || 'none',
        new Date(u.createdAt).toLocaleDateString(),
        new Date(u.lastActive).toLocaleDateString(),
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="animate-pulse text-white/60 text-lg">Verifying admin access...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-lg font-black">⚡</div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Super Admin</h1>
              <p className="text-xs text-white/40">Trainer Toolbox Control Panel</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/analytics')} className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">📊 Analytics</button>
            <button onClick={() => router.push('/admin/codes')} className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">🎟️ Codes</button>
            <button onClick={() => router.push('/dashboard')} className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">← Dashboard</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.total, color: 'from-blue-500 to-cyan-500' },
            { label: 'Hosts', value: stats.hosts, color: 'from-purple-500 to-pink-500' },
            { label: 'Players', value: stats.players, color: 'from-indigo-500 to-blue-500' },
            { label: 'Paid', value: stats.paid, color: 'from-emerald-500 to-green-500' },
            { label: 'Trialing', value: stats.trialing, color: 'from-amber-500 to-yellow-500' },
            { label: 'New Today', value: stats.newToday, color: 'from-rose-500 to-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition">
              <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`text-3xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, email, or UID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
            <option value="all">All Roles</option>
            <option value="host">Hosts</option>
            <option value="player">Players</option>
          </select>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value as any)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="unlimited">Unlimited</option>
          </select>
          <button onClick={exportCSV} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-sm transition whitespace-nowrap">⬇ Export CSV</button>
        </div>

        {/* User Count */}
        <div className="text-sm text-white/40 mb-4">Showing {filtered.length} of {users.length} users</div>

        {/* Users Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">Tier</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">Last Active</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-white/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-white/30">No users found</td></tr>
                )}
                {filtered.map(u => {
                  const tier = getEffectiveTier(u.subscription || null);
                  const status = u.subscription?.status || 'none';
                  const trialDays = getTrialDaysRemaining(u.subscription || null);
                  const isLoading = actionLoading === u.uid;

                  return (
                    <tr key={u.uid} className="border-b border-white/5 hover:bg-white/[0.03] transition group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                              {u.displayName?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{u.displayName || 'Anonymous'}</div>
                            <div className="text-xs text-white/40">{u.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.role === 'host' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${TIER_COLORS[tier] || TIER_COLORS.free}`}>
                          {tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${STATUS_COLORS[status] || 'text-white/30'}`}>
                          {status}{trialDays > 0 ? ` (${trialDays}d left)` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{new Date(u.lastActive).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => { setGrantModal({ uid: u.uid, name: u.displayName }); setSelectedTier(tier === 'free' ? 'starter' : tier as SubscriptionTier); }}
                            disabled={isLoading}
                            className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition font-semibold"
                          >Grant</button>
                          {tier !== 'free' && (
                            <button
                              onClick={() => handleRevoke(u.uid)}
                              disabled={isLoading}
                              className="px-2 py-1 text-xs bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition font-semibold"
                            >{isLoading ? '...' : 'Revoke'}</button>
                          )}
                          {confirmDelete === u.uid ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(u.uid)} disabled={isLoading} className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg font-semibold">{isLoading ? '...' : 'Confirm'}</button>
                              <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded-lg font-semibold">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(u.uid)} className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition font-semibold">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grant Modal */}
      {grantModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setGrantModal(null)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-1">Grant Subscription</h3>
            <p className="text-white/40 text-sm mb-6">For <span className="text-white font-semibold">{grantModal.name}</span></p>

            <div className="space-y-3 mb-6">
              {(['starter', 'pro', 'unlimited'] as SubscriptionTier[]).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`w-full p-4 rounded-xl border text-left transition ${selectedTier === t ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold capitalize">{t}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${TIER_COLORS[t]}`}>{t === 'starter' ? '$10/mo' : t === 'pro' ? '$15/mo' : '$20/mo'}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setGrantModal(null)} className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/15 transition">Cancel</button>
              <button onClick={handleGrant} disabled={actionLoading === grantModal.uid} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-bold hover:opacity-90 transition">
                {actionLoading === grantModal.uid ? 'Granting...' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
