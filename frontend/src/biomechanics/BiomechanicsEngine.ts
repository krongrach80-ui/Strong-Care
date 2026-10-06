import { PoseLandmarks } from '../types/pose';
import { ExerciseDefinition } from '../types/exercise';
import { AngleEngine } from './AngleEngine';
import { RomEngine } from './RomEngine';
import { PostureEngine } from './PostureEngine';
import { RepetitionEngine } from './RepetitionEngine';
import { MovementQualityEngine } from './MovementQualityEngine';
import { evaluateLandmarkConfidence } from '../algorithms/confidence';
import {
  BiomechanicsFrame,
  CompletedRepBiomechanics,
} from './types';

export interface BiomechanicsEngineCallbacks {
  onRepCompleted?: (rep: CompletedRepBiomechanics) => void;
  onPostureWarning?: (warnings: string[]) => void;
}

/**
 * BiomechanicsEngine
 * 
 * Master coordinator orchestrating the 5 specialized biomechanics sub-engines:
 * 1. AngleEngine: 3D/2D vector trigonometry, velocity, and spatial smoothing
 * 2. RomEngine: Active Range of Motion (AROM), deficit tracking, and AAOS normative comparison
 * 3. PostureEngine: Kinetic chain alignment, spine verticality, and compensatory cheat detection
 * 4. RepetitionEngine: 5-State Automaton with hysteresis and peak hold enforcement
 * 5. MovementQualityEngine: Angular jerk/smoothness, tempo ratio, and composite form scoring
 */
export class BiomechanicsEngine {
  public readonly angleEngine: AngleEngine;
  public readonly romEngine: RomEngine;
  public readonly postureEngine: PostureEngine;
  public readonly repetitionEngine: RepetitionEngine;
  public readonly qualityEngine: MovementQualityEngine;

  private exercise: ExerciseDefinition;
  private callbacks: BiomechanicsEngineCallbacks;
  private completedReps: CompletedRepBiomechanics[] = [];
  private isEmergencyStopped: boolean = false;

  constructor(exercise: ExerciseDefinition, callbacks: BiomechanicsEngineCallbacks = {}) {
    this.exercise = exercise;
    this.callbacks = callbacks;

    this.angleEngine = new AngleEngine(0.65);
    this.romEngine = new RomEngine(exercise);
    this.postureEngine = new PostureEngine(this.angleEngine);
    this.repetitionEngine = new RepetitionEngine(exercise, 600);
    this.qualityEngine = new MovementQualityEngine();
  }

  public setEmergencyStop(stopped: boolean): void {
    this.isEmergencyStopped = stopped;
  }

  public getIsEmergencyStopped(): boolean {
    return this.isEmergencyStopped;
  }

  /**
   * Reset all sub-engines for a clean session
   */
  public reset(): void {
    this.angleEngine.reset();
    this.repetitionEngine.reset();
    this.qualityEngine.reset();
    this.completedReps = [];
    this.isEmergencyStopped = false;
  }

