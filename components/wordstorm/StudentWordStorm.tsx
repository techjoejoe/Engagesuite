'use client';

import React, { useState } from 'react';
import { submitWord } from '@/lib/wordstorm';
import Button from '@/components/Button';

export default function StudentWordStorm({ wordStormId }: { wordStormId: string }) {
    const [word, setWord] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim()) return;

        await submitWord(wordStormId, word);
        setWord('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 2000);
    };

    return (
        <div className="flex flex-col h-full items-center justify-center text-center animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-5xl mb-6 shadow-sm border border-blue-100 dark:border-blue-800">
                ☁️
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Word Storm</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-lg">
                Send a word to the cloud!
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
                <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Type a word..."
                    className="w-full p-4 text-center text-2xl rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all mb-4 text-slate-900 dark:text-white"
                    maxLength={20}
                    autoFocus
                />
                <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-4 text-xl shadow-xl bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!word.trim()}
                >
                    {submitted ? 'Sent! 🚀' : 'Submit Word'}
                </Button>
            </form>
        </div>
    );
}
