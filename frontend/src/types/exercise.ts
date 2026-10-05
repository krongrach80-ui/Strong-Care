export type ExerciseSlug = 'shoulder_raise' | 'bicep_curl' | 'knee_squat' | 'elbow_extension' | string;

export interface ExerciseDefinition {
  id: number;
  name: string;
  slug: ExerciseSlug;
  category: string;
  description: string;
  target_joint: string;
  target_angle: number;
  min_angle: number;
  max_angle: number;
  target_reps: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  // Clinical Configuration Parameters
  hold_seconds?: number;
  tolerance_angle?: number;
  max_safe_angle?: number;
  is_custom?: boolean;
}

export type RepState = 'START' | 'READY' | 'DOWN' | 'HOLD' | 'UP' | 'COMPLETE' | 'STOP';

export interface RepResult {
  rep_number: number;
  angle: number;
  accuracy: number;
  duration: number;
  is_correct: boolean;
  feedback: string;
  timestamp?: number;
  // Biomechanics Engine Clinical Metrics
  activeRomDeg?: number;
  romAchievementPct?: number;
  romDeficitDeg?: number;
  smoothnessScore?: number;
  formIntegrityScore?: number;
  cadenceRatio?: number;
  compensations?: string[];
}

export interface LiveAnalysisFrame {
  currentAngle: number;
  targetAngle: number;
  minAngle: number;
  maxAngle: number;
  state: RepState;
  repCount: number;
  targetReps: number;
  accuracy: number;
  feedback: string[];
  isCorrect: boolean;
  progressPercent: number;
  stabilityScore: number;
  // Real-time Biomechanics Telemetry
  activeRomDeg?: number;
  romDeficitDeg?: number;
  smoothnessScore?: number;
  angularVelocity?: number;
  formIntegrityScore?: number;
  compensations?: string[];
}

