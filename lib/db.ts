import Dexie, { Table } from 'dexie';
import { supabase } from './supabase';

interface PendingEvent {
  id?: number;
  matchId: string;
  eventType: string;
  scoreAAfter: number;
  scoreBAfter: number;
  setNumber: number;
  createdAt: string;
  synced: number; // 0 = pending, 1 = synced
}

class ScorelyDB extends Dexie {
  pendingEvents!: Table<PendingEvent>;

  constructor() {
    super('scorely');
    this.version(1).stores({
      pendingEvents: '++id, matchId, eventType, createdAt, synced',
    });
  }
}

export const localDb = new ScorelyDB();

export async function writeEventLocally(event: Omit<PendingEvent, 'id' | 'synced'>) {
  return await localDb.pendingEvents.add({
    ...event,
    synced: 0,
  });
}

export async function syncPendingEvents() {
  try {
    const pending = await localDb.pendingEvents.where('synced').equals(0).toArray();
    for (const event of pending) {
      try {
        const { error } = await supabase.from('match_events').insert({
          match_id: event.matchId,
          event_type: event.eventType,
          score_a_after: event.scoreAAfter,
          score_b_after: event.scoreBAfter,
          set_number: event.setNumber,
          created_at: event.createdAt,
          synced: true,
        });
        if (error) throw error;
        await localDb.pendingEvents.update(event.id!, { synced: 1 });
      } catch {
        break; // stop on first failure, retry later
      }
    }
  } catch {
    // Silently fail — will retry
  }
}

export async function getPendingCount(): Promise<number> {
  return await localDb.pendingEvents.where('synced').equals(0).count();
}

// Set up sync triggers
if (typeof window !== 'undefined') {
  // Sync on window focus
  window.addEventListener('focus', () => syncPendingEvents());

  // Sync on reconnect
  window.addEventListener('online', () => syncPendingEvents());

  // Sync every 30 seconds
  setInterval(() => syncPendingEvents(), 30000);
}
