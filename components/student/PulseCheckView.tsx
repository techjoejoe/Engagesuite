'use client';

import { useState } from 'react';
import { submitPulseResponse, PulseFeeling } from '@/lib/energy';
import Button from '@/components/Button';

interface PulseCheckViewProps {
    classId: string;
    sessionId: string;
    userId: string;
    displayName: string;
}

export default function PulseCheckView({ classId, sessionId, userId, displayName }: PulseCheckViewProps) {
    const [submitted, setSubmitted] = useState(false);
    const [selected, setSelected] = useState<PulseFeeling | null>(null);

    const handleSubmit = async (feeling: PulseFeeling) => {
        setSelected(feeling);
        await submitPulseResponse(classId, sessionId, userId, displayName, feeling);
        setSubmitted(true);
    };

    const feelings: Array<{ id: PulseFeeling; emoji: string; label: string; color: string }> = [
        { id: 'energized', emoji: '😃', label: 'Energized', color: 'from-green-500 to-green-600' },
        { id: 'good', emoji: '😊', label: 'Good', color: 'from-green-400 to-green-500' },
        { id: 'ok', emoji: '😐', label: 'OK', color: 'from-yellow-500 to-yellow-600' },
        { id: 'tired', emoji: '😴', label: 'Tired', color: 'from-orange-500 to-orange-600' },
        { id: 'needBreak', emoji: '🥱', label: 'Need Break', color: 'from-red-500 to-red-600' },
    ];

    if (submitted) {
        const selectedFeeling = feelings.find(f => f.id === selected);
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                <div className="text-8xl mb-6 animate-bounce">
                    {selectedFeeling?.emoji}
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Thanks for sharing!</h2>
                <p className="text-gray-300 text-center max-w-md">
                    Your instructor has received your feedback and will use it to adjust the session.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="text-6xl mb-6">💭</div>
            <h2 className="text-3xl font-bold text-white mb-3">How are you feeling?</h2>
            <p className="text-gray-300 mb-8 text-center max-w-md">
                Help your instructor understand how the class is doing. Your response is anonymous.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-4xl">
                {feelings.map((feeling) => (
                    <button
                        key={feeling.id}
                        onClick={() => handleSubmit(feeling.id)}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all hover:scale-105 group"
                    >
                        <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                            {feeling.emoji}
                        </div>
                        <div className="text-white font-bold text-lg">{feeling.label}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
