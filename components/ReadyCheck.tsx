'use client';

import React, { useEffect, useState } from 'react';

export default function ReadyCheck({ onComplete }: { onComplete: () => void }) {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count === 0) {
            onComplete();
            return;
        }

        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, onComplete]);

    if (count === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="text-center">
                <div key={count} className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_1]">
                    {count}
                </div>
                <div className="text-2xl font-bold text-white/80 uppercase tracking-[0.5em] mt-8 animate-pulse">
                    Get Ready
                </div>
            </div>
        </div>
    );
}
