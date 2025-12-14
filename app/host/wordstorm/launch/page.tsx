'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import HamburgerMenu from '@/components/HamburgerMenu';
import { createWordStorm } from '@/lib/wordstorm';
import { onAuthStateChange } from '@/lib/auth';

function LaunchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                console.log('WordStorm launch: No user, redirecting to login');
                router.push('/login');
                return;
            }

            if (!classId) {
                console.error('WordStorm launch: No classId provided');
                alert('Error: No class selected. Please try again from the class dashboard.');
                router.push('/dashboard');
                return;
            }

            try {
                console.log('WordStorm launch: Creating session for class:', classId);
                const wordStormId = await createWordStorm(classId, user.uid);
                console.log('WordStorm launch: Session created successfully:', wordStormId);
                router.replace(`/host/wordstorm/${wordStormId}`);
            } catch (error: any) {
                console.error('WordStorm launch: Failed to create session:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                });
                alert(`Failed to create Word Storm: ${error.message || 'Unknown error'}`);
                router.push('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [classId, router]);

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
            <HamburgerMenu currentPage="WordStorm" />
            <div className="animate-pulse">Creating Word Storm...</div>
        </div>
    );
}

export default function WordStormLaunchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LaunchContent />
        </Suspense>
    );
}
