import { db } from './firebase';
import { collection, doc, addDoc, getDoc, setDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';

export interface PollOption {
    id: string;
    text: string;
    color: string;
}

export interface Poll {
    id: string;
    classId: string;
    hostId: string;
    question: string;
    options: PollOption[];
    status: 'active' | 'closed';
    createdAt: any;
    showResults: boolean; // Toggle to hide/show results to students
}

export interface Vote {
    id: string; // userId
    optionId: string;
    createdAt: any;
}

// Create a new Poll
export const createPoll = async (classId: string, hostId: string, question: string, options: PollOption[]) => {
    try {
        console.log('createPoll called with:', { classId, hostId, question, optionsCount: options.length });
        const docRef = await addDoc(collection(db, 'polls'), {
            classId,
            hostId,
            question,
            options,
            status: 'active',
            showResults: false,
            createdAt: serverTimestamp(),
        });
        console.log('Poll document created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error in createPoll:', error);
        throw error;
    }
};

// Get a Poll by ID
export const getPoll = async (id: string) => {
    const docRef = doc(db, 'polls', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Poll;
    }
    return null;
};

// Listen to Poll Metadata (Question, Status, etc.)
export const onPollChange = (pollId: string, callback: (poll: Poll | null) => void) => {
    const docRef = doc(db, 'polls', pollId);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as Poll);
        } else {
            callback(null);
        }
    });
};

// Cast a Vote
export const votePoll = async (pollId: string, userId: string, optionId: string) => {
    const voteRef = doc(db, 'polls', pollId, 'votes', userId);
    await setDoc(voteRef, {
        optionId,
        createdAt: serverTimestamp(),
    });
};

// Listen to Votes (Host)
export const onVotesChange = (pollId: string, callback: (votes: Vote[]) => void) => {
    const q = query(collection(db, 'polls', pollId, 'votes'));
    return onSnapshot(q, (snapshot) => {
        const votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
        callback(votes);
    });
};

// Toggle Results Visibility
export const togglePollResults = async (pollId: string, show: boolean) => {
    const docRef = doc(db, 'polls', pollId);
    await updateDoc(docRef, { showResults: show });
};

// Close/Open Poll
export const updatePollStatus = async (pollId: string, status: 'active' | 'closed') => {
    const docRef = doc(db, 'polls', pollId);
    await updateDoc(docRef, { status });
};
