'use client';

import React from 'react';
import { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    currentPlayerId?: string;
}

export default function Leaderboard({ entries, currentPlayerId }: LeaderboardProps) {
    if (entries.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                No players yet
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-center mb-8 text-3xl font-bold text-gray-800">
                🏆 Leaderboard
            </h2>

            <div className="flex flex-col gap-4">
                {entries.map((entry, index) => {
                    const isCurrentPlayer = entry.playerId === currentPlayerId;
                    const isTop3 = index < 3;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                    return (
                        <div
                            key={entry.playerId}
                            className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 ${isCurrentPlayer
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md'
                                    : 'bg-white/80 backdrop-blur-md border-gray-200 shadow-sm'
                                } ${isTop3 ? 'scale-[1.02] shadow-lg' : 'scale-100'}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={`text-2xl font-bold min-w-[3rem] text-center ${isTop3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                                {medal || `#${entry.rank}`}
                            </div>

                            <div className="flex-1">
                                <div className="text-lg font-bold text-gray-900 mb-1">
                                    {entry.playerName}
                                    {isCurrentPlayer && (
                                        <span className="ml-2 text-sm text-indigo-600 font-medium">
                                            (You)
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {entry.correctAnswers} correct
                                </div>
                            </div>

                            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 min-w-[5rem] text-right">
                                {entry.score}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
