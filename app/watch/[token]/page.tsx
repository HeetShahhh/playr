'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Match, MatchEvent } from '@/types';
import { LiveDot } from '@/components/ui/LiveDot';
import { ShareButton } from '@/components/ui/ShareButton';
import { getSportAccentColor, timeAgo } from '@/lib/utils';

export default function SpectatorPage() {
  const { token } = useParams<{ token: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [lastEvent, setLastEvent] = useState<MatchEvent | null>(null);
  const [matchTime, setMatchTime] = useState('0:00');
  const [loading, setLoading] = useState(true);
  const [prevScoreA, setPrevScoreA] = useState(0);
  const [prevScoreB, setPrevScoreB] = useState(0);
  const [animateA, setAnimateA] = useState(false);
  const [animateB, setAnimateB] = useState(false);

  useEffect(() => {
    if (token === 'demo') {
      setMatch({
        id: 'demo',
        share_token: 'demo',
        status: 'live',
        sport_id: '1',
        player_a_id: 'a',
        player_b_id: 'b',
        score_a: 14,
        score_b: 11,
        sets_a: 1,
        sets_b: 0,
        current_set: 2,
        created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
        sport: {
          id: '1', name: 'Badminton', slug: 'badminton',
          accent_color: '#00A86B', icon: '🏸', status: 'live',
          points_per_set: 21, sets_per_match: 3,
          win_by_margin: 2, max_cap: 30, sets_to_win: 2,
        },
        player_a: { id: 'a', display_name: 'Rahul S.', role: 'player', elo_rating: 1347, created_at: '' },
        player_b: { id: 'b', display_name: 'Arjun P.', role: 'player', elo_rating: 1289, created_at: '' },
        set_results: [{ id: '1', match_id: 'demo', set_number: 1, score_a: 21, score_b: 18, winner: 'a' }],
      } as Match);
      setLoading(false);
      return;
    }

    loadMatch();
  }, [token]);

  const loadMatch = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(id, display_name, avatar_url),
        player_b:user_profiles!matches_player_b_id_fkey(id, display_name, avatar_url),
        set_results(*)
      `)
      .eq('share_token', token)
      .single();

    if (data) {
      setMatch(data as Match);
      setPrevScoreA(data.score_a);
      setPrevScoreB(data.score_b);

      // Subscribe to real-time events
      if (data.status === 'live') {
        subscribeToMatch(data.id);
      }
    }
    setLoading(false);
  };

  const subscribeToMatch = (matchId: string) => {
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const event = payload.new as MatchEvent;
          setLastEvent(event);

          // Update score with animation
          setMatch((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              score_a: event.score_a_after,
              score_b: event.score_b_after,
            };

            if (event.score_a_after > prev.score_a) {
              setAnimateA(true);
              setTimeout(() => setAnimateA(false), 400);
            }
            if (event.score_b_after > prev.score_b) {
              setAnimateB(true);
              setTimeout(() => setAnimateB(false), 400);
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // Match timer
  useEffect(() => {
    if (!match || match.status !== 'live') return;
    const start = new Date(match.created_at).getTime();
    const update = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setMatchTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [match]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-chalk/30 border-t-chalk rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-chalk flex flex-col items-center justify-center p-4 text-center">
        <span className="text-6xl mb-4 block">🏅</span>
        <h1 className="text-xl font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Match not found
        </h1>
        <p className="text-muted text-sm mb-6">This link may have expired or the match was deleted.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-orange text-white font-semibold rounded-lg text-sm"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Go to Playr
        </Link>
      </div>
    );
  }

  const accentColor = getSportAccentColor(match.sport);
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  return (
    <div className="min-h-screen bg-navy flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div
        className="px-4 pt-5 pb-4"
        style={{ backgroundColor: accentColor }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{match.sport?.icon}</span>
              <span
                className="text-sm font-bold text-white uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {match.sport?.name}
              </span>
              <span className="text-white/50 text-xs">·</span>
              <span
                className="text-xs text-white/60"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Set {match.current_set} of {match.sport?.sets_per_match}
              </span>
            </div>
            {isLive ? (
              <div className="flex items-center gap-1.5">
                <LiveDot color="lime" size="sm" />
                <span className="text-xs font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  LIVE
                </span>
              </div>
            ) : isCompleted ? (
              <span className="text-xs font-bold text-white/60 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                Final
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Score board */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        {/* Players + Scores */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex-1 text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
              {match.player_a?.display_name.charAt(0)}
            </div>
            <p
              className="text-sm font-semibold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {match.player_a?.display_name}
            </p>
            <span
              className={`text-[72px] sm:text-[88px] font-bold text-white leading-none tabular-nums transition-transform duration-100 ${animateA ? 'scale-125' : 'scale-100'}`}
              style={{ fontFamily: 'var(--font-mono)', display: 'block' }}
            >
              {match.score_a}
            </span>
            {/* Previous sets */}
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {match.set_results?.map((r) => (
                <span
                  key={r.id}
                  className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {r.score_a}
                </span>
              ))}
            </div>
          </div>

          <div className="px-4 flex flex-col items-center gap-2">
            <span className="text-white/40 text-lg font-light">vs</span>
            {match.sets_a > 0 || match.sets_b > 0 ? (
              <span
                className="text-white font-bold text-xl"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {match.sets_a}–{match.sets_b}
              </span>
            ) : null}
          </div>

          <div className="flex-1 text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
              {match.player_b?.display_name.charAt(0)}
            </div>
            <p
              className="text-sm font-semibold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {match.player_b?.display_name}
            </p>
            <span
              className={`text-[72px] sm:text-[88px] font-bold text-white leading-none tabular-nums transition-transform duration-100 ${animateB ? 'scale-125' : 'scale-100'}`}
              style={{ fontFamily: 'var(--font-mono)', display: 'block' }}
            >
              {match.score_b}
            </span>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {match.set_results?.map((r) => (
                <span
                  key={r.id}
                  className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {r.score_b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Match completed banner */}
        {isCompleted && match.winner_id && (
          <div className="w-full bg-lime/20 border border-lime/30 rounded-card p-4 text-center mb-6">
            <p
              className="text-lime font-bold text-lg"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🏆 {match.winner_id === match.player_a_id
                ? match.player_a?.display_name
                : match.player_b?.display_name} wins!
            </p>
          </div>
        )}

        {/* Info bar */}
        {isLive && (
          <div className="w-full flex items-center justify-between text-white/50 text-xs mb-8">
            {lastEvent && (
              <span style={{ fontFamily: 'var(--font-body)' }}>
                Last point: {
                  lastEvent.event_type === 'point_a' ? match.player_a?.display_name
                  : lastEvent.event_type === 'point_b' ? match.player_b?.display_name
                  : lastEvent.event_type
                }
                {' · '}{timeAgo(lastEvent.created_at)}
              </span>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <Clock size={12} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{matchTime}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full space-y-3">
          {match.share_token && match.share_token !== 'demo' && (
            <ShareButton shareToken={match.share_token} className="w-full justify-center bg-white/15 border-transparent text-white hover:bg-white/25" />
          )}
          <Link
            href="/auth?mode=signup"
            className="flex items-center justify-center gap-2 w-full py-3 border border-white/20 rounded-lg text-white/70 text-sm font-medium hover:bg-white/5 transition-colors"
            style={{ fontFamily: 'var(--font-display)', minHeight: '48px' }}
          >
            <Download size={16} />
            Join Playr free
          </Link>
        </div>

        {/* Playr badge */}
        <div className="mt-8 flex items-center gap-2 opacity-40">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black"
            style={{ backgroundColor: '#B6F000', color: '#0D1B2A' }}
          >
            P▶
          </div>
          <span className="text-xs text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Powered by Playr
          </span>
        </div>
      </div>
    </div>
  );
}
