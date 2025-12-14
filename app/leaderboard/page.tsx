'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { getLifetimeLeaderboard, getCurrentUser, getUserProfile } from '@/lib/auth';
import { UserProfile } from '@/lib/auth';

export default function LeaderboardPage() {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            loadLeaderboard();
        }
    }, [mounted]);

    const loadLeaderboard = async () => {
        const data = await getLifetimeLeaderboard(100);
        setLeaderboard(data);

        const user = getCurrentUser();
        if (user) {
            const profile = await getUserProfile(user.uid);
            setCurrentUser(profile);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="animate-pulse">Loading Leaderboard...</div>
            </div>
        );
    }

    const currentUserRank = currentUser
        ? leaderboard.findIndex(u => u.uid === currentUser.uid) + 1
        : 0;

    return (
        <main className="min-h-screen bg-slate-900 text-white p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto pb-16">
                <div className="animate-fade-in space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">🌍</span>
                            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                Lifetime Leaderboard
                            </h1>
                        </div>
                        <Button variant="glass" onClick={() => router.push('/')} className="text-sm">
                            Home
                        </Button>
                    </div>

                    {/* Current User Rank (if logged in) */}
                    {currentUser && currentUserRank > 0 && (
                        <div className="glass-card p-6 text-center border border-indigo-500/30 bg-indigo-500/10">
                            <div className="text-sm text-indigo-300 font-bold uppercase tracking-wider mb-2">
                                Your Global Rank
                            </div>
                            <div className="text-5xl font-black mb-2 text-white drop-shadow-lg">
                                #{currentUserRank}
                            </div>
                            <div className="text-xl text-slate-300">
                                <span className="text-green-400 font-bold">{currentUser.lifetimePoints.toLocaleString()}</span> lifetime points
                            </div>
                        </div>
                    )}

                    {/* Leaderboard */}
                    <div className="space-y-3">
                        {leaderboard.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <div className="text-6xl mb-4">🏆</div>
                                <h2 className="text-2xl font-bold mb-2">No Players Yet</h2>
                                <p className="text-slate-400 mb-6">
                                    Be the first to earn lifetime points!
                                </p>
                                <Button variant="primary" onClick={() => router.push('/join')}>
                                    Join a Game
                                </Button>
                            </div>
                        ) : (
                            leaderboard.map((user, index) => {
                                const isCurrentUser = currentUser?.uid === user.uid;
                                const isTop3 = index < 3;
                                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                                return (
                                    <div
                                        key={user.uid}
                                        className={`
                                            flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                                            ${isCurrentUser
                                                ? 'bg-indigo-600/20 border border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                                : 'bg-slate-800/40 border border-white/5 hover:bg-slate-800/60'
                                            }
                                            ${isTop3 ? 'scale-[1.02]' : ''}
                                        `}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className={`
                                            w-12 text-center font-black text-xl
                                            ${isTop3 ? 'text-yellow-400' : 'text-slate-500'}
                                        `}>
                                            {medal || `#${index + 1}`}
                                        </div>

                                        <div className="relative">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.displayName}
                                                    className={`w-12 h-12 rounded-full object-cover border-2 ${isTop3 ? 'border-yellow-500' : 'border-slate-700'}`}
                                                />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isTop3 ? 'bg-yellow-900/30 text-yellow-500 border-2 border-yellow-500/30' : 'bg-slate-700 text-slate-400'}`}>
                                                    {user.displayName?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`font-bold truncate ${isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                                                    {user.displayName || 'Anonymous'}
                                                </span>
                                                {isCurrentUser && (
                                                    <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium">
                                                {user.gamesPlayed || 0} games • {user.gamesWon || 0} wins
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tabular-nums">
                                                {user.lifetimePoints.toLocaleString()}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                Points
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {!currentUser && (
                        <div className="mt-8 p-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 text-center">
                            <p className="text-slate-400 mb-4">
                                Want to see your name here?
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="primary" onClick={() => router.push('/signup')}>
                                    Sign Up
                                </Button>
                                <Button variant="glass" onClick={() => router.push('/login')}>
                                    Login
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
