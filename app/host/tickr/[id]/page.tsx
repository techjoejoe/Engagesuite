'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getTimer, onTimerChange, startTimer, pauseTimer, updateTimer } from '@/lib/tickr';
import { updateClassActivity } from '@/lib/classes';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';
import TimerSettingsModal from '@/components/tickr/TimerSettingsModal';

export default function TickrHostPage() {
    const params = useParams();
    const id = params.id as string;
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
        if (!timer) return;

        if (timer.status === 'stopped' && timer.duration > 0) {
            // Always sync local time with stored duration when stopped
            // This ensures multi-tab/device consistency
            if (timeLeft !== timer.duration) {
                setTimeLeft(timer.duration);
            }
        } else if (timer.status === 'paused') {
            setTimeLeft(timer.duration);
            setIsFinished(false);
        }

        // Sync class activity
        if (timer.classId && !hasSyncedActivity) {
            updateClassActivity(timer.classId, { type: 'tickr', id: id });
            setHasSyncedActivity(true);
        }
    }, [timer, id, hasSyncedActivity, timeLeft]);

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
        try {
            let duration = timeLeft;
            if (isFinished || duration <= 0) {
                // Reset to original duration if finished or zero
                duration = timer.duration > 0 ? timer.duration : 300;
                setIsFinished(false);
            }
            await startTimer(id, duration);
        } catch (error) {
            console.error('Failed to start timer:', error);
            alert('Failed to start timer. Please try again.');
        }
    };

    const handlePause = async () => {
        try {
            await pauseTimer(id, timeLeft);
        } catch (error) {
            console.error('Failed to pause timer:', error);
        }
    };

    const handleReset = async () => {
        try {
            // Reset to the last set duration
            await updateTimer(id, {
                status: 'stopped',
                endTime: null,
                pausedAt: null
            });
            setTimeLeft(timer.duration);
            setIsFinished(false);
        } catch (error) {
            console.error('Failed to reset timer:', error);
        }
    };

    const handleSetTime = async (seconds: number) => {
        if (seconds <= 0) {
            alert('Please set a duration greater than 0.');
            return;
        }
        try {
            console.log('Setting timer to seconds:', seconds);
            setTimeLeft(seconds);
            await updateTimer(id, {
                duration: seconds,
                status: 'stopped',
                endTime: null,
                pausedAt: null
            });
            setIsFinished(false);
        } catch (error) {
            console.error('Failed to set time:', error);
            alert('Failed to save timer settings.');
        }
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
        if (isFinished) return 'drop-shadow-[0_0_60px_rgba(244,114,182,0.6)]';
        if (!timer || timer.status === 'stopped') return 'drop-shadow-[0_0_40px_rgba(167,139,250,0.3)]';

        const totalDuration = timer.duration || 1;
        const percentage = timeLeft / totalDuration;

        if (percentage > 0.5) return 'drop-shadow-[0_0_60px_rgba(34,211,238,0.5)]';
        if (percentage > 0.2) return 'drop-shadow-[0_0_60px_rgba(251,191,36,0.5)]';
        return 'drop-shadow-[0_0_60px_rgba(244,114,182,0.6)]';
    };

    if (!timer) return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin text-6xl">⏰</div>
                <div className="text-xl text-[#A78BFA] animate-pulse">Loading Tickr...</div>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen text-white font-display overflow-hidden relative flex flex-col">
            <TimerSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSetTime}
                initialDuration={timeLeft}
            />

            {/* Background Effects - Vibrant & Fun */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-all duration-1000 ${isFinished ? 'bg-[#F472B6]/30 animate-pulse' : 'bg-[#7C3AED]/25'}`}></div>
                <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-all duration-1000 ${isFinished ? 'bg-[#FBBF24]/20 animate-pulse' : 'bg-[#06B6D4]/20'}`}></div>
                <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[40%] h-[40%] rounded-full blur-[200px] bg-[#F472B6]/10"></div>
            </div>

            {/* Header */}
            <div className="p-6 flex justify-between items-start z-10 w-full">
                <div className="flex items-center gap-4">
                    <Button
                        variant="glass"
                        size="sm"
                        onClick={() => {
                            if (timer?.classId) updateClassActivity(timer.classId, { type: 'none' });
                            router.push(timer?.classId ? `/dashboard/class?id=${timer.classId}` : '/dashboard/class');
                        }}
                    >
                        ← Back to Class
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gradient-rainbow">
                            ⏰ Tickr
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
                    className={`font-mono font-bold tracking-tighter tabular-nums leading-none transition-all duration-300 ${getTimerColor()} ${getTimerGlow()} cursor-pointer hover:scale-105 active:scale-95`}
                    style={{ fontSize: '25vw', textShadow: '0 0 100px rgba(0,0,0,0.5)' }}
                    onClick={() => timer.status === 'stopped' && setIsSettingsOpen(true)}
                    title={timer.status === 'stopped' ? "Click to Edit Time" : ""}
                >
                    {formatTime(timeLeft)}
                </div>
                <div className="text-xl sm:text-3xl text-[#94A3B8] mt-4 uppercase tracking-[0.2em] font-bold animate-fade-in flex items-center gap-3">
                    {isFinished ? (
                        <span className="text-[#F472B6] animate-bounce">⏰ TIME IS UP! ⏰</span>
                    ) : timer.status === 'running' ? (
                        <span className="text-[#22D3EE]">⚡ Time Remaining</span>
                    ) : timer.status === 'paused' ? (
                        <span className="text-[#FBBF24]">⏸️ Timer Paused</span>
                    ) : (
                        <button onClick={() => setIsSettingsOpen(true)} className="hover:text-white transition-colors flex items-center gap-2 text-[#A78BFA]">
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
                        <div className="w-12 h-1.5 bg-[#7C3AED]/40 rounded-full group-hover:bg-[#A78BFA]/60 transition-colors shadow-lg"></div>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* Main Actions */}
                        <div className="flex justify-center items-center gap-6">
                            <button
                                onClick={handleReset}
                                className="h-20 w-20 rounded-full flex flex-col items-center justify-center gap-1 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#A78BFA]/30 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95"
                                title="Reset"
                            >
                                <Icons.Refresh className="w-6 h-6 text-[#A78BFA]" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-[#A78BFA]/80">Reset</span>
                            </button>

                            {timer.status === 'running' ? (
                                <button
                                    onClick={handlePause}
                                    className="h-28 w-28 bg-gradient-to-br from-[#F472B6] to-[#DB2777] hover:from-[#F9A8D4] hover:to-[#F472B6] rounded-full flex flex-col items-center justify-center gap-1 text-white shadow-lg shadow-[#F472B6]/30 hover:scale-105 active:scale-95 transition-all border-2 border-[#F472B6]/50"
                                >
                                    <Icons.Pause className="w-10 h-10" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Pause</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleStart}
                                    className="h-28 w-28 bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] hover:from-[#67E8F9] hover:to-[#22D3EE] rounded-full flex flex-col items-center justify-center gap-1 text-[#0F172A] shadow-lg shadow-[#06B6D4]/30 hover:scale-105 active:scale-95 transition-all border-2 border-[#22D3EE]/50"
                                >
                                    <Icons.Play className="w-10 h-10 ml-1" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Start</span>
                                </button>
                            )}

                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="h-20 w-20 rounded-full flex flex-col items-center justify-center gap-1 bg-[#FBBF24]/10 hover:bg-[#FBBF24]/20 border border-[#FBBF24]/30 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                                title="Edit"
                                disabled={timer.status === 'running'}
                            >
                                <Icons.Settings className="w-6 h-6 text-[#FBBF24]" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-[#FBBF24]/80">Edit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
