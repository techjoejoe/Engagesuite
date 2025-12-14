'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import Timer from '@/components/Timer';
import { subscribeToGame, submitAnswer, getLeaderboard } from '@/lib/game';
import { GameState, LeaderboardEntry } from '@/types';

function PlayGameContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState<string>('');
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);

    useEffect(() => {
        const storedPlayerId = localStorage.getItem('playerId');
        const storedPlayerName = localStorage.getItem('playerName');
        setPlayerId(storedPlayerId);
        setPlayerName(storedPlayerName || 'Player');

        if (!roomCode) return;

        const unsubscribe = subscribeToGame(roomCode, (state) => {
            setGameState(state);
        });

        return () => unsubscribe();
    }, [roomCode]);

    useEffect(() => {
        if (gameState && roomCode) {
            setSelectedOption(null);
            setHasAnswered(false);
            setShowResult(false);
            setQuestionStartTime(Date.now());
            getLeaderboard(roomCode).then(setLeaderboard);
        }
    }, [gameState?.currentQuestionIndex, roomCode]);

    const handleAnswerSelect = async (optionIndex: number) => {
        if (!gameState || !playerId || hasAnswered || !roomCode) return;

        const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
        if (!currentQuestion) return;

        const timeElapsed = (Date.now() - questionStartTime) / 1000;

        setSelectedOption(optionIndex);
        setHasAnswered(true);

        const correct = optionIndex === currentQuestion.correctAnswer;
        setWasCorrect(correct);
        setShowResult(true);

        // 🎉 CONFETTI EXPLOSION for correct answers!
        if (correct) {
            const count = 200;
            const defaults = {
                origin: { y: 0.7 },
                zIndex: 9999,
            };

            function fire(particleRatio: number, opts: any) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio),
                });
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        }

        await submitAnswer(
            roomCode,
            playerId,
            currentQuestion.id,
            optionIndex,
            timeElapsed
        );
    };

    if (!roomCode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="glass-card p-8 text-center max-w-sm">
                    <h2 className="text-2xl font-bold mb-4 text-red-400">Error</h2>
                    <p className="text-gray-400">No room code provided.</p>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-500">
                <div className="animate-pulse text-2xl font-bold text-white">
                    Loading game...
                </div>
            </div>
        );
    }

    const player = playerId ? gameState.players[playerId] : null;
    const currentQuestion = gameState.currentQuestionIndex >= 0
        ? gameState.questions[gameState.currentQuestionIndex]
        : null;

    const answerColors = [
        'bg-gradient-to-br from-red-400 to-red-500 shadow-red-500/40',
        'bg-gradient-to-br from-teal-400 to-teal-500 shadow-teal-500/40',
        'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-yellow-500/40',
        'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/40',
    ];

    return (
        <main
            className={`min-h-screen p-6 overflow-y-auto relative ${gameState.status === 'finished'
                    ? 'bg-gradient-to-br from-orange-200 to-blue-900'
                    : 'bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-500'
                }`}
        >
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-full h-full bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse" />
                <div className="absolute w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse delay-1000" />
            </div>

            <div className="container max-w-2xl mx-auto relative z-10">
                {/* Header Card */}
                <div className="flex justify-between items-center mb-6 bg-white/95 backdrop-blur-sm p-5 rounded-3xl shadow-2xl">
                    <div>
                        <div className="text-xl font-extrabold text-gray-800">
                            {playerName}
                        </div>
                        <div className="text-sm font-semibold text-gray-500">
                            Room: {roomCode}
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full font-black text-2xl text-amber-900 shadow-lg shadow-amber-400/50">
                        {player?.score || 0} 🏆
                    </div>
                </div>

                {gameState.status === 'lobby' && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 text-center shadow-2xl animate-fade-in">
                        <div className="text-8xl mb-6 animate-bounce">
                            ⏳
                        </div>
                        <h2 className="text-4xl md:text-5xl mb-4 font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                            Get Ready!
                        </h2>
                        <p className="text-gray-500 text-lg md:text-xl font-semibold mb-10">
                            The game starts soon...
                        </p>
                        <div className="inline-block px-6 py-4 bg-gray-100 rounded-2xl text-lg font-bold text-gray-700">
                            {Object.keys(gameState.players || {}).length} player{Object.keys(gameState.players || {}).length !== 1 ? 's' : ''} ready
                        </div>
                    </div>
                )}

                {gameState.status === 'active' && currentQuestion && !showResult && (
                    <div className="animate-fade-in">
                        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl mb-8 text-center shadow-2xl">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">
                                Question {gameState.currentQuestionIndex + 1} of {gameState.questions.length}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 leading-tight">
                                {currentQuestion.question}
                            </h2>

                            <Timer
                                duration={currentQuestion.timeLimit}
                                maxPoints={currentQuestion.points}
                                onComplete={() => {
                                    if (!hasAnswered) {
                                        setHasAnswered(true);
                                        setShowResult(true);
                                    }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(index)}
                                    disabled={hasAnswered}
                                    className={`
                                        p-6 text-xl md:text-2xl font-bold rounded-3xl text-white transition-all duration-200 text-center
                                        border-4 border-transparent shadow-xl transform
                                        ${answerColors[index % answerColors.length]}
                                        ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:-translate-y-1'}
                                    `}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState.status === 'active' && currentQuestion && showResult && (
                    <div className="bg-white/95 backdrop-blur-sm p-12 rounded-3xl text-center shadow-2xl animate-fade-in">
                        <div className={`text-9xl mb-6 ${wasCorrect ? 'animate-bounce' : ''}`}>
                            {wasCorrect ? '🎉' : '😔'}
                        </div>
                        <h2 className={`text-4xl md:text-5xl font-black mb-4 ${wasCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {wasCorrect ? 'Amazing!' : 'Oops!'}
                        </h2>
                        {wasCorrect && player && (
                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mt-6">
                                +{player.score} points! 🌟
                            </div>
                        )}
                        {!wasCorrect && (
                            <div className="mt-8 p-6 bg-red-50 rounded-2xl text-red-900 border border-red-100">
                                <div className="text-sm font-bold uppercase tracking-widest mb-2 text-red-400">Correct Answer</div>
                                <div className="text-2xl font-bold">
                                    {currentQuestion.options[currentQuestion.correctAnswer]}
                                </div>
                            </div>
                        )}
                        <div className="mt-12 text-gray-400 font-semibold animate-pulse">
                            Get ready for the next question... 🚀
                        </div>
                    </div>
                )}

                {gameState.status === 'finished' && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl animate-fade-in">
                        <h2 className="text-center text-4xl md:text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                            🏆 Final Results
                        </h2>
                        <div className="space-y-3">
                            {leaderboard.map((entry, index) => {
                                const isCurrentPlayer = entry.playerId === playerId;
                                const isTop3 = index < 3;
                                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                                return (
                                    <div
                                        key={entry.playerId}
                                        className={`
                                            flex items-center gap-4 p-6 rounded-2xl transition-all
                                            ${isCurrentPlayer
                                                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-400'
                                                : isTop3
                                                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50'
                                                    : 'bg-gray-50'
                                            }
                                            ${isTop3 ? 'shadow-lg scale-[1.02]' : ''}
                                        `}
                                    >
                                        <div className="text-3xl font-black min-w-[3rem] text-center">
                                            {medal || `#${index + 1}`}
                                        </div>

                                        <div className="flex-1">
                                            <div className="text-xl font-bold text-gray-800">
                                                {entry.playerName}
                                                {isCurrentPlayer && (
                                                    <span className="ml-2 text-sm text-indigo-500 font-extrabold">
                                                        (You)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                                            {entry.score}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function PlayGame() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
                Loading...
            </div>
        }>
            <PlayGameContent />
        </Suspense>
    );
}
