/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import AdminPanel from './components/AdminPanel';
import PlayerView from './components/PlayerView';
import ThemeToggle from './components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'landing' | 'admin' | 'player'>('landing');

  useEffect(() => {
    // Basic routing via hash
    const hash = window.location.hash;
    if (hash === '#admin') setView('admin');
    else if (hash === '#player') setView('player');
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 transition-colors duration-300 font-sans selection:bg-indigo-500/30">
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl flex justify-between items-center bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => { window.location.hash = ''; setView('landing'); }}
          id="app-logo"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">QuizBlast</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Real-Time Interactive</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-slate-700/50">
          <button 
            onClick={() => { window.location.hash = '#admin'; setView('admin'); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            id="nav-admin"
          >
            Admin
          </button>
          <button 
            onClick={() => { window.location.hash = '#player'; setView('player'); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'player' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            id="nav-player"
          >
            Player
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="pt-32 pb-12 px-4 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-10"
              id="landing-view"
            >
              <div className="space-y-4">
                <span className="px-4 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20 uppercase tracking-[0.2em]">Next-Gen Learning</span>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white max-w-4xl leading-[0.9]">
                  IMMERSE IN THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-300">QUIZ.</span>
                </h1>
              </div>

              <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed">
                Experience real-time interaction like never before. 
                Host immersive sessions with live sync and zero lag.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-6">
                <button
                  onClick={() => { window.location.hash = '#admin'; setView('admin'); }}
                  className="immersive-btn-primary h-16 px-10 text-lg shadow-[0_20px_50px_rgba(79,70,229,0.3)]"
                  id="btn-create-quiz"
                >
                  Create Masterclass
                </button>
                <button
                  onClick={() => { window.location.hash = '#player'; setView('player'); }}
                  className="immersive-btn-secondary h-16 px-10 text-lg"
                  id="btn-join-quiz"
                >
                  Join Session
                </button>
              </div>

              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {[
                  { title: 'Ultra Sync', desc: 'BroadcastChannel API ensures sub-10ms latency across tabs.', icon: '⚡' },
                  { title: 'Visual Data', desc: 'Native data visualization with Recharts for live feedback.', icon: '📊' },
                  { title: 'Pure Web', desc: 'Zero backend required. Fully persistent local storage.', icon: '🌐' },
                ].map((feature, i) => (
                  <div key={i} className="immersive-card p-8 group hover:border-indigo-500/50 transition-colors">
                    <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              id="admin-view-container"
              className="max-w-6xl mx-auto"
            >
              <AdminPanel />
            </motion.div>
          )}

          {view === 'player' && (
            <motion.div
              key="player"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              id="player-view-container"
              className="max-w-4xl mx-auto"
            >
              <PlayerView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 flex flex-col items-center gap-6 border-t border-slate-900 mx-10">
        <div className="flex gap-8 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Safety</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
        </div>
        <p className="text-slate-600 text-[10px] uppercase tracking-widest font-black">
          &copy; 2026 QuizBlast Ecosystem • Immersive UI v4.0
        </p>
      </footer>
    </div>
  );
}

