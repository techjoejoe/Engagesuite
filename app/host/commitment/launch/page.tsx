'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateClassActivity } from '@/lib/classes';
import Button from '@/components/Button';
import HostMenu from '@/components/HostMenu';
import html2canvas from 'html2canvas';

function CommitmentWallContent() {
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');
    const router = useRouter();
    const [commitments, setCommitments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Activate Tool on Mount
    useEffect(() => {
        if (!classId) return;
        updateClassActivity(classId, { type: 'commitment' }).catch(console.error);
    }, [classId]);

    // Listen for Commitments
    useEffect(() => {
        if (!classId) return;
        const q = query(collection(db, 'classes', classId, 'commitments'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCommitments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [classId]);

    const handleClear = async () => {
        if (!classId) return;
        if (!confirm('Are you sure you want to clear all commitments?')) return;

        const q = query(collection(db, 'classes', classId, 'commitments'));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    };

    const handleDownload = async () => {
        const element = document.getElementById('commitment-wall-container');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a',
                scale: 2,
                useCORS: true,
                logging: false,
            } as any);

            const link = document.createElement('a');
            link.download = `commitment-wall-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error downloading wall:', error);
            alert('Failed to download image.');
        }
    };

    if (!classId) return <div className="text-white p-8">Missing Class ID</div>;

    return (
        <main className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-pink-500/30">
            <HostMenu currentPage="Commitment Wall" classId={classId} />

            <div className="container mx-auto max-w-7xl p-6 pt-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2">
                            Commitment Wall
                        </h1>
                        <p className="text-slate-400 text-lg">
                            What is your commitment to success?
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={handleDownload} className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20">
                            📸 Save Image
                        </Button>
                        <Button variant="secondary" onClick={handleClear} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                            🗑️ Clear Wall
                        </Button>
                        <Button variant="glass" onClick={() => router.push(`/dashboard/class?id=${classId}`)}>
                            Exit
                        </Button>
                    </div>
                </div>

                {/* The Wall */}
                {commitments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-600 animate-pulse">
                        <div className="text-8xl mb-6">🧱</div>
                        <h2 className="text-2xl font-bold">The wall is empty</h2>
                        <p>Waiting for students to post their commitments...</p>
                    </div>
                ) : (
                    <div id="commitment-wall-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr p-4">
                        {commitments.map((note, index) => (
                            <div
                                key={note.id}
                                className={`p-6 rounded-2xl shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-fade-in-up ${note.color === 'pink' ? 'bg-pink-500 text-white rotate-1' :
                                    note.color === 'blue' ? 'bg-blue-500 text-white -rotate-1' :
                                        note.color === 'green' ? 'bg-green-500 text-white rotate-2' :
                                            note.color === 'yellow' ? 'bg-yellow-400 text-black -rotate-2' :
                                                note.color === 'purple' ? 'bg-purple-600 text-white rotate-1' :
                                                    'bg-slate-700 text-white'
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="text-4xl mb-4 opacity-50">❝</div>
                                <p className={`text-xl font-bold mb-6 leading-relaxed ${note.color === 'yellow' ? 'text-black' : 'text-white'}`}>
                                    {note.text}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/10">
                                    <span className={`text-sm font-bold uppercase tracking-wider ${note.color === 'yellow' ? 'text-black/60' : 'text-white/80'}`}>
                                        {note.userName || 'Anonymous'}
                                    </span>
                                    <span className="text-xs opacity-50">
                                        {new Date(note.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function CommitmentLaunchPage() {
    return (
        <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
            <CommitmentWallContent />
        </Suspense>
    );
}
