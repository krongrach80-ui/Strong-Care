import { Patient } from '../types/patient';
import { ExerciseDefinition } from '../types/exercise';
import { Session, SessionReport } from '../types/session';
import { API_BASE_URL, IS_STATIC_MODE } from '../config/apiConfig';

const API_BASE = API_BASE_URL || '/api';

export const api = {
  async getPatients(): Promise<Patient[]> {
    try {
      const res = await fetch(`${API_BASE}/patients`);
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('API getPatients fallback to local mock:', e);
      return [
        { id: 1, patient_code: 'PT-2026-001', name: 'สมชาย วิจิตรศิลป์ (Somchai V.)', age: 58, gender: 'male', notes: 'ฟื้นฟูกล้ามเนื้อไหล่และข้อศอกหลังผ่าตัด' },
        { id: 2, patient_code: 'PT-2026-002', name: 'วิภาดา รัตนกุล (Wiphada R.)', age: 42, gender: 'female', notes: 'กายภาพบำบัดฟื้นฟูข้อเข่า' },
      ];
    }
  },

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    const json = await res.json();
    return json.data;
  },

  async getExercises(): Promise<ExerciseDefinition[]> {
    try {
      const res = await fetch(`${API_BASE}/exercises`);
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('API getExercises fallback:', e);
      return [
        {
          id: 1,
          name: 'Shoulder Lateral Raise (กางแขนยกหัวไหล่)',
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
          name: 'Bicep Curl (งอข้อศอกฟื้นฟูกล้ามเนื้อ)',
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
  },

  async saveSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      const json = await res.json();
      return json.data || (sessionData as Session);
    } catch (e) {
      console.warn('API saveSession fallback to local:', e);
      return {
        id: Date.now(),
        patient_id: sessionData.patient_id || 1,
        exercise_id: sessionData.exercise_id || 1,
        started_at: sessionData.started_at || new Date().toISOString(),
        ended_at: sessionData.ended_at || new Date().toISOString(),
        avg_duration_per_rep: sessionData.avg_duration_per_rep || 6.0,
        total_reps: sessionData.total_reps || 10,
        correct_reps: sessionData.correct_reps || 8,
        accuracy: sessionData.accuracy || 88,
        status: 'completed',
        notes: sessionData.notes || 'บันทึกในโหมด Local/Static',
        results: sessionData.results || [],
      };
    }
  },

  async getPatientHistory(patientId: number): Promise<{ patient: Patient; sessions: Session[] }> {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/history`);
      const json = await res.json();
      return json.data;
    } catch (e) {
      console.warn('API getPatientHistory fallback:', e);
      return {
        patient: { id: patientId, patient_code: 'PT-2026-001', name: 'คุณสมชาย ใจดี', age: 65, gender: 'male', notes: 'ฟื้นฟูข้อไหล่และกล้ามเนื้อสะบัก' },
        sessions: [
          { id: 101, patient_id: patientId, exercise_id: 1, started_at: '2026-10-04 10:00:00', avg_duration_per_rep: 5.5, total_reps: 10, correct_reps: 9, accuracy: 90, status: 'completed' },
          { id: 102, patient_id: patientId, exercise_id: 2, started_at: '2026-10-05 09:30:00', avg_duration_per_rep: 6.0, total_reps: 12, correct_reps: 10, accuracy: 85, status: 'completed' },
        ],
      };
    }
  },

  async getSessionReport(sessionId: number): Promise<SessionReport> {
    try {
      const res = await fetch(`${API_BASE}/reports/${sessionId}`);
      const json = await res.json();
      return json.data;
    } catch (e) {
      console.warn('API getSessionReport fallback:', e);
      return {
        session: { id: sessionId, patient_id: 1, exercise_id: 1, started_at: new Date().toISOString(), avg_duration_per_rep: 5.0, total_reps: 10, correct_reps: 9, accuracy: 90, status: 'completed' },
        patient: { id: 1, patient_code: 'PT-2026-001', name: 'คุณสมชาย ใจดี', age: 65, gender: 'male' },
        metrics: { total_reps: 10, correct_reps: 9, accuracy_percentage: 90, max_angle: 92, avg_angle: 88, status: 'completed' },
        results: [],
      };
    }
  },

  async enrollFace(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/face/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e) {
      console.warn('API enrollFace fallback to local:', e);
      return { status: 'success', message: 'ลงทะเบียนใบหน้าสำเร็จ (Static Simulation)', patient: { id: 1, name: payload.name || 'คุณสมชาย ใจดี' } };
    }
  },

  async verifyFace(embedding: number[], threshold: number = 0.82): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding, threshold }),
      });
      return await res.json();
    } catch (e) {
      console.warn('API verifyFace fallback to local:', e);
      return { status: 'success', match: true, similarity: 0.92, similarity_percent: 92, patient: { id: 1, patient_code: 'PT-2026-001', name: 'คุณสมชาย ใจดี', age: 65 } };
    }
  },

  async getFaceStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/face/status`);
      return await res.json();
    } catch (e) {
      return { total_embeddings: 3, enrolled_patients_count: 2 };
    }
  },
};

