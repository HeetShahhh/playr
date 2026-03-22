/**
 * Playr scoring state machine
 * Pure useReducer — zero side effects here.
 * Side effects (Supabase write, Dexie write) live in hooks/useMatch.ts
 */
import { Sport, UserProfile, SetResult } from '@/types';
import { checkSetEnd, checkMatchEnd } from '@/lib/utils';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export interface ScoringState {
  matchId: string;
  sport: Sport;
  playerA: UserProfile;
  playerB: UserProfile;
  /** Current-set score for player A */
  scoreA: number;
  /** Current-set score for player B */
  scoreB: number;
  /** Sets won by player A */
  setsA: number;
  /** Sets won by player B */
  setsB: number;
  /** 1-indexed current set number */
  currentSet: number;
  /** Completed set breakdown */
  setHistory: SetResult[];
  /** Chronological log of every event dispatched (no writes — for replay / undo) */
  events: ScoringEvent[];
  status: 'live' | 'completed';
  winnerId?: string;
  /** Epoch ms of the most recent scoring action */
  lastEventTime?: number;
}

export interface ScoringEvent {
  id: string;
  type: ScoringAction['type'];
  scoreA: number;
  scoreB: number;
  set: number;
  ts: number;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------
export type ScoringAction =
  | { type: 'POINT_A' }
  | { type: 'POINT_B' }
  | { type: 'UNDO'; previousState: ScoringState }
  | { type: 'FAULT' }
  | { type: 'LET' }
  | { type: 'TIMEOUT' }
  | { type: 'SET_END'; winner: 'a' | 'b'; finalScoreA: number; finalScoreB: number }
  | { type: 'MATCH_END'; winnerId: string };

// ---------------------------------------------------------------------------
// Helper — build an event record
// ---------------------------------------------------------------------------
function mkEvent(
  type: ScoringAction['type'],
  state: Pick<ScoringState, 'scoreA' | 'scoreB' | 'currentSet'>
): ScoringEvent {
  return {
    id: Math.random().toString(36).slice(2),
    type,
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    set: state.currentSet,
    ts: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Reducer — pure function
// ---------------------------------------------------------------------------
export function scoringReducer(state: ScoringState, action: ScoringAction): ScoringState {
  if (state.status === 'completed' && action.type !== 'UNDO') return state;

  switch (action.type) {
    // ---- Scoring -----------------------------------------------------------
    case 'POINT_A': {
      const scoreA = state.scoreA + 1;
      const scoreB = state.scoreB;
      const setOver = checkSetEnd(scoreA, scoreB, state.sport);
      return {
        ...state,
        scoreA,
        lastEventTime: Date.now(),
        events: [...state.events, mkEvent('POINT_A', { scoreA, scoreB, currentSet: state.currentSet })],
        // Keep score frozen when set ends — SET_END is dispatched separately
      };
    }

    case 'POINT_B': {
      const scoreA = state.scoreA;
      const scoreB = state.scoreB + 1;
      return {
        ...state,
        scoreB,
        lastEventTime: Date.now(),
        events: [...state.events, mkEvent('POINT_B', { scoreA, scoreB, currentSet: state.currentSet })],
      };
    }

    // ---- Set / match end ---------------------------------------------------
    case 'SET_END': {
      const { winner, finalScoreA, finalScoreB } = action;
      const setsA = state.setsA + (winner === 'a' ? 1 : 0);
      const setsB = state.setsB + (winner === 'b' ? 1 : 0);

      const setResult: SetResult = {
        id: Math.random().toString(36).slice(2),
        match_id: state.matchId,
        set_number: state.currentSet,
        score_a: finalScoreA,
        score_b: finalScoreB,
        winner,
      };

      const matchOver = checkMatchEnd(setsA, setsB, state.sport);
      const winnerId = matchOver
        ? setsA > setsB ? state.playerA.id : state.playerB.id
        : undefined;

      return {
        ...state,
        setsA,
        setsB,
        scoreA: 0,
        scoreB: 0,
        currentSet: state.currentSet + 1,
        setHistory: [...state.setHistory, setResult],
        status: matchOver ? 'completed' : 'live',
        winnerId,
        lastEventTime: Date.now(),
        events: [
          ...state.events,
          mkEvent('SET_END', { scoreA: finalScoreA, scoreB: finalScoreB, currentSet: state.currentSet }),
        ],
      };
    }

    case 'MATCH_END': {
      return {
        ...state,
        status: 'completed',
        winnerId: action.winnerId,
        lastEventTime: Date.now(),
        events: [
          ...state.events,
          mkEvent('MATCH_END', { scoreA: state.scoreA, scoreB: state.scoreB, currentSet: state.currentSet }),
        ],
      };
    }

    // ---- Non-scoring events (recorded for log only, no score change) -------
    case 'FAULT':
    case 'LET':
    case 'TIMEOUT': {
      return {
        ...state,
        lastEventTime: Date.now(),
        events: [
          ...state.events,
          mkEvent(action.type, { scoreA: state.scoreA, scoreB: state.scoreB, currentSet: state.currentSet }),
        ],
      };
    }

    // ---- Undo — restore previous snapshot ----------------------------------
    case 'UNDO': {
      return action.previousState;
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Factory — initialise state from a DB match row
// ---------------------------------------------------------------------------
export function initialScoringState(match: {
  id: string;
  sport: Sport;
  player_a: UserProfile;
  player_b: UserProfile;
  score_a: number;
  score_b: number;
  sets_a: number;
  sets_b: number;
  current_set: number;
  status: 'pending' | 'live' | 'completed' | 'cancelled';
  winner_id?: string | null;
  set_results?: SetResult[];
}): ScoringState {
  return {
    matchId: match.id,
    sport: match.sport,
    playerA: match.player_a,
    playerB: match.player_b,
    scoreA: match.score_a,
    scoreB: match.score_b,
    setsA: match.sets_a,
    setsB: match.sets_b,
    currentSet: match.current_set,
    setHistory: match.set_results ?? [],
    events: [],
    status: match.status === 'completed' ? 'completed' : 'live',
    winnerId: match.winner_id ?? undefined,
  };
}
