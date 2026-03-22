'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Zap, Shield, Eye, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Match } from '@/types';
import { MatchCard } from '@/components/ui/MatchCard';
import { StatCard } from '@/components/ui/StatCard';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { LiveDot } from '@/components/ui/LiveDot';
import { getEloTier } from '@/lib/utils';

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Match | null>(null);
  const [stats, setStats] = useState({ wins: 0, losses: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

    // Load user's recent matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(id, display_name, avatar_url),
        player_b:user_profiles!matches_player_b_id_fkey(id, display_name, avatar_url),
        set_results(*)
      `)
      .or(`player_a_id.eq.${profile.id},player_b_id.eq.${profile.id}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(3);

    if (matchesData) {
      setRecentMatches(matchesData as Match[]);
      const wins = matchesData.filter((m) => m.winner_id === profile.id).length;
      setStats({ wins, losses: matchesData.length - wins, total: matchesData.length });
    }

    // Load live matches in club
    if (profile.club_id) {
      const { data: liveData } = await supabase
        .from('matches')
        .select(`
          *,
          sport:sports(*),
          player_a:user_profiles!matches_player_a_id_fkey(id, display_name, avatar_url),
          player_b:user_profiles!matches_player_b_id_fkey(id, display_name, avatar_url)
        `)
        .eq('club_id', profile.club_id)
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(5);

      if (liveData) setLiveMatches(liveData as Match[]);
    }

    // Umpire assignment
    if (profile.role === 'umpire' || profile.role === 'club_admin') {
      const { data: assignedMatch } = await supabase
        .from('matches')
        .select(`
          *,
          sport:sports(*),
          player_a:user_profiles!matches_player_a_id_fkey(id, display_name, avatar_url),
          player_b:user_profiles!matches_player_b_id_fkey(id, display_name, avatar_url)
        `)
        .eq('umpire_id', profile.id)
        .in('status', ['pending', 'live'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (assignedMatch) setActiveAssignment(assignedMatch as Match);
    }

    setLoading(false);
  };

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-32 rounded-card" />
        <div className="skeleton h-24 rounded-card" />
        <div className="skeleton h-24 rounded-card" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl fade-in">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-sm text-muted" style={{ fontFamily: 'var(--font-body)' }}>
            {greetingTime()},
          </p>
          <h1
            className="text-2xl font-bold text-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {profile?.display_name?.split(' ')[0] || 'Athlete'} 👋
          </h1>
        </div>
        <RoleBadge role={profile?.role || 'player'} />
      </div>

      {/* Umpire active match card */}
      {activeAssignment && (
        <div className="bg-navy rounded-card p-4 slide-up">
          <div className="flex items-center gap-2 mb-3">
            <LiveDot color="orange" />
            <span
              className="text-xs font-semibold text-orange uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your match is live
            </span>
          </div>
          <p
            className="text-chalk font-semibold mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {activeAssignment.player_a?.display_name} vs {activeAssignment.player_b?.display_name}
          </p>
          <p className="text-chalk/50 text-sm mb-4">
            {activeAssignment.sport?.name} · Set {activeAssignment.current_set}
          </p>
          <button
            onClick={() => router.push(`/match/${activeAssignment.id}/score`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange text-white text-sm font-semibold rounded-lg hover:bg-orange/90"
            style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
          >
            <Zap size={16} />
            {activeAssignment.status === 'live' ? 'Continue Scoring' : 'Start Scoring'}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Rating"
          value={profile?.elo_rating?.toLocaleString() || '1200'}
          sub={getEloTier(profile?.elo_rating || 1200)}
          trend="up"
        />
        <StatCard
          label="Wins"
          value={stats.wins}
          sub={`of ${stats.total} recent`}
        />
        <StatCard
          label="Losses"
          value={stats.losses}
        />
      </div>

      {/* Admin quick actions */}
      {profile?.role === 'club_admin' && (
        <div>
          <h2
            className="text-sm font-semibold text-navy mb-3 uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/manage/matches/new"
              className="flex items-center gap-3 p-4 bg-white rounded-card border border-border hover:border-orange/40 transition-colors"
              style={{ minHeight: '64px' }}
            >
              <div className="w-9 h-9 rounded-lg bg-orange/10 flex items-center justify-center">
                <Plus size={18} className="text-orange" />
              </div>
              <span
                className="text-sm font-semibold text-navy"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                New Match
              </span>
            </Link>
            <Link
              href="/manage/tournaments/new"
              className="flex items-center gap-3 p-4 bg-white rounded-card border border-border hover:border-orange/40 transition-colors"
              style={{ minHeight: '64px' }}
            >
              <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center">
                <Shield size={18} className="text-navy" />
              </div>
              <span
                className="text-sm font-semibold text-navy"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                New Tournament
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <div>
          <h2
            className="text-sm font-semibold text-navy mb-3 flex items-center gap-2 uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <LiveDot color="orange" size="sm" />
            Live now at your club
          </h2>
          <div className="space-y-3">
            {liveMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onClick={() => router.push(`/watch/${match.share_token}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-semibold text-navy uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Recent results
          </h2>
          <Link
            href="/matches"
            className="text-xs text-orange font-medium hover:underline"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            View all
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <div className="bg-white rounded-card border border-border p-8 text-center">
            <TrendingUp size={32} className="text-muted mx-auto mb-3 opacity-40" />
            <p
              className="text-sm font-semibold text-navy mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No matches yet
            </p>
            <p className="text-xs text-muted">
              Your completed matches will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={profile?.id}
                onClick={() => router.push(`/matches/${match.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
