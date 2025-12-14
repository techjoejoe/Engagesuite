import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';

export interface ParkingLotItem {
    id: string;
    classId: string;
    userId: string;
    userName: string;
    question: string;
    status: 'unanswered' | 'answered';
    createdAt: any;
    answer?: string;
    answeredAt?: any;
}

// Add a question to the Parking Lot
export const addParkingLotQuestion = async (classId: string, userId: string, userName: string, question: string) => {
    await addDoc(collection(db, 'parking_lot'), {
        classId,
        userId,
        userName,
        question,
        status: 'unanswered',
        createdAt: serverTimestamp(),
    });
};

// Mark a question as answered
export const markQuestionAnswered = async (questionId: string) => {
    const docRef = doc(db, 'parking_lot', questionId);
    await updateDoc(docRef, { status: 'answered' });
};

// Answer a question
export const answerQuestion = async (questionId: string, answer: string) => {
    const docRef = doc(db, 'parking_lot', questionId);
    await updateDoc(docRef, {
        status: 'answered',
        answer,
        answeredAt: serverTimestamp()
    });
};

// Delete a question
export const deleteQuestion = async (questionId: string) => {
    const docRef = doc(db, 'parking_lot', questionId);
    await deleteDoc(docRef);
};

// Listen to Parking Lot questions for a class
export const onParkingLotChange = (classId: string, callback: (questions: ParkingLotItem[]) => void) => {
    const q = query(
        collection(db, 'parking_lot'),
        where('classId', '==', classId)
    );
    return onSnapshot(q, (snapshot) => {
        const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingLotItem));
        // Sort client-side
        questions.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        callback(questions);
    }, (error) => {
        console.error("Error fetching parking lot:", error);
    });
};

// Listen for unanswered count (for Host Alert)
export const onUnansweredCountChange = (classId: string, callback: (count: number) => void) => {
    const q = query(
        collection(db, 'parking_lot'),
        where('classId', '==', classId),
        where('status', '==', 'unanswered')
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
    });
};
