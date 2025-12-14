'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { onAuthStateChange, signOutUser, getUserProfile, UserProfile } from '@/lib/auth';
import { createClass, onHostedClassesChange, Class } from '@/lib/classes';
import { User } from 'firebase/auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getActiveStudentCount } from '@/lib/classStats';
import HostMenu from '@/components/HostMenu';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<Class[]>([]);
    const [activeStudents, setActiveStudents] = useState<Record<string, number>>({});
    const [creatingClass, setCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            if (!currentUser) {
                router.push('/admin/login');
            } else {
                // Verify Host Role
                try {
                    const userProfile = await getUserProfile(currentUser.uid);
                    if (userProfile?.role !== 'host') {
                        console.warn('Unauthorized access to host dashboard. Redirecting to student dashboard.');
                        router.push('/student/dashboard');
                        return;
                    }
                    setProfile(userProfile);
                    setUser(currentUser);
                } catch (err) {
                    console.error('Error fetching profile:', err);
                    router.push('/admin/login');
                }
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = onHostedClassesChange(user.uid, async (updatedClasses) => {
            setClasses(updatedClasses);
            setLoading(false);
            setError('');

            // Load active student counts for each class
            const counts: Record<string, number> = {};
            for (const cls of updatedClasses) {
                counts[cls.id] = await getActiveStudentCount(cls.id);
            }
            setActiveStudents(counts);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleCreateClass triggered', { user, newClassName, startDate, endDate });
        if (!user) {
            console.error('No user logged in');
            return;
        }
        if (!newClassName.trim()) {
            console.warn('Class name is empty');
            return;
        }
        setCreatingClass(true);
        try {
            console.log('Calling createClass...');
            await createClass(user.uid, newClassName, startDate, endDate);
            console.log('createClass succeeded');
            setNewClassName('');
            setStartDate('');
            setEndDate('');
            setShowModal(false);
            // Listener will auto-update classes
        } catch (error: any) {
            console.error('Error creating class:', error);
            setError('Failed to create class: ' + (error?.message || error));
        } finally {
            setCreatingClass(false);
        }
    };

    const handleSignOut = async () => {
        await signOutUser();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-pulse text-xl font-semibold text-gray-600 dark:text-gray-300">Loading Dashboard...</div>
            </div>
        );
    }

    const resetForm = () => {
        setNewClassName('');
        setStartDate('');
        setEndDate('');
        setCreatingClass(false);
        setError('');
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    return (
        <main className="min-h-screen p-8 overflow-y-auto transition-colors duration-300">
            <HostMenu currentPage="Dashboard" />

            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-lg glass-card">
                            {profile?.photoURL ? (
                                <img
                                    src={profile.photoURL}
                                    alt={profile.displayName || 'Host'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-white">
                                    {profile?.displayName?.charAt(0).toUpperCase() || 'H'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">
                                Welcome back, <span className="text-gradient">{profile?.displayName?.split(' ')[0] || 'Host'}</span>!
                            </h1>
                            <p className="text-sm text-gray-300">
                                Host Dashboard
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="danger" size="sm" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* My Classes Section */}
                <div className="animate-fade-in">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm text-center backdrop-blur-sm">
                            {error}
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">My Classes</h2>
                        <Button
                            variant="primary"
                            onClick={openCreateModal}
                        >
                            + Create Class
                        </Button>
                    </div>

                    {classes.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <div className="text-6xl mb-4 animate-bounce">📂</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Classes Yet</h3>
                            <p className="text-gray-300 mb-8 max-w-md mx-auto">
                                Create a class to get started. You'll manage your students and launch tools from there.
                            </p>
                            <Button variant="primary" onClick={openCreateModal}>
                                Create Your First Class
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="glass-card glass-card-hover p-6 cursor-pointer flex flex-col gap-4 group"
                                    onClick={() => router.push(`/dashboard/class?id=${cls.id}`)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-white truncate pr-2">{cls.name}</h3>
                                        <div className="flex flex-col gap-1 items-end">
                                            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border border-green-500/30">
                                                🟢 {activeStudents[cls.id] || 0} Online
                                            </span>
                                            <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                                {cls.memberIds.length} Total
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-xl text-center border border-white/5">
                                        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">CLASS CODE</div>
                                        <div className="text-2xl font-black tracking-widest text-indigo-400">
                                            {cls.code}
                                        </div>
                                    </div>

                                    {(cls.startDate || cls.endDate) && (
                                        <div className="text-xs text-gray-400 text-center">
                                            {cls.startDate && <span>Start: {new Date(cls.startDate).toLocaleDateString()}</span>}
                                            {cls.startDate && cls.endDate && <span className="mx-1">•</span>}
                                            {cls.endDate && <span>End: {new Date(cls.endDate).toLocaleDateString()}</span>}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4 border-t border-white/10">
                                        <Button variant="secondary" className="w-full">
                                            Enter Class →
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Class Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-md p-8 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Class</h2>
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">Class Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 input-glass focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Biology 101"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-300">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 input-glass focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-300">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 input-glass focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                    disabled={creatingClass || !newClassName.trim()}
                                >
                                    {creatingClass ? 'Creating...' : 'Create Class'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
