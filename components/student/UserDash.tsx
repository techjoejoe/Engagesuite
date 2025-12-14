'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Class } from '@/lib/classes';
import { getCurrentUser, onAuthStateChange } from '@/lib/auth';
import StudentDashboardView from './StudentDashboardView';
import StudentQuizBattle from '@/components/quizbattle/StudentQuizBattle';
import BuzzerView from '@/components/student/BuzzerView';
import EnergyBattery from '@/components/student/EnergyBattery';
import PulseCheckView from '@/components/student/PulseCheckView';
import ReadyCheck from '@/components/ReadyCheck';
import { ThemeToggle } from '@/components/ThemeToggle';
import StudentMenu from '@/components/StudentMenu';

import StudentWordStorm from '@/components/wordstorm/StudentWordStorm';
import StudentCommitment from '@/components/commitment/StudentCommitment';

import { onTimerChange } from '@/lib/tickr';
import Button from '@/components/Button';

const ActivityContainer = ({ children, title, icon, color = 'indigo' }: { children: React.ReactNode; title: string; icon: string; color?: string }) => (
    <div className="flex flex-col h-full items-center justify-center text-center animate-fade-in w-full">
        <div className={`w-24 h-24 rounded-3xl bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 flex items-center justify-center text-5xl mb-6 shadow-sm border border-${color}-100 dark:border-${color}-800`}>
            {icon}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{title}</h2>
        <div className="w-full max-w-lg mx-auto">
            {children}
        </div>
    </div>
);

import { getClassMembers } from '@/lib/classes';
import Confetti from '@/components/Confetti';

