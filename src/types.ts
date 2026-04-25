/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  timeLimit: number; // Seconds
}

export interface Player {
  id: string; // Unique session ID or username
  username: string;
  score: number;
  lastAnswer?: number;
  lastAnswerTime?: number; // timestamp
  isCorrect?: boolean;
  uid?: string;
}

export interface QuizState {
  questions: Question[];
  activeQuestionIndex: number | null; // null if not started or ended
  status: 'idle' | 'active' | 'revealed' | 'ended';
  startTime: number | null; // timestamp when current question started
  players: Player[];
}

export type SyncMessage = 
  | { type: 'STATE_UPDATE'; state: QuizState }
  | { type: 'PLAYER_JOIN'; player: Player }
  | { type: 'PLAYER_ANSWER'; playerId: string; answerIndex: number; time: number }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'START_QUIZ' }
  | { type: 'STOP_QUIZ' }
  | { type: 'NEXT_QUESTION' };
