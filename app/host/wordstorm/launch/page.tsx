'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HamburgerMenu from '@/components/HamburgerMenu';
import { createWordStorm } from '@/lib/wordstorm';
import { onAuthStateChange } from '@/lib/auth';
import ClassSelector from '@/components/ClassSelector';

function LaunchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    useEffect(() => {
        if (!classId) return;
        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }
            try {
                const wordStormId = await createWordStorm(classId, user.uid);
                router.replace(`/host/wordstorm/${wordStormId}`);
            } catch (error: any) {
                console.error('WordStorm launch failed:', error);
                alert(`Failed to create Word Storm: ${error.message || 'Unknown error'}`);
                router.push('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [classId, router]);

    if (!classId) {
        return <ClassSelector toolName="WordStorm" toolIcon="🌪️" />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
            <HamburgerMenu currentPage="WordStorm" />
            <div className="flex flex-col items-center gap-4">
                <div className="text-6xl animate-bounce">🌪️</div>
                <div className="text-2xl font-bold animate-pulse">Starting WordStorm...</div>
                <div className="text-white/60">Get ready to brainstorm!</div>
            </div>
        </div>
    );
}

export default function WordStormLaunchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white"><div className="animate-spin text-4xl">🌪️</div></div>}>
            <LaunchContent />
        </Suspense>
    );
}
