// Type Definitions for Quiz Battle

export type GameType = 'trivia' | 'poll';
export type GameStatus = 'lobby' | 'active' | 'paused' | 'finished';
export type QuestionType = 'multiple-choice' | 'true-false';

export interface Player {
  id: string;
  name: string;
  score: number;
  currentAnswer: string | null;
  answeredAt: number | null;
  joinedAt: number;
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: number; // index of correct option
  timeLimit: number; // seconds
  points: number;
  imageUrl?: string;
}

export interface Answer {
  playerId: string;
  questionId: string;
  selectedOption: number;
  answeredAt: number;
  timeElapsed: number;
  pointsEarned: number;
}

export interface GameSettings {
  roomCode: string;
  title: string;
  description?: string;
  hostId: string;
  type: GameType;
  customBranding?: {
    primaryColor?: string;
    logoUrl?: string;
    backgroundColor?: string;
  };
  showLeaderboardBetweenQuestions: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number; // seconds
}

export interface GameState {
  roomCode: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  settings: GameSettings;
  questions: Question[];
  players: { [playerId: string]: Player };
  answers: { [questionId: string]: Answer[] };
  createdAt: number;
  startedAt: number | null;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // player IDs
}

export interface Poll {
  id: string;
  roomCode: string;
  question: string;
  options: PollOption[];
  status: 'open' | 'closed';
  showResults: boolean;
  allowMultipleVotes: boolean;
  createdAt: number;
  hostId: string;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  correctAnswers: number;
  rank: number;
}
