'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinGame, onGameChange } from '@/lib/quizbattle';
import Button from '@/components/Button';

function JoinQuizContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameId = searchParams.get('gameId');

    const [nickname, setNickname] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [game, setGame] = useState<any>(null);

    useEffect(() => {
        if (!gameId) return;
        const unsubscribe = onGameChange(gameId, (gameData) => {
            setGame(gameData);
            if (gameData.status === 'playing' && hasJoined) {
                router.push(`/play/quizbattle/play/${gameId}`);
            }
        });
        return () => unsubscribe();
    }, [gameId, hasJoined]);

    const handleJoin = async () => {
        if (!nickname.trim() || !gameId) {
            alert('Please enter a nickname');
            return;
        }

        try {
            const userId = localStorage.getItem('userId') || `guest-${Date.now()}`;
            localStorage.setItem('userId', userId);
            localStorage.setItem('quizNickname', nickname);

            await joinGame(gameId, userId, nickname);
            setHasJoined(true);
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to join game');
        }
    };

    const playerCount = game?.players ? Object.keys(game.players).length : 0;

    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '500px', width: '100%' }}>
                {!hasJoined ? (
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '24px',
                        padding: '48px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                        textAlign: 'center',
                        border: '1px solid #e0e0e0'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#FEF2F2',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px',
                            margin: '0 auto 24px',
                            color: '#E44446'
                        }}>
                            🎮
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1d21', marginBottom: '12px' }}>
                            Join Quiz Battle
                        </h1>
                        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
                            Enter your nickname to join the game
                        </p>

                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            placeholder="Your Nickname"
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                fontSize: '18px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '12px',
                                outline: 'none',
                                marginBottom: '24px',
                                textAlign: 'center',
                                fontWeight: '600',
                                color: '#1a1d21',
                                backgroundColor: '#f9f9f9',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4A90E2'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            maxLength={20}
                            autoFocus
                        />

                        <button
                            onClick={handleJoin}
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                backgroundColor: '#4A90E2',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Join Game
                        </button>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '24px',
                        padding: '48px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                        textAlign: 'center',
                        border: '1px solid #e0e0e0'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#E8F5E9',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px',
                            margin: '0 auto 24px',
                            color: '#4CAF50'
                        }}>
                            ✓
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1d21', marginBottom: '8px' }}>
                            You're In!
                        </h1>
                        <p style={{ fontSize: '24px', color: '#4A90E2', fontWeight: 'bold', marginBottom: '32px' }}>
                            {nickname}
                        </p>

                        <div style={{ backgroundColor: '#f5f5f5', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
                            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
                                Waiting for host to start...
                            </div>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a1d21' }}>
                                {playerCount}
                            </div>
                            <div style={{ fontSize: '14px', color: '#888', fontWeight: '600' }}>
                                {playerCount === 1 ? 'PLAYER' : 'PLAYERS'} CONNECTED
                            </div>
                        </div>

                        {game?.players && Object.keys(game.players).length > 1 && (
                            <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                                    Other Players
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                    {Object.entries(game.players).filter(([uid]) => uid !== localStorage.getItem('userId')).slice(0, 8).map(([userId, player]: [string, any]) => (
                                        <div key={userId} style={{
                                            backgroundColor: '#f5f5f5',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            color: '#666',
                                            fontWeight: '500'
                                        }}>
                                            {player.nickname}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function JoinQuizPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Loading...
            </div>
        }>
            <JoinQuizContent />
        </Suspense>
    );
}
