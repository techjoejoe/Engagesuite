'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getWordStorm, onWordsChange, clearWordStorm } from '@/lib/wordstorm';
import WordCloud from '@/components/wordstorm/WordCloud';
import Button from '@/components/Button';
import HostMenu from '@/components/HostMenu';

import { Icons } from '@/components/picpick/Icons';

export default function WordStormHostPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [words, setWords] = useState<any[]>([]);
    const [aggregatedWords, setAggregatedWords] = useState<{ text: string; count: number }[]>([]);
    const [uniqueWordCount, setUniqueWordCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [joinUrl, setJoinUrl] = useState('');

    const [classId, setClassId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setJoinUrl(`${window.location.origin}/play/wordstorm/${id}`);
        }
    }, [id]);

    // Listen for words
    useEffect(() => {
        const unsubscribe = onWordsChange(id, (newWords) => {
            setWords(newWords);

            // Aggregate words
            const counts: Record<string, number> = {};
            newWords.forEach(w => {
                const text = w.text.toLowerCase();
                counts[text] = (counts[text] || 0) + 1;
            });

            let agg = Object.entries(counts).map(([text, count]) => ({ text, count }));

            // Store actual unique word count BEFORE adding duplicates for visual density
            const realUniqueCount = agg.length;
            setUniqueWordCount(realUniqueCount);

            // Dynamic Filling: Use duplicate words to fill the cloud
            // BUT: Words with 5+ submissions should only appear ONCE (they're popular enough)
            // Increased target to fill the space better
            const TARGET_COUNT = 45;

            // Separate words into popular (5+) and less popular (<5)
            const popularWords = agg.filter(w => w.count >= 5);
            const lessPopularWords = agg.filter(w => w.count < 5);

            // Only duplicate less popular words for visual density
            if (lessPopularWords.length > 0 && agg.length < TARGET_COUNT) {
                let duplicatedWords = [...lessPopularWords];
                let currentCount = agg.length;
                let suffixCount = 1;

                while (currentCount < TARGET_COUNT && lessPopularWords.length > 0) {
                    // Add invisible suffix to make text unique for d3-cloud while looking identical
                    const suffix = '\u200B'.repeat(suffixCount);
                    const nextBatch = lessPopularWords.map(w => ({
                        text: w.text + suffix,
                        count: w.count
                    }));

                    duplicatedWords = [...duplicatedWords, ...nextBatch];
                    currentCount += nextBatch.length;
                    suffixCount++;
                }

                // Final array: popular words (once) + duplicated less popular words
                agg = [...popularWords, ...duplicatedWords];
            }

            setAggregatedWords(agg);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    // Update Class Activity
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            const ws = await getWordStorm(id);
            if (isMounted && ws && ws.classId) {
                setClassId(ws.classId);
                // Import updateClassActivity dynamically or at top level
                const { updateClassActivity } = await import('@/lib/classes');
                if (isMounted) {
                    await updateClassActivity(ws.classId, { type: 'wordstorm', id: id });
                }
            }
        };
        init();
        return () => { isMounted = false; };
    }, [id]);



    const handleClear = async () => {
        if (confirm('Are you sure you want to clear all words?')) {
            await clearWordStorm(id);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
            <HostMenu currentPage="WordStorm" classId={classId || undefined} />

            <div className="max-w-[1400px] mx-auto">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm flex flex-wrap justify-between items-center gap-5 border border-gray-100 dark:border-slate-700">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-1 flex items-center gap-2">
                            ☁️ Word Storm
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Live Word Cloud • {words.length} submission{words.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex gap-3 items-center">

                        <button
                            onClick={handleClear}
                            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            🗑️ Clear All
                        </button>
                        <button
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm border border-slate-700"
                            onClick={async () => {
                                if (classId) {
                                    const { updateClassActivity } = await import('@/lib/classes');
                                    await updateClassActivity(classId, { type: 'none' });
                                    router.push(`/dashboard/class?id=${classId}`);
                                } else {
                                    router.back();
                                }
                            }}
                        >
                            ← Back to Class
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                    {/* Word Cloud Section */}
                    <div
                        id="word-cloud-container"
                        className="bg-white dark:bg-slate-800 rounded-xl p-10 shadow-sm min-h-[600px] flex items-center justify-center border border-gray-100 dark:border-slate-700"
                    >
                        {aggregatedWords.length > 0 ? (
                            <WordCloud words={aggregatedWords} width={900} height={550} />
                        ) : (
                            <div className="text-center">
                                <div className="text-8xl mb-5 opacity-30 grayscale">☁️</div>
                                <h2 className="text-2xl font-bold text-gray-300 dark:text-slate-600 mb-2">
                                    Waiting for words...
                                </h2>
                                <p className="text-gray-400 dark:text-slate-500 text-sm">
                                    Words will appear here as students submit
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Join Info Panel */}
                    <div className="flex flex-col gap-4">
                        {/* Stats Card */}
                        <div className="bg-blue-500 dark:bg-blue-600 rounded-xl p-6 shadow-sm text-white text-center">
                            <div className="text-5xl font-bold mb-1">
                                {words.length}
                            </div>
                            <div className="text-sm opacity-90">
                                Total Words Submitted
                            </div>
                        </div>

                        {/* Unique Words Card */}
                        <div className="bg-emerald-500 dark:bg-emerald-600 rounded-xl p-6 shadow-sm text-white text-center">
                            <div className="text-5xl font-bold mb-1">
                                {uniqueWordCount}
                            </div>
                            <div className="text-sm opacity-90">
                                Unique Words
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
