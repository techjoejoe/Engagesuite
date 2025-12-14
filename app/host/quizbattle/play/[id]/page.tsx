'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getGame, getQuiz, onGameChange, nextQuestion, endGame, onResponsesChange, revealAnswer } from '@/lib/quizbattle';
import Button from '@/components/Button';
import HamburgerMenu from '@/components/HamburgerMenu';

export default function HostPlayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [game, setGame] = useState<any>(null);
    const [quiz, setQuiz] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [responses, setResponses] = useState<any[]>([]);

    useEffect(() => {
        const init = async () => {
            const [gameData, quizData] = await Promise.all([
                getGame(id),
                getGame(id).then(g => g ? getQuiz(g.quizId) : null)
            ]);
            setGame(gameData);
            setQuiz(quizData);
        };
        init();
    }, [id]);

    useEffect(() => {
        const unsubscribe = onGameChange(id, setGame);
        return () => unsubscribe();
    }, [id]);

    // Track responses for current question
    useEffect(() => {
        if (!game || game.currentQuestionIndex < 0) return;
        const unsubscribe = onResponsesChange(id, game.currentQuestionIndex, setResponses);
        return () => unsubscribe();
    }, [id, game?.currentQuestionIndex]);


    // Countdown timer for pre-game (currentQuestionIndex === -1)
    useEffect(() => {
        if (!game || !game.questionStartTime || game.currentQuestionIndex !== -1) return;

        const interval = setInterval(() => {
            const start = game.questionStartTime.toDate ? game.questionStartTime.toDate() : new Date(game.questionStartTime);
            const now = new Date();
            const elapsed = (now.getTime() - start.getTime()) / 1000;
            const remaining = Math.max(0, 5 - elapsed);
            setTimeLeft(Math.ceil(remaining));

            // Auto-advance to first question after countdown
            if (remaining <= 0) {
                clearInterval(interval);
                nextQuestion(id, -1); // Advance from -1 to 0
            }
        }, 100);

        return () => clearInterval(interval);
    }, [game?.currentQuestionIndex, game?.questionStartTime, id]);

    // Regular question timer
    useEffect(() => {
        if (!game || !quiz || game.currentQuestionIndex < 0) return;

        const question = quiz.questions[game.currentQuestionIndex];
        if (!question || !game.questionStartTime || game.phase === 'reveal') return; // Stop if revealed

        const interval = setInterval(() => {
            const start = game.questionStartTime.toDate ? game.questionStartTime.toDate() : new Date(game.questionStartTime);
            const now = new Date();
            const elapsed = (now.getTime() - start.getTime()) / 1000;
            const remaining = Math.max(0, question.timeLimit - elapsed);
            setTimeLeft(Math.floor(remaining));

            if (remaining <= 0) {
                clearInterval(interval);
                // Auto-reveal when time is up
                if (game.phase === 'question') {
                    revealAnswer(id);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [game, quiz, id]); // Added id to deps

    const handleNext = async () => {
        if (!game || !quiz) return;

        if (game.phase === 'question') {
            await revealAnswer(id);
        } else {
            if (game.currentQuestionIndex >= quiz.questions.length - 1) {
                await endGame(id);
                router.push(`/host/quizbattle/results/${id}`);
            } else {
                await nextQuestion(id, game.currentQuestionIndex);
                setResponses([]);
            }
        }
    };

    if (!game || !quiz) return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Loading...
        </div>
    );

    const playerCount = Object.keys(game.players).length;
    const responseCount = responses.length;

    // Countdown screen
    if (game.currentQuestionIndex === -1) {
        return (
            <main style={{
                minHeight: '100vh',
                backgroundColor: '#1a1d21',
                fontFamily: 'sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <HamburgerMenu currentPage="QuizBattle" />
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '32px', color: '#ccc', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '2px' }}>Get Ready!</h2>
                    <div style={{
                        fontSize: '160px',
                        fontWeight: 'bold',
                        color: timeLeft <= 2 ? '#E44446' : '#4A90E2',
                        marginBottom: '40px',
                        animation: 'pulse 1s ease-in-out infinite'
                    }}>
                        {timeLeft}
                    </div>
                    <p style={{ fontSize: '24px', color: '#999' }}>Quiz starting soon...</p>
                    <p style={{ fontSize: '18px', color: '#666', marginTop: '20px' }}>{playerCount} players ready</p>
                </div>
            </main>
        );
    }

    const currentQuestion = quiz.questions[game.currentQuestionIndex];
    const answerDistribution = currentQuestion?.answers.map((_: any, index: number) =>
        responses.filter(r => r.answerIndex === index).length
    ) || [];

    const answerColors = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];
    const answerLabels = ['A', 'B', 'C', 'D'];

    return (
        <main style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px'
        }}>
            <HamburgerMenu currentPage="QuizBattle" />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                padding: '0 20px'
            }}>
                <div>
                    <div style={{ color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Question {game.currentQuestionIndex + 1} of {quiz.questions.length}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1d21' }}>{quiz.title}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '48px',
                        fontWeight: 'bold',
                        color: timeLeft <= 5 ? '#E44446' : '#1a1d21',
                        fontVariantNumeric: 'tabular-nums'
                    }}>
                        {timeLeft}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>SECONDS</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <Button
                        variant="secondary"
                        className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                        onClick={() => router.push(`/dashboard/class?id=${game.classId}`)}
                    >
                        ← Back to Class
                    </Button>
                    <div>
                        <div style={{ color: '#666', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Players</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1d21' }}>{playerCount}</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                {/* Question Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '40px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    width: '100%',
                    textAlign: 'center',
                    marginBottom: '40px',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {currentQuestion?.mediaUrl && (
                        <div style={{ marginBottom: '24px', maxHeight: '400px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img
                                src={currentQuestion.mediaUrl}
                                alt="Question Media"
                                style={{ maxHeight: '400px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                    <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1d21', lineHeight: '1.3' }}>
                        {currentQuestion?.text}
                    </h2>
                </div>

                {/* Answer Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    width: '100%',
                    flex: 1
                }}>
                    {currentQuestion?.answers.map((answer: any, index: number) => {
                        const count = answerDistribution[index] || 0;
                        const color = answerColors[index % answerColors.length];
                        const isCorrect = index === currentQuestion.correctAnswerIndex;
                        const isReveal = game.phase === 'reveal';

                        return (
                            <div key={index} style={{
                                backgroundColor: color,
                                borderRadius: '16px',
                                padding: '24px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: isReveal && isCorrect ? '0 0 0 4px #4ade80, 0 10px 40px rgba(74, 222, 128, 0.5)' : '0 4px 12px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                border: isReveal && isCorrect ? '4px solid white' : 'none',
                                minHeight: '120px',
                                opacity: isReveal && !isCorrect ? 0.3 : 1,
                                transform: isReveal && isCorrect ? 'scale(1.02)' : 'scale(1)',
                                transition: 'all 0.3s ease'
                            }}>
                                {/* Icon/Label */}
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    marginRight: '16px',
                                    flexShrink: 0
                                }}>
                                    {answerLabels[index]}
                                </div>

                                {/* Text */}
                                <div style={{ flex: 1, fontSize: '32px', fontWeight: '700', color: 'white', zIndex: 1 }}>
                                    {answer.text}
                                </div>

                                {/* Count - Show when timer is 0 OR in reveal phase */}
                                {(timeLeft === 0 || isReveal) && (
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        backgroundColor: 'rgba(0,0,0,0.15)',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        minWidth: '60px',
                                        textAlign: 'center',
                                        zIndex: 1,
                                        animation: 'fadeIn 0.5s ease-out'
                                    }}>
                                        {count}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Notes Popup (Reveal Only) */}
                {game.phase === 'reveal' && currentQuestion.notes && (
                    <div className="mt-8 w-full bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-xl animate-bounce-in">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">💡</div>
                            <div>
                                <h3 className="font-bold text-yellow-800 uppercase tracking-widest text-sm mb-1">Host Notes</h3>
                                <div className="text-lg text-yellow-900 font-medium leading-relaxed">
                                    {currentQuestion.notes}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div style={{
                marginTop: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
            }}>
                <div style={{ fontSize: '16px', color: '#666' }}>
                    <span style={{ fontWeight: 'bold', color: '#1a1d21' }}>{responseCount}</span> of <span style={{ fontWeight: 'bold', color: '#1a1d21' }}>{playerCount}</span> answered
                </div>
                <button
                    onClick={handleNext}
                    style={{
                        backgroundColor: '#4A90E2',
                        color: 'white',
                        border: 'none',
                        padding: '16px 48px',
                        borderRadius: '12px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {game.phase === 'question' ? 'Reveal Answer' : (game.currentQuestionIndex >= quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question')}
                </button>
            </div>
        </main >
    );
}
