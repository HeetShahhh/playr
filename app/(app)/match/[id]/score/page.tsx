'use client';

import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { writeEventLocally, syncPendingEvents } from '@/lib/db';
import { Toast } from '@/components/ui/Toast';
import { ScoreNumber } from '@/components/ui/ScoreNumber';

// ── Sport config ────────────────────────────────────────────────────────────
interface SportRule {
  name:        string;
  accent:      string;
  pointsToWin: number;
  winBy:       number;
  cap:         number;
  setsToWin:   number;
}

const SPORT_RULES: Record<string, SportRule> = {
  badminton:  { name: 'Badminton',  accent: '#00A86B', pointsToWin: 21, winBy: 2, cap: 30, setsToWin: 2 },
  pickleball: { name: 'Pickleball', accent: '#FF6B35', pointsToWin: 11, winBy: 2, cap: 15, setsToWin: 2 },
  tennis:     { name: 'Tennis',     accent: '#E8A020', pointsToWin:  6, winBy: 2, cap:  7, setsToWin: 2 },
};

// Tennis point display sequence
const TENNIS_POINTS = ['0', '15', '30', '40'];

// ── State machine ────────────────────────────────────────────────────────────
interface State {
  matchId:     string;
  sportSlug:   string;
  playerAName: string;
  playerBName: string;
  shareToken:  string;
  scoreA:      number;
  scoreB:      number;
  setsA:       number;
  setsB:       number;
  currentSet:  number;
  setHistory:  Array<{ scoreA: number; scoreB: number; winner: 'a' | 'b' }>;
  status:      'live' | 'completed';
  winnerName?: string;
  // Tennis deuce tracking
  deuce:       boolean;
  advA:        boolean;
  advB:        boolean;
}

type Action =
  | { type: 'INIT'; payload: State }
  | { type: 'SCORE'; side: 'a' | 'b'; rules: SportRule }
  | { type: 'CONFIRM_SET'; rules: SportRule }
  | { type: 'UNDO'; prev: State };

function checkSetEnd(scoreA: number, scoreB: number, rules: SportRule): boolean {
  if (scoreA >= rules.cap || scoreB >= rules.cap) return true;
  if (scoreA >= rules.pointsToWin && scoreA - scoreB >= rules.winBy) return true;
  if (scoreB >= rules.pointsToWin && scoreB - scoreA >= rules.winBy) return true;
  return false;
}

function checkMatchEnd(setsA: number, setsB: number, rules: SportRule): boolean {
  return setsA >= rules.setsToWin || setsB >= rules.setsToWin;
}

function reducer(state: State, action: Action): State {
  if (action.type === 'INIT') return action.payload;
  if (action.type === 'UNDO') return action.prev;

  if (action.type === 'SCORE') {
    const { side, rules } = action;
    let { scoreA, scoreB, deuce, advA, advB } = state;

    // Tennis deuce logic
    if (state.sportSlug === 'tennis') {
      if (deuce) {
        if (side === 'a') {
          if (advB) return { ...state, advA: false, advB: false };
          if (advA) {
            // Game A
            return reducer({ ...state, scoreA: scoreA + 1, deuce: false, advA: false, advB: false }, { type: 'CONFIRM_SET', rules });
          }
          return { ...state, advA: true, advB: false };
        } else {
          if (advA) return { ...state, advA: false, advB: false };
          if (advB) {
            return reducer({ ...state, scoreB: scoreB + 1, deuce: false, advA: false, advB: false }, { type: 'CONFIRM_SET', rules });
          }
          return { ...state, advA: false, advB: true };
        }
      }
      // Normal tennis scoring
      const newA = side === 'a' ? scoreA + 1 : scoreA;
      const newB = side === 'b' ? scoreB + 1 : scoreB;
      // Check deuce (both at 3 = "40-40")
      if (newA === 3 && newB === 3) {
        return { ...state, scoreA: newA, scoreB: newB, deuce: true, advA: false, advB: false };
      }
      const next = { ...state, scoreA: newA, scoreB: newB };
      if (checkSetEnd(newA, newB, rules)) {
        return reducer(next, { type: 'CONFIRM_SET', rules });
      }
      return next;
    }

    // Badminton / Pickleball
    const newScoreA = side === 'a' ? scoreA + 1 : scoreA;
    const newScoreB = side === 'b' ? scoreB + 1 : scoreB;
    const next = { ...state, scoreA: newScoreA, scoreB: newScoreB };
    // Set end handled outside reducer — return pending state and let the page show overlay
    return next;
  }

  if (action.type === 'CONFIRM_SET') {
    const { rules } = action;
    const winner: 'a' | 'b' = state.scoreA > state.scoreB ? 'a' : 'b';
    const setsA = state.setsA + (winner === 'a' ? 1 : 0);
    const setsB = state.setsB + (winner === 'b' ? 1 : 0);
    const matchOver = checkMatchEnd(setsA, setsB, rules);

    return {
      ...state,
      setsA,
      setsB,
      scoreA:     0,
      scoreB:     0,
      deuce:      false,
      advA:       false,
      advB:       false,
      currentSet: state.currentSet + 1,
      setHistory: [...state.setHistory, { scoreA: state.scoreA, scoreB: state.scoreB, winner }],
      status:     matchOver ? 'completed' : 'live',
      winnerName: matchOver ? (winner === 'a' ? state.playerAName : state.playerBName) : undefined,
    };
  }

  return state;
}

