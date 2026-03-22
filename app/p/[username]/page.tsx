'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { UserProfile, Match } from '@/types';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { MatchCard } from '@/components/ui/MatchCard';
import { StatCard } from '@/components/ui/StatCard';
import { getEloTier, formatMatchScore, getSportAccentColor } from '@/lib/utils';

const SPORT_ICONS: Record<string, string> = {
  badminton: '🏸',
  pickleball: '🥒',
  tennis: '🎾',
  cricket: '🏏',
  basketball: '🏀',
  squash: '🎱',
};

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);

    // Lookup by username
    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(profileData as UserProfile);

    // Load recent completed matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(id, display_name, avatar_url, username),
        player_b:user_profiles!matches_player_b_id_fkey(id, display_name, avatar_url, username),
        set_results(*)
      `)
      .or(`player_a_id.eq.${profileData.id},player_b_id.eq.${profileData.id}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (matchesData) {
      setMatches(matchesData as Match[]);
      const wins = matchesData.filter((m) => m.winner_id === profileData.id).length;
      setStats({ wins, losses: matchesData.length - wins, total: matchesData.length });
    }

    setLoading(false);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-chalk flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-chalk flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-6xl">🎾</p>
        <h1
          className="text-2xl font-bold text-navy"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Player not found
        </h1>
        <p className="text-muted text-sm">
          No Playr profile exists for <strong>@{username}</strong>.
        </p>
        <Link
          href="/"
          className="mt-2 px-6 py-3 bg-navy text-chalk text-sm font-semibold rounded-lg hover:bg-navy/90 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Go to Playr →
        </Link>
      </div>
    );
  }

  const sportIcon = SPORT_ICONS[profile.primary_sport ?? ''] ?? '🏅';
  const accentColor = getSportAccentColor({ slug: profile.primary_sport } as any);
  const initials = profile.display_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-chalk">
      {/* Hero */}
      <div
        className="px-6 pt-12 pb-8 flex flex-col items-center text-center"
        style={{ background: `linear-gradient(160deg, ${accentColor}22 0%, transparent 60%)` }}
      >
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg overflow-hidden"
          style={{ backgroundColor: accentColor, color: '#fff' }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Name & handle */}
        <h1
          className="text-2xl font-bold text-navy leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {profile.display_name}
        </h1>
        <p className="text-sm text-muted mt-0.5 mb-3">@{profile.username}</p>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <RoleBadge role={profile.role} />
          {profile.primary_sport && (
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                fontFamily: 'var(--font-display)',
              }}
            >
              {sportIcon} {profile.primary_sport.charAt(0).toUpperCase() + profile.primary_sport.slice(1)}
            </span>
          )}
          {profile.city && (
            <span
              className="text-xs text-muted px-2 py-1 bg-white rounded-full border border-border"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              📍 {profile.city}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Rating"
            value={profile.elo_rating?.toLocaleString() ?? '1200'}
            sub={getEloTier(profile.elo_rating ?? 1200)}
            trend="up"
          />
          <StatCard
            label="Wins"
            value={stats.wins}
            sub={`of ${stats.total}`}
          />
          <StatCard
            label="Losses"
            value={stats.losses}
          />
        </div>

        {/* Match history */}
        <h2
          className="text-sm font-semibold text-navy uppercase tracking-wide mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Recent matches
        </h2>

        {matches.length === 0 ? (
          <div className="bg-white rounded-card border border-border p-8 text-center">
            <p className="text-4xl mb-3">🏸</p>
            <p
              className="text-sm font-semibold text-navy"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No matches yet
            </p>
            <p className="text-xs text-muted mt-1">
              {profile.display_name.split(' ')[0]}'s match history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={profile.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-muted mb-3" style={{ fontFamily: 'var(--font-body)' }}>
          Tracked on Playr
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-chalk text-sm font-semibold rounded-lg hover:bg-navy/90 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black"
            style={{ backgroundColor: '#B6F000', color: '#0D1B2A' }}
          >
            P▶
          </span>
          Join Playr free
        </Link>
      </div>
    </div>
  );
}
