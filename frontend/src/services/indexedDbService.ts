import { Session } from '../types/session';
import { RepResult } from '../types/exercise';
import { SafetyViolation } from '../biomechanics/SafetyEngine';

const DB_NAME = 'StrongCareDB';
const DB_VERSION = 2;

export interface FaceMetadataRecord {
  patientId: number;
  encryptedEmbedding: string; // Base64 AES-GCM encrypted vector
  embeddingHash: string; // SHA-256 integrity hash
  modelVersion: string; // e.g. "MediaPipe FaceMesh v0.10.14 - 128D"
  enrolledAt: string;
  consentTimestamp: string;
  hasLivenessCheck: boolean;
}

export class IndexedDBStorageService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          reject(new Error('IndexedDB not supported in this environment'));
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. users
          if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id' });
            userStore.createIndex('patient_code', 'patient_code', { unique: true });
          }

          // 2. face_metadata
          if (!db.objectStoreNames.contains('face_metadata')) {
            db.createObjectStore('face_metadata', { keyPath: 'patientId' });
          }

          // 3. sessions
          if (!db.objectStoreNames.contains('sessions')) {
            const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
            sessionStore.createIndex('patient_id', 'patient_id', { unique: false });
            sessionStore.createIndex('started_at', 'started_at', { unique: false });
          }

          // 4. rep_results
          if (!db.objectStoreNames.contains('rep_results')) {
            const repStore = db.createObjectStore('rep_results', { keyPath: 'id', autoIncrement: true });
            repStore.createIndex('session_id', 'session_id', { unique: false });
            repStore.createIndex('patient_id', 'patient_id', { unique: false });
          }

          // 5. safety_events
          if (!db.objectStoreNames.contains('safety_events')) {
            const safetyStore = db.createObjectStore('safety_events', { keyPath: 'id', autoIncrement: true });
            safetyStore.createIndex('session_id', 'session_id', { unique: false });
            safetyStore.createIndex('patient_id', 'patient_id', { unique: false });
            safetyStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 6. ลบ pending_sync_queue ใน IndexedDB ที่ไม่ได้ใช้ (ใช้คิวเดียวใน localStorage)
          if (db.objectStoreNames.contains('pending_sync_queue')) {
            db.deleteObjectStore('pending_sync_queue');
          }

          // 7. settings
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  /**
   * Save a complete session along with its detailed rep-by-rep data and safety events
   */
  public static async saveSessionWithDetails(
    session: Session,
    safetyEvents: SafetyViolation[] = []
  ): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['sessions', 'rep_results', 'safety_events'], 'readwrite');

      // 1. Put session
      const sessionStore = tx.objectStore('sessions');
      sessionStore.put(session);

      // 2. Put rep results
      if (session.results && session.results.length > 0) {
        const repStore = tx.objectStore('rep_results');
        for (const rep of session.results) {
          repStore.put({
            ...rep,
            session_id: session.id,
            patient_id: session.patient_id,
          });
        }
      }

      // 3. Put safety events
      if (safetyEvents && safetyEvents.length > 0) {
        const safetyStore = tx.objectStore('safety_events');
        for (const ev of safetyEvents) {
          safetyStore.put({
            ...ev,
            session_id: session.id,
            patient_id: session.patient_id,
          });
        }
      }

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('IndexedDB saveSessionWithDetails error:', err);
    }
  }

  /**
   * Fetch all sessions for a specific patient, sorted newest first
   */
  public static async getSessionsForPatient(patientId: number): Promise<Session[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sessions', 'readonly');
        const store = tx.objectStore('sessions');
        const index = store.index('patient_id');
        const request = index.getAll(patientId);

        request.onsuccess = () => {
          const list: Session[] = request.result || [];
          list.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
          resolve(list);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('IndexedDB getSessionsForPatient error:', e);
      return [];
    }
  }

  /**
   * Store protected face biometric metadata
   */
  public static async saveFaceMetadata(meta: FaceMetadataRecord): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('face_metadata', 'readwrite');
        tx.objectStore('face_metadata').put(meta);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB saveFaceMetadata error:', e);
    }
  }

  /**
   * Get face metadata for patient
   */
  public static async getFaceMetadata(patientId: number): Promise<FaceMetadataRecord | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('face_metadata', 'readonly');
        const request = tx.objectStore('face_metadata').get(patientId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Complete Right to be Forgotten: Purge all biometric and session data for a patient
   * ลบ rep_results, safety_events, pending_sync_queue และคีย์ localStorage ที่เกี่ยวข้อง
   */
  public static async purgePatientData(patientId: number): Promise<void> {
    try {
      const db = await this.getDB();
      
      // Determine existing stores to include in transaction
      const storeNames = ['face_metadata', 'sessions', 'rep_results', 'safety_events'].filter((s) =>
        db.objectStoreNames.contains(s)
      );

      if (storeNames.length > 0) {
        const tx = db.transaction(storeNames, 'readwrite');

        // 1. Delete face metadata
        if (db.objectStoreNames.contains('face_metadata')) {
          tx.objectStore('face_metadata').delete(patientId);
        }

        // 2. Delete all sessions and capture their session IDs
        const deletedSessionIds = new Set<number>();
        if (db.objectStoreNames.contains('sessions')) {
          const sessionStore = tx.objectStore('sessions');
          const index = sessionStore.index('patient_id');
          const req = index.getAll(patientId);
          req.onsuccess = () => {
            const sessions: Session[] = req.result || [];
            for (const s of sessions) {
              deletedSessionIds.add(s.id);
              sessionStore.delete(s.id);
            }
          };
        }

        // 3. Delete rep_results for patient
        if (db.objectStoreNames.contains('rep_results')) {
          const repStore = tx.objectStore('rep_results');
          const req = repStore.openCursor();
          req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
            if (cursor) {
              const val = cursor.value;
              if (val.patient_id === patientId || deletedSessionIds.has(val.session_id)) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
        }

        // 4. Delete safety_events for patient
        if (db.objectStoreNames.contains('safety_events')) {
          const safetyStore = tx.objectStore('safety_events');
          const req = safetyStore.openCursor();
          req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
            if (cursor) {
              const val = cursor.value;
              if (val.patient_id === patientId || deletedSessionIds.has(val.session_id)) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
        }

        await new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      }

      // 5. Purge related localStorage keys
      if (typeof window !== 'undefined' && window.localStorage) {
        // A. Remove patient sessions from offline sessions
        try {
          const sessionsRaw = localStorage.getItem('physiovision_offline_sessions');
          if (sessionsRaw) {
            const sessions: Session[] = JSON.parse(sessionsRaw);
            const filtered = sessions.filter((s) => s.patient_id !== patientId);
            localStorage.setItem('physiovision_offline_sessions', JSON.stringify(filtered));
          }
        } catch (e) {
          // ignore
        }

        // B. Remove patient items from pending sync queue
        try {
          const queueKeys = ['strongcare_pending_sync_queue', 'physiovision_pending_sync_queue'];
          for (const qKey of queueKeys) {
            const queueRaw = localStorage.getItem(qKey);
            if (queueRaw) {
              const queue: any[] = JSON.parse(queueRaw);
              const filtered = queue.filter((item) => (item.patient_id ?? item.payload?.patient_id) !== patientId);
              localStorage.setItem(qKey, JSON.stringify(filtered));
            }
          }
        } catch (e) {
          // ignore
        }

        // C. Remove any keys specific to this patient
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes(`patient_${patientId}`) || key.includes(`user_${patientId}`) || key.includes(`_p${patientId}`) || key.includes(`_p${patientId}_`))) {
            keysToRemove.push(key);
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn('IndexedDB purgePatientData error:', e);
    }
  }
}

export const IndexedDbService = IndexedDBStorageService;
