export type ApprovalDecision = 'APPROVED' | 'MODIFIED' | 'REJECTED';

export interface ExerciseConfigSnapshot {
  target_angle: number;
  target_reps: number;
  min_angle?: number;
  max_angle?: number;
  hold_duration?: number;
  tolerance?: number;
}

export interface ApprovalAuditRecord {
  id: string;
  recommendation_id: string;
  patient_id?: number;
  patient_name?: string;
  exercise_id: number;
  exercise_name: string;
  previous_config: ExerciseConfigSnapshot;
  proposed_config: ExerciseConfigSnapshot;
  actual_config: ExerciseConfigSnapshot;
  decision: ApprovalDecision;
  approved_by: string;
  audit_note: string;
  timestamp: string;
  model_version: string;
}

export interface ClinicalAuditLog {
  sessionId: number;
  patientCode: string;
  exerciseName: string;
  startTime: string;
  endTime: string;
  totalReps: number;
  accuracy: number;
  maxRom: number;
  safetyViolations: Array<{
    code: string;
    severity: string;
    message: string;
    timestamp: number;
  }>;
  repTrail: Array<{
    repNumber: number;
    peakAngle: number;
    accuracy: number;
    duration: number;
    rom: number;
    velocity: number;
    compensation: string;
  }>;
}
