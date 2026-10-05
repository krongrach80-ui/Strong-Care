import { MovementQualityTelemetry } from './types';

/**
 * MovementQualityEngine
 * Sub-engine assessing clinical quality of motion:
 * - Angular Jerk & Tremor Index (smoothness of motor control)
 * - Cadence & Tempo (ratio of eccentric to concentric duration)
 * - Composite Form Integrity Score (0 - 100)
 */
export class MovementQualityEngine {
  private velocityHistory: number[] = [];
  private accelerationHistory: number[] = [];
  private maxHistorySamples: number = 30; // ~1 second of motion window
  private tremorThreshold: number = 450; // Deg/s^2 oscillation threshold

  /**
   * Reset buffers
   */
  public reset(): void {
    this.velocityHistory = [];
    this.accelerationHistory = [];
  }

  /**
   * Feed new angular velocity to track acceleration and jerk
   */
  public recordVelocity(angularVelocity: number, dt: number = 0.033): void {
    if (this.velocityHistory.length > 0) {
      const prevV = this.velocityHistory[this.velocityHistory.length - 1];
      const accel = dt > 0 ? (angularVelocity - prevV) / dt : 0;
      this.accelerationHistory.push(accel);
      if (this.accelerationHistory.length > this.maxHistorySamples) {
        this.accelerationHistory.shift();
      }
    }

    this.velocityHistory.push(angularVelocity);
    if (this.velocityHistory.length > this.maxHistorySamples) {
      this.velocityHistory.shift();
    }
  }

  /**
   * Evaluate real-time movement quality
   */
  public process(
    angularVelocity: number,
    phaseDurations: { concentricSec: number; holdSec: number; eccentricSec: number },
    romAchievementPct: number,
    stabilityScore: number
  ): MovementQualityTelemetry {
    this.recordVelocity(angularVelocity);

    // 1. Smoothness Score (Normalized Jerk & Acceleration Variation)
    let jerkVariance = 0;
    if (this.accelerationHistory.length > 2) {
      let sumSqDiff = 0;
      for (let i = 1; i < this.accelerationHistory.length; i++) {
        const jerk = this.accelerationHistory[i] - this.accelerationHistory[i - 1];
        sumSqDiff += jerk * jerk;
      }
      jerkVariance = Math.sqrt(sumSqDiff / (this.accelerationHistory.length - 1));
    }

    // High jerk variance lowers smoothness
    const smoothnessScore = Math.min(100, Math.max(30, Math.round(100 - (jerkVariance / 25))));
    const tremorDetected = jerkVariance > this.tremorThreshold;

    // 2. Cadence & Tempo Analysis
    const { concentricSec, holdSec, eccentricSec } = phaseDurations;
    const cadenceRatio = concentricSec > 0.3
      ? Math.round((eccentricSec / concentricSec) * 100) / 100
      : 1.0;

    // In clinical therapy, eccentric should be controlled (at least ~0.8x of concentric)
    // A sudden uncontrolled drop results in eccentricSec < 0.5s when concentric was 1.5s+
    const isCadenceControlled = eccentricSec >= 0.7 || cadenceRatio >= 0.75;

    // 3. Composite Form Integrity Score (Weighted Clinical Scoring)
    // - 35% ROM Target Achievement
    // - 25% Posture & Kinetic Chain Stability
    // - 20% Smoothness (Tremor/Spasticity Resistance)
    // - 20% Controlled Cadence / Tempo
    let tempoScore = 100;
    if (concentricSec > 0 && concentricSec < 0.8) tempoScore -= 20; // Rushed concentric
    if (!isCadenceControlled && eccentricSec > 0) tempoScore -= 30; // Uncontrolled drop

    const formIntegrityScore = Math.min(
      100,
      Math.max(
        30,
        Math.round(
          0.35 * romAchievementPct +
          0.25 * stabilityScore +
          0.20 * smoothnessScore +
          0.20 * tempoScore
        )
      )
    );

    // Qualitative Rating
    let qualityRating: MovementQualityTelemetry['qualityRating'] = 'good';
    if (formIntegrityScore >= 88) qualityRating = 'excellent';
    else if (formIntegrityScore >= 72) qualityRating = 'good';
    else if (formIntegrityScore >= 55) qualityRating = 'fair';
    else qualityRating = 'needs_improvement';

    return {
      smoothnessScore,
      tremorDetected,
      concentricDurationSec: concentricSec,
      holdDurationSec: holdSec,
      eccentricDurationSec: eccentricSec,
      cadenceRatio,
      isCadenceControlled,
      formIntegrityScore,
      qualityRating,
    };
  }
}
