'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOutUser } from '@/lib/auth';
import { onEnergyChange, StudentEnergy, launchPulseCheck, getActivePulseCheck, closePulseCheck, onPulseCheckChange, PulseCheck } from '@/lib/energy';
import { onUnansweredCountChange } from '@/lib/parkinglot';

interface HostMenuProps {
    currentPage?: string;
    classId?: string;
    className?: string;
}

export default function HostMenu({ currentPage = '', classId, className = '' }: HostMenuProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [unansweredCount, setUnansweredCount] = useState(0);
    const [energyData, setEnergyData] = useState<StudentEnergy[]>([]);
    const [showEnergyDetail, setShowEnergyDetail] = useState(false);
    const [activePulse, setActivePulse] = useState<PulseCheck | null>(null);

    React.useEffect(() => {
        if (!classId) return;
        const unsubscribe = onUnansweredCountChange(classId, (count) => {
            setUnansweredCount(count);
        });
        return () => unsubscribe();
    }, [classId]);

    React.useEffect(() => {
        if (!classId) return;
        const unsubEnergy = onEnergyChange(classId, setEnergyData);

        getActivePulseCheck(classId).then(pulse => {
            if (pulse) setActivePulse(pulse);
        });

        return () => unsubEnergy();
    }, [classId]);

    React.useEffect(() => {
        if (activePulse && classId) {
            const unsubPulse = onPulseCheckChange(classId, activePulse.id, setActivePulse);
            return () => unsubPulse();
        }
    }, [classId, activePulse?.id]);

    const handleSignOut = async () => {
        await signOutUser();
        router.push('/');
    };

    const average = energyData.length > 0
        ? Math.round(energyData.reduce((sum, s) => sum + s.level, 0) / energyData.length)
        : 100;

    const getEnergyColor = (avg: number) => {
        if (avg >= 75) return { bg: 'bg-green-500', text: 'text-green-400', emoji: '🟢', glow: 'shadow-green-500/50' };
        if (avg >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-400', emoji: '🟡', glow: 'shadow-yellow-500/50' };
        return { bg: 'bg-red-500', text: 'text-red-400', emoji: '🔴', glow: 'shadow-red-500/50' };
    };

    const color = getEnergyColor(average);
    const lowEnergyCount = energyData.filter(s => s.level <= 50).length;

    const handleLaunchPulse = async () => {
        if (!classId) return;
        await launchPulseCheck(classId);
        const pulse = await getActivePulseCheck(classId);
        setActivePulse(pulse);
    };

    const handleClosePulse = async () => {
        if (activePulse && classId) {
            await closePulseCheck(classId, activePulse.id);
            setActivePulse(null);
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
        <>
            {/* Energy Monitor Widget - Bottom Right */}
            {classId && (
                <button
                    onClick={() => setShowEnergyDetail(!showEnergyDetail)}
                    className={`fixed bottom-6 right-6 glass-card rounded-2xl p-4 z-[1999] hover:scale-105 transition-all duration-300 ${color.glow} shadow-xl min-w-[120px]`}
                    title="Class Energy"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{color.emoji}</span>
                        <div className="text-left">
                            <div className={`text-2xl font-black ${color.text}`}>{average}%</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Energy</div>
                        </div>
                    </div>
                    {lowEnergyCount > 0 && (
                        <div className="mt-2 text-xs text-red-400 font-bold animate-pulse">
                            {lowEnergyCount} need break
                        </div>
                    )}
                </button>
            )}

            {/* Energy Detail Modal */}
            {showEnergyDetail && classId && (
                <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowEnergyDetail(false)}
                    />
                    <div className="relative glass-card p-8 w-full max-w-lg animate-fade-in max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span>⚡</span> Class Energy Monitor
                            </h2>
                            <button
                                onClick={() => setShowEnergyDetail(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
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
                        <div className="grid grid-cols-3 gap-3 mb-6">
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

                        {/* Pulse Check Button */}
                        {!activePulse && (
                            <button
                                onClick={handleLaunchPulse}
                                className="w-full p-4 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all mb-4"
                            >
                                📊 Launch Pulse Check
                            </button>
                        )}

                        {/* Pulse Check Results */}
                        {activePulse && pulseResults && (
                            <div className="pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white">Pulse Check Active</h3>
                                    <button
                                        onClick={handleClosePulse}
                                        className="text-sm px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                                    >
                                        Close
                                    </button>
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
                                        {pulseResults.total} response{pulseResults.total !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hamburger Button - Right Side */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-4 right-4 w-12 h-12 bg-white dark:bg-slate-800 shadow-xl border-2 border-indigo-500 rounded-full flex flex-col items-center justify-center gap-1 z-[2000] hover:scale-110 transition-all duration-300 focus:outline-none ${className}`}
                aria-label="Menu"
            >
                {unansweredCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce shadow-sm border border-white dark:border-slate-800">
                        {unansweredCount}
                    </div>
                )}
                <div className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <div className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
                <div className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] animate-fade-in"
                />
            )}

            {/* Slide-out Menu - Right Side */}
            <div
                className={`fixed top-0 right-0 w-80 h-full bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[2000] transition-transform duration-300 ease-in-out overflow-y-auto border-l border-white/10 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-white">
                            Host Menu
                        </h2>
                    </div>
                    <p className="text-sm text-gray-400">
                        Quick navigation and tools
                    </p>
                </div>

                {/* Navigation */}
                <div className="p-6 space-y-2">
                    {/* Dashboard Section */}
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Dashboard
                        </h3>
                        <Link
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${currentPage === 'Dashboard'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">🏠</span>
                            <span className="font-medium">All Classes</span>
                        </Link>
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${currentPage === 'Profile'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">👤</span>
                            <span className="font-medium">My Profile</span>
                        </Link>
                        <Link
                            href="/admin/analytics"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${currentPage === 'Analytics'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">📈</span>
                            <span className="font-medium">Analytics</span>
                        </Link>
                        <Link
                            href="/host/badges"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${currentPage === 'badges'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">🛡️</span>
                            <span className="font-medium">Badge Library</span>
                        </Link>
                        <Link
                            href="/host/design"
                            onClick={() => setIsOpen(false)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${currentPage === 'design'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">🎨</span>
                            <span className="font-medium">Designer Studio</span>
                        </Link>
                    </div>

                    {/* Current Class Section */}
                    {classId && (
                        <div className="mb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Current Class
                            </h3>
                            <Link
                                href={`/dashboard/class?id=${classId}`}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">📚</span>
                                <span className="font-medium">Class Tools</span>
                            </Link>
                            <Link
                                href={`/host/parkinglot/${classId}`}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all relative"
                            >
                                <span className="text-xl">🚙</span>
                                <span className="font-medium">Parking Lot</span>
                                {unansweredCount > 0 && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                        {unansweredCount} New
                                    </span>
                                )}
                            </Link>
                            <Link
                                href={`/dashboard/class/students?id=${classId}`}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">👥</span>
                                <span className="font-medium">Manage Students</span>
                            </Link>
                            <Link
                                href={`/host/class/${classId}/projector`}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">📽️</span>
                                <span className="font-medium">Projector View</span>
                            </Link>
                        </div>
                    )}

                    {/* Quick Launch Tools */}
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Quick Launch
                        </h3>
                        <div className="space-y-1">
                            <Link
                                href={classId ? `/host/quizbattle?classId=${classId}` : '/host/quizbattle'}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">⚡</span>
                                <span className="font-medium">QuizBattle</span>
                            </Link>
                            <Link
                                href={classId ? `/host/picpick/launch?classId=${classId}` : '/picpick/admin'}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">📸</span>
                                <span className="font-medium">PicPick</span>
                            </Link>
                            <Link
                                href={classId ? `/host/randomizer?classId=${classId}` : '/host/randomizer'}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">🎡</span>
                                <span className="font-medium">Randomizer</span>
                            </Link>
                            <Link
                                href={classId ? `/host/tickr/launch?classId=${classId}` : '/host/tickr/launch'}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">⏱️</span>
                                <span className="font-medium">Tickr</span>
                            </Link>
                            <Link
                                href={classId ? `/host/wordstorm/launch?classId=${classId}` : '/host/wordstorm/launch'}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">☁️</span>
                                <span className="font-medium">WordStorm</span>
                            </Link>
                            <Link
                                href={classId ? `/host/poll/create?classId=${classId}` : '/host/poll/create'}
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            >
                                <span className="text-xl">📊</span>
                                <span className="font-medium">LiveVote</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 mt-auto bg-white/5">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all border border-red-500/20"
                    >
                        <span className="text-xl">🚪</span>
                        <span>Sign Out</span>
                    </button>
                    <div className="mt-4 text-center text-xs text-gray-500">
                        Quiz Battle v2.0
                    </div>
                </div>
            </div>
        </>
    );
}
