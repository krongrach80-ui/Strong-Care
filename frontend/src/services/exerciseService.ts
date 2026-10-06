import { ExerciseDefinition, LiveAnalysisFrame, RepResult } from '../types/exercise';
import { PoseLandmarks } from '../types/pose';
import { BiomechanicsEngine } from '../biomechanics/BiomechanicsEngine';
import { BiomechanicsFrame, CompletedRepBiomechanics } from '../biomechanics/types';

/**
 * ExerciseAnalyzer
 * 
 * Bridges high-level UI requests with the low-level BiomechanicsEngine.
 * Implements the layered architecture:
 * React -> Camera -> Pose Engine (MediaPipe) -> Biomechanics Engine -> UI
 */
export class ExerciseAnalyzer {
  private exercise: ExerciseDefinition;
  private biomechanics: BiomechanicsEngine;
  private repHistory: RepResult[] = [];
  private onRepFinish?: (res: RepResult) => void;

  constructor(exercise: ExerciseDefinition, onRepFinish?: (res: RepResult) => void) {
    this.exercise = exercise;
    this.onRepFinish = onRepFinish;

    this.biomechanics = new BiomechanicsEngine(exercise, {
      onRepCompleted: (rep: CompletedRepBiomechanics) => {
        const repResult: RepResult = {
          rep_number: rep.repNumber,
          angle: rep.peakAngle,
          accuracy: rep.formIntegrityScore,
          duration: rep.durationSec,
          is_correct: rep.isCorrect,
          feedback: rep.feedback,
          timestamp: rep.timestamp,
          activeRomDeg: rep.activeRomDeg,
          romAchievementPct: rep.romAchievementPct,
          romDeficitDeg: rep.romDeficitDeg,
          smoothnessScore: rep.smoothnessScore,
          formIntegrityScore: rep.formIntegrityScore,
          compensations: rep.compensations,
        };

        this.repHistory.push(repResult);
        if (this.onRepFinish) {
          this.onRepFinish(repResult);
        }
      },
    });
  }

  /**
   * Process landmarks through the Biomechanics Engine
   */
  public analyze(landmarks: PoseLandmarks, dimensions?: { width: number; height: number }): {
    frame: LiveAnalysisFrame;
    biomechanicsFrame: BiomechanicsFrame;
    primaryJointPoint: { x: number; y: number } | null;
  } {
    const bioFrame = this.biomechanics.processFrame(landmarks, Date.now(), dimensions);

    const frame: LiveAnalysisFrame = {
      currentAngle: bioFrame.angle.currentAngle,
      targetAngle: this.exercise.target_angle,
      minAngle: this.exercise.min_angle,
      maxAngle: this.exercise.max_angle,
      state: bioFrame.repetition.state,
      repCount: bioFrame.repetition.repCount,
      targetReps: this.exercise.target_reps,
      accuracy: bioFrame.quality.formIntegrityScore,
      feedback: bioFrame.feedbackMessages,
      // Fail-Safe: NEVER mark as correct if landmarks are missing or body is out of frame
      isCorrect: !!landmarks && landmarks.length > 0 && bioFrame.posture.isInFrame && bioFrame.posture.isUpright && bioFrame.quality.formIntegrityScore >= 70,
      progressPercent: bioFrame.rom.achievementPercent,
      stabilityScore: bioFrame.posture.stabilityScore,
      activeRomDeg: bioFrame.rom.activeRomDeg,
      romDeficitDeg: bioFrame.rom.deficitDeg,
      smoothnessScore: bioFrame.quality.smoothnessScore,
      angularVelocity: bioFrame.angle.angularVelocity,
      formIntegrityScore: bioFrame.quality.formIntegrityScore,
      compensations: bioFrame.posture.compensations,
    };

    return {
      frame,
      biomechanicsFrame: bioFrame,
      primaryJointPoint: bioFrame.angle.jointCenter,
    };
  }

  public getBiomechanicsEngine(): BiomechanicsEngine {
    return this.biomechanics;
  }

  public getHistory(): RepResult[] {
    return this.repHistory;
  }

  public setEmergencyStop(stopped: boolean): void {
    this.biomechanics.setEmergencyStop(stopped);
  }

  public reset(): void {
    this.biomechanics.reset();
    this.repHistory = [];
  }
}
