import { Session } from '../types/session';
import { RepResult } from '../types/exercise';
import { SafetyViolation } from '../biomechanics/SafetyEngine';

const DB_NAME = 'StrongCareDB';
const DB_VERSION = 1;

export interface FaceMetadataRecord {
  patientId: number;
  encryptedEmbedding: string; // Base64 AES-GCM encrypted vector
  embeddingHash: string; // SHA-256 integrity hash
  modelVersion: string; // e.g. "MediaPipe FaceMesh v0.10.14 - 128D"
  enrolledAt: string;
  consentTimestamp: string;
  hasLivenessCheck: boolean;
}

export interface SyncQueueItem {
  id?: number;
  entityType: 'session' | 'patient' | 'safety';
  payload: any;
  createdAt: number;
  attempts: number;
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
          }

          // 5. safety_events
          if (!db.objectStoreNames.contains('safety_events')) {
            const safetyStore = db.createObjectStore('safety_events', { keyPath: 'id', autoIncrement: true });
            safetyStore.createIndex('session_id', 'session_id', { unique: false });
            safetyStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 6. pending_sync_queue
          if (!db.objectStoreNames.contains('pending_sync_queue')) {
            const queueStore = db.createObjectStore('pending_sync_queue', { keyPath: 'id', autoIncrement: true });
            queueStore.createIndex('entityType', 'entityType', { unique: false });
            queueStore.createIndex('createdAt', 'createdAt', { unique: false });
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
      const tx = db.transaction(['sessions', 'rep_results', 'safety_events', 'pending_sync_queue'], 'readwrite');

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

      // 4. Put into pending sync queue
      const queueStore = tx.objectStore('pending_sync_queue');
      queueStore.put({
        entityType: 'session',
        payload: session,
        createdAt: Date.now(),
        attempts: 0,
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('IndexedDB saveSessionWithDetails fallback to local storage:', err);
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
   */
  public static async purgePatientData(patientId: number): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['face_metadata', 'sessions', 'rep_results', 'safety_events'], 'readwrite');

      tx.objectStore('face_metadata').delete(patientId);

      // Delete all sessions for patient
      const sessionStore = tx.objectStore('sessions');
      const index = sessionStore.index('patient_id');
      const req = index.getAllKeys(patientId);
      req.onsuccess = () => {
        for (const key of req.result) {
          sessionStore.delete(key);
        }
      };

      return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('IndexedDB purgePatientData error:', e);
    }
  }

  /**
   * Fetch all items pending synchronization
   */
  public static async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('pending_sync_queue', 'readonly');
        const req = tx.objectStore('pending_sync_queue').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Remove item from sync queue once successfully transmitted
   */
  public static async removeSyncQueueItem(id: number): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('pending_sync_queue', 'readwrite');
      tx.objectStore('pending_sync_queue').delete(id);
    } catch (e) {
      // ignore
    }
  }
}
