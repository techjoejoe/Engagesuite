// Album and Workbook System Types

import { db } from './firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    runTransaction,
    increment
} from 'firebase/firestore';
import { UserProfile, addLifetimePoints } from './auth';

// --- Types ---

export type BlockType = 'text' | 'image' | 'video' | 'question' | 'separator' | 'header';

export type QuestionType = 'multiple_choice' | 'short_answer' | 'essay';

// Base block structure
export interface AlbumBlock {
    id: string;
    type: BlockType;
    content: string; // Text content, Image URL, or Question Prompt

    // For specific block types:
    mediaUrl?: string; // For images/videos
    questionType?: QuestionType; // For questions
    options?: string[]; // For multiple choice
    correctAnswerHash?: string; // Optional: Simple hashing for auto-grading MC

    // Engagement / Points
    points: number; // Points awarded for completing/answering this block
}

export interface AlbumPage {
    id: string;
    title: string;
    order: number;
    blocks: AlbumBlock[];
}

// 1. Master Template (Created by Designer)
export interface AlbumTemplate {
    id: string;
    title: string;
    description: string;
    coverImageUrl?: string;
    designerId: string;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
    pages: AlbumPage[];
    draftPages?: AlbumPage[]; // Working copy of pages
    completionPoints: number; // Bonus points for finishing the workbook
    totalPointsAvailable: number; // Sum of all block points + completionPoints
}

// 2. Class Assignment (Created by Trainer)
export interface ClassAlbum {
    id: string;
    templateId: string;
    classId: string;
    assignedByUserId: string;
    assignedAt: number;
    dueDate?: number;
    status: 'active' | 'archived';
    settings: {
        allowLateSubmissions: boolean;
        isGuided: boolean;
        showCorrectAnswersAfterSubmission: boolean;
    };
    // Snapshot of crucial template data to avoid broken links if template is deleted
    title: string;
    totalPointsAvailable: number;
}

// 3. Student Progress & Answers
export interface AlbumProgress {
    id: string;
    classAlbumId: string;
    studentId: string;
    classId: string; // Denormalized for easy querying

    status: 'not_started' | 'in_progress' | 'completed';
    percentComplete: number;
    currentPointsEarned: number;

    completedPageIds: string[];
    lastAccessedAt: number;

    answers: {
        [blockId: string]: {
            answer: string | number; // Student input
            submittedAt: number;
            isCorrect?: boolean; // If auto-graded
            awardedPoints: number; // Points given for this answer
            feedback?: string; // Trainer feedback
            needsGrading?: boolean; // True if requires manual grading
        }
    };
    completionBonusAwarded?: boolean;
}

// --- Functions ---

// 1. Create a new Album Template
export async function createAlbumTemplate(designerId: string, title: string): Promise<string> {
    const newTemplate: any = {
        title,
        description: '',
        designerId,
        isPublished: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pages: [], // Starts empty
        completionPoints: 0,
        totalPointsAvailable: 0
    };

    const docRef = await addDoc(collection(db, 'album_templates'), newTemplate);

    // Store ID in the doc as well for easier fetching mapping
    await updateDoc(docRef, { id: docRef.id });

    return docRef.id;
}

