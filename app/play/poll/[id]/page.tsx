'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { getPoll, onPollChange, votePoll, onVotesChange, Poll, Vote } from '@/lib/poll';
import { onClassChange } from '@/lib/classes';
import { Icons } from '@/components/picpick/Icons';

export default function PollPlayPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [poll, setPoll] = useState<Poll | null>(null);
    const [myVote, setMyVote] = useState<Vote | null>(null);
    const [allVotes, setAllVotes] = useState<Vote[]>([]);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);

    // Auth & Profile
    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (u) => {
            setUser(u);
            if (u) {
                // Fetch latest profile from Firestore to ensure current photo/name
                const profile = await getUserProfile(u.uid);
                if (profile) {
                    // Merge auth user with firestore profile for display purposes
                    setUser((prev: any) => ({ ...prev, ...profile }));
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Poll Data
    useEffect(() => {
        const unsubscribe = onPollChange(id, (data) => {
            setPoll(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);

    // Votes Data (to check if I voted and for results)
    useEffect(() => {
        if (!user) return;
        const unsubscribe = onVotesChange(id, (votes) => {
            setAllVotes(votes);
            const mine = votes.find(v => v.id === user.uid);
            setMyVote(mine || null);
        });
        return () => unsubscribe();
    }, [id, user]);

    // Listen for Class Activity Changes (Redirect if host ends poll)
    useEffect(() => {
        if (!poll?.classId) return;

        const unsubscribe = onClassChange(poll.classId, (classData) => {
            if (classData.currentActivity?.type !== 'poll' || classData.currentActivity?.id !== id) {
                // Activity changed, redirect back to dashboard
                router.replace(`/dashboard/class?id=${poll.classId}`);
            }
        });

        return () => unsubscribe();
    }, [poll?.classId, id, router]);

    const handleVote = async (optionId: string) => {
        if (!user || !poll || poll.status !== 'active' || myVote) return;

        setVoting(true);
        try {
            await votePoll(id, user.uid, optionId, user.displayName || 'Anonymous', user.photoURL || undefined);
            // Vibrate for feedback
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (error) {
            console.error('Vote failed', error);
            alert('Failed to submit vote');
        } finally {
            setVoting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="animate-spin text-4xl">⏳</div>
        </div>
    );

    if (!poll) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-500 font-bold text-xl">
            Poll not found
        </div>
    );

    // Calculate percentages for results view
    const totalVotes = allVotes.length;
    const results = poll.options.map(opt => {
        const count = allVotes.filter(v => v.optionId === opt.id).length;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return { ...opt, percentage };
    });

    return (
        <main className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-3xl mb-6 shadow-lg border border-green-500/20 backdrop-blur-sm animate-bounce-slow">
                        <span className="text-4xl">📊</span>
                    </div>
                    <h1 className="text-3xl font-black mb-4 leading-tight text-white drop-shadow-md">
                        {poll.question}
                    </h1>
                    {poll.status === 'closed' && (
                        <div className="inline-block px-4 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider border border-red-500/30">
                            Voting Closed
                        </div>
                    )}
                </div>

                {/* Voting View */}
                {!myVote && poll.status === 'active' && (
                    <div className="space-y-4">
                        {poll.options.map((option, index) => (
                            <button
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                disabled={voting}
                                className={`
                                    w-full p-5 rounded-2xl
                                    bg-gradient-to-br from-white/10 via-white/5 to-transparent
                                    backdrop-blur-xl
                                    border border-white/10
                                    shadow-lg shadow-black/20
                                    hover:shadow-xl hover:shadow-purple-500/20
                                    hover:border-purple-400/50
                                    hover:scale-[1.02]
                                    active:scale-[0.98]
                                    transition-all duration-200 ease-out
                                    flex items-center gap-5 group relative overflow-hidden
                                    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent
                                    before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
                                `}
                            >
                                {/* Glow effect on hover */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

                                <div className={`
                                    relative z-10 w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg ${option.color}
                                    group-hover:scale-110 group-hover:rotate-3
                                    group-active:scale-95
                                    transition-all duration-200 ease-out
                                    ring-2 ring-white/20 group-hover:ring-white/40
                                `}>
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <span className="relative z-10 text-lg font-bold text-left flex-1 text-slate-200 group-hover:text-white transition-colors">
                                    {option.text}
                                </span>
                                <div className="relative z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-200">
                                    <Icons.ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Voted / Results View */}
                {(myVote || poll.status === 'closed') && (
                    <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl animate-fade-in-up">
                        {myVote && (
                            <div className="text-center mb-8 pb-8 border-b border-white/10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 font-bold text-sm mb-3">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Vote Submitted
                                </div>
                                <div className="text-slate-400 text-sm">
                                    You voted for <span className="text-white font-bold text-lg block mt-1">{poll.options.find(o => o.id === myVote.optionId)?.text}</span>
                                </div>
                            </div>
                        )}

                        {poll.showResults ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                                    <span>Option</span>
                                    <span>Results</span>
                                </div>
                                {results.map((option) => (
                                    <div key={option.id} className="relative">
                                        <div className="flex justify-between text-sm mb-2 font-medium">
                                            <span className="text-slate-200">{option.text}</span>
                                            <span className="font-mono text-white">{option.percentage}%</span>
                                        </div>
                                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
                                            <div
                                                className={`h-full ${option.color} transition-all duration-1000 ease-out`}
                                                style={{ width: `${option.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="text-center mt-6 text-xs text-slate-500 font-medium">
                                    Total Votes: {totalVotes}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-6 opacity-50 animate-bounce-slow">🙈</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Results Hidden</h3>
                                <p className="text-slate-400 max-w-xs mx-auto">
                                    The host has managed to keep the suspense alive! Wait for the reveal.
                                </p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}
