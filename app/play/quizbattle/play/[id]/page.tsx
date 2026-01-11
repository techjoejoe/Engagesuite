'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getGame, getQuiz, onGameChange, submitAnswer, calculateScore, updatePlayerScore } from '@/lib/quizbattle';

export default function StudentPlayPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [game, setGame] = useState<any>(null);
    const [quiz, setQuiz] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ correct: boolean; points: number } | null>(null);
    const [userId, setUserId] = useState('');

    useEffect(() => {
        const uid = localStorage.getItem('userId') || '';
        setUserId(uid);
    }, []);

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
        const unsubscribe = onGameChange(id, (gameData) => {
            setGame(gameData);
            if (gameData.status === 'finished') {
                router.push(`/play/quizbattle/results/${id}`);
            }
        });
        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (game) {
            setHasAnswered(false);
            setSelectedAnswer(null);
            setFeedback(null);
        }
    }, [game?.currentQuestionIndex]);

    useEffect(() => {
        if (!game || !quiz || game.currentQuestionIndex < 0) return;

        const question = quiz.questions[game.currentQuestionIndex];
        if (!question || !game.questionStartTime || game.phase === 'reveal') return;

        const interval = setInterval(() => {
            const start = game.questionStartTime.toDate ? game.questionStartTime.toDate() : new Date(game.questionStartTime);
            const now = new Date();
            const elapsed = (now.getTime() - start.getTime()) / 1000;
            const remaining = Math.max(0, question.timeLimit - elapsed);
            setTimeLeft(Math.floor(remaining));

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [game, quiz]);

    const handleAnswer = async (answerIndex: number) => {
        if (hasAnswered || !game || !quiz || !userId || !game.questionStartTime) return;

        const question = quiz.questions[game.currentQuestionIndex];
        const start = game.questionStartTime.toDate ? game.questionStartTime.toDate() : new Date(game.questionStartTime);
        const timeToAnswer = Date.now() - start.getTime();
        const correct = answerIndex === question.correctAnswerIndex;
        const pointsEarned = correct ? calculateScore(timeToAnswer, question.timeLimit, question.points) : 0;

        setSelectedAnswer(answerIndex);
        setHasAnswered(true);
        setFeedback({ correct, points: pointsEarned });

        await submitAnswer(id, userId, game.currentQuestionIndex, answerIndex, timeToAnswer, correct, pointsEarned);

        const currentScore = game.players[userId]?.score || 0;
        await updatePlayerScore(id, userId, currentScore + pointsEarned);
    };

    if (!game || !quiz) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Loading...
            </div>
        );
    }

    if (game.currentQuestionIndex < 0) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: 'sans-serif' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏳</div>
                <div style={{ fontSize: '24px', color: '#1a1d21', fontWeight: 'bold', marginBottom: '8px' }}>Get Ready!</div>
                <div style={{ fontSize: '16px', color: '#666' }}>Waiting for next question...</div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[game.currentQuestionIndex];
    const isReveal = game.phase === 'reveal';
    const answerStyles = [
        { bg: '#E21B3C', icon: '▲', label: 'A' },
        { bg: '#1368CE', icon: '◆', label: 'B' },
        { bg: '#D89E00', icon: '●', label: 'C' },
        { bg: '#26890C', icon: '■', label: 'D' }
    ];

    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Question {game.currentQuestionIndex + 1} of {quiz.questions.length}
                </div>
                <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: timeLeft <= 5 ? '#E44446' : '#1a1d21',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    {timeLeft}
                </div>
            </div>

            {/* Question */}
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: '32px',
                marginBottom: '32px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                textAlign: 'center',
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
            }}>
                {currentQuestion.mediaUrl && (
                    <div style={{ marginBottom: '16px', maxHeight: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <img
                            src={currentQuestion.mediaUrl}
                            alt="Question Media"
                            style={{ maxHeight: '250px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }}
                        />
                    </div>
                )}
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1d21', lineHeight: '1.4' }}>
                    {currentQuestion.text}
                </h2>
            </div>

            {/* Answers */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {currentQuestion.answers.map((answer: any, index: number) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswerIndex;
                    const style = answerStyles[index % answerStyles.length];

                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={hasAnswered || timeLeft <= 0 || isReveal}
                            style={{
                                backgroundColor: style.bg,
                                borderRadius: '16px',
                                padding: '20px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: (hasAnswered || timeLeft <= 0 || isReveal) ? 'default' : 'pointer',
                                boxShadow: (hasAnswered || isReveal) && isCorrect
                                    ? '0 0 0 4px #4CAF50, 0 4px 12px rgba(0,0,0,0.2)'
                                    : hasAnswered && isSelected
                                        ? '0 0 0 4px #E44446, 0 4px 12px rgba(0,0,0,0.2)'
                                        : '0 4px 8px rgba(0,0,0,0.1)',
                                opacity: (hasAnswered || isReveal) && !isCorrect && !isSelected ? 0.3 : 1,
                                transform: (hasAnswered || isReveal) && isCorrect ? 'scale(1.02)' : 'scale(1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                position: 'relative',
                                overflow: 'hidden',
                                border: (isReveal && isCorrect) ? '4px solid white' : 'none',
                                color: 'white'
                            }}
                        >
                            <div style={{ fontSize: '32px' }}>{style.icon}</div>
                            <div style={{ textAlign: 'center', width: '100%', zIndex: 1 }}>{answer.text}</div>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {(feedback || isReveal) && (
                <div style={{
                    backgroundColor: feedback?.correct ? '#4CAF50' : '#E44446',
                    color: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    animation: 'var(--animate-slide-up)'
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>
                        {feedback?.correct ? '✓' : '✗'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {feedback ? (feedback.correct ? 'Correct!' : 'Incorrect') : 'Time\'s Up!'}
                    </div>
                    {feedback?.correct && (
                        <div style={{ fontSize: '18px', opacity: 0.9 }}>+{feedback.points} points</div>
                    )}
                    {!feedback && isReveal && (
                        <div style={{ fontSize: '18px', opacity: 0.9 }}>Be faster next time!</div>
                    )}
                </div>
            )}


        </main>
    );
}
