'use client';

import { Share2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { generateShareUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  shareToken: string;
  variant?: 'default' | 'icon';
  className?: string;
}

export function ShareButton({ shareToken, variant = 'default', className }: ShareButtonProps) {
  const { showToast } = useToast();

  const handleShare = async () => {
    const url = generateShareUrl(shareToken);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Watch this match live on Scorely',
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        className={cn(
          'w-11 h-11 flex items-center justify-center rounded-lg bg-surface border border-border text-navy hover:bg-border transition-colors',
          className
        )}
        aria-label="Share match"
      >
        <Share2 size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-lg bg-navy text-chalk text-sm font-medium hover:bg-navy/90 transition-colors',
        className
      )}
      style={{ fontFamily: 'var(--font-display)', minHeight: '44px' }}
    >
      <Share2 size={16} />
      Share result 🔗
    </button>
  );
}
