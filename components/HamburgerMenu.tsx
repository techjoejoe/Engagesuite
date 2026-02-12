'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HamburgerMenu({ currentPage = '' }: { currentPage?: string }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const features = [
        { name: 'PicPick', icon: '📸', path: '/picpick/admin', color: 'bg-cyan-500' },
        { name: 'Randomizer', icon: '🎡', path: '/host/randomizer', color: 'bg-orange-500' },
        { name: 'LiveVote', icon: '📊', path: '/host/poll/create', color: 'bg-green-500' },
        { name: 'QuizBattle', icon: '⚡', path: '/host/quizbattle', color: 'bg-red-500' },
        { name: 'Tickr', icon: '⏱️', path: '/host/tickr/launch', color: 'bg-orange-600' },
        { name: 'WordStorm', icon: '☁️', path: '/host/wordstorm/launch', color: 'bg-blue-500' },
    ];

    const handleNavigate = (path: string) => {
        const classId = new URLSearchParams(window.location.search).get('classId') || 'default';
        const fullPath = path.includes('?') ? path : `${path}?classId=${classId}`;
        router.push(fullPath);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 right-4 w-12 h-12 bg-slate-800 border-2 border-indigo-500 rounded-full shadow-xl flex flex-col items-center justify-center gap-1 z-[1001] hover:scale-110 transition-all duration-300 focus:outline-none"
            >
                <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
                <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>

            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] animate-fade-in"
                />
            )}

            <div
                className={`fixed top-0 right-0 w-80 h-full bg-slate-900 border-l border-white/10 shadow-2xl z-[1000] transition-transform duration-300 ease-in-out overflow-y-auto p-6 pt-20 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <h2 className="text-2xl font-bold text-white mb-6">
                    Quick Navigate
                </h2>

                <div className="flex flex-col gap-4">
                    {features.map((feature) => (
                        <button
                            key={feature.name}
                            onClick={() => handleNavigate(feature.path)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:bg-white/10 ${currentPage === feature.name ? 'bg-white/10 border-indigo-500' : 'bg-white/5 border-white/10'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white shrink-0 ${feature.color}`}>
                                {feature.icon}
                            </div>
                            <span className="text-base font-semibold text-white">
                                {feature.name}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center text-white/40 text-sm">
                    Trainer-Toolbox v2.0
                </div>
            </div>
        </>
    );
}
