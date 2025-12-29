'use client';

import React, { useEffect, useState } from 'react';
import { UserBadgeEnriched, getUserBadges } from '@/lib/badges';
import { getUserProfile, UserProfile } from '@/lib/auth';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string; // Fallback if profile fetch fails or loading
    userScore?: number; // Contextual score from leaderboard
}

export default function ProfileModal({ isOpen, onClose, userId, userName, userScore }: ProfileModalProps) {
    const [badges, setBadges] = useState<UserBadgeEnriched[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            setLoading(true);
            Promise.all([
                getUserBadges(userId),
                getUserProfile(userId)
            ]).then(([b, p]) => {
                setBadges(b);
                setProfile(p);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [isOpen, userId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-in border border-gray-100 dark:border-slate-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    ✕
                </button>

                <div className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500 shadow-xl mb-4 bg-gray-200 dark:bg-slate-700">
                        {profile?.photoURL ? (
                            <img src={profile.photoURL} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400 font-bold">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{profile?.displayName || userName}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-6">{profile?.role || 'Player'}</p>

                    {/* Stats */}
                    {userScore !== undefined && (
                        <div className="flex gap-8 mb-8 text-center w-full justify-center">
                            <div>
                                <div className="text-2xl font-black text-indigo-500">{userScore}</div>
                                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Session Pts</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-purple-500">{profile?.lifetimePoints || 0}</div>
                                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Lifetime</div>
                            </div>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="w-full">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            Badges <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-gray-500">{badges.length}</span>
                        </h3>

                        {loading ? (
                            <div className="h-24 flex items-center justify-center text-gray-400 text-sm italic">Loading badges...</div>
                        ) : badges.length === 0 ? (
                            <div className="h-24 flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-xl">
                                <p>No badges earned yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {badges.map((b, idx) => (
                                    <div
                                        key={idx}
                                        className="aspect-square bg-gray-50 dark:bg-slate-700 rounded-xl p-2 flex items-center justify-center relative group cursor-help transition-transform hover:scale-105"
                                        title={`${b.details?.name}: ${b.details?.description}`}
                                    >
                                        <img src={b.details?.imageUrl} alt={b.details?.name} className="w-full h-full object-contain drop-shadow-sm" />

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black/90 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-center">
                                            <div className="font-bold mb-1">{b.details?.name}</div>
                                            <div className="text-[10px] opacity-80">{b.details?.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
