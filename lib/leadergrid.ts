import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, runTransaction, increment, arrayUnion, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { updateUserPoints, updateClassMemberScore } from './scoring';

export interface LeaderGridCode {
    id: string;
    code: string;
    name: string;
    description: string;
    hostId: string;
    classId: string | null; // null for universal codes
    points: number;
    maxScans: number | null; // null for unlimited
    expiresAt: any | null; // Timestamp or null
    currentScans: number;
    redeemedBy: string[]; // Array of user IDs
    createdAt: any;
}

const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Create a new Leader Grid Code
export const createLeaderGridCode = async (
    hostId: string,
    classId: string | null,
    name: string,
    description: string,
    points: number,
    maxScans: number | null,
    expiresAt: Date | null = null
) => {
    const code = generateCode();
    console.log('Creating Leader Grid Code:', { code, hostId, classId, name, description, points, maxScans, expiresAt });

    try {
        const docRef = await addDoc(collection(db, 'leader_grid_codes'), {
            code,
            name,
            description,
            hostId,
            classId,
            points,
            maxScans,
            expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
            currentScans: 0,
            redeemedBy: [],
            createdAt: serverTimestamp(),
        });
        console.log('Leader Grid Code created with ID:', docRef.id);
        return code;
    } catch (error) {
        console.error('Error creating Leader Grid Code:', error);
        throw error;
    }
};

// Get codes for a host (and specific class)
export const getLeaderGridCodes = async (hostId: string, classId: string) => {
    console.log('Fetching Leader Grid Codes for:', { hostId, classId });
    try {
        const codesRef = collection(db, 'leader_grid_codes');

        // Query 1: Class-specific codes
        const q1 = query(
            codesRef,
            where('hostId', '==', hostId),
            where('classId', '==', classId),
            orderBy('createdAt', 'desc')
        );

        // Query 2: Universal codes (classId is null)
        const q2 = query(
            codesRef,
            where('hostId', '==', hostId),
            where('classId', '==', null),
            orderBy('createdAt', 'desc')
        );

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        console.log('Query 1 results:', snap1.size);
        console.log('Query 2 results:', snap2.size);

        const codes1 = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderGridCode));
        const codes2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderGridCode));

        return [...codes1, ...codes2];
    } catch (error) {
        console.error('Error fetching Leader Grid Codes:', error);
        // Fallback: Try fetching without ordering if index is still building
        try {
            console.warn('Retrying fetch without ordering...');
            const codesRef = collection(db, 'leader_grid_codes');
            const q1 = query(codesRef, where('hostId', '==', hostId), where('classId', '==', classId));
            const q2 = query(codesRef, where('hostId', '==', hostId), where('classId', '==', null));

            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            const codes1 = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderGridCode));
            const codes2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderGridCode));
            return [...codes1, ...codes2];
        } catch (retryError) {
            console.error('Retry failed:', retryError);
            return [];
        }
    }
};

// Delete a code
export const deleteLeaderGridCode = async (codeId: string) => {
    try {
        await deleteDoc(doc(db, 'leader_grid_codes', codeId));
    } catch (error) {
        console.error('Error deleting Leader Grid Code:', error);
        throw error;
    }
};

// Redeem a code
// Redeem a code
export const redeemLeaderGridCode = async (userId: string, codeStr: string, currentClassId?: string) => {
    // 1. Find the code document
    const q = query(collection(db, 'leader_grid_codes'), where('code', '==', codeStr));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return { success: false, message: 'Invalid code.' };
    }

    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data() as LeaderGridCode;
    const codeId = codeDoc.id;

    // Check expiration
    if (codeData.expiresAt) {
        const now = new Date();
        const expires = codeData.expiresAt.toDate();
        if (now > expires) {
            return { success: false, message: 'This code has expired.' };
        }
    }

    // 2. Check cooldown (3 minutes)
    const redemptionRef = doc(db, 'leader_grid_codes', codeId, 'redemptions', userId);
    const redemptionSnap = await getDoc(redemptionRef);

    if (redemptionSnap.exists()) {
        const lastRedeemed = redemptionSnap.data().timestamp?.toDate();
        if (lastRedeemed) {
            const now = new Date();
            const diff = now.getTime() - lastRedeemed.getTime();
            const cooldown = 3 * 60 * 1000; // 3 minutes

            if (diff < cooldown) {
                const remaining = Math.ceil((cooldown - diff) / 1000);
                return { success: false, message: 'This QR code has been scanned already.' };
            }
        }
    }

    // 3. Check max scans (global)
    if (codeData.maxScans !== null && codeData.currentScans >= codeData.maxScans) {
        return { success: false, message: 'This code has reached its maximum number of scans.' };
    }

    // 4. Award points and update code stats
    try {
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(doc(db, 'leader_grid_codes', codeId));
            if (!sfDoc.exists()) {
                throw "Document does not exist!";
            }

            const newCurrentScans = sfDoc.data().currentScans + 1;
            if (codeData.maxScans !== null && newCurrentScans > codeData.maxScans) {
                throw "Max scans reached during transaction";
            }

            // Update parent doc
            transaction.update(doc(db, 'leader_grid_codes', codeId), {
                currentScans: increment(1)
            });

            // Update redemption timestamp
            transaction.set(redemptionRef, {
                timestamp: serverTimestamp(),
                userId
            });

            // Create user-side redemption record for history
            const userRedemptionRef = doc(db, 'users', userId, 'redemptions', codeId);
            transaction.set(userRedemptionRef, {
                codeId,
                codeName: codeData.name,
                points: codeData.points,
                timestamp: serverTimestamp(),
                classId: codeData.classId || currentClassId || null
            });

            // 5. Add to Class Point History (Audit Log)
            const targetClassId = codeData.classId || currentClassId;
            if (targetClassId) {
                const historyRef = doc(collection(db, 'classes', targetClassId, 'members', userId, 'history'));
                transaction.set(historyRef, {
                    timestamp: Date.now(),
                    points: codeData.points,
                    reason: `QR Code: ${codeData.name}`,
                    adminId: null
                });
            }
        });

        // Award points to user
        await updateUserPoints(userId, codeData.points);

        // If class-specific, update class score
        if (codeData.classId) {
            await updateClassMemberScore(codeData.classId, userId, codeData.points);
        } else if (currentClassId) {
            await updateClassMemberScore(currentClassId, userId, codeData.points);
        }

        return { success: true, points: codeData.points, message: `Successfully redeemed ${codeData.points} points!` };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, message: 'Redemption failed. Please try again.' };
    }
};

// Get user redemption history
export const getUserRedemptionHistory = async (userId: string) => {
    try {
        const q = query(collection(db, 'users', userId, 'redemptions'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
        }));
    } catch (error) {
        console.error('Error fetching redemption history:', error);
        return [];
    }
};
