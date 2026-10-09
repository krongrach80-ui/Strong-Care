/**
 * StrongCare - Local Biometric Face Registry & Matching Engine
 * 
 * Provides:
 * 1. Persistent client-side face vector storage (Indexed/localStorage)
 * 2. High-precision Cosine Similarity vector matching (128-D ResNet-34)
 * 3. Multi-frame angle tolerance (Center, Left, Right)
 * 4. Dual cloud-synchronization with Supabase (patients.medical_history & face_embeddings table)
 * 5. Full offline autonomy for Kiosk & Reception modes
 */

export interface EnrolledFaceProfile {
  patientId: string | number;
  patientCode: string;
  name: string;
  age?: number;
  gender?: string;
  embeddings: number[][]; // 128-D L2-normalized float vectors
  enrolledAt: string;
}

export interface MatchResult {
  match: boolean;
  bestProfile: EnrolledFaceProfile | null;
  similarity: number;
  similarityPercent: number;
  margin: number;
}

const STORAGE_KEY = 'strongcare_enrolled_faces';
const DEFAULT_MATCH_THRESHOLD = 0.78; // ResNet-34 cosine similarity threshold (78%+)

export class FaceRegistryService {
  private static instance: FaceRegistryService;
  private cache: EnrolledFaceProfile[] | null = null;

  private constructor() {}

  public static getInstance(): FaceRegistryService {
    if (!FaceRegistryService.instance) {
      FaceRegistryService.instance = new FaceRegistryService();
    }
    return FaceRegistryService.instance;
  }