  /**
   * Process a single video frame with raw landmarks through all 5 biomechanical layers
   */
  public processFrame(
    landmarks: PoseLandmarks,
    timestamp: number = Date.now(),
    dimensions?: { width: number; height: number }
  ): BiomechanicsFrame {
    // Layer 1: Angle calculation & spatial smoothing
    const angleTelemetry = this.angleEngine.process(landmarks, this.exercise, timestamp, dimensions);

    // Layer 2: Posture & kinetic compensation analysis
    const postureTelemetry = this.postureEngine.process(landmarks, this.exercise);

    // Layer 3: ROM assessment
    const romTelemetry = this.romEngine.process(angleTelemetry.currentAngle);

    // Layer 4: Real Landmark Confidence Aggregation & Safety Gate
    const confEval = evaluateLandmarkConfidence(landmarks, this.exercise.slug, 0.35);
    const isConfident = !this.isEmergencyStopped && confEval.isReliable && confEval.overallConfidence >= 45 && postureTelemetry.isInFrame && !!landmarks && landmarks.length > 0;

    const repResult = this.repetitionEngine.process(
      angleTelemetry.currentAngle,
      postureTelemetry.isUpright && postureTelemetry.isShouldersBalanced,
      isConfident,
      timestamp
    );

    // Strict Fail-Safe: If emergency stopped or low confidence, rep can NEVER finish!
    if (this.isEmergencyStopped) {
      repResult.isRepJustCompleted = false;
      repResult.telemetry.state = 'STOP';
    } else if (!isConfident) {
      repResult.isRepJustCompleted = false;
    }

    // Layer 5: Movement Quality & clinical scoring
    const qualityTelemetry = this.qualityEngine.process(
      angleTelemetry.angularVelocity,
      repResult.phaseDurations,
      romTelemetry.achievementPercent,
      postureTelemetry.stabilityScore
    );

    // Combine clinical feedback messages
    const feedbackMessages: string[] = [];
    if (repResult.feedback) feedbackMessages.push(repResult.feedback);
    if (postureTelemetry.feedback.length > 0) {
      feedbackMessages.push(...postureTelemetry.feedback);
      if (this.callbacks.onPostureWarning) {
        this.callbacks.onPostureWarning(postureTelemetry.feedback);
      }
    }
    if (qualityTelemetry.tremorDetected) {
      feedbackMessages.push('สังเกตเห็นอาการสั่นเกร็ง ค่อยๆ ผ่อนคลายกล้ามเนื้อ');
    }

    let finishedRepData: CompletedRepBiomechanics | undefined = undefined;

    // Rep completed event handling
    if (repResult.isRepJustCompleted) {
      const repRom = this.romEngine.getRepSummary();
      const isCorrect = qualityTelemetry.formIntegrityScore >= 70 && postureTelemetry.compensations.length === 0;

      let repFeedback = isCorrect
        ? 'ยอดเยี่ยม! ควบคุมองศาและจังหวะได้ดีมาก'
        : 'องศาหรือแนวกระดูกสันหลังยังคลาดเคลื่อนเล็กน้อย';

      if (qualityTelemetry.cadenceRatio < 0.7) {
        repFeedback += ' (ควรควบคุมจังหวะคลายกล้ามเนื้อให้ช้าลง)';
      }

      finishedRepData = {
        repNumber: repResult.telemetry.repCount,
        peakAngle: repRom.peakAngle,
        activeRomDeg: repRom.activeRomDeg,
        romAchievementPct: repRom.romAchievementPct,
        romDeficitDeg: repRom.romDeficitDeg,
        durationSec: repResult.phaseDurations.totalSec,
        concentricSec: repResult.phaseDurations.concentricSec,
        holdSec: repResult.phaseDurations.holdSec,
        eccentricSec: repResult.phaseDurations.eccentricSec,
        smoothnessScore: qualityTelemetry.smoothnessScore,
        stabilityScore: postureTelemetry.stabilityScore,
        formIntegrityScore: qualityTelemetry.formIntegrityScore,
        isCorrect,
        compensations: [...postureTelemetry.compensations],
        feedback: repFeedback,
        timestamp,
      };

      this.completedReps.push(finishedRepData);

      // Reset ROM excursion tracking for the upcoming repetition
      this.romEngine.resetForNewRep(angleTelemetry.currentAngle);

      if (this.callbacks.onRepCompleted) {
        this.callbacks.onRepCompleted(finishedRepData);
      }
    }

    return {
      timestamp,
      angle: angleTelemetry,
      rom: romTelemetry,
      posture: postureTelemetry,
      repetition: repResult.telemetry,
      quality: qualityTelemetry,
      feedbackMessages,
      isRepFinished: repResult.isRepJustCompleted,
      finishedRepData,
    };
  }

  /**
   * Return full session history of completed repetitions
   */
  public getHistory(): CompletedRepBiomechanics[] {
    return this.completedReps;
  }
}
