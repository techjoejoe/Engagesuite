'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { onAuthStateChange } from '@/lib/auth';
import { redeemLeaderGridCode } from '@/lib/leadergrid';
import Button from '@/components/Button';
import Link from 'next/link';

function RedeemContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const codeParam = searchParams.get('code');

    const [user, setUser] = useState<any>(null);
    const [code, setCode] = useState(codeParam || '');
    const [redeeming, setRedeeming] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const processedRef = React.useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => {
            if (!u) {
                // If not logged in, redirect to login with return URL
                const returnUrl = encodeURIComponent(`/redeem?code=${codeParam || ''}`);
                router.push(`/login?redirect=${returnUrl}`);
            } else {
                setUser(u);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, [router, codeParam]); // Keep dependencies as codeParam affects redirect URL

    const performRedemption = async (uid: string, codeToRedeem: string) => {
        if (!codeToRedeem.trim()) return;

        setRedeeming(true);
        setMessage(null);

        try {
            const lastClassId = localStorage.getItem('lastActiveClassId') || undefined;
            const result = await redeemLeaderGridCode(uid, codeToRedeem.trim(), lastClassId);

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Points redeemed!' });
                setCode('');
            } else {
                setMessage({ type: 'error', text: result.message || 'Failed to redeem code.' });
            }
        } catch (error: any) {
            console.error('Redeem error:', error);
            setMessage({ type: 'error', text: error.message || 'An error occurred.' });
        } finally {
            setRedeeming(false);
        }
    };

    // Auto-redeem if code param exists
    useEffect(() => {
        if (!authLoading && user && codeParam && !processedRef.current) {
            processedRef.current = true;
            performRedemption(user.uid, codeParam);
        }
    }, [authLoading, user, codeParam]);

    const handleManualRedeem = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            performRedemption(user.uid, code);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-transparent text-white/60 animate-pulse">Checking authentication...</div>;
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-transparent text-white/60">Redirecting to login...</div>;
    }

    // Success State
    if (message?.type === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl border border-white/10 dark:border-slate-700 text-center animate-scale-in">
                    <div className="text-6xl mb-6">🎉</div>
                    <h1 className="text-3xl font-bold text-white dark:text-white mb-4">Success!</h1>
                    <p className="text-lg text-green-600 dark:text-green-400 font-medium mb-8">
                        {message.text}
                    </p>
                    <Link href="/student/dashboard">
                        <Button variant="primary" className="w-full py-4 text-lg">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl border border-white/10 dark:border-slate-700">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎁</div>
                    <h1 className="text-2xl font-bold text-white dark:text-white mb-2">Redeem Code</h1>
                    <p className="text-white/60 dark:text-gray-400">
                        {redeeming ? 'Processing your code...' : 'Enter your code below to earn points.'}
                    </p>
                </div>

                {redeeming ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <form onSubmit={handleManualRedeem} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Enter Code (e.g. X7K9P)"
                                className="w-full p-4 text-center text-2xl font-mono tracking-widest rounded-xl border-2 border-white/20 dark:border-slate-600 bg-transparent text-white dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all uppercase"
                                disabled={redeeming}
                            />
                        </div>

                        {message?.type === 'error' && (
                            <div className="p-4 rounded-xl text-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 animate-shake">
                                {message.text}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-lg"
                            disabled={redeeming || !code.trim()}
                        >
                            Redeem Points
                        </Button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link href="/student/dashboard" className="text-sm text-white/60 hover:text-white dark:hover:text-white transition-colors">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function RedeemPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-transparent text-white/60">Loading...</div>}>
            <RedeemContent />
        </Suspense>
    );
}
