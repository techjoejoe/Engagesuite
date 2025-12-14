import React, { useState, useEffect } from 'react';
import { getClassLeaderboard, ClassMember } from '@/lib/scoring';
import { getUserProfile } from '@/lib/auth';

const ClassLeaderboard = ({ classId, userId }: { classId: string; userId: string }) => {
    const [leaderboard, setLeaderboard] = useState<(ClassMember & { lifetimePoints?: number; photoURL?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                const members = await getClassLeaderboard(classId, 100);
                // Fetch lifetime points and photo for each member
                const membersWithDetails = await Promise.all(
                    members.map(async (member) => {
                        const profile = await getUserProfile(member.userId);
                        return {
                            ...member,
                            lifetimePoints: profile?.lifetimePoints || 0,
                            photoURL: profile?.photoURL || undefined
                        };
                    })
                );
                setLeaderboard(membersWithDetails);
            } catch (error) {
                console.error('Error loading leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };
        loadLeaderboard();
        // Refresh every 5 seconds
        const interval = setInterval(loadLeaderboard, 5000);
        return () => clearInterval(interval);
    }, [classId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="text-center mb-4">
                <div className="text-5xl mb-2">🏆</div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">Class Leaders</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {leaderboard.length} student{leaderboard.length !== 1 ? 's' : ''} competing
                </p>
            </div>

            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {leaderboard.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-slate-500 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                        <div className="text-4xl mb-2">👥</div>
                        <p>No students yet. Be the first!</p>
                    </div>
                ) : (
                    leaderboard.map((entry, index) => {
                        const isCurrentUser = entry.userId === userId;
                        const isTop3 = index < 3;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                        return (
                            <div
                                key={entry.userId}
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
                                        {entry.photoURL ? (
                                            <img src={entry.photoURL} alt={entry.nickname} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center text-2xl ${isTop3 ? 'bg-yellow-900/30 text-yellow-500' : 'bg-slate-700 text-slate-400'}`}>
                                                {entry.nickname.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Name */}
                                <div className={`font-bold text-sm truncate w-full mb-1 ${isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                                    {entry.nickname}
                                </div>

                                {isCurrentUser && (
                                    <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full mb-2">YOU</span>
                                )}

                                {/* Points */}
                                <div className="mt-auto">
                                    <div className="text-lg font-black text-blue-400 leading-none">
                                        {entry.score}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-600 uppercase mt-1">
                                        Class Points
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ClassLeaderboard;
