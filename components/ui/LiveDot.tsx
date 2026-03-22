'use client';

import { cn } from '@/lib/utils';

interface LiveDotProps {
  color?: 'lime' | 'orange' | 'green';
  size?: 'sm' | 'md';
  className?: string;
}

export function LiveDot({ color = 'lime', size = 'sm', className }: LiveDotProps) {
  const colorMap = {
    lime: 'bg-lime',
    orange: 'bg-orange',
    green: 'bg-[#00A86B]',
  };

  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full pulse-dot',
        colorMap[color],
        sizeMap[size],
        className
      )}
    />
  );
}
