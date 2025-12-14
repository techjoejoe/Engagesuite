'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOutUser } from '@/lib/auth';


interface StudentMenuProps {
    currentPage?: string;
    className?: string;
    classId?: string;
}

export default function StudentMenu({ currentPage = '', className = '', classId }: StudentMenuProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        await signOutUser();
        router.push('/');
    };

    return (
        <>
            {/* Hamburger Button - Right Side */}
            {/* Hamburger Button - Right Side */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-4 right-4 w-12 h-12 bg-white dark:bg-slate-800 shadow-xl border-2 border-indigo-500 rounded-full flex flex-col items-center justify-center gap-1 z-[2000] hover:scale-110 transition-all duration-300 focus:outline-none ${className}`}
                aria-label="Menu"
            >
                <div className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <div className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
                <div className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] animate-fade-in"
                />
            )}

            {/* Slide-out Menu - Right Side */}
            <div
                className={`fixed top-0 right-0 w-80 h-full bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[2000] transition-transform duration-300 ease-in-out overflow-y-auto border-l border-white/10 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-white">
                            Student Menu
                        </h2>
                    </div>
                    <p className="text-sm text-gray-400">
                        Quick navigation
                    </p>
                </div>

                {/* Navigation */}
                <div className="p-6 space-y-2">
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Navigation
                        </h3>
                        <Link
                            href="/student/dashboard?view=leaderboard"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${currentPage === 'Dashboard'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">🏠</span>
                            <span className="font-medium">Dashboard</span>
                        </Link>
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${currentPage === 'Profile'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">👤</span>
                            <span className="font-medium">My Profile</span>
                        </Link>

                        {classId && (
                            <Link
                                href={`/play/class/${classId}?view=leaderboard&tab=class`}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">🏆</span>
                                <span className="font-medium">Leaderboards</span>
                            </Link>
                        )}
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Actions
                        </h3>
                        <Link
                            href="/join"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                        >
                            <span className="text-xl">🔑</span>
                            <span className="font-medium">Join Class</span>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 mt-auto bg-white/5">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all border border-red-500/20"
                    >
                        <span className="text-xl">🚪</span>
                        <span>Sign Out</span>
                    </button>
                </div>
            </div >
        </>
    );
}
