'use client';

interface Step3Props { onNext: () => void; }

const AVATARS = [
  { emoji: '🏸', top: '15%', left: '10%', delay: '0s' },
  { emoji: '🎾', top: '10%', left: '70%', delay: '0.2s' },
  { emoji: '🥒', top: '55%', left: '5%',  delay: '0.4s' },
  { emoji: '🏏', top: '60%', left: '75%', delay: '0.6s' },
];

export function Step3Community({ onNext }: Step3Props) {
  return (
    <div className="flex flex-col items-center text-center px-6 slide-up">
      {/* Player cluster illustration */}
      <div className="relative w-64 h-44 mb-10">
        {/* Dashed connection lines (CSS-only) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 176" fill="none">
          <line x1="88" y1="60" x2="168" y2="60"  stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="88" y1="60" x2="40"  y2="116" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="168" y1="60" x2="210" y2="116" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="40"  y1="116" x2="128" y2="88" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Avatar circles */}
        {AVATARS.map((a, i) => (
          <div
            key={i}
            className="absolute w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
            style={{
              top: a.top,
              left: a.left,
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              animation: `bobFloat 3s ${a.delay} ease-in-out infinite`,
            }}
          >
            {a.emoji}
          </div>
        ))}

        {/* Center node */}
        <div
          className="absolute w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-navy shadow-lg"
          style={{ top: '35%', left: '37%', backgroundColor: '#B6F000' }}
        >
          You
        </div>

        <style>{`
          @keyframes bobFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        Your city's players are here.
      </h2>
      <p className="text-white/70 text-base leading-relaxed mb-10">
        Find clubs, join tournaments, connect with players.
      </p>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-4 font-bold rounded-lg hover:opacity-90 transition-all active:scale-95"
        style={{ fontFamily: 'var(--font-display)', minHeight: '52px', backgroundColor: '#B6F000', color: '#0D1B2A' }}
      >
        Let's go →
      </button>
    </div>
  );
}
