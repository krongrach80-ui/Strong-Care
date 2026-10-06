export type UserRole = 'patient' | 'caregiver' | 'therapist' | 'admin';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  patient_id?: number;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isFaceVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FaceLoginPayload {
  embedding: number[];
  qualityScore: number;
  livenessPassed: boolean;
}

export interface FaceEnrollPayload {
  userId?: number;
  patientId: number;
  embedding: number[];
  qualityScore: number;
  angleTag?: string;
  consentGranted: boolean;
}
