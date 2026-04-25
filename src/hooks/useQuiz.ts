import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizState, Question, Player } from '../types';
import { db, auth, handleFirestoreError, OperationType, loginAnonymously } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const DEFAULT_SESSION_ID = 'main-quiz-session';

const DEFAULT_STATE: QuizState = {
  questions: [],
  activeQuestionIndex: null,
  status: 'idle',
  startTime: null,
  players: [],
};

export function useQuiz(isAdmin: boolean) {
  const [state, setState] = useState<QuizState>(DEFAULT_STATE);
  const [sessionId] = useState(DEFAULT_SESSION_ID);

  useEffect(() => {
    // Wait for auth to be determined
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await loginAnonymously();
        } catch (e) {
          console.error("Anonymous login error:", e);
        }
        return;
      }

      // 1. Listen to Session metadata
      const sessionRef = doc(db, 'sessions', sessionId);
      const unsubscribeSession = onSnapshot(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setState(prev => ({
            ...prev,
            status: data.status,
            activeQuestionIndex: data.activeQuestionIndex,
            questions: data.questions || [],
            startTime: data.startTime,
          }));
        } else if (isAdmin) {
          // Initialize if not exists and is admin
          setDoc(sessionRef, {
            status: 'idle',
            activeQuestionIndex: null,
            questions: [],
            startTime: null,
            adminUid: user.uid
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `sessions/${sessionId}`));
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `sessions/${sessionId}`));

      // 2. Listen to Players subcollection
      const playersRef = collection(db, 'sessions', sessionId, 'players');
      const unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
        const players: Player[] = [];
        snapshot.forEach(doc => {
          players.push({ id: doc.id, ...doc.data() } as Player);
        });
        setState(prev => ({ ...prev, players }));
      }, (err) => handleFirestoreError(err, OperationType.GET, `sessions/${sessionId}/players`));

      return () => {
        unsubscribeSession();
        unsubscribePlayers();
      };
    });

    return unsubAuth;
  }, [sessionId, isAdmin]);

  // Admin Actions
  const addQuestion = useCallback(async (q: Question) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const newQuestions = [...state.questions, q];
    try {
      await updateDoc(sessionRef, { questions: newQuestions });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  }, [sessionId, state.questions]);

  const importQuestions = useCallback(async (qs: Question[]) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    try {
      await updateDoc(sessionRef, { questions: qs });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  }, [sessionId]);

  const startQuiz = useCallback(async () => {
    const sessionRef = doc(db, 'sessions', sessionId);
    try {
      await updateDoc(sessionRef, {
        activeQuestionIndex: 0,
        status: 'active',
        startTime: Date.now(),
      });
      
      // Reset players for new quiz
      for (const p of state.players) {
        const playerRef = doc(db, 'sessions', sessionId, 'players', p.id);
        await updateDoc(playerRef, { 
          score: 0, 
          lastAnswer: null, 
          isCorrect: null,
          lastAnswerTime: null 
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sessions/${sessionId}/players`);
    }
  }, [sessionId, state.players]);

  const nextQuestion = useCallback(async () => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const nextIndex = (state.activeQuestionIndex ?? -1) + 1;
    try {
      if (nextIndex >= state.questions.length) {
        await updateDoc(sessionRef, { status: 'ended', activeQuestionIndex: null });
      } else {
        await updateDoc(sessionRef, {
          activeQuestionIndex: nextIndex,
          status: 'active',
          startTime: Date.now(),
        });
        
        // Reset answers for next question
        for (const p of state.players) {
          const playerRef = doc(db, 'sessions', sessionId, 'players', p.id);
          await updateDoc(playerRef, { 
            lastAnswer: null, 
            isCorrect: null,
            lastAnswerTime: null 
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  }, [sessionId, state.activeQuestionIndex, state.questions.length, state.players]);

  const setCorrectAnswer = useCallback(async (index: number) => {
    if (state.activeQuestionIndex === null) return;
    const sessionRef = doc(db, 'sessions', sessionId);
    const updatedQuestions = [...state.questions];
    updatedQuestions[state.activeQuestionIndex].correctAnswer = index;
    try {
      await updateDoc(sessionRef, { questions: updatedQuestions });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  }, [sessionId, state.activeQuestionIndex, state.questions]);

  const revealAnswer = useCallback(async () => {
    const q = state.questions[state.activeQuestionIndex!];
    const sessionRef = doc(db, 'sessions', sessionId);
    
    try {
      await updateDoc(sessionRef, { status: 'revealed' });

      // Update each player's score if correct
      for (const p of state.players) {
        const playerRef = doc(db, 'sessions', sessionId, 'players', p.id);
        if (p.lastAnswer === q.correctAnswer) {
          const timeTaken = (p.lastAnswerTime! - state.startTime!) / 1000;
          const speedBonus = Math.max(0, Math.floor((q.timeLimit - timeTaken) * 10));
          await updateDoc(playerRef, { 
            score: p.score + 100 + speedBonus,
            isCorrect: true 
          });
        } else {
          await updateDoc(playerRef, { isCorrect: false });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  }, [sessionId, state]);

  const resetQuiz = useCallback(async () => {
    const sessionRef = doc(db, 'sessions', sessionId);
    try {
      await updateDoc(sessionRef, { status: 'idle', activeQuestionIndex: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${sessionId}`);
    }
  }, [sessionId]);

  // Player Actions
  const join = useCallback(async (username: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const playerRef = doc(db, 'sessions', sessionId, 'players', auth.currentUser.uid);
    const player: Player = {
      id: auth.currentUser.uid,
      username,
      score: 0,
      uid: auth.currentUser.uid
    };
    try {
      await setDoc(playerRef, player);
      return auth.currentUser.uid;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `sessions/${sessionId}/players/${auth.currentUser.uid}`);
      return ''; // keep TS happy
    }
  }, [sessionId]);

  const answer = useCallback(async (playerId: string, answerIndex: number) => {
    const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
    try {
      await updateDoc(playerRef, {
        lastAnswer: answerIndex,
        lastAnswerTime: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${sessionId}/players/${playerId}`);
    }
  }, [sessionId]);

  return {
    state,
    addQuestion,
    importQuestions,
    startQuiz,
    nextQuestion,
    revealAnswer,
    resetQuiz,
    join,
    answer,
    setCorrectAnswer
  };
}
