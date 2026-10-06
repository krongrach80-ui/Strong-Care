import { PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { ExerciseDefinition } from '../types/exercise';
import { AngleEngine } from './AngleEngine';
import { PostureTelemetry } from './types';

/**
 * PostureEngine
 * Sub-engine responsible for evaluating kinetic chain alignment and detecting
 * compensatory movements (e.g. leaning the torso to cheat an arm raise,
 * hiking the shoulder, or knee valgus collapse during squats).
 *
 * Exercise-aware: Hips are supplementary for upper-body exercises (e.g. sitting or standing close to camera),
 * preventing spurious OUT_OF_FRAME triggers.
 */
export class PostureEngine {
  private angleEngine: AngleEngine;

  constructor(angleEngine?: AngleEngine) {
    this.angleEngine = angleEngine || new AngleEngine();
  }

  /**
   * Evaluate full posture, spinal alignment, and compensatory cheats
   */
  public process(landmarks: PoseLandmarks, exercise: ExerciseDefinition): PostureTelemetry {
    const feedback: string[] = [];
    const compensations: string[] = [];

    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    const isLowerBody = exercise.slug === 'knee_squat' || exercise.slug === 'chair_squat' || exercise.slug === 'alternating-knee-raise';

    // Check visibility based on exercise type
    const shouldersVisible = Boolean(
      leftShoulder && rightShoulder &&
      (leftShoulder.visibility === undefined || leftShoulder.visibility > 0.35) &&
      (rightShoulder.visibility === undefined || rightShoulder.visibility > 0.35)
    );

    const hipsVisible = Boolean(
      leftHip && rightHip &&
      (leftHip.visibility === undefined || leftHip.visibility > 0.35) &&
      (rightHip.visibility === undefined || rightHip.visibility > 0.35)
    );

    const isInFrame = isLowerBody ? (hipsVisible || Boolean(leftKnee && rightKnee)) : shouldersVisible;

    if (!isInFrame) {
      return {
        isInFrame: false,
        isUpright: false,
        isShouldersBalanced: false,
        spineAngle: 0,
        shoulderTilt: 0,
        pelvicTilt: 0,
        stabilityScore: 0,
        compensations: ['Out of Frame'],
        feedback: ['กรุณาขยับตัวให้อยู่ในกรอบกล้องให้เห็นตำแหน่งร่างกายชัดเจน'],
      };
    }

    // 1. Spine Verticality: Only evaluate if hips are in frame; otherwise skip (supplementary)
    let spineAngle = 0;
    let isUpright = true;

    if (hipsVisible && leftShoulder && rightShoulder && leftHip && rightHip) {
      const midShoulder = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
      };
      const midHip = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
      };

      spineAngle = this.angleEngine.calculateVerticalAngle(midShoulder, midHip);
      isUpright = spineAngle <= 14; // Spine should stay within 14° of vertical

      if (!isUpright) {
        compensations.push('Trunk Lean Compensation');
        if (exercise.slug === 'shoulder_raise') {
          feedback.push('อย่าเอียงลำตัวช่วยยกแขน รักษาสันหลังให้ตรง');
        } else {
          feedback.push('รักษาสันหลังให้ตรง อย่าเอียงลำตัว');
        }
      }
    }

    // 2. Shoulder Balance (Horizontal Tilt & Hiking)
    let shoulderTilt = 0;
    let isShouldersBalanced = true;

    if (shouldersVisible && leftShoulder && rightShoulder) {
      shoulderTilt = Math.abs(this.angleEngine.calculateHorizontalTilt(leftShoulder, rightShoulder));
      isShouldersBalanced = shoulderTilt <= 10; // Shoulders should be within 10°

      if (!isShouldersBalanced) {
        compensations.push('Shoulder Hiking Compensation');
        feedback.push('ระวังไหล่เอียง/ยกไหล่ขึ้น รักษาแนวระดับหัวไหล่ให้เท่ากัน');
      }
    }

    // 3. Pelvic Tilt: Only evaluate if hips are in frame
    let pelvicTilt = 0;
    if (hipsVisible && leftHip && rightHip) {
      pelvicTilt = Math.abs(this.angleEngine.calculateHorizontalTilt(leftHip, rightHip));
      if (pelvicTilt > 10) {
        compensations.push('Pelvic Asymmetry');
        feedback.push('รักษาระดับสะโพกให้สมดุล');
      }
    }

    // 4. Knee Valgus Check (for Squats / Lower limb)
    let kneeValgusDeg: number | undefined = undefined;
    if (isLowerBody && leftKnee && rightKnee && leftHip && rightHip && leftAnkle && rightAnkle) {
      const hipWidth = Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y);
      const kneeWidth = Math.hypot(rightKnee.x - leftKnee.x, rightKnee.y - leftKnee.y);

      // If knees cave in narrower than 70% of hip width during squat
      if (kneeWidth < hipWidth * 0.70) {
        compensations.push('Knee Valgus (Inward Collapse)');
        feedback.push('ระวังเข่าบิดเข้าด้านใน กางเข่าให้ชี้ไปตามแนวปลายเท้า');
      }
    }

    // Compute composite stability score
    let stabilityScore = 100;
    if (!isUpright) stabilityScore -= Math.min(30, Math.round(spineAngle * 2));
    if (!isShouldersBalanced) stabilityScore -= Math.min(25, Math.round(shoulderTilt * 2));
    if (pelvicTilt > 10) stabilityScore -= 15;
    if (compensations.includes('Knee Valgus (Inward Collapse)')) stabilityScore -= 20;

    return {
      isInFrame: true,
      isUpright,
      isShouldersBalanced,
      spineAngle,
      shoulderTilt,
      pelvicTilt,
      kneeValgusDeg,
      stabilityScore: Math.max(0, stabilityScore),
      compensations,
      feedback,
    };
  }
}
