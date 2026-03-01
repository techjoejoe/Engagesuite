'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { onAuthStateChange } from '@/lib/auth';
import { getClass, updateClassActivity, Class } from '@/lib/classes';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import HostMenu from '@/components/HostMenu';

function LaunchPicPickContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    const [user, setUser] = useState<User | null>(null);
    const [classData, setClassData] = useState<Class | null>(null);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: 'Submit and vote for your favorite photos!'
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChange((currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!classId || !user) return;

        const loadClass = async () => {
            const cls = await getClass(classId);
            if (cls && cls.hostId === user.uid) {
                setClassData(cls);
                setFormData(prev => ({ ...prev, name: `${cls.name} Photo Contest` }));
            } else {
                router.push('/dashboard');
            }
        };

        loadClass();
    }, [classId, user, router]);

    const handleLaunch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classId || !user) return;

        setCreating(true);

        try {
            const now = new Date();
            const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

            // Generate gallery code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Create the PicPick gallery
            const galleryRef = await addDoc(collection(db, 'galleries'), {
                name: formData.name,
                description: formData.description,
                code,
                hostId: user.uid,
                classId, // Link to class
                uploadStart: now,
                uploadEnd: oneYearFromNow, // Placeholder
                votingStart: now,
                votingEnd: oneYearFromNow, // Placeholder
                uploadOpen: false, // Trainer controls manually
                votingOpen: false, // Trainer controls manually
                showVoteCounts: false, // Hidden by default
                createdAt: serverTimestamp()
            });

            // Set as current class activity
            await updateClassActivity(classId, {
                type: 'picpick',
                id: galleryRef.id
            });

            // Navigate to the gallery admin page
            router.push(`/picpick/admin/gallery/${galleryRef.id}`);
        } catch (error) {
            console.error('Error creating PicPick:', error);
            alert('Failed to create PicPick gallery');
            setCreating(false);
        }
    };

    if (!classData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="animate-pulse text-xl font-semibold text-white/70 dark:text-gray-300">Loading...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-transparent p-6 transition-colors duration-300">
            <HostMenu currentPage="PicPick" classId={classId || undefined} />
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <Button
                    variant="secondary"
                    onClick={() => router.push(`/dashboard/class?id=${classId}`)}
                    type="button"
                    className="mb-6 bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                >
                    ← Back to Class
                </Button>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10 dark:border-slate-700 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">📸</div>
                        <h1 className="text-3xl font-bold text-white dark:text-white mb-2">
                            Launch PicPick
                        </h1>
                        <p className="text-white/60">
                            Start a photo contest for <span className="font-semibold text-white">{classData.name}</span>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLaunch} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Gallery Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="e.g., Holiday Photo Contest"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                placeholder="What's this contest about?"
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">ℹ️</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-indigo-300 mb-1">How it works:</h4>
                                    <ul className="text-sm text-indigo-200/80 space-y-1">
                                        <li>• Students will see the gallery on their dashboard</li>
                                        <li>• You control when uploads and voting are open</li>
                                        <li>• Toggle upload/voting on or off at any time</li>
                                        <li>• Show or hide vote counts as needed</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => router.push(`/picpick/admin?classId=${classId}`)}
                                disabled={creating}
                                type="button"
                                className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
                            >
                                📋 Existing Galleries
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={creating}
                                className="flex-1"
                            >
                                {creating ? 'Creating...' : '+ New Gallery'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default function LaunchPicPick() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="animate-pulse text-xl font-semibold text-white/70 dark:text-gray-300">Loading...</div>
            </div>
        }>
            <LaunchPicPickContent />
        </Suspense>
    );
}
