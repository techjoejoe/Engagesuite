'use client';

import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/Button';

interface Props {
    classId: string;
    userId: string;
    userName: string;
}

const COLORS = [
    { id: 'pink', bg: 'bg-pink-500', border: 'border-pink-600' },
    { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-600' },
    { id: 'green', bg: 'bg-green-500', border: 'border-green-600' },
    { id: 'yellow', bg: 'bg-yellow-400', border: 'border-yellow-500' },
    { id: 'purple', bg: 'bg-purple-600', border: 'border-purple-700' },
];

export default function StudentCommitment({ classId, userId, userName }: Props) {
    const [text, setText] = useState('');
    const [selectedColor, setSelectedColor] = useState('pink');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'classes', classId, 'commitments'), {
                userId,
                userName,
                text: text.trim(),
                color: selectedColor,
                timestamp: serverTimestamp()
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error posting commitment:', error);
            alert('Failed to post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-6">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl animate-bounce">
                    ✨
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Commitment Posted!</h2>
                <p className="text-slate-300 mb-8 max-w-xs">
                    Your commitment is now on the wall. Good luck on your journey!
                </p>
                <Button variant="secondary" onClick={() => { setSubmitted(false); setText(''); }}>
                    Add Another
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in p-2">
            <div className="text-center mb-6">
                <div className="text-5xl mb-2">🧱</div>
                <h2 className="text-2xl font-bold text-white">Commitment Wall</h2>
                <p className="text-slate-400 text-sm">Make a pledge to your future self.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
                {/* Color Picker */}
                <div className="flex justify-center gap-3">
                    {COLORS.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedColor(c.id)}
                            className={`w-10 h-10 rounded-full ${c.bg} transition-transform hover:scale-110 ${selectedColor === c.id ? 'ring-4 ring-white scale-110' : 'opacity-70'}`}
                        />
                    ))}
                </div>

                {/* Text Area */}
                <div className={`flex-1 rounded-2xl p-6 shadow-inner transition-colors duration-300 flex flex-col ${selectedColor === 'pink' ? 'bg-pink-500/20' :
                        selectedColor === 'blue' ? 'bg-blue-500/20' :
                            selectedColor === 'green' ? 'bg-green-500/20' :
                                selectedColor === 'yellow' ? 'bg-yellow-400/20' :
                                    'bg-purple-600/20'
                    }`}>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70 text-white">
                        I commit to...
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your commitment here..."
                        className="w-full h-full bg-transparent text-xl font-bold text-white placeholder-white/30 outline-none resize-none"
                        maxLength={140}
                        autoFocus
                    />
                    <div className="text-right text-xs text-white/50 mt-2">
                        {text.length}/140
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={submitting || !text.trim()}
                    className={`w-full py-4 text-xl font-bold shadow-lg transition-all active:scale-95 ${selectedColor === 'pink' ? 'bg-pink-500 hover:bg-pink-600' :
                            selectedColor === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                selectedColor === 'green' ? 'bg-green-500 hover:bg-green-600' :
                                    selectedColor === 'yellow' ? 'bg-yellow-400 hover:bg-yellow-500 text-black' :
                                        'bg-purple-600 hover:bg-purple-700'
                        }`}
                >
                    {submitting ? 'Posting...' : 'Sign the Wall ✍️'}
                </Button>
            </form>
        </div>
    );
}
