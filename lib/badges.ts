import { db, storage } from './firebase';
import { collection, addDoc, doc, updateDoc, getDocs, query, where, getDoc, arrayUnion, serverTimestamp, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Badge {
    id: string;
    hostId: string;
    name: string;
    description: string;
    imageUrl: string;
    createdAt: any;
    deleted?: boolean;
}

export interface BadgeAssignment {
    badgeId: string;
    awardedAt: any; // timestamp
    awardedBy: string; // hostId
}

export interface UserBadgeEnriched {
    assignment: BadgeAssignment;
    details: Badge | null;
}

// --- Badge Management ---

export const createBadge = async (hostId: string, name: string, description: string, imageBlob: Blob): Promise<string> => {
    // 1. Upload Image
    const fileName = `badges/${hostId}/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, imageBlob);
    const imageUrl = await getDownloadURL(storageRef);

    // 2. Create Badge Doc
    const badgesRef = collection(db, 'badges');
    const docRef = await addDoc(badgesRef, {
        hostId,
        name,
        description,
        imageUrl,
        createdAt: serverTimestamp(),
        deleted: false
    });

    return docRef.id;
};

export const getHostBadges = async (hostId: string): Promise<Badge[]> => {
    const q = query(collection(db, 'badges'), where('hostId', '==', hostId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Badge))
        .filter(badge => badge.deleted !== true);
};

export const updateBadge = async (badgeId: string, data: Partial<Badge>) => {
    const docRef = doc(db, 'badges', badgeId);
    await updateDoc(docRef, data);
};

export const softDeleteBadge = async (badgeId: string) => {
    const docRef = doc(db, 'badges', badgeId);
    await updateDoc(docRef, { deleted: true });
};

export const getBadge = async (badgeId: string): Promise<Badge | null> => {
    const docRef = doc(db, 'badges', badgeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Badge;
    }
    return null;
};

// --- Badge Awarding ---

export const awardBadge = async (userId: string, badgeId: string, hostId: string) => {
    const userRef = doc(db, 'users', userId);
    const assignment: BadgeAssignment = {
        badgeId,
        awardedAt: Date.now(), // Store as number for simpler array storage usually, or firestore timestamp? Using number/Date.now() for array objects is safer/easier to serialize
        awardedBy: hostId
    };

    await updateDoc(userRef, {
        badges: arrayUnion(assignment)
    });
};

export const getUserBadges = async (userId: string): Promise<UserBadgeEnriched[]> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return [];

    const userData = userSnap.data();
    const assignments: BadgeAssignment[] = userData.badges || [];

    // Fetch details for all badges
    // Optimized: In real app, might want to cache badge details or store minified badge info in user doc.
    // For now, we'll fetch individually.

    const enriched = await Promise.all(assignments.map(async (assignment) => {
        const details = await getBadge(assignment.badgeId);
        return { assignment, details };
    }));

    return enriched;
};

export const onBadgeEarned = (userId: string, callback: (badge: Badge) => void) => {
    const userRef = doc(db, 'users', userId);
    // We use a ref to track length locally within the closure
    // However, if we mount/unmount, we might miss or re-trigger if not careful.
    // For this simple implementation, we assume we only want to celebrate badges earned *while the session is active*.
    // So we ignore everything already there on the initial load.

    let isInitialLoad = true;
    let knownBadgeCount = 0;

    return onSnapshot(userRef, async (docSnap: DocumentSnapshot) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const currentBadges = data.badges || [];

        if (isInitialLoad) {
            knownBadgeCount = currentBadges.length;
            isInitialLoad = false;
            return;
        }

        if (currentBadges.length > knownBadgeCount) {
            // New badges found!
            const newCount = currentBadges.length;
            const newBadges: BadgeAssignment[] = currentBadges.slice(knownBadgeCount);

            // Update count immediately to prevent double firing if async takes time
            knownBadgeCount = newCount;

            // Fetch and callback for each
            for (const assignment of newBadges) {
                const badgeDetails = await getBadge(assignment.badgeId);
                if (badgeDetails) {
                    callback(badgeDetails);
                }
            }
        }
    });
};
