'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import Coin3D from '@/components/Coin3D';

import { updateToolState } from '@/lib/tools';

import { Suspense } from 'react';

function CoinContent() {
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');
    const router = useRouter();
    const [flipping, setFlipping] = useState(false);
    const [result, setResult] = useState<'Heads' | 'Tails'>('Heads');

    // Activate tool on mount
    useEffect(() => {
        if (classId) {
            updateToolState(classId, 'coin', {
                type: 'coin',
                active: true,
                data: { flipping: false, result }
            });
        }

        return () => {
            if (classId) {
                updateToolState(classId, 'coin', {
                    type: 'coin',
                    active: false,
                    data: { flipping: false, result }
                });
            }
        };
    }, [classId]);

    const flip = () => {
        setFlipping(true);
        // Sync flipping state
        if (classId) {
            updateToolState(classId, 'coin', {
                type: 'coin',
                active: true,
                data: { flipping: true, result }
            });
        }

        const interval = setInterval(() => {
            setResult(Math.random() > 0.5 ? 'Heads' : 'Tails');
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            const finalResult = Math.random() > 0.5 ? 'Heads' : 'Tails';
            setResult(finalResult);
            setFlipping(false);

            // Sync final result
            if (classId) {
                updateToolState(classId, 'coin', {
                    type: 'coin',
                    active: true,
                    data: { flipping: false, result: finalResult }
                });
            }
        }, 1000);
    };

    return (
        <main className="min-h-screen p-8 transition-colors duration-300 bg-slate-900 flex flex-col items-center justify-center">
            <HostMenu currentPage="Coin" classId={classId || undefined} />

            <div className="glass-card p-12 flex flex-col items-center animate-fade-in max-w-md w-full">
                <h1 className="text-3xl font-bold text-white mb-8">Coin Flipper</h1>

                <div className="mb-12 py-8">
                    <Coin3D result={result} flipping={flipping} size={200} />
                </div>

                <Button variant="primary" size="lg" onClick={flip} disabled={flipping} className="w-full">
                    {flipping ? 'Flipping...' : 'Flip Coin'}
                </Button>

                <Button
                    variant="secondary"
                    className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
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

export default function CoinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
            <CoinContent />
        </Suspense>
    );
}
