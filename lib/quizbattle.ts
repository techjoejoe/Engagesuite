import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    Timestamp,
    setDoc,
    getDocs,
    runTransaction
} from 'firebase/firestore';
import { awardPoints } from './scoring';

// ========== TYPE DEFINITIONS ==========

export interface Answer {
    id: string;
    text: string;
}

export interface Question {
    id: string;
    text: string;
    type: 'multiple-choice';
    timeLimit: number; // seconds
    points: number;
    answers: Answer[];
    correctAnswerIndex: number;
    mediaUrl?: string;
    notes?: string;
}

export interface QuizSettings {
    timePerQuestion: number;
    showAnswersImmediately: boolean;
    pointsPerQuestion: number;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    classId: string;
    createdBy: string;
    createdAt: any;
    questions: Question[];
    settings: QuizSettings;
}

export interface Player {
    nickname: string;
    score: number;
    joinedAt: any;
}

export interface Game {
    id: string;
    quizId: string;
    classId: string;
    hostId: string;
    status: 'lobby' | 'playing' | 'finished';
    currentQuestionIndex: number;
    questionStartTime: any;
    createdAt: any;
    players: { [userId: string]: Player };
    phase?: 'question' | 'reveal';
}

export interface Response {
    id: string;
    userId: string;
    questionIndex: number;
    answerIndex: number;
    timeToAnswer: number; // milliseconds
    correct: boolean;
    pointsEarned: number;
    timestamp: any;
}

// ========== QUIZ MANAGEMENT ==========

export const createQuiz = async (data: Omit<Quiz, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'quizzes'), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getQuiz = async (id: string): Promise<Quiz | null> => {
    const docRef = doc(db, 'quizzes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Quiz;
    }
    return null;
};

export const updateQuiz = async (id: string, data: Partial<Quiz>) => {
    const docRef = doc(db, 'quizzes', id);
    await updateDoc(docRef, data);
};

export const deleteQuiz = async (id: string) => {
    const docRef = doc(db, 'quizzes', id);
    await deleteDoc(docRef);
};

export const cloneQuiz = async (id: string, userId: string) => {
    const quiz = await getQuiz(id);
    if (!quiz) throw new Error('Quiz not found');

    const { id: _, createdAt, ...quizData } = quiz;
    const newQuiz = {
        ...quizData,
        title: `${quizData.title} (Copy)`,
        createdBy: userId,
        createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'quizzes'), newQuiz);
    return docRef.id;
};

