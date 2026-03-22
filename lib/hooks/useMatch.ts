'use client';

/**
 * useMatch — loads match data, provides scoring dispatch, persists every event
 * to Dexie (offline queue) + Supabase in the background.
 *
 * The reducer itself is in lib/scoring.ts — pure, no side effects.
 */
import { useReducer, useCallback, useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { writeEventLocally, syncPendingEvents } from '@/lib/db';
import {
  scoringReducer,
  initialScoringState,
  ScoringState,
  ScoringAction,
} from '@/lib/scoring';
import { checkSetEnd, checkMatchEnd } from '@/lib/utils';

const DEBOUNCE_MS = 300;

export function useMatch(matchId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(scoringReducer, null as any);
  const [history, setHistory] = useState<ScoringState[]>([]);
  const lastTapRef = useRef<number>(0);

  // -------------------------------------------------------------------------
  // Load match from Supabase
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('matches')
        .select(`
          *,
          sport:sports(*),
          player_a:user_profiles!matches_player_a_id_fkey(*),
          player_b:user_profiles!matches_player_b_id_fkey(*),
          set_results(*)
        `)
        .eq('id', matchId)
        .single();

      if (cancelled) return;

      if (err || !data) {
        setError(err?.message ?? 'Match not found');
        setLoading(false);
        return;
      }

      const initial = initialScoringState(data as any);
      // Bootstrap the reducer with the DB state
      dispatch({ type: 'UNDO', previousState: initial });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [matchId]);

  // -------------------------------------------------------------------------
  // Persist an event (Dexie first, then Supabase background)
  // -------------------------------------------------------------------------
  const recordEvent = useCallback(
    async (
      eventType: string,
      scoreA: number,
      scoreB: number,
      setNum: number
    ) => {
      const now = new Date().toISOString();
      await writeEventLocally({
        matchId,
        eventType,
        scoreAAfter: scoreA,
        scoreBAfter: scoreB,
        setNumber: setNum,
        createdAt: now,
      });

      // Fire-and-forget to Supabase
      supabase
        .from('match_events')
        .insert({
          match_id: matchId,
          event_type: eventType,
          score_a_after: scoreA,
          score_b_after: scoreB,
          set_number: setNum,
          created_at: now,
        })
        .then(({ error: e }) => {
          if (!e) syncPendingEvents();
        });
    },
    [matchId]
  );

  // -------------------------------------------------------------------------
  // Score a point
  // -------------------------------------------------------------------------
  const scorePoint = useCallback(
    async (side: 'a' | 'b') => {
      const now = Date.now();
      if (now - lastTapRef.current < DEBOUNCE_MS) return null;
      lastTapRef.current = now;

      if (!state || state.status === 'completed') return null;

      // Snapshot for undo
      setHistory((prev) => [...prev.slice(-20), state]);

      const newScoreA = side === 'a' ? state.scoreA + 1 : state.scoreA;
      const newScoreB = side === 'b' ? state.scoreB + 1 : state.scoreB;

      dispatch({ type: side === 'a' ? 'POINT_A' : 'POINT_B' });

      await recordEvent(
        side === 'a' ? 'point_a' : 'point_b',
        newScoreA,
        newScoreB,
        state.currentSet
      );

      await supabase
        .from('matches')
        .update({ score_a: newScoreA, score_b: newScoreB, status: 'live' })
        .eq('id', matchId);

      const setOver = checkSetEnd(newScoreA, newScoreB, state.sport);
      return { newScoreA, newScoreB, setOver };
    },
    [state, matchId, recordEvent]
  );

  // -------------------------------------------------------------------------
  // Confirm set end
  // -------------------------------------------------------------------------
  const confirmSetEnd = useCallback(async () => {
    if (!state) return false;
    const winner: 'a' | 'b' = state.scoreA > state.scoreB ? 'a' : 'b';

    dispatch({
      type: 'SET_END',
      winner,
      finalScoreA: state.scoreA,
      finalScoreB: state.scoreB,
    });

    await supabase.from('set_results').insert({
      match_id: matchId,
      set_number: state.currentSet,
      score_a: state.scoreA,
      score_b: state.scoreB,
      winner,
    });

    const newSetsA = state.setsA + (winner === 'a' ? 1 : 0);
    const newSetsB = state.setsB + (winner === 'b' ? 1 : 0);
    const matchOver = checkMatchEnd(newSetsA, newSetsB, state.sport);

    if (matchOver) {
      const winnerId = winner === 'a' ? state.playerA.id : state.playerB.id;
      await supabase
        .from('matches')
        .update({
          sets_a: newSetsA,
          sets_b: newSetsB,
          score_a: 0,
          score_b: 0,
          current_set: state.currentSet + 1,
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId);
      await recordEvent('match_end', 0, 0, state.currentSet);
      dispatch({ type: 'MATCH_END', winnerId });
    } else {
      await supabase
        .from('matches')
        .update({
          sets_a: newSetsA,
          sets_b: newSetsB,
          score_a: 0,
          score_b: 0,
          current_set: state.currentSet + 1,
        })
        .eq('id', matchId);
      await recordEvent('set_end', 0, 0, state.currentSet);
    }

    return matchOver;
  }, [state, matchId, recordEvent]);

  // -------------------------------------------------------------------------
  // Undo last point
  // -------------------------------------------------------------------------
  const undoPoint = useCallback(async () => {
    if (history.length === 0) return false;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    dispatch({ type: 'UNDO', previousState: prev });

    await recordEvent('undo', prev.scoreA, prev.scoreB, prev.currentSet);
    await supabase
      .from('matches')
      .update({
        score_a: prev.scoreA,
        score_b: prev.scoreB,
        sets_a: prev.setsA,
        sets_b: prev.setsB,
        current_set: prev.currentSet,
      })
      .eq('id', matchId);

    return true;
  }, [history, matchId, recordEvent]);

  // -------------------------------------------------------------------------
  // Non-scoring events (fault / let / timeout)
  // -------------------------------------------------------------------------
  const callFault = useCallback(async () => {
    if (!state) return;
    dispatch({ type: 'FAULT' });
    await recordEvent('fault', state.scoreA, state.scoreB, state.currentSet);
  }, [state, recordEvent]);

  const callLet = useCallback(async () => {
    if (!state) return;
    dispatch({ type: 'LET' });
    await recordEvent('let', state.scoreA, state.scoreB, state.currentSet);
  }, [state, recordEvent]);

  const callTimeout = useCallback(async () => {
    if (!state) return;
    dispatch({ type: 'TIMEOUT' });
    await recordEvent('timeout', state.scoreA, state.scoreB, state.currentSet);
  }, [state, recordEvent]);

  return {
    loading,
    error,
    state,
    history,
    scorePoint,
    confirmSetEnd,
    undoPoint,
    callFault,
    callLet,
    callTimeout,
  };
}