const INITIAL: State = {
  matchId: '', sportSlug: '', playerAName: 'Player A', playerBName: 'Player B',
  shareToken: '', scoreA: 0, scoreB: 0, setsA: 0, setsB: 0, currentSet: 1,
  setHistory: [], status: 'live', deuce: false, advA: false, advB: false,
};

// ── Component ────────────────────────────────────────────────────────────────
type Overlay = 'set_end' | 'match_end' | null;

export default function ScoringPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [history, setHistory] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [tapSide, setTapSide] = useState<'a' | 'b' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmingSet, setConfirmingSet] = useState(false);

  const lastTapRef = useRef(0);
  const DEBOUNCE = 300;

  const rules = SPORT_RULES[state.sportSlug] ?? SPORT_RULES.badminton;

  // ── Load match ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    supabase
      .from('matches')
      .select('*, sport:sports(*), set_results(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) { router.push('/'); return; }

        const sportSlug = data.sport?.slug ?? 'badminton';
        const initial: State = {
          matchId:     data.id,
          sportSlug,
          playerAName: data.player_name_a ?? data.player_a?.display_name ?? 'Player A',
          playerBName: data.player_name_b ?? data.player_b?.display_name ?? 'Player B',
          shareToken:  data.share_token ?? '',
          scoreA:      data.score_a ?? 0,
          scoreB:      data.score_b ?? 0,
          setsA:       data.sets_a ?? 0,
          setsB:       data.sets_b ?? 0,
          currentSet:  data.current_set ?? 1,
          setHistory:  (data.set_results ?? []).map((r: any) => ({
            scoreA: r.score_a, scoreB: r.score_b, winner: r.winner,
          })),
          status:     data.status === 'completed' ? 'completed' : 'live',
          winnerName: undefined,
          deuce:      false,
          advA:       false,
          advB:       false,
        };
        dispatch({ type: 'INIT', payload: initial });
        if (data.status === 'completed') setOverlay('match_end');
        setLoading(false);
      });
  }, [id, router]);

  // ── Persist event ────────────────────────────────────────────────────────
  const recordEvent = useCallback(async (
    eventType: string, sA: number, sB: number, set: number
  ) => {
    const now = new Date().toISOString();
    await writeEventLocally({ matchId: id, eventType, scoreAAfter: sA, scoreBAfter: sB, setNumber: set, createdAt: now });
    supabase.from('match_events').insert({
      match_id: id, event_type: eventType,
      score_a_after: sA, score_b_after: sB, set_number: set, created_at: now,
    }).then(({ error }) => { if (!error) syncPendingEvents(); });
  }, [id]);

  // ── Score a point ────────────────────────────────────────────────────────
  const handleScore = useCallback(async (side: 'a' | 'b') => {
    const now = Date.now();
    if (now - lastTapRef.current < DEBOUNCE) return;
    if (state.status === 'completed' || overlay) return;
    lastTapRef.current = now;

    // Haptic
    navigator.vibrate?.(30);

    // Tap flash
    setTapSide(side);
    setTimeout(() => setTapSide(null), 180);

    // Snapshot for undo
    setHistory((prev) => [...prev.slice(-20), state]);

    // New scores
    const newA = side === 'a' ? state.scoreA + 1 : state.scoreA;
    const newB = side === 'b' ? state.scoreB + 1 : state.scoreB;

    dispatch({ type: 'SCORE', side, rules });

    // Persist
    await recordEvent(side === 'a' ? 'point_a' : 'point_b', newA, newB, state.currentSet);
    await supabase.from('matches').update({ score_a: newA, score_b: newB, status: 'live' }).eq('id', id);

    // Check set end (non-tennis) — slight delay so score renders first
    if (state.sportSlug !== 'tennis' && checkSetEnd(newA, newB, rules)) {
      setTimeout(() => setOverlay('set_end'), 380);
    }
  }, [state, overlay, rules, id, recordEvent]);

  // ── Confirm set end ──────────────────────────────────────────────────────
  const handleConfirmSet = useCallback(async () => {
    if (confirmingSet) return;
    setConfirmingSet(true);

    const winner: 'a' | 'b' = state.scoreA > state.scoreB ? 'a' : 'b';
    const setsA = state.setsA + (winner === 'a' ? 1 : 0);
    const setsB = state.setsB + (winner === 'b' ? 1 : 0);
    const matchOver = checkMatchEnd(setsA, setsB, rules);

    await supabase.from('set_results').insert({
      match_id: id, set_number: state.currentSet,
      score_a: state.scoreA, score_b: state.scoreB, winner,
    });

    dispatch({ type: 'CONFIRM_SET', rules });

    if (matchOver) {
      const winnerName = winner === 'a' ? state.playerAName : state.playerBName;
      await supabase.from('matches').update({
        sets_a: setsA, sets_b: setsB,
        score_a: 0, score_b: 0,
        current_set: state.currentSet + 1,
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', id);
      await recordEvent('match_end', 0, 0, state.currentSet);
      setOverlay('match_end');
    } else {
      await supabase.from('matches').update({
        sets_a: setsA, sets_b: setsB,
        score_a: 0, score_b: 0,
        current_set: state.currentSet + 1,
      }).eq('id', id);
      await recordEvent('set_end', 0, 0, state.currentSet);
      setOverlay(null);
    }
    setConfirmingSet(false);
  }, [state, rules, id, recordEvent, confirmingSet]);

  // ── Undo ─────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(async () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    dispatch({ type: 'UNDO', prev });
    setOverlay(null);
    await recordEvent('undo', prev.scoreA, prev.scoreB, prev.currentSet);
    await supabase.from('matches').update({
      score_a: prev.scoreA, score_b: prev.scoreB,
      sets_a: prev.setsA, sets_b: prev.setsB,
      current_set: prev.currentSet,
    }).eq('id', id);
  }, [history, id, recordEvent]);

  // ── Non-scoring events ───────────────────────────────────────────────────
  const callEvent = useCallback(async (type: 'fault' | 'let' | 'timeout') => {
    await recordEvent(type, state.scoreA, state.scoreB, state.currentSet);
    setToast(type === 'fault' ? 'Fault' : type === 'let' ? 'Let' : 'Timeout');
  }, [state, recordEvent]);

  // ── Share ────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/watch/${state.shareToken}`;
    navigator.clipboard.writeText(url).then(() => setToast('Link copied!'));
  }, [state.shareToken]);

  // ── Tennis score display ─────────────────────────────────────────────────
  const tennisDiplayA = state.deuce
    ? (state.advA ? 'Adv' : state.advB ? '' : 'Deuce')
    : TENNIS_POINTS[state.scoreA] ?? state.scoreA;
  const tennisDisplayB = state.deuce
    ? (state.advB ? 'Adv' : state.advA ? '' : 'Deuce')
    : TENNIS_POINTS[state.scoreB] ?? state.scoreB;

  const displayA = state.sportSlug === 'tennis' ? tennisDiplayA : state.scoreA;
  const displayB = state.sportSlug === 'tennis' ? tennisDisplayB : state.scoreB;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const prevSets = state.setHistory;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--navy)', maxWidth: '480px', margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: '48px', backgroundColor: rules.accent }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-white/90 hover:text-white"
          style={{ minHeight: '44px', fontFamily: 'var(--font-display)', fontSize: '14px' }}
        >
          <ArrowLeft size={16} />
          End
        </button>

        <div className="flex flex-col items-center">
          <span
            className="text-[13px] font-semibold text-white uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {rules.name} · Set {state.currentSet}
          </span>
          {prevSets.length > 0 && (
            <span className="text-[11px] text-white/70" style={{ fontFamily: 'var(--font-mono)' }}>
              {prevSets.map((s) => `${s.scoreA}–${s.scoreB}`).join('  ')}
            </span>
          )}
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-white/90 hover:text-white"
          style={{ minHeight: '44px', fontFamily: 'var(--font-display)', fontSize: '14px' }}
        >
          <Share2 size={16} />
        </button>
      </header>

      {/* ── Main scoring area (two halves) ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Player A */}
        <button
          className="flex-1 flex flex-col items-center justify-center select-none relative"
          style={{
            backgroundColor: tapSide === 'a' ? 'rgba(232,93,26,0.20)' : 'transparent',
            transition: 'background-color 180ms ease-out',
          }}
          onClick={() => handleScore('a')}
          disabled={state.status === 'completed' || !!overlay}
        >
          <span
            className="text-[15px] mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            {state.playerAName}
          </span>
          <ScoreNumber
            value={displayA}
            size={96}
            className=""
            animate
          />
          {/* Sets dots */}
          <div className="absolute bottom-5 flex gap-2">
            {Array.from({ length: rules.setsToWin }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: i < state.setsA ? 'var(--lime)' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
        </button>

        {/* Divider */}
        <div className="w-px self-stretch" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* Player B */}
        <button
          className="flex-1 flex flex-col items-center justify-center select-none relative"
          style={{
            backgroundColor: tapSide === 'b' ? 'rgba(232,93,26,0.20)' : 'transparent',
            transition: 'background-color 180ms ease-out',
          }}
          onClick={() => handleScore('b')}
          disabled={state.status === 'completed' || !!overlay}
        >
          <span
            className="text-[15px] mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            {state.playerBName}
          </span>
          <ScoreNumber
            value={displayB}
            size={96}
            className=""
            animate
          />
          <div className="absolute bottom-5 flex gap-2">
            {Array.from({ length: rules.setsToWin }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: i < state.setsB ? 'var(--lime)' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
        </button>
      </div>

      {/* ── Bottom strip ────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-around px-2 shrink-0"
        style={{ height: '52px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--navy-2)' }}
      >
        {(['Fault', 'Let', 'Timeout'] as const).map((label) => (
          <button
            key={label}
            onClick={() => callEvent(label.toLowerCase() as 'fault' | 'let' | 'timeout')}
            className="text-[13px] font-medium px-4 rounded transition-opacity hover:opacity-70"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-secondary)',
              minHeight: '44px',
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="flex items-center gap-1 text-[13px] font-medium px-4 rounded transition-opacity hover:opacity-70 disabled:opacity-25"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', minHeight: '44px' }}
        >
          <RotateCcw size={14} />
          Undo
        </button>
      </div>

      {/* ── Set-end overlay ─────────────────────────────────────────────── */}
      {overlay === 'set_end' && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
        >
          <p
            className="text-[16px] font-medium mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            Set {state.currentSet - 1 || state.currentSet} complete
          </p>
          <p
            className="text-[28px] font-bold text-white mb-3 text-center"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {state.scoreA > state.scoreB ? state.playerAName : state.playerBName} wins this set
          </p>
          <p
            className="text-[48px] font-bold mb-8"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--lime)' }}
          >
            {state.scoreA} — {state.scoreB}
          </p>
          <button
            onClick={handleConfirmSet}
            disabled={confirmingSet}
            className="w-full max-w-sm font-semibold text-white text-[16px] rounded-lg disabled:opacity-50"
            style={{ height: '56px', backgroundColor: 'var(--orange)', fontFamily: 'var(--font-display)' }}
          >
            Next set →
          </button>
        </div>
      )}

      {/* ── Match-end overlay ────────────────────────────────────────────── */}
      {overlay === 'match_end' && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
        >
          <p
            className="text-[16px] font-medium mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--lime)' }}
          >
            Match complete
          </p>
          <p
            className="text-[36px] font-bold text-white mb-2 text-center"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {state.winnerName ?? (state.setsA > state.setsB ? state.playerAName : state.playerBName)} wins
          </p>
          <p
            className="text-[18px] mb-2"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
          >
            {state.setsA} sets to {state.setsB}
          </p>
          <p
            className="text-[20px] mb-10"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
          >
            {state.setHistory.map((s) => `${s.scoreA}–${s.scoreB}`).join('  ·  ')}
          </p>

          <div className="w-full max-w-sm flex flex-col gap-3">
            <button
              onClick={handleShare}
              className="w-full font-semibold text-[16px] rounded-lg"
              style={{ height: '56px', backgroundColor: 'var(--lime)', color: 'var(--navy)', fontFamily: 'var(--font-display)' }}
            >
              Share result
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full font-semibold text-[16px] rounded-lg border text-white"
              style={{ height: '52px', borderColor: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-display)' }}
            >
              New match
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="text-[13px] text-center"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', minHeight: '44px' }}
            >
              Save to profile →
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