  /**
   * ดึงข้อมูลโปรไฟล์ใบหน้าทั้งหมดที่ลงทะเบียนไว้
   */
  public getAllProfiles(): EnrolledFaceProfile[] {
    if (this.cache) return this.cache;

    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.cache = [];
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.cache = parsed;
        return this.cache;
      }
    } catch (e) {
      console.warn('FaceRegistryService: Failed to parse stored profiles', e);
    }

    this.cache = [];
    return [];
  }

  /**
   * บันทึกหรืออัปเดตโปรไฟล์ใบหน้า
   */
  public saveProfile(profile: EnrolledFaceProfile): void {
    const list = this.getAllProfiles();
    const cleanEmbeddings = (profile.embeddings || []).filter(
      (v) => Array.isArray(v) && v.length === 128
    );

    if (cleanEmbeddings.length === 0) {
      console.warn('FaceRegistryService: No valid 128-D embeddings to save for', profile.name);
      return;
    }

    const existingIdx = list.findIndex(
      (p) =>
        (p.patientCode && profile.patientCode && p.patientCode.toLowerCase() === profile.patientCode.toLowerCase()) ||
        (p.patientId && profile.patientId && String(p.patientId) === String(profile.patientId)) ||
        (p.name && profile.name && p.name.trim().toLowerCase() === profile.name.trim().toLowerCase())
    );

    const newProfile: EnrolledFaceProfile = {
      patientId: profile.patientId,
      patientCode: profile.patientCode,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      embeddings: cleanEmbeddings,
      enrolledAt: profile.enrolledAt || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      // อัปเดตข้อมูลเดิมและผสานเวกเตอร์
      const existing = list[existingIdx];
      const mergedVectors = [...cleanEmbeddings];
      // เก็บเวกเตอร์เดิมไว้สูงสุดไม่เกิน 6 มุมเพื่อความแม่นยำ
      for (const oldVec of existing.embeddings) {
        if (mergedVectors.length >= 6) break;
        const isDuplicate = mergedVectors.some((v) => this.cosineSimilarity(v, oldVec) > 0.98);
        if (!isDuplicate) {
          mergedVectors.push(oldVec);
        }
      }
      newProfile.embeddings = mergedVectors;
      list[existingIdx] = newProfile;
    } else {
      list.push(newProfile);
    }

    this.cache = list;
    this.persist(list);
  }

  /**
   * ลบโปรไฟล์ใบหน้า
   */
  public removeProfile(idOrCode: string | number): void {
    const list = this.getAllProfiles();
    const filtered = list.filter(
      (p) => String(p.patientId) !== String(idOrCode) && p.patientCode !== String(idOrCode)
    );
    this.cache = filtered;
    this.persist(filtered);
  }

  /**
   * ล้างข้อมูลใบหน้าทั้งหมด
   */
  public clearAll(): void {
    this.cache = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * คำนวณ Cosine Similarity ระหว่าง 2 เวกเตอร์ 128 มิติ
   * ผลลัพธ์ช่วง [-1.0 ถึง 1.0] (เวกเตอร์ใบหน้า ResNet-34 ปกติอยู่ช่วง 0.0 ถึง 1.0)
   */
  public cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const vA = a[i];
      const vB = b[i];
      dot += vA * vB;
      normA += vA * vA;
      normB += vB * vB;
    }

    if (normA <= 0 || normB <= 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * ค้นหาโปรไฟล์ที่ตรงกับเวกเตอร์จากกล้องมากที่สุด
   */
  public findBestMatch(
    queryEmbedding: number[],
    threshold: number = DEFAULT_MATCH_THRESHOLD
  ): MatchResult {
    const profiles = this.getAllProfiles();

    if (!profiles.length || !queryEmbedding || queryEmbedding.length !== 128) {
      return {
        match: false,
        bestProfile: null,
        similarity: 0,
        similarityPercent: 0,
        margin: 0,
      };
    }

    // คำนวณความคล้ายคลึงสูงสุดของแต่ละคนไข้
    const scoredProfiles: { profile: EnrolledFaceProfile; bestSim: number }[] = [];

    for (const p of profiles) {
      let maxSimForPerson = -1;
      for (const storedVec of p.embeddings) {
        const sim = this.cosineSimilarity(queryEmbedding, storedVec);
        if (sim > maxSimForPerson) {
          maxSimForPerson = sim;
        }
      }
      if (maxSimForPerson > -1) {
        scoredProfiles.push({ profile: p, bestSim: maxSimForPerson });
      }
    }

    if (!scoredProfiles.length) {
      return {
        match: false,
        bestProfile: null,
        similarity: 0,
        similarityPercent: 0,
        margin: 0,
      };
    }

    // เรียงลำดับคะแนนจากมากไปน้อย
    scoredProfiles.sort((a, b) => b.bestSim - a.bestSim);

    const top = scoredProfiles[0];
    const second = scoredProfiles.length > 1 ? scoredProfiles[1] : null;
    const margin = second ? Math.max(0, top.bestSim - second.bestSim) : top.bestSim;

    const isMatch = top.bestSim >= threshold;

    return {
      match: isMatch,
      bestProfile: isMatch ? top.profile : null,
      similarity: Math.max(0, top.bestSim),
      similarityPercent: Math.round(Math.max(0, top.bestSim) * 100),
      margin,
    };
  }

  /**
   * ซิงค์ข้อมูลใบหน้าที่เก็บใน Supabase patients (ผ่าน medical_history หรือ notes) เข้าสู่เครื่อง
   */
  public syncFromPatients(patients: any[]): void {
    if (!Array.isArray(patients)) return;

    for (const p of patients) {
      if (!p) continue;

      let embeddings: number[][] = [];

      // ตรวจสอบ medical_history
      if (typeof p.medical_history === 'string' && p.medical_history.startsWith('FACE_EMB:')) {
        try {
          const parsed = JSON.parse(p.medical_history.slice('FACE_EMB:'.length));
          if (Array.isArray(parsed)) embeddings = parsed;
        } catch {}
      }

      // ตรวจสอบ therapist_notes เป็น fallback
      if (embeddings.length === 0 && typeof p.therapist_notes === 'string' && p.therapist_notes.startsWith('FACE_EMB:')) {
        try {
          const parsed = JSON.parse(p.therapist_notes.slice('FACE_EMB:'.length));
          if (Array.isArray(parsed)) embeddings = parsed;
        } catch {}
      }

      if (embeddings.length > 0) {
        this.saveProfile({
          patientId: p.id,
          patientCode: p.patient_code,
          name: p.full_name || p.name,
          age: p.age,
          gender: p.gender,
          embeddings,
          enrolledAt: p.created_at || new Date().toISOString(),
        });
      }
    }
  }

  private persist(list: EnrolledFaceProfile[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('FaceRegistryService: Failed to save to localStorage', e);
    }
  }
}

export const faceRegistryService = FaceRegistryService.getInstance();
