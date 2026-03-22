'use client';

import { useEffect, useState } from 'react';
import { getPendingCount } from '@/lib/db';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium"
      style={{
        backgroundColor: isOnline ? 'rgba(182, 240, 0, 0.15)' : 'rgba(232, 93, 26, 0.15)',
        fontFamily: 'var(--font-display)',
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full pulse-dot ${isOnline ? 'bg-[#00A86B]' : 'bg-orange'}`}
      />
      <span style={{ color: isOnline ? '#00A86B' : '#E85D1A' }}>
        {isOnline
          ? pendingCount > 0
            ? `Syncing ${pendingCount}…`
            : 'Live'
          : 'Offline — saving locally'}
      </span>
    </div>
  );
}
