'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { initBuzzer, onBuzzerChange, setBuzzerStatus, resetBuzzer, BuzzerState } from '@/lib/buzzer';
import { updateClassActivity } from '@/lib/classes';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';

import { Suspense } from 'react';

function BuzzerLaunchContent() {
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');
    const router = useRouter();

    const [state, setState] = useState<BuzzerState>({ status: 'locked', buzzes: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classId) return;

        // Update activity immediately to ensure student view switches
        updateClassActivity(classId, { type: 'buzzer' }).catch(console.error);

        const init = async () => {
            await initBuzzer(classId);
            setLoading(false);
        };
        init();

        const unsubscribe = onBuzzerChange(classId, (data) => {
            setState(data);
        });

        return () => unsubscribe();
    }, [classId]);

    const toggleStatus = async () => {
        if (!classId) return;
        const newStatus = state.status === 'locked' ? 'open' : 'locked';
        await setBuzzerStatus(classId, newStatus);
    };

    const handleReset = async () => {
        if (!classId) return;
        await resetBuzzer(classId);
    };

    if (!classId) return <div className="text-white p-8">Missing Class ID</div>;

    return (
        <main className="min-h-screen p-8 transition-colors duration-300 bg-slate-900">
            <HostMenu currentPage="Quick Launch" classId={classId} />

            <div className="container mx-auto max-w-4xl pt-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <span className="text-5xl">🔔</span> Buzzer System
                        </h1>
                        <p className="text-gray-400">Control the buzzer session for your class.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                            onClick={() => {
                                updateClassActivity(classId, { type: 'none' }).catch(console.error);
                                router.push(`/dashboard/class?id=${classId}`);
                            }}
                        >
                            ← Back to Class
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="glass-card p-6 text-center">
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Status</div>
                            <div className={`text-3xl font-black mb-6 ${state.status === 'open' ? 'text-green-400 animate-pulse' : 'text-red-400'}`}>
                                {state.status === 'open' ? 'OPEN' : 'LOCKED'}
                            </div>

                            <button
                                onClick={toggleStatus}
                                className={`w-full py-6 rounded-2xl text-2xl font-bold shadow-lg transition-all transform active:scale-95 mb-4 ${state.status === 'locked'
                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                                    }`}
                            >
                                {state.status === 'locked' ? 'UNLOCK' : 'LOCK'}
                            </button>

                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={handleReset}
                            >
                                Reset & Clear
                            </Button>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-white font-bold mb-2">Instructions</h3>
                            <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4">
                                <li>Click <strong>UNLOCK</strong> to let students buzz in.</li>
                                <li>Students will see a big button on their devices.</li>
                                <li>The first person to buzz appears at the top.</li>
                                <li>Click <strong>RESET</strong> to clear the list and lock the buzzer for the next round.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Results Feed */}
                    <div className="md:col-span-2">
                        <div className="glass-card p-6 min-h-[500px] flex flex-col">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                <h2 className="text-2xl font-bold text-white">Buzzes</h2>
                                <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    Count: {state.buzzes.length}
                                </span>
                            </div>

                            {state.buzzes.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <div className="text-6xl mb-4">🔇</div>
                                    <div className="text-xl font-medium">Waiting for buzzes...</div>
                                </div>
                            ) : (
                                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
                                    {state.buzzes.sort((a, b) => a.timestamp - b.timestamp).map((buzz, index) => (
                                        <div
                                            key={buzz.userId}
                                            className={`p-4 rounded-xl flex items-center justify-between animate-slide-up ${index === 0
                                                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50'
                                                : 'bg-white/5 border border-white/10'
                                                }`}
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Rank */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white border border-slate-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>

                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-md relative bg-slate-800">
                                                    {buzz.photoURL ? (
                                                        <img src={buzz.photoURL} alt={buzz.displayName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                            {(buzz.displayName || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-lg ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                                        {buzz.displayName}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-mono">
                                                        {new Date(buzz.timestamp).toLocaleTimeString().split(' ')[0]}.
                                                        <span className="text-gray-500">{new Date(buzz.timestamp).getMilliseconds()}ms</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {index === 0 && (
                                                <div className="text-2xl">🏆</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function BuzzerLaunchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Buzzer...</div>}>
            <BuzzerLaunchContent />
        </Suspense>
    );
}
