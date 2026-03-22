'use client';

import { useRouter } from 'next/navigation';
import { SportRow } from '@/components/ui/SportRow';

const SPORTS = [
  { slug: 'badminton',  name: 'Badminton',  format: '21pts · Best of 3', accent: '#00A86B' },
  { slug: 'pickleball', name: 'Pickleball', format: '11pts · Best of 3', accent: '#FF6B35' },
  { slug: 'tennis',     name: 'Tennis',     format: '6 games · Best 3',  accent: '#E8A020' },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--navy)', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '52px',
          backgroundColor: 'var(--navy-2)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-black leading-none"
            style={{ backgroundColor: 'var(--navy)', color: 'var(--lime)', border: '1px solid var(--lime)' }}
          >
            P▶
          </div>
          <span
            className="text-[17px] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Playr
          </span>
        </div>
        <button
          onClick={() => router.push('/history')}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', minHeight: '44px' }}
        >
          History
        </button>
      </header>

      {/* Hero text */}
      <div className="px-4 pt-8 pb-6">
        <h1
          className="text-[22px] font-semibold leading-snug"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Pick a sport
        </h1>
        <p
          className="text-[15px] mt-0.5"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
        >
          and start scoring
        </p>
      </div>

      {/* Sport rows */}
      <div
        className="mx-4 overflow-hidden"
        style={{ borderRadius: '10px', border: '1px solid var(--border)' }}
      >
        {SPORTS.map((sport, i) => (
          <SportRow key={sport.slug} sport={sport} isLast={i === SPORTS.length - 1} />
        ))}
      </div>

      {/* Spectator divider */}
      <div className="px-4 mt-8">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
          >
            or
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        </div>
        <div className="flex items-center justify-between mt-4">
          <span
            className="text-[14px]"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
          >
            Have a match link?
          </span>
          <button
            onClick={() => {
              const link = window.prompt('Paste the match link:');
              if (link) {
                try {
                  const url = new URL(link);
                  router.push(url.pathname);
                } catch {
                  router.push(link);
                }
              }
            }}
            className="text-[14px] font-semibold px-4 transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              minHeight: '44px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            Open link
          </button>
        </div>
      </div>
    </div>
  );
}
