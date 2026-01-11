import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, onSnapshot, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';

export type EnergyLevel = 0 | 25 | 50 | 75 | 100;
export type PulseFeeling = 'energized' | 'good' | 'ok' | 'tired' | 'needBreak';

export interface StudentEnergy {
    userId: string;
    displayName: string;
    level: EnergyLevel;
    timestamp: number;
}

export interface PulseResponse {
    userId: string;
    displayName: string;
    feeling: PulseFeeling;
    timestamp: number;
}

export interface PulseCheck {
    id: string;
    classId: string;
    active: boolean;
    startTime: number;
    responses: PulseResponse[];
}

// Set student energy level
export const setStudentEnergy = async (
    classId: string,
    userId: string,
    displayName: string,
    level: EnergyLevel
) => {
    const energyRef = doc(db, `classes/${classId}/energy/${userId}`);
    await setDoc(energyRef, {
        userId,
        displayName,
        level,
        timestamp: Date.now()
    });
};

// Initialize student energy only if they don't have an existing record
export const initStudentEnergy = async (
    classId: string,
    userId: string,
    displayName: string,
    defaultLevel: EnergyLevel = 100
) => {
    const energyRef = doc(db, `classes/${classId}/energy/${userId}`);
    const snap = await getDoc(energyRef);

    // Only set if doesn't exist
    if (!snap.exists()) {
        await setDoc(energyRef, {
            userId,
            displayName,
            level: defaultLevel,
            timestamp: Date.now()
        });
    }
};

// Get all class energy levels
export const getClassEnergy = async (classId: string): Promise<StudentEnergy[]> => {
    const energyCol = collection(db, `classes/${classId}/energy`);
    const snapshot = await getDocs(energyCol);
    return snapshot.docs.map(doc => doc.data() as StudentEnergy);
};

// Subscribe to class energy changes
export const onEnergyChange = (classId: string, callback: (energy: StudentEnergy[]) => void) => {
    const energyCol = collection(db, `classes/${classId}/energy`);
    return onSnapshot(energyCol, (snapshot) => {
        const energy = snapshot.docs.map(doc => doc.data() as StudentEnergy);
        callback(energy);
    });
};

// Launch pulse check
export const launchPulseCheck = async (classId: string): Promise<string> => {
    // First, deactivate any existing active pulse checks
    const pulseCol = collection(db, `classes/${classId}/pulseChecks`);
    const existingPulses = await getDocs(pulseCol);
    for (const pulseDoc of existingPulses.docs) {
        const data = pulseDoc.data();
        if (data.active) {
            await updateDoc(doc(db, `classes/${classId}/pulseChecks/${pulseDoc.id}`), { active: false });
        }
    }

    // Now create the new pulse check
    const sessionId = `pulse_${Date.now()}`;
    const pulseRef = doc(db, `classes/${classId}/pulseChecks/${sessionId}`);
    await setDoc(pulseRef, {
        id: sessionId,
        classId,
        active: true,
        startTime: Date.now(),
        responses: []
    });
    return sessionId;
};

// Close pulse check
export const closePulseCheck = async (classId: string, sessionId: string) => {
    const pulseRef = doc(db, `classes/${classId}/pulseChecks/${sessionId}`);
    await updateDoc(pulseRef, { active: false });
};

// Deactivate all pulse checks for a class (cleanup function)
export const deactivateAllPulseChecks = async (classId: string) => {
    const pulseCol = collection(db, `classes/${classId}/pulseChecks`);
    const snapshot = await getDocs(pulseCol);
    for (const pulseDoc of snapshot.docs) {
        const data = pulseDoc.data();
        if (data.active) {
            await updateDoc(doc(db, `classes/${classId}/pulseChecks/${pulseDoc.id}`), { active: false });
        }
    }
};

// Submit pulse response
export const submitPulseResponse = async (
    classId: string,
    sessionId: string,
    userId: string,
    displayName: string,
    feeling: PulseFeeling
) => {
    // Map feeling to energy level
    const feelingToEnergy: Record<PulseFeeling, EnergyLevel> = {
        'energized': 100,
        'good': 75,
        'ok': 50,
        'tired': 25,
        'needBreak': 0
    };
    const energyLevel = feelingToEnergy[feeling];

    // Update the pulse check response
    const pulseRef = doc(db, `classes/${classId}/pulseChecks/${sessionId}`);
    const snap = await getDoc(pulseRef);

    if (snap.exists()) {
        const data = snap.data() as PulseCheck;
        // Check if user already responded
        const existingIndex = data.responses.findIndex(r => r.userId === userId);
        const newResponse: PulseResponse = {
            userId,
            displayName,
            feeling,
            timestamp: Date.now()
        };

        let responses = [...data.responses];
        if (existingIndex >= 0) {
            responses[existingIndex] = newResponse;
        } else {
            responses.push(newResponse);
        }

        await updateDoc(pulseRef, { responses });
    }

    // Also update the student's energy level
    await setStudentEnergy(classId, userId, displayName, energyLevel);
};

// Get active pulse check
export const getActivePulseCheck = async (classId: string): Promise<PulseCheck | null> => {
    const pulseCol = collection(db, `classes/${classId}/pulseChecks`);
    const snapshot = await getDocs(pulseCol);

    for (const doc of snapshot.docs) {
        const data = doc.data() as PulseCheck;
        if (data.active) {
            return data;
        }
    }
    return null;
};

// Subscribe to pulse check changes
export const onPulseCheckChange = (
    classId: string,
    sessionId: string,
    callback: (pulse: PulseCheck | null) => void
) => {
    const pulseRef = doc(db, `classes/${classId}/pulseChecks/${sessionId}`);
    return onSnapshot(pulseRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as PulseCheck);
        } else {
            callback(null);
        }
    });
};

// Subscribe to any active pulse check
// Subscribe to any active pulse check
export const onActivePulseCheck = (classId: string, callback: (pulse: PulseCheck | null) => void) => {
    const pulseCol = collection(db, `classes/${classId}/pulseChecks`);
    return onSnapshot(pulseCol, (snapshot) => {
        for (const doc of snapshot.docs) {
            const data = doc.data() as PulseCheck;
            if (data.active) {
                callback(data);
                return;
            }
        }
        callback(null);
    });
};

// Subscribe to single student energy change
export const onStudentEnergyChange = (classId: string, userId: string, callback: (energy: StudentEnergy | null) => void) => {
    const energyRef = doc(db, `classes/${classId}/energy/${userId}`);
    return onSnapshot(energyRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as StudentEnergy);
        } else {
            callback(null);
        }
    });
};

// Reset all student energy levels to 100
export const resetAllEnergy = async (classId: string) => {
    const energyCol = collection(db, `classes/${classId}/energy`);
    const snapshot = await getDocs(energyCol);

    const batch = [];
    // Firestore batch limit is 500. For now, we'll do parallel promises or sequential batches if needed.
    // Assuming small class size for now.
    const promises = snapshot.docs.map(doc =>
        setDoc(doc.ref, { ...doc.data(), level: 100, timestamp: Date.now() }, { merge: true })
    );

    await Promise.all(promises);
};
