'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getPoll, onPollChange, onVotesChange, togglePollResults, updatePollStatus, Poll, Vote } from '@/lib/poll';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';

export default function PollHostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
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

    // Listen to Votes
    useEffect(() => {
        const unsubscribe = onVotesChange(id, (newVotes) => {
            setVotes(newVotes);
        });
        return () => unsubscribe();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500">Loading Poll...</div>;
    if (!poll) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-red-500">Poll not found</div>;

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
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
            <HostMenu currentPage="LiveVote" classId={poll.classId} />

            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm flex flex-wrap justify-between items-center gap-5 border border-gray-100 dark:border-slate-700">
                    <div>
                        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1 flex items-center gap-2">
                            📊 LiveVote
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {votes.length} vote{votes.length !== 1 ? 's' : ''} received • {poll.status === 'active' ? '🟢 Active' : '🔴 Closed'}
                        </p>
                    </div>

                    <div className="flex gap-3 items-center">
                        <button
                            onClick={handleToggleResults}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm ${poll.showResults
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'
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
                            onClick={() => router.push(`/dashboard/class?id=${poll.classId}`)}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
                    {/* Main Chart Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm min-h-[600px] flex flex-col border border-gray-100 dark:border-slate-700">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                            {poll.question}
                        </h2>

                        <div className="flex-1 flex flex-col justify-center gap-6">
                            {results.map((option) => (
                                <div key={option.id} className="relative">
                                    {/* Label & Count */}
                                    <div className="flex justify-between items-end mb-2 z-10 relative">
                                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${option.color}`}>
                                                {String.fromCharCode(64 + parseInt(option.id))}
                                            </span>
                                            {option.text}
                                        </span>
                                        <span className="font-mono font-bold text-xl text-gray-900 dark:text-white">
                                            {option.count} ({option.percentage}%)
                                        </span>
                                    </div>

                                    {/* Bar Background */}
                                    <div className="h-12 w-full bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden relative">
                                        {/* Bar Fill */}
                                        <div
                                            className={`h-full ${option.color} transition-all duration-1000 ease-out flex items-center justify-end px-4`}
                                            style={{ width: `${Math.max(option.percentage, 0)}%` }}
                                        >
                                        </div>
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
                    </div>
                </div>
            </div>
        </main>
    );
}
