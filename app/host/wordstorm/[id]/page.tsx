'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getWordStorm, onWordsChange, clearWordStorm } from '@/lib/wordstorm';
import WordCloud from '@/components/wordstorm/WordCloud';
import Button from '@/components/Button';
import HostMenu from '@/components/HostMenu';
import html2canvas from 'html2canvas';
import { Icons } from '@/components/picpick/Icons';

export default function WordStormHostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [words, setWords] = useState<any[]>([]);
    const [aggregatedWords, setAggregatedWords] = useState<{ text: string; count: number }[]>([]);
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

            // Dynamic Filling: Use duplicate words to fill the cloud
            // As more words are submitted, we use fewer duplicates
            const TARGET_COUNT = 50;
            if (agg.length > 0 && agg.length < TARGET_COUNT) {
                const original = [...agg];
                let currentCount = agg.length;
                let suffixCount = 1;

                while (currentCount < TARGET_COUNT) {
                    // Add invisible suffix to make text unique for d3-cloud while looking identical
                    const suffix = '\u200B'.repeat(suffixCount);
                    const nextBatch = original.map(w => ({
                        text: w.text + suffix,
                        count: w.count
                    }));

                    agg = [...agg, ...nextBatch];
                    currentCount += nextBatch.length;
                    suffixCount++;
                }
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

    const handleDownload = async () => {
        const element = document.getElementById('word-cloud-container');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: null, // Transparent background
                scale: 2, // Higher resolution
                logging: false,
                useCORS: true
            } as any);

            const link = document.createElement('a');
            link.download = `WordStorm-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image.');
        }
    };

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
                            onClick={handleDownload}
                            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
                            title="Download Image"
                        >
                            <Icons.Download className="w-4 h-4" /> Download
                        </button>
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
                                {aggregatedWords.length}
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
