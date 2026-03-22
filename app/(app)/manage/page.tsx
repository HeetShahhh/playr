'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Users, BarChart2, Trophy, MapPin, Search, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { UserProfile, Match, Tournament } from '@/types';
import { MatchCard } from '@/components/ui/MatchCard';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { LiveDot } from '@/components/ui/LiveDot';
import { cn } from '@/lib/utils';

type Tab = 'members' | 'matches' | 'tournaments';

function ManagePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'members');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.club_id) return;
    loadData();
  }, [profile, activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'members') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('club_id', profile!.club_id)
        .order('created_at', { ascending: false });
      if (data) setMembers(data as UserProfile[]);
    } else if (activeTab === 'matches') {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          sport:sports(*),
          player_a:user_profiles!matches_player_a_id_fkey(id, display_name),
          player_b:user_profiles!matches_player_b_id_fkey(id, display_name),
          set_results(*)
        `)
        .eq('club_id', profile!.club_id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setMatches(data as Match[]);
    } else if (activeTab === 'tournaments') {
      const { data } = await supabase
        .from('tournaments')
        .select('*, sport:sports(*)')
        .eq('club_id', profile!.club_id)
        .order('created_at', { ascending: false });
      if (data) setTournaments(data as Tournament[]);
    }
    setLoading(false);
  };

  const handleRoleChange = async (memberId: string, newRole: UserProfile['role']) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', memberId);

    if (!error) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
      showToast('Role updated!', 'success');
    }
  };

  const filteredMembers = members.filter(
    (m) => !searchQuery || m.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (profile?.role !== 'club_admin') {
    return (
      <div className="p-4 text-center py-20">
        <p className="text-muted">You need club admin access to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-5">
        <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-display)' }}>
          Manage Club
        </h1>
        <button
          onClick={() => {
            if (activeTab === 'matches') router.push('/manage/matches/new');
            else if (activeTab === 'tournaments') router.push('/manage/tournaments/new');
            else showToast('Invite link coming soon!', 'action');
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-orange text-white text-sm font-semibold rounded-lg hover:bg-orange/90"
          style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
        >
          <Plus size={16} />
          {activeTab === 'tournaments' ? 'New Tournament' : activeTab === 'matches' ? 'New Match' : 'Invite'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-lg mb-5">
        {([
          { key: 'members', label: 'Members', icon: <Users size={14} /> },
          { key: 'matches', label: 'Matches', icon: <BarChart2 size={14} /> },
          { key: 'tournaments', label: 'Tournaments', icon: <Trophy size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy'
            )}
            style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search members…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-lg border border-border bg-white text-sm text-navy placeholder:text-muted focus:outline-none focus:border-navy"
              style={{ minHeight: '44px' }}
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-card" />)}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              {searchQuery ? 'No members found.' : 'No members in your club yet.'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-card border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-chalk font-bold text-sm overflow-hidden">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      : member.display_name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy" style={{ fontFamily: 'var(--font-display)' }}>
                      {member.display_name}
                    </p>
                    <RoleBadge role={member.role} className="mt-0.5" />
                  </div>
                </div>
                {/* Role change dropdown */}
                {member.id !== profile.id && (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as UserProfile['role'])}
                    className="text-xs border border-border rounded-lg px-2 py-2 bg-surface text-navy focus:outline-none"
                    style={{ minHeight: '36px', fontFamily: 'var(--font-display)' }}
                  >
                    <option value="player">Player</option>
                    <option value="umpire">Umpire</option>
                    <option value="club_admin">Admin</option>
                  </select>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Matches tab */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-card" />)}</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No matches yet. Create the first one!</div>
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onClick={() => router.push(match.status === 'live' ? `/match/${match.id}/score` : `/matches/${match.id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* Tournaments tab */}
      {activeTab === 'tournaments' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-20 rounded-card" />)}</div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No tournaments yet. Create one!</div>
          ) : (
            tournaments.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-card border border-border p-4 cursor-pointer match-card-hover"
                onClick={() => router.push(`/manage/tournaments/${t.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-navy text-sm mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                      {t.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{t.sport?.icon}</span>
                      <span className="text-xs text-muted">{t.sport?.name}</span>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted capitalize">{t.format}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-pill capitalize',
                      t.status === 'active' ? 'bg-lime/20 text-[#5A7A00]'
                      : t.status === 'completed' ? 'bg-muted/10 text-muted'
                      : 'bg-orange/15 text-orange'
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={<div className="p-4"><div className="skeleton h-40 rounded-card" /></div>}>
      <ManagePageInner />
    </Suspense>
  );
}
