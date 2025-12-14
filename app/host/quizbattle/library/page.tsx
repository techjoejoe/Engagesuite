'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getQuizzesByUser, deleteQuiz, createGame, Quiz } from '@/lib/quizbattle';
import { onAuthStateChange } from '@/lib/auth';
import HamburgerMenu from '@/components/HamburgerMenu';

function QuizLibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                router.push('/login');
            } else {
                setUserId(user.uid);
                const userQuizzes = await getQuizzesByUser(user.uid);
                // Sort by creation date, newest first
                userQuizzes.sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });
                setQuizzes(userQuizzes);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleUseQuiz = async (quizId: string) => {
        if (!classId) {
            alert('Please select a class first');
            return;
        }
        try {
            const gameId = await createGame(quizId, classId, userId);
            router.push(`/host/quizbattle/lobby/${gameId}`);
        } catch (error) {
            console.error('Error creating game:', error);
            alert('Failed to start quiz');
        }
    };

    const handleEditQuiz = (quizId: string) => {
        router.push(`/host/quizbattle/edit/${quizId}?classId=${classId || 'default'}`);
    };

    const handleDeleteQuiz = async (quizId: string, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            try {
                await deleteQuiz(quizId);
                setQuizzes(quizzes.filter(q => q.id !== quizId));
            } catch (error) {
                console.error('Error deleting quiz:', error);
                alert('Failed to delete quiz');
            }
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '18px', color: '#666' }}>Loading quizzes...</div>
            </div>
        );
    }

    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            <HamburgerMenu currentPage="QuizBattle" />

            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#E44446', marginBottom: '4px' }}>
                            ⚡ Quiz Library
                        </h1>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => router.push(`/host/quizbattle/create?classId=${classId || 'default'}`)}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#4CAF50',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                            }}
                        >
                            + Create New Quiz
                        </button>
                        <button
                            onClick={() => router.back()}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Back
                        </button>
                    </div>
                </div>

                {/* Quizzes Grid */}
                {quizzes.length === 0 ? (
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '60px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>⚡</div>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ccc', marginBottom: '8px' }}>
                            No quizzes yet
                        </h2>
                        <p style={{ color: '#999', marginBottom: '24px' }}>
                            Create your first quiz to get started
                        </p>
                        <button
                            onClick={() => router.push(`/host/quizbattle/create?classId=${classId || 'default'}`)}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#4CAF50',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Create Quiz
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px'
                    }}>
                        {quizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                            >
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                                        {quiz.title}
                                    </h3>
                                    {quiz.description && (
                                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                                            {quiz.description}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '4px 12px',
                                            backgroundColor: '#E3F2FD',
                                            color: '#1976D2',
                                            borderRadius: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '4px 12px',
                                            backgroundColor: '#F3E5F5',
                                            color: '#7B1FA2',
                                            borderRadius: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {quiz.createdAt ? new Date(quiz.createdAt.seconds * 1000).toLocaleDateString() : 'New'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                    <button
                                        onClick={() => handleUseQuiz(quiz.id)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            backgroundColor: '#E44446',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Use Quiz
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                                        style={{
                                            padding: '10px 16px',
                                            backgroundColor: '#f5f5f5',
                                            color: '#E44446',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function QuizLibraryPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QuizLibraryContent />
        </Suspense>
    );
}
