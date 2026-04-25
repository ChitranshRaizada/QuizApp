import { useState, useRef, FormEvent, ChangeEvent, useEffect } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { Question } from '../types';
import { Plus, Play, SkipForward, BarChart3, Users, QrCode, Trash2, Upload, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const { 
    state, 
    addQuestion, 
    importQuestions, 
    startQuiz, 
    nextQuestion, 
    revealAnswer, 
    resetQuiz,
    setCorrectAnswer
  } = useQuiz(true);

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 30
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthorized(true);
    } else {
      alert('Invalid PIN');
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text || newQuestion.options?.some(o => !o)) return;
    addQuestion({
      id: Math.random().toString(36).substr(2, 9),
      text: newQuestion.text!,
      options: newQuestion.options! as string[],
      correctAnswer: newQuestion.correctAnswer!,
      timeLimit: newQuestion.timeLimit!
    });
    setNewQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30 });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importQuestions(json);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleReveal = () => {
    revealAnswer();
    const correctCount = state.players.filter(p => p.isCorrect).length;
    if (correctCount > 0) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleOptionClick = async (idx: number) => {
    if (state.status === 'active') {
      await setCorrectAnswer(idx);
      handleReveal();
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-md mx-auto p-12 immersive-card">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
          <QrCode size={32} />
        </div>
        <h2 className="text-3xl font-black mb-2 text-white">ACCESS PORTAL</h2>
        <p className="text-slate-500 mb-8 text-center text-sm font-medium">Enter your 4-digit administrator PIN to initialize the control dashboard.</p>
        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center opacity-50">Secret Key</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-6 rounded-2xl bg-black border border-slate-800 focus:border-indigo-500 focus:ring-0 transition-all text-center text-3xl font-black tracking-[0.5em] text-indigo-400 shadow-inner"
              autoFocus
              id="admin-pin-input"
              maxLength={4}
            />
          </div>
          <button type="submit" className="immersive-btn-primary w-full py-5 text-lg" id="admin-login-submit">
            INITIALIZE SESSION
          </button>
        </form>
      </div>
    );
  }

  const chartData = state.activeQuestionIndex !== null ? 
    state.questions[state.activeQuestionIndex].options.map((opt, idx) => ({
      name: `Option ${idx + 1}`,
      count: state.players.filter(p => p.lastAnswer === idx).length,
      fullText: opt
    })) : [];

  const shareUrl = `${window.location.origin}${window.location.pathname}#player`;

  return (
    <div className="flex flex-col gap-8">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Network Integrity', val: '99.9%', icon: <Users size={16} />, color: 'text-emerald-400' },
          { label: 'Active Players', val: state.players.length, icon: <Users size={16} />, color: 'text-indigo-400' },
          { label: 'Session Status', val: state.status.toUpperCase(), icon: <Play size={16} />, color: 'text-amber-400' },
          { label: 'Questions', val: state.questions.length, icon: <BarChart3 size={16} />, color: 'text-slate-400' },
        ].map((stat, i) => (
          <div key={i} className="immersive-card p-6 flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              {stat.icon} {stat.label}
            </span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Question and Stats */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="immersive-card p-10 flex flex-col gap-8 min-h-[400px] relative">
            {state.activeQuestionIndex !== null && (
              <div className="absolute top-8 right-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-full border border-indigo-500/20 uppercase tracking-widest">
                  Active Question {state.activeQuestionIndex + 1}/{state.questions.length}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              {state.status === 'idle' || state.status === 'ended' ? (
                <button 
                  disabled={state.questions.length === 0}
                  onClick={startQuiz}
                  className="immersive-btn-primary px-10 py-5 text-xl flex items-center gap-3"
                  id="btn-start-quiz"
                >
                  <Play size={24} fill="currentColor" /> LAUNCH QUIZ
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleReveal}
                    disabled={state.status === 'revealed'}
                    className="immersive-btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 px-8 py-5 text-base flex items-center gap-3"
                    id="btn-reveal-answer"
                  >
                    <BarChart3 size={20} /> REVEAL ANSWER
                  </button>
                  <button 
                    onClick={nextQuestion}
                    className="immersive-btn-secondary px-8 py-5 text-base flex items-center gap-3"
                    id="btn-next-question"
                  >
                    <SkipForward size={20} /> {state.activeQuestionIndex === state.questions.length - 1 ? 'FINISH SESSION' : 'NEXT QUESTION'}
                  </button>
                </>
              )}
              <button 
                onClick={resetQuiz}
                className="p-5 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                id="btn-reset-quiz"
                title="Reset Quiz"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {state.activeQuestionIndex !== null ? (
                <motion.div
                  key={state.activeQuestionIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-10"
                >
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-white leading-tight max-w-2xl mx-auto">{state.questions[state.activeQuestionIndex].text}</h2>
                  </div>

                  <div className="h-72 mt-8">
                    <div className="flex items-center justify-between mb-6 px-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Live Response Integrity</h4>
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-800 rounded-md text-slate-400">
                        {state.players.filter(p => p.lastAnswer !== undefined).length} / {state.players.length} SYNCED
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#050505] border border-slate-800 p-4 rounded-xl shadow-2xl">
                                  <p className="text-sm font-bold text-white">{payload[0].payload.fullText}</p>
                                  <p className="text-xs text-indigo-400 mt-1 font-mono uppercase tracking-widest">{payload[0].value} Responses</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[12, 12, 4, 4]} barSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={state.status === 'revealed' 
                                ? (index === state.questions[state.activeQuestionIndex!].correctAnswer ? '#10b981' : '#f43f5e') 
                                : '#4f46e5'} 
                              className="transition-all duration-500"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.questions[state.activeQuestionIndex].options.map((opt, i) => {
                      const count = state.players.filter(p => p.lastAnswer === i).length;
                      return (
                        <button
                          key={i}
                          onClick={() => handleOptionClick(i)}
                          className={`p-4 rounded-xl flex items-center justify-between group transition-all border-2 ${
                            state.status === 'active' 
                            ? 'bg-slate-800/50 border-slate-700 hover:border-indigo-500 cursor-pointer'
                            : state.questions[state.activeQuestionIndex!].correctAnswer === i
                              ? 'bg-emerald-500/20 border-emerald-500'
                              : 'bg-slate-800/50 border-slate-700 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                               state.questions[state.activeQuestionIndex!].correctAnswer === i ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="font-bold text-white uppercase tracking-tight text-left">{opt}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-black text-indigo-400">{count}</span>
                            {state.status === 'active' && (
                              <span className="text-[10px] font-black uppercase text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Set Correct</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                   <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-8 immersive-glow animate-pulse">
                     <Play size={48} fill="currentColor" />
                   </div>
                   <h3 className="text-3xl font-black text-white">ORCHESTRATION READY</h3>
                   <p className="text-slate-500 max-w-sm mt-4 text-sm leading-relaxed">
                     Awaiting command initialization. Scan the deployment vector QR or manually add question datasets below.
                   </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="immersive-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Users size={20} className="text-indigo-500" />
                Live Rankings
              </h3>
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">Real-time Persistence</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.players.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-10 col-span-2">No active player sessions detected...</p>
              ) : (
                [...state.players].sort((a, b) => b.score - a.score).map((player, i) => (
                  <div key={player.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        i === 0 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20' : 
                        i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/20' : 
                        i === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/20' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white block leading-none">{player.username}</span>
                        {player.lastAnswer !== undefined && (
                          <span className={`text-[10px] font-black tracking-widest uppercase mt-1 inline-block ${player.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {player.isCorrect ? 'VALID SYNCHRONIZATION' : 'INTEGRITY FAILURE'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-indigo-400 font-black text-lg">{player.score.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Join & Data Management */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-indigo-600 rounded-3xl p-8 flex items-center gap-6 shadow-[0_20px_50px_rgba(79,70,229,0.3)] relative overflow-hidden group">
            <div className="relative z-10 w-28 h-28 bg-white p-2 rounded-2xl flex-shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500">
              <QRCodeSVG value={shareUrl} size={112} />
            </div>
            <div className="relative z-10 flex flex-col justify-center gap-1">
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Deployment ID</p>
              <h4 className="text-xl font-black text-white leading-tight tracking-tighter uppercase">{window.location.hostname || 'Localhost'}</h4>
              <button 
                onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Link copied!'); }}
                className="mt-3 text-[10px] bg-white text-indigo-600 px-4 py-2 rounded-lg font-black uppercase tracking-widest hover:bg-indigo-50 shadow-lg active:scale-95 transition-all w-fit"
              >
                Copy Link
              </button>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="immersive-card p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Dataset Input</h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                id="btn-import-json"
                title="Import JSON"
              >
                <Upload size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Question Vector</span>
                <input
                  placeholder="The design principle regarding user perception..."
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="w-full p-4 rounded-xl bg-black/40 border border-slate-800 focus:border-indigo-500 transition-all text-sm text-white placeholder:text-slate-600"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {newQuestion.options?.map((opt, i) => (
                  <div key={i} className="flex gap-3 items-center group">
                    <input
                      type="radio"
                      name="correct"
                      checked={newQuestion.correctAnswer === i}
                      onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                      className="accent-indigo-500 w-5 h-5 bg-slate-800 border-none"
                    />
                    <input
                      placeholder={`Component Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...(newQuestion.options || [])];
                        opts[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: opts });
                      }}
                      className="flex-1 p-3 rounded-xl bg-black/40 border border-slate-800 focus:border-indigo-500 transition-all text-sm text-white placeholder:text-slate-700"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                 <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Cycle Limit (s)</span>
                    <input 
                      type="number"
                      value={newQuestion.timeLimit}
                      onChange={(e) => setNewQuestion({ ...newQuestion, timeLimit: parseInt(e.target.value) })}
                      className="w-full p-4 rounded-xl bg-black/40 border border-slate-800 focus:border-indigo-500 transition-all text-sm text-center text-white"
                    />
                 </div>
                 <button 
                  onClick={handleAddQuestion}
                  className="immersive-btn-primary flex-[2] py-4 mt-5 text-sm flex items-center justify-center gap-2 uppercase tracking-[0.1em]"
                  id="btn-add-question"
                 >
                  <Plus size={18} /> Append Vector
                 </button>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {state.questions.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3 opacity-30">
                  <BarChart3 size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Null Dataset</span>
                </div>
              ) : (
                state.questions.map((q, i) => (
                  <div key={q.id} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl flex justify-between items-center group transition-all">
                    <div className="truncate pr-4">
                      <span className="text-[10px] font-black opacity-30 mr-2">{i + 1}.</span>
                      <span className="text-xs font-bold text-slate-300">{q.text}</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-black px-2 py-0.5 rounded border border-indigo-500/20">{q.timeLimit}s</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
