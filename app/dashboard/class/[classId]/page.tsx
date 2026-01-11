'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * This page redirects to the main class dashboard using query params.
 * The canonical URL is /dashboard/class?id=classId
 */
export default function ClassDashboardRedirect() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    useEffect(() => {
        if (classId) {
            router.replace(`/dashboard/class?id=${classId}`);
        } else {
            router.replace('/dashboard');
        }
    }, [classId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="animate-pulse">Redirecting...</div>
        </div>
    );
}
