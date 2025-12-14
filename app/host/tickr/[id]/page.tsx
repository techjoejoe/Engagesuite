'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getTimer, onTimerChange, startTimer, pauseTimer, updateTimer } from '@/lib/tickr';
import { updateClassActivity } from '@/lib/classes';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';
import TimerSettingsModal from '@/components/tickr/TimerSettingsModal';

export default function TickrHostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [timer, setTimer] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [joinUrl, setJoinUrl] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setJoinUrl(`${window.location.origin}/play/tickr/${id}`);
        }
    }, [id]);

    // Listen to timer changes
    useEffect(() => {
        const unsubscribe = onTimerChange(id, (newTimer) => {
            setTimer(newTimer);
            if (newTimer.status === 'stopped') {
                // When stopped, we rely on local state updates for "next" duration
                // unless we just loaded, in which case we sync
            } else if (newTimer.status === 'paused') {
                setTimeLeft(newTimer.duration);
                setIsFinished(false);
            }
        });
        return () => unsubscribe();
    }, [id]);

    const [hasSyncedActivity, setHasSyncedActivity] = useState(false);

    // Initial sync and Class Activity Update
    useEffect(() => {
        if (timer && !hasSyncedActivity) {
            if (timer.status === 'stopped' && timeLeft === 0 && timer.duration > 0) {
                setTimeLeft(timer.duration);
            }
            // Sync class activity
            if (timer.classId) {
                updateClassActivity(timer.classId, { type: 'tickr', id: id });
                setHasSyncedActivity(true);
            }
        } else if (timer && timer.status === 'stopped' && timeLeft === 0 && timer.duration > 0) {
            // Keep this logic for stopped timer updates if needed, but separate from activity sync
            setTimeLeft(timer.duration);
        }
    }, [timer, id, hasSyncedActivity]);

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

    const handleStart = async () => {
        let duration = timeLeft;
        if (isFinished) {
            // Reset to original duration if finished
            duration = timer.duration;
            setIsFinished(false);
        }
        await startTimer(id, duration);
    };

    const handlePause = async () => {
        await pauseTimer(id, timeLeft);
    };

    const handleReset = async () => {
        // Reset to the last set duration
        await updateTimer(id, {
            status: 'stopped',
            endTime: null,
            pausedAt: null
        });
        setTimeLeft(timer.duration);
        setIsFinished(false);
    };

    const handleSetTime = async (seconds: number) => {
        setTimeLeft(seconds);
        await updateTimer(id, {
            duration: seconds,
            status: 'stopped',
            endTime: null,
            pausedAt: null
        });
        setIsFinished(false);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Dynamic Color Logic
    const getTimerColor = () => {
        if (isFinished) return 'text-red-500 animate-pulse';
        if (!timer || timer.status === 'stopped') return 'text-white';

        const totalDuration = timer.duration || 1;
        const percentage = timeLeft / totalDuration;

        if (percentage > 0.5) return 'text-emerald-400';
        if (percentage > 0.2) return 'text-amber-400';
        return 'text-rose-500';
    };

    if (!timer) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Loading...</div>;

    return (
        <main className="min-h-screen bg-[#0a0a0f] text-white font-display overflow-hidden relative flex flex-col">
            <TimerSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSetTime}
                initialDuration={timeLeft}
            />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-colors duration-1000 ${isFinished ? 'bg-red-600/20' : 'bg-indigo-600/10'}`}></div>
                <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-colors duration-1000 ${isFinished ? 'bg-red-600/20' : 'bg-purple-600/10'}`}></div>
            </div>

            {/* Header */}
            <div className="p-6 flex justify-between items-start z-10 w-full">
                <div className="flex items-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                        onClick={() => {
                            if (timer?.classId) updateClassActivity(timer.classId, { type: 'none' });
                            router.push('/dashboard/class?id=' + timer.classId);
                        }}
                    >
                        ← Back to Class
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            Tickr
                        </h1>
                    </div>
                </div>

                <div className="flex gap-4">
                    {/* Join info removed as per request */}
                </div>
            </div>

            {/* Main Timer Display */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-0 w-full min-h-[50vh]">
                <div
                    className={`font-mono font-bold tracking-tighter tabular-nums leading-none transition-all duration-300 ${getTimerColor()} drop-shadow-2xl cursor-pointer hover:scale-105 active:scale-95`}
                    style={{ fontSize: '25vw', textShadow: '0 0 100px rgba(0,0,0,0.5)' }}
                    onClick={() => timer.status === 'stopped' && setIsSettingsOpen(true)}
                    title={timer.status === 'stopped' ? "Click to Edit Time" : ""}
                >
                    {formatTime(timeLeft)}
                </div>
                <div className="text-xl sm:text-3xl text-white/40 mt-4 uppercase tracking-[0.2em] font-bold animate-fade-in flex items-center gap-3">
                    {isFinished ? 'TIME IS UP!' : timer.status === 'running' ? 'Time Remaining' : timer.status === 'paused' ? 'Timer Paused' : (
                        <button onClick={() => setIsSettingsOpen(true)} className="hover:text-white transition-colors flex items-center gap-2">
                            <Icons.Settings className="w-6 h-6" />
                            <span>Click Time to Edit</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Controls Panel */}
            <div className={`fixed bottom-0 left-0 right-0 z-20 transition-transform duration-500 ease-out ${showControls ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'}`}>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
                    {/* Toggle Handle */}
                    <div
                        className="w-full flex justify-center pb-2 cursor-pointer group"
                        onClick={() => setShowControls(!showControls)}
                    >
                        <div className="w-12 h-1.5 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors shadow-lg"></div>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* Main Actions */}
                        <div className="flex justify-center items-center gap-6">
                            <Button
                                variant="glass"
                                size="lg"
                                onClick={handleReset}
                                className="h-20 w-20 !rounded-full !p-0 flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md shadow-xl transition-all hover:scale-105 active:scale-95"
                                title="Reset"
                            >
                                <Icons.Refresh className="w-6 h-6" />
                                <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Reset</span>
                            </Button>

                            {timer.status === 'running' ? (
                                <button
                                    onClick={handlePause}
                                    className="h-24 w-24 bg-rose-500/20 hover:bg-rose-500/30 backdrop-blur-md rounded-full flex flex-col items-center justify-center gap-1 text-white shadow-lg shadow-rose-500/10 hover:scale-105 active:scale-95 transition-all border border-rose-500/30"
                                >
                                    <Icons.Pause className="w-8 h-8" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Pause</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleStart}
                                    className="h-24 w-24 bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-md rounded-full flex flex-col items-center justify-center gap-1 text-white shadow-lg shadow-emerald-500/10 hover:scale-105 active:scale-95 transition-all border border-emerald-500/30"
                                >
                                    <Icons.Play className="w-8 h-8 ml-1" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Start</span>
                                </button>
                            )}

                            <Button
                                variant="glass"
                                size="lg"
                                onClick={() => setIsSettingsOpen(true)}
                                className="h-20 w-20 !rounded-full !p-0 flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md shadow-xl transition-all hover:scale-105 active:scale-95"
                                title="Edit"
                                disabled={timer.status === 'running'}
                            >
                                <Icons.Settings className="w-6 h-6" />
                                <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Edit</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
