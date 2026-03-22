'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Tournament, TournamentMatch, UserProfile } from '@/types';
import { TournamentBracket } from '@/components/ui/TournamentBracket';
import { cn } from '@/lib/utils';

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracketMatches, setBracketMatches] = useState<any[]>([]);
  const [totalRounds, setTotalRounds] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournament();
  }, [id]);

  const loadTournament = async () => {
    const { data: tData } = await supabase
      .from('tournaments')
      .select('*, sport:sports(*)')
      .eq('id', id)
      .single();

    if (tData) setTournament(tData as Tournament);

    const { data: tmData } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        match:matches(
          *,
          player_a:user_profiles!matches_player_a_id_fkey(id, display_name),
          player_b:user_profiles!matches_player_b_id_fkey(id, display_name),
          set_results(*)
        )
      `)
      .eq('tournament_id', id)
      .order('round')
      .order('position');

    if (tmData) {
      const maxRound = Math.max(...tmData.map((m: any) => m.round), 0);
      setTotalRounds(maxRound);

      const bracketData = tmData.map((tm: any) => ({
        id: tm.id,
        round: tm.round,
        position: tm.position,
        playerAName: tm.match?.player_a?.display_name,
        playerBName: tm.match?.player_b?.display_name,
        scoreA: tm.match?.sets_a,
        scoreB: tm.match?.sets_b,
        winnerName: tm.match?.winner_id === tm.match?.player_a_id
          ? tm.match?.player_a?.display_name
          : tm.match?.winner_id === tm.match?.player_b_id
          ? tm.match?.player_b?.display_name
          : undefined,
        status: tm.match?.status,
      }));
      setBracketMatches(bracketData);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-4"><div className="skeleton h-60 rounded-card" /></div>;
  if (!tournament) return <div className="p-4 text-muted text-sm">Tournament not found.</div>;

  return (
    <div className="p-4 fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted hover:text-navy pt-2 mb-5 min-h-[44px]">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{tournament.sport?.icon}</span>
            <span
              className="text-xs font-medium"
              style={{ color: tournament.sport?.accent_color, fontFamily: 'var(--font-display)' }}
            >
              {tournament.sport?.name}
            </span>
          </div>
          <h1 className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-display)' }}>
            {tournament.name}
          </h1>
        </div>
        <span
          className={cn(
            'text-xs font-semibold px-3 py-1.5 rounded-pill capitalize mt-1',
            tournament.status === 'active' ? 'bg-lime/20 text-[#5A7A00]'
            : tournament.status === 'completed' ? 'bg-muted/10 text-muted'
            : 'bg-orange/15 text-orange'
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {tournament.status}
        </span>
      </div>

      {/* Bracket */}
      <div className="bg-surface rounded-card p-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Knockout Bracket
        </p>
        {bracketMatches.length > 0 ? (
          <TournamentBracket matches={bracketMatches} totalRounds={totalRounds} />
        ) : (
          <p className="text-sm text-muted text-center py-8">No bracket data yet.</p>
        )}
      </div>
    </div>
  );
}
