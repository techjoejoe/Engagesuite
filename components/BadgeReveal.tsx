'use client';

import { useEffect, useState } from 'react';
import Confetti from '@/components/Confetti';
import { Badge } from '@/lib/badges';

interface BadgeRevealProps {
    badge: Badge;
    onClose: () => void;
}

export default function BadgeReveal({ badge, onClose }: BadgeRevealProps) {
    const [scale, setScale] = useState('scale-0');
    const [audio] = useState(new Audio('/sounds/badge-unlock.mp3')); // We'll need to handle the sound file

    useEffect(() => {
        // Play sound
        // Note: Audio autoplay policies might block this without prior interaction, 
        // but since the user is in the dash interacting, it usually works.
        const playSound = async () => {
            try {
                // Determine a sound to play. 
                // Since we might not have a dedicated file yet, we can try a generic success sound from a public URL or existing asset
                // For now, let's assume we might add a sound later or use a placeholder
                // audio.play().catch(e => console.log('Audio play failed', e));

                // Using a simple beep/success logic or no sound for v1 if file missing
            } catch (e) {
                console.error(e);
            }
        }

        playSound();

        // Animation in
        setTimeout(() => setScale('scale-100'), 100);

        // Auto close after 8 seconds if not clicked?
        const timer = setTimeout(onClose, 8000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />

            <Confetti />

            <div className={`relative flex flex-col items-center max-w-sm w-full transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${scale}`}>

                {/* Glowing Background Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/30 rounded-full blur-[60px] animate-pulse" />

                {/* Badge Image with 3D Float Animation */}
                <div className="relative w-48 h-48 mb-8 animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Text Content */}
                <div className="text-center relative z-10 animate-slide-up bg-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-lg">
                    <div className="uppercase tracking-widest text-yellow-500 font-black text-sm mb-2 drop-shadow-sm">
                        Badge Unlocked!
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md">
                        {badge.name}
                    </h2>
                    <p className="text-gray-200 text-sm font-medium leading-relaxed">
                        {badge.description}
                    </p>

                    <button
                        onClick={onClose}
                        className="mt-6 px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-full shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        Awesome!
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                }
            `}</style>
        </div>
    );
}
