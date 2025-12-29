import { db } from './firebase';
import { collection, doc, addDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

export interface Timer {
    id: string;
    classId: string;
    hostId: string;
    endTime: any; // Timestamp
    duration: number; // Seconds
    status: 'running' | 'paused' | 'stopped';
    pausedAt: any; // Timestamp
    label: string;
}

// Get or Create a Timer for a Class
// We use a consistent ID based on classId so there's only one active timer per class (optional, but cleaner)
// Or we can just create a new one every time. The plan said "timers" collection.
// Let's create a new one for each session to allow history if needed, but for now just one active.
export const createTimer = async (classId: string, hostId: string) => {
    if (!classId || !hostId) throw new Error('Missing classId or hostId');

    const docRef = await addDoc(collection(db, 'timers'), {
        classId,
        hostId,
        status: 'stopped',
        duration: 300, // Default 5 mins
        label: 'Break Time',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

// Get Timer
export const getTimer = async (id: string) => {
    const docRef = doc(db, 'timers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Timer;
    }
    return null;
};

// Update Timer
export const updateTimer = async (id: string, data: Partial<Timer>) => {
    const docRef = doc(db, 'timers', id);
    await updateDoc(docRef, data);
};

// Start Timer
export const startTimer = async (id: string, durationSeconds: number) => {
    if (!id) throw new Error('Missing timer ID');
    if (typeof durationSeconds !== 'number' || durationSeconds < 0) {
        console.warn('Invalid duration for startTimer:', durationSeconds);
        durationSeconds = 300;
    }

    const docRef = doc(db, 'timers', id);
    // Calculate endTime based on server time
    // We can't easily do "serverTimestamp() + seconds" in one write without a cloud function or client-side calc.
    // Client-side calc is fine if we trust the host's clock RELATIVELY, but for perfect sync we want server time.
    // Actually, Firestore doesn't support "serverTimestamp() + offset".
    // Best approach: Write `startTime: serverTimestamp()` and `duration: seconds`.
    // Then clients calculate `endTime = startTime + duration`.
    // BUT, if we want to support Pause, it gets complex.
    // Simpler: Host calculates target time based on THEIR clock + offset, writes it as a Date object.
    // Clients read it. If Host clock is wrong, it's wrong for everyone, but they are synced to Host.
    // Better: Use `serverTimestamp()` for `updatedAt` and store `remainingSeconds`.
    // When running, `endTime = now + remainingSeconds`.

    // Let's stick to: Host writes `endTime` as a specific timestamp.
    // We use client-side time for simplicity. Ideally we'd use server time overlap.
    const endTime = new Date(Date.now() + durationSeconds * 1000);

    await updateDoc(docRef, {
        status: 'running',
        duration: durationSeconds,
        endTime: endTime, // Firestore converts JS Date to Timestamp
        pausedAt: null,
    });
};

// Pause Timer
export const pauseTimer = async (id: string, remainingSeconds: number) => {
    const docRef = doc(db, 'timers', id);
    await updateDoc(docRef, {
        status: 'paused',
        pausedAt: serverTimestamp(),
        // We store the remaining time so we can resume correctly
        duration: remainingSeconds
    });
};

// Listen to Timer
export const onTimerChange = (id: string, callback: (timer: Timer) => void) => {
    const docRef = doc(db, 'timers', id);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as Timer);
        }
    });
};
