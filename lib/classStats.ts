import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Get count of students currently logged into a class
 * Students are considered active if they have joinedClassId set to this class
 */
export async function getActiveStudentCount(classId: string): Promise<number> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('joinedClassId', '==', classId));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting active student count:', error);
        return 0;
    }
}

/**
 * Get both total and active student counts for a class
 */
export async function getClassStudentCounts(classId: string, totalMembers: number): Promise<{
    total: number;
    active: number;
}> {
    const active = await getActiveStudentCount(classId);
    return { total: totalMembers, active };
}
