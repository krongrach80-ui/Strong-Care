import { Session } from '../types/session';
import { api } from './api';
import { IndexedDBStorageService } from './indexedDbService';
import { SafetyViolation } from '../biomechanics/SafetyEngine';

const OFFLINE_SESSIONS_KEY = 'physiovision_offline_sessions';
const PENDING_SYNC_QUEUE_KEY = 'physiovision_pending_sync_queue';

export class OfflineStorageService {
  /**
   * Get all locally stored completed sessions (Summaries without bulky coordinate results)
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
   * บันทึกสรุป session ลง localStorage (ตัด results ออก เพื่อประหยัดพื้นที่และไม่กิน memory)
   */
  public static cacheSessionSummary(session: Session): void {
    try {
      // ตัด results ออกเพื่อเก็บเฉพาะสรุป session
      const { results, ...sessionSummary } = session;
      const list = this.getLocalSessions();
      const updated = [sessionSummary as Session, ...list.filter((s) => s.id !== session.id)];
      localStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to cache session summary in localStorage:', e);
    }
  }

  /**
   * บันทึก session ลง IndexedDB (เก็บรายละเอียดเต็ม) และสรุปย่อลง localStorage
   * (หมายเหตุ: ไม่เข้าคิวซิงก์อัตโนมัติ จะเข้าคิวเฉพาะเมื่อส่งขึ้นเซิร์ฟเวอร์ล้มเหลวเท่านั้น)
   */
  public static saveLocalSession(session: Session, safetyEvents: SafetyViolation[] = []): void {
    // 1. เก็บข้อมูลละเอียดครบทุกรอบใน IndexedDB
    IndexedDBStorageService.saveSessionWithDetails(session, safetyEvents).catch((err) => {
      console.warn('IndexedDB save failed:', err);
    });

    // 2. เก็บเฉพาะสรุปย่อใน localStorage
    this.cacheSessionSummary(session);
  }

  /**
   * บันทึก session พร้อมส่งขึ้นเซิร์ฟเวอร์:
   * หากส่งขึ้นเซิร์ฟเวอร์ล้มเหลว จะนำเข้าคิวซิงก์เดี่ยวใน localStorage เพื่อรอนำส่งภายหลัง
   */
  public static async saveSessionWithServerSync(
    session: Session,
    safetyEvents: SafetyViolation[] = []
  ): Promise<Session> {
    // 1. บันทึกลง local เสมอ
    this.saveLocalSession(session, safetyEvents);

    // 2. ลองส่งขึ้นเซิร์ฟเวอร์
    try {
      const saved = await api.saveSession(session);
      return saved;
    } catch (err) {
      console.warn('บันทึกขึ้นเซิร์ฟเวอร์ไม่สำเร็จ นำเข้าคิวรอซิงก์ (Pending Sync Queue):', err);
      // เข้าคิวเฉพาะเมื่อบันทึกขึ้นเซิร์ฟเวอร์ล้มเหลว
      this.addToSyncQueue(session);
      return session;
    }
  }

  /**
   * เพิ่ม session เข้าคิวซิงก์เดี่ยวใน localStorage
   */
  public static addToSyncQueue(session: Session): void {
    try {
      const queue = this.getSyncQueue();
      if (!queue.some((s) => s.id === session.id)) {
        // ในคิวก็ตัด results ออกถ้าจำเป็น หรือเก็บเฉพาะข้อมูลที่ต้องซิงก์
        const { results, ...sessionData } = session;
        queue.push({ ...sessionData, results: results ?? [] } as Session);
        localStorage.setItem(PENDING_SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('Failed to add to sync queue:', e);
    }
  }

  /**
   * ดึงคิวที่รอซิงก์ (คิวเดียวใน localStorage)
   */
  public static getSyncQueue(): Session[] {
    try {
      const data = localStorage.getItem(PENDING_SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private static isSyncing = false;

  /**
   * ส่งข้อมูลในคิวทั้งหมดขึ้นเซิร์ฟเวอร์
   */
  public static async syncPendingSessions(): Promise<{
    syncedCount: number;
    failedCount: number;
  }> {
    if (this.isSyncing) {
      return { syncedCount: 0, failedCount: 0 };
    }
    this.isSyncing = true;
    try {
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
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * ตรวจสอบสถานะการเชื่อมต่ออินเทอร์เน็ต
   */
  public static isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
}
