'use client';

import { TournamentMatch } from '@/types';
import { cn } from '@/lib/utils';

interface BracketMatch {
  id: string;
  round: number;
  position: number;
  playerAName?: string;
  playerBName?: string;
  scoreA?: number;
  scoreB?: number;
  winnerName?: string;
  status?: string;
}

interface TournamentBracketProps {
  matches: BracketMatch[];
  totalRounds: number;
}

const ROUND_LABELS: Record<number, string> = {
  1: 'Quarter-final',
  2: 'Semi-final',
  3: 'Final',
};

export function TournamentBracket({ matches, totalRounds }: TournamentBracketProps) {
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max px-2">
        {rounds.map((round) => {
          const roundMatches = matches
            .filter((m) => m.round === round)
            .sort((a, b) => a.position - b.position);

          const label = round === totalRounds
            ? 'Final'
            : round === totalRounds - 1
            ? 'Semi-final'
            : `Round ${round}`;

          return (
            <div key={round} className="flex flex-col">
              <p
                className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 text-center"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {label}
              </p>
              <div
                className="flex flex-col"
                style={{ gap: `${Math.pow(2, round - 1) * 8}px` }}
              >
                {roundMatches.map((m) => (
                  <BracketCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketCard({ match }: { match: BracketMatch }) {
  const isCompleted = match.status === 'completed';

  return (
    <div className="w-44 bg-white rounded-lg border border-border overflow-hidden shadow-sm">
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b border-border',
        isCompleted && match.winnerName === match.playerAName ? 'bg-lime/10' : ''
      )}>
        <span
          className="text-xs font-medium text-navy truncate flex-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {match.playerAName || 'TBD'}
        </span>
        {match.scoreA !== undefined && (
          <span
            className="text-xs font-bold text-navy ml-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {match.scoreA}
          </span>
        )}
      </div>
      <div className={cn(
        'flex items-center justify-between px-3 py-2',
        isCompleted && match.winnerName === match.playerBName ? 'bg-lime/10' : ''
      )}>
        <span
          className="text-xs font-medium text-navy truncate flex-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {match.playerBName || 'TBD'}
        </span>
        {match.scoreB !== undefined && (
          <span
            className="text-xs font-bold text-navy ml-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {match.scoreB}
          </span>
        )}
      </div>
    </div>
  );
}
