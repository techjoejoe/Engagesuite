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

import { getStudentAssignments, onStudentAssignmentsChange, ClassAlbum } from '@/lib/albums';
import { onGalleriesChange, Gallery } from '@/lib/picpick';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentWordStorm from '@/components/wordstorm/StudentWordStorm';
import StudentCommitment from '@/components/commitment/StudentCommitment';
import { onTimerChange } from '@/lib/tickr';
import Button from '@/components/Button';
import { getClassMembers } from '@/lib/classes';
import Confetti from '@/components/Confetti';
import { getClassMember, ClassMember, getClassLeaderboard, joinClassMember } from '@/lib/scoring';
import { getUserProfile, UserProfile } from '@/lib/auth';
import { onActivePulseCheck, PulseCheck, initStudentEnergy } from '@/lib/energy';
import { onToolChange, ToolState } from '@/lib/tools';
import Dice3D from '@/components/Dice3D';
import Coin3D from '@/components/Coin3D';
import ClassLeaderboard from '@/components/student/ClassLeaderboard';
import { addParkingLotQuestion, onParkingLotChange, ParkingLotItem } from '@/lib/parkinglot';

const StudentAlbums = ({ classId }: { classId: string }) => {
    const [assignments, setAssignments] = useState<ClassAlbum[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribe = onStudentAssignmentsChange(classId, (updated) => {
            setAssignments(updated);
        });
        return () => unsubscribe();
    }, [classId]);

    if (assignments.length === 0) return null;

    return (
        <div id="workbooks">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 opacity-80">
                <span>📚</span> Workbooks
            </h3>
            <div className="grid gap-2">
                {assignments.map(a => (
                    <button
                        key={a.id}
                        onClick={() => router.push(`/play/workbook?id=${a.id}`)}
                        className="w-full text-left bg-slate-800/50 hover:bg-slate-700/80 p-3 rounded-lg border border-white/5 hover:border-blue-500/50 transition-all group flex justify-between items-center"
                    >
                        <div>
                            <div className="font-bold text-sm text-gray-200 group-hover:text-blue-300 transition-colors">{a.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{a.totalPointsAvailable} Points Available</div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-700 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                            <span className="text-white text-sm">→</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const StudentGalleries = ({ classId }: { classId: string }) => {
    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribe = onGalleriesChange(classId, (updated) => {
            setGalleries(updated);
        });
        return () => unsubscribe();
    }, [classId]);

    if (galleries.length === 0) return null;

    // Helper to check if gallery is currently active (voting or upload window)
    const isGalleryActive = (gallery: Gallery) => {
        const now = new Date();
        const uploadEnd = gallery.uploadEnd instanceof Date ? gallery.uploadEnd : gallery.uploadEnd.toDate();
        const votingEnd = gallery.votingEnd instanceof Date ? gallery.votingEnd : gallery.votingEnd.toDate();
        return now <= votingEnd;
    };

    return (
        <div id="galleries">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 opacity-80">
                <span>📸</span> PicPick Gallery
            </h3>
            <div className="grid gap-2">
                {galleries.filter(isGalleryActive).map(g => (
                    <button
                        key={g.id}
                        onClick={() => router.push(`/picpick/gallery/${g.id}`)}
                        className="w-full text-left bg-slate-800/50 hover:bg-slate-700/80 p-3 rounded-lg border border-white/5 hover:border-purple-500/50 transition-all group flex justify-between items-center"
                    >
                        <div>
                            <div className="font-bold text-sm text-gray-200 group-hover:text-purple-300 transition-colors">{g.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{g.description}</div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-700 group-hover:bg-purple-600 flex items-center justify-center transition-colors">
                            <span className="text-white text-sm">📷</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};



const ActivityContainer = ({ children, title, icon, color = 'indigo' }: { children: React.ReactNode; title: string; icon: string; color?: string }) => (
    <div className="flex flex-col h-full items-center justify-center text-center animate-fade-in w-full">
        <div className={`relative group`}>
            <div className={`absolute inset-0 bg-${color}-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full`} />
            <div className={`relative w-28 h-28 rounded-3xl bg-slate-800/80 text-${color}-400 flex items-center justify-center text-6xl mb-6 shadow-xl border border-${color}-500/30 backdrop-blur-md ring-1 ring-${color}-500/20 group-hover:scale-105 transition-transform duration-300`}>
                <div className="animate-bounce-slow filter drop-shadow-md">{icon}</div>
            </div>
        </div>
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-lg">{title}</h2>
        <div className={`h-1 w-20 bg-${color}-500 rounded-full mb-8 opacity-50 mx-auto`} />
        <div className="w-full max-w-lg mx-auto">
            {children}
        </div>
    </div>
);



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
                {/* Winner Overlay */}
                {state?.winner && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md animate-fade-in">
                        <Confetti />
                        <div className="text-center p-8 animate-bounce-in w-full flex flex-col items-center">
                            {typeof state.winner === 'object' && state.winner.photoURL ? (
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-white blur-md opacity-20 rounded-full animate-pulse"></div>
                                    <img
                                        src={state.winner.photoURL}
                                        className="relative w-40 h-40 rounded-full border-4 border-white shadow-2xl object-cover animate-bounce-in"
                                    />
                                    <div className="absolute -bottom-2 -right-2 text-5xl animate-bounce delay-100">👑</div>
                                </div>
                            ) : (
                                <div className="text-8xl mb-6 animate-bounce">👑</div>
                            )}
                            <div className="text-3xl font-black text-green-400 uppercase tracking-widest mb-4 drop-shadow-md">Winner!</div>
                            <div className="text-4xl sm:text-6xl font-black text-white mb-8 break-words drop-shadow-2xl px-4">
                                {typeof state.winner === 'object' ? state.winner.displayName : state.winner}
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 custom-scrollbar bg-slate-900">
                    {members.map((member, index) => (
                        <div
                            key={member.uid}
                            className={`
                                p-3 rounded-xl text-center transition-all duration-100 flex flex-col items-center justify-center min-h-[110px] aspect-square
                                ${highlightedIndex === index
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-105 shadow-[0_0_20px_rgba(139,92,246,0.6)] z-10 text-white font-black ring-2 ring-white transform'
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750'
                                }
                            `}
                        >
                            <div className={`
                                w-14 h-14 rounded-full overflow-hidden mb-2 border-2 shadow-sm
                                ${highlightedIndex === index ? 'border-white' : 'border-slate-600'}
                            `}>
                                {member.photoURL ? (
                                    <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-xl font-bold ${highlightedIndex === index ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
                                        {(member.displayName || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className={`truncate w-full leading-tight ${highlightedIndex === index ? 'text-sm' : 'text-xs font-medium'}`}>{member.displayName}</span>
                        </div>
                    ))}
                </div>

                {/* Status Bar */}
                <div className="p-5 bg-slate-800 text-center border-t border-slate-700/50 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10 relative overflow-hidden">
                    {/* Background sheen */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />

                    {isSpinning ? (
                        <div className="text-indigo-400 font-bold animate-pulse text-lg tracking-widest flex items-center justify-center gap-2">
                            <span className="animate-spin text-xl">🎡</span> SPINNING...
                        </div>
                    ) : state?.winner ? (
                        <div className="text-green-400 font-bold text-lg tracking-widest animate-pulse">WINNER SELECTED</div>
                    ) : (
                        <div className="text-slate-400 font-medium italic flex items-center justify-center gap-2 opacity-80">
                            <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                            Waiting for host to spin...
                        </div>
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
                <div className={`text-7xl font-black tabular-nums tracking-tighter drop-shadow-lg ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
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

const StudentPoll = ({ pollId }: { pollId: string }) => {
    const router = useRouter();

    useEffect(() => {
        router.push(`/play/poll/${pollId}`);
    }, [pollId, router]);

    return (
        <ActivityContainer title="LiveVote" icon="📊" color="green">
            <div className="flex flex-col items-center justify-center p-8">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-xl font-bold animate-pulse">Joining LiveVote...</p>
            </div>
        </ActivityContainer>
    );
};

interface UserDashProps {
    classData: Class;
    userId: string;
    onLeaveClass?: () => void;
}



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



// ... (existing imports)

export default function UserDash({ classData, userId, onLeaveClass }: UserDashProps) {
    const searchParams = useSearchParams();

    const tabParam = searchParams.get('tab') as 'class' | 'global' | null;

    const [showReadyCheck, setShowReadyCheck] = useState(false);
    const [lastActivityType, setLastActivityType] = useState('none');
    const [manualActivityType, setManualActivityType] = useState<string | null>(null);
    const [member, setMember] = useState<ClassMember | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [showParkingLot, setShowParkingLot] = useState(false);
    const [activePulse, setActivePulse] = useState<PulseCheck | null>(null);
    const [activeTool, setActiveTool] = useState<ToolState | null>(null);
    const [classRank, setClassRank] = useState<number | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            if (!userId) return;

            // Get user profile first
            const u = await getUserProfile(userId);
            setUserProfile(u);

            // Ensure member is registered in class
            if (u?.displayName) {
                await joinClassMember(classData.id, userId, u.displayName);
                // Initialize energy level only if not already set (default to 100 - Energized)
                await initStudentEnergy(classData.id, userId, u.displayName, 100);
            }

            // Get member stats
            const m = await getClassMember(classData.id, userId);
            setMember(m);

            // Compute class rank from leaderboard
            try {
                const leaderboard = await getClassLeaderboard(classData.id, 100);
                const rank = leaderboard.findIndex(member => member.userId === userId);
                setClassRank(rank >= 0 ? rank + 1 : null);
            } catch (err) {
                console.error('Error computing class rank:', err);
            }
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



    // Note: Tools (dice/coin) are separate from main activities and shouldn't be cleared
    // when the main activity changes. They are only cleared when the host deactivates them.

    // Listen for tools (Dice/Coin)
    useEffect(() => {
        const unsubDice = onToolChange(classData.id, 'dice', (state) => {
            console.log('[Tool] Dice state update:', state);
            setActiveTool(prev => {
                // 1. If new state is active, switch to it immediately
                if (state && state.active) {
                    return state;
                }
                // 2. If new state is Inactive/Null, AND we are currently looking at Dice, clear it
                if (prev && prev.type === 'dice') {
                    // Only clear if we were watching Dice
                    return null;
                }
                // 3. Otherwise (e.g. we are watching Coin), don't touch it
                return prev;
            });
        });

        const unsubCoin = onToolChange(classData.id, 'coin', (state) => {
            console.log('[Tool] Coin state update:', state);
            setActiveTool(prev => {
                // 1. If new state is active, switch to it immediately
                if (state && state.active) {
                    return state;
                }
                // 2. If new state is Inactive/Null, AND we are currently looking at Coin, clear it
                if (prev && prev.type === 'coin') {
                    // Only clear if we were watching Coin
                    return null;
                }
                // 3. Otherwise (e.g. we are watching Dice), don't touch it
                return prev;
            });
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

    // Check if idle (no active tool AND no active activity AND (no pulse check OR pulse check dismissed) AND no manual activity)
    const isIdle = !activeTool && !manualActivityType && (!classData.currentActivity || classData.currentActivity.type === 'none') && (!activePulse || activePulse.id === dismissedPulseId);

    // REMOVED: longIdle timer that was switching view after 30 seconds
    // Users should always see the full dashboard with Workbooks & Galleries

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
                    return <StudentCommitment classId={classData.id} userId={userId} userName={userProfile.displayName || 'Anonymous'} userPhoto={userProfile.photoURL || undefined} />;
                case 'buzzer':
                    if (!userProfile) return <div className="animate-pulse text-white">Loading...</div>;
                    return <BuzzerView classId={classData.id} userProfile={userProfile} />;
                default: return null;
            }
        }



        // 3. Fallback: Full Dashboard View (Class + Global tabs)
        return (
            <StudentDashboardView
                classId={classData.id}
                className={classData.name}
                userId={userId}
                onJoinActivity={(type) => setManualActivityType(type)}
                initialTab="class"
                hideHeader={true}
            />
        );
    };



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
                className="fixed bottom-10 right-6 z-[60] w-14 h-14 bg-slate-800 rounded-full shadow-xl flex items-center justify-center text-2xl border-2 border-indigo-500 text-white transition-transform hover:scale-110 active:scale-90"
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

            {/* Pulse Check Overlay */}
            {activePulse && activePulse.id !== dismissedPulseId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in p-6">
                    <div className="relative w-full max-w-4xl flex flex-col items-center">
                        <button
                            onClick={() => setDismissedPulseId(activePulse.id)}
                            className="absolute -top-12 right-0 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors"
                            title="Dismiss"
                        >
                            ✕
                        </button>
                        <PulseCheckView
                            classId={classData.id}
                            sessionId={activePulse.id}
                            userId={userId}
                            displayName={userProfile?.displayName || 'Student'}
                        />
                    </div>
                </div>
            )}

            <div className="w-full max-w-[500px] flex flex-col gap-6 relative z-10">

                {/* Header */}
                <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg mb-2">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                            Hi, {userProfile?.displayName?.split(' ')[0] || 'Student'}
                        </h1>
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mt-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            {classData.name}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {classRank && (
                            <>
                                <div className="text-center px-2">
                                    <div className="text-lg font-black text-yellow-400 leading-none">
                                        {classRank}{classRank === 1 ? 'st' : classRank === 2 ? 'nd' : classRank === 3 ? 'rd' : 'th'}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Rank</div>
                                </div>
                                <div className="w-px bg-white/10" />
                            </>
                        )}
                        <div className="text-center px-2">
                            <div className="text-lg font-black text-blue-400 leading-none">{member?.score || 0}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Score</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center px-2">
                            <div className="text-lg font-black text-green-400 leading-none">{userProfile?.lifetimePoints || 0}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Lifetime</div>
                        </div>
                    </div>
                </div>

                {/* Workbooks & Galleries - Side by side in two columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <StudentAlbums classId={classData.id} />
                    <StudentGalleries classId={classData.id} />
                </div>

                <div className="glass-card p-8 w-full animate-fade-in-up">
                    {renderContent()}
                </div>

                {/* Stats Row */}

            </div>

            {/* Debug Info */}
            <div className="fixed bottom-1 left-1 text-[10px] text-gray-500 opacity-50 pointer-events-none z-[100]">
                Activity: {classData.currentActivity?.type || 'none'} | ID: {classData.currentActivity?.id || '-'} | v: 1.2
            </div>
        </div>
    );
}
