'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Match } from '@/types';
import { MatchCard } from '@/components/ui/MatchCard';
import { cn } from '@/lib/utils';

const FILTERS = ['All', 'Badminton', 'Pickleball', 'Tennis'];

export default function MatchesPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadMatches();
  }, [profile]);

  const loadMatches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(id, display_name, avatar_url),
        player_b:user_profiles!matches_player_b_id_fkey(id, display_name, avatar_url),
        set_results(*)
      `)
      .or(`player_a_id.eq.${profile!.id},player_b_id.eq.${profile!.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setMatches(data as Match[]);
    setLoading(false);
  };

  const filtered = activeFilter === 'All'
    ? matches
    : matches.filter((m) => m.sport?.name === activeFilter);

  return (
    <div className="p-4 max-w-2xl fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-5">
        <h1
          className="text-2xl font-bold text-navy"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Matches
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Filter size={14} />
          <span>{filtered.length} matches</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap transition-colors shrink-0',
              activeFilter === f
                ? 'bg-navy text-chalk'
                : 'bg-white border border-border text-muted hover:text-navy hover:border-navy/30'
            )}
            style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Matches list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p
            className="text-navy font-semibold mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No matches yet
          </p>
          <p className="text-sm text-muted">
            {activeFilter === 'All'
              ? 'Completed matches will appear here.'
              : `No ${activeFilter} matches found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => (
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
  );
}
