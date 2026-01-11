"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const AlbumPlayerContent = dynamic(() => import('@/components/AlbumPlayerContent'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Workbook...</div>
});

function WorkbookWrapper() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) return <div className="p-10 text-center text-red-500">Error: No Workbook ID provided.</div>;

    return <AlbumPlayerContent id={id} />;
}

export default function WorkbookPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>}>
            <WorkbookWrapper />
        </Suspense>
    );
}
