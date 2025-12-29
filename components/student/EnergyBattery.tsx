'use client';

import { useState, useEffect } from 'react';
import { setStudentEnergy, onStudentEnergyChange, EnergyLevel } from '@/lib/energy';

interface EnergyBatteryProps {
    classId: string;
    userId: string;
    displayName: string;
}

export default function EnergyBattery({ classId, userId, displayName }: EnergyBatteryProps) {
    const [level, setLevel] = useState<EnergyLevel>(100);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onStudentEnergyChange(classId, userId, (energy) => {
            if (energy) {
                setLevel(energy.level);
            }
        });
        return () => unsubscribe();
    }, [classId, userId]);

    const handleSetEnergy = async (newLevel: EnergyLevel) => {
        setLevel(newLevel);
        await setStudentEnergy(classId, userId, displayName, newLevel);
        setIsOpen(false);
    };

    const getBatteryIcon = () => {
        if (level === 100) return '🔋';
        if (level >= 75) return '🔋';
        if (level >= 50) return '⚡';
        if (level >= 25) return '🪫';
        return '🪫';
    };

    const getBatteryColor = () => {
        if (level >= 75) return 'from-green-500 to-green-600';
        if (level >= 50) return 'from-yellow-500 to-yellow-600';
        if (level >= 25) return 'from-orange-500 to-orange-600';
        return 'from-red-500 to-red-600';
    };

    return (
        <>
            {/* Battery Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-10 left-6 z-[60] w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-2xl transition-all hover:scale-110 border-2 border-white/20"
                title="Energy Level"
            >
                {getBatteryIcon()}
            </button>

            {/* Energy Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative glass-card p-8 w-full max-w-md animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span>{getBatteryIcon()}</span> Energy Level
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-gray-300 mb-6 text-sm">
                            Let your instructor know how you're feeling. Your feedback helps them adjust the pace.
                        </p>

                        {/* Current Level Display */}
                        <div className="mb-8 text-center">
                            <div className="text-6xl mb-3">{getBatteryIcon()}</div>
                            <div className={`text-3xl font-black bg-gradient-to-r ${getBatteryColor()} bg-clip-text text-transparent`}>
                                {level}%
                            </div>
                        </div>

                        {/* Level Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => handleSetEnergy(100)}
                                className={`w-full p-4 rounded-xl font-bold transition-all ${level === 100
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white scale-105 shadow-lg'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                <span className="text-2xl mr-2">😃</span> Energized (100%)
                            </button>
                            <button
                                onClick={() => handleSetEnergy(75)}
                                className={`w-full p-4 rounded-xl font-bold transition-all ${level === 75
                                    ? 'bg-gradient-to-r from-green-400 to-green-500 text-white scale-105 shadow-lg'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                <span className="text-2xl mr-2">😊</span> Good (75%)
                            </button>
                            <button
                                onClick={() => handleSetEnergy(50)}
                                className={`w-full p-4 rounded-xl font-bold transition-all ${level === 50
                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white scale-105 shadow-lg'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                <span className="text-2xl mr-2">😐</span> OK (50%)
                            </button>
                            <button
                                onClick={() => handleSetEnergy(25)}
                                className={`w-full p-4 rounded-xl font-bold transition-all ${level === 25
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white scale-105 shadow-lg'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                <span className="text-2xl mr-2">😴</span> Tired (25%)
                            </button>
                            <button
                                onClick={() => handleSetEnergy(0)}
                                className={`w-full p-4 rounded-xl font-bold transition-all ${level === 0
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white scale-105 shadow-lg'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                <span className="text-2xl mr-2">🥱</span> Need Break (0%)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
