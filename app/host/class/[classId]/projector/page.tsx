'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getClass, onClassChange, Class } from '@/lib/classes';

export default function ProjectorPage() {
    const params = useParams();
    const classId = params.classId as string;
    const [classData, setClassData] = useState<Class | null>(null);
    const [joinUrl, setJoinUrl] = useState('');

    useEffect(() => {
        const unsubscribe = onClassChange(classId, (data) => {
            if (data) {
                setClassData(data);
                if (typeof window !== 'undefined') {
                    setJoinUrl(`${window.location.origin}/join`);
                }
            }
        });
        return () => unsubscribe();
    }, [classId]);

    if (!classData) return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-indigo-400 font-medium animate-pulse">Loading Projector View...</div>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen w-full relative overflow-hidden font-sans text-white flex flex-col items-center justify-center bg-[#0a0a0f]">
            {/* Premium Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0a0a0f] to-purple-950"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-6xl px-8 flex flex-col items-center gap-12">

                {/* Class Title */}
                <h1 className="text-6xl md:text-7xl font-black text-center text-white drop-shadow-2xl tracking-tight leading-tight">
                    {classData.name}
                </h1>

                {/* Main Glass Card */}
                <div className="w-full bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20 relative overflow-hidden">

                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>

                    {/* Left: QR Code Section */}
                    <div className="relative group shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl opacity-50 blur-lg group-hover:opacity-75 transition duration-500"></div>
                        <div className="bg-white p-6 rounded-2xl relative z-10 shadow-xl">
                            <QRCodeSVG value={joinUrl} size={300} level="H" />
                            <div className="mt-4 text-center">
                                <span className="inline-block px-4 py-1 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-full">
                                    Scan to Join
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8">

                        {/* Branding */}
                        <div>
                            <div className="text-5xl font-black italic tracking-tighter flex items-center gap-2 drop-shadow-lg">
                                <span className="text-white">Quiz</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Battle</span>
                            </div>
                            <div className="text-sm font-bold text-indigo-200/70 mt-2 uppercase tracking-[0.3em] pl-1">
                                Audience Engagement
                            </div>
                        </div>

                        {/* Status Message */}
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                                <span className="text-base font-semibold text-indigo-300 tracking-wide">Session Active</span>
                            </div>
                            <div className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg leading-tight">
                                Beginning soon.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Instructions Bar */}
            <div className="absolute bottom-12 z-20 w-full flex justify-center px-4">
                <div className="bg-black/60 backdrop-blur-xl rounded-full px-10 py-5 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl text-gray-400 font-light">Go to</span>
                        <span className="text-3xl font-bold text-white tracking-tight">trainer-toolbox.com/join</span>
                    </div>
                    <div className="hidden md:block h-8 w-px bg-white/20"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl text-gray-400 font-light">Code</span>
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-mono tracking-widest">
                            {classData.code}
                        </span>
                    </div>
                </div>
            </div>
        </main>
    );
}
