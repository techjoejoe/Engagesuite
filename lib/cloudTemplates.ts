// Cloud Template Management (Firestore)
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Question } from '@/types';

export interface CloudTemplate {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
    createdBy: string; // User UID
    createdByName: string;
    createdAt: number;
    lastUsed?: number;
    timesUsed: number;
    isPublic: boolean;
    category?: string;
    tags?: string[];
}

// Save template to Firestore
export async function saveCloudTemplate(
    userId: string,
    userName: string,
    title: string,
    questions: Question[],
    isPublic: boolean = false,
    description?: string,
    category?: string,
    tags?: string[]
): Promise<string> {
    const template: Omit<CloudTemplate, 'id'> = {
        title,
        description,
        questions,
        createdBy: userId,
        createdByName: userName,
        createdAt: Date.now(),
        timesUsed: 0,
        isPublic,
        category,
        tags,
    };

    const docRef = await addDoc(collection(db, 'templates'), template);
    return docRef.id;
}

// Get user's templates
export async function getUserTemplates(userId: string): Promise<CloudTemplate[]> {
    const templatesRef = collection(db, 'templates');
    const q = query(
        templatesRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as CloudTemplate));
}

// Get public templates
export async function getPublicTemplates(limit: number = 50): Promise<CloudTemplate[]> {
    const templatesRef = collection(db, 'templates');
    const q = query(
        templatesRef,
        where('isPublic', '==', true),
        orderBy('timesUsed', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as CloudTemplate));

    return templates.slice(0, limit);
}

// Get template by ID
export async function getCloudTemplate(templateId: string): Promise<CloudTemplate | null> {
    const docRef = doc(db, 'templates', templateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data()
        } as CloudTemplate;
    }

    return null;
}

// Delete template
export async function deleteCloudTemplate(templateId: string, userId: string): Promise<void> {
    const template = await getCloudTemplate(templateId);

    if (!template || template.createdBy !== userId) {
        throw new Error('Unauthorized or template not found');
    }

    await deleteDoc(doc(db, 'templates', templateId));
}

// Update template
export async function updateCloudTemplate(
    templateId: string,
    userId: string,
    updates: Partial<Omit<CloudTemplate, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
    const template = await getCloudTemplate(templateId);

    if (!template || template.createdBy !== userId) {
        throw new Error('Unauthorized or template not found');
    }

    const templateRef = doc(db, 'templates', templateId);
    await updateDoc(templateRef, updates);
}

// Mark template as used
export async function markCloudTemplateAsUsed(templateId: string): Promise<void> {
    const templateRef = doc(db, 'templates', templateId);
    await updateDoc(templateRef, {
        lastUsed: Date.now(),
        timesUsed: increment(1),
    });
}

// Search templates
export async function searchPublicTemplates(searchTerm: string): Promise<CloudTemplate[]> {
    const templates = await getPublicTemplates(100);

    const lowerSearch = searchTerm.toLowerCase();
    return templates.filter(t =>
        t.title.toLowerCase().includes(lowerSearch) ||
        t.description?.toLowerCase().includes(lowerSearch) ||
        t.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
    );
}

// Helper to import increment
import { increment } from 'firebase/firestore';
