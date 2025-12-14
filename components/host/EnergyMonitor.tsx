'use client';

import { useState, useEffect } from 'react';
import { onEnergyChange, StudentEnergy, launchPulseCheck, getActivePulseCheck, closePulseCheck, onPulseCheckChange, PulseCheck } from '@/lib/energy';
import Button from '@/components/Button';

interface EnergyMonitorProps {
    classId: string;
}

export default function EnergyMonitor({ classId }: EnergyMonitorProps) {
    const [energyData, setEnergyData] = useState<StudentEnergy[]>([]);
    const [activePulse, setActivePulse] = useState<PulseCheck | null>(null);
    const [showPulseResults, setShowPulseResults] = useState(false);

    useEffect(() => {
        const unsubEnergy = onEnergyChange(classId, setEnergyData);

        // Check for existing pulse
        getActivePulseCheck(classId).then(pulse => {
            if (pulse) {
                setActivePulse(pulse);
                setShowPulseResults(true);
            }
        });

        return () => unsubEnergy();
    }, [classId]);

    useEffect(() => {
        if (activePulse) {
            const unsubPulse = onPulseCheckChange(classId, activePulse.id, (pulse) => {
                setActivePulse(pulse);
            });
            return () => unsubPulse();
        }
    }, [classId, activePulse?.id]);

    const average = energyData.length > 0
        ? Math.round(energyData.reduce((sum, s) => sum + s.level, 0) / energyData.length)
        : 100;

    const lowEnergyCount = energyData.filter(s => s.level <= 50).length;

    const getEnergyColor = (avg: number) => {
        if (avg >= 75) return { bg: 'bg-green-500', text: 'text-green-400', emoji: '🟢' };
        if (avg >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-400', emoji: '🟡' };
        return { bg: 'bg-red-500', text: 'text-red-400', emoji: '🔴' };
    };

    const color = getEnergyColor(average);

    const handleLaunchPulse = async () => {
        const sessionId = await launchPulseCheck(classId);
        const pulse = await getActivePulseCheck(classId);
        setActivePulse(pulse);
        setShowPulseResults(true);
    };

    const handleClosePulse = async () => {
        if (activePulse) {
            await closePulseCheck(classId, activePulse.id);
            setActivePulse(null);
            setShowPulseResults(false);
        }
    };

    const pulseResults = activePulse ? {
        energized: activePulse.responses.filter(r => r.feeling === 'energized').length,
        good: activePulse.responses.filter(r => r.feeling === 'good').length,
        ok: activePulse.responses.filter(r => r.feeling === 'ok').length,
        tired: activePulse.responses.filter(r => r.feeling === 'tired').length,
        needBreak: activePulse.responses.filter(r => r.feeling === 'needBreak').length,
        total: activePulse.responses.length
    } : null;

    return (
        <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>⚡</span> Class Energy
                </h2>
                {!activePulse && (
                    <Button variant="primary" size="sm" onClick={handleLaunchPulse}>
                        📊 Pulse Check
                    </Button>
                )}
            </div>

            {/* Current Energy Level */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm font-bold uppercase">Average Energy</span>
                    <span className="text-2xl">{color.emoji}</span>
                </div>
                <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full ${color.bg} transition-all duration-500`}
                        style={{ width: `${average}%` }}
                    />
                </div>
                <div className={`text-4xl font-black ${color.text}`}>{average}%</div>
            </div>

            {/* Alert if low energy */}
            {average < 60 && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="text-red-400 font-bold mb-1 flex items-center gap-2">
                        <span>⚠️</span> Low Class Energy
                    </div>
                    <div className="text-sm text-gray-300">
                        {lowEnergyCount} student{lowEnergyCount !== 1 ? 's' : ''} need a break
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-white">{energyData.length}</div>
                    <div className="text-xs text-gray-400 uppercase">Students</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                        {energyData.filter(s => s.level >= 75).length}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">High</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{lowEnergyCount}</div>
                    <div className="text-xs text-gray-400 uppercase">Low</div>
                </div>
            </div>

            {/* Pulse Check Results */}
            {showPulseResults && activePulse && pulseResults && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Pulse Check Results</h3>
                        <Button variant="secondary" size="sm" onClick={handleClosePulse}>
                            Close
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                            <span className="text-white">😃 Energized</span>
                            <span className="font-bold text-green-400">{pulseResults.energized}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                            <span className="text-white">😊 Good</span>
                            <span className="font-bold text-green-400">{pulseResults.good}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                            <span className="text-white">😐 OK</span>
                            <span className="font-bold text-yellow-400">{pulseResults.ok}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                            <span className="text-white">😴 Tired</span>
                            <span className="font-bold text-orange-400">{pulseResults.tired}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                            <span className="text-white">🥱 Need Break</span>
                            <span className="font-bold text-red-400">{pulseResults.needBreak}</span>
                        </div>
                        <div className="mt-3 text-center text-gray-400 text-sm">
                            {pulseResults.total} response{pulseResults.total !== 1 ? 's' : ''} received
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
