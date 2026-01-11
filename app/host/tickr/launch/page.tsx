'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HamburgerMenu from '@/components/HamburgerMenu';
import { createTimer } from '@/lib/tickr';
import { onAuthStateChange } from '@/lib/auth';

function LaunchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Debug
        console.log('Tickr launch page loaded with classId:', classId);

        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                console.log('Tickr launch: No user, redirecting to login');
                router.push('/login');
                return;
            }

            if (!classId) {
                console.error('Tickr launch: No classId provided');
                setError('No class selected. Please launch Tickr from your Class Dashboard.');
                return;
            }

            try {
                console.log('Tickr launch: Creating timer for class:', classId);
                const timerId = await createTimer(classId, user.uid);
                console.log('Tickr launch: Timer created successfully:', timerId);
                router.replace(`/host/tickr/${timerId}`);
            } catch (error: any) {
                console.error('Tickr launch: Failed to create Timer:', error);
                setError(`Failed to create timer: ${error.message || 'Unknown error'}`);
            }
        });
        return () => unsubscribe();
    }, [classId, router]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white p-6 text-center">
                <HamburgerMenu currentPage="Tickr" />
                <div className="text-[#F472B6] text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold mb-2 text-gradient-rainbow">Launch Failed</h1>
                <p className="text-[#94A3B8] mb-6">{error}</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#7C3AED]/30"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
            <HamburgerMenu currentPage="Tickr" />
            <div className="flex flex-col items-center gap-4">
                <div className="text-6xl animate-bounce">⏰</div>
                <div className="text-2xl text-gradient-rainbow font-bold animate-pulse">Starting Tickr...</div>
                <div className="text-[#94A3B8]">Get ready to manage time!</div>
            </div>
        </div>
    );
}

export default function TickrLaunchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white"><div className="animate-spin text-4xl">⏰</div></div>}>
            <LaunchContent />
        </Suspense>
    );
}
