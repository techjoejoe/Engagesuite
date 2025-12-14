'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getGame, getQuiz, onGameChange, submitAnswer, calculateScore, updatePlayerScore, joinGame } from '@/lib/quizbattle';
import { getCurrentUser } from '@/lib/auth';

interface StudentQuizBattleProps {
    gameId: string;
    userId: string;
}

export default function StudentQuizBattle({ gameId, userId }: StudentQuizBattleProps) {
    const router = useRouter();
    const [game, setGame] = useState<any>(null);
    const [quiz, setQuiz] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ correct: boolean; points: number } | null>(null);
    const [joining, setJoining] = useState(true);

    useEffect(() => {
        const init = async () => {
            const [gameData, quizData] = await Promise.all([
                getGame(gameId),
                getGame(gameId).then(g => g ? getQuiz(g.quizId) : null)
            ]);
            setGame(gameData);
            setQuiz(quizData);
        };
        init();
    }, [gameId]);

    useEffect(() => {
        const unsubscribe = onGameChange(gameId, (gameData) => {
            console.log('Student game update:', {
                status: gameData.status,
                currentQuestionIndex: gameData.currentQuestionIndex,
                hasQuestionStartTime: !!gameData.questionStartTime
            });
            setGame(gameData);
            // We don't redirect to results here, we'll render a results view in-place or let the parent handle it
        });
        return () => unsubscribe();
    }, [gameId]);

    // Auto-join logic
    useEffect(() => {
        const checkAndJoin = async () => {
            if (!game || !userId) return;

            // Check if player is already in game
            if (!game.players || !game.players[userId]) {
                console.log('Auto-joining game...');
                // Get user name from auth or local storage
                const user = getCurrentUser();
                const nickname = user?.displayName || localStorage.getItem('playerName') || 'Student';

                await joinGame(gameId, userId, nickname);
            }
            setJoining(false);
        };

        if (game) {
            checkAndJoin();
        }
    }, [game, userId, gameId]);

    useEffect(() => {
        if (game) {
            setHasAnswered(false);
            setSelectedAnswer(null);
            setFeedback(null);
        }
    }, [game?.currentQuestionIndex]);

    // Countdown/Question timer
    useEffect(() => {
        if (!game || !game.questionStartTime) return;

        const interval = setInterval(() => {
            const start = game.questionStartTime.toDate ? game.questionStartTime.toDate() : new Date(game.questionStartTime);
            const now = new Date();
            const elapsed = (now.getTime() - start.getTime()) / 1000;

            // Countdown phase
            if (game.currentQuestionIndex === -1) {
                const remaining = Math.max(0, 5 - elapsed);
                setTimeLeft(Math.ceil(remaining));
                return;
            }

            // Regular question phase
            if (!quiz || game.currentQuestionIndex < 0) return;
            const question = quiz.questions[game.currentQuestionIndex];
            if (!question) return;

            const remaining = Math.max(0, question.timeLimit - elapsed);
            setTimeLeft(Math.floor(remaining));

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [game?.currentQuestionIndex, game?.questionStartTime, quiz]);

    const handleAnswer = async (answerIndex: number) => {
        if (hasAnswered || !game || !quiz || !userId) return;

        const question = quiz.questions[game.currentQuestionIndex];
        const start = game.questionStartTime.toDate ? game.questionStartTime.toDate() : new Date(game.questionStartTime);
        const timeToAnswer = Date.now() - start.getTime();
        const correct = answerIndex === question.correctAnswerIndex;
        const pointsEarned = correct ? calculateScore(timeToAnswer, question.timeLimit, question.points) : 0;

        setSelectedAnswer(answerIndex);
        setHasAnswered(true);
        setFeedback({ correct, points: pointsEarned });

        await submitAnswer(gameId, userId, game.currentQuestionIndex, answerIndex, timeToAnswer, correct, pointsEarned, game.classId);

        const currentScore = game.players[userId]?.score || 0;
        await updatePlayerScore(gameId, userId, currentScore + pointsEarned);
    };

    if (!game || !quiz || joining) {
        return (
            <div className="flex items-center justify-center h-full text-white">
                <div className="animate-pulse text-xl font-bold">Loading Game...</div>
            </div>
        );
    }

    if (game.status === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white">
                <h2 className="text-5xl font-black mb-6 drop-shadow-lg">Game Over!</h2>
                <p className="text-2xl mb-8 font-medium">You scored <span className="font-bold text-yellow-300">{game.players[userId]?.score || 0}</span> points</p>
                <div className="text-8xl animate-bounce drop-shadow-2xl mb-8">🏆</div>
                <div className="text-white/60 font-medium animate-pulse bg-white/10 px-6 py-2 rounded-full">
                    Waiting for host...
                </div>
            </div>
        );
    }

    // Countdown phase before first question
    if (game.currentQuestionIndex === -1) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white">
                <h2 className="text-4xl font-black mb-12 drop-shadow-lg uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Get Ready!
                </h2>
                <div className={`text-9xl font-black mb-12 drop-shadow-2xl transition-all duration-300 ${timeLeft <= 2 ? 'text-red-500 animate-pulse scale-110' : 'text-blue-400'}`}>
                    {timeLeft}
                </div>
                <p className="text-2xl font-medium text-slate-300 animate-pulse">Quiz starting...</p>
                <div className="mt-8 text-slate-400">
                    <p className="text-lg">Your score: <span className="font-bold text-white">{game.players[userId]?.score || 0}</span></p>
                </div>
            </div>
        );
    }

    if (game.currentQuestionIndex < 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white/10 backdrop-blur-md rounded-3xl shadow-xl border border-white/20">
                <div className="text-8xl mb-6 animate-bounce drop-shadow-md">⚡</div>
                <div className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">GAME ON!</div>
                <div className="text-xl text-white/80 font-medium">
                    Look up at the screen!
                </div>
                <div className="mt-8 px-8 py-3 bg-white/20 text-white rounded-full font-bold text-sm uppercase tracking-widest animate-pulse border border-white/30 shadow-inner">
                    Waiting for host to start...
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[game.currentQuestionIndex];
    const answerStyles = [
        { bg: 'bg-red-500', hover: 'hover:bg-red-600', icon: '▲', label: 'A' },
        { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', icon: '◆', label: 'B' },
        { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', icon: '●', label: 'C' },
        { bg: 'bg-green-500', hover: 'hover:bg-green-600', icon: '■', label: 'D' }
    ];

    return (
        <div className="flex flex-col h-full font-sans text-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-white/70 font-bold uppercase tracking-wider bg-black/20 px-3 py-1 rounded-lg">
                    Question {game.currentQuestionIndex + 1} of {quiz.questions.length}
                </div>
                <div className={`text-4xl font-black tabular-nums drop-shadow-md ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {timeLeft}
                </div>
            </div>

            {/* Question */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 shadow-xl border border-white/20 text-center min-h-[160px] flex items-center justify-center">
                <h2 className="text-2xl font-bold text-white leading-snug drop-shadow-sm">
                    {currentQuestion.text}
                </h2>
            </div>

            {/* Answers */}
            <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                {currentQuestion.answers.map((answer: any, index: number) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswerIndex;
                    const style = answerStyles[index % answerStyles.length];

                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={hasAnswered || timeLeft <= 0}
                            className={`
                                relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-lg border-b-4 border-black/20
                                ${style.bg} ${!hasAnswered && timeLeft > 0 ? style.hover : ''}
                                ${hasAnswered && isCorrect ? 'ring-4 ring-white scale-[1.02] z-10' : ''}
                                ${hasAnswered && isSelected && !isCorrect ? 'ring-4 ring-black/50 opacity-80' : ''}
                                ${hasAnswered && !isCorrect && !isSelected ? 'opacity-40 grayscale' : 'opacity-100'}
                                ${!hasAnswered && timeLeft > 0 ? 'active:scale-95 active:border-b-0 translate-y-0 active:translate-y-1' : ''}
                            `}
                        >
                            <div className="text-7xl font-black drop-shadow-lg text-white">{style.label}</div>
                            <div className="text-center w-full font-bold text-lg z-10 drop-shadow-sm">{answer.text}</div>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {feedback && (
                <div className={`
                    fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px]
                    rounded-2xl p-6 text-center shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] z-50 border-4 border-white/20 backdrop-blur-xl
                    ${feedback.correct ? 'bg-green-500/90' : 'bg-red-500/90'}
                    text-white
                `}>
                    <div className="text-5xl mb-2 drop-shadow-md">
                        {feedback.correct ? '✓' : '✗'}
                    </div>
                    <div className="text-3xl font-black mb-1 drop-shadow-md">
                        {feedback.correct ? 'Correct!' : 'Incorrect'}
                    </div>

                    {feedback.correct && (
                        <div className="text-xl font-bold opacity-90">+{feedback.points} points</div>
                    )}
                </div>
            )}
        </div>
    );
}
