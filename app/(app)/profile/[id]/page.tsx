'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { UserProfile, Match } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { MatchCard } from '@/components/ui/MatchCard';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { getEloTier, getWinRate, timeAgo, getSportAccentColor } from '@/lib/utils';

const SPORT_SLUGS_PLAYED = ['badminton', 'pickleball', 'tennis'];
const SPORT_ICONS: Record<string, string> = {
  badminton: '🏸', pickleball: '🥒', tennis: '🎾',
  cricket: '🏏', basketball: '🏀', squash: '🎱',
};

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile: currentProfile } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [displayedCount, setDisplayedCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, sportsPlayed: new Set<string>() });

  const profileId = id === 'me' ? currentProfile?.id : id;

  useEffect(() => {
    if (!profileId) return;
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    setLoading(true);
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileData) setProfile(profileData as UserProfile);

    const { data: matchData } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(id, display_name),
        player_b:user_profiles!matches_player_b_id_fkey(id, display_name),
        set_results(*)
      `)
      .or(`player_a_id.eq.${profileId},player_b_id.eq.${profileId}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(30);

    if (matchData) {
      setMatches(matchData as Match[]);
      const wins = matchData.filter((m) => m.winner_id === profileId).length;
      const sportsPlayed = new Set(matchData.map((m) => m.sport?.slug).filter(Boolean) as string[]);
      setStats({ total: matchData.length, wins, losses: matchData.length - wins, sportsPlayed });
    }
    setLoading(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${profileId}`;
    if (navigator.share) {
      await navigator.share({ title: `${profile?.display_name} on Scorely`, url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Profile link copied!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-24 rounded-card" />
        <div className="skeleton h-20 rounded-card" />
        <div className="skeleton h-20 rounded-card" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center py-20">
        <p className="text-muted">Profile not found.</p>
      </div>
    );
  }

  const isOwnProfile = profileId === currentProfile?.id;

  return (
    <div className="p-4 space-y-5 max-w-lg fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-navy transition-colors pt-2 min-h-[44px]"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile header */}
      <div className="bg-white rounded-card border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-chalk text-2xl font-bold shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.display_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1
                className="text-xl font-bold text-navy"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {profile.display_name}
              </h1>
              <button
                onClick={handleShare}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface hover:bg-border transition-colors"
                aria-label="Share profile"
              >
                <Share2 size={16} className="text-muted" />
              </button>
            </div>
            <RoleBadge role={profile.role} className="mt-1" />
            {/* Sports played badges */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {SPORT_SLUGS_PLAYED.filter((s) => stats.sportsPlayed.has(s)).map((slug) => (
                <span
                  key={slug}
                  className="text-base"
                  title={slug.charAt(0).toUpperCase() + slug.slice(1)}
                >
                  {SPORT_ICONS[slug]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rating card */}
      <div className="bg-navy rounded-card p-4">
        <p className="text-xs text-chalk/50 uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Rating
        </p>
        <div className="flex items-center justify-between">
          <span
            className="text-3xl font-bold text-lime"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {profile.elo_rating?.toLocaleString() || '1,200'}
          </span>
          <span
            className="text-xs text-chalk/50 font-medium"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {getEloTier(profile.elo_rating || 1200)} in city
          </span>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2
          className="text-xs font-semibold text-muted uppercase tracking-wider mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Stats
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Matches" value={stats.total} />
          <StatCard label="Wins" value={stats.wins} />
          <StatCard label="Win rate" value={getWinRate(stats.wins, stats.total)} />
        </div>
      </div>

      {/* Match history */}
      <div>
        <h2
          className="text-xs font-semibold text-muted uppercase tracking-wider mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Match history
        </h2>
        {matches.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No completed matches yet.</p>
        ) : (
          <div className="space-y-3">
            {matches.slice(0, displayedCount).map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={profileId}
              />
            ))}
            {displayedCount < matches.length && (
              <button
                onClick={() => setDisplayedCount((n) => n + 5)}
                className="w-full py-3 text-sm text-muted hover:text-navy transition-colors font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Load more ({matches.length - displayedCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
