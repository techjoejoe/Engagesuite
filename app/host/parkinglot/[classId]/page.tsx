'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onParkingLotChange, markQuestionAnswered, deleteQuestion, answerQuestion, ParkingLotItem } from '@/lib/parkinglot';
import { onAuthStateChange } from '@/lib/auth';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';

export default function HostParkingLotPage() {
    const params = useParams();
    const classId = params.classId as string;
    console.log('[ParkingLot] Loaded with classId:', classId);
    const router = useRouter();
    const [questions, setQuestions] = useState<ParkingLotItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => {
            if (!u) router.push('/login');
            setUser(u);
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const unsubscribe = onParkingLotChange(classId, (data) => {
            setQuestions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [classId]);

    const handleMarkAnswered = async (id: string) => {
        try {
            await markQuestionAnswered(id);
        } catch (error) {
            console.error('Error marking answered:', error);
        }
    };

    const handleAnswerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answeringId || !answerText.trim()) return;
        try {
            await answerQuestion(answeringId, answerText);
            setAnsweringId(null);
            setAnswerText('');
        } catch (error) {
            console.error('Error answering question:', error);
            alert('Failed to submit answer.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            await deleteQuestion(id);
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500">Loading...</div>;

    const unanswered = questions.filter(q => q.status === 'unanswered');
    const answered = questions.filter(q => q.status === 'answered');

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <HostMenu currentPage="Parking Lot" classId={classId} />

            <div className="max-w-4xl mx-auto p-6 pt-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <span className="text-3xl">🚙</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parking Lot</h1>
                            <p className="text-gray-500 dark:text-gray-400">Manage questions from your students.</p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 border-transparent shadow"
                        onClick={() => router.push(`/dashboard/class?id=${classId}`)}
                    >
                        ← Back to Class
                    </Button>
                </div>

                <div className="space-y-8">
                    {/* Unanswered Section */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            Unanswered ({unanswered.length})
                        </h2>

                        {unanswered.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-100 dark:border-slate-700">
                                <p className="text-gray-400">No new questions. All clear! 🎉</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {unanswered.map((q) => (
                                    <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500 animate-slide-in">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">{q.question}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-bold text-indigo-500">{q.userName}</span>
                                                    <span>•</span>
                                                    <span>{q.createdAt?.toDate ? q.createdAt.toDate().toLocaleTimeString() : 'Just now'}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setAnsweringId(q.id);
                                                        setAnswerText('');
                                                    }}
                                                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-semibold text-sm"
                                                >
                                                    Answer
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAnswered(q.id)}
                                                    className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                    title="Mark as Answered (No Text)"
                                                >
                                                    <Icons.Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(q.id)}
                                                    className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Icons.Trash className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Answered Section */}
                    {answered.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-4">
                                Answered ({answered.length})
                            </h2>
                            <div className="grid gap-4 opacity-75">
                                {answered.map((q) => (
                                    <div key={q.id} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2 line-through decoration-gray-400">{q.question}</p>
                                                {q.answer && (
                                                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
                                                        <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Answer:</p>
                                                        <p className="text-gray-800 dark:text-gray-200">{q.answer}</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                                                    <span>{q.userName}</span>
                                                    <span>•</span>
                                                    <span>Answered</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(q.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Icons.Trash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Answer Modal */}
            {answeringId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAnsweringId(null)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-bounce-in">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Answer Question</h3>
                        <form onSubmit={handleAnswerSubmit}>
                            <textarea
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <Button type="button" variant="secondary" onClick={() => setAnsweringId(null)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                    Submit Answer
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
