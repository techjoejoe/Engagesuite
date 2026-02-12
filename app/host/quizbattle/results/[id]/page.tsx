'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getGame, getLeaderboard } from '@/lib/quizbattle';
import Button from '@/components/Button';
import HamburgerMenu from '@/components/HamburgerMenu';

export default function QuizResultsPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [game, setGame] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        const init = async () => {
            const gameData = await getGame(id);
            if (!gameData) return;
            setGame(gameData);
            const sorted = getLeaderboard(gameData.players);
            setLeaderboard(sorted);
        };
        init();
    }, [id]);

    if (!game) return (
        <div className="min-h-screen bg-transparent flex items-center justify-center text-white/70 dark:text-gray-400">
            Loading...
        </div>
    );

    return (
        <main className="min-h-screen bg-transparent font-sans flex flex-col p-6 transition-colors duration-300">
            <HamburgerMenu currentPage="QuizBattle" />

            <div className="max-w-[1000px] mx-auto w-full flex flex-col items-center">

                {/* Title */}
                <h1 className="text-5xl font-bold text-white dark:text-white mb-12 text-center">
                    Final Results
                </h1>

                {/* Podium (Top 3) */}
                {leaderboard.length >= 3 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '24px', marginBottom: '60px', width: '100%' }}>

                        {/* 2nd Place */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: '#E0E0E0',
                                color: '#757575',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                marginBottom: '16px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {leaderboard[1].player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px 16px 0 0',
                                width: '100%',
                                height: '140px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderTop: '6px solid #BDBDBD',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#BDBDBD' }}>2nd</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1d21', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {leaderboard[1].player.nickname}
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                                    {leaderboard[1].player.score}
                                </div>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px', zIndex: 10 }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>👑</div>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '40px',
                                fontWeight: 'bold',
                                marginBottom: '16px',
                                boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)'
                            }}>
                                {leaderboard[0].player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px 16px 0 0',
                                width: '100%',
                                height: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderTop: '6px solid #FFD700',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                            }}>
                                <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#FFD700' }}>1st</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1d21', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {leaderboard[0].player.nickname}
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                                    {leaderboard[0].player.score}
                                </div>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: '#FFCCBC',
                                color: '#D84315',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                marginBottom: '16px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {leaderboard[2].player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px 16px 0 0',
                                width: '100%',
                                height: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderTop: '6px solid #FF7043',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF7043' }}>3rd</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1d21', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {leaderboard[2].player.nickname}
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                                    {leaderboard[2].player.score}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Leaderboard */}
                <div style={{ width: '100%', maxWidth: '800px', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1d21', marginBottom: '20px' }}>Full Leaderboard</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {leaderboard.map(({ userId, player }, index) => (
                            <div
                                key={userId}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '20px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: index < 3 ? '1px solid #e0e0e0' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{
                                        width: '32px',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: index < 3 ? '#1a1d21' : '#666',
                                        textAlign: 'center'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f0f0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        color: '#666'
                                    }}>
                                        {player.nickname.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1d21' }}>
                                        {player.nickname}
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                                    {player.score} pts
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                    <button
                        onClick={() => router.push(`/host/quizbattle?classId=${game.classId}`)}
                        style={{
                            padding: '16px 32px',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            color: '#666',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9f9f9'; e.currentTarget.style.borderColor = '#ccc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                    >
                        Back to My Games
                    </button>
                    <button
                        onClick={() => router.push(`/host/quizbattle/lobby/${game.quizId}?classId=${game.classId}`)}
                        style={{
                            padding: '16px 32px',
                            borderRadius: '12px',
                            backgroundColor: '#4CAF50',
                            border: 'none',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </main>
    );
}
