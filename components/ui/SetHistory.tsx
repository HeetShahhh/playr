import { SetResult } from '@/types';
import { cn } from '@/lib/utils';

interface SetHistoryProps {
  results: SetResult[];
  className?: string;
}

export function SetHistory({ results, className }: SetHistoryProps) {
  if (results.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {results.map((r) => (
        <span
          key={r.id}
          className="text-xs px-2 py-0.5 rounded bg-white/20 text-white/80"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {r.score_a}–{r.score_b}
        </span>
      ))}
    </div>
  );
}
