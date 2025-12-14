// Game State Management
import { ref, set, get, update, onValue, off } from 'firebase/database';
import { realtimeDb } from './firebase';
import { GameState, Player, Question, Answer, GameSettings, GameType, LeaderboardEntry } from '@/types';

// Generate a random room code
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create a new game room
export async function createGame(
    hostId: string,
    title: string,
    type: GameType,
    questions: Question[]
): Promise<string> {
    const roomCode = generateRoomCode();

    const gameState: GameState = {
        roomCode,
        status: 'lobby',
        currentQuestionIndex: -1,
        questionStartedAt: null,
        settings: {
            roomCode,
            title,
            hostId,
            type,
            showLeaderboardBetweenQuestions: true,
            autoAdvance: false,
            autoAdvanceDelay: 5,
        },
        questions,
        players: {},
        answers: {},
        createdAt: Date.now(),
        startedAt: null,
    };

    const gameRef = ref(realtimeDb, `games/${roomCode}`);
    await set(gameRef, gameState);

    return roomCode;
}

// Add a player to a game
export async function joinGame(roomCode: string, playerName: string): Promise<string> {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const player: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        currentAnswer: null,
        answeredAt: null,
        joinedAt: Date.now(),
    };

    const playerRef = ref(realtimeDb, `games/${roomCode}/players/${playerId}`);
    await set(playerRef, player);

    return playerId;
}

// Start the game
export async function startGame(roomCode: string): Promise<void> {
    const updates: any = {
        status: 'active',
        startedAt: Date.now(),
        currentQuestionIndex: 0,
        questionStartedAt: Date.now(),
    };

    const gameRef = ref(realtimeDb, `games/${roomCode}`);
    await update(gameRef, updates);
}

// Move to next question
export async function nextQuestion(roomCode: string, currentIndex: number): Promise<void> {
    const gameRef = ref(realtimeDb, `games/${roomCode}`);
    const snapshot = await get(gameRef);
    const gameState = snapshot.val() as GameState;

    if (currentIndex + 1 >= gameState.questions.length) {
        // Game finished
        await update(gameRef, {
            status: 'finished',
            questionStartedAt: null,
        });
    } else {
        // Next question
        await update(gameRef, {
            currentQuestionIndex: currentIndex + 1,
            questionStartedAt: Date.now(),
        });
    }
}

// Submit an answer
export async function submitAnswer(
    roomCode: string,
    playerId: string,
    questionId: string,
    selectedOption: number,
    timeElapsed: number
): Promise<void> {
    const gameRef = ref(realtimeDb, `games/${roomCode}`);
    const snapshot = await get(gameRef);
    const gameState = snapshot.val() as GameState;

    const question = gameState.questions.find(q => q.id === questionId);
    if (!question) return;

    // Check if player has already answered this question to prevent double points
    const existingAnswerRef = ref(realtimeDb, `games/${roomCode}/answers/${questionId}/${playerId}`);
    const existingAnswerSnapshot = await get(existingAnswerRef);
    if (existingAnswerSnapshot.exists()) {
        return; // Player already answered
    }

    // Calculate points based on time (decreasing points timer)
    // Maximum points if answered immediately, decreasing linearly to 50% over time limit
    const timeRatio = Math.max(0, 1 - (timeElapsed / question.timeLimit));
    const minPointsRatio = 0.5; // Minimum 50% of points
    const pointsMultiplier = minPointsRatio + (timeRatio * (1 - minPointsRatio));

    const isCorrect = selectedOption === question.correctAnswer;
    const pointsEarned = isCorrect ? Math.round(question.points * pointsMultiplier) : 0;

    const answer: Answer = {
        playerId,
        questionId,
        selectedOption,
        answeredAt: Date.now(),
        timeElapsed,
        pointsEarned,
    };

    // Save answer
    const answerRef = ref(realtimeDb, `games/${roomCode}/answers/${questionId}/${playerId}`);
    await set(answerRef, answer);

    // Update player score and answer status
    const playerRef = ref(realtimeDb, `games/${roomCode}/players/${playerId}`);
    const playerSnapshot = await get(playerRef);
    const player = playerSnapshot.val() as Player;

    await update(playerRef, {
        score: player.score + pointsEarned,
        currentAnswer: selectedOption.toString(),
        answeredAt: Date.now(),
    });
}

// Get leaderboard
export async function getLeaderboard(roomCode: string): Promise<LeaderboardEntry[]> {
    const gameRef = ref(realtimeDb, `games/${roomCode}/players`);
    const snapshot = await get(gameRef);
    const players = snapshot.val() as { [key: string]: Player };

    if (!players) return [];

    // Count correct answers for each player
    const answersRef = ref(realtimeDb, `games/${roomCode}/answers`);
    const answersSnapshot = await get(answersRef);
    const answers = answersSnapshot.val() || {};

    const leaderboard: LeaderboardEntry[] = Object.values(players).map(player => {
        let correctAnswers = 0;

        Object.values(answers).forEach((questionAnswers: any) => {
            if (questionAnswers[player.id] && questionAnswers[player.id].pointsEarned > 0) {
                correctAnswers++;
            }
        });

        return {
            playerId: player.id,
            playerName: player.name,
            score: player.score,
            correctAnswers,
            rank: 0,
        };
    });

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Assign ranks
    leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
    });

    return leaderboard;
}

// Subscribe to game state changes
export function subscribeToGame(
    roomCode: string,
    callback: (gameState: GameState | null) => void
): () => void {
    const gameRef = ref(realtimeDb, `games/${roomCode}`);

    onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });

    // Return unsubscribe function
    return () => off(gameRef);
}

// Check if room exists
export async function checkRoomExists(roomCode: string): Promise<boolean> {
    const gameRef = ref(realtimeDb, `games/${roomCode}`);
    const snapshot = await get(gameRef);
    return snapshot.exists();
}
