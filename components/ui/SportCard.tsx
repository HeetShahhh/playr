'use client';

import { useState } from 'react';
import { ArrowRight, Bell } from 'lucide-react';
import { LiveDot } from './LiveDot';
import { Sport } from '@/types';
import { cn } from '@/lib/utils';

interface SportCardProps {
  sport: Sport;
  onClick?: () => void;
  className?: string;
}

export function SportCard({ sport, onClick, className }: SportCardProps) {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const isLive = sport.status === 'live';

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyEmail) {
      setNotified(true);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-card border border-border overflow-hidden transition-all duration-150',
        isLive ? 'cursor-pointer match-card-hover' : 'opacity-60',
        className
      )}
      style={{ borderLeft: `3px solid ${sport.accent_color}` }}
      onClick={isLive ? onClick : undefined}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{sport.icon}</span>
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <LiveDot color="lime" />
              <span className="text-xs font-medium text-[#00A86B]" style={{ fontFamily: 'var(--font-display)' }}>
                Live
              </span>
            </div>
          ) : (
            <span className="text-xs font-medium text-muted bg-surface px-2 py-1 rounded-pill" style={{ fontFamily: 'var(--font-display)' }}>
              Coming soon
            </span>
          )}
        </div>

        <h3
          className="text-navy font-semibold text-base mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {sport.name}
        </h3>

        {isLive ? (
          <button
            className="flex items-center gap-1 text-sm font-medium mt-2"
            style={{ color: sport.accent_color, fontFamily: 'var(--font-display)', minHeight: '44px' }}
          >
            Start scoring
            <ArrowRight size={14} />
          </button>
        ) : (
          <div className="mt-3">
            {notified ? (
              <p className="text-xs text-[#00A86B] font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                ✓ We'll notify you!
              </p>
            ) : (
              <form onSubmit={handleNotify} className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:border-navy min-w-0"
                  style={{ fontFamily: 'var(--font-body)', minHeight: '36px' }}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-2 bg-navy text-chalk text-xs rounded-lg font-medium shrink-0"
                  style={{ fontFamily: 'var(--font-display)', minHeight: '36px' }}
                >
                  <Bell size={12} />
                  Notify
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
