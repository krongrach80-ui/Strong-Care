import { Landmark, PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { ExerciseDefinition } from '../types/exercise';
import { AngleTelemetry } from './types';

/**
 * AngleEngine
 * Sub-engine responsible for joint vector trigonometry, 2D/3D angle resolution,
 * angular velocity computation, and noise suppression.
 *
 * Optimizations:
 * - Locks active arm per exercise set to prevent bouncing/jumping between sides
 * - Uses 2D trigonometry (in camera plane) for high webcam stability
 * - Calibrated single-stage smoothing for zero perceptible lag
 */
export class AngleEngine {
  private smoothedAngle: number = 0;
  private prevAngle: number = 0;
  private prevTimestamp: number = 0;
  private angularVelocity: number = 0;
  private alpha: number = 0.75; // Responsive EMA factor
  private lockedSide: 'left' | 'right' | null = null;

  constructor(smoothingAlpha: number = 0.75) {
    this.alpha = smoothingAlpha;
  }

  /**
   * Reset internal filter state and arm lock
   */
  public reset(): void {
    this.smoothedAngle = 0;
    this.prevAngle = 0;
    this.prevTimestamp = 0;
    this.angularVelocity = 0;
    this.lockedSide = null;
  }

  public setLockedSide(side: 'left' | 'right' | null): void {
    this.lockedSide = side;
  }

  public getLockedSide(): 'left' | 'right' | null {
    return this.lockedSide;
  }

  /**
   * Compute 3D or 2D angle between 3 points: A -> B (vertex) -> C
   */
  public calculateJointAngle(a: Landmark, b: Landmark, c: Landmark, use3D: boolean = false): number {
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
      // Hip - Shoulder - Elbow (2D planar trigonometry for webcam stability)
      const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];

      const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];

      const rightAngle = this.calculateJointAngle(rHip, rShoulder, rElbow, false);
      const leftAngle = this.calculateJointAngle(lHip, lShoulder, lElbow, false);

      // Lock side per set or choose active side with strong hysteresis
      if (!this.lockedSide) {
        if (leftAngle > rightAngle + 12 && leftAngle > 30) {
          this.lockedSide = 'left';
        } else if (rightAngle > leftAngle + 12 && rightAngle > 30) {
          this.lockedSide = 'right';
        }
      }

      const activeSide = this.lockedSide || (leftAngle > rightAngle + 10 ? 'left' : 'right');

      if (activeSide === 'left') {
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
      // Shoulder - Elbow - Wrist (2D planar trigonometry for stability)
      const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
      const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

      const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
      const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];

      const rightAngle = this.calculateJointAngle(rShoulder, rElbow, rWrist, false);
      const leftAngle = this.calculateJointAngle(lShoulder, lElbow, lWrist, false);

      if (slug === 'bicep_curl') {
        // Lower angle = more flexion (active)
        if (!this.lockedSide) {
          if (leftAngle < rightAngle - 15 && leftAngle < 120) {
            this.lockedSide = 'left';
          } else if (rightAngle < leftAngle - 15 && rightAngle < 120) {
            this.lockedSide = 'right';
          }
        }
        const activeSide = this.lockedSide || (leftAngle < rightAngle - 10 ? 'left' : 'right');
        if (activeSide === 'left') {
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
        if (!this.lockedSide) {
          if (leftAngle > rightAngle + 15 && leftAngle > 105) {
            this.lockedSide = 'left';
          } else if (rightAngle > leftAngle + 15 && rightAngle > 105) {
            this.lockedSide = 'right';
          }
        }
        const activeSide = this.lockedSide || (leftAngle > rightAngle + 10 ? 'left' : 'right');
        if (activeSide === 'left') {
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

    if (slug === 'knee_squat' || slug === 'chair_squat') {
      // Hip - Knee - Ankle (2D planar)
      const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      const rKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
      const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

      const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const lKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
      const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];

      const rightAngle = this.calculateJointAngle(rHip, rKnee, rAnkle, false);
      const leftAngle = this.calculateJointAngle(lHip, lKnee, lAnkle, false);

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
