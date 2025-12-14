'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getGame, getLeaderboard } from '@/lib/quizbattle';
import Button from '@/components/Button';

export default function StudentQuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
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
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Loading...
        </div>
    );

    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ maxWidth: '800px', width: '100%' }}>
                {/* Title */}
                <h1 style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#1a1d21',
                    marginBottom: '40px',
                    textAlign: 'center'
                }}>
                    Final Results
                </h1>

                {/* Podium (Top 3) */}
                {leaderboard.length >= 3 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>

                        {/* 2nd Place */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: '#E0E0E0',
                                color: '#757575',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                marginBottom: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {leaderboard[1].player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px 16px 0 0',
                                width: '100%',
                                height: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderTop: '4px solid #BDBDBD',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#BDBDBD' }}>2nd</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d21', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {leaderboard[1].player.nickname}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                                    {leaderboard[1].player.score}
                                </div>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px', zIndex: 10 }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                marginBottom: '12px',
                                boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)'
                            }}>
                                {leaderboard[0].player.nickname.charAt(0).toUpperCase()}
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
                                borderTop: '4px solid #FFD700',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                            }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFD700' }}>1st</div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1d21', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {leaderboard[0].player.nickname}
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                                    {leaderboard[0].player.score}
                                </div>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: '#FFCCBC',
                                color: '#D84315',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                marginBottom: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {leaderboard[2].player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px 16px 0 0',
                                width: '100%',
                                height: '80px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderTop: '4px solid #FF7043',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF7043' }}>3rd</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1d21', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {leaderboard[2].player.nickname}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#666', marginTop: '4px' }}>
                                    {leaderboard[2].player.score}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Leaderboard */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1d21', marginBottom: '16px' }}>Full Leaderboard</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {leaderboard.map(({ userId, player }, index) => (
                            <div
                                key={userId}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: index < 3 ? '1px solid #e0e0e0' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: index < 3 ? '#1a1d21' : '#666',
                                        textAlign: 'center'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f0f0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        color: '#666',
                                        fontSize: '14px'
                                    }}>
                                        {player.nickname.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1d21' }}>
                                        {player.nickname}
                                    </div>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CAF50' }}>
                                    {player.score} pts
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <div>
                    <button
                        onClick={() => router.push('/')}
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
                        Back to Home
                    </button>
                </div>
            </div>
        </main>
    );
}
