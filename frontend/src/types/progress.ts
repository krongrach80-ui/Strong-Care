export interface SessionMetrics {
  totalReps: number;
  correctReps: number;
  accuracy: number;
  avgAngle: number;
  maxAngle: number;
  rom: number;
  durationSeconds: number;
  safetyEventsCount: number;
  date: string;
}

export interface ProgressDelta {
  repsDiff: number;
  accuracyDiff: number;
  romDiff: number;
  durationDiff: number;
}

export interface PatientBaseline {
  baselineRom: number;
  baselineAccuracy: number;
  baselineDate: string;
  romImprovementPct: number;
  accuracyImprovementPct: number;
}

export interface PerformanceTrendPoint {
  sessionLabel: string;
  rom: number;
  accuracy: number;
  reps: number;
  date: string;
}

export interface XaiReasoning {
  recommendationCode: string;
  reasons: string[];
  confidenceScore: number; // e.g. 96%
  metricsSummary: {
    accuracyPct: number;
    romDeltaDeg: number;
    correctRepsRatio: string;
    safetyEventsCount: number;
  };
  trendObservation: string;
}

export interface AdaptiveRecommendation {
  id: string;
  type: 'INCREASE_DIFFICULTY' | 'DECREASE_DIFFICULTY' | 'MAINTAIN' | 'REST';
  title: string;
  description: string;
  suggestedTargetAngle?: number;
  suggestedTargetReps?: number;
  suggestedHoldDuration?: number;
  suggestedTolerance?: number;
  requiresCaregiverApproval: boolean;
  modelVersion: string;
  createdAt: string;
  xaiReasoning?: XaiReasoning;
}

export interface ProgressComparison {
  hasPreviousSession: boolean;
  current: SessionMetrics;
  previous: SessionMetrics | null;
  deltas: ProgressDelta;
  isImproved: boolean;
  baseline?: PatientBaseline;
  trend?: PerformanceTrendPoint[];
  adaptiveRecommendation: AdaptiveRecommendation | null;
}
