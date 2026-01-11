'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPoll, PollOption } from '@/lib/poll';
import { onAuthStateChange } from '@/lib/auth';
import { updateClassActivity } from '@/lib/classes';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';

const DEFAULT_COLORS = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-orange-500',
];

function CreatePollContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<PollOption[]>([
        { id: '1', text: '', color: DEFAULT_COLORS[0] },
        { id: '2', text: '', color: DEFAULT_COLORS[1] },
    ]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => {
            if (!u) router.push('/login');
            setUser(u);
        });
        return () => unsubscribe();
    }, [router]);

    const handleAddOption = () => {
        if (options.length >= 6) return;
        const newId = (options.length + 1).toString();
        setOptions([...options, {
            id: newId,
            text: '',
            color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length]
        }]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) return;
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleOptionChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].text = text;
        setOptions(newOptions);
    };

    const handleLaunch = async () => {
        if (!question.trim() || options.some(o => !o.text.trim())) {
            alert('Please fill in the question and all options.');
            return;
        }
        if (!user) {
            alert('You must be logged in to create a poll.');
            return;
        }

        if (!classId) {
            alert('No class selected. Please launch this tool from the Dashboard or a specific Class page.');
            return;
        }

        setLoading(true);
        try {
            console.log('Creating poll with:', { classId, userId: user.uid, question, options });
            const pollId = await createPoll(classId, user.uid, question, options);
            console.log('Poll created successfully with ID:', pollId);

            // Update class activity so students are redirected
            await updateClassActivity(classId, { type: 'poll', id: pollId });
            console.log('Class activity updated');

            router.push(`/host/poll/${pollId}`);
        } catch (error: any) {
            console.error('Error creating poll:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            alert(`Failed to create poll: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
            <HostMenu currentPage="LiveVote" classId={classId || undefined} />

            <div className="max-w-3xl mx-auto pt-10">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col gap-4 mb-8">
                        {classId && (
                            <button
                                onClick={() => router.push(`/dashboard/class?id=${classId}`)}
                                className="self-start text-sm font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 transition-colors"
                            >
                                &larr; Back to Class
                            </button>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <span className="text-3xl">📊</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create LiveVote</h1>
                                <p className="text-gray-500 dark:text-gray-400">Ask your class a question and get real-time feedback.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Question Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Question
                            </label>
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g., What is the capital of France?"
                                className="w-full p-4 text-lg rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            />
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Options
                            </label>
                            {options.map((option, index) => (
                                <div key={option.id} className="flex gap-3 items-center animate-fade-in">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm ${option.color}`}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                    {options.length > 2 && (
                                        <button
                                            onClick={() => handleRemoveOption(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove option"
                                        >
                                            <Icons.Close className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Option Button */}
                        {options.length < 6 && (
                            <button
                                onClick={handleAddOption}
                                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-gray-500 dark:text-gray-400 font-medium hover:border-green-500 hover:text-green-500 transition-all flex items-center justify-center gap-2"
                            >
                                <Icons.Plus className="w-5 h-5" />
                                Add Option
                            </button>
                        )}

                        <div className="pt-6">
                            <Button
                                variant="primary"
                                onClick={handleLaunch}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30"
                            >
                                {loading ? 'Launching...' : '🚀 Launch Vote'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function CreatePollPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-slate-900" />}>
            <CreatePollContent />
        </Suspense>
    );
}
