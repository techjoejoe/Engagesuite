import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { UserProfile, getUserProfile } from './auth';

import { logActivityUsage } from './analytics';

export interface Class {
    id: string;
    code: string;
    name: string;
    hostId: string;
    memberIds: string[];
    startDate?: string;
    endDate?: string;
    createdAt: number;
    currentActivity?: {
        type: 'randomizer' | 'tickr' | 'picpick' | 'quizbattle' | 'wordstorm' | 'poll' | 'buzzer' | 'commitment' | 'none';
        id?: string;
        state?: any;
    };
}

// Generate a random 6-character code
function generateClassCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, 1, O, 0
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create a new class
export async function createClass(hostId: string, name: string, startDate?: string, endDate?: string): Promise<string> {
    const code = generateClassCode();
    const classId = `class_${Date.now()}_${code}`;

    const newClass: any = {
        id: classId,
        code,
        name,
        hostId,
        memberIds: [],
        createdAt: Date.now(),
        currentActivity: { type: 'none' }
    };

    if (startDate) newClass.startDate = startDate;
    if (endDate) newClass.endDate = endDate;

    try {
        await setDoc(doc(db, 'classes', classId), newClass);
    } catch (err) {
        console.error('Error creating class in Firestore:', err);
        throw err; // propagate error to caller
    }
    return code;
}

// Join a class by code
export async function joinClass(userId: string, code: string): Promise<string> {
    console.log('[joinClass] Starting join for user:', userId, 'with code:', code);

    const classesRef = collection(db, 'classes');
    const normalizedCode = code.toUpperCase();
    console.log('[joinClass] Querying for code:', normalizedCode);

    const q = query(classesRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);

    console.log('[joinClass] Query result - empty:', querySnapshot.empty, 'size:', querySnapshot.size);

    if (querySnapshot.empty) {
        console.log('[joinClass] No class found with code:', normalizedCode);
        throw new Error('Invalid class code');
    }

    const classDoc = querySnapshot.docs[0];
    const classId = classDoc.id;
    console.log('[joinClass] Found class:', classId);

    // Add user to class members
    console.log('[joinClass] Adding user to class members...');
    await updateDoc(doc(db, 'classes', classId), {
        memberIds: arrayUnion(userId)
    });
    console.log('[joinClass] User added to memberIds');

    // Update user profile with joined class (use setDoc with merge in case doc doesn't exist yet)
    console.log('[joinClass] Updating user profile with joinedClassId...');
    await setDoc(doc(db, 'users', userId), {
        joinedClassId: classId
    }, { merge: true });
    console.log('[joinClass] User profile updated. Join complete!');

    return classId;
}

// Leave a class (sign out of active session)
export async function leaveClass(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        joinedClassId: null // Or deleteField() if you import it, but null works for "not joined" check
    });
}

// Get class details
export async function getClass(classId: string): Promise<Class | null> {
    const docRef = doc(db, 'classes', classId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as Class;
    }

    return null;
}

// Get classes hosted by a user
export async function getHostedClasses(hostId: string): Promise<Class[]> {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('hostId', '==', hostId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as Class);
}

// Get members of a class
export async function getClassMembers(classId: string): Promise<UserProfile[]> {
    const classData = await getClass(classId);
    if (!classData || !classData.memberIds || classData.memberIds.length === 0) {
        return [];
    }

    const memberPromises = classData.memberIds.map(userId => getUserProfile(userId));
    const members = await Promise.all(memberPromises);

    return members.filter((member): member is UserProfile => member !== null);
}

// Update the current activity for a class

export async function updateClassActivity(classId: string, activity: Class['currentActivity']) {
    console.log('[updateClassActivity] Updating class:', classId, 'to activity:', JSON.stringify(activity));
    const docRef = doc(db, 'classes', classId);

    // Check if we need to log this as a new activity usage
    if (activity && activity.type !== 'none') {
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const currentData = docSnap.data() as Class;
                const currentAct = currentData.currentActivity;

                // Log only if the activity type or ID has changed
                if (!currentAct || currentAct.type !== activity.type || currentAct.id !== activity.id) {
                    logActivityUsage(activity.type, classId).catch(console.error);
                }
            }
        } catch (error) {
            console.error('Error checking class state for analytics:', error);
        }
    }

    await updateDoc(docRef, { currentActivity: activity });
    console.log('[updateClassActivity] Successfully updated activity to:', activity?.type || 'none');
}

// Get class by code (read-only)
export async function getClassByCode(code: string): Promise<Class | null> {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('code', '==', code.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    return querySnapshot.docs[0].data() as Class;
}

// Listen for class updates
export function onClassChange(classId: string, callback: (data: Class) => void): () => void {
    const docRef = doc(db, 'classes', classId);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as Class);
        }
    });
}

// Listen for hosted classes updates
export function onHostedClassesChange(hostId: string, callback: (classes: Class[]) => void): () => void {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('hostId', '==', hostId));
    return onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map(doc => doc.data() as Class);
        callback(classes);
    });
}
