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
            <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white p-6 text-center">
                <HamburgerMenu currentPage="Tickr" />
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold mb-2">Launch Failed</h1>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white">
            <HamburgerMenu currentPage="Tickr" />
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <div className="animate-pulse text-xl">Starting Tickr...</div>
        </div>
    );
}

export default function TickrLaunchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LaunchContent />
        </Suspense>
    );
}
