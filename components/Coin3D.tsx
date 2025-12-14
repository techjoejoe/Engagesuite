import React from 'react';

interface Coin3DProps {
    result: 'Heads' | 'Tails';
    flipping: boolean;
    size?: number;
}

export default function Coin3D({ result, flipping, size = 200 }: Coin3DProps) {
    return (
        <div
            className="scene inline-block"
            style={{
                width: size,
                height: size,
                perspective: size * 5
            }}
        >
            <div
                className={`coin relative w-full h-full transition-transform duration-[1500ms] ease-out`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipping
                        ? `rotateY(${720 * 5}deg)` // Spin on Y axis
                        : `rotateY(${result === 'Heads' ? 0 : 180}deg)`,
                }}
            >
                {/* Heads Face */}
                <div
                    className="absolute w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-8 border-yellow-600 flex items-center justify-center backface-hidden shadow-2xl"
                    style={{
                        backfaceVisibility: 'hidden',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <div className="text-center transform translate-z-1">
                        <div className="text-6xl mb-2 drop-shadow-md">👑</div>
                        <div className="text-2xl font-black text-yellow-800 uppercase tracking-widest drop-shadow-sm">Heads</div>
                    </div>
                </div>

                {/* Tails Face */}
                <div
                    className="absolute w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border-8 border-gray-500 flex items-center justify-center backface-hidden shadow-2xl"
                    style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <div className="text-center transform translate-z-1">
                        <div className="text-6xl mb-2 drop-shadow-md">🦅</div>
                        <div className="text-2xl font-black text-gray-700 uppercase tracking-widest drop-shadow-sm">Tails</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
