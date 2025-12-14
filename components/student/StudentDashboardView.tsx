'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClassLeaderboard from './ClassLeaderboard';
import { getClassMember, ClassMember } from '@/lib/scoring';
import { getUserProfile, UserProfile, getLifetimeLeaderboard } from '@/lib/auth';
import { getUserRedemptionHistory } from '@/lib/leadergrid';

interface Props {
    classId: string;
    className: string;
    userId: string;
    onJoinActivity: (type: string) => void;
    initialTab?: 'class' | 'global';
}

export default function StudentDashboardView({ classId, className, userId, onJoinActivity, initialTab = 'class' }: Props) {
    const router = useRouter();
    const [member, setMember] = useState<ClassMember | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [tab, setTab] = useState<'class' | 'global'>(initialTab);

    const loadStats = async () => {
        if (!userId) return;
        setRefreshing(true);
        try {
            const [m, u, l] = await Promise.all([
                getClassMember(classId, userId),
                getUserProfile(userId),
                getLifetimeLeaderboard(100)
            ]);
            setMember(m);
            setUserProfile(u);
            setLeaderboard(l);
        } catch (error) {
            console.error("Error loading dashboard stats:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const loadHistory = async () => {
        if (!userId) return;
        const h = await getUserRedemptionHistory(userId);
        setHistory(h);
    };

    useEffect(() => {
        loadStats();
        // Refresh leaderboard every 10 seconds
        const interval = setInterval(loadStats, 10000);
        return () => clearInterval(interval);
    }, [classId, userId]);

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in max-w-lg mx-auto pb-20">
            {/* Header & Stats */}
            <div className="flex items-center justify-between px-2 pt-2">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        Hi, {userProfile?.displayName?.split(' ')[0] || 'Student'}
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate max-w-[150px]">
                        {className}
                    </p>
                </div>
                <div className="flex gap-4 bg-slate-800/50 p-2 rounded-xl border border-white/5 backdrop-blur-md">
                    <div className="text-center px-2">
                        <div className="text-lg font-black text-blue-400 leading-none">{member?.score || 0}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Score</div>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="text-center px-2">
                        <div className="text-lg font-black text-green-400 leading-none">{userProfile?.lifetimePoints || 0}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Lifetime</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-800/50 rounded-xl mx-2">
                <button
                    onClick={() => setTab('class')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${tab === 'class' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    Class Leaders
                </button>
                <button
                    onClick={() => setTab('global')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${tab === 'global' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    Global Leaders
                </button>
            </div>

            {/* Global Leaderboard Title & History Button (Only for Global) */}
            {tab === 'global' && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <h3 className="text-lg font-bold text-white">Global Leaderboard</h3>
                    </div>
                    <button
                        onClick={() => { setShowHistory(true); loadHistory(); }}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors flex items-center gap-1"
                    >
                        📜 History
                    </button>
                </div>
            )}

            {/* Content */}
            {tab === 'class' ? (
                <ClassLeaderboard classId={classId} userId={userId} />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                        {leaderboard.length === 0 ? (
                            <div className="col-span-2 text-center py-12 text-slate-500">
                                <div className="text-4xl mb-2">🌍</div>
                                <p>Loading global ranks...</p>
                            </div>
                        ) : (
                            leaderboard.map((user, index) => {
                                const isCurrentUser = user.uid === userId;
                                const isTop3 = index < 3;
                                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                                return (
                                    <div
                                        key={user.uid}
                                        className={`relative flex flex-col items-center text-center p-4 rounded-xl transition-all border ${isCurrentUser
                                            ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                            : isTop3
                                                ? 'bg-yellow-500/10 border-yellow-500/20'
                                                : 'bg-slate-800/40 border-white/5'
                                            }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className="absolute top-2 left-2 text-lg font-black drop-shadow-md">
                                            {medal || <span className="text-slate-500 text-sm">#{index + 1}</span>}
                                        </div>

                                        {/* Profile Image */}
                                        <div className="relative mb-3 mt-2">
                                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isTop3 ? 'border-yellow-500' : 'border-slate-700'} shadow-lg`}>
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center text-2xl ${isTop3 ? 'bg-yellow-900/30 text-yellow-500' : 'bg-slate-700 text-slate-400'}`}>
                                                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div className={`font-bold text-sm truncate w-full mb-1 ${isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                                            {user.displayName || 'Anonymous'}
                                        </div>

                                        {isCurrentUser && (
                                            <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full mb-2">YOU</span>
                                        )}

                                        {/* Points */}
                                        <div className="mt-auto">
                                            <div className="text-lg font-black text-green-400 leading-none">
                                                {user.lifetimePoints.toLocaleString()}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-600 uppercase mt-1">
                                                Lifetime
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {/* Refresh Button (Subtle) */}
                    <button
                        onClick={loadStats}
                        className="mx-auto text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:text-slate-400 transition-colors flex items-center gap-2 mt-4"
                    >
                        <span className={refreshing ? 'animate-spin' : ''}>🔄</span> Refresh Status
                    </button>
                </>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl max-h-[80vh] flex flex-col animate-bounce-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span>📜</span> Scan History
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                            {history.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <div className="text-4xl mb-2">🕸️</div>
                                    <p>No scans yet.</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:bg-slate-800 transition-colors">
                                        <div>
                                            <div className="font-bold text-white mb-1">{item.codeName}</div>
                                            <div className="text-xs text-slate-400">{item.timestamp?.toLocaleString()}</div>
                                        </div>
                                        <div className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/20">
                                            +{item.points}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
