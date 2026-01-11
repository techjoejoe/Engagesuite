import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

// Types
export interface Gallery {
    id: string;
    name: string;
    description: string;
    code: string;
    classId: string;
    hostId: string;
    uploadStart: Timestamp | Date;
    uploadEnd: Timestamp | Date;
    votingStart: Timestamp | Date;
    votingEnd: Timestamp | Date;
    uploadOpen: boolean; // Manual control by trainer
    votingOpen: boolean; // Manual control by trainer
    showVoteCounts: boolean; // Toggle vote visibility
    createdAt: Timestamp | Date;
}

export interface Photo {
    id: string;
    imageUrl: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    uploadedAt: Timestamp | Date;
    votes: number;
}

export interface Vote {
    userId: string;
    userName: string;
    userPhoto?: string;
    votedAt: Timestamp | Date;
}

// Get galleries for a specific class
export async function getGalleriesForClass(classId: string): Promise<Gallery[]> {
    const q = query(
        collection(db, 'galleries'),
        where('classId', '==', classId)
    );
    const snapshot = await getDocs(q);
    const galleries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gallery));
    // Sort client-side
    return galleries.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
        return bTime - aTime;
    });
}

// Real-time listener for galleries
export function onGalleriesChange(classId: string, callback: (galleries: Gallery[]) => void): () => void {
    const q = query(
        collection(db, 'galleries'),
        where('classId', '==', classId)
    );
    return onSnapshot(q, (snapshot) => {
        const galleries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gallery));
        // Sort client-side
        const sorted = galleries.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
            return bTime - aTime;
        });
        callback(sorted);
    });
}

// Get single gallery
export async function getGallery(galleryId: string): Promise<Gallery | null> {
    const docRef = doc(db, 'galleries', galleryId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Gallery : null;
}

// Check if user has voted for a photo
export async function hasUserVoted(galleryId: string, photoId: string, userId: string): Promise<boolean> {
    const voteRef = doc(db, 'galleries', galleryId, 'photos', photoId, 'votes', userId);
    const voteSnap = await getDoc(voteRef);
    return voteSnap.exists();
}

// Get user's vote count for gallery (to enforce limits)
export async function getUserVoteCount(galleryId: string, userId: string): Promise<number> {
    const galleryRef = doc(db, 'galleries', galleryId);
    const photosRef = collection(galleryRef, 'photos');
    const photosSnap = await getDocs(photosRef);

    let voteCount = 0;
    for (const photoDoc of photosSnap.docs) {
        const voteRef = doc(db, 'galleries', galleryId, 'photos', photoDoc.id, 'votes', userId);
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
            voteCount++;
        }
    }
    return voteCount;
}

// Generate unique gallery code
export function generateGalleryCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Toggle voting open/closed
export async function toggleVoting(galleryId: string, isOpen: boolean): Promise<void> {
    const galleryRef = doc(db, 'galleries', galleryId);
    await updateDoc(galleryRef, { votingOpen: isOpen });
}

// Toggle upload open/closed
export async function toggleUploads(galleryId: string, isOpen: boolean): Promise<void> {
    const galleryRef = doc(db, 'galleries', galleryId);
    await updateDoc(galleryRef, { uploadOpen: isOpen });
}

// Toggle vote count visibility
export async function toggleVoteCounts(galleryId: string, show: boolean): Promise<void> {
    const galleryRef = doc(db, 'galleries', galleryId);
    await updateDoc(galleryRef, { showVoteCounts: show });
}

// Delete a gallery and all its subcollections
export async function deleteGallery(galleryId: string): Promise<void> {
    // Get all photos
    const photosSnapshot = await getDocs(collection(db, 'galleries', galleryId, 'photos'));

    // Delete each photo and its votes
    for (const photoDoc of photosSnapshot.docs) {
        // Delete all votes for this photo
        const votesSnapshot = await getDocs(collection(db, 'galleries', galleryId, 'photos', photoDoc.id, 'votes'));
        for (const voteDoc of votesSnapshot.docs) {
            await deleteDoc(voteDoc.ref);
        }

        // Delete the photo itself
        await deleteDoc(photoDoc.ref);
    }

    // Finally, delete the gallery
    await deleteDoc(doc(db, 'galleries', galleryId));
}
