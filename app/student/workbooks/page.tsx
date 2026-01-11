'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/auth';
import { getStudentAssignments, ClassAlbum } from '@/lib/albums';
import { getClass, Class } from '@/lib/classes';
import Button from '@/components/Button';
import StudentMenu from '@/components/StudentMenu';

export default function StudentWorkbooksPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [classData, setClassData] = useState<Class | null>(null);
    const [workbooks, setWorkbooks] = useState<ClassAlbum[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            // Get user profile to find their joined class
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);

            if (!profile?.joinedClassId) {
                setLoading(false);
                return;
            }

            // Get class data
            const cls = await getClass(profile.joinedClassId);
            setClassData(cls);

            // Get assigned workbooks
            if (cls) {
                const assignments = await getStudentAssignments(cls.id);
                setWorkbooks(assignments);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-5xl mb-4">📚</div>
                    <p className="text-slate-400">Loading workbooks...</p>
                </div>
            </div>
        );
    }

    if (!userProfile?.joinedClassId) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-6">📚</div>
                    <h1 className="text-2xl font-bold text-white mb-4">No Class Joined</h1>
                    <p className="text-slate-400 mb-8">
                        You need to join a class to see workbooks assigned to you.
                    </p>
                    <Button variant="primary" onClick={() => router.push('/join')}>
                        Join a Class
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Background Blobs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            </div>

            {/* Student Menu */}
            <StudentMenu classId={classData?.id} currentPage="Workbooks" />

            {/* Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <Button
                    variant="glass"
                    size="sm"
                    onClick={() => router.push('/student/dashboard')}
                    className="text-slate-300 hover:text-white"
                >
                    ← Back
                </Button>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-lg mx-auto pt-16">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">📚</div>
                    <h1 className="text-3xl font-black text-white mb-2">Workbooks</h1>
                    <p className="text-slate-400 text-sm">
                        {classData?.name || 'Your Class'}
                    </p>
                </div>

                {/* Workbooks List */}
                {workbooks.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <h2 className="text-xl font-bold text-white mb-2">No Workbooks Yet</h2>
                        <p className="text-slate-400">
                            Your instructor hasn't assigned any workbooks to this class yet. Check back later!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workbooks.map((workbook) => (
                            <button
                                key={workbook.id}
                                onClick={() => router.push(`/play/workbook?id=${workbook.id}`)}
                                className="w-full glass-card p-5 text-left hover:bg-white/10 transition-all group hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-lg truncate group-hover:text-indigo-300 transition-colors">
                                            {workbook.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-sm text-green-400 font-bold">
                                                {workbook.totalPointsAvailable} pts
                                            </span>
                                            <span className="text-slate-500 text-xs">•</span>
                                            <span className="text-xs text-slate-400">
                                                Available
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500 flex items-center justify-center transition-colors ml-4">
                                        <span className="text-indigo-300 group-hover:text-white transition-colors">→</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-8 text-center text-slate-500 text-xs">
                    {workbooks.length} workbook{workbooks.length !== 1 ? 's' : ''} assigned
                </div>
            </div>
        </div>
    );
}
