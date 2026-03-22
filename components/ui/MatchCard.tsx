'use client';

import { Match } from '@/types';
import { cn, timeAgo, getSportAccentColor } from '@/lib/utils';
import { LiveDot } from './LiveDot';

interface MatchCardProps {
  match: Match;
  currentUserId?: string;
  onClick?: () => void;
  className?: string;
}

export function MatchCard({ match, currentUserId, onClick, className }: MatchCardProps) {
  const sport = match.sport;
  const accentColor = getSportAccentColor(sport);
  const isLive = match.status === 'live';

  const playerA = match.player_a;
  const playerB = match.player_b;

  // Determine if current user won
  let wlBadge: 'W' | 'L' | null = null;
  if (match.status === 'completed' && currentUserId && match.winner_id) {
    wlBadge = match.winner_id === currentUserId ? 'W' : 'L';
  }

  // Build score string
  const scoreStr = match.set_results && match.set_results.length > 0
    ? match.set_results.map((s) => `${s.score_a}–${s.score_b}`).join(', ')
    : `${match.score_a}–${match.score_b}`;

  return (
    <div
      className={cn(
        'bg-white rounded-card border border-border p-4 cursor-pointer match-card-hover transition-all duration-150',
        className
      )}
      style={{ borderLeft: `3px solid ${accentColor}` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sport?.icon || '🏅'}</span>
          <span
            className="text-xs font-medium"
            style={{ color: accentColor, fontFamily: 'var(--font-display)' }}
          >
            {sport?.name || 'Sport'}
          </span>
          {isLive && (
            <div className="flex items-center gap-1">
              <LiveDot color="orange" size="sm" />
              <span className="text-xs text-orange font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                Live
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {wlBadge && (
            <span
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-pill',
                wlBadge === 'W'
                  ? 'bg-lime/20 text-[#5A7A00]'
                  : 'bg-orange/15 text-orange'
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {wlBadge}
            </span>
          )}
          <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>
            {timeAgo(match.created_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy" style={{ fontFamily: 'var(--font-display)' }}>
            {playerA?.display_name || 'Player A'}
            <span className="font-normal text-muted mx-2">vs</span>
            {playerB?.display_name || 'Player B'}
          </p>
        </div>
        {match.status !== 'pending' && (
          <p
            className="text-sm font-semibold ml-3"
            style={{ fontFamily: 'var(--font-mono)', color: '#0D1B2A' }}
          >
            {scoreStr}
          </p>
        )}
      </div>
    </div>
  );
}
