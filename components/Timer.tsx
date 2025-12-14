'use client';

import React, { useEffect, useState } from 'react';

interface TimerProps {
    duration: number; // seconds
    onComplete?: () => void;
    maxPoints: number;
    onTimeUpdate?: (elapsed: number, currentPoints: number) => void;
}

export default function Timer({ duration, onComplete, maxPoints, onTimeUpdate }: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [currentPoints, setCurrentPoints] = useState(maxPoints);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = Math.max(0, prev - 0.1);
                const elapsed = duration - newTime;

                // Calculate decreasing points (100% to 50% over time)
                const timeRatio = Math.max(0, newTime / duration);
                const minPointsRatio = 0.5;
                const pointsMultiplier = minPointsRatio + (timeRatio * (1 - minPointsRatio));
                const points = Math.round(maxPoints * pointsMultiplier);
                setCurrentPoints(points);

                onTimeUpdate?.(elapsed, points);

                if (newTime <= 0) {
                    onComplete?.();
                }

                return newTime;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [timeLeft, duration, maxPoints, onComplete, onTimeUpdate]);

    const percentage = (timeLeft / duration) * 100;
    const isLow = percentage < 20;
    const isMedium = percentage < 50 && percentage >= 20;

    return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: isLow ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981',
                    textShadow: '0 0 20px currentColor',
                }}>
                    {Math.ceil(timeLeft)}s
                </div>
                <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>
                    {currentPoints} pts
                </div>
            </div>

            <div style={{
                width: '100%',
                height: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: isLow
                        ? 'linear-gradient(90deg, #ff0844 0%, #ff5858 100%)'
                        : isMedium
                            ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                            : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '999px',
                    transition: 'width 0.1s linear',
                    boxShadow: isLow ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(79, 192, 254, 0.5)',
                }} />
            </div>
        </div>
    );
}
