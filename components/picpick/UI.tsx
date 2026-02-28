import React, { useEffect } from 'react';
import { Icons } from './Icons';

// Loading Spinner
export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <div className={`${sizeClasses[size]} border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin`}></div>
    );
};

// Toast Notification
export const Toast = ({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-indigo-500';
    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in`}>
            {message}
        </div>
    );
};

// Confetti Effect
export const Confetti = () => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
    const confetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {confetti.map(c => (
                <div
                    key={c.id}
                    className="confetti rounded-full"
                    style={{ left: `${c.left}%`, backgroundColor: c.color, animationDelay: `${c.delay}s` }}
                />
            ))}
        </div>
    );
};

// Winner Badge (Circular)
export const WinnerBadge = ({ photo, rank, size = 'lg' }: { photo: any; rank: number; size?: 'sm' | 'md' | 'lg' }) => {
    const badgeClass = rank === 1 ? 'badge-gold' : rank === 2 ? 'badge-silver' : 'badge-bronze';
    const sizeClasses = { sm: 'w-20 h-20', md: 'w-28 h-28', lg: 'w-36 h-36' };
    const rankLabels: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };
    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

    return (
        <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">{medals[rank]}</div>
            <div className={`${sizeClasses[size]} ${badgeClass} rounded-full p-1 ${rank === 1 ? 'float-animation' : ''}`} style={{
                background: rank === 1 ? 'linear-gradient(145deg, #ffd700 0%, #ffb300 50%, #ff8c00 100%)' :
                    rank === 2 ? 'linear-gradient(145deg, #e8e8e8 0%, #b8b8b8 50%, #888888 100%)' :
                        'linear-gradient(145deg, #cd7f32 0%, #b8733d 50%, #8b5a2b 100%)',
                boxShadow: rank === 1 ? '0 0 30px rgba(255, 215, 0, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.3)' :
                    rank === 2 ? '0 0 25px rgba(200, 200, 200, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.3)' :
                        '0 0 25px rgba(205, 127, 50, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.2)'
            }}>
                <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={photo.imageUrl} alt={`Rank ${rank}`} className="w-full h-full object-cover" />
                </div>
            </div>
            <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold`} style={{
                background: rank === 1 ? 'linear-gradient(145deg, #ffd700 0%, #ffb300 50%, #ff8c00 100%)' :
                    rank === 2 ? 'linear-gradient(145deg, #e8e8e8 0%, #b8b8b8 50%, #888888 100%)' :
                        'linear-gradient(145deg, #cd7f32 0%, #b8733d 50%, #8b5a2b 100%)',
                color: '#fff'
            }}>
                {rankLabels[rank]}
            </div>
            <div className="mt-1 text-white/80 text-sm font-mono">
                ❤️ {photo.votes} votes
            </div>
        </div>
    );
};
