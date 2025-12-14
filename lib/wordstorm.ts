import { db } from './firebase';
import { collection, doc, addDoc, getDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, increment, writeBatch, getDocs } from 'firebase/firestore';

export interface WordStorm {
    id: string;
    classId: string;
    hostId: string;
    status: 'active' | 'completed';
    createdAt: any;
}

export interface Word {
    id: string;
    text: string;
    count: number;
    updatedAt: any;
}

// Create a new Word Storm session
export const createWordStorm = async (classId: string, hostId: string) => {
    const docRef = await addDoc(collection(db, 'wordstorms'), {
        classId,
        hostId,
        status: 'active',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

// Get a Word Storm by ID
export const getWordStorm = async (id: string) => {
    const docRef = doc(db, 'wordstorms', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as WordStorm;
    }
    return null;
};

// Submit a word (Participant)
export const submitWord = async (wordStormId: string, text: string) => {
    const normalizedText = text.trim().toLowerCase();
    if (!normalizedText) return;

    const wordsRef = collection(db, 'wordstorms', wordStormId, 'words');

    // Check if word exists (simple check, for high volume we might blindly add and aggregate on client, 
    // but for classroom scale, a query check or specific ID based on word text is fine)
    // To avoid race conditions and complex queries, we'll use the word text as the ID if possible, 
    // but Firestore IDs can't have slashes etc. Let's just add a new doc for every submission 
    // and aggregate on the client for the "stream" effect, OR use a transaction.
    // 
    // APPROACH: Add every submission as a separate doc. This allows us to show "recent" words 
    // and animate them flying in. The Host view will aggregate them for the cloud.

    await addDoc(wordsRef, {
        text: normalizedText,
        createdAt: serverTimestamp(),
    });
};

// Listen to words (Host)
export const onWordsChange = (wordStormId: string, callback: (words: any[]) => void) => {
    const q = query(collection(db, 'wordstorms', wordStormId, 'words'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const words = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(words);
    });
};

// Reset/Clear words
export const clearWordStorm = async (wordStormId: string) => {
    const wordsRef = collection(db, 'wordstorms', wordStormId, 'words');
    const snapshot = await getDocs(wordsRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};
