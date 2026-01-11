'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { onTimerChange } from '@/lib/tickr';

export default function TickrPlayPage() {
    const params = useParams();
    const id = params.id as string;
    const [timer, setTimer] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Listen to timer changes
    useEffect(() => {
        const unsubscribe = onTimerChange(id, (newTimer) => {
            setTimer(newTimer);
            if (newTimer.status === 'stopped' || newTimer.status === 'paused') {
                setTimeLeft(newTimer.duration);
                setIsFinished(false);
            }
        });
        return () => unsubscribe();
    }, [id]);

    // Countdown logic
    useEffect(() => {
        if (!timer || timer.status !== 'running') return;

        const interval = setInterval(() => {
            if (timer.endTime) {
                const end = timer.endTime.toDate ? timer.endTime.toDate() : new Date(timer.endTime);
                const now = new Date();
                const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
                setTimeLeft(diff);

                if (diff <= 0) {
                    setIsFinished(true);
                    clearInterval(interval);
                } else {
                    setIsFinished(false);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [timer]);

    // Alert logic
    useEffect(() => {
        if (isFinished) {
            // Vibrate
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }

            // Play sound
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(500, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
                    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.4);

                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.5);
                }
            } catch (e) {
                console.error('Audio play failed', e);
            }
        }
    }, [isFinished]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Dynamic Color Logic - VIBRANT
    const getTimerColor = () => {
        if (isFinished) return 'text-[#F472B6] animate-pulse';
        if (!timer || timer.status === 'stopped') return 'text-white';

        const totalDuration = timer.duration || 1;
        const percentage = timeLeft / totalDuration;

        if (percentage > 0.5) return 'text-[#22D3EE]'; // Cyan - plenty of time
        if (percentage > 0.2) return 'text-[#FBBF24]'; // Gold - warning
        return 'text-[#F472B6]'; // Coral - urgent
    };

    const getTimerGlow = () => {
        if (isFinished) return 'drop-shadow-[0_0_80px_rgba(244,114,182,0.7)]';
        if (!timer || timer.status === 'stopped') return 'drop-shadow-[0_0_40px_rgba(167,139,250,0.3)]';

        const totalDuration = timer.duration || 1;
        const percentage = timeLeft / totalDuration;

        if (percentage > 0.5) return 'drop-shadow-[0_0_60px_rgba(34,211,238,0.6)]';
        if (percentage > 0.2) return 'drop-shadow-[0_0_60px_rgba(251,191,36,0.6)]';
        return 'drop-shadow-[0_0_80px_rgba(244,114,182,0.7)]';
    };

    if (!timer) return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin text-6xl">⏰</div>
                <div className="text-xl text-[#A78BFA] animate-pulse">Connecting to Timer...</div>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects - Vibrant */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000 ${isFinished ? 'bg-[#F472B6]/40 animate-pulse' : 'bg-[#7C3AED]/30'}`}></div>
                <div className={`absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000 ${isFinished ? 'bg-[#FBBF24]/30 animate-pulse' : 'bg-[#06B6D4]/25'}`}></div>
                <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[30%] h-[30%] rounded-full blur-[150px] bg-[#F472B6]/15"></div>
            </div>

            <div className="relative z-10 text-center w-full max-w-4xl mx-auto">
                <div className="glass-card p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md">
                    <div className="text-2xl text-[#A78BFA] mb-8 uppercase tracking-widest font-bold font-mono">
                        ⏰ {timer.label || 'Timer'}
                    </div>

                    <div className={`font-mono font-bold tracking-tighter tabular-nums leading-none transition-all duration-300 text-[25vw] md:text-[200px] select-none ${getTimerColor()} ${getTimerGlow()}`}>
                        {formatTime(timeLeft)}
                    </div>

                    <div className="mt-12">
                        {isFinished ? (
                            <div className="text-4xl md:text-6xl font-black text-[#F472B6] animate-bounce uppercase tracking-wider flex items-center justify-center gap-4">
                                <span>🎉</span>
                                <span>Time's Up!</span>
                                <span>🎉</span>
                            </div>
                        ) : timer.status === 'running' ? (
                            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#06B6D4]/20 text-[#22D3EE] border border-[#06B6D4]/40 animate-pulse font-bold tracking-wider text-xl shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                <span className="w-4 h-4 rounded-full bg-[#22D3EE] animate-ping" />
                                ⚡ RUNNING
                            </div>
                        ) : timer.status === 'paused' ? (
                            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40 font-bold tracking-wider text-xl shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                ⏸️ PAUSED
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40 font-bold tracking-wider text-xl shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                                ⏳ WAITING FOR HOST
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
