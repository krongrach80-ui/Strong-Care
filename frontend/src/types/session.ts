import { RepResult } from './exercise';

export interface Session {
  id: number | string;
  patient_id: number | string;
  exercise_id: number | string;
  patient_name?: string;
  patient_code?: string;
  exercise_name?: string;
  exercise_slug?: string;
  started_at: string;
  ended_at?: string;
  total_reps: number;
  correct_reps: number;
  accuracy: number;
  avg_duration_per_rep?: number;
  max_angle?: number;
  avg_angle?: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  results?: RepResult[];
}

export interface SessionReport {
  session: Session;
  patient: {
    id: number | string;
    patient_code: string;
    name: string;
    age: number;
    gender: string;
    notes?: string;
  };
  metrics: {
    total_reps: number;
    correct_reps: number;
    accuracy_percentage: number;
    max_angle: number;
    avg_angle: number;
    status: string;
  };
  results: RepResult[];
}
