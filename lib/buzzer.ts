import { db } from './firebase';
import { doc, updateDoc, onSnapshot, arrayUnion, setDoc, getDoc } from 'firebase/firestore';

export interface Buzz {
    userId: string;
    displayName: string;
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
                buzzes: []
            });
        }
    } catch (e) {
        console.error("Error initializing buzzer:", e);
    }
};

// Host: Toggle buzzer status
export const setBuzzerStatus = async (classId: string, status: 'locked' | 'open') => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    try {
        await updateDoc(buzzerRef, { status });
    } catch (e) {
        console.error("Error setting buzzer status:", e);
        // Fallback: Create if missing
        await setDoc(buzzerRef, { status, buzzes: [] }, { merge: true });
    }
};

// Host: Reset buzzes
export const resetBuzzer = async (classId: string) => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    try {
        await updateDoc(buzzerRef, {
            status: 'locked',
            buzzes: []
        });
    } catch (e) {
        console.error("Error resetting buzzer:", e);
        await setDoc(buzzerRef, { status: 'locked', buzzes: [] }, { merge: true });
    }
};

// Student: Buzz in
export const buzzIn = async (classId: string, userId: string, displayName: string) => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    const snap = await getDoc(buzzerRef);

    if (snap.exists()) {
        const data = snap.data() as BuzzerState;
        if (data.status === 'open') {
            // Check if already buzzed
            const alreadyBuzzed = data.buzzes.some(b => b.userId === userId);
            if (!alreadyBuzzed) {
                await updateDoc(buzzerRef, {
                    buzzes: arrayUnion({
                        userId,
                        displayName,
                        timestamp: Date.now()
                    })
                });
                return true;
            }
        }
    }
    return false;
};

// Subscribe to buzzer state
export const onBuzzerChange = (classId: string, callback: (data: BuzzerState) => void) => {
    const buzzerRef = doc(db, `classes/${classId}/tools/buzzer`);
    return onSnapshot(buzzerRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as BuzzerState);
        } else {
            // If doc doesn't exist yet, return default locked state
            callback({ status: 'locked', buzzes: [] });
        }
    });
};
