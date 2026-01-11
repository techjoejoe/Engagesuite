'use client';

import { useState, useEffect } from 'react';
import { onBuzzerChange, buzzIn, BuzzerState } from '@/lib/buzzer';
import { UserProfile } from '@/lib/auth';

interface Props {
    classId: string;
    userProfile: UserProfile;
}

export default function BuzzerView({ classId, userProfile }: Props) {
    const [state, setState] = useState<BuzzerState>({ status: 'locked', buzzes: [] });
    const [myBuzz, setMyBuzz] = useState<{ rank: number, timestamp: number } | null>(null);

    useEffect(() => {
        const unsubscribe = onBuzzerChange(classId, (data) => {
            setState(data);

            // Check if I buzzed
            const myBuzzIndex = data.buzzes.findIndex(b => b.userId === userProfile.uid);
            if (myBuzzIndex !== -1) {
                setMyBuzz({
                    rank: myBuzzIndex + 1,
                    timestamp: data.buzzes[myBuzzIndex].timestamp
                });
            } else {
                setMyBuzz(null);
            }
        });

        return () => unsubscribe();
    }, [classId, userProfile.uid]);

    const handleBuzz = async () => {
        if (state.status !== 'open' || myBuzz) return;

        if (navigator.vibrate) navigator.vibrate(200);
        await buzzIn(classId, userProfile.uid, userProfile.displayName || 'Student', userProfile.photoURL || undefined);
    };

    // Render Logic
    if (myBuzz) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
                {userProfile.photoURL ? (
                    <div className="relative mb-6">
                        <img
                            src={userProfile.photoURL}
                            alt={userProfile.displayName || 'User'}
                            className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover animate-bounce-in"
                        />
                        <div className="absolute -bottom-2 -right-2 text-5xl animate-bounce delay-100">
                            {myBuzz.rank === 1 ? '🏆' : '✅'}
                        </div>
                    </div>
                ) : (
                    <div className="text-6xl mb-6 animate-bounce">
                        {myBuzz.rank === 1 ? '🏆' : '✅'}
                    </div>
                )}
                <h2 className="text-3xl font-bold text-white mb-2">You Buzzed In!</h2>
                <div className="text-xl text-gray-300 mb-8">
                    Rank: <span className="text-4xl font-black text-yellow-400">#{myBuzz.rank}</span>
                </div>
                <p className="text-gray-400 text-center max-w-xs">
                    Wait for the host to reset the buzzer for the next round.
                </p>
            </div>
        );
    }

    if (state.status === 'locked') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in opacity-50">
                <div className="w-64 h-64 rounded-full bg-gray-700 border-8 border-gray-600 flex items-center justify-center mb-8 shadow-inner">
                    <span className="text-4xl font-bold text-gray-400">LOCKED</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-400 mb-2">Buzzer is Locked</h2>
                <p className="text-gray-500">Get ready...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <button
                onClick={handleBuzz}
                className="w-64 h-64 md:w-72 md:h-72 rounded-full bg-red-500 border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all shadow-2xl shadow-red-500/50 flex flex-col items-center justify-center group hover:bg-red-400 focus:outline-none touch-manipulation"
            >
                <span className="text-6xl mb-2 group-hover:scale-110 transition-transform">🔔</span>
                <span className="text-4xl font-black text-white tracking-widest">BUZZ!</span>
            </button>
            <p className="mt-8 text-xl font-bold text-white animate-pulse">
                GO! GO! GO!
            </p>
        </div>
    );
}
