'use client';

import { useEffect, useState } from 'react';

interface Step1Props { onNext: () => void; }

export function Step1Promise({ onNext }: Step1Props) {
  const [displayScore, setDisplayScore] = useState(18);

  // Count from 18 → 21 over 1.2s
  useEffect(() => {
    let current = 18;
    const interval = setInterval(() => {
      current++;
      setDisplayScore(current);
      if (current >= 21) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center text-center px-6 slide-up">
      {/* Animated scoreboard */}
      <div className="w-full max-w-xs mb-10 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-stretch">
          <div className="flex-1 flex flex-col items-center py-6">
            <p className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>You</p>
            <span
              className="font-bold text-lime leading-none"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 88, lineHeight: 1 }}
            >
              {displayScore}
            </span>
          </div>
          <div className="w-px bg-white/10 self-stretch" />
          <div className="flex-1 flex flex-col items-center py-6">
            <p className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>Opp</p>
            <span
              className="font-bold text-white/80 leading-none"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 88, lineHeight: 1 }}
            >
              18
            </span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        Score your match live.
      </h2>
      <p className="text-white/70 text-base leading-relaxed mb-10">
        Tap to score. Share a link. Anyone can watch.
      </p>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-4 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 transition-all active:scale-95"
        style={{ fontFamily: 'var(--font-display)', minHeight: '52px' }}
      >
        That's cool →
      </button>
    </div>
  );
}
