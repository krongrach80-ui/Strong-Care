export type SafetySeverity = 'NORMAL' | 'CAUTION' | 'CRITICAL_STOP';

export type ClinicalSafetyState =
  | 'NO_DATA'       // Pose confidence low or obscured
  | 'CALIBRATING'   // Pre-exercise 5-point calibration (3..2..1)
  | 'READY'         // Ready to exercise
  | 'SAFE'          // Normal execution within safe ROM
  | 'WARNING'       // Minor compensations (trunk lean, shoulder hike)
  | 'STOP';         // Emergency halt (over-ROM, rapid jerk, extreme lean)

export type SafetyViolationCode =
  | 'OVER_ROM'
  | 'EXTREME_TRUNK_LEAN'
  | 'SEVERE_SHOULDER_HIKE'
  | 'OUT_OF_FRAME'
  | 'LOW_CONFIDENCE'
  | 'ERRATIC_VELOCITY';

export interface SafetyViolation {
  code: SafetyViolationCode;
  severity: SafetySeverity;
  title: string;
  message: string;
  voiceMessage: string;
  timestamp: number;
  value?: number;
  threshold?: number;
}

export interface SafetyTelemetry {
  state: ClinicalSafetyState;
  severity: SafetySeverity;
  isEmergencyStop: boolean;
  activeViolations: SafetyViolation[];
  safetyScore: number; // 0-100
  canResume: boolean;
  emergencyStopTimestamp?: number;
  confidenceScore: number; // 0-100%
  isLowConfidenceFailSafe: boolean;
  statusMessage: string;
}

export interface SafetyRule {
  type: string;
  threshold: number;
  message: string;
  severity: SafetySeverity;
}