const StudentRandomizer = ({ state, classId }: { state: any, classId: string }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const elapsedRef = useRef(0);

    useEffect(() => {
        const fetchMembers = async () => {
            const users = await getClassMembers(classId);
            setMembers(users);
        };
        fetchMembers();
    }, [classId]);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (state?.winner) {
            setIsSpinning(false);
            setHighlightedIndex(null);
            return;
        }

        if (state?.spinning && members.length > 0) {
            setIsSpinning(true);
            elapsedRef.current = 0;
            let currentIndex = 0;
            let intervalDuration = 50;

            const spin = () => {
                currentIndex = (currentIndex + 1) % members.length;
                setHighlightedIndex(currentIndex);
                elapsedRef.current += intervalDuration;

                if (intervalRef.current) clearInterval(intervalRef.current);

                if (elapsedRef.current > 2500) intervalDuration = 300;
                else if (elapsedRef.current > 1500) intervalDuration = 150;
                else if (elapsedRef.current > 800) intervalDuration = 100;

                intervalRef.current = setInterval(() => spin(), intervalDuration);
            };

            spin();
        } else {
            setIsSpinning(false);
            setHighlightedIndex(null);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [JSON.stringify(state), members]);

    return (
        <ActivityContainer title="Randomizer" icon="🎡" color="pink">
            <div className="relative w-full h-[500px] bg-slate-900 rounded-3xl overflow-hidden flex flex-col border border-slate-700 shadow-2xl">
                {/* Winner Overlay */}
                {state?.winner && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md animate-fade-in">
                        <Confetti />
                        <div className="text-center p-8 animate-bounce-in w-full">
                            <div className="text-8xl mb-6">👑</div>
                            <div className="text-3xl font-black text-green-400 uppercase tracking-widest mb-4 drop-shadow-md">Winner!</div>
                            <div className="text-4xl sm:text-6xl font-black text-white mb-8 break-words drop-shadow-2xl px-4">{state.winner}</div>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 custom-scrollbar bg-slate-900">
                    {members.map((member, index) => (
                        <div
                            key={member.uid}
                            className={`
                                p-4 rounded-xl text-center transition-all duration-100 flex items-center justify-center min-h-[70px]
                                ${highlightedIndex === index
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-105 shadow-[0_0_20px_rgba(139,92,246,0.6)] z-10 text-white font-black ring-2 ring-white transform'
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750'
                                }
                            `}
                        >
                            <span className={`truncate ${highlightedIndex === index ? 'text-lg' : 'text-sm font-medium'}`}>{member.displayName}</span>
                        </div>
                    ))}
                </div>

                {/* Status Bar */}
                <div className="p-5 bg-slate-800 text-center border-t border-slate-700/50 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10">
                    {isSpinning ? (
                        <div className="text-indigo-400 font-bold animate-pulse text-lg tracking-widest">SPINNING...</div>
                    ) : state?.winner ? (
                        <div className="text-green-400 font-bold text-lg tracking-widest">WINNER SELECTED</div>
                    ) : (
                        <div className="text-slate-400 font-medium italic">Waiting for host to spin...</div>
                    )}
                </div>
            </div>
        </ActivityContainer>
    );
};

const StudentTickr = ({ timerId }: { timerId: string }) => {
    const [state, setState] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const unsubscribe = onTimerChange(timerId, (timer) => {
            setState(timer);
            if (timer.status !== 'running') {
                setTimeLeft(timer.duration);
                setProgress(100);
            }
        });
        return () => unsubscribe();
    }, [timerId]);

    useEffect(() => {
        if (!state || state.status !== 'running') return;
        const interval = setInterval(() => {
            if (state.endTime) {
                const end = state.endTime.toDate ? state.endTime.toDate() : new Date(state.endTime);
                const now = new Date();
                const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
                setTimeLeft(diff);
                setProgress((diff / state.duration) * 100);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [state]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <ActivityContainer title="Timer" icon="⏱️" color="indigo">
            <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-slate-700" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke={timeLeft <= 5 ? '#EF4444' : '#6366F1'} strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
                </svg>
                <div className={`text-7xl font-black tabular-nums tracking-tighter ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>
            {timeLeft === 0 && state?.status === 'running' && (
                <div className="text-3xl font-bold text-red-500 mt-8 animate-bounce">Time's Up!</div>
            )}
        </ActivityContainer>
    );
};

const StudentPicPick = ({ galleryId }: { galleryId: string }) => (
    <ActivityContainer title="PicPick Contest" icon="📸" color="purple">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">Snap a photo and join the contest!</p>
        <Button variant="primary" onClick={() => window.location.href = `/picpick/gallery/${galleryId}`} className="w-full py-5 text-xl rounded-2xl shadow-xl bg-purple-600 text-white hover:bg-purple-700 transition-all hover:-translate-y-1">
            Enter Gallery
        </Button>
    </ActivityContainer>
);

const StudentPoll = ({ pollId }: { pollId: string }) => (
    <ActivityContainer title="LiveVote" icon="📊" color="green">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">A new poll is active!</p>
        <Button variant="primary" onClick={() => window.location.href = `/play/poll/${pollId}`} className="w-full py-5 text-xl rounded-2xl shadow-xl bg-green-600 text-white hover:bg-green-700 transition-all hover:-translate-y-1">
            Join Vote
        </Button>
    </ActivityContainer>
);

interface UserDashProps {
    classData: Class;
    userId: string;
    onLeaveClass?: () => void;
}

import { getClassMember, ClassMember, getClassLeaderboard, joinClassMember } from '@/lib/scoring';
import { getUserProfile, UserProfile } from '@/lib/auth';
import { onActivePulseCheck, PulseCheck } from '@/lib/energy';
import { onToolChange, ToolState } from '@/lib/tools';
import Dice3D from '@/components/Dice3D';
import Coin3D from '@/components/Coin3D';

import ClassLeaderboard from '@/components/student/ClassLeaderboard';

import { addParkingLotQuestion, onParkingLotChange, ParkingLotItem } from '@/lib/parkinglot';

const ParkingLotModal = ({ isOpen, onClose, classId, userId, userName }: { isOpen: boolean; onClose: () => void; classId: string; userId: string; userName: string }) => {
    const [question, setQuestion] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [questions, setQuestions] = useState<ParkingLotItem[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const unsubscribe = onParkingLotChange(classId, (data) => {
            setQuestions(data);
        });
        return () => unsubscribe();
    }, [isOpen, classId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setSubmitting(true);
        try {
            await addParkingLotQuestion(classId, userId, userName, question);
            setQuestion('');
            // Don't close immediately so they can see it added? Or close?
            // User might want to ask another or see others. Let's keep it open but maybe show success toast?
            // Alert is annoying. Let's just clear input.
            // alert('Question sent to the Parking Lot!'); 
        } catch (error) {
            console.error('Error submitting question:', error);
            alert('Failed to send question.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-bounce-in flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>🚙</span> Parking Lot
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Have a question? Park it here and the host will address it later.
                    </p>
                    <form onSubmit={handleSubmit} className="mb-6">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Type your question here..."
                            className="w-full h-24 p-4 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3 text-sm"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <Button type="submit" variant="primary" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2">
                                {submitting ? 'Sending...' : 'Park Question'}
                            </Button>
                        </div>
                    </form>

                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Recent Questions</h4>
                        <div className="space-y-3">
                            {questions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4 italic">No questions yet.</p>
                            ) : (
                                questions.map(q => (
                                    <div key={q.id} className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{q.question}</p>
                                            {q.status === 'answered' && (
                                                <span className="shrink-0 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                    Answered
                                                </span>
                                            )}
                                        </div>

                                        {q.answer && (
                                            <div className="mb-2 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                                                <span className="font-bold text-green-700 dark:text-green-400 block mb-1 text-xs uppercase">Host Answer:</span>
                                                <span className="text-gray-800 dark:text-gray-200">{q.answer}</span>
                                            </div>
                                        )}

                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                            {q.userId === userId ? (
                                                <span className="text-indigo-500 font-bold">You</span>
                                            ) : (
                                                <span>Anonymous</span>
                                            )}
                                            <span className="mx-1">•</span>
                                            <span>{q.createdAt?.toDate ? q.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Common Background
const Background = () => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
    </div>
);

import { useSearchParams } from 'next/navigation';

// ... (existing imports)

export default function UserDash({ classData, userId, onLeaveClass }: UserDashProps) {
    const searchParams = useSearchParams();
    const viewParam = searchParams.get('view');
    const tabParam = searchParams.get('tab') as 'class' | 'global' | null;

    const [showReadyCheck, setShowReadyCheck] = useState(false);
    const [lastActivityType, setLastActivityType] = useState('none');
    const [manualActivityType, setManualActivityType] = useState<string | null>(null);
    const [member, setMember] = useState<ClassMember | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [showParkingLot, setShowParkingLot] = useState(false);
    const [activePulse, setActivePulse] = useState<PulseCheck | null>(null);
    const [activeTool, setActiveTool] = useState<ToolState | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            if (!userId) return;

            // Get user profile first
            const u = await getUserProfile(userId);
            setUserProfile(u);

            // Ensure member is registered in class
            if (u?.displayName) {
                await joinClassMember(classData.id, userId, u.displayName);
            }

            // Get member stats
            const m = await getClassMember(classData.id, userId);
            setMember(m);
        };

        loadStats();

        // Refresh stats every 5 seconds
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, [classData.id, userId]);

    // Listen for active pulse checks
    useEffect(() => {
        const unsubscribe = onActivePulseCheck(classData.id, setActivePulse);
        return () => unsubscribe();
    }, [classData.id]);

    const activeToolRef = useRef<ToolState | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

    // Clear tool if main activity changes (safeguard)
    useEffect(() => {
        if (classData.currentActivity?.type && classData.currentActivity.type !== 'none') {
            setActiveTool(null);
        }
    }, [classData.currentActivity?.type]);

    // Listen for tools (Dice/Coin)
    useEffect(() => {
        const unsubDice = onToolChange(classData.id, 'dice', (state) => {
            if (state && state.active) {
                setActiveTool(state);
            } else if (activeToolRef.current?.type === 'dice') {
                setActiveTool(null);
            }
        });

        const unsubCoin = onToolChange(classData.id, 'coin', (state) => {
            if (state && state.active) {
                setActiveTool(state);
            } else if (activeToolRef.current?.type === 'coin') {
                setActiveTool(null);
            }
        });

        return () => {
            unsubDice();
            unsubCoin();
        };
    }, [classData.id]);

    // Handle Ready Check
    useEffect(() => {
        const currentType = classData.currentActivity?.type || 'none';
        if (currentType !== 'none' && lastActivityType === 'none') {
            setShowReadyCheck(true);
        }
        setLastActivityType(currentType);
    }, [classData.currentActivity?.type]);

    const [dismissedPulseId, setDismissedPulseId] = useState<string | null>(null);

    // Reset dismissal when pulse check changes
    useEffect(() => {
        if (activePulse && activePulse.id !== dismissedPulseId) {
            // New pulse check, don't auto-dismiss (unless we want to persist dismissal across reloads? No, local state is fine)
        }
    }, [activePulse?.id]);

    // Check if idle (no active activity AND (no pulse check OR pulse check dismissed) AND no manual activity)
    const isIdle = !manualActivityType && (!classData.currentActivity || classData.currentActivity.type === 'none') && (!activePulse || activePulse.id === dismissedPulseId);

    const [longIdle, setLongIdle] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isIdle) {
            timer = setTimeout(() => {
                setLongIdle(true);
            }, 30000);
        } else {
            setLongIdle(false);
        }
        return () => clearTimeout(timer);
    }, [isIdle]);

    // Render Active Component
    const renderContent = () => {
        // 0. Priority: Manual Override
        if (manualActivityType) {
            if (manualActivityType === 'buzzer') {
                if (!userProfile) return <div className="animate-pulse text-white">Loading...</div>;
                return (
                    <div className="relative">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setManualActivityType(null)}
                            className="absolute -top-12 right-0 z-50 bg-slate-800 text-slate-300 border border-slate-700"
                        >
                            Exit Manual Mode
                        </Button>
                        <BuzzerView classId={classData.id} userProfile={userProfile} />
                    </div>
                );
            }
            return (
                <div className="text-center p-8">
                    <p className="text-red-400 mb-4">Manual join not supported for {manualActivityType} yet.</p>
                    <Button variant="secondary" onClick={() => setManualActivityType(null)}>Go Back</Button>
                </div>
            );
        }

        const activity = classData.currentActivity;

        // 1. Priority: Active Activity (Tickr, Quiz, etc.)
        if (activity && activity.type !== 'none') {
            switch (activity.type) {
                case 'randomizer': return <StudentRandomizer state={activity.state} classId={classData.id} />;
                case 'tickr': return <StudentTickr timerId={activity.id || ''} />;
                case 'picpick': return <StudentPicPick galleryId={activity.id || ''} />;
                case 'quizbattle': return <StudentQuizBattle key={activity.id} gameId={activity.id || ''} userId={userId} />;
                case 'poll': return <StudentPoll pollId={activity.id || ''} />;
                case 'wordstorm': return <StudentWordStorm wordStormId={activity.id || ''} />;
                case 'commitment':
                    if (!userProfile) return <div className="animate-pulse text-white">Loading...</div>;
                    return <StudentCommitment classId={classData.id} userId={userId} userName={userProfile.displayName || 'Anonymous'} />;
                case 'buzzer':
                    if (!userProfile) return <div className="animate-pulse text-white">Loading...</div>;
                    return <BuzzerView classId={classData.id} userProfile={userProfile} />;
                default: return null;
            }
        }

        // 2. Priority: Pulse Check (if not dismissed)
        if (activePulse && userProfile && activePulse.id !== dismissedPulseId) {
            return (
                <div className="relative">
                    <button
                        onClick={() => setDismissedPulseId(activePulse.id)}
                        className="absolute -top-2 -right-2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors"
                        title="Dismiss"
                    >
                        ✕
                    </button>
                    <PulseCheckView classId={classData.id} sessionId={activePulse.id} userId={userId} displayName={userProfile.displayName || 'Student'} />
                </div>
            );
        }

        // 3. Fallback: Leaderboard (Should rarely be reached if isIdle logic handles Dashboard)
        return <ClassLeaderboard classId={classData.id} userId={userId} />;
    };

    // Only show separate leaderboard view if explicitly requested OR idle, AND no active activity is forcing a takeover
    const hasActiveActivity = classData.currentActivity && classData.currentActivity.type !== 'none';

    if (((isIdle && longIdle) || viewParam === 'leaderboard') && !hasActiveActivity) {
        return (
            <div className="min-h-screen bg-slate-900 p-6 relative overflow-hidden flex flex-col items-center">
                <Background />

                <div className="absolute top-4 left-4 z-50">
                    {onLeaveClass && (
                        <Button variant="glass" size="sm" onClick={onLeaveClass} className="text-slate-300 hover:text-white">
                            ← Leave
                        </Button>
                    )}
                </div>
                <div className="absolute top-4 right-4 z-50">
                    <StudentMenu classId={classData.id} />
                </div>

                <div className="relative z-10 w-full max-w-md mx-auto mt-8">
                    <StudentDashboardView
                        classId={classData.id}
                        className={classData.name}
                        userId={userId}
                        onJoinActivity={(type) => setManualActivityType(type)}
                        initialTab={tabParam || 'class'}
                    />
                </div>
                {/* Debug Info */}
                <div className="fixed bottom-1 left-1 text-[10px] text-gray-500 opacity-50 pointer-events-none z-[100]">
                    Activity: {classData.currentActivity?.type || 'none'} | ID: {classData.currentActivity?.id || '-'} | v: 1.2
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center font-sans transition-colors duration-300 relative overflow-hidden">
            <Background />

            <div className="absolute top-4 left-4 z-50">
                {onLeaveClass && (
                    <Button variant="glass" size="sm" onClick={onLeaveClass} className="text-slate-300 hover:text-white">
                        ← Leave Class
                    </Button>
                )}
            </div>
            <div className="absolute top-4 right-4 z-50">
                <StudentMenu classId={classData.id} />
            </div>

            <button
                onClick={() => setShowParkingLot(true)}
                className="fixed bottom-10 right-6 z-50 w-14 h-14 bg-slate-800 rounded-full shadow-xl flex items-center justify-center text-2xl border-2 border-indigo-500 text-white transition-transform hover:scale-110 active:scale-90"
                title="Parking Lot"
            >
                🚙
            </button>

            <ParkingLotModal
                isOpen={showParkingLot}
                onClose={() => setShowParkingLot(false)}
                classId={classData.id}
                userId={userId}
                userName={userProfile?.displayName || 'Student'}
            />

            {/* Energy Battery Widget (Bottom Left) */}
            {userProfile && (
                <EnergyBattery
                    classId={classData.id}
                    userId={userId}
                    displayName={userProfile.displayName || 'Student'}
                />
            )}

            {showReadyCheck && <ReadyCheck onComplete={() => setShowReadyCheck(false)} />}

            {/* Active Tool Overlay */}
            {activeTool && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-white mb-8">
                            {activeTool.type === 'dice' ? 'Dice Roll' : 'Coin Flip'}
                        </h2>

                        {activeTool.type === 'dice' && (
                            <div className="flex gap-8 mb-8">
                                {activeTool.data.results.map((res: number, idx: number) => (
                                    <Dice3D key={idx} value={res} rolling={activeTool.data.rolling} size={100} />
                                ))}
                            </div>
                        )}

                        {activeTool.type === 'coin' && (
                            <div className="mb-8">
                                <Coin3D result={activeTool.data.result} flipping={activeTool.data.flipping} size={200} />
                            </div>
                        )}

                        <div className="text-white/50 text-sm mb-4">
                            Wait for host...
                        </div>

                        <button
                            onClick={() => setActiveTool(null)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-[500px] flex flex-col gap-6 relative z-10">

                {/* Header */}
                <div className="text-center text-white">
                    <h1 className="text-4xl font-black mb-2 tracking-tight">{classData.name}</h1>
                    <div className="flex items-center justify-center gap-2 text-indigo-300 text-sm font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Live Session
                    </div>
                </div>

                {/* Main Card */}
                <div className="glass-card p-8 w-full animate-fade-in-up">
                    {renderContent()}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 text-center">
                        <div className="text-3xl font-black text-blue-400">{member?.score || 0}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Points</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-3xl font-black text-green-400">{userProfile?.lifetimePoints || 0}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifetime</div>
                    </div>
                </div>
            </div>

            {/* Debug Info */}
            <div className="fixed bottom-1 left-1 text-[10px] text-gray-500 opacity-50 pointer-events-none z-[100]">
                Activity: {classData.currentActivity?.type || 'none'} | ID: {classData.currentActivity?.id || '-'} | v: 1.2
            </div>
        </div>
    );
}
