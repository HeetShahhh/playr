'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Sport, UserProfile } from '@/types';

type Step = 'details' | 'players' | 'bracket';

function generateKnockoutBracket(players: string[], tournamentId: string, sportId: string): any[] {
  // Shuffle players for seeding
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const rounds: any[] = [];

  // Pad to power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  while (shuffled.length < size) shuffled.push('BYE');

  let currentRound = shuffled;
  let roundNum = 1;

  while (currentRound.length > 1) {
    for (let i = 0; i < currentRound.length; i += 2) {
      rounds.push({
        round: roundNum,
        position: i / 2 + 1,
        playerA: currentRound[i] !== 'BYE' ? currentRound[i] : null,
        playerB: currentRound[i + 1] !== 'BYE' ? currentRound[i + 1] : null,
      });
    }
    currentRound = currentRound.map((_, i) => i % 2 === 0 ? 'TBD' : null).filter(Boolean) as string[];
    currentRound = Array(currentRound.length / 2).fill('TBD');
    roundNum++;
  }

  return rounds;
}

export default function NewTournamentPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('details');
  const [sports, setSports] = useState<Sport[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [name, setName] = useState('');
  const [sportId, setSportId] = useState('');
  const [format] = useState('knockout');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [bracketPreview, setBracketPreview] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFormData();
  }, [profile]);

  const loadFormData = async () => {
    const { data: sportsData } = await supabase.from('sports').select('*').eq('status', 'live');
    if (sportsData) setSports(sportsData as Sport[]);
    if (profile?.club_id) {
      const { data: membersData } = await supabase.from('user_profiles').select('*').eq('club_id', profile.club_id);
      if (membersData) setMembers(membersData as UserProfile[]);
    }
  };

  const handleGenerateBracket = () => {
    if (selectedPlayers.length < 2) return showToast('Add at least 2 players', 'action');
    const bracket = generateKnockoutBracket(selectedPlayers, '', sportId);
    setBracketPreview(bracket);
    setStep('bracket');
  };

  const handleCreateTournament = async () => {
    if (!name || !sportId || selectedPlayers.length < 2) return;
    setCreating(true);

    // Create tournament
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .insert({
        name,
        sport_id: sportId,
        club_id: profile?.club_id,
        format: 'knockout',
        status: 'active',
        created_by: profile?.id,
      })
      .select()
      .single();

    if (tError || !tournament) {
      showToast('Failed to create tournament.', 'action');
      setCreating(false);
      return;
    }

    // Create matches for round 1 only
    const selectedSport = sports.find((s) => s.id === sportId);
    const round1 = bracketPreview.filter((b) => b.round === 1 && b.playerA && b.playerB);

    for (const bracketMatch of round1) {
      const { data: matchData } = await supabase
        .from('matches')
        .insert({
          sport_id: sportId,
          club_id: profile?.club_id,
          player_a_id: bracketMatch.playerA,
          player_b_id: bracketMatch.playerB,
          status: 'pending',
          current_set: 1,
          score_a: 0,
          score_b: 0,
          sets_a: 0,
          sets_b: 0,
        })
        .select()
        .single();

      if (matchData) {
        await supabase.from('tournament_matches').insert({
          tournament_id: tournament.id,
          match_id: matchData.id,
          round: bracketMatch.round,
          position: bracketMatch.position,
        });
      }
    }

    showToast('Tournament created!', 'success');
    router.push(`/manage/tournaments/${tournament.id}`);
    setCreating(false);
  };

  const totalRounds = bracketPreview.length > 0
    ? Math.max(...bracketPreview.map((b) => b.round))
    : 0;

  return (
    <div className="p-4 max-w-lg fade-in">
      <button onClick={() => step === 'details' ? router.back() : setStep(step === 'bracket' ? 'players' : 'details')} className="flex items-center gap-1.5 text-sm text-muted hover:text-navy pt-2 mb-5 min-h-[44px]">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-display)' }}>New Tournament</h1>
        <span className="text-xs px-2.5 py-1 bg-surface rounded-pill text-muted" style={{ fontFamily: 'var(--font-display)' }}>
          {step === 'details' ? '1/3' : step === 'players' ? '2/3' : '3/3'}
        </span>
      </div>

      {/* Step 1: Details */}
      {step === 'details' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>Tournament name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Club Championship 2026"
              className="w-full px-4 py-3 rounded-lg border border-border bg-white text-sm text-navy focus:outline-none focus:border-navy"
              style={{ minHeight: '48px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>Sport</label>
            <div className="grid grid-cols-3 gap-2">
              {sports.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSportId(s.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-card border-2 transition-all ${sportId === s.id ? 'border-orange bg-orange/5' : 'border-border bg-white hover:border-navy/30'}`}
                  style={{ minHeight: '72px' }}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-medium text-navy" style={{ fontFamily: 'var(--font-display)' }}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-card p-4">
            <p className="text-sm font-semibold text-navy mb-1" style={{ fontFamily: 'var(--font-display)' }}>Format: Knockout</p>
            <p className="text-xs text-muted">Single elimination bracket. Best for 4, 8, or 16 players.</p>
          </div>

          <button
            onClick={() => name && sportId && setStep('players')}
            disabled={!name || !sportId}
            className="w-full flex items-center justify-center gap-2 py-4 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 disabled:opacity-40"
            style={{ fontFamily: 'var(--font-display)', minHeight: '56px' }}
          >
            Next: Add players <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Players */}
      {step === 'players' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Select players to include. Works best with 4, 8, or 16.</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.map((m) => {
              const selected = selectedPlayers.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayers((prev) =>
                      selected ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                    );
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-card border-2 transition-all ${selected ? 'border-orange bg-orange/5' : 'border-border bg-white hover:border-navy/30'}`}
                  style={{ minHeight: '56px' }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selected ? 'border-orange bg-orange' : 'border-border'}`}>
                    {selected && <svg viewBox="0 0 10 8" className="w-3 h-3 text-white fill-current"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-navy text-chalk flex items-center justify-center text-sm font-bold">
                    {m.display_name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-navy" style={{ fontFamily: 'var(--font-display)' }}>{m.display_name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted">{selectedPlayers.length} players selected</span>
            <button
              onClick={handleGenerateBracket}
              disabled={selectedPlayers.length < 2}
              className="flex items-center gap-2 px-5 py-3 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 disabled:opacity-40"
              style={{ fontFamily: 'var(--font-display)', minHeight: '48px' }}
            >
              Generate bracket <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Bracket preview */}
      {step === 'bracket' && (
        <div className="space-y-5">
          <p className="text-sm text-muted">Here's your knockout bracket. Confirm to create the tournament and all Round 1 matches.</p>

          {/* Simple bracket preview */}
          <div className="bg-white rounded-card border border-border p-4 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
                const roundMatches = bracketPreview.filter((b) => b.round === round);
                const playerMap: Record<string, string> = {};
                members.forEach((m) => { playerMap[m.id] = m.display_name; });

                return (
                  <div key={round} className="flex flex-col gap-4">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider text-center" style={{ fontFamily: 'var(--font-display)' }}>
                      {round === totalRounds ? 'Final' : round === totalRounds - 1 ? 'Semi' : `R${round}`}
                    </p>
                    {roundMatches.map((m) => (
                      <div key={`${round}-${m.position}`} className="w-36 rounded-lg border border-border overflow-hidden">
                        <div className="px-2.5 py-1.5 border-b border-border">
                          <p className="text-xs text-navy font-medium truncate" style={{ fontFamily: 'var(--font-display)' }}>
                            {m.playerA ? playerMap[m.playerA] || 'Player' : 'TBD'}
                          </p>
                        </div>
                        <div className="px-2.5 py-1.5">
                          <p className="text-xs text-navy font-medium truncate" style={{ fontFamily: 'var(--font-display)' }}>
                            {m.playerB ? playerMap[m.playerB] || 'Player' : 'TBD'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleCreateTournament}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-4 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 disabled:opacity-40"
            style={{ fontFamily: 'var(--font-display)', minHeight: '56px' }}
          >
            {creating ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : <>Confirm & create tournament 🎉</>}
          </button>
        </div>
      )}
    </div>
  );
}
