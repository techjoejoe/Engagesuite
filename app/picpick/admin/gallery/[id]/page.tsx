'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, collection, onSnapshot, deleteDoc, getDoc, orderBy, query, addDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Icons } from '@/components/picpick/Icons';
import { Spinner, Toast } from '@/components/picpick/UI';
import { ImageUpload } from '@/components/picpick/ImageUpload';
import Button from '@/components/Button';
import Card from '@/components/Card';

// Helper functions
const formatDateTime = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const isWithinWindow = (start: any, end: any) => {
    if (!start || !end) return false;
    const now = new Date();
    const startDate = start?.toDate ? start.toDate() : new Date(start);
    const endDate = end?.toDate ? end.toDate() : new Date(end);
    return now >= startDate && now <= endDate;
};

export default function AdminGalleryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [currentGallery, setCurrentGallery] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [copied, setCopied] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load gallery
    useEffect(() => {
        const fetchGallery = async () => {
            const docRef = doc(db, 'galleries', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCurrentGallery({ id: docSnap.id, ...docSnap.data() });
            } else {
                setToast({ message: 'Gallery not found', type: 'error' });
                setTimeout(() => router.push('/picpick/admin'), 2000);
            }
            setLoading(false);
        };
        fetchGallery();
    }, [id, router]);

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

    const handleUpload = async (blob: Blob) => {
        setUploading(true);
        try {
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const storageRef = ref(storage, `galleries/${currentGallery.id}/${fileName}`);
            await uploadBytes(storageRef, blob);
            const imageUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'galleries', currentGallery.id, 'photos'), {
                imageUrl,
                uploadedBy: 'Admin',
                uploadedAt: serverTimestamp(),
                votes: 0
            });

            setToast({ message: 'Photo uploaded! 📸', type: 'success' });
        } catch (err) {
            setToast({ message: 'Upload failed', type: 'error' });
            console.error(err);
        }
        setUploading(false);
    };

    const copyLink = () => {
        const link = `${window.location.origin}/picpick/gallery/${currentGallery.id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const deletePhoto = async (photoId: string) => {
        if (!confirm('Delete this photo?')) return;
        try {
            await deleteDoc(doc(db, 'galleries', currentGallery.id, 'photos', photoId));
            setToast({ message: 'Photo deleted', type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

    const deleteGallery = async () => {
        if (!confirm('Delete this entire gallery? This cannot be undone.')) return;
        try {
            const photosSnapshot = await getDocs(collection(db, 'galleries', currentGallery.id, 'photos'));
            const batch = writeBatch(db);
            photosSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            batch.delete(doc(db, 'galleries', currentGallery.id));
            await batch.commit();

            router.push('/picpick/admin');
        } catch (err) {
            setToast({ message: 'Failed to delete gallery', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!currentGallery) return null;

    const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);
    const votingOpen = isWithinWindow(currentGallery?.votingStart, currentGallery?.votingEnd);

    return (
        <div className="min-h-screen pb-24 bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white font-display">
            <div className="sticky top-0 z-40 bg-black/30 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/picpick/admin">
                            <Button variant="glass" size="sm" className="gap-2">
                                <Icons.Back /> Back
                            </Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={deleteGallery} className="p-2">
                            <Icons.Trash />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                <Card className="p-6 mb-6 border-white/10 bg-white/5 backdrop-blur-md">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">{currentGallery.name}</h1>
                            <p className="text-white/60 mt-1">{currentGallery.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${votingOpen ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                            {votingOpen ? 'Live' : 'Closed'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <Card className="p-4 text-center bg-black/20 border-white/5">
                            <div className="text-2xl font-bold text-indigo-400">{photos.length}</div>
                            <div className="text-sm text-white/60">Photos</div>
                        </Card>
                        <Card className="p-4 text-center bg-black/20 border-white/5">
                            <div className="text-2xl font-bold text-indigo-400">{totalVotes}</div>
                            <div className="text-sm text-white/60">Total Votes</div>
                        </Card>
                        <Card className="p-4 text-center bg-black/20 border-white/5">
                            <div className="text-sm text-white/60">Upload</div>
                            <div className="text-xs">{formatDateTime(currentGallery.uploadStart)}</div>
                            <div className="text-xs">to {formatDateTime(currentGallery.uploadEnd)}</div>
                        </Card>
                        <Card className="p-4 text-center bg-black/20 border-white/5">
                            <div className="text-sm text-white/60">Voting</div>
                            <div className="text-xs">{formatDateTime(currentGallery.votingStart)}</div>
                            <div className="text-xs">to {formatDateTime(currentGallery.votingEnd)}</div>
                        </Card>
                    </div>

                    <Button
                        variant="primary"
                        onClick={copyLink}
                        className="gap-2"
                    >
                        {copied ? <Icons.Check /> : <Icons.Copy />}
                        {copied ? 'Copied!' : 'Copy Share Link'}
                    </Button>
                </Card>

                {/* Admin Upload Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Icons.Upload />
                        Upload Photo (Admin)
                    </h3>
                    <ImageUpload onUpload={handleUpload} uploading={uploading} />
                </div>

                <h2 className="text-xl font-semibold mb-4">All Submissions ({photos.length})</h2>

                {photos.length === 0 ? (
                    <Card className="p-12 text-center border-white/10 bg-white/5 backdrop-blur-md">
                        <p className="text-white/60">No photos uploaded yet</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                            <Card key={photo.id} className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-md p-0">
                                <div className="aspect-square relative">
                                    <img src={photo.imageUrl} alt="Submission" className="w-full h-full object-cover" />
                                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <span className="font-mono text-sm">#{index + 1}</span>
                                    </div>
                                    <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                                        <Icons.Heart filled={true} />
                                        <span className="font-mono text-sm">{photo.votes}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{photo.uploadedBy}</p>
                                            <p className="text-xs text-white/40">{formatDateTime(photo.uploadedAt)}</p>
                                        </div>
                                        <Button variant="danger" size="sm" onClick={() => deletePhoto(photo.id)} className="p-2">
                                            <Icons.Trash />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}
