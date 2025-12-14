'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';
import QRCode from '@/components/QRCode';
import Leaderboard from '@/components/Leaderboard';
import { subscribeToGame, startGame, nextQuestion, getLeaderboard } from '@/lib/game';
import { onAuthStateChange } from '@/lib/auth';
import { GameState, Player, LeaderboardEntry } from '@/types';

function HostControlPanelContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const roomCode = searchParams.get('room');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const joinUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/join`
        : '';

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (!user) {
                router.push('/login');
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!roomCode) return;

        const unsubscribe = subscribeToGame(roomCode, (state) => {
            setGameState(state);
        });

        return () => unsubscribe();
    }, [roomCode]);

    useEffect(() => {
        if (gameState && roomCode) {
            getLeaderboard(roomCode).then(setLeaderboard);
        }
    }, [gameState, roomCode]);

    const handleStart = async () => {
        if (roomCode) {
            await startGame(roomCode);
        }
    };

    const handleNext = async () => {
        if (gameState && roomCode) {
            setShowLeaderboard(true);
            setTimeout(async () => {
                await nextQuestion(roomCode, gameState.currentQuestionIndex);
                setShowLeaderboard(false);
            }, 5000);
        }
    };

    if (checkingAuth) {
        return (
            <div className="full-height flex-center" style={{
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            }}>
                <div className="animate-pulse">Checking authentication...</div>
            </div>
        );
    }

    if (!roomCode) {
        return (
            <div className="full-height flex-center" style={{
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            }}>
                <div className="card">
                    <h2>Error</h2>
                    <p>No room code provided.</p>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="full-height flex-center" style={{
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            }}>
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    const players = Object.values(gameState.players || {});
    const currentQuestion = gameState.currentQuestionIndex >= 0
        ? gameState.questions[gameState.currentQuestionIndex]
        : null;

    return (
        <main className="full-height" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                {/* Header */}
                <div className="flex-between mb-4">
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {gameState.settings?.title || 'Trivia Game'}
                        </h1>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Host Control Panel • Room: {roomCode}
                        </div>
                    </div>
                    <Button variant="glass" onClick={() => router.push('/')}>
                        Exit
                    </Button>
                </div>

                {/* Lobby / Waiting for players */}
                {gameState.status === 'lobby' && (
                    <div className="animate-fade-in">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '2rem',
                            marginBottom: '2rem',
                        }}>
                            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                <h3 className="mb-3">Room Code</h3>
                                <div style={{
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.2em',
                                    background: 'var(--gradient-primary)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    marginBottom: '1rem',
                                }}>
                                    {roomCode}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Share this code with players
                                </p>
                            </div>

                            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                <h3 className="mb-3">Scan to Join</h3>
                                <QRCode value={joinUrl} size={150} />
                            </div>
                        </div>

                        <div className="card mb-3">
                            <h3 className="mb-3">Players ({players.length})</h3>
                            {players.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    Waiting for players to join...
                                </p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '1rem',
                                }}>
                                    {players.map((player) => (
                                        <div
                                            key={player.id}
                                            className="animate-fade-in"
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                            }}
                                        >
                                            <div style={{ fontWeight: '600' }}>{player.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                Joined {new Date(player.joinedAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            variant="success"
                            size="lg"
                            className="full-width"
                            onClick={handleStart}
                            disabled={players.length === 0}
                        >
                            Start Game
                        </Button>
                    </div>
                )}

                {/* Active Game */}
                {gameState.status === 'active' && currentQuestion && !showLeaderboard && (
                    <div className="animate-fade-in">
                        <div className="card mb-4">
                            <div className="flex-between mb-3">
                                <h3>Question {gameState.currentQuestionIndex + 1} of {gameState.questions.length}</h3>
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--gradient-primary)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                }}>
                                    {currentQuestion.points} pts
                                </div>
                            </div>

                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                marginBottom: '1.5rem',
                            }}>
                                {currentQuestion.question}
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2rem',
                            }}>
                                {currentQuestion.options.map((option, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '1rem',
                                            background: index === currentQuestion.correctAnswer
                                                ? 'rgba(16, 185, 129, 0.2)'
                                                : 'var(--bg-secondary)',
                                            border: `2px solid ${index === currentQuestion.correctAnswer ? '#10b981' : 'var(--border-color)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {index === currentQuestion.correctAnswer && '✓ '}
                                        {option}
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem',
                            }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    Answers Received
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {players.filter(p => p.currentAnswer !== null).length} / {players.length}
                                </div>
                            </div>

                            <Button variant="primary" size="lg" className="full-width" onClick={handleNext}>
                                {gameState.currentQuestionIndex === gameState.questions.length - 1
                                    ? 'Show Final Results'
                                    : 'Next Question'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Show Leaderboard Between Questions */}
                {(showLeaderboard || gameState.status === 'finished') && (
                    <div className="animate-fade-in">
                        <div className="card" style={{ padding: '2rem' }}>
                            {gameState.status === 'finished' && (
                                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.5rem' }}>
                                    🎉 Game Finished!
                                </h2>
                            )}
                            <Leaderboard entries={leaderboard} />

                            {gameState.status === 'finished' && (
                                <div style={{ marginTop: '2rem' }}>
                                    <Button variant="primary" className="full-width" onClick={() => router.push('/')}>
                                        Create New Game
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function HostControlPanel() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HostControlPanelContent />
        </Suspense>
    );
}
