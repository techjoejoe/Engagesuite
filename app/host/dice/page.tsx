'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import Dice3D from '@/components/Dice3D';
import { updateToolState } from '@/lib/tools';

import { Suspense } from 'react';

function DiceContent() {
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');
    const router = useRouter();
    const [rolling, setRolling] = useState(false);
    const [numDice, setNumDice] = useState(1);
    const [results, setResults] = useState<number[]>([1]);

    // Activate tool on mount
    useEffect(() => {
        if (classId) {
            updateToolState(classId, 'dice', {
                type: 'dice',
                active: true,
                data: { rolling: false, numDice, results }
            });
        }

        return () => {
            if (classId) {
                updateToolState(classId, 'dice', {
                    type: 'dice',
                    active: false,
                    data: { rolling: false, numDice, results }
                });
            }
        };
    }, [classId]);

    const roll = () => {
        setRolling(true);
        // Sync rolling state
        if (classId) {
            updateToolState(classId, 'dice', {
                type: 'dice',
                active: true,
                data: { rolling: true, numDice, results }
            });
        }

        // Simulate rolling
        const interval = setInterval(() => {
            const newResults = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
            setResults(newResults);
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            const finalResults = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
            setResults(finalResults);
            setRolling(false);

            // Sync final results
            if (classId) {
                updateToolState(classId, 'dice', {
                    type: 'dice',
                    active: true,
                    data: { rolling: false, numDice, results: finalResults }
                });
            }
        }, 1000);
    };

    const total = results.reduce((a, b) => a + b, 0);

    return (
        <main className="min-h-screen p-8 transition-colors duration-300 bg-slate-900 flex flex-col items-center justify-center">
            <HostMenu currentPage="Dice" classId={classId || undefined} />

            <div className="glass-card p-8 flex flex-col items-center animate-fade-in max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-white mb-6">Dice Roller</h1>

                {/* Controls */}
                <div className="w-full mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between text-white mb-2 font-bold">
                        <span>Number of Dice</span>
                        <span>{numDice}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={numDice}
                        onChange={(e) => {
                            const n = parseInt(e.target.value);
                            setNumDice(n);
                            const newResults = Array.from({ length: n }, () => 1);
                            setResults(newResults);

                            if (classId) {
                                updateToolState(classId, 'dice', {
                                    type: 'dice',
                                    active: true,
                                    data: { rolling: false, numDice: n, results: newResults }
                                });
                            }
                        }}
                        disabled={rolling}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {/* Dice Grid */}
                <div className="flex flex-wrap justify-center gap-12 mb-12 min-h-[160px] perspective-[1000px] py-8">
                    {results.map((res, idx) => (
                        <Dice3D key={idx} value={res} rolling={rolling} size={100} />
                    ))}
                </div>

                {/* Total */}
                {numDice > 1 && (
                    <div className="mb-8 text-center">
                        <div className="text-gray-400 text-sm uppercase tracking-wider font-bold">Total</div>
                        <div className="text-4xl font-black text-white">{total}</div>
                    </div>
                )}

                <Button variant="primary" size="lg" onClick={roll} disabled={rolling} className="w-full max-w-md">
                    {rolling ? 'Rolling...' : `Roll ${numDice} Dice`}
                </Button>

                <Button
                    variant="secondary"
                    className="mt-4 w-full max-w-md bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                    onClick={() => {
                        // Cleanup is handled by useEffect on unmount
                        router.push(`/dashboard/class?id=${classId}`);
                    }}
                >
                    ← Back to Class
                </Button>
            </div>
        </main>
    );
}

export default function DicePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
            <DiceContent />
        </Suspense>
    );
}
