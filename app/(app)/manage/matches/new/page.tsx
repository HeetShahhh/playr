'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Sport, UserProfile } from '@/types';

export default function NewMatchPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [sports, setSports] = useState<Sport[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [sportId, setSportId] = useState('');
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  const [umpireId, setUmpireId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFormData();
  }, [profile]);

  const loadFormData = async () => {
    const { data: sportsData } = await supabase
      .from('sports')
      .select('*')
      .eq('status', 'live');
    if (sportsData) setSports(sportsData as Sport[]);

    if (profile?.club_id) {
      const { data: membersData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('club_id', profile.club_id);
      if (membersData) setMembers(membersData as UserProfile[]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sportId || !playerAId || !playerBId) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('matches')
      .insert({
        sport_id: sportId,
        club_id: profile?.club_id,
        player_a_id: playerAId,
        player_b_id: playerBId,
        umpire_id: umpireId || null,
        status: 'pending',
        current_set: 1,
        score_a: 0,
        score_b: 0,
        sets_a: 0,
        sets_b: 0,
      })
      .select()
      .single();

    if (error) {
      showToast('Failed to create match.', 'action');
      setCreating(false);
      return;
    }

    showToast('Match created!', 'success');
    if (umpireId === profile?.id) {
      router.push(`/match/${data.id}/score`);
    } else {
      router.push('/manage?tab=matches');
    }
  };

  return (
    <div className="p-4 max-w-lg fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted hover:text-navy pt-2 mb-5 min-h-[44px]">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-navy mb-6" style={{ fontFamily: 'var(--font-display)' }}>
        New Match
      </h1>

      <form onSubmit={handleCreate} className="space-y-5">
        {/* Sport */}
        <div>
          <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Sport
          </label>
          <div className="grid grid-cols-3 gap-2">
            {sports.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSportId(s.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-card border-2 transition-all ${
                  sportId === s.id ? 'border-orange bg-orange/5' : 'border-border bg-white hover:border-navy/30'
                }`}
                style={{ minHeight: '72px' }}
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-medium text-navy" style={{ fontFamily: 'var(--font-display)' }}>
                  {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Players */}
        <div>
          <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Player A
          </label>
          <select
            value={playerAId}
            onChange={(e) => setPlayerAId(e.target.value)}
            required
            className="w-full px-3 py-3 rounded-lg border border-border bg-white text-sm text-navy focus:outline-none focus:border-navy"
            style={{ minHeight: '48px', fontFamily: 'var(--font-body)' }}
          >
            <option value="">Select player A</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Player B
          </label>
          <select
            value={playerBId}
            onChange={(e) => setPlayerBId(e.target.value)}
            required
            className="w-full px-3 py-3 rounded-lg border border-border bg-white text-sm text-navy focus:outline-none focus:border-navy"
            style={{ minHeight: '48px', fontFamily: 'var(--font-body)' }}
          >
            <option value="">Select player B</option>
            {members.filter((m) => m.id !== playerAId).map((m) => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Umpire (optional)
          </label>
          <select
            value={umpireId}
            onChange={(e) => setUmpireId(e.target.value)}
            className="w-full px-3 py-3 rounded-lg border border-border bg-white text-sm text-navy focus:outline-none focus:border-navy"
            style={{ minHeight: '48px', fontFamily: 'var(--font-body)' }}
          >
            <option value="">No umpire assigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name} {m.role === 'umpire' ? '(Umpire)' : ''}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={creating || !sportId || !playerAId || !playerBId}
          className="w-full flex items-center justify-center gap-2 py-4 bg-orange text-white font-bold rounded-lg hover:bg-orange/90 disabled:opacity-40"
          style={{ fontFamily: 'var(--font-display)', minHeight: '56px' }}
        >
          {creating ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create match <ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </div>
  );
}
