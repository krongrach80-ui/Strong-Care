import { Landmark, PoseLandmarks } from '../types/pose';
import { ExerciseDefinition, ExerciseSlug, RepState } from '../types/exercise';

/**
 * Angle telemetry from the AngleEngine
 */
export interface AngleTelemetry {
  currentAngle: number;
  rawAngle: number;
  smoothedAngle: number;
  angularVelocity: number; // deg/s
  jointCenter: { x: number; y: number } | null;
  side: 'left' | 'right' | 'bilateral';
}

/**
 * Range of Motion telemetry from the RomEngine
 */
export interface RomTelemetry {
  baselineAngle: number;       // Resting starting angle (deg)
  targetAngle: number;         // Therapeutic prescribed angle (deg)
  minAngleInRep: number;       // Minimum excursion reached in current rep
  maxAngleInRep: number;       // Maximum excursion reached in current rep
  activeRomDeg: number;        // Current Active Range of Motion (AROM) in degrees
  achievementPercent: number;  // 0% - 100%+ of prescribed target ROM
  deficitDeg: number;          // Degrees short of the prescribed target
  normativePercent: number;    // % of anatomical normal range (AAOS standard)
  isTargetReached: boolean;
}

/**
 * Posture & compensation telemetry from the PostureEngine
 */
export interface PostureTelemetry {
  isInFrame: boolean;
  isUpright: boolean;
  isShouldersBalanced: boolean;
  spineAngle: number;          // Lateral / sagittal lean (deg)
  shoulderTilt: number;        // Shoulder hiking / elevation (deg)
  pelvicTilt: number;          // Hip tilt (deg)
  kneeValgusDeg?: number;      // Inward knee collapse (for squats/lower limb)
  stabilityScore: number;      // 0 - 100 stability score
  compensations: string[];     // Detected compensatory cheats (e.g. "Trunk Lean", "Shoulder Hiking")
  feedback: string[];          // Corrective clinical cues in Thai
}

/**
 * Repetition telemetry from the RepetitionEngine (State Machine)
 */
export interface RepetitionTelemetry {
  state: RepState;
  repCount: number;
  correctReps: number;
  phase: 'idle' | 'concentric' | 'apex_hold' | 'eccentric' | 'completed';
  timeInStateMs: number;
  holdProgressPercent: number; // 0 - 100% while holding in apex
}

/**
 * Movement Quality telemetry from MovementQualityEngine
 */
export interface MovementQualityTelemetry {
  smoothnessScore: number;     // 0 - 100 (inverse of angular jerk/tremor)
  tremorDetected: boolean;     // Detected neuromuscular shaking/instability
  concentricDurationSec: number;
  holdDurationSec: number;
  eccentricDurationSec: number;
  cadenceRatio: number;        // Ratio of eccentric to concentric time
  isCadenceControlled: boolean;// Whether patient controlled the eccentric return
  formIntegrityScore: number;  // Composite clinical quality score (0 - 100)
  qualityRating: 'excellent' | 'good' | 'fair' | 'needs_improvement';
}

/**
 * Repetition completion result payload
 */
export interface CompletedRepBiomechanics {
  repNumber: number;
  peakAngle: number;
  activeRomDeg: number;
  romAchievementPct: number;
  romDeficitDeg: number;
  durationSec: number;
  concentricSec: number;
  holdSec: number;
  eccentricSec: number;
  smoothnessScore: number;
  stabilityScore: number;
  formIntegrityScore: number;
  isCorrect: boolean;
  compensations: string[];
  feedback: string;
  timestamp: number;
}

/**
 * Unified real-time frame emitted by BiomechanicsEngine
 */
export interface BiomechanicsFrame {
  timestamp: number;
  angle: AngleTelemetry;
  rom: RomTelemetry;
  posture: PostureTelemetry;
  repetition: RepetitionTelemetry;
  quality: MovementQualityTelemetry;
  feedbackMessages: string[];
  isRepFinished: boolean;
  finishedRepData?: CompletedRepBiomechanics;
}
