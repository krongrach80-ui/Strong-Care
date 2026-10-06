/**
 * StrongCare - Hospital Administration, RBAC & Clinical Management Types
 */

export type UserRole = 'admin' | 'therapist' | 'patient';
export type UserStatus = 'active' | 'suspended';

export interface UserAccount {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  code: string; // e.g. P-0012, T-003, ADM-01
  assignedTherapistName?: string;
  assignedTherapistId?: number;
  phone?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  diagnosis?: string;
  created_at: string;
  last_active?: string;
}

export interface PhysicalTherapist {
  id: number;
  code: string; // T-003
  name: string;
  specialty: string;
  phone: string;
  email: string;
  activePatientsCount: number;
  status: 'active' | 'on_leave';
  licenseNumber: string;
}

export interface PrescribedExercise {
  exerciseSlug: string;
  exerciseName: string;
  sets: number;
  reps: number;
  holdSeconds: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface TreatmentPlan {
  id: number;
  patientId: number;
  patientName: string;
  patientCode: string;
  therapistId: number;
  therapistName: string;
  diagnosis: string;
  targetJoint: string;
  assignedExercises: PrescribedExercise[];
  clinicalNotes: string;
  createdAt: string;
  updatedAt?: string;
  status: 'active' | 'completed' | 'paused';
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  role: UserRole;
  action: string;
  category: 'AUTH' | 'PATIENT' | 'THERAPIST' | 'TREATMENT' | 'SYSTEM' | 'AI';
  details: string;
}

export interface PatientSymptomReport {
  id: number;
  patientId: number;
  patientName: string;
  therapistId: number;
  reportedAt: string;
  symptomType: 'pain' | 'dizziness' | 'fatigue' | 'difficulty' | 'other';
  severity: 1 | 2 | 3 | 4 | 5; // 1-5 pain score
  affectedArea: string;
  description: string;
  status: 'pending' | 'reviewed';
  therapistReply?: string;
}

export interface AiSystemSettings {
  similarityThreshold: number; // default 0.82
  marginThreshold: number;     // default 0.08
  minVisibilityThreshold: number; // default 0.35
  maxTrunkLeanDeg: number;     // default 22
  maxVelocityDegPerSec: number; // default 220
  modelVersion: string;
  enableVoiceGuidance: boolean;
  enableAutoSync: boolean;
  strictLivenessChallenge: boolean;
}
