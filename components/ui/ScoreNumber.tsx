'use client';

import { useEffect, useRef, useState } from 'react';

interface ScoreNumberProps {
  value: number | string;
  /** px size — spec says 96px on scoring screen, 80px on spectator */
  size?: number;
  className?: string;
  color?: string;
  animate?: boolean;
}

/**
 * Animated JetBrains Mono score number.
 * On value change: scale 1 → 1.35 → 1 over 120ms.
 */
export function ScoreNumber({ value, size = 96, className = '', color = 'var(--lime)', animate = true }: ScoreNumberProps) {
  const [animating, setAnimating] = useState(false);
  const prevRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!animate) return;
    if (prevRef.current !== value) {
      prevRef.current = value;
      if (timerRef.current) clearTimeout(timerRef.current);
      setAnimating(true);
      timerRef.current = setTimeout(() => setAnimating(false), 130);
    }
  }, [value, animate]);

  return (
    <span
      className={`tabular-nums leading-none select-none ${className}`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: `${size}px`,
        color,
        display: 'inline-block',
        transform: animating ? 'scale(1.35)' : 'scale(1)',
        transition: animating ? 'none' : 'transform 120ms ease-out',
        willChange: 'transform',
      }}
    >
      {value}
    </span>
  );
}
