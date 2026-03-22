'use client';

import { useRouter } from 'next/navigation';

interface Sport {
  slug: string;
  name: string;
  format: string;
  accent: string;
}

interface SportRowProps {
  sport: Sport;
  isLast?: boolean;
}

/**
 * Single sport entry row on the home screen.
 * 80px tall, navy-2 bg, sport accent left border, "Score now →" button.
 */
export function SportRow({ sport, isLast = false }: SportRowProps) {
  const router = useRouter();

  return (
    <div
      className="group flex items-center justify-between px-4 transition-colors cursor-pointer"
      style={{
        height: '80px',
        backgroundColor: 'var(--navy-2)',
        borderLeft: `3px solid ${sport.accent}`,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
      onClick={() => router.push(`/score/${sport.slug}`)}
    >
      {/* Sport info */}
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[18px] font-semibold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {sport.name}
        </span>
        <span
          className="text-[13px] leading-tight"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
        >
          {sport.format}
        </span>
      </div>

      {/* CTA button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/score/${sport.slug}`);
        }}
        className="shrink-0 px-4 font-semibold text-white text-sm transition-opacity group-hover:opacity-90 active:opacity-70"
        style={{
          height: '36px',
          borderRadius: '6px',
          backgroundColor: sport.accent,
          fontFamily: 'var(--font-display)',
        }}
      >
        Score now →
      </button>
    </div>
  );
}
