export interface Patient {
  id: number;
  patient_code: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
