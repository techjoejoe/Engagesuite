'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';

interface TimerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (duration: number) => void;
    initialDuration: number;
}

export default function TimerSettingsModal({ isOpen, onClose, onSave, initialDuration }: TimerSettingsModalProps) {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [mode, setMode] = useState<'countdown' | 'countup'>('countdown');

    useEffect(() => {
        if (isOpen) {
            const h = Math.floor(initialDuration / 3600);
            const m = Math.floor((initialDuration % 3600) / 60);
            const s = initialDuration % 60;
            setHours(h);
            setMinutes(m);
            setSeconds(s);
        }
    }, [isOpen, initialDuration]);

    const handleSave = () => {
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        onSave(totalSeconds);
        onClose();
    };

    const increment = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, max: number = 99) => {
        setter(prev => (prev + 1 > max ? 0 : prev + 1));
    };

    const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, max: number = 99) => {
        setter(prev => (prev - 1 < 0 ? max : prev - 1));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card border border-[#7C3AED]/30 rounded-2xl w-full max-w-md shadow-2xl shadow-[#7C3AED]/20 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#7C3AED]/20 to-[#06B6D4]/20 p-4 flex justify-between items-center border-b border-white/10">
                    <h2 className="text-xl font-bold text-gradient-rainbow flex items-center gap-2">
                        ⏰ Edit Timer
                    </h2>
                    <button onClick={onClose} className="text-[#94A3B8] hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    {/* Mode Selection */}
                    <div className="flex gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${mode === 'countdown' ? 'border-[#22D3EE] bg-[#06B6D4]/20' : 'border-[#94A3B8]/40 group-hover:border-[#94A3B8]'}`}>
                                {mode === 'countdown' && <div className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]" />}
                            </div>
                            <span className={mode === 'countdown' ? 'text-[#22D3EE] font-bold' : 'text-[#94A3B8]'}>Countdown</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                            <div className="w-5 h-5 rounded-full border-2 border-[#94A3B8]/20 flex items-center justify-center">
                            </div>
                            <span className="text-[#94A3B8]/50">Count till (Coming Soon)</span>
                        </label>
                    </div>

                    {/* Time Inputs */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Hours */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-[#A78BFA] font-bold uppercase tracking-wider">Hours</label>
                            <div className="flex items-center bg-[#7C3AED]/10 rounded-xl border border-[#7C3AED]/30 overflow-hidden">
                                <button onClick={() => decrement(setHours, hours)} className="p-3 hover:bg-[#7C3AED]/20 text-[#A78BFA] hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <input
                                    type="number"
                                    value={hours.toString().padStart(2, '0')}
                                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-transparent text-center font-mono text-xl font-bold focus:outline-none py-2 text-white"
                                />
                                <button onClick={() => increment(setHours, hours)} className="p-3 hover:bg-[#7C3AED]/20 text-[#A78BFA] hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Minutes */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-[#22D3EE] font-bold uppercase tracking-wider">Minutes</label>
                            <div className="flex items-center bg-[#06B6D4]/10 rounded-xl border border-[#06B6D4]/30 overflow-hidden">
                                <button onClick={() => decrement(setMinutes, minutes, 59)} className="p-3 hover:bg-[#06B6D4]/20 text-[#22D3EE] hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <input
                                    type="number"
                                    value={minutes.toString().padStart(2, '0')}
                                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    className="w-full bg-transparent text-center font-mono text-xl font-bold focus:outline-none py-2 text-white"
                                />
                                <button onClick={() => increment(setMinutes, minutes, 59)} className="p-3 hover:bg-[#06B6D4]/20 text-[#22D3EE] hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Seconds */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-[#FBBF24] font-bold uppercase tracking-wider">Seconds</label>
                            <div className="flex items-center bg-[#FBBF24]/10 rounded-xl border border-[#FBBF24]/30 overflow-hidden">
                                <button onClick={() => decrement(setSeconds, seconds, 59)} className="p-3 hover:bg-[#FBBF24]/20 text-[#FBBF24] hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <input
                                    type="number"
                                    value={seconds.toString().padStart(2, '0')}
                                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    className="w-full bg-transparent text-center font-mono text-xl font-bold focus:outline-none py-2 text-white"
                                />
                                <button onClick={() => increment(setSeconds, seconds, 59)} className="p-3 hover:bg-[#FBBF24]/20 text-[#FBBF24] hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gradient-to-r from-[#7C3AED]/10 to-[#06B6D4]/10 border-t border-white/10 flex justify-end gap-3">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button variant="secondary" onClick={handleSave}>⏰ Set Timer</Button>
                </div>
            </div>
        </div>
    );
}
