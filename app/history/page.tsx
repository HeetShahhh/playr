'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface MatchSummary {
  id:          string;
  share_token: string;
  sport_name:  string;
  sport_slug:  string;
  sport_accent:string;
  player_a:    string;
  player_b:    string;
  winner:      string | null;
  set_scores:  string;   // e.g. "21–18, 21–15"
  date:        string;   // e.g. "Today", "Yesterday", "Mar 22"
  status:      string;
}

const SPORT_ACCENTS: Record<string, string> = {
  badminton:  '#00A86B',
  pickleball: '#FF6B35',
  tennis:     '#E8A020',
  cricket:    '#1A5CFF',
  basketball: '#E83038',
  squash:     '#8B5CF6',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function HistoryPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const ids: string[] = (() => {
      try {
        return JSON.parse(localStorage.getItem('playr_matches') || '[]');
      } catch { return []; }
    })();

    if (ids.length === 0) { setLoading(false); return; }

    supabase
      .from('matches')
      .select(`
        id, share_token, status, created_at, completed_at, winner_id,
        player_name_a, player_name_b,
        sport:sports(name, slug),
        player_a:user_profiles!matches_player_a_id_fkey(display_name),
        player_b:user_profiles!matches_player_b_id_fkey(display_name),
        set_results(score_a, score_b, winner)
      `)
      .in('id', ids.slice(0, 50))
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows: MatchSummary[] = (data ?? []).map((m: any) => {
          const slug   = m.sport?.slug ?? '';
          const nameA  = m.player_name_a ?? m.player_a?.display_name ?? 'Player A';
          const nameB  = m.player_name_b ?? m.player_b?.display_name ?? 'Player B';
          const sets   = (m.set_results ?? []) as Array<{ score_a: number; score_b: number; winner: string }>;
          const setStr = sets.map((s) => `${s.score_a}–${s.score_b}`).join(', ');
          const winnerRow = sets.length > 0
            ? sets.reduce((acc, s) => {
                if (s.winner === 'a') acc.a++;
                else acc.b++;
                return acc;
              }, { a: 0, b: 0 })
            : null;
          const winner = winnerRow
            ? (winnerRow.a > winnerRow.b ? nameA : nameB)
            : null;

          return {
            id:          m.id,
            share_token: m.share_token,
            sport_name:  m.sport?.name ?? 'Match',
            sport_slug:  slug,
            sport_accent:SPORT_ACCENTS[slug] ?? '#00A86B',
            player_a:    nameA,
            player_b:    nameB,
            winner,
            set_scores:  setStr,
            date:        formatDate(m.completed_at ?? m.created_at),
            status:      m.status,
          };
        });
        setMatches(rows);
        setLoading(false);
      });
  }, []);

  const loadDetails = async (id: string) => {
    if (details[id]) return;
    const { data } = await supabase
      .from('matches')
      .select('*, sport:sports(*), set_results(score_a, score_b, winner)')
      .eq('id', id)
      .single();
    if (data) setDetails((prev) => ({ ...prev, [id]: data }));
  };

  const handleTap = async (m: MatchSummary) => {
    if (expandedId === m.id) {
      setExpandedId(null);
    } else {
      setExpandedId(m.id);
      await loadDetails(m.id);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--navy)', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* Header */}
      <header
        className="flex items-center px-4 shrink-0"
        style={{ height: '52px', backgroundColor: 'var(--navy-2)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 mr-4"
          style={{ color: 'var(--text-secondary)', minHeight: '44px' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span
          className="text-[17px] font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Your matches
        </span>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <p className="text-[16px] font-medium" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
            No matches yet.
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-[15px] font-semibold px-6 rounded-lg text-white"
            style={{ height: '48px', backgroundColor: 'var(--orange)', fontFamily: 'var(--font-display)' }}
          >
            Score your first match →
          </button>
        </div>
      ) : (
        /* Match list */
        <div className="flex-1">
          {matches.map((m, i) => (
            <div key={m.id}>
              {/* Row */}
              <button
                className="w-full flex items-center px-4 py-3 text-left transition-colors"
                style={{
                  borderLeft: `3px solid ${m.sport_accent}`,
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: expandedId === m.id ? 'var(--navy-3)' : 'var(--navy-2)',
                  minHeight: '72px',
                }}
                onClick={() => handleTap(m)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[12px] font-semibold uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-display)', color: m.sport_accent }}
                    >
                      {m.sport_name}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      · {m.date}
                    </span>
                    {m.status === 'live' && (
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--lime)' }}>● Live</span>
                    )}
                  </div>
                  <p className="text-[15px] font-medium truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {m.player_a} vs {m.player_b}
                  </p>
                  {m.set_scores && (
                    <p className="text-[12px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {m.set_scores}
                      {m.winner ? ` · ${m.winner} won` : ''}
                    </p>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  style={{
                    color: 'var(--text-secondary)',
                    transform: expandedId === m.id ? 'rotate(90deg)' : 'none',
                    transition: 'transform 200ms ease',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                />
              </button>

              {/* Expanded detail */}
              {expandedId === m.id && details[m.id] && (
                <div
                  className="px-4 py-4 fade-in"
                  style={{ backgroundColor: 'var(--navy-3)', borderBottom: '1px solid var(--border)' }}
                >
                  {/* Set-by-set breakdown */}
                  {(details[m.id].set_results ?? []).map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: idx < details[m.id].set_results.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <span className="text-[13px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                        Set {idx + 1}
                      </span>
                      <span className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {s.score_a} – {s.score_b}
                      </span>
                      <span className="text-[12px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                        {s.winner === 'a' ? m.player_a : m.player_b} won
                      </span>
                    </div>
                  ))}

                  {/* Share button */}
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/watch/${m.share_token}`;
                      navigator.clipboard.writeText(url);
                    }}
                    className="mt-3 w-full text-[13px] font-medium rounded-lg border"
                    style={{
                      height: '40px',
                      borderColor: 'rgba(255,255,255,0.15)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    Copy share link
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