// 2. Fetch all published templates (Library)
export async function getPublishedAlbums(): Promise<AlbumTemplate[]> {
    const q = query(collection(db, 'album_templates'), where('isPublished', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AlbumTemplate);
}

// 3. Fetch designer's own templates
export async function getDesignerAlbums(designerId: string): Promise<AlbumTemplate[]> {
    const q = query(collection(db, 'album_templates'), where('designerId', '==', designerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AlbumTemplate);
}

// 4. Update Album Content (Designer)
export async function updateAlbumTemplate(templateId: string, updates: Partial<AlbumTemplate>) {
    const ref = doc(db, 'album_templates', templateId);

    // Recalculate total points if pages OR completionPoints changed
    if (updates.pages || typeof updates.completionPoints === 'number') {
        let total = 0;

        // Add block points (need pages)
        // If pages are not in update, we risk losing them in calculation if we don't fetch.
        // Assuming Editor ALWAYS sends pages if it saves.
        if (updates.pages) {
            updates.pages.forEach(p => {
                p.blocks.forEach(b => {
                    total += (b.points || 0);
                });
            });
        }

        // Add Completion Points
        // If explicitly updated, use it. If not, we can't guess easily without fetching.
        // But for our app usage, we likely send everything.
        if (typeof updates.completionPoints === 'number') {
            total += updates.completionPoints;
        }

        updates.totalPointsAvailable = total;
    }

    await updateDoc(ref, {
        ...updates,
        updatedAt: Date.now()
    });
}

// 5. Assign Album to Class (Trainer)
export async function assignAlbumToClass(
    templateId: string,
    classId: string,
    trainerId: string
): Promise<string> {
    // 1. Get Template Details
    const templateRef = doc(db, 'album_templates', templateId);
    const templateSnap = await getDoc(templateRef);
    if (!templateSnap.exists()) throw new Error("Template not found");
    const template = templateSnap.data() as AlbumTemplate;

    // 2. Create Assignment
    const assignment: any = {
        templateId,
        classId,
        assignedByUserId: trainerId,
        assignedAt: Date.now(),
        status: 'active',
        settings: {
            allowLateSubmissions: true,
            isGuided: false,
            showCorrectAnswersAfterSubmission: false
        },
        title: template.title,
        totalPointsAvailable: template.totalPointsAvailable
    };

    const docRef = await addDoc(collection(db, 'class_albums'), assignment);
    await updateDoc(docRef, { id: docRef.id });

    return docRef.id;
}

// 6. Submit Answer (Student)
// This handles saving the answer AND awarding points if auto-gradable
// 6. Submit Answer (Student)
// This handles saving the answer AND awarding points if auto-gradable
export async function submitAlbumAnswer(
    progressId: string,
    blockId: string,
    answer: string,
    pointsPossible: number,
    isCorrect: boolean
) {
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get current progress to calculate point delta
            const progressRef = doc(db, 'album_progress', progressId);
            const progressDoc = await transaction.get(progressRef);

            if (!progressDoc.exists()) throw "Progress doc invalid";
            const progressData = progressDoc.data() as AlbumProgress;

            const oldAnswerData = progressData.answers?.[blockId];
            const oldPoints = oldAnswerData?.awardedPoints || 0;
            const newPoints = isCorrect ? pointsPossible : 0;
            const pointDelta = newPoints - oldPoints; // e.g., 10 - 0 = +10, or 0 - 10 = -10

            // 2. Update AlbumProgress
            // Note: Using dot notation for nested map update
            transaction.update(progressRef, {
                [`answers.${blockId}`]: {
                    answer,
                    submittedAt: Date.now(),
                    isCorrect,
                    awardedPoints: newPoints
                },
                lastAccessedAt: Date.now(),
                // Update local aggregation of points earned in this album
                currentPointsEarned: increment(pointDelta)
            });

            // 3. If there is a point change, update Class Score and Lifetime Score concurrently
            // NOTE: Security Rules allow the student to update their own member doc and user doc.
            if (pointDelta !== 0) {
                const { classId, studentId } = progressData;

                // Refs
                const classMemberRef = doc(db, 'classes', classId, 'members', studentId);
                const userRef = doc(db, 'users', studentId);
                const historyRef = doc(collection(db, 'classes', classId, 'members', studentId, 'history'));

                // Read member doc to ensure existence (optional safety)
                // For efficiency, we assume member exists if they are playing the album

                // Update Class Score
                transaction.update(classMemberRef, {
                    score: increment(pointDelta)
                });

                // Update Lifetime Score
                transaction.set(userRef, {
                    lifetimePoints: increment(pointDelta),
                    lastActive: Date.now(),
                    gamesPlayed: increment(oldAnswerData ? 0 : 1) // Increment games played only on first answer? No, this is per game. Maybe only on finish? Let's strictly do points here.
                }, { merge: true });

                // Log History
                transaction.set(historyRef, {
                    timestamp: Date.now(),
                    points: pointDelta,
                    reason: `Album Answer: ${blockId}`,
                    adminId: null
                });
            }
        });
        console.log("Answer submitted and points synced.");
    } catch (e) {
        console.error("Transaction failed in submitAlbumAnswer:", e);
        throw e;
    }
}

export async function updateAlbumProgressStats(
    progressId: string,
    updates: {
        percentComplete?: number;
        currentPointsEarned?: number;
        completedPageIds?: string[];
        status?: 'in_progress' | 'completed';
    }
) {
    const progressRef = doc(db, 'album_progress', progressId);
    await updateDoc(progressRef, {
        ...updates,
        lastAccessedAt: Date.now()
    });
}

