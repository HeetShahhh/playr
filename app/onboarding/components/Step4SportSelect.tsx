'use client';

interface Step4Props {
  selected: string;
  onSelect: (slug: string) => void;
  onComplete: () => void;
  loading: boolean;
}

const SPORTS = [
  { slug: 'badminton',  name: 'Badminton',   icon: '🏸', accent: '#00A86B' },
  { slug: 'pickleball', name: 'Pickleball',  icon: '🥒', accent: '#FF6B35' },
  { slug: 'tennis',     name: 'Tennis',      icon: '🎾', accent: '#E8A020' },
  { slug: 'cricket',    name: 'Cricket',     icon: '🏏', accent: '#1A5CFF' },
  { slug: 'basketball', name: 'Basketball',  icon: '🏀', accent: '#E83038' },
  { slug: 'squash',     name: 'Squash',      icon: '🎱', accent: '#8B5CF6' },
];

export function Step4SportSelect({ selected, onSelect, onComplete, loading }: Step4Props) {
  return (
    <div className="flex flex-col items-center text-center px-6 slide-up w-full">
      <h2 className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Pick your main sport.
      </h2>
      <p className="text-muted text-sm mb-8">
        We'll configure scoring rules automatically.
      </p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-10">
        {SPORTS.map(sport => {
          const isSelected = selected === sport.slug;
          return (
            <button
              key={sport.slug}
              onClick={() => onSelect(sport.slug)}
              className="flex flex-col items-center gap-2 p-3 rounded-card border-2 transition-all duration-150"
              style={{
                borderColor: isSelected ? sport.accent : '#E0E0D8',
                backgroundColor: isSelected ? `${sport.accent}15` : 'white',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                minHeight: '80px',
              }}
            >
              <span className="text-2xl">{sport.icon}</span>
              <span className="text-[11px] font-semibold text-navy" style={{ fontFamily: 'var(--font-display)' }}>
                {sport.name}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onComplete}
        disabled={!selected || loading}
        className="flex items-center justify-center gap-2 w-full max-w-xs py-4 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 disabled:opacity-40 transition-all active:scale-95"
        style={{ fontFamily: 'var(--font-display)', minHeight: '52px' }}
      >
        {loading
          ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : 'Start on Playr →'}
      </button>
    </div>
  );
}
