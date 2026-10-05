import { Session } from '../types/session';
import { api } from './api';
import { IndexedDBStorageService } from './indexedDbService';
import { SafetyViolation } from '../biomechanics/SafetyEngine';

const OFFLINE_SESSIONS_KEY = 'physiovision_offline_sessions';
const PENDING_SYNC_QUEUE_KEY = 'physiovision_pending_sync_queue';

export class OfflineStorageService {
  /**
   * Get all locally stored completed sessions
   */
  public static getLocalSessions(): Session[] {
    try {
      const data = localStorage.getItem(OFFLINE_SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to read offline sessions:', e);
      return [];
    }
  }

  /**
   * Save a newly completed session to IndexedDB (and cache metadata in localStorage)
   */
  public static saveLocalSession(session: Session, safetyEvents: SafetyViolation[] = []): void {
    // 1. Save detailed rep-by-rep data in IndexedDB
    IndexedDBStorageService.saveSessionWithDetails(session, safetyEvents).catch((err) => {
      console.warn('IndexedDB save failed:', err);
    });

    // 2. Cache session summary in localStorage for synchronous UI instant lookup
    const list = this.getLocalSessions();
    const updated = [session, ...list.filter((s) => s.id !== session.id)];
    localStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(updated));

    // Also add to pending sync queue
    this.addToSyncQueue(session);
  }

  /**
   * Add session to sync queue
   */
  public static addToSyncQueue(session: Session): void {
    try {
      const queue = this.getSyncQueue();
      if (!queue.some((s) => s.id === session.id)) {
        queue.push(session);
        localStorage.setItem(PENDING_SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('Failed to add to sync queue:', e);
    }
  }

  public static getSyncQueue(): Session[] {
    try {
      const data = localStorage.getItem(PENDING_SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Attempt to sync all pending sessions to the PHP / MySQL backend
   */
  public static async syncPendingSessions(): Promise<{
    syncedCount: number;
    failedCount: number;
  }> {
    const queue = this.getSyncQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, failedCount: 0 };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const remainingQueue: Session[] = [];

    for (const session of queue) {
      try {
        await api.saveSession(session);
        syncedCount++;
      } catch (err) {
        console.warn(`Sync failed for session ${session.id}:`, err);
        failedCount++;
        remainingQueue.push(session);
      }
    }

    localStorage.setItem(PENDING_SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
    return { syncedCount, failedCount };
  }

  /**
   * Check if running purely offline
   */
  public static isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
}
