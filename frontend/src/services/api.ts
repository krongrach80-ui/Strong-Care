import { Patient } from '../types/patient';
import { ExerciseDefinition } from '../types/exercise';
import { Session, SessionReport } from '../types/session';

const API_BASE = '/api';

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
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    const json = await res.json();
    return json.data;
  },

  async getPatientHistory(patientId: number): Promise<{ patient: Patient; sessions: Session[] }> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/history`);
    const json = await res.json();
    return json.data;
  },

  async getSessionReport(sessionId: number): Promise<SessionReport> {
    const res = await fetch(`${API_BASE}/reports/${sessionId}`);
    const json = await res.json();
    return json.data;
  },

  async enrollFace(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/face/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async verifyFace(embedding: number[], threshold: number = 0.82): Promise<any> {
    const res = await fetch(`${API_BASE}/face/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedding, threshold }),
    });
    return await res.json();
  },

  async getFaceStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/face/status`);
      return await res.json();
    } catch (e) {
      return { total_embeddings: 0, enrolled_patients_count: 0 };
    }
  },
};

