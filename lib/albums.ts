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
    serverTimestamp
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
    totalPointsAvailable: number; // Sum of all block points
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
        }
    };
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

    // Recalculate total points if pages changed
    if (updates.pages) {
        let total = 0;
        updates.pages.forEach(p => {
            p.blocks.forEach(b => {
                total += (b.points || 0);
            });
        });
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
export async function submitAlbumAnswer(
    progressId: string,
    blockId: string,
    answer: string,
    pointsPossible: number,
    isCorrect: boolean // passed from frontend logic or backend verification
) {
    const progressRef = doc(db, 'album_progress', progressId);

    const pointsToAward = isCorrect ? pointsPossible : 0;

    // Update the Map inside Firestore
    // Note: Firestore maps update syntax is `field.key`
    await updateDoc(progressRef, {
        [`answers.${blockId}`]: {
            answer,
            submittedAt: Date.now(),
            isCorrect,
            awardedPoints: pointsToAward
        },
        lastAccessedAt: Date.now()
    });

    // We ideally should aggregate points here or trigger a Cloud Function
    // For now, we rely on a separate specific "Recalculate" call or Cloud Function
    // to update `currentPointsEarned`.
}

// 7. Get Student Assignments
export async function getStudentAssignments(classId: string): Promise<ClassAlbum[]> {
    const q = query(
        collection(db, 'class_albums'),
        where('classId', '==', classId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ClassAlbum);
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
