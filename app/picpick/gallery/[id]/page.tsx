'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, collection, onSnapshot, updateDoc, increment, addDoc, serverTimestamp, getDoc, getDocs, setDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { hasUserVoted, getUserVoteCount } from '@/lib/picpick';
import { Icons } from '@/components/picpick/Icons';
import { Spinner, Toast, Confetti, WinnerBadge } from '@/components/picpick/UI';
import { PhotoCard } from '@/components/picpick/PhotoCard';
import { ImageUpload } from '@/components/picpick/ImageUpload';
import Button from '@/components/Button';
import Card from '@/components/Card';

// Helper functions
const getTimeRemaining = (end: any) => {
    if (!end) return '';
    const now = new Date();
    const endDate = end?.toDate ? end.toDate() : new Date(end);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};



export default function GalleryPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [currentGallery, setCurrentGallery] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [userVoteCount, setUserVoteCount] = useState(0);
    const [votedPhotoIds, setVotedPhotoIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Authentication check
    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            if (!currentUser) {
                setToast({ message: 'Please log in to view this gallery', type: 'error' });
                setTimeout(() => router.push('/login'), 2000);
                return;
            }
            setUser(currentUser);

            // Get user profile
            const profile = await getUserProfile(currentUser.uid);
            setUserProfile(profile);
        });
        return () => unsubscribe();
    }, [router]);

    // Load gallery with real-time updates (so host toggles reflect instantly)
    useEffect(() => {
        const galleryRef = doc(db, 'galleries', id);
        const unsubscribe = onSnapshot(galleryRef, (docSnap) => {
            if (docSnap.exists()) {
                setCurrentGallery({ id: docSnap.id, ...docSnap.data() });
            } else {
                setToast({ message: 'Gallery not found', type: 'error' });
                setTimeout(() => router.push('/picpick'), 2000);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id, router]);

    // Load user's votes
    useEffect(() => {
        if (!currentGallery?.id || !user) return;

        const loadUserVotes = async () => {
            const voteCount = await getUserVoteCount(currentGallery.id, user.uid);
            setUserVoteCount(voteCount);

            // Load which photos user voted for
            const photosRef = collection(db, 'galleries', currentGallery.id, 'photos');
            const photosSnap = await getDocs(photosRef);
            const voted = new Set<string>();

            for (const photoDoc of photosSnap.docs) {
                const hasVoted = await hasUserVoted(currentGallery.id, photoDoc.id, user.uid);
                if (hasVoted) {
                    voted.add(photoDoc.id);
                }
            }
            setVotedPhotoIds(voted);
        };

        loadUserVotes();
    }, [currentGallery?.id, user]);

    // Real-time photos listener
    useEffect(() => {
        if (!currentGallery?.id) return;

        const q = query(collection(db, 'galleries', currentGallery.id, 'photos'), orderBy('votes', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const photosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPhotos(photosData);
        });

        return () => unsubscribe();
    }, [currentGallery?.id]);

    // Update time remaining
    useEffect(() => {
        if (!currentGallery?.votingEnd) return;
        const updateTime = () => setTimeRemaining(getTimeRemaining(currentGallery.votingEnd));
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [currentGallery?.votingEnd]);

    const handleVote = async (photoId: string) => {
        if (!user) {
            setToast({ message: 'Please log in to vote', type: 'error' });
            return;
        }

        // Prevent voting for own photo
        const photo = photos.find(p => p.id === photoId);
        if (photo && photo.userId === user.uid) {
            setToast({ message: 'You cannot vote for your own photo', type: 'error' });
            return;
        }

        // Check if already voted for this photo
        if (votedPhotoIds.has(photoId)) {
            setToast({ message: 'You already voted for this photo', type: 'error' });
            return;
        }

        // Check vote limit (4 votes total)
        if (userVoteCount >= 4) {
            setToast({ message: 'You have used all 4 votes', type: 'error' });
            return;
        }

        try {
            // Record vote in subcollection
            const voteRef = doc(db, 'galleries', currentGallery.id, 'photos', photoId, 'votes', user.uid);
            await setDoc(voteRef, {
                userId: user.uid,
                userName: userProfile?.displayName || 'Anonymous',
                userPhoto: userProfile?.photoURL || null,
                votedAt: serverTimestamp()
            });

            // Increment vote count on photo
            const photoRef = doc(db, 'galleries', currentGallery.id, 'photos', photoId);
            await updateDoc(photoRef, { votes: increment(1) });

            // Update local state
            setVotedPhotoIds(prev => new Set(prev).add(photoId));
            setUserVoteCount(prev => prev + 1);
            setToast({ message: 'Vote cast! ❤️', type: 'success' });

            if (userVoteCount === 0) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }
        } catch (err) {
            setToast({ message: 'Failed to vote', type: 'error' });
            console.error(err);
        }
    };

    const handleUpload = async (blob: Blob) => {
        if (!user || !userProfile) {
            setToast({ message: 'Please log in to upload', type: 'error' });
            return;
        }

        setUploading(true);
        try {
            const fileName = `${user.uid}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const storageRef = ref(storage, `galleries/${currentGallery.id}/${fileName}`);
            await uploadBytes(storageRef, blob);
            const imageUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'galleries', currentGallery.id, 'photos'), {
                imageUrl,
                userId: user.uid,
                userName: userProfile.displayName || 'Anonymous',
                userPhoto: userProfile.photoURL || null,
                uploadedAt: serverTimestamp(),
                votes: 0
            });

            setToast({ message: 'Photo uploaded! 📸', type: 'success' });
            setShowUploadModal(false);
        } catch (err) {
            setToast({ message: 'Upload failed', type: 'error' });
            console.error(err);
        }
        setUploading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!currentGallery) return null;

    const votingOpen = currentGallery.votingOpen || false;
    const uploadOpen = currentGallery.uploadOpen || false;
    const votesRemaining = 4 - userVoteCount;

    return (
        <div className="min-h-screen w-full bg-[#0a0a0f] text-white font-display relative selection:bg-indigo-500/30">
            {showConfetti && <Confetti />}

            {/* Fixed Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link href="/picpick">
                            <Button variant="glass" size="sm" className="p-2 rounded-full h-10 w-10 flex items-center justify-center hover:bg-white/10">
                                <Icons.Back className="w-5 h-5" />
                            </Button>
                        </Link>

                        <div className="flex flex-col items-center">
                            <h1 className="font-bold text-lg leading-none mb-1">{currentGallery.name}</h1>
                            <div className="flex items-center gap-2 text-xs text-white/60 font-mono bg-white/5 px-2 py-0.5 rounded-full">
                                <Icons.Clock className="w-3 h-3" />
                                <span>{timeRemaining}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">Votes Left</span>
                                <span className="text-lg font-bold text-indigo-400 leading-none">{votesRemaining}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 md:hidden">
                                <span className="font-bold">{votesRemaining}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
                {/* Podium */}
                {photos.length >= 3 && photos[0].votes > 0 && (
                    <div className="mb-12">
                        <div className="flex items-end justify-center gap-4 md:gap-8 py-8">
                            <div className="flex flex-col items-center transform translate-y-8 transition-transform hover:-translate-y-2 duration-500">
                                <WinnerBadge photo={photos[1]} rank={2} size="md" />
                            </div>
                            <div className="flex flex-col items-center z-10 transform hover:-translate-y-4 duration-500 relative">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce text-4xl">👑</div>
                                <WinnerBadge photo={photos[0]} rank={1} size="lg" />
                            </div>
                            <div className="flex flex-col items-center transform translate-y-12 transition-transform hover:-translate-y-2 duration-500">
                                <WinnerBadge photo={photos[2]} rank={3} size="sm" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Grid */}
                <div className="mb-24">
                    {photos.length === 0 ? (
                        <Card className="p-16 text-center bg-white/5 backdrop-blur-md border-white/10 rounded-2xl">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                <Icons.Camera className="w-10 h-10 text-white/40" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                            <p className="text-white/60 mb-8">Be the first to share a moment!</p>
                            {uploadOpen && (
                                <Button onClick={() => setShowUploadModal(true)} variant="primary" className="gap-2">
                                    <Icons.Upload className="w-5 h-5" /> Upload Photo
                                </Button>
                            )}
                        </Card>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-10 justify-items-center">
                            {photos.map((photo) => (
                                <PhotoCard
                                    key={photo.id}
                                    photo={photo}
                                    onVote={handleVote}
                                    votingOpen={currentGallery.votingOpen}
                                    canVote={userVoteCount < 4 && photo.userId !== user?.uid}
                                    hasVoted={votedPhotoIds.has(photo.id)}
                                    showVoteCounts={currentGallery.showVoteCounts}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Upload Button (FAB) */}
            {uploadOpen && (
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white hover:scale-110 transition-transform z-50 group"
                >
                    <Icons.Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                </button>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-200">
                    <Card className="max-w-md w-full bg-[#0f0f13] border-white/10 p-6 relative rounded-2xl">
                        <button
                            onClick={() => setShowUploadModal(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <Icons.Plus className="w-6 h-6 rotate-45" />
                        </button>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Icons.Camera className="w-6 h-6" /> Upload Photo
                        </h3>
                        <ImageUpload onUpload={handleUpload} uploading={uploading} />
                    </Card>
                </div>
            )}

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}
