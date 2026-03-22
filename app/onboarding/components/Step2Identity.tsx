'use client';

import { useEffect, useState } from 'react';

interface Step2Props { onNext: () => void; }

export function Step2Identity({ onNext }: Step2Props) {
  const [phase, setPhase] = useState(0);
  // 0=nothing  1=name  2=badges  3=record  4=rating

  useEffect(() => {
    const delays = [300, 700, 1100, 1500];
    const timers = delays.map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center text-center px-6 slide-up">
      {/* Animated profile card */}
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl p-5 mb-10">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-chalk font-bold text-lg">
            R
          </div>
          <div>
            <p
              className="font-bold text-navy text-sm transition-all duration-300"
              style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)', fontFamily: 'var(--font-display)' }}
            >
              Rahul Sharma
            </p>
            <p className="text-xs text-muted" style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.3s', fontFamily: 'var(--font-body)' }}>
              Ahmedabad
            </p>
          </div>
        </div>

        {/* Sport badges */}
        <div
          className="flex gap-2 mb-4 transition-all duration-300"
          style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)' }}
        >
          {['🏸', '🎾', '🥒'].map(e => (
            <span key={e} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-base">{e}</span>
          ))}
        </div>

        {/* Recent match */}
        <div
          className="flex items-center justify-between p-2.5 rounded-lg bg-surface mb-2 transition-all duration-300"
          style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)' }}
        >
          <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>🏸 vs Arjun P.</span>
          <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-mono)', color: '#5A7A00' }}>W 21–18</span>
        </div>

        {/* Rating */}
        <div
          className="flex items-center justify-between p-2.5 rounded-lg bg-navy transition-all duration-300"
          style={{ opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? 'translateY(0)' : 'translateY(8px)' }}
        >
          <span className="text-xs text-chalk/70" style={{ fontFamily: 'var(--font-display)' }}>Rating</span>
          <span className="font-bold text-lime" style={{ fontFamily: 'var(--font-mono)' }}>1,347 ↑</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-navy mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        Every match builds your profile.
      </h2>
      <p className="text-muted text-base leading-relaxed mb-10">
        Stats, ratings, history across every sport.
      </p>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-4 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 transition-all active:scale-95"
        style={{ fontFamily: 'var(--font-display)', minHeight: '52px' }}
      >
        Got it →
      </button>
    </div>
  );
}