// 6b. Complete Workbook & Award Bonus
export async function completeWorkbook(progressId: string, templateId: string) {
    try {
        await runTransaction(db, async (transaction) => {
            const progressRef = doc(db, 'album_progress', progressId);
            const progressDoc = await transaction.get(progressRef);
            if (!progressDoc.exists()) throw "Progress doc not found";
            const progressData = progressDoc.data() as AlbumProgress;

            if (progressData.completionBonusAwarded) return; // Already awarded

            const templateRef = doc(db, 'album_templates', templateId);
            const templateDoc = await transaction.get(templateRef);
            if (!templateDoc.exists()) throw "Template doc not found";
            const templateData = templateDoc.data() as AlbumTemplate;

            const bonus = templateData.completionPoints || 0;

            if (bonus > 0) {
                const { classId, studentId } = progressData;
                const classMemberRef = doc(db, 'classes', classId, 'members', studentId);
                const userRef = doc(db, 'users', studentId);
                const historyRef = doc(collection(db, 'classes', classId, 'members', studentId, 'history'));

                transaction.update(classMemberRef, { score: increment(bonus) });
                transaction.set(userRef, { lifetimePoints: increment(bonus) }, { merge: true });
                transaction.set(historyRef, {
                    timestamp: Date.now(),
                    points: bonus,
                    reason: 'Workbook Completion Bonus',
                    adminId: null
                });
            }

            transaction.update(progressRef, {
                status: 'completed',
                percentComplete: 100,
                completionBonusAwarded: true,
                currentPointsEarned: increment(bonus),
                lastAccessedAt: Date.now()
            });
        });
    } catch (e) {
        console.error("Error completing workbook:", e);
    }
}

// 7. Get Student Assignments
export async function getStudentAssignments(classId: string): Promise<ClassAlbum[]> {
    const q = query(
        collection(db, 'class_albums'),
        where('classId', '==', classId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data() as ClassAlbum;
        // Use Firestore doc ID as fallback if 'id' field is missing
        return { ...data, id: data.id || d.id };
    });
}

// 7b. Listen for Student Assignments (Real-time)
import { onSnapshot } from 'firebase/firestore';

export function onStudentAssignmentsChange(classId: string, callback: (albums: ClassAlbum[]) => void): () => void {
    const q = query(
        collection(db, 'class_albums'),
        where('classId', '==', classId),
        where('status', '==', 'active')
    );
    return onSnapshot(q, (snap) => {
        const albums = snap.docs.map(d => {
            const data = d.data() as ClassAlbum;
            // Use Firestore doc ID as fallback if 'id' field is missing
            return { ...data, id: data.id || d.id };
        });
        callback(albums);
    });
}

// 11. Get All Progress for a Class Assessment (Gradebook)
export async function getAlbumProgressForClass(assignmentId: string): Promise<AlbumProgress[]> {
    const q = query(
        collection(db, 'album_progress'),
        where('classAlbumId', '==', assignmentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AlbumProgress);
}

// 8. Get Single Class Album Assignment
export async function getClassAlbum(id: string): Promise<ClassAlbum | null> {
    const ref = doc(db, 'class_albums', id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as ClassAlbum) : null;
}

// 9. Get Single Album Template
export async function getAlbumTemplate(id: string): Promise<AlbumTemplate | null> {
    const ref = doc(db, 'album_templates', id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as AlbumTemplate) : null;
}

// 10. Get or Init Student Progress
export async function getOrCreateAlbumProgress(
    classAlbumId: string,
    classId: string,
    studentId: string
): Promise<AlbumProgress> {
    // Check if exists
    const q = query(
        collection(db, 'album_progress'),
        where('classAlbumId', '==', classAlbumId),
        where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
        return snap.docs[0].data() as AlbumProgress;
    }

    // Create new
    const newProgress: any = {
        classAlbumId,
        classId,
        studentId,
        status: 'not_started',
        percentComplete: 0,
        currentPointsEarned: 0,
        completedPageIds: [],
        lastAccessedAt: Date.now(),
        answers: {}
    };

    const docRef = await addDoc(collection(db, 'album_progress'), newProgress);
    await updateDoc(docRef, { id: docRef.id });

    return { ...newProgress, id: docRef.id };
}

// Unassign workbook from class (Trainer)
// This archives the assignment and optionally deletes student progress
export async function unassignWorkbook(
    assignmentId: string,
    deleteProgress: boolean = false
): Promise<void> {
    const { deleteDoc } = await import('firebase/firestore');

    // 1. Get the assignment
    const assignmentRef = doc(db, 'class_albums', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);

    if (!assignmentSnap.exists()) {
        throw new Error('Assignment not found');
    }

    // 2. Delete the assignment
    await deleteDoc(assignmentRef);

    // 3. Optionally delete all related student progress
    if (deleteProgress) {
        const progressQuery = query(
            collection(db, 'album_progress'),
            where('classAlbumId', '==', assignmentId)
        );
        const progressSnap = await getDocs(progressQuery);

        // Delete each progress document
        const deletePromises = progressSnap.docs.map(docSnap =>
            deleteDoc(doc(db, 'album_progress', docSnap.id))
        );
        await Promise.all(deletePromises);
    }
}

