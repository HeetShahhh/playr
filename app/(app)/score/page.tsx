'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Match } from '@/types';
import { LiveDot } from '@/components/ui/LiveDot';

export default function ScoreRedirectPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadAssignments();
  }, [profile]);

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(id, display_name),
        player_b:user_profiles!matches_player_b_id_fkey(id, display_name)
      `)
      .eq('umpire_id', profile!.id)
      .in('status', ['pending', 'live'])
      .order('created_at', { ascending: false });

    if (data) setAssignments(data as Match[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton h-32 rounded-card" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg fade-in">
      <h1
        className="text-2xl font-bold text-navy pt-2 mb-5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Your assignments
      </h1>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-card border border-border p-8 text-center">
          <Zap size={32} className="text-muted mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-navy mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            No matches assigned
          </p>
          <p className="text-sm text-muted">
            Ask your club admin to assign you as umpire for a match.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-card border border-border p-4 cursor-pointer match-card-hover"
              style={{ borderLeft: `3px solid ${match.sport?.accent_color}` }}
              onClick={() => router.push(`/match/${match.id}/score`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{match.sport?.icon}</span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: match.sport?.accent_color, fontFamily: 'var(--font-display)' }}
                  >
                    {match.sport?.name}
                  </span>
                  {match.status === 'live' && (
                    <div className="flex items-center gap-1">
                      <LiveDot color="orange" size="sm" />
                      <span className="text-xs text-orange font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                        Live
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-navy mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {match.player_a?.display_name} vs {match.player_b?.display_name}
              </p>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-orange text-white text-xs font-bold rounded-lg"
                style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
              >
                <Zap size={14} />
                {match.status === 'live' ? 'Continue scoring' : 'Start scoring'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
