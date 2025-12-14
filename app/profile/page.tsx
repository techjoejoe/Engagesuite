'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { getCurrentUser, getUserProfile, signOutUser, updateUserProfile, onAuthStateChange } from '@/lib/auth';
import { UserProfile } from '@/lib/auth';
import { Icons } from '@/components/picpick/Icons';
import ImageCropper from '@/components/ImageCropper';
import HostMenu from '@/components/HostMenu';
import StudentMenu from '@/components/StudentMenu';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        let safetyTimer: NodeJS.Timeout;

        // Safety timeout to prevent infinite loading
        safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 5000);

        // Check if user is already known synchronously
        const currentUser = getCurrentUser();
        if (currentUser) {
            loadProfile(currentUser.uid);
        }

        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                clearTimeout(timer);
                loadProfile(user.uid);
            } else {
                // Delay showing "logged out" state to prevent flash during auth init
                timer = setTimeout(() => {
                    setLoading(false);
                }, 2000);
            }
        });
        return () => {
            unsubscribe();
            clearTimeout(timer);
            clearTimeout(safetyTimer);
        };
    }, []);

    const loadProfile = async (uid: string) => {
        try {
            const data = await getUserProfile(uid);
            if (data) {
                setProfile(data);
            } else {
                setError('Profile document not found.');
            }
        } catch (error: any) {
            console.error("Error loading profile:", error);
            setError(error.message || 'Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOutUser();
        router.push('/');
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('Image is too large. Please choose an image under 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Reset input value to allow selecting the same file again
        e.target.value = '';
    };

    const handleCropComplete = async (croppedImage: string) => {
        setCropImageSrc(null);
        if (!profile) return;

        setUploading(true);
        try {
            await updateUserProfile(profile.uid, { photoURL: croppedImage });
            setProfile({ ...profile, photoURL: croppedImage });
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-pulse text-white">Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-900 text-white">
                <div className="text-xl text-red-400">Error: {error}</div>
                <Button variant="primary" onClick={() => window.location.reload()}>
                    Retry
                </Button>
                <Button variant="secondary" onClick={() => router.push('/')}>
                    Go Home
                </Button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-900 text-white">
                <div className="text-xl">Please log in to view your profile</div>
                <div className="text-sm text-gray-400">
                    Status: {loading ? 'Loading...' : 'Not Authenticated'}
                </div>
                <Button variant="primary" onClick={() => router.push('/login')}>
                    Login
                </Button>
                <Button variant="secondary" onClick={() => window.location.reload()}>
                    Force Refresh
                </Button>
            </div>
        );
    }

    // Safely calculate stats with defaults
    const gamesPlayed = profile.gamesPlayed || 0;
    const gamesWon = profile.gamesWon || 0;
    const lifetimePoints = profile.lifetimePoints || 0;

    const winRate = gamesPlayed > 0
        ? ((gamesWon / gamesPlayed) * 100).toFixed(1)
        : '0.0';

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8 overflow-y-auto transition-colors duration-300">
            {profile.role === 'host' ? (
                <HostMenu currentPage="Profile" />
            ) : (
                <StudentMenu currentPage="Profile" />
            )}

            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImageSrc(null)}
                />
            )}

            <div className="container mx-auto max-w-4xl pb-16">
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push(profile.role === 'host' ? '/dashboard' : '/student/dashboard')}
                                className="px-5 py-2.5 rounded-xl font-bold transition-all bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
                            >
                                {profile.role === 'host' ? 'Dashboard' : 'Dashboard'}
                            </button>
                            <Button variant="danger" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Profile Card */}
                        <Card className="md:col-span-1 flex flex-col items-center text-center gap-4 p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-lg relative bg-gray-800">
                                    {profile.photoURL ? (
                                        <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                                            {(profile.displayName || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="animate-spin text-white">⏳</div>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-colors">
                                    <Icons.Camera className="w-4 h-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoSelect}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.displayName || 'User'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{profile.role || 'player'}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{profile.email}</p>
                            </div>
                        </Card>

                        {/* Stats Card */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{gamesPlayed}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Games Played</div>
                            </Card>
                            <Card className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{gamesWon}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Games Won</div>
                            </Card>
                            <Card className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{winRate}%</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
                            </Card>

                            <Card className="col-span-1 sm:col-span-3 p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Total Points</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                                        {lifetimePoints.toLocaleString()}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400 mb-1">pts</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
