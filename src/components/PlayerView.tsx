import { useState, useEffect, useRef, FormEvent } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Timer, Award, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'quiz_blast_player_session';

export default function PlayerView() {
  const { state, join, answer } = useQuiz(false);
  const [session, setSession] = useState<{ id: string; username: string } | null>(null);
  const [username, setUsername] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSession(JSON.parse(saved));
    }
  }, []);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const id = await join(username.trim());
      const sessionData = { id, username: username.trim() };
      setSession(sessionData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error("Failed to join:", error);
    }
  };

  // Timer logic
  useEffect(() => {
    if (state.status === 'active' && state.startTime) {
      const q = state.questions[state.activeQuestionIndex!];
      const calculate = () => {
        const elapsed = (Date.now() - state.startTime!) / 1000;
        const left = Math.max(0, Math.ceil(q.timeLimit - elapsed));
        setTimeLeft(left);
        if (left <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      calculate();
      timerRef.current = setInterval(calculate, 1000);
      setSelectedIdx(null); // Reset selection for new question
    } else if (state.status === 'revealed') {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setTimeLeft(0);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, state.startTime, state.activeQuestionIndex, state.questions]);

  const handleAnswer = (idx: number) => {
    if (state.status !== 'active' || selectedIdx !== null || timeLeft <= 0) return;
    setSelectedIdx(idx);
    answer(session!.id, idx);
  };

  if (!session) {
    return (
      <div className="max-w-md mx-auto p-12 immersive-card text-center relative group">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform duration-500">
          <Users size={40} />
        </div>
        <h2 className="text-3xl font-black mb-2 text-white mt-8 tracking-tighter italic uppercase text-indigo-400">Welcome To Quiz Blast</h2>
        <p className="text-slate-500 mb-8 text-sm font-medium">Synchronize your terminal with the host broadcast.</p>
        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Identity Handle</label>
            <input
              placeholder="CoolNickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-6 rounded-2xl bg-black/60 border border-slate-800 focus:border-indigo-500 transition-all text-center text-xl font-bold uppercase tracking-[0.1em] text-white selection:bg-indigo-500/50"
              maxLength={15}
              autoFocus
              id="player-username-input"
            />
          </div>
          <button type="submit" className="immersive-btn-primary w-full py-5 text-xl tracking-widest uppercase italic font-black" id="player-join-submit">
            Establish Link
          </button>
        </form>
      </div>
    );
  }

  const currentPlayer = state.players.find(p => p.id === session.id);
  const activeQuestion = state.activeQuestionIndex !== null ? state.questions[state.activeQuestionIndex] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HUD */}
      <div className="flex items-center justify-between p-5 immersive-card border-none sticky top-10 z-40 backdrop-blur-3xl bg-slate-900/60 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            {session.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Vector Signal</p>
            <p className="font-bold text-white leading-tight uppercase tracking-tight">{session.username}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Credit Units</p>
              <p className="text-2xl font-black text-indigo-400 leading-tight">{currentPlayer?.score.toLocaleString() || 0}</p>
           </div>
           
           {state.status === 'active' && activeQuestion && (
             <div className="flex items-center gap-3 px-6 py-3 bg-black/40 border border-slate-800 rounded-2xl">
               <Timer size={20} className={timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-slate-500'} />
               <span className={`text-2xl font-black tabular-nums transition-colors ${timeLeft < 5 ? 'text-rose-500' : 'text-white'}`}>{timeLeft}s</span>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {state.status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 immersive-card text-center flex flex-col items-center gap-8"
          >
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 immersive-glow animate-pulse">
              <Award size={48} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Synchronizing Stream</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium">Awaiting host to initialize the broadcast vector. Keep your terminal active for real-time deployment.</p>
            </div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.8)]`} style={{ animation: `pulse 2s infinite ${i * 0.3}s` }} />
              ))}
            </div>
          </motion.div>
        )}

        {state.status === 'active' && activeQuestion && (
          <motion.div
            key={`q-${state.activeQuestionIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="text-center space-y-4 py-8">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">Incoming Data Vector</span>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] max-w-3xl mx-auto italic uppercase tracking-tighter">{activeQuestion.text}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {activeQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={selectedIdx !== null || timeLeft <= 0}
                  onClick={() => handleAnswer(i)}
                  className={`p-8 rounded-[2rem] text-left text-xl font-bold border-2 transition-all flex items-center justify-between group relative overflow-hidden ${
                    selectedIdx === i 
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(79,70,229,0.2)]' 
                      : 'border-slate-800 bg-slate-900 shadow-xl hover:border-slate-700 active:scale-[0.98]'
                  } disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed`}
                >
                  <span className="flex items-center gap-6 relative z-10">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${
                      selectedIdx === i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-white group-hover:translate-x-1 transition-transform">{opt}</span>
                  </span>
                  {selectedIdx === i && <CheckCircle2 className="text-indigo-400 relative z-10" size={28} />}
                  
                  {/* Visual flare for selected button */}
                  {selectedIdx === i && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,1)]" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
               {selectedIdx !== null && (
                 <div className="bg-slate-900 border border-slate-800 px-8 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-bounce">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Synchronization Locked</span>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {state.status === 'revealed' && activeQuestion && (
           <motion.div
            key={`r-${state.activeQuestionIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 rounded-[3rem] immersive-card text-center overflow-hidden relative group"
           >
             <div className="relative z-10">
                {currentPlayer?.isCorrect ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-bounce">
                      <CheckCircle2 size={56} />
                    </div>
                    <h2 className="text-6xl font-black text-emerald-400 tracking-tighter italic uppercase">Vector Valid</h2>
                    <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black opacity-60">Protocol Integrity Level: Maximum</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(244,63,94,0.4)]">
                      <XCircle size={56} />
                    </div>
                    <h2 className="text-6xl font-black text-rose-500 tracking-tighter italic uppercase">Integrity Fail</h2>
                    <p className="text-slate-400 uppercase tracking-widest text-sm font-bold">
                      Correct Vector: <span className="text-indigo-400">{activeQuestion.options[activeQuestion.correctAnswer]}</span>
                    </p>
                  </div>
                )}

                 <div className="mt-12 space-y-3 max-w-sm mx-auto">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Round Standings</h4>
                  {[...state.players].sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.id === session?.id ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-black/20 border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black opacity-40">#{i + 1}</span>
                        <span className="text-sm font-bold text-white">{p.username}</span>
                      </div>
                      <span className="text-sm font-black text-indigo-400">{p.score}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-16 flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] opacity-40">Credit Accumulation</span>
                  <div className="text-6xl font-black text-white tabular-nums tracking-tighter">{currentPlayer?.score.toLocaleString() || 0}</div>
                </div>
             </div>
             
             {/* Background glow effects */}
             <div className={`absolute top-0 right-0 w-64 h-64 ${currentPlayer?.isCorrect ? 'bg-emerald-500/10' : 'bg-rose-500/10'} rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 transition-all duration-1000 group-hover:scale-150`} />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
           </motion.div>
        )}

        {state.status === 'ended' && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="p-16 immersive-card text-center border-none shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="w-24 h-24 bg-amber-400 text-amber-900 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                <Award size={48} />
              </div>
              <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white leading-none">Global Rankings</h2>
              <p className="text-slate-500 mt-4 uppercase tracking-[0.4em] font-black text-[10px]">Session Deployment Complete</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {[...state.players].sort((a, b) => b.score - a.score).map((p, i) => (
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center justify-between p-8 rounded-3xl transition-all relative overflow-hidden ${
                    p.id === session.id 
                      ? 'bg-indigo-600 shadow-[0_20px_40px_rgba(79,70,229,0.3)] scale-105 z-10' 
                      : 'bg-slate-900 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <span className={`text-4xl font-black italic ${p.id === session.id ? 'text-white/40' : 'text-slate-800'}`}>#{i + 1}</span>
                    <div>
                      <span className="text-2xl font-black text-white italic uppercase tracking-tight">{p.username}</span>
                      {p.id === session.id && <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-1">Host Entity (YOU)</span>}
                    </div>
                  </div>
                  <span className="text-4xl font-black text-white relative z-10 tabular-nums">{p.score.toLocaleString()}</span>
                  
                  {/* Decorative line for user */}
                  {p.id === session.id && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)]" />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col items-center pt-10">
              <button
                onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
                className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 hover:text-indigo-400 transition-all border-b border-transparent hover:border-indigo-400 pb-2"
              >
                Re-Initialize Terminal Identification
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
