'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface SportConfig {
  slug:   string;
  name:   string;
  format: string;
  accent: string;
  rules:  string;
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  badminton: {
    slug:   'badminton',
    name:   'Badminton',
    format: 'Best of 3 sets',
    accent: '#00A86B',
    rules:  'First to 21 · Win by 2 · Cap 30',
  },
  pickleball: {
    slug:   'pickleball',
    name:   'Pickleball',
    format: 'Best of 3 sets',
    accent: '#FF6B35',
    rules:  'First to 11 · Win by 2 · Cap 15',
  },
  tennis: {
    slug:   'tennis',
    name:   'Tennis',
    format: 'Best of 3 sets',
    accent: '#E8A020',
    rules:  '6 games per set · Win by 2 · Tiebreak at 6-6',
  },
};

export default function MatchSetupPage() {
  const { sport: sportSlug } = useParams<{ sport: string }>();
  const router = useRouter();

  const config = SPORT_CONFIGS[sportSlug];
  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if sport not found
  useEffect(() => {
    if (!config) router.push('/');
  }, [config, router]);

  if (!config) return null;

  const handleStart = async () => {
    const nameA = playerA.trim();
    const nameB = playerB.trim();

    if (!nameA || !nameB) {
      setError('Enter both player names to continue.');
      return;
    }
    if (nameA === nameB) {
      setError('Player names must be different.');
      return;
    }

    setLoading(true);
    setError('');

    // Look up sport ID from DB
    const { data: sportData, error: sportErr } = await supabase
      .from('sports')
      .select('id')
      .eq('slug', sportSlug)
      .single();

    if (sportErr || !sportData) {
      setError('Sport not found. Try again.');
      setLoading(false);
      return;
    }

    // Insert match (guest — no auth required)
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .insert({
        sport_id:      sportData.id,
        player_name_a: nameA,
        player_name_b: nameB,
        player_a_id:   null,
        player_b_id:   null,
        status:        'live',
        score_a:       0,
        score_b:       0,
        sets_a:        0,
        sets_b:        0,
        current_set:   1,
      })
      .select()
      .single();

    if (matchErr || !match) {
      setError('Failed to create match. Check your connection.');
      setLoading(false);
      return;
    }

    // Store in localStorage
    try {
      localStorage.setItem('playr_active_match', match.id);
      const existing = JSON.parse(localStorage.getItem('playr_matches') || '[]');
      localStorage.setItem('playr_matches', JSON.stringify([match.id, ...existing]));
    } catch {
      // localStorage may be unavailable — proceed anyway
    }

    router.push(`/match/${match.id}/score`);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--navy)', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* Header */}
      <header
        className="flex items-center px-4 shrink-0"
        style={{
          height: '52px',
          borderBottom: `3px solid ${config.accent}`,
          backgroundColor: 'var(--navy-2)',
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 mr-4"
          style={{ color: 'var(--text-secondary)', minHeight: '44px' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span
          className="text-[17px] font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {config.name}
        </span>
      </header>

      {/* Form */}
      <div className="flex-1 flex flex-col px-4 pt-8 pb-6 gap-6">

        {/* Player A */}
        <div className="flex flex-col gap-2">
          <label
            className="text-[14px] font-medium"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            Player A
          </label>
          <input
            type="text"
            value={playerA}
            onChange={(e) => { setPlayerA(e.target.value); setError(''); }}
            placeholder="Enter name"
            maxLength={30}
            autoFocus
            className="w-full px-4 text-[16px] rounded-lg outline-none transition-colors"
            style={{
              height: '52px',
              backgroundColor: 'var(--navy-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => (e.target.style.borderColor = config.accent)}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* VS divider */}
        <div className="flex items-center justify-center">
          <span
            className="text-[15px]"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
          >
            — vs —
          </span>
        </div>

        {/* Player B */}
        <div className="flex flex-col gap-2">
          <label
            className="text-[14px] font-medium"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            Player B
          </label>
          <input
            type="text"
            value={playerB}
            onChange={(e) => { setPlayerB(e.target.value); setError(''); }}
            placeholder="Enter name"
            maxLength={30}
            className="w-full px-4 text-[16px] rounded-lg outline-none transition-colors"
            style={{
              height: '52px',
              backgroundColor: 'var(--navy-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => (e.target.style.borderColor = config.accent)}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        {/* Rules */}
        <p
          className="text-[13px] text-center"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
        >
          {config.format} · {config.rules}
        </p>

        {/* Error */}
        {error && (
          <p
            className="text-[13px] text-center"
            style={{ fontFamily: 'var(--font-body)', color: '#E85D1A' }}
          >
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full font-semibold text-white text-[16px] rounded-lg transition-opacity disabled:opacity-50"
          style={{
            height: '56px',
            backgroundColor: 'var(--orange)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {loading ? 'Starting…' : 'Start Match →'}
        </button>
      </div>
    </div>
  );
}
