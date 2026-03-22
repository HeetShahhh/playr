import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sport } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMatchScore(setResults: Array<{ score_a: number; score_b: number }>, forPlayer: 'a' | 'b'): string {
  return setResults
    .map((s) => (forPlayer === 'a' ? `${s.score_a}–${s.score_b}` : `${s.score_b}–${s.score_a}`))
    .join(', ');
}

export function getWinRate(wins: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((wins / total) * 100)}%`;
}

export function getEloTier(elo: number): string {
  if (elo >= 1800) return 'Top 5%';
  if (elo >= 1600) return 'Top 10%';
  if (elo >= 1400) return 'Top 23%';
  if (elo >= 1200) return 'Top 50%';
  return 'Getting started';
}

export function getSportAccentColor(sport?: Sport): string {
  const colorMap: Record<string, string> = {
    badminton: '#00A86B',
    pickleball: '#FF6B35',
    tennis: '#E8A020',
    cricket: '#1A5CFF',
    basketball: '#E83038',
    squash: '#8B5CF6',
  };
  return sport ? (colorMap[sport.slug] || '#0D1B2A') : '#0D1B2A';
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function generateShareUrl(shareToken: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/watch/${shareToken}`;
}

export function checkSetEnd(scoreA: number, scoreB: number, sport: Sport): boolean {
  const { points_per_set, win_by_margin, max_cap } = sport;
  if (scoreA >= max_cap || scoreB >= max_cap) return true;
  if (scoreA >= points_per_set && scoreA - scoreB >= win_by_margin) return true;
  if (scoreB >= points_per_set && scoreB - scoreA >= win_by_margin) return true;
  return false;
}

export function checkMatchEnd(setsA: number, setsB: number, sport: Sport): boolean {
  return setsA >= sport.sets_to_win || setsB >= sport.sets_to_win;
}
