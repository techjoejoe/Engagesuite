import { db } from './firebase';
import { doc, updateDoc, onSnapshot, arrayUnion, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export interface Buzz {
    userId: string;
    displayName: string;
    photoURL?: string;
    timestamp: number;
}

export interface BuzzerState {
    status: 'locked' | 'open';
    buzzes: Buzz[];
}

// Initialize buzzer for a class if it doesn't exist
export const initBuzzer = async (classId: string) => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    try {
        const snap = await getDoc(buzzerRef);
        if (!snap.exists()) {
            await setDoc(buzzerRef, {
                status: 'locked',
                buzzes: [],
                lastUpdated: serverTimestamp()
            });
        }
    } catch (e) {
        console.error("Error initializing buzzer:", e);
    }
};

// Host: Toggle buzzer status - Optimized with batch writes
export const setBuzzerStatus = async (classId: string, status: 'locked' | 'open') => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    try {
        await updateDoc(buzzerRef, { 
            status,
            lastUpdated: serverTimestamp()
        });
    } catch (e) {
        console.error("Error setting buzzer status:", e);
        await setDoc(buzzerRef, { status, buzzes: [], lastUpdated: serverTimestamp() }, { merge: true });
    }
};

// Host: Reset buzzes - Optimized single write
export const resetBuzzer = async (classId: string) => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    try {
        await updateDoc(buzzerRef, {
            status: 'locked',
            buzzes: [],
            lastUpdated: serverTimestamp()
        });
    } catch (e) {
        console.error("Error resetting buzzer:", e);
        await setDoc(buzzerRef, { status: 'locked', buzzes: [], lastUpdated: serverTimestamp() }, { merge: true });
    }
};

// Student: Buzz in - Optimized with client-side timestamp for immediate feedback
export const buzzIn = async (classId: string, userId: string, displayName: string, photoURL?: string) => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    
    try {
        const snap = await getDoc(buzzerRef);
        
        if (snap.exists()) {
            const data = snap.data() as BuzzerState;
            if (data.status === 'open') {
                // Check if already buzzed
                const alreadyBuzzed = data.buzzes.some(b => b.userId === userId);
                if (!alreadyBuzzed) {
                    // Use client timestamp for immediate UI update
                    await updateDoc(buzzerRef, {
                        buzzes: arrayUnion({
                            userId,
                            displayName,
                            photoURL: photoURL || null,
                            timestamp: Date.now() // Client timestamp for sub-50ms UI update
                        }),
                        lastUpdated: serverTimestamp()
                    });
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error("Error buzzing in:", error);
        return false;
    }
};

// Subscribe to buzzer state - Optimized with includeMetadataChanges for instant local updates
export const onBuzzerChange = (classId: string, callback: (data: BuzzerState) => void) => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    
    // Enable metadata changes to receive local updates immediately (<50ms)
    return onSnapshot(
        buzzerRef,
        { includeMetadataChanges: true },
        (doc) => {
            if (doc.exists()) {
                // Check if data is from cache (local) or server
                const source = doc.metadata.fromCache ? 'cache' : 'server';
                
                // Process immediately regardless of source for <200ms latency
                callback(doc.data() as BuzzerState);
                
                // Optional: Log latency in development
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[Buzzer] Update from ${source}`);
                }
            } else {
                // If doc doesn't exist yet, return default locked state
                callback({ status: 'locked', buzzes: [] });
            }
        },
        (error) => {
            console.error("Error in buzzer subscription:", error);
            callback({ status: 'locked', buzzes: [] });
        }
    );
};
