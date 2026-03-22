'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  score: number;
  size?: 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export function ScoreDisplay({ score, size = 'xl', className, animate }: ScoreDisplayProps) {
  const [prevScore, setPrevScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (score !== prevScore && animate) {
      setIsAnimating(true);
      const t = setTimeout(() => {
        setIsAnimating(false);
        setPrevScore(score);
      }, 130);
      return () => clearTimeout(t);
    } else {
      setPrevScore(score);
    }
  }, [score, animate, prevScore]);

  return (
    <span
      className={cn(
        'tabular-nums font-bold leading-none select-none',
        size === 'xl' ? 'text-[80px] sm:text-[96px]' : 'text-5xl',
        isAnimating && 'score-pop',
        className
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {score}
    </span>
  );
}
