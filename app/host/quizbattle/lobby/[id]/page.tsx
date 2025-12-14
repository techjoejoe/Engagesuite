'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getGame, getQuiz, onGameChange, startGame, createGame } from '@/lib/quizbattle';
import HamburgerMenu from '@/components/HamburgerMenu';
import { updateClassActivity } from '@/lib/classes';

export default function QuizLobbyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const classIdParam = searchParams.get('classId');

    const [game, setGame] = useState<any>(null);
    const [quiz, setQuiz] = useState<any>(null);
    const [gameId, setGameId] = useState('');

    useEffect(() => {
        const init = async () => {
            const quizData = await getQuiz(id);
            if (!quizData) {
                alert('Quiz not found');
                router.back();
                return;
            }
            setQuiz(quizData);

            const targetClassId = classIdParam || quizData.classId;

            const userId = localStorage.getItem('userId') || 'guest';
            const gId = await createGame(id, targetClassId, userId);
            setGameId(gId);

            // Sync class activity
            if (targetClassId) {
                updateClassActivity(targetClassId, { type: 'quizbattle', id: gId });
            }
        };
        init();
    }, [id, classIdParam]);

    useEffect(() => {
        if (!gameId) return;
        const unsubscribe = onGameChange(gameId, (gameData) => {
            setGame(gameData);
        });
        return () => unsubscribe();
    }, [gameId]);

    const handleStartGame = async () => {
        if (!gameId) return;
        await startGame(gameId);
        router.push(`/host/quizbattle/play/${gameId}`);
    };

    const handleExit = () => {
        if (confirm('Are you sure you want to exit the lobby? The game will be cancelled.')) {
            const targetClassId = classIdParam || quiz?.classId;
            if (targetClassId) updateClassActivity(targetClassId, { type: 'none' });
            router.push(`/host/quizbattle?classId=${targetClassId || 'default'}`);
        }
    };

    const playerCount = game?.players ? Object.keys(game.players).length : 0;
    const totalPoints = (quiz?.questions?.length || 0) * (quiz?.settings?.pointsPerQuestion || 1000);

    return (
        <main className="min-h-screen bg-[#0a0a0f] text-white font-sans relative overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-[#0a0a0f] to-purple-950/40"></div>
                <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col container mx-auto px-4 py-6">
                <HamburgerMenu currentPage="QuizBattle" />

                {/* Header */}
                <div className="text-center mt-8 mb-12">
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4 drop-shadow-lg">
                        {quiz?.title || 'Quiz Battle'}
                    </h1>
                    <p className="text-xl text-indigo-200/60 max-w-2xl mx-auto font-medium">
                        {quiz?.description || 'Get ready to play!'}
                    </p>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center gap-16">

                    {/* Player Count Circle */}
                    <div className="relative group cursor-default">
                        <div className="absolute -inset-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
                        <div className="relative w-72 h-72 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-full flex flex-col items-center justify-center shadow-2xl ring-1 ring-white/5">
                            <div className="text-9xl font-black text-white mb-2 tracking-tighter">
                                {playerCount}
                            </div>
                            <div className="text-lg font-bold text-indigo-400 uppercase tracking-[0.3em]">
                                Players
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        <StatCard
                            label="Questions"
                            value={quiz?.questions?.length || 0}
                            icon="❓"
                            color="text-blue-400"
                        />
                        <StatCard
                            label="Time per Q"
                            value={`${quiz?.settings?.timePerQuestion || 20}s`}
                            icon="⏱️"
                            color="text-purple-400"
                        />
                        <StatCard
                            label="Total Points"
                            value={totalPoints}
                            icon="🏆"
                            color="text-yellow-400"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="py-12 flex flex-col items-center gap-6">
                    <button
                        onClick={handleStartGame}
                        disabled={playerCount === 0}
                        className={`
                            group relative px-16 py-6 rounded-full text-2xl font-black tracking-wide shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95
                            ${playerCount > 0
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/40'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}
                        `}
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            START GAME
                            {playerCount > 0 && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                        </span>
                    </button>

                    <button
                        onClick={handleExit}
                        className="text-red-400/80 font-semibold hover:text-red-400 transition-colors text-sm uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                    >
                        Cancel Game
                    </button>
                </div>
            </div>
        </main>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <div className={`text-4xl font-black mb-2 ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">{label}</div>
        </div>
    )
}
