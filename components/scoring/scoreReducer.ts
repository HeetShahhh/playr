import { ScoreState, ScoreAction, SetResult } from '@/types';
import { checkSetEnd, checkMatchEnd } from '@/lib/utils';

export function scoreReducer(state: ScoreState, action: ScoreAction): ScoreState {
  const { sport } = state;

  switch (action.type) {
    case 'POINT_A': {
      const newScoreA = state.scoreA + 1;
      const newScoreB = state.scoreB;

      if (checkSetEnd(newScoreA, newScoreB, sport)) {
        return {
          ...state,
          scoreA: newScoreA,
          scoreB: newScoreB,
          lastEventTime: Date.now(),
        };
      }

      return {
        ...state,
        scoreA: newScoreA,
        lastEventTime: Date.now(),
      };
    }

    case 'POINT_B': {
      const newScoreA = state.scoreA;
      const newScoreB = state.scoreB + 1;

      if (checkSetEnd(newScoreA, newScoreB, sport)) {
        return {
          ...state,
          scoreA: newScoreA,
          scoreB: newScoreB,
          lastEventTime: Date.now(),
        };
      }

      return {
        ...state,
        scoreB: newScoreB,
        lastEventTime: Date.now(),
      };
    }

    case 'SET_END': {
      const { winner, finalScoreA, finalScoreB } = action;
      const newSetsA = state.setsA + (winner === 'a' ? 1 : 0);
      const newSetsB = state.setsB + (winner === 'b' ? 1 : 0);

      const newSetResult: SetResult = {
        id: Math.random().toString(36).slice(2),
        match_id: state.matchId,
        set_number: state.currentSet,
        score_a: finalScoreA,
        score_b: finalScoreB,
        winner,
      };

      return {
        ...state,
        setsA: newSetsA,
        setsB: newSetsB,
        scoreA: 0,
        scoreB: 0,
        currentSet: state.currentSet + 1,
        setResults: [...state.setResults, newSetResult],
        status: checkMatchEnd(newSetsA, newSetsB, sport) ? 'completed' : 'live',
        winnerId: checkMatchEnd(newSetsA, newSetsB, sport)
          ? newSetsA > newSetsB ? state.playerA.id : state.playerB.id
          : undefined,
      };
    }

    case 'MATCH_END': {
      return {
        ...state,
        status: 'completed',
        winnerId: action.winnerId,
      };
    }

    case 'UNDO': {
      return action.previousState;
    }

    default:
      return state;
  }
}
