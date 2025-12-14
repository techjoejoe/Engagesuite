import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export interface ClassMember {
    userId: string;
    classId: string;
    nickname: string;
    score: number; // Points in this class
    joinedAt: number;
}

export interface PointHistory {
    id?: string;
    timestamp: number;
    points: number;
    reason: string;
    adminId?: string;
}

// Ensure user is registered as a member of the class
export async function joinClassMember(classId: string, userId: string, nickname: string) {
    const memberRef = doc(db, 'classes', classId, 'members', userId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
        await setDoc(memberRef, {
            userId,
            classId,
            nickname,
            score: 0,
            joinedAt: Date.now()
        });
    }
}

// Award points to a user (Updates Class Score + Lifetime Score)
export async function awardPoints(classId: string, userId: string, points: number, reason: string = 'Activity') {
    if (points <= 0) return;

    console.log(`[awardPoints] Starting: classId=${classId}, userId=${userId}, points=${points}`);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Ref for Class Member
            const memberRef = doc(db, 'classes', classId, 'members', userId);

            // 2. Ref for User Profile (Lifetime)
            const userRef = doc(db, 'users', userId);

            // 3. Ref for History
            const historyRef = doc(collection(db, 'classes', classId, 'members', userId, 'history'));

            // 4. Read (optional, but good for verification)
            const memberDoc = await transaction.get(memberRef);
            if (!memberDoc.exists()) {
                console.log(`[awardPoints] Creating new member document for ${userId}`);
                transaction.set(memberRef, {
                    userId,
                    classId,
                    nickname: 'Student', // Fallback
                    score: points,
                    joinedAt: Date.now()
                });
            } else {
                // 5. Update Class Score
                transaction.update(memberRef, {
                    score: increment(points)
                });
            }

            // 6. Update Lifetime Score
            transaction.set(userRef, {
                lifetimePoints: increment(points),
                lastActive: Date.now()
            }, { merge: true });

            // 7. Record History
            transaction.set(historyRef, {
                timestamp: Date.now(),
                points: points,
                reason: reason
            });
        });
        console.log(`[awardPoints] SUCCESS: Awarded ${points} points to ${userId}`);
    } catch (e) {
        console.error("[awardPoints] ERROR:", e);
    }
}

// Get Leaderboard for the Class
export async function getClassLeaderboard(classId: string, limitCount: number = 10) {
    const membersRef = collection(db, 'classes', classId, 'members');
    const q = query(membersRef, orderBy('score', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ClassMember);
}

// Get a specific member's stats
export async function getClassMember(classId: string, userId: string): Promise<ClassMember | null> {
    const memberRef = doc(db, 'classes', classId, 'members', userId);
    const snap = await getDoc(memberRef);
    if (snap.exists()) return snap.data() as ClassMember;
    return null;
}

// Remove a student from class (Host control)
export async function removeStudentFromClass(classId: string, userId: string): Promise<void> {
    const memberRef = doc(db, 'classes', classId, 'members', userId);
    await setDoc(memberRef, { score: 0 }, { merge: true });

    // Also clear their joinedClassId from user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { joinedClassId: null });
}

// Manually adjust student points (can be positive or negative)
export async function adjustStudentPoints(classId: string, userId: string, pointsChange: number, adminId?: string, reason: string = 'Manual Adjustment'): Promise<void> {
    if (pointsChange === 0) return;

    try {
        await runTransaction(db, async (transaction) => {
            const memberRef = doc(db, 'classes', classId, 'members', userId);
            const userRef = doc(db, 'users', userId);
            const historyRef = doc(collection(db, 'classes', classId, 'members', userId, 'history'));

            const memberDoc = await transaction.get(memberRef);

            if (!memberDoc.exists()) {
                throw new Error('Student not found in class');
            }

            // Update class score
            transaction.update(memberRef, {
                score: increment(pointsChange)
            });

            // Update lifetime score
            transaction.set(userRef, {
                lifetimePoints: increment(pointsChange),
                lastActive: Date.now()
            }, { merge: true });

            // Record History
            transaction.set(historyRef, {
                timestamp: Date.now(),
                points: pointsChange,
                reason: reason,
                adminId: adminId || null
            });
        });
        console.log(`Adjusted ${pointsChange} points for ${userId}`);
    } catch (e) {
        console.error("Error adjusting points:", e);
        throw e;
    }
}

// Update ONLY user lifetime points
export async function updateUserPoints(userId: string, points: number) {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        lifetimePoints: increment(points),
        lastActive: Date.now()
    }, { merge: true });
}

// Update ONLY class member score
export async function updateClassMemberScore(classId: string, userId: string, points: number) {
    const memberRef = doc(db, 'classes', classId, 'members', userId);
    await updateDoc(memberRef, {
        score: increment(points)
    });
}

// Bulk adjust points for all students in a class
import { writeBatch } from 'firebase/firestore';

export async function bulkAdjustClassPoints(classId: string, pointsChange: number, adminId?: string): Promise<void> {
    if (pointsChange === 0) return;

    try {
        const membersRef = collection(db, 'classes', classId, 'members');
        const snapshot = await getDocs(membersRef);

        if (snapshot.empty) return;

        const batch = writeBatch(db);

        snapshot.docs.forEach((docSnap) => {
            const userId = docSnap.id;
            const memberRef = doc(db, 'classes', classId, 'members', userId);
            const userRef = doc(db, 'users', userId);
            const historyRef = doc(collection(db, 'classes', classId, 'members', userId, 'history'));

            // Update class score
            batch.update(memberRef, {
                score: increment(pointsChange)
            });

            // Update lifetime score (using set merge for safety)
            batch.set(userRef, {
                lifetimePoints: increment(pointsChange),
                lastActive: Date.now()
            }, { merge: true });

            // Record History
            batch.set(historyRef, {
                timestamp: Date.now(),
                points: pointsChange,
                reason: 'Bulk Adjustment',
                adminId: adminId || null
            });
        });

        await batch.commit();
        console.log(`Bulk adjusted ${pointsChange} points for ${snapshot.size} students`);
    } catch (e) {
        console.error("Error bulk adjusting points:", e);
        throw e;
    }
}

// Fetch history for a student
export async function getStudentHistory(classId: string, userId: string): Promise<PointHistory[]> {
    const historyRef = collection(db, 'classes', classId, 'members', userId, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PointHistory));
}
