'use client';

/**
 * useOfflineSync
 * Tracks online/offline status and exposes the count of unsynced events.
 * Syncing itself is handled by lib/db.ts (window event listeners + interval).
 */
import { useEffect, useState } from 'react';
import { getPendingCount, syncPendingEvents } from '@/lib/db';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // -------------------------------------------------------------------------
  // Track network status
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncing(true);
      await syncPendingEvents();
      setSyncing(false);
      setPendingCount(await getPendingCount());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Poll pending count every 5 s
  // -------------------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    async function poll() {
      if (alive) setPendingCount(await getPendingCount());
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Manual sync trigger
  // -------------------------------------------------------------------------
  const sync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    await syncPendingEvents();
    setSyncing(false);
    setPendingCount(await getPendingCount());
  };

  return { isOnline, pendingCount, syncing, sync };
}
