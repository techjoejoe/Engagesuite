'use client';

import React, { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, updateDoc, increment, addDoc, serverTimestamp, getDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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

const isWithinWindow = (start: any, end: any) => {
    if (!start || !end) return false;
    const now = new Date();
    const startDate = start?.toDate ? start.toDate() : new Date(start);
    const endDate = end?.toDate ? end.toDate() : new Date(end);
    return now >= startDate && now <= endDate;
};

const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
};

// Voting helpers
const getVotingData = (galleryId: string) => {
    if (typeof window === 'undefined') return { totalVotes: 0, photoVotes: {} };

    const today = getTodayString();
    const key = `picpick_votes_${galleryId}`;
    const data = JSON.parse(localStorage.getItem(key) || '{}');

    // Reset if new day
    if (data.date !== today) {
        const newData = { date: today, totalVotes: 0, photoVotes: {} };
        localStorage.setItem(key, JSON.stringify(newData));
        return newData;
    }

    return data;
};

const saveVotingData = (galleryId: string, data: any) => {
    if (typeof window === 'undefined') return;
    const key = `picpick_votes_${galleryId}`;
    localStorage.setItem(key, JSON.stringify(data));
};

const canVoteForPhoto = (galleryId: string, photoId: string) => {
    const data = getVotingData(galleryId);
    if (data.totalVotes >= 4) return false;
    const photoVoteCount = data.photoVotes[photoId] || 0;
    if (photoVoteCount >= 2) return false;
    return true;
};

const recordVote = (galleryId: string, photoId: string) => {
    const data = getVotingData(galleryId);
    data.totalVotes++;
    data.photoVotes[photoId] = (data.photoVotes[photoId] || 0) + 1;
    saveVotingData(galleryId, data);
    return data;
};

interface StudentGalleryProps {
    galleryId: string;
}

export default function StudentGallery({ galleryId }: StudentGalleryProps) {
    const [currentGallery, setCurrentGallery] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [votingData, setVotingData] = useState<{ totalVotes: number, photoVotes: Record<string, number> }>({ totalVotes: 0, photoVotes: {} });
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Load gallery
    useEffect(() => {
        const fetchGallery = async () => {
            const docRef = doc(db, 'galleries', galleryId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCurrentGallery({ id: docSnap.id, ...docSnap.data() });
            } else {
                setToast({ message: 'Gallery not found', type: 'error' });
            }
            setLoading(false);
        };
        fetchGallery();
    }, [galleryId]);

    // Load voting data
    useEffect(() => {
        if (currentGallery?.id) {
            setVotingData(getVotingData(currentGallery.id));
        }
    }, [currentGallery?.id]);

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
        if (!canVoteForPhoto(currentGallery.id, photoId)) {
            setToast({ message: 'Cannot vote for this photo', type: 'error' });
            return;
        }

        try {
            const photoRef = doc(db, 'galleries', currentGallery.id, 'photos', photoId);
            await updateDoc(photoRef, { votes: increment(1) });

            const newData = recordVote(currentGallery.id, photoId);
            setVotingData({ ...newData });
            setToast({ message: 'Vote cast! ❤️', type: 'success' });

            if (newData.totalVotes === 1) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }
        } catch (err) {
            setToast({ message: 'Failed to vote', type: 'error' });
            console.error(err);
        }
    };

    const handleUpload = async (blob: Blob) => {
        setUploading(true);
        try {
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const storageRef = ref(storage, `galleries/${currentGallery.id}/${fileName}`);
            await uploadBytes(storageRef, blob);
            const imageUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'galleries', currentGallery.id, 'photos'), {
                imageUrl,
                uploadedBy: 'Anonymous',
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
            <div className="flex items-center justify-center h-64 text-white">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!currentGallery) return <div className="text-white text-center p-8">Gallery not found</div>;

    const votingOpen = isWithinWindow(currentGallery.votingStart, currentGallery.votingEnd);
    const uploadOpen = isWithinWindow(currentGallery.uploadStart, currentGallery.uploadEnd);
    const votesRemaining = 4 - votingData.totalVotes;

    return (
        <div className="w-full text-white font-display relative selection:bg-indigo-500/30">
            {showConfetti && <Confetti />}

            {/* Header Info */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6 flex items-center justify-between backdrop-blur-sm border border-white/10">
                <div className="flex flex-col">
                    <h1 className="font-bold text-lg leading-none mb-1">{currentGallery.name}</h1>
                    <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
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

            {/* Podium */}
            {photos.length >= 3 && photos[0].votes > 0 && (
                <div className="mb-8">
                    <div className="flex items-end justify-center gap-4 py-4">
                        <div className="flex flex-col items-center transform translate-y-4">
                            <WinnerBadge photo={photos[1]} rank={2} size="md" />
                        </div>
                        <div className="flex flex-col items-center z-10">
                            <div className="absolute -top-8 animate-bounce text-2xl">👑</div>
                            <WinnerBadge photo={photos[0]} rank={1} size="lg" />
                        </div>
                        <div className="flex flex-col items-center transform translate-y-6">
                            <WinnerBadge photo={photos[2]} rank={3} size="sm" />
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Grid */}
            <div className="mb-24">
                {photos.length === 0 ? (
                    <Card className="p-12 text-center bg-white/5 backdrop-blur-md border-white/10 rounded-2xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                            <Icons.Camera className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                        <p className="text-white/60 mb-6 text-sm">Be the first to share a moment!</p>
                        {uploadOpen && (
                            <Button onClick={() => setShowUploadModal(true)} variant="primary" className="gap-2">
                                <Icons.Upload className="w-4 h-4" /> Upload Photo
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {photos.map((photo, index) => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                rank={index + 1}
                                galleryId={currentGallery.id}
                                onVote={handleVote}
                                votingOpen={votingOpen}
                                canVote={votingOpen && canVoteForPhoto(currentGallery.id, photo.id)}
                                votesRemaining={votesRemaining}
                                votesOnThis={votingData.photoVotes[photo.id] || 0}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Upload Button (FAB) */}
            {uploadOpen && (
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="fixed bottom-10 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform z-50 group"
                >
                    <Icons.Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
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