export const getQuizzesByClass = async (classId: string): Promise<Quiz[]> => {
    const q = query(collection(db, 'quizzes'), where('classId', '==', classId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
};

export const getQuizzesByUser = async (userId: string): Promise<Quiz[]> => {
    const q = query(collection(db, 'quizzes'), where('createdBy', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
};

// ========== GAME MANAGEMENT ==========

export const createGame = async (quizId: string, classId: string, hostId: string) => {
    const docRef = await addDoc(collection(db, 'games'), {
        quizId,
        classId,
        hostId,
        status: 'lobby',
        currentQuestionIndex: -1,
        questionStartTime: null,
        phase: 'question',
        createdAt: serverTimestamp(),
        players: {}
    });
    return docRef.id;
};

export const getGame = async (id: string): Promise<Game | null> => {
    const docRef = doc(db, 'games', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Game;
    }
    return null;
};

export const updateGame = async (id: string, data: Partial<Game>) => {
    const docRef = doc(db, 'games', id);
    await updateDoc(docRef, data);
};

export const startGame = async (id: string) => {
    await updateGame(id, {
        status: 'playing',
        currentQuestionIndex: -1, // -1 indicates countdown phase
        questionStartTime: serverTimestamp(),
        phase: 'question'
    });
};

export const nextQuestion = async (id: string, currentIndex: number) => {
    await updateGame(id, {
        currentQuestionIndex: currentIndex + 1,
        questionStartTime: serverTimestamp(),
        phase: 'question'
    });
};

export const revealAnswer = async (id: string) => {
    await updateGame(id, {
        phase: 'reveal',
        questionStartTime: null // Stop timer
    });
};

export const endGame = async (id: string) => {
    await updateGame(id, {
        status: 'finished',
        questionStartTime: null
    });
};

// ========== PLAYER MANAGEMENT ==========

export const joinGame = async (gameId: string, userId: string, nickname: string) => {
    const docRef = doc(db, 'games', gameId);
    await updateDoc(docRef, {
        [`players.${userId}`]: {
            nickname,
            score: 0,
            joinedAt: serverTimestamp()
        }
    });
};

export const updatePlayerScore = async (gameId: string, userId: string, newScore: number) => {
    const docRef = doc(db, 'games', gameId);
    await updateDoc(docRef, {
        [`players.${userId}.score`]: newScore
    });
};

// ========== RESPONSE MANAGEMENT ==========

export const submitAnswer = async (
    gameId: string,
    userId: string,
    questionIndex: number,
    answerIndex: number,
    timeToAnswer: number,
    correct: boolean,
    pointsEarned: number,
    classId?: string
) => {
    console.log('[submitAnswer] Called with:', { gameId, userId, questionIndex, correct, pointsEarned, classId });

    const responseId = `${userId}-${questionIndex}`;
    const docRef = doc(db, 'games', gameId, 'responses', responseId);

    let shouldAwardPoints = false;

    try {
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (docSnap.exists()) {
                console.log('[submitAnswer] Answer already submitted, ignoring');
                // Already answered, ignore
                return;
            }

            transaction.set(docRef, {
                userId,
                questionIndex,
                answerIndex,
                timeToAnswer,
                correct,
                pointsEarned,
                timestamp: serverTimestamp()
            });

            shouldAwardPoints = true;
            console.log('[submitAnswer] Set shouldAwardPoints = true');
        });
    } catch (error) {
        console.error('[submitAnswer] Transaction error:', error);
        return;
    }

    console.log('[submitAnswer] After transaction, shouldAwardPoints:', shouldAwardPoints, 'correct:', correct, 'pointsEarned:', pointsEarned);

    // Award persistent points only if this was a new submission
    if (shouldAwardPoints && correct && pointsEarned > 0) {
        try {
            let targetClassId = classId;

            // If classId not provided, fetch from game
            if (!targetClassId) {
                console.log('[submitAnswer] ClassId not provided, fetching from game');
                const gameRef = doc(db, 'games', gameId);
                const gameSnap = await getDoc(gameRef);
                if (gameSnap.exists()) {
                    targetClassId = gameSnap.data().classId;
                    console.log('[submitAnswer] Fetched classId:', targetClassId);
                }
            } else {
                console.log('[submitAnswer] Using provided classId:', targetClassId);
            }

            if (targetClassId) {
                console.log('[submitAnswer] CALLING awardPoints with:', { targetClassId, userId, pointsEarned });
                await awardPoints(targetClassId, userId, pointsEarned);
                console.log('[submitAnswer] awardPoints completed successfully');
            } else {
                console.error('[submitAnswer] NO classId available, cannot award points!');
            }
        } catch (err) {
            console.error('[submitAnswer] Failed to award persistent points:', err);
        }
    } else {
        console.log('[submitAnswer] NOT awarding points. shouldAwardPoints:', shouldAwardPoints, 'correct:', correct, 'pointsEarned:', pointsEarned);
    }
};

export const getResponses = async (gameId: string, questionIndex: number): Promise<Response[]> => {
    const q = query(
        collection(db, 'games', gameId, 'responses'),
        where('questionIndex', '==', questionIndex)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
};

// ========== SCORING ALGORITHM ==========

export const calculateScore = (
    timeToAnswer: number, // milliseconds
    timeLimit: number, // seconds
    maxPoints: number = 1000
): number => {
    const timeLimitMs = timeLimit * 1000;

    // Speed bonus: Linear decrease from max points at 0ms to 50% at time limit
    const timeRatio = Math.min(timeToAnswer / timeLimitMs, 1);
    const speedBonus = maxPoints * (1 - (timeRatio * 0.5));

    return Math.round(speedBonus);
};

// ========== REAL-TIME LISTENERS ==========

export const onGameChange = (id: string, callback: (game: Game) => void) => {
    const docRef = doc(db, 'games', id);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as Game);
        }
    });
};

export const onResponsesChange = (gameId: string, questionIndex: number, callback: (responses: Response[]) => void) => {
    const q = query(
        collection(db, 'games', gameId, 'responses'),
        where('questionIndex', '==', questionIndex)
    );
    return onSnapshot(q, (snapshot) => {
        const responses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
        callback(responses);
    });
};

// ========== HELPER FUNCTIONS ==========

export const generateGamePin = (): string => {
    // Generate a 6-digit PIN
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getLeaderboard = (players: { [userId: string]: Player }): Array<{ userId: string; player: Player }> => {
    return Object.entries(players)
        .map(([userId, player]) => ({ userId, player }))
        .sort((a, b) => b.player.score - a.player.score);
};
