import { ExerciseDefinition } from '../types/exercise';
import { RomTelemetry } from './types';

/**
 * Normative anatomical reference values (in degrees) based on AAOS
 * (American Academy of Orthopaedic Surgeons) standards.
 */
const NORMATIVE_ROM_STANDARDS: Record<string, { baseline: number; fullAnatomical: number }> = {
  shoulder_raise: { baseline: 20, fullAnatomical: 180 }, // Shoulder Abduction: 0-180°
  bicep_curl: { baseline: 165, fullAnatomical: 40 },    // Elbow Flexion: 165° down to 40°
  knee_squat: { baseline: 175, fullAnatomical: 90 },    // Knee Flexion: 175° standing down to 90°
  elbow_extension: { baseline: 75, fullAnatomical: 180 },// Elbow Extension: 75° bent to 180° straight
};

/**
 * RomEngine
 * Sub-engine dedicated to Range of Motion (ROM) assessment:
 * - Active Range of Motion (AROM)
 * - Baseline resting angle tracking
 * - Achievement percentage vs prescribed rehabilitation target
 * - ROM Deficit calculation
 * - Normative percentage comparison against AAOS standard
 */
export class RomEngine {
  private exercise: ExerciseDefinition;
  private minAngleInRep: number = 999;
  private maxAngleInRep: number = -999;
  private baselineAngle: number;
  private isDecreasingTarget: boolean;

  constructor(exercise: ExerciseDefinition) {
    this.exercise = exercise;
    this.isDecreasingTarget = exercise.slug === 'bicep_curl' || exercise.slug === 'knee_squat';
    
    // Set default clinical baseline according to movement type
    const norm = NORMATIVE_ROM_STANDARDS[exercise.slug];
    this.baselineAngle = norm ? norm.baseline : (this.isDecreasingTarget ? 165 : 25);
  }

  /**
   * Reset excursion tracking for the start of a new repetition
   */
  public resetForNewRep(currentAngle: number): void {
    this.minAngleInRep = currentAngle;
    this.maxAngleInRep = currentAngle;
  }

  /**
   * Update excursion bounds with current angle
   */
  public updateExcursion(currentAngle: number): void {
    if (currentAngle < this.minAngleInRep) this.minAngleInRep = currentAngle;
    if (currentAngle > this.maxAngleInRep) this.maxAngleInRep = currentAngle;
  }

  /**
   * Calibrate or update baseline rest angle
   */
  public setCalibratedBaseline(angle: number): void {
    this.baselineAngle = Math.round(angle * 10) / 10;
  }

  /**
   * Calculate real-time ROM telemetry
   */
  public process(currentAngle: number): RomTelemetry {
    this.updateExcursion(currentAngle);

    const { target_angle } = this.exercise;
    const norm = NORMATIVE_ROM_STANDARDS[this.exercise.slug] || { baseline: this.baselineAngle, fullAnatomical: 180 };

    // Calculate Active ROM in current repetition
    const activeRomDeg = Math.max(0, Math.round((this.maxAngleInRep - this.minAngleInRep) * 10) / 10);

    // Calculate target excursion distance from baseline
    const targetExcursion = Math.abs(target_angle - this.baselineAngle);

    // Calculate current excursion from baseline
    const currentExcursion = Math.abs(currentAngle - this.baselineAngle);

    // Achievement % (capped at 100% for progress, or uncapped for analysis)
    const achievementPercent = targetExcursion > 0
      ? Math.min(100, Math.max(0, Math.round((currentExcursion / targetExcursion) * 100)))
      : 0;

    // Deficit calculation: how many degrees short of the target?
    let deficitDeg = 0;
    let isTargetReached = false;

    if (this.isDecreasingTarget) {
      deficitDeg = Math.max(0, Math.round((this.minAngleInRep - target_angle) * 10) / 10);
      isTargetReached = currentAngle <= target_angle + 10;
    } else {
      deficitDeg = Math.max(0, Math.round((target_angle - this.maxAngleInRep) * 10) / 10);
      isTargetReached = currentAngle >= target_angle - 10;
    }

    // Normative % of anatomical maximum
    const maxAnatomicalExcursion = Math.abs(norm.fullAnatomical - norm.baseline);
    const normativePercent = maxAnatomicalExcursion > 0
      ? Math.min(100, Math.round((currentExcursion / maxAnatomicalExcursion) * 100))
      : achievementPercent;

    return {
      baselineAngle: this.baselineAngle,
      targetAngle: target_angle,
      minAngleInRep: this.minAngleInRep === 999 ? currentAngle : this.minAngleInRep,
      maxAngleInRep: this.maxAngleInRep === -999 ? currentAngle : this.maxAngleInRep,
      activeRomDeg,
      achievementPercent,
      deficitDeg,
      normativePercent,
      isTargetReached,
    };
  }

  /**
   * Get final repetition ROM summary
   */
  public getRepSummary(): {
    peakAngle: number;
    activeRomDeg: number;
    romAchievementPct: number;
    romDeficitDeg: number;
  } {
    const peakAngle = this.isDecreasingTarget ? this.minAngleInRep : this.maxAngleInRep;
    const targetExcursion = Math.abs(this.exercise.target_angle - this.baselineAngle);
    const achievedExcursion = Math.abs(peakAngle - this.baselineAngle);

    const romAchievementPct = targetExcursion > 0
      ? Math.min(100, Math.max(0, Math.round((achievedExcursion / targetExcursion) * 100)))
      : 0;

    const romDeficitDeg = this.isDecreasingTarget
      ? Math.max(0, Math.round((this.minAngleInRep - this.exercise.target_angle) * 10) / 10)
      : Math.max(0, Math.round((this.exercise.target_angle - this.maxAngleInRep) * 10) / 10);

    const activeRomDeg = Math.max(0, Math.round((this.maxAngleInRep - this.minAngleInRep) * 10) / 10);

    return {
      peakAngle,
      activeRomDeg,
      romAchievementPct,
      romDeficitDeg,
    };
  }
}
