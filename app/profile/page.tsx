'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { getCurrentUser, getUserProfile, signOutUser, updateUserProfile, onAuthStateChange, resetPassword, updateUserEmail } from '@/lib/auth';
import { UserProfile } from '@/lib/auth';
import { getUserBadges, UserBadgeEnriched } from '@/lib/badges';
import { Icons } from '@/components/picpick/Icons';
import ImageCropper from '@/components/ImageCropper';
import HostMenu from '@/components/HostMenu';
import StudentMenu from '@/components/StudentMenu';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [badges, setBadges] = useState<UserBadgeEnriched[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const safetyTimer = setTimeout(() => setLoading(false), 5000);

        const currentUser = getCurrentUser();
        if (currentUser) {
            loadProfile(currentUser.uid);
        }

        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                clearTimeout(timer);
                loadProfile(user.uid);
            } else {
                timer = setTimeout(() => setLoading(false), 2000);
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
            const [data, userBadges] = await Promise.all([
                getUserProfile(uid),
                getUserBadges(uid)
            ]);

            if (data) {
                setProfile(data);
                setEditName(data.displayName || '');
                setEditEmail(data.email || '');
                setBadges(userBadges);
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

    const handleSaveProfile = async () => {
        if (!profile) return;
        if (!editName.trim()) return alert("Name cannot be empty");
        if (!editEmail.trim()) return alert("Email cannot be empty");

        try {
            let emailMessage = '';

            // Handle Email Update
            if (editEmail !== profile.email) {
                try {
                    await updateUserEmail(editEmail);
                    emailMessage = "\nVerification email sent to new address. Please verify to update login.";
                } catch (e: any) {
                    if (e.code === 'auth/requires-recent-login') {
                        alert("To update your email, please logout and login again, then try immediately.");
                        return;
                    }
                    throw e; // Rethrow other errors
                }
            }

            // Update Firestore Profile
            await updateUserProfile(profile.uid, {
                displayName: editName,
                email: editEmail // Update in Firestore so UI reflects intention (Auth will catch up on verify)
            });

            setProfile({
                ...profile,
                displayName: editName,
                email: editEmail
            });

            setIsEditing(false);
            if (emailMessage) alert("Profile Updated!" + emailMessage);

        } catch (e: any) {
            console.error("Error updating profile:", e);
            alert("Failed to update profile: " + e.message);
        }
    };

    const handlePasswordReset = async () => {
        if (!profile?.email) return;
        try {
            await resetPassword(profile.email);
            setResetSent(true);
            setTimeout(() => setResetSent(false), 5000);
        } catch (e: any) {
            alert("Error sending reset email: " + e.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-pulse text-white font-medium">Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-900 text-white">
                <div className="text-xl text-red-400">Error: {error}</div>
                <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
                <Button variant="secondary" onClick={() => router.push('/')}>Go Home</Button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-gray-900 text-white">
                <div className="text-xl">Please log in to view your profile</div>
                <Button variant="primary" onClick={() => router.push('/login')}>Login</Button>
            </div>
        );
    }

    const lifetimePoints = profile.lifetimePoints || 0;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8 overflow-y-auto transition-colors duration-300">
            {profile.role === 'host' ? <HostMenu currentPage="Profile" /> : <StudentMenu currentPage="Profile" />}

            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImageSrc(null)}
                />
            )}

            <div className="container mx-auto max-w-4xl pb-24">
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={() => router.push(profile.role === 'host' ? '/dashboard' : '/student/dashboard')}>
                                Dashboard
                            </Button>
                            <Button variant="danger" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Profile Card */}
                        <Card className="md:col-span-1 flex flex-col items-center text-center gap-4 p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 h-fit">
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
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} disabled={uploading} />
                                </label>
                            </div>

                            <div className="w-full">
                                {isEditing ? (
                                    <div className="space-y-3 w-full">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold self-start">Display Name</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 mb-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold self-start">Email</label>
                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                            <Button variant="primary" onClick={handleSaveProfile} className="text-xs !py-1 !px-3">Save</Button>
                                            <Button variant="secondary" onClick={() => { setIsEditing(false); setEditName(profile.displayName || ''); }} className="text-xs !py-1 !px-3">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                            {profile.displayName || 'User'}
                                            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-indigo-400">
                                                <Icons.Edit className="w-4 h-4" />
                                            </button>
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{profile.role || 'player'}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{profile.email}</p>
                                    </>
                                )}
                            </div>

                            <hr className="w-full border-gray-200 dark:border-slate-700 my-2" />

                            <div className="w-full text-left">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Account</h3>
                                {resetSent ? (
                                    <div className="text-sm text-green-500 font-bold bg-green-500/10 p-2 rounded text-center">✓ Email Sent</div>
                                ) : (
                                    <button
                                        onClick={handlePasswordReset}
                                        className="w-full py-2 px-3 text-sm text-center border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                                    >
                                        Reset Password
                                    </button>
                                )}
                            </div>
                        </Card>

                        {/* Stats Card */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="col-span-1 sm:col-span-3 p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Total Points</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                                        {lifetimePoints.toLocaleString()}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400 mb-1">pts</span>
                                </div>
                            </Card>

                            {/* Badges Section */}
                            <Card className="col-span-1 sm:col-span-3 p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span>🏅</span> My Badges
                                    <span className="text-sm bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">{badges.length}</span>
                                </h3>

                                {badges.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-xl">
                                        <p>No badges earned yet. Keep playing to unlock trophies!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {badges.map((b, idx) => (
                                            <div key={idx} className="group relative bg-gray-50 dark:bg-slate-900 p-4 rounded-xl flex flex-col items-center text-center transition-all hover:scale-105 hover:shadow-lg border border-transparent hover:border-indigo-500/30">
                                                <div className="w-20 h-20 mb-3 relative drop-shadow-md">
                                                    <img src={b.details?.imageUrl} alt={b.details?.name} className="w-full h-full object-contain" />
                                                </div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">{b.details?.name}</h4>

                                                {/* Tooltip Description */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 text-white text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 shadow-xl">
                                                    <div className="font-bold mb-1 text-indigo-300">{b.details?.name}</div>
                                                    <p className="opacity-90">{b.details?.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
