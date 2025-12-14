'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import HostMenu from '@/components/HostMenu';
import Confetti from '@/components/Confetti';
import { onAuthStateChange, UserProfile } from '@/lib/auth';
import { getClass, getClassMembers, onClassChange, Class, updateClassActivity } from '@/lib/classes';
import { User } from 'firebase/auth';

function RandomizerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<Class | null>(null);
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<UserProfile | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => {
            if (!u) {
                router.push('/login');
            } else {
                setUser(u);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user || !classId) return;

        // Set initial activity
        updateClassActivity(classId, { type: 'randomizer', state: { winner: null } });

        const unsubscribe = onClassChange(classId, async (cls) => {
            if (cls && cls.hostId === user.uid) {
                setClassData(cls);
                // Fetch members when class updates
                const students = await getClassMembers(classId);
                setMembers(students);
            } else if (cls) {
                router.push('/dashboard');
            }
        });

        return () => unsubscribe();
    }, [user, classId, router]);

    const handleSpin = () => {
        if (members.length === 0) return;

        setIsSpinning(true);
        setWinner(null);
        setHighlightedIndex(0);

        // Update state to spinning
        if (classId) updateClassActivity(classId, { type: 'randomizer', state: { spinning: true, winner: null } });

        let duration = 3000; // 3 seconds spin
        let interval = 100;
        let elapsed = 0;
        let currentIndex = 0;

        const spinInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % members.length;
            setHighlightedIndex(currentIndex);

            elapsed += interval;

            // Slow down near the end
            if (elapsed > duration - 1000) {
                interval = 200;
            }

            if (elapsed >= duration) {
                clearInterval(spinInterval);
                const finalIndex = Math.floor(Math.random() * members.length);

                // Do a final slow roll to the winner
                let stepsToWinner = finalIndex - currentIndex;
                if (stepsToWinner < 0) stepsToWinner += members.length;

                // Ensure we do at least one full loop if the winner is close
                if (stepsToWinner < 5) stepsToWinner += members.length;

                let currentStep = 0;
                const finalRoll = setInterval(() => {
                    currentIndex = (currentIndex + 1) % members.length;
                    setHighlightedIndex(currentIndex);
                    currentStep++;

                    if (currentStep >= stepsToWinner) {
                        clearInterval(finalRoll);
                        const winnerProfile = members[finalIndex];
                        setWinner(winnerProfile);
                        setIsSpinning(false);

                        // Update state with winner
                        if (classId) updateClassActivity(classId, { type: 'randomizer', state: { winner: winnerProfile.displayName } });
                    }
                }, 200); // Slower final roll
            }
        }, interval);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="animate-pulse text-xl font-bold">Loading Randomizer...</div>
            </div>
        );
    }

    if (!classData) return null;

    return (
        <main className="min-h-screen bg-slate-900 text-white overflow-hidden relative flex flex-col">
            <HostMenu currentPage="Randomizer" classId={classId || undefined} />

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            if (classId) updateClassActivity(classId, { type: 'none' });
                            router.push(`/dashboard/class?id=${classId}`);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                    >
                        ← Back to Class
                    </Button>
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            RANDOMIZER
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            {classData.name} • {members.length} Students
                        </p>
                    </div>
                    <div className="w-[100px]"></div> {/* Spacer for centering */}
                </div>

                {/* Main Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 shadow-2xl backdrop-blur-sm">
                    {members.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-2xl font-bold text-white mb-2">Waiting for students...</h3>
                            <p className="text-slate-400 mb-6">
                                Share the class code <span className="font-mono bg-slate-700 px-2 py-1 rounded text-white">{classData.code}</span> to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {members.map((student, index) => {
                                const isHighlighted = highlightedIndex === index;
                                return (
                                    <div
                                        key={student.uid}
                                        className={`
                                            relative p-4 rounded-xl text-center transition-all duration-100 transform
                                            ${isHighlighted
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10 border-transparent'
                                                : 'bg-slate-800/80 border border-slate-700 hover:border-slate-600'
                                            }
                                        `}
                                    >
                                        <div className={`font-bold truncate ${isHighlighted ? 'text-white text-lg' : 'text-slate-300'}`}>
                                            {student.displayName}
                                        </div>
                                        {isHighlighted && (
                                            <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 animate-pulse" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="mt-8 flex flex-col items-center justify-center pb-8">
                    <button
                        onClick={handleSpin}
                        disabled={isSpinning || members.length === 0}
                        className={`
                            relative group px-12 py-6 rounded-full font-black text-2xl tracking-widest transition-all duration-300
                            ${isSpinning
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed transform scale-95'
                                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] active:scale-95'
                            }
                        `}
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {isSpinning ? (
                                <>
                                    <span className="animate-spin">⚡</span> SPINNING...
                                </>
                            ) : (
                                <>
                                    <span>🎲</span> SPIN THE WHEEL
                                </>
                            )}
                        </span>
                        {!isSpinning && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                </div>
            </div>

            {/* Winner Overlay */}
            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fade-in">
                    <Confetti />
                    <div className="relative z-50 flex flex-col items-center text-center p-12 animate-bounce-in">
                        <div className="text-8xl mb-6 animate-bounce">👑</div>
                        <h2 className="text-3xl font-bold text-indigo-300 mb-2 tracking-widest uppercase">The Winner Is</h2>
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 mb-8 drop-shadow-2xl">
                            {winner.displayName}
                        </h1>
                        <button
                            onClick={() => {
                                setWinner(null);
                                setHighlightedIndex(null);
                                if (classId) updateClassActivity(classId, { type: 'randomizer', state: { winner: null } });
                            }}
                            className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-xl hover:bg-gray-100 hover:scale-105 transition-all shadow-xl"
                        >
                            Spin Again 🔄
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function RandomizerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <RandomizerContent />
        </Suspense>
    );
}
