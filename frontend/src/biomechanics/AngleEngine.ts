import { Landmark, PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { ExerciseDefinition } from '../types/exercise';
import { AngleTelemetry } from './types';

/**
 * AngleEngine
 * Sub-engine responsible for joint vector trigonometry, 3D angle resolution,
 * angular velocity computation, and temporal noise suppression.
 */
export class AngleEngine {
  private smoothedAngle: number = 0;
  private prevAngle: number = 0;
  private prevTimestamp: number = 0;
  private angularVelocity: number = 0;
  private alpha: number = 0.65; // Smoothing factor (0 = infinite smooth, 1 = raw)

  constructor(smoothingAlpha: number = 0.65) {
    this.alpha = smoothingAlpha;
  }

  /**
   * Reset internal filter state
   */
  public reset(): void {
    this.smoothedAngle = 0;
    this.prevAngle = 0;
    this.prevTimestamp = 0;
    this.angularVelocity = 0;
  }

  /**
   * Compute 3D or 2D angle between 3 points: A -> B (vertex) -> C
   */
  public calculateJointAngle(a: Landmark, b: Landmark, c: Landmark, use3D: boolean = true): number {
    if (!a || !b || !c) return 0;

    // Vector BA
    const baX = a.x - b.x;
    const baY = a.y - b.y;
    const baZ = use3D && a.z !== undefined && b.z !== undefined ? (a.z - b.z) * 0.5 : 0;

    // Vector BC
    const bcX = c.x - b.x;
    const bcY = c.y - b.y;
    const bcZ = use3D && c.z !== undefined && b.z !== undefined ? (c.z - b.z) * 0.5 : 0;

    // Dot product
    const dot = baX * bcX + baY * bcY + baZ * bcZ;

    // Magnitudes
    const magBA = Math.hypot(baX, baY, baZ);
    const magBC = Math.hypot(bcX, bcY, bcZ);

    if (magBA === 0 || magBC === 0) return 0;

    // Clamped cosine for numerical stability
    const cosine = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
    const angleRad = Math.acos(cosine);
    const angleDeg = (angleRad * 180) / Math.PI;

    return Math.round(angleDeg * 10) / 10;
  }

  /**
   * Calculate vertical inclination relative to gravitational vertical (Y-axis)
   */
  public calculateVerticalAngle(top: Landmark, bottom: Landmark): number {
    if (!top || !bottom) return 0;
    const dx = top.x - bottom.x;
    const dy = top.y - bottom.y;
    const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
    return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
  }

  /**
   * Calculate horizontal tilt angle (e.g., shoulder or hip line)
   */
  public calculateHorizontalTilt(left: Landmark, right: Landmark): number {
    if (!left || !right) return 0;
    const dy = right.y - left.y;
    const dx = right.x - left.x;
    const angleRad = Math.atan2(dy, dx);
    return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
  }

  /**
   * Process raw landmarks for a specific exercise and return complete AngleTelemetry
   */
  public process(
    landmarks: PoseLandmarks,
    exercise: ExerciseDefinition,
    timestamp: number = Date.now()
  ): AngleTelemetry {
    const { angle: rawAngle, jointCenter, side } = this.extractExerciseAngle(landmarks, exercise);

    // Apply Exponential Moving Average (EMA)
    if (this.smoothedAngle === 0) {
      this.smoothedAngle = rawAngle;
    } else {
      this.smoothedAngle = this.alpha * rawAngle + (1 - this.alpha) * this.smoothedAngle;
    }
    const cleanAngle = Math.round(this.smoothedAngle * 10) / 10;

    // Calculate angular velocity (deg/sec)
    if (this.prevTimestamp > 0 && timestamp > this.prevTimestamp) {
      const dt = (timestamp - this.prevTimestamp) / 1000;
      if (dt > 0.005) {
        this.angularVelocity = Math.round(((cleanAngle - this.prevAngle) / dt) * 10) / 10;
      }
    }

    this.prevAngle = cleanAngle;
    this.prevTimestamp = timestamp;

    return {
      currentAngle: cleanAngle,
      rawAngle,
      smoothedAngle: cleanAngle,
      angularVelocity: this.angularVelocity,
      jointCenter,
      side,
    };
  }

  /**
   * Extract primary joint angle based on exercise kinematics
   */
  private extractExerciseAngle(
    landmarks: PoseLandmarks,
    exercise: ExerciseDefinition
  ): { angle: number; jointCenter: { x: number; y: number } | null; side: 'left' | 'right' | 'bilateral' } {
    const { slug } = exercise;

    if (slug === 'shoulder_raise') {
      // Hip - Shoulder - Elbow
      const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];

      const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];

      const rightAngle = this.calculateJointAngle(rHip, rShoulder, rElbow);
      const leftAngle = this.calculateJointAngle(lHip, lShoulder, lElbow);

      // Select active arm (higher angle / motion)
      if (leftAngle > rightAngle + 8) {
        return {
          angle: leftAngle,
          jointCenter: lShoulder ? { x: lShoulder.x, y: lShoulder.y } : null,
          side: 'left',
        };
      }
      return {
        angle: rightAngle,
        jointCenter: rShoulder ? { x: rShoulder.x, y: rShoulder.y } : null,
        side: 'right',
      };
    }

    if (slug === 'bicep_curl' || slug === 'elbow_extension') {
      // Shoulder - Elbow - Wrist
      const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
      const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

      const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
      const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];

      const rightAngle = this.calculateJointAngle(rShoulder, rElbow, rWrist);
      const leftAngle = this.calculateJointAngle(lShoulder, lElbow, lWrist);

      if (slug === 'bicep_curl') {
        // Lower angle = more flexion (active)
        if (leftAngle < rightAngle - 10 && leftAngle > 20) {
          return {
            angle: leftAngle,
            jointCenter: lElbow ? { x: lElbow.x, y: lElbow.y } : null,
            side: 'left',
          };
        }
        return {
          angle: rightAngle,
          jointCenter: rElbow ? { x: rElbow.x, y: rElbow.y } : null,
          side: 'right',
        };
      } else {
        // Elbow extension: higher angle = more extended
        if (leftAngle > rightAngle + 10) {
          return {
            angle: leftAngle,
            jointCenter: lElbow ? { x: lElbow.x, y: lElbow.y } : null,
            side: 'left',
          };
        }
        return {
          angle: rightAngle,
          jointCenter: rElbow ? { x: rElbow.x, y: rElbow.y } : null,
          side: 'right',
        };
      }
    }

    if (slug === 'knee_squat') {
      // Hip - Knee - Ankle
      const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      const rKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
      const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

      const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const lKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
      const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];

      const rightAngle = this.calculateJointAngle(rHip, rKnee, rAnkle);
      const leftAngle = this.calculateJointAngle(lHip, lKnee, lAnkle);

      // Average knee angle for bilateral squat
      const avgKneeAngle = Math.round(((rightAngle + leftAngle) / 2) * 10) / 10;
      const primaryKnee = rKnee || lKnee;

      return {
        angle: avgKneeAngle,
        jointCenter: primaryKnee ? { x: primaryKnee.x, y: primaryKnee.y } : null,
        side: 'bilateral',
      };
    }

    return { angle: 0, jointCenter: null, side: 'right' };
  }
}
