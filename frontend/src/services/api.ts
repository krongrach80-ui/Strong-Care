import { Patient } from '../types/patient';
import { ExerciseDefinition } from '../types/exercise';
import { Session, SessionReport } from '../types/session';
import { API_BASE_URL, IS_STATIC_MODE } from '../config/apiConfig';
import { IndexedDbService } from './indexedDbService';

const API_BASE = API_BASE_URL || '/api';

/**
 * In-memory and sessionStorage token manager (Never stores in localStorage for PDPA & security)
 */
let inMemoryToken: string | null = null;

export const authStorage = {
  getToken(): string | null {
    if (inMemoryToken) return inMemoryToken;
    if (typeof sessionStorage !== 'undefined') {
      try {
        return sessionStorage.getItem('strongcare_auth_token');
      } catch {
        return null;
      }
    }
    return null;
  },
  setToken(token: string | null): void {
    inMemoryToken = token;
    if (typeof sessionStorage !== 'undefined') {
      try {
        if (token) {
          sessionStorage.setItem('strongcare_auth_token', token);
        } else {
          sessionStorage.removeItem('strongcare_auth_token');
        }
      } catch {
        // Ignore storage error
      }
    }
  },
  clear(): void {
    this.setToken(null);
  }
};

/**
 * Fetch wrapper that attaches Authorization: Bearer token and handles 401 redirection
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    authStorage.clear();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  }

  return response;
}

/**
 * Helper: Format Date as Local MySQL DateTime string (YYYY-MM-DD HH:mm:ss)
 */
function formatLocalMySQLDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const api = {
  getAuthToken(): string | null {
    return authStorage.getToken();
  },

  setAuthToken(token: string | null): void {
    authStorage.setToken(token);
  },

  /**
   * เข้าสู่ระบบด้วย PIN หรือรหัสผ่านฝั่งเซิร์ฟเวอร์
   */
  async login(payload: { patient_id?: number | string; patient_code?: string; pin?: string; username?: string; password?: string }): Promise<any> {
    if (IS_STATIC_MODE) {
      return {
        status: 'success',
        role: 'patient',
        token: 'demo-static-token',
        patient: { id: payload.patient_id || 1, name: 'คุณสมชาย ใจดี [โหมดสาธิต]' },
        message: 'เข้าสู่ระบบสำเร็จ [โหมดสาธิต]'
      };
    }

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `เข้าสู่ระบบไม่สำเร็จ HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  /**
   * ออกจากระบบ
   */
  async logout(): Promise<void> {
    try {
      if (!IS_STATIC_MODE) {
        await fetchWithAuth(`${API_BASE}/auth/logout`, { method: 'POST' });
      }
    } catch {
      // Ignore network error on logout
    } finally {
      authStorage.clear();
    }
  },

  /**
   * ดึงรายชื่อผู้ป่วย (เฉพาะบุคลากร หรือใช้ fallback ในโหมดสาธิต)
   */
  async getPatients(): Promise<Patient[]> {
    if (IS_STATIC_MODE) {
      return [
        { id: 1, patient_code: 'PT-2026-001', name: 'คุณสมชาย ใจดี [โหมดสาธิต]', age: 65, gender: 'male', notes: 'ฟื้นฟูกล้ามเนื้อไหล่และข้อศอกหลังผ่าตัด' },
        { id: 2, patient_code: 'PT-2026-002', name: 'วิภาดา รัตนกุล (Wiphada R.) [โหมดสาธิต]', age: 42, gender: 'female', notes: 'กายภาพบำบัดฟื้นฟูข้อเข่า' },
      ];
    }

    const res = await fetchWithAuth(`${API_BASE}/patients`);
    if (!res.ok) {
      throw new Error(`โหลดรายชื่อผู้ป่วยไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data ?? [];
  },

  /**
   * สร้างโปรไฟล์ผู้ป่วยใหม่ (มี Fallback โหมดสาธิตหากล้มเหลว)
   */
  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    if (IS_STATIC_MODE) {
      return {
        id: Date.now(),
        patient_code: patient.patient_code ?? `PT-DEMO-${Math.floor(Math.random() * 1000)}`,
        name: patient.name ?? 'ผู้ป่วยใหม่ [โหมดสาธิต]',
        age: patient.age ?? 60,
        gender: patient.gender ?? 'other',
        notes: `${patient.notes ?? ''} [โหมดสาธิต]`.trim(),
      };
    }

    const res = await fetchWithAuth(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) {
      throw new Error(`สร้างโปรไฟล์ไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * ดึงรายการท่ากายภาพบำบัด
   */
  async getExercises(): Promise<ExerciseDefinition[]> {
    if (IS_STATIC_MODE) {
      return [
        {
          id: 1,
          name: 'Shoulder Lateral Raise (กางแขนยกหัวไหล่) [โหมดสาธิต]',
          slug: 'shoulder_raise',
          category: 'Upper Body',
          description: 'ฝึกยกแขนออกด้านข้างลำตัวเพื่อฟื้นฟูกล้ามเนื้อ Deltoid',
          target_joint: 'shoulder',
          target_angle: 90,
          min_angle: 75,
          max_angle: 110,
          target_reps: 10,
          difficulty: 'beginner',
        },
        {
          id: 2,
          name: 'Bicep Curl (งอข้อศอกฟื้นฟูกล้ามเนื้อ) [โหมดสาธิต]',
          slug: 'bicep_curl',
          category: 'Upper Body',
          description: 'บริหารข้อศอกและการเคลื่อนไหวแขนท่อนล่าง',
          target_joint: 'elbow',
          target_angle: 50,
          min_angle: 35,
          max_angle: 65,
          target_reps: 10,
          difficulty: 'beginner',
        },
      ];
    }

    const res = await fetchWithAuth(`${API_BASE}/exercises`);
    if (!res.ok) {
      throw new Error(`โหลดรายการท่าออกกำลังกายไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data ?? [];
  },

  /**
   * บันทึกผลเซสชัน (ต้อง throw หากส่งขึ้นเซิร์ฟเวอร์ไม่ได้ เพื่อให้ระบบจัดการคิวซิงก์)
   */
  async saveSession(sessionData: Partial<Session>): Promise<Session> {
    if (IS_STATIC_MODE) {
      return {
        id: sessionData.id ?? Date.now(),
        patient_id: sessionData.patient_id ?? 1,
        exercise_id: sessionData.exercise_id ?? 1,
        started_at: sessionData.started_at ?? formatLocalMySQLDateTime(),
        ended_at: sessionData.ended_at ?? formatLocalMySQLDateTime(),
        avg_duration_per_rep: sessionData.avg_duration_per_rep ?? 6.0,
        total_reps: sessionData.total_reps ?? 10,
        correct_reps: sessionData.correct_reps ?? 8,
        accuracy: sessionData.accuracy ?? 88,
        status: sessionData.status ?? 'completed',
        notes: `${sessionData.notes ?? ''} [โหมดสาธิต]`.trim(),
        results: sessionData.results ?? [],
      };
    }

    const res = await fetchWithAuth(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });

    if (!res.ok) {
      throw new Error(`บันทึกเซสชันขึ้นเซิร์ฟเวอร์ไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data ?? (sessionData as Session);
  },

  /**
   * ดึงประวัติผู้ป่วย
   */
  async getPatientHistory(patientId: number): Promise<{ patient: Patient; sessions: Session[] }> {
    if (IS_STATIC_MODE) {
      return {
        patient: { id: patientId, patient_code: 'PT-2026-001', name: 'คุณสมชาย ใจดี [โหมดสาธิต]', age: 65, gender: 'male', notes: 'ฟื้นฟูข้อไหล่และกล้ามเนื้อสะบัก' },
        sessions: [
          { id: 101, patient_id: patientId, exercise_id: 1, started_at: '2026-10-04 10:00:00', avg_duration_per_rep: 5.5, total_reps: 10, correct_reps: 9, accuracy: 90, status: 'completed' },
          { id: 102, patient_id: patientId, exercise_id: 2, started_at: '2026-10-05 09:30:00', avg_duration_per_rep: 6.0, total_reps: 12, correct_reps: 10, accuracy: 85, status: 'completed' },
        ],
      };
    }

    const res = await fetchWithAuth(`${API_BASE}/patients/${patientId}/history`);
    if (!res.ok) {
      throw new Error(`ดึงประวัติผู้ป่วยไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * ลบข้อมูลผู้ป่วยทั้งหมดตามสิทธิ์ PDPA (ทั้งเซิร์ฟเวอร์และแคช)
   */
  async purgePatientData(patientId: number | string): Promise<{ success: boolean; message: string }> {
    if (IS_STATIC_MODE) {
      await IndexedDbService.purgePatientData(patientId);
      return { success: true, message: 'ลบข้อมูลในเครื่องและโหมดสาธิตสำเร็จตาม PDPA [โหมดสาธิต]' };
    }

    try {
      const res = await fetchWithAuth(`${API_BASE}/patients/${patientId}/purge`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`ลบข้อมูลฝั่งเซิร์ฟเวอร์ไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      // Server returned success: purge local client storage for this patient
      await IndexedDbService.purgePatientData(patientId);
      return data;
    } catch (err: any) {
      console.warn('Server purge endpoint warning:', err);
      return { success: false, message: err?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อลบข้อมูลได้' };
    }
  },

  /**
   * ดึงรายงานผลสรุปเซสชัน
   */
  async getSessionReport(sessionId: number): Promise<SessionReport> {
    if (IS_STATIC_MODE) {
      return {
        session: { id: sessionId, patient_id: 1, exercise_id: 1, started_at: formatLocalMySQLDateTime(), avg_duration_per_rep: 5.0, total_reps: 10, correct_reps: 9, accuracy: 90, status: 'completed' },
        patient: { id: 1, patient_code: 'PT-2026-001', name: 'คุณสมชาย ใจดี [โหมดสาธิต]', age: 65, gender: 'male' },
        metrics: { total_reps: 10, correct_reps: 9, accuracy_percentage: 90, max_angle: 92, avg_angle: 88, status: 'completed' },
        results: [],
      };
    }

    const res = await fetchWithAuth(`${API_BASE}/reports/${sessionId}`);
    if (!res.ok) {
      throw new Error(`ดึงรายงานเซสชันไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * ลงทะเบียนใบหน้า
   */
  async enrollFace(payload: any): Promise<any> {
    if (IS_STATIC_MODE) {
      return {
        status: 'success',
        message: 'ลงทะเบียนใบหน้าสำเร็จ [โหมดสาธิต]',
        patient: { id: 1, name: `${payload.name ?? 'คุณสมชาย ใจดี'} [โหมดสาธิต]` },
      };
    }

    const res = await fetch(`${API_BASE}/face/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`ลงทะเบียนใบหน้าไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  },

  /**
   * ยืนยันตัวตนด้วยใบหน้า (รองรับทั้งโหมดสาธิตและเซิร์ฟเวอร์จริง)
   * เกณฑ์ความคล้ายคลึงถูกบริหารจัดการจาก backend config.php ที่เดียว
   */
  async verifyFace(embedding: number[]): Promise<any> {
    if (IS_STATIC_MODE) {
      return {
        status: 'success',
        match: true,
        similarity: 0.92,
        similarity_percent: 92,
        token: 'demo-face-token',
        patient: { id: 1, patient_code: 'PT-2026-001', name: 'คุณสมชาย ใจดี [โหมดสาธิต]', age: 65 },
      };
    }

    const res = await fetch(`${API_BASE}/face/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedding }),
    });

    if (!res.ok) {
      throw new Error(`ตรวจสอบใบหน้าไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  /**
   * สถานะเวกเตอร์ใบหน้าในระบบ
   */
  async getFaceStatus(): Promise<any> {
    if (IS_STATIC_MODE) {
      return { total_embeddings: 3, enrolled_patients_count: 2, mode: 'โหมดสาธิต' };
    }

    const res = await fetch(`${API_BASE}/face/status`);
    if (!res.ok) {
      throw new Error(`ดึงสถานะใบหน้าไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  },

  /**
   * ซิงก์ข้อมูลออฟไลน์กับเซิร์ฟเวอร์
   */
  async sync(payload: { sessions?: any[]; safety_events?: any[] }): Promise<any> {
    if (IS_STATIC_MODE) {
      return { status: 'success', message: 'ทำงานในโหมดสาธิต (ไม่ส่งข้อมูลขึ้นเซิร์ฟเวอร์)', data: { synced_sessions: 0 } };
    }

    const res = await fetchWithAuth(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `ซิงก์ข้อมูลไม่สำเร็จ HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  },
};
