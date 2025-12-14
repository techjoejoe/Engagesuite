'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HamburgerMenu from '@/components/HamburgerMenu';
import { createTimer } from '@/lib/tickr';
import { onAuthStateChange } from '@/lib/auth';

function LaunchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    useEffect(() => {
        // Debug: Show what classId we're working with
        console.log('Tickr launch page loaded with classId:', classId);
        if (classId) {
            // alert(`Tickr launching with classId: ${classId}`);
        }

        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                console.log('Tickr launch: No user, redirecting to login');
                router.push('/login');
                return;
            }

            if (!classId) {
                console.error('Tickr launch: No classId provided');
                alert('Error: No class selected. Please try again from the class dashboard.');
                router.push('/dashboard');
                return;
            }

            try {
                console.log('Tickr launch: Creating timer for class:', classId);
                const timerId = await createTimer(classId, user.uid);
                console.log('Tickr launch: Timer created successfully:', timerId);
                router.replace(`/host/tickr/${timerId}`);
            } catch (error: any) {
                console.error('Tickr launch: Failed to create Timer:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                });
                alert(`Failed to create timer: ${error.message || 'Unknown error'}`);
                router.push('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [classId, router]);

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
            <HamburgerMenu currentPage="Tickr" />
            <div className="animate-pulse">Starting Tickr...</div>
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
