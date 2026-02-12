"use client";

import dynamic from 'next/dynamic';

const AlbumPlayerContent = dynamic(() => import('@/components/AlbumPlayerContent'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center bg-transparent text-white/60">Loading Workbook...</div>
});

export default function AlbumPlayerPage() {
    return <AlbumPlayerContent />;
}
