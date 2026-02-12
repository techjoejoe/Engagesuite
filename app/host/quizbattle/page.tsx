'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HostMenu from '@/components/HostMenu';
import { getQuizzesByUser, deleteQuiz, cloneQuiz, Quiz } from '@/lib/quizbattle';
import { onAuthStateChange } from '@/lib/auth';
import { Icons } from '@/components/picpick/Icons';

function MyGamesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId') || 'default';
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                router.push('/login');
            } else {
                setUserId(user.uid);
                loadQuizzes(user.uid);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const loadQuizzes = async (uid: string) => {
        try {
            const userQuizzes = await getQuizzesByUser(uid);
            // Sort by creation date, newest first
            userQuizzes.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });
            setQuizzes(userQuizzes);
        } catch (error) {
            console.error('Error loading quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClone = async (quizId: string) => {
        if (!confirm('Are you sure you want to clone this quiz?')) return;
        try {
            await cloneQuiz(quizId, userId);
            loadQuizzes(userId); // Reload list
        } catch (error) {
            console.error('Error cloning quiz:', error);
            alert('Failed to clone quiz');
        }
    };

    const handleDelete = async (quizId: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
        try {
            await deleteQuiz(quizId);
            setQuizzes(quizzes.filter(q => q.id !== quizId));
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Failed to delete quiz');
        }
    };

    const handleEdit = (quizId: string) => {
        router.push(`/host/quizbattle/lobby/${quizId}?classId=${classId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent text-white/70 dark:text-gray-300">
                Loading...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-transparent p-6 font-sans transition-colors duration-300">
            <HostMenu currentPage="QuizBattle" classId={classId !== 'default' ? classId : undefined} />

            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        {classId !== 'default' && (
                            <button
                                onClick={() => router.push(`/dashboard/class?id=${classId}`)}
                                className="text-sm font-bold text-blue-600 hover:underline mb-2 flex items-center gap-1"
                            >
                                &larr; Back to Class
                            </button>
                        )}
                        <h1 className="text-3xl font-bold text-white dark:text-white mb-2">My Games</h1>
                        <p className="text-white/70 dark:text-gray-400 text-base">Manage your quizzes and games</p>
                    </div>
                    <button
                        onClick={() => router.push(`/host/quizbattle/create?classId=${classId}`)}
                        className="bg-[#E44446] text-white border-none px-6 py-3 rounded-xl font-semibold text-base cursor-pointer flex items-center gap-2 shadow-lg hover:-translate-y-0.5 transition-transform"
                    >
                        <span className="text-xl">+</span> Create Game
                    </button>
                </div>

                {/* Games List */}
                <div className="grid gap-4">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id}
                            onClick={() => handleEdit(quiz.id)}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex items-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border border-transparent hover:border-white/20 dark:hover:border-slate-700 group"
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mr-5 text-[#E44446] text-2xl">
                                ⚡
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white dark:text-white mb-1.5">
                                    {quiz.title}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-white/70 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-base">📝</span> {quiz.questions?.length || 0} Questions
                                    </span>
                                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                                    <span>Created {quiz.createdAt ? new Date(quiz.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleClone(quiz.id); }}
                                    className="w-10 h-10 rounded-xl border border-white/20 dark:border-slate-700 bg-white/10 backdrop-blur-sm text-white/60 dark:text-gray-400 flex items-center justify-center transition-all hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Clone Game"
                                >
                                    <Icons.Copy style={{ width: '18px', height: '18px' }} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id, quiz.title); }}
                                    className="w-10 h-10 rounded-xl border border-white/20 dark:border-slate-700 bg-white/10 backdrop-blur-sm text-white/60 dark:text-gray-400 flex items-center justify-center transition-all hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Delete Game"
                                >
                                    <Icons.Trash style={{ width: '18px', height: '18px' }} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/host/quizbattle/create?quizId=${quiz.id}&classId=${classId}`); }}
                                    className="w-10 h-10 rounded-xl border border-white/20 dark:border-slate-700 bg-white/10 backdrop-blur-sm text-white/60 dark:text-gray-400 flex items-center justify-center transition-all hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Edit Game"
                                >
                                    <Icons.Edit style={{ width: '18px', height: '18px' }} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(quiz.id); }}
                                    className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors border-none"
                                >
                                    Open
                                </button>
                            </div>
                        </div>
                    ))}

                    {quizzes.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white/10 backdrop-blur-sm rounded-2xl shadow-sm">
                            <div className="text-6xl mb-6">🎮</div>
                            <h3 className="text-2xl font-bold text-white dark:text-white mb-3">
                                No games yet
                            </h3>
                            <p className="text-white/70 dark:text-gray-400 mb-8 text-base">
                                Create your first interactive quiz game to get started!
                            </p>
                            <button
                                onClick={() => router.push(`/host/quizbattle/create?classId=${classId}`)}
                                className="bg-[#E44446] text-white border-none px-8 py-4 rounded-xl font-bold text-base cursor-pointer shadow-lg hover:-translate-y-0.5 transition-transform"
                            >
                                Create Game
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function MyGamesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MyGamesContent />
        </Suspense>
    );
}
