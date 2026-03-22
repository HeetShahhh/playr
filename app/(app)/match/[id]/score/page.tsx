'use client';

import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Clock, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { scoreReducer } from '@/components/scoring/scoreReducer';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SetHistory } from '@/components/ui/SetHistory';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ShareButton } from '@/components/ui/ShareButton';
import { ScoreState, Match } from '@/types';
import { checkSetEnd, checkMatchEnd, getSportAccentColor } from '@/lib/utils';
import { writeEventLocally, syncPendingEvents } from '@/lib/db';

type ModalType = 'set_end' | 'match_end' | 'fault' | null;

export default function ScoringPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, dispatch] = useReducer(scoreReducer, null as any);
  const [modal, setModal] = useState<ModalType>(null);
  const [tapSide, setTapSide] = useState<'a' | 'b' | null>(null);
  const [history, setHistory] = useState<ScoreState[]>([]);
  const lastTapRef = useRef<number>(0);
  const DEBOUNCE_MS = 300;

  useEffect(() => {
    loadMatch();
  }, [id]);

  const loadMatch = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(*),
        player_b:user_profiles!matches_player_b_id_fkey(*),
        set_results(*)
      `)
      .eq('id', id)
      .single();

    if (data) {
      setMatch(data as Match);
      const initialState: ScoreState = {
        matchId: data.id,
        sport: data.sport,
        playerA: data.player_a,
        playerB: data.player_b,
        scoreA: data.score_a,
        scoreB: data.score_b,
        setsA: data.sets_a,
        setsB: data.sets_b,
        currentSet: data.current_set,
        setResults: data.set_results || [],
        status: data.status,
        winnerId: data.winner_id,
      };
      dispatch({ type: 'UNDO', previousState: initialState });
    }
    setLoading(false);
  };

  const recordEvent = useCallback(
    async (eventType: string, newScoreA: number, newScoreB: number, setNum: number) => {
      const now = new Date().toISOString();
      const localId = await writeEventLocally({
        matchId: id,
        eventType,
        scoreAAfter: newScoreA,
        scoreBAfter: newScoreB,
        setNumber: setNum,
        createdAt: now,
      });

      // Background Supabase insert
      supabase
        .from('match_events')
        .insert({
          match_id: id,
          event_type: eventType,
          score_a_after: newScoreA,
          score_b_after: newScoreB,
          set_number: setNum,
          created_at: now,
        })
        .then(async ({ error }) => {
          if (!error) {
            await syncPendingEvents();
          }
        });

      return localId;
    },
    [id]
  );

  const handleScore = useCallback(
    async (side: 'a' | 'b') => {
      const now = Date.now();
      if (now - lastTapRef.current < DEBOUNCE_MS) return;
      lastTapRef.current = now;

      if (!state || state.status === 'completed') return;

      // Push current state to history before mutation
      setHistory((prev) => [...prev.slice(-20), state]);

      // Flash animation
      setTapSide(side);
      setTimeout(() => setTapSide(null), 150);

      const newScoreA = side === 'a' ? state.scoreA + 1 : state.scoreA;
      const newScoreB = side === 'b' ? state.scoreB + 1 : state.scoreB;

      dispatch({ type: side === 'a' ? 'POINT_A' : 'POINT_B' });
      await recordEvent(side === 'a' ? 'point_a' : 'point_b', newScoreA, newScoreB, state.currentSet);

      // Update Supabase match row
      await supabase
        .from('matches')
        .update({
          score_a: newScoreA,
          score_b: newScoreB,
          status: 'live',
        })
        .eq('id', id);

      // Check set end
      if (checkSetEnd(newScoreA, newScoreB, state.sport)) {
        const winner = newScoreA > newScoreB ? 'a' : 'b';
        // Slight delay so the score shows first
        setTimeout(() => setModal('set_end'), 400);
      }
    },
    [state, id, recordEvent]
  );

  const handleSetEnd = useCallback(async () => {
    if (!state) return;
    const winner: 'a' | 'b' = state.scoreA > state.scoreB ? 'a' : 'b';

    dispatch({
      type: 'SET_END',
      winner,
      finalScoreA: state.scoreA,
      finalScoreB: state.scoreB,
    });

    // Persist set result
    await supabase.from('set_results').insert({
      match_id: id,
      set_number: state.currentSet,
      score_a: state.scoreA,
      score_b: state.scoreB,
      winner,
    });

    const newSetsA = state.setsA + (winner === 'a' ? 1 : 0);
    const newSetsB = state.setsB + (winner === 'b' ? 1 : 0);

    if (checkMatchEnd(newSetsA, newSetsB, state.sport)) {
      const winnerId = winner === 'a' ? state.playerA.id : state.playerB.id;
      await supabase.from('matches').update({
        sets_a: newSetsA,
        sets_b: newSetsB,
        score_a: 0,
        score_b: 0,
        current_set: state.currentSet + 1,
        status: 'completed',
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
      }).eq('id', id);

      await recordEvent('match_end', 0, 0, state.currentSet);
      dispatch({ type: 'MATCH_END', winnerId });
      setModal('match_end');
    } else {
      await supabase.from('matches').update({
        sets_a: newSetsA,
        sets_b: newSetsB,
        score_a: 0,
        score_b: 0,
        current_set: state.currentSet + 1,
      }).eq('id', id);

      await recordEvent('set_end', 0, 0, state.currentSet);
      setModal(null);
    }
  }, [state, id, recordEvent]);

  const handleUndo = useCallback(async () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    dispatch({ type: 'UNDO', previousState: prevState });

    await recordEvent('undo', prevState.scoreA, prevState.scoreB, prevState.currentSet);
    await supabase.from('matches').update({
      score_a: prevState.scoreA,
      score_b: prevState.scoreB,
      sets_a: prevState.setsA,
      sets_b: prevState.setsB,
      current_set: prevState.currentSet,
    }).eq('id', id);

    showToast('Point undone', 'action');
  }, [history, id, recordEvent, showToast]);

  if (loading || !state) {
    return (
      <div className="fixed inset-0 bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-chalk/30 border-t-chalk rounded-full animate-spin" />
      </div>
    );
  }

  const accentColor = getSportAccentColor(state.sport);
  const winnerName = state.winnerId === state.playerA.id
    ? state.playerA.display_name
    : state.playerB.display_name;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: accentColor }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 z-10"
        style={{ backgroundColor: accentColor }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/80 hover:text-white min-h-[44px] px-1"
        >
          <ArrowLeft size={18} />
          <span className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>Back</span>
        </button>

        <div className="flex flex-col items-center">
          <span
            className="text-xs font-bold text-white/90 uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Set {state.currentSet} of {state.sport.sets_per_match}
          </span>
          <span
            className="text-[10px] text-white/60 mt-0.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            First to {state.sport.points_per_set} · Win by {state.sport.win_by_margin} · Cap {state.sport.max_cap}
          </span>
        </div>

        <OfflineIndicator />
      </div>

      {/* Set history */}
      {state.setResults.length > 0 && (
        <div className="flex justify-center pb-1">
          <SetHistory results={state.setResults} />
        </div>
      )}

      {/* Main scoring area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Player A side */}
        <button
          className="flex-1 flex flex-col items-center justify-center relative select-none active:opacity-90"
          style={{
            backgroundColor: tapSide === 'a' ? 'rgba(232, 93, 26, 0.3)' : 'transparent',
            transition: 'background-color 150ms ease-out',
          }}
          onClick={() => handleScore('a')}
          disabled={state.status === 'completed'}
          aria-label={`Score point for ${state.playerA.display_name}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base">
              {state.playerA.display_name.charAt(0)}
            </div>
            <span
              className="text-sm font-semibold text-white/90 text-center px-2"
              style={{ fontFamily: 'var(--font-display)', maxWidth: '120px', wordBreak: 'break-word' }}
            >
              {state.playerA.display_name}
            </span>
            <ScoreDisplay
              score={state.scoreA}
              size="xl"
              className="text-white"
              animate
            />
            <span
              className="text-xs text-white/60 mt-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Tap to score
            </span>
          </div>
          {/* Sets won indicator */}
          <div className="absolute bottom-4 flex gap-1">
            {Array.from({ length: state.sport.sets_to_win }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < state.setsA ? 'bg-lime' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </button>

        {/* Center divider */}
        <div className="w-px bg-white/20 self-stretch mx-1" />

        {/* Player B side */}
        <button
          className="flex-1 flex flex-col items-center justify-center relative select-none active:opacity-90"
          style={{
            backgroundColor: tapSide === 'b' ? 'rgba(232, 93, 26, 0.3)' : 'transparent',
            transition: 'background-color 150ms ease-out',
          }}
          onClick={() => handleScore('b')}
          disabled={state.status === 'completed'}
          aria-label={`Score point for ${state.playerB.display_name}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base">
              {state.playerB.display_name.charAt(0)}
            </div>
            <span
              className="text-sm font-semibold text-white/90 text-center px-2"
              style={{ fontFamily: 'var(--font-display)', maxWidth: '120px', wordBreak: 'break-word' }}
            >
              {state.playerB.display_name}
            </span>
            <ScoreDisplay
              score={state.scoreB}
              size="xl"
              className="text-white"
              animate
            />
            <span
              className="text-xs text-white/60 mt-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Tap to score
            </span>
          </div>
          <div className="absolute bottom-4 flex gap-1">
            {Array.from({ length: state.sport.sets_to_win }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < state.setsB ? 'bg-lime' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </button>
      </div>

      {/* Bottom action bar */}
      <div
        className="px-4 pt-3 pb-4 space-y-3"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        {/* Secondary actions */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={async () => {
              showToast('Fault called', 'action');
              await recordEvent('fault', state.scoreA, state.scoreB, state.currentSet);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-colors"
            style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
          >
            <AlertTriangle size={14} />
            Fault
          </button>
          <button
            onClick={async () => {
              showToast('Let called', 'action');
              await recordEvent('let', state.scoreA, state.scoreB, state.currentSet);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-colors"
            style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
          >
            Let
          </button>
          <button
            onClick={async () => {
              showToast('Timeout called', 'action');
              await recordEvent('timeout', state.scoreA, state.scoreB, state.currentSet);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-colors"
            style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
          >
            <Clock size={14} />
            Timeout
          </button>
          {match && <ShareButton shareToken={match.share_token} variant="icon" className="bg-white/15 border-transparent hover:bg-white/25 text-white" />}
        </div>

        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ fontFamily: 'var(--font-display)', minHeight: '52px' }}
        >
          <RotateCcw size={18} />
          Undo last point
        </button>
      </div>

      {/* Set end modal */}
      {modal === 'set_end' && (
        <div className="fixed inset-0 bg-navy/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center slide-up">
            <p
              className="text-lg font-bold text-navy mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Set {state.currentSet} complete!
            </p>
            <p className="text-3xl font-bold my-4 text-navy" style={{ fontFamily: 'var(--font-mono)' }}>
              {state.scoreA > state.scoreB ? state.playerA.display_name : state.playerB.display_name} won
            </p>
            <p className="text-xl font-semibold text-muted mb-6" style={{ fontFamily: 'var(--font-mono)' }}>
              {state.scoreA} – {state.scoreB}
            </p>
            <button
              onClick={handleSetEnd}
              className="w-full py-3.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange/90"
              style={{ fontFamily: 'var(--font-display)', minHeight: '52px' }}
            >
              Next set →
            </button>
          </div>
        </div>
      )}

      {/* Match complete modal */}
      {(modal === 'match_end' || state.status === 'completed') && (
        <div className="fixed inset-0 bg-navy/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center slide-up">
            <p className="text-3xl mb-2">🎉</p>
            <p
              className="text-xl font-bold text-navy mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Match complete!
            </p>
            <p
              className="text-orange font-bold text-lg mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {winnerName} wins
            </p>
            <p
              className="text-sm text-muted mb-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {state.setsA}–{state.setsB} sets
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {state.setResults.map((r) => (
                <span
                  key={r.id}
                  className="text-xs px-2 py-1 bg-surface rounded-pill text-navy"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {r.score_a}–{r.score_b}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {match && (
                <ShareButton shareToken={match.share_token} className="w-full justify-center" />
              )}
              <button
                onClick={() => router.push('/manage/matches/new')}
                className="w-full py-3 bg-surface text-navy font-medium rounded-lg hover:bg-border transition-colors text-sm"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                New match
              </button>
              <button
                onClick={() => router.push('/matches')}
                className="w-full py-3 text-muted font-medium rounded-lg text-sm hover:text-navy"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                View all matches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
