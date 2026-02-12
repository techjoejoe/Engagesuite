'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getPoll, onPollChange, onVotesChange, togglePollResults, updatePollStatus, Poll, Vote } from '@/lib/poll';
import { updateClassActivity } from '@/lib/classes';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';

export default function PollHostPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinUrl, setJoinUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setJoinUrl(`${window.location.origin}/play/poll/${id}`);
        }
    }, [id]);

    // Listen to Poll Data
    useEffect(() => {
        const unsubscribe = onPollChange(id, (data) => {
            setPoll(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);

    // Sync class activity when poll loads
    useEffect(() => {
        if (poll?.classId) {
            updateClassActivity(poll.classId, { type: 'poll', id: id });
        }
    }, [poll?.classId, id]);

    // Cleanup: Clear activity when leaving
    useEffect(() => {
        return () => {
            if (poll?.classId) {
                updateClassActivity(poll.classId, { type: 'none' });
            }
        };
    }, [poll?.classId]);

    // Listen to Votes
    useEffect(() => {
        const unsubscribe = onVotesChange(id, (newVotes) => {
            setVotes(newVotes);
        });
        return () => unsubscribe();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-transparent text-white/60">Loading Poll...</div>;
    if (!poll) return <div className="min-h-screen flex items-center justify-center bg-transparent text-red-500">Poll not found</div>;

    // Calculate Results
    const results = poll.options.map(option => {
        const count = votes.filter(v => v.optionId === option.id).length;
        const percentage = votes.length > 0 ? Math.round((count / votes.length) * 100) : 0;
        return { ...option, count, percentage };
    });

    const handleToggleResults = async () => {
        await togglePollResults(id, !poll.showResults);
    };

    const handleToggleStatus = async () => {
        const newStatus = poll.status === 'active' ? 'closed' : 'active';
        await updatePollStatus(id, newStatus);
    };

    return (
        <main className="min-h-screen bg-transparent p-6 transition-colors duration-300">
            <HostMenu currentPage="LiveVote" classId={poll.classId} />

            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-sm flex flex-wrap justify-between items-center gap-5 border border-white/10 dark:border-slate-700">
                    <div>
                        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1 flex items-center gap-2">
                            📊 LiveVote
                        </h1>
                        <p className="text-white/60 dark:text-gray-400 text-sm">
                            {votes.length} vote{votes.length !== 1 ? 's' : ''} received • {poll.status === 'active' ? '🟢 Active' : '🔴 Closed'}
                        </p>
                    </div>

                    <div className="flex gap-3 items-center">
                        <button
                            onClick={handleToggleResults}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm ${poll.showResults
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-white/70 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'
                                }`}
                        >
                            {poll.showResults ? '👁️ Results Visible' : '🙈 Results Hidden'}
                        </button>

                        <button
                            onClick={handleToggleStatus}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm text-white ${poll.status === 'active'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            {poll.status === 'active' ? '🛑 Stop Voting' : '▶️ Resume Voting'}
                        </button>

                        <button
                            onClick={() => router.push(`/host/poll/create?classId=${poll.classId}`)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                        >
                            ➕ Run Another Poll
                        </button>

                        <button
                            onClick={() => router.push(`/dashboard/class?id=${poll.classId}`)}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-white/70 dark:text-gray-300 border border-white/20 dark:border-slate-600 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
                    {/* Main Chart Section */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-sm min-h-[600px] flex flex-col border border-white/10 dark:border-slate-700">
                        <h2 className="text-2xl md:text-3xl font-bold text-white dark:text-white mb-8 text-center">
                            {poll.question}
                        </h2>

                        <div className="flex-1 flex flex-col justify-center gap-6">
                            {results.map((option, index) => (
                                <div
                                    key={option.id}
                                    className="relative group"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Label & Count */}
                                    <div className="flex justify-between items-end mb-2 z-10 relative">
                                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                                            <span className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center text-white text-base shadow-lg ${option.color}
                                                group-hover:scale-110 group-hover:rotate-3 transition-all duration-200
                                                ring-2 ring-white/30
                                            `}>
                                                {String.fromCharCode(64 + parseInt(option.id))}
                                            </span>
                                            {option.text}
                                        </span>
                                        <span className="font-mono font-bold text-2xl text-white dark:text-white tabular-nums">
                                            {option.count} <span className="text-lg opacity-60">({option.percentage}%)</span>
                                        </span>
                                    </div>

                                    {/* Bar Background with Glassmorphism */}
                                    <div className="
                                        h-14 w-full rounded-2xl overflow-hidden relative
                                        bg-gradient-to-br from-white/10 via-white/5 to-transparent
                                        backdrop-blur-sm
                                        border border-white/10 dark:border-white/5
                                        shadow-lg shadow-black/5
                                        group-hover:shadow-xl group-hover:border-purple-400/30
                                        transition-all duration-300
                                    ">
                                        {/* Bar Fill with Glow */}
                                        <div
                                            className={`h-full ${option.color} transition-all duration-1000 ease-out flex items-center justify-end px-4 relative`}
                                            style={{ width: `${Math.max(option.percentage, 0)}%` }}
                                        >
                                            {/* Inner glow effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                                        </div>

                                        {/* Hover glow overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="flex flex-col gap-4">
                        {/* Stats */}
                        <div className="bg-purple-500 dark:bg-purple-600 rounded-xl p-6 shadow-sm text-white text-center">
                            <div className="text-5xl font-bold mb-1">
                                {votes.length}
                            </div>
                            <div className="text-sm opacity-90">
                                Total Votes
                            </div>
                        </div>

                        {/* Voter Feed */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-sm border border-white/10 dark:border-slate-700 overflow-hidden flex flex-col max-h-[600px]">
                            <div className="p-4 border-b border-white/10 dark:border-slate-700 bg-white/5 dark:bg-slate-800/50">
                                <h3 className="font-bold text-white dark:text-white flex items-center gap-2">
                                    <span>👥</span> Live Feed
                                </h3>
                            </div>
                            <div className="overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {votes.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 italic text-sm">Waiting for votes...</div>
                                ) : (
                                    votes.map((vote) => {
                                        const option = poll.options.find(o => o.id === vote.optionId);
                                        return (
                                            <div key={vote.id} className="
                                                flex items-center gap-3 p-3 rounded-xl 
                                                bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-slate-700/50 dark:via-slate-700/30 dark:to-transparent
                                                backdrop-blur-sm
                                                border border-white/20/50 dark:border-slate-600/50
                                                hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10
                                                hover:scale-[1.02]
                                                transition-all duration-200
                                                animate-slide-in-left
                                                group/card
                                            ">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-500 shadow-md bg-slate-200 group-hover/card:scale-110 transition-transform">
                                                    {vote.photoURL ? (
                                                        <img src={vote.photoURL} alt={vote.displayName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                            {(vote.displayName || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-sm text-white dark:text-white truncate">
                                                        {vote.displayName || 'Anonymous'}
                                                    </div>
                                                    <div className="text-xs text-white/60 dark:text-gray-400">
                                                        Voted for <span className="font-bold text-gray-700 dark:text-gray-200">{option?.text}</span>
                                                    </div>
                                                </div>

                                                {/* Badge for option */}
                                                {option && (
                                                    <div className={`
                                                        w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md ${option.color}
                                                        group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-200
                                                        ring-1 ring-white/30
                                                    `}>
                                                        {String.fromCharCode(64 + parseInt(option.id))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
