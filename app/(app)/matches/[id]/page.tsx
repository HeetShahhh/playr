'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Match } from '@/types';
import { ShareButton } from '@/components/ui/ShareButton';
import { getSportAccentColor, timeAgo } from '@/lib/utils';

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatch();
  }, [id]);

  const loadMatch = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports(*),
        player_a:user_profiles!matches_player_a_id_fkey(*),
        player_b:user_profiles!matches_player_b_id_fkey(*),
        set_results(*)
      `)
      .eq('id', id)
      .single();

    if (data) setMatch(data as Match);
    setLoading(false);
  };

  if (loading) return <div className="p-4"><div className="skeleton h-40 rounded-card" /></div>;
  if (!match) return <div className="p-4 text-muted text-sm">Match not found.</div>;

  const accentColor = getSportAccentColor(match.sport);
  const playerWon = match.winner_id === profile?.id;

  return (
    <div className="p-4 max-w-lg fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted hover:text-navy pt-2 mb-5 min-h-[44px]">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Sport header */}
      <div
        className="rounded-card p-4 mb-4 flex items-center gap-3"
        style={{ backgroundColor: accentColor }}
      >
        <span className="text-3xl">{match.sport?.icon}</span>
        <div>
          <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {match.sport?.name}
          </p>
          <p className="text-white/60 text-xs">{timeAgo(match.created_at)}</p>
        </div>
        {match.status === 'completed' && profile?.id && match.winner_id && (
          <span
            className={`ml-auto text-sm font-bold px-3 py-1.5 rounded-pill ${
              playerWon ? 'bg-lime text-navy' : 'bg-white/20 text-white'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {playerWon ? 'W' : 'L'}
          </span>
        )}
      </div>

      {/* Players + score */}
      <div className="bg-white rounded-card border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-navy text-chalk flex items-center justify-center text-lg font-bold mx-auto mb-2">
              {match.player_a?.display_name.charAt(0)}
            </div>
            <p className="text-sm font-semibold text-navy" style={{ fontFamily: 'var(--font-display)' }}>
              {match.player_a?.display_name}
            </p>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-mono)' }}>
              {match.sets_a} – {match.sets_b}
            </span>
            <span className="text-xs text-muted mt-1">sets</span>
          </div>
          <div className="text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-surface text-navy flex items-center justify-center text-lg font-bold mx-auto mb-2 border border-border">
              {match.player_b?.display_name.charAt(0)}
            </div>
            <p className="text-sm font-semibold text-navy" style={{ fontFamily: 'var(--font-display)' }}>
              {match.player_b?.display_name}
            </p>
          </div>
        </div>

        {/* Set breakdown */}
        {match.set_results && match.set_results.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-xs text-muted uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Set breakdown
            </p>
            {match.set_results.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-xs text-muted">Set {r.set_number}</span>
                <span
                  className="text-sm font-semibold text-navy"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {r.score_a} – {r.score_b}
                </span>
                <span
                  className={`text-xs font-medium ${r.winner === 'a' ? 'text-[#00A86B]' : 'text-orange'}`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {r.winner === 'a' ? match.player_a?.display_name : match.player_b?.display_name} won
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShareButton shareToken={match.share_token} className="w-full justify-center" />
    </div>
  );
}
