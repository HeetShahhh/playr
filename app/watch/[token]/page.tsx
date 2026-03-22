'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface MatchData {
  id:           string;
  share_token:  string;
  status:       'live' | 'completed' | string;
  sport_slug:   string;
  sport_name:   string;
  sport_accent: string;
  player_a:     string;
  player_b:     string;
  score_a:      number;
  score_b:      number;
  sets_a:       number;
  sets_b:       number;
  current_set:  number;
  set_results:  Array<{ score_a: number; score_b: number; winner: 'a' | 'b' }>;
  winner_name?: string;
  created_at:   string;
}

const SPORT_ACCENTS: Record<string, string> = {
  badminton:  '#00A86B',
  pickleball: '#FF6B35',
  tennis:     '#E8A020',
  cricket:    '#1A5CFF',
  basketball: '#E83038',
  squash:     '#8B5CF6',
};

function timeAgo(createdAt: string) {
  const secs = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function SpectatorPage() {
  const { token } = useParams<{ token: string }>();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastPointName, setLastPointName] = useState<string | null>(null);
  const [lastPointTime, setLastPointTime] = useState<string | null>(null);
  // Score slide animation state
  const [slideA, setSlideA] = useState<'in' | 'out' | null>(null);
  const [slideB, setSlideB] = useState<'in' | 'out' | null>(null);
  const matchIdRef = useRef<string | null>(null);

  const normalize = (raw: any): MatchData => ({
    id:           raw.id,
    share_token:  raw.share_token,
    status:       raw.status,
    sport_slug:   raw.sport?.slug ?? 'badminton',
    sport_name:   raw.sport?.name ?? 'Match',
    sport_accent: SPORT_ACCENTS[raw.sport?.slug] ?? '#00A86B',
    player_a:     raw.player_name_a ?? raw.player_a?.display_name ?? 'Player A',
    player_b:     raw.player_name_b ?? raw.player_b?.display_name ?? 'Player B',
    score_a:      raw.score_a,
    score_b:      raw.score_b,
    sets_a:       raw.sets_a,
    sets_b:       raw.sets_b,
    current_set:  raw.current_set,
    set_results:  (raw.set_results ?? []).map((r: any) => ({ score_a: r.score_a, score_b: r.score_b, winner: r.winner })),
    created_at:   raw.created_at,
  });

  useEffect(() => {
    if (!token) return;

    supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(display_name),
        player_b:user_profiles!matches_player_b_id_fkey(display_name),
        set_results(score_a, score_b, winner)
      `)
      .eq('share_token', token)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const m = normalize(data);
        setMatch(m);
        matchIdRef.current = data.id;
        setLoading(false);

        // Subscribe to real-time match_events
        if (data.status === 'live') {
          const channel = supabase
            .channel(`watch-${data.id}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'match_events',
              filter: `match_id=eq.${data.id}`,
            }, (payload) => {
              const ev = payload.new as any;
              setMatch((prev) => {
                if (!prev) return prev;
                const sideA = ev.event_type === 'point_a';
                const sideB = ev.event_type === 'point_b';
                if (sideA) { triggerSlide('a'); setLastPointName(prev.player_a); }
                if (sideB) { triggerSlide('b'); setLastPointName(prev.player_b); }
                setLastPointTime(timeAgo(ev.created_at));
                return {
                  ...prev,
                  score_a: ev.score_a_after,
                  score_b: ev.score_b_after,
                };
              });
            })
            .subscribe();
          return () => { supabase.removeChannel(channel); };
        }
      });
  }, [token]);

  const triggerSlide = (side: 'a' | 'b') => {
    const setter = side === 'a' ? setSlideA : setSlideB;
    setter('out');
    setTimeout(() => setter('in'), 160);
    setTimeout(() => setter(null), 320);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: 'var(--navy)' }}>
        <span className="text-5xl mb-4">🏅</span>
        <h1 className="text-[22px] font-bold mb-2 text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Match not found
        </h1>
        <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
          This link may have expired or the match was deleted.
        </p>
        <Link
          href="/"
          className="px-6 font-semibold text-white rounded-lg"
          style={{ height: '48px', lineHeight: '48px', backgroundColor: 'var(--orange)', fontFamily: 'var(--font-display)' }}
        >
          Go to Playr
        </Link>
      </div>
    );
  }

  const isLive = match.status === 'live';
  const accent = match.sport_accent;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--navy)', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: '40px', backgroundColor: 'var(--navy-2)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black"
            style={{ backgroundColor: 'var(--navy)', color: 'var(--lime)', border: '1px solid var(--lime)' }}
          >
            P▶
          </div>
          <span className="text-[14px] font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Playr
          </span>
        </div>

        {isLive ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: 'var(--lime)' }} />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--lime)', fontFamily: 'var(--font-display)' }}>
              LIVE
            </span>
          </div>
        ) : (
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
            Final
          </span>
        )}
      </header>

      {/* Sport label */}
      <div className="px-4 pt-6 pb-2 text-center">
        <span
          className="text-[13px] font-semibold uppercase tracking-widest"
          style={{ color: accent, fontFamily: 'var(--font-display)' }}
        >
          {match.sport_name} · SET {match.current_set}
        </span>
      </div>

      {/* Player names */}
      <div className="flex items-center justify-between px-8 py-2">
        <span
          className="text-[18px] font-medium flex-1 text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          {match.player_a.toUpperCase()}
        </span>
        <span className="text-[13px] px-2" style={{ color: 'var(--border)' }}>—</span>
        <span
          className="text-[18px] font-medium flex-1 text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
        >
          {match.player_b.toUpperCase()}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center gap-8 py-4">
        <span
          className={slideA === 'out' ? 'score-slide-out' : slideA === 'in' ? 'score-slide-in' : ''}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '80px',
            color: 'var(--lime)',
            lineHeight: 1,
            minWidth: '80px',
            textAlign: 'center',
            display: 'inline-block',
          }}
        >
          {match.score_a}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--text-secondary)' }}>
          —
        </span>
        <span
          className={slideB === 'out' ? 'score-slide-out' : slideB === 'in' ? 'score-slide-in' : ''}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '80px',
            color: 'var(--lime)',
            lineHeight: 1,
            minWidth: '80px',
            textAlign: 'center',
            display: 'inline-block',
          }}
        >
          {match.score_b}
        </span>
      </div>

      {/* Set history */}
      {match.set_results.length > 0 && (
        <p className="text-center text-[13px] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {match.set_results.map((s, i) => (
            <span key={i}>{i > 0 ? '  ·  ' : ''}{s.score_a} – {s.score_b}</span>
          ))}
        </p>
      )}

      {/* Last point */}
      {lastPointName && (
        <p className="text-center text-[13px] mt-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Last point: {lastPointName}  ·  {lastPointTime}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div
        className="px-4 pb-8 pt-4 flex flex-col gap-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <button
          onClick={handleShare}
          className="w-full font-semibold rounded-lg border text-white text-[14px]"
          style={{ height: '48px', borderColor: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-display)' }}
        >
          Share this match
        </button>
        <p className="text-center text-[13px]" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Score your matches free on{' '}
          <Link href="/" className="text-white hover:underline">Playr</Link>
        </p>
      </div>
    </div>
  );
}
