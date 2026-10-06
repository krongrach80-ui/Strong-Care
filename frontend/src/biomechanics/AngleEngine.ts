import { Landmark, PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { ExerciseDefinition } from '../types/exercise';
import { AngleTelemetry } from './types';
import { getPoseSpec } from './poseSpecs';

/**
 * AngleEngine
 * Sub-engine responsible for joint vector trigonometry, aspect-ratio-corrected
 * 2D/3D angle resolution, angular velocity computation, and noise suppression.
 *
 * Key features:
 * - Aspect-ratio-corrected trigonometry: scales horizontal coordinates by W/H so
 *   angles are identical across 16:9, 4:3, and 9:16 aspect ratios.
 * - Supports all 11 stretch exercises + 4 physio exercises + alternating knee raise (no zero return).
 * - Side-locking with filter reset to prevent switching artifacts.
 */
export class AngleEngine {
  private smoothedAngle: number = 0;
  private prevAngle: number = 0;
  private prevTimestamp: number = 0;
  private angularVelocity: number = 0;
  private alpha: number = 0.75;
  private lockedSide: 'left' | 'right' | 'bilateral' | null = null;
  private aspectRatio: number = 1.0;

  constructor(smoothingAlpha: number = 0.75, aspectRatio: number = 1.0) {
    this.alpha = smoothingAlpha;
    this.aspectRatio = aspectRatio > 0 ? aspectRatio : 1.0;
  }

  /**
   * Set video dimensions to compute physical camera aspect ratio
   */
  public setDimensions(width: number, height: number): void {
    if (width > 0 && height > 0) {
      this.aspectRatio = width / height;
    }
  }

  /**
   * Set camera aspect ratio directly (e.g. 16/9, 4/3, 9/16)
   */
  public setAspectRatio(ratio: number): void {
    if (ratio > 0) {
      this.aspectRatio = ratio;
    }
  }

  public getAspectRatio(): number {
    return this.aspectRatio;
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

  public setLockedSide(side: 'left' | 'right' | 'bilateral' | null): void {
    if (this.lockedSide !== side) {
      this.smoothedAngle = 0; // Reset smoother when switching active side
      this.prevAngle = 0;
      this.lockedSide = side;
    }
  }

  public getLockedSide(): 'left' | 'right' | 'bilateral' | null {
    return this.lockedSide;
  }

  /**
   * Compute aspect-ratio-corrected 2D/3D angle between 3 points: A -> B (vertex) -> C
   */
  public calculateJointAngle(
    a: Landmark,
    b: Landmark,
    c: Landmark,
    use3D: boolean = false,
    aspectRatio: number = this.aspectRatio
  ): number {
    if (!a || !b || !c) return 0;

    const ar = aspectRatio > 0 ? aspectRatio : 1.0;

    // Vector BA scaled by aspect ratio to match physical pixel scale
    const baX = (a.x - b.x) * ar;
    const baY = a.y - b.y;
    const baZ = use3D && a.z !== undefined && b.z !== undefined ? (a.z - b.z) * 0.5 : 0;

    // Vector BC scaled by aspect ratio
    const bcX = (c.x - b.x) * ar;
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
  public calculateVerticalAngle(
    top: Landmark,
    bottom: Landmark,
    aspectRatio: number = this.aspectRatio
  ): number {
    if (!top || !bottom) return 0;
    const ar = aspectRatio > 0 ? aspectRatio : 1.0;
    const dx = (top.x - bottom.x) * ar;
    const dy = top.y - bottom.y;
    const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
    return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
  }

  /**
   * Calculate horizontal tilt angle (e.g., shoulder or hip line)
   */
  public calculateHorizontalTilt(
    left: Landmark,
    right: Landmark,
    aspectRatio: number = this.aspectRatio
  ): number {
    if (!left || !right) return 0;
    const ar = aspectRatio > 0 ? aspectRatio : 1.0;
    const dy = right.y - left.y;
    const dx = (right.x - left.x) * ar;
    const angleRad = Math.atan2(dy, dx);
    return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
  }

  /**
   * Process raw landmarks for a specific exercise and return complete AngleTelemetry
   */
  public process(
    landmarks: PoseLandmarks,
    exercise: ExerciseDefinition,
    timestamp: number = Date.now(),
    dimensions?: { width: number; height: number }
  ): AngleTelemetry {
    if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
      this.aspectRatio = dimensions.width / dimensions.height;
    }

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
   * Comprehensive implementation covering all physio and stretch exercises
   */
  public extractExerciseAngle(
    landmarks: PoseLandmarks,
    exercise: ExerciseDefinition
  ): { angle: number; jointCenter: { x: number; y: number } | null; side: 'left' | 'right' | 'bilateral' } {
    if (!landmarks || landmarks.length === 0) {
      return { angle: 0, jointCenter: null, side: (this.lockedSide as any) || 'right' };
    }

    const slug = exercise.slug;
    const ar = this.aspectRatio;

    const nose = landmarks[POSE_LANDMARKS.NOSE];
    const lEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
    const rEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];

    const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

    const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const lKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    const midShoulder = lShoulder && rShoulder
      ? { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 }
      : (lShoulder || rShoulder || null);

    const midHip = lHip && rHip
      ? { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
      : (lHip || rHip || null);

    // --- 1. Shoulder Raise ---
    if (slug === 'shoulder_raise') {
      const rightAngle = this.calculateJointAngle(rHip, rShoulder, rElbow, false, ar);
      const leftAngle = this.calculateJointAngle(lHip, lShoulder, lElbow, false, ar);

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

    // --- 2. Bicep Curl & Elbow Extension ---
    if (slug === 'bicep_curl' || slug === 'elbow_extension') {
      const rightAngle = this.calculateJointAngle(rShoulder, rElbow, rWrist, false, ar);
      const leftAngle = this.calculateJointAngle(lShoulder, lElbow, lWrist, false, ar);

      if (slug === 'bicep_curl') {
        if (!this.lockedSide) {
          if (leftAngle < rightAngle - 15 && leftAngle < 120) {
            this.lockedSide = 'left';
          } else if (rightAngle < leftAngle - 15 && rightAngle < 120) {
            this.lockedSide = 'right';
          }
        }
        const activeSide = this.lockedSide || (leftAngle < rightAngle - 10 ? 'left' : 'right');
        return {
          angle: activeSide === 'left' ? leftAngle : rightAngle,
          jointCenter: activeSide === 'left' ? (lElbow ? { x: lElbow.x, y: lElbow.y } : null) : (rElbow ? { x: rElbow.x, y: rElbow.y } : null),
          side: activeSide,
        };
      } else {
        if (!this.lockedSide) {
          if (leftAngle > rightAngle + 15 && leftAngle > 105) {
            this.lockedSide = 'left';
          } else if (rightAngle > leftAngle + 15 && rightAngle > 105) {
            this.lockedSide = 'right';
          }
        }
        const activeSide = this.lockedSide || (leftAngle > rightAngle + 10 ? 'left' : 'right');
        return {
          angle: activeSide === 'left' ? leftAngle : rightAngle,
          jointCenter: activeSide === 'left' ? (lElbow ? { x: lElbow.x, y: lElbow.y } : null) : (rElbow ? { x: rElbow.x, y: rElbow.y } : null),
          side: activeSide,
        };
      }
    }

    // --- 3. Squats (Chair Squat / Knee Squat) ---
    if (slug === 'knee_squat' || slug === 'chair_squat') {
      const rightAngle = this.calculateJointAngle(rHip, rKnee, rAnkle, false, ar);
      const leftAngle = this.calculateJointAngle(lHip, lKnee, lAnkle, false, ar);
      const avgKneeAngle = Math.round(((rightAngle + leftAngle) / 2) * 10) / 10;
      const primaryKnee = rKnee || lKnee;

      return {
        angle: avgKneeAngle > 0 ? avgKneeAngle : (rightAngle || leftAngle),
        jointCenter: primaryKnee ? { x: primaryKnee.x, y: primaryKnee.y } : null,
        side: 'bilateral',
      };
    }

    // --- 4. Alternating Knee Raise ---
    if (slug === 'alternating-knee-raise' || slug === 'alternating_knee_raise') {
      const rightAngle = this.calculateJointAngle(rShoulder, rHip, rKnee, false, ar);
      const leftAngle = this.calculateJointAngle(lShoulder, lHip, lKnee, false, ar);

      // Lower angle = knee raised higher towards chest (active flexion)
      if (!this.lockedSide) {
        if (leftAngle < rightAngle - 15 && leftAngle < 140) {
          this.lockedSide = 'left';
        } else if (rightAngle < leftAngle - 15 && rightAngle < 140) {
          this.lockedSide = 'right';
        }
      }
      const activeSide = this.lockedSide || (leftAngle < rightAngle ? 'left' : 'right');
      return {
        angle: activeSide === 'left' ? leftAngle : rightAngle,
        jointCenter: activeSide === 'left' ? (lHip ? { x: lHip.x, y: lHip.y } : null) : (rHip ? { x: rHip.x, y: rHip.y } : null),
        side: activeSide,
      };
    }

    // --- 5. Lateral Neck Stretch (stretch_neck_lateral) ---
    if (slug === 'stretch_neck_lateral' || slug === 'neck_lateral') {
      let rollAngle = 0;
      if (lEar && rEar && lShoulder && rShoulder) {
        const earTilt = this.calculateHorizontalTilt(lEar, rEar, ar);
        const shoulderTilt = this.calculateHorizontalTilt(lShoulder, rShoulder, ar);
        rollAngle = Math.abs(earTilt - shoulderTilt);
      } else if (nose && midShoulder) {
        rollAngle = this.calculateVerticalAngle(nose, midShoulder as Landmark, ar);
      }

      const activeSide = this.lockedSide || ((lEar && rEar && lEar.y > rEar.y) ? 'left' : 'right');
      return {
        angle: Math.round(rollAngle * 10) / 10,
        jointCenter: nose ? { x: nose.x, y: nose.y } : null,
        side: activeSide as any,
      };
    }

    // --- 6. Neck Flexion (stretch_neck_flexion) ---
    if (slug === 'stretch_neck_flexion' || slug === 'neck_flexion') {
      let pitchDeg = 0;
      if (nose && midShoulder) {
        // Vertical inclination or chin drop ratio
        const dy = (midShoulder.y - nose.y);
        const dx = Math.abs((nose.x - midShoulder.x) * ar);
        const angleRad = Math.atan2(dx, dy);
        pitchDeg = Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
        // In flexion, nose moves closer down to shoulder plane
        if (dy < 0.20) {
          pitchDeg = Math.min(50, Math.round((0.20 - dy) * 180));
        }
      }
      return {
        angle: pitchDeg,
        jointCenter: nose ? { x: nose.x, y: nose.y } : null,
        side: 'bilateral',
      };
    }

    // --- 7. Cross-Body Shoulder Stretch (stretch_shoulder_cross) ---
    if (slug === 'stretch_shoulder_cross' || slug === 'shoulder_cross') {
      const activeSide = this.lockedSide || 'left';
      const wrist = activeSide === 'left' ? lWrist : rWrist;
      const shoulder = activeSide === 'left' ? lShoulder : rShoulder;

      let crossAngle = 0;
      if (wrist && shoulder && midShoulder) {
        // Angle of arm reaching horizontally across chest
        const armAngle = this.calculateJointAngle(activeSide === 'left' ? rShoulder : lShoulder, shoulder, wrist, false, ar);
        crossAngle = Math.max(0, 180 - armAngle);
      }
      return {
        angle: crossAngle,
        jointCenter: shoulder ? { x: shoulder.x, y: shoulder.y } : null,
        side: activeSide,
      };
    }

    // --- 8. Overhead Triceps Stretch (stretch_triceps_overhead) ---
    if (slug === 'stretch_triceps_overhead' || slug === 'triceps_overhead') {
      const activeSide = this.lockedSide || 'left';
      const shoulder = activeSide === 'left' ? lShoulder : rShoulder;
      const elbow = activeSide === 'left' ? lElbow : rElbow;
      const wrist = activeSide === 'left' ? lWrist : rWrist;

      const elbowAngle = this.calculateJointAngle(shoulder, elbow, wrist, false, ar);
      return {
        angle: elbowAngle,
        jointCenter: elbow ? { x: elbow.x, y: elbow.y } : null,
        side: activeSide,
      };
    }

    // --- 9. Chest Opener (stretch_chest_open) ---
    if (slug === 'stretch_chest_open' || slug === 'chest_open') {
      let openAngle = 0;
      if (lShoulder && rShoulder && lWrist && rWrist) {
        const leftArmAngle = this.calculateJointAngle(rShoulder, lShoulder, lWrist, false, ar);
        const rightArmAngle = this.calculateJointAngle(lShoulder, rShoulder, rWrist, false, ar);
        openAngle = Math.round(((leftArmAngle + rightArmAngle) / 2) * 10) / 10;
      }
      return {
        angle: openAngle,
        jointCenter: midShoulder ? { x: midShoulder.x, y: midShoulder.y } : null,
        side: 'bilateral',
      };
    }

    // --- 10. Side Bend (stretch_side_bend) ---
    if (slug === 'stretch_side_bend' || slug === 'side_bend') {
      let leanAngle = 0;
      if (midShoulder && midHip) {
        leanAngle = this.calculateVerticalAngle(midShoulder as Landmark, midHip as Landmark, ar);
      }
      const activeSide = this.lockedSide || (midShoulder && midHip && midShoulder.x < midHip.x ? 'left' : 'right');
      return {
        angle: leanAngle,
        jointCenter: midShoulder ? { x: midShoulder.x, y: midShoulder.y } : null,
        side: activeSide as any,
      };
    }

    // --- 11. Torso Twist (stretch_torso_twist) ---
    if (slug === 'stretch_torso_twist' || slug === 'torso_twist') {
      let twistAngle = 0;
      if (lShoulder && rShoulder && lHip && rHip) {
        const shoulderTilt = this.calculateHorizontalTilt(lShoulder, rShoulder, ar);
        const hipTilt = this.calculateHorizontalTilt(lHip, rHip, ar);
        twistAngle = Math.abs(shoulderTilt - hipTilt);
      }
      return {
        angle: twistAngle,
        jointCenter: midShoulder ? { x: midShoulder.x, y: midShoulder.y } : null,
        side: 'bilateral',
      };
    }

    // --- 12. Quadriceps Stretch (stretch_quadriceps) ---
    if (slug === 'stretch_quadriceps' || slug === 'quadriceps') {
      const activeSide = this.lockedSide || 'left';
      const hip = activeSide === 'left' ? lHip : rHip;
      const knee = activeSide === 'left' ? lKnee : rKnee;
      const ankle = activeSide === 'left' ? lAnkle : rAnkle;

      const kneeFlexion = this.calculateJointAngle(hip, knee, ankle, false, ar);
      return {
        angle: kneeFlexion,
        jointCenter: knee ? { x: knee.x, y: knee.y } : null,
        side: activeSide,
      };
    }

    // --- 13. Hamstrings Stretch (stretch_hamstrings) ---
    if (slug === 'stretch_hamstrings' || slug === 'hamstrings') {
      let hipHinge = 0;
      if (midShoulder && midHip) {
        hipHinge = this.calculateVerticalAngle(midShoulder as Landmark, midHip as Landmark, ar);
      }
      return {
        angle: hipHinge,
        jointCenter: midHip ? { x: midHip.x, y: midHip.y } : null,
        side: 'bilateral',
      };
    }

    // --- 14. Calf Stretch (stretch_calf) ---
    if (slug === 'stretch_calf' || slug === 'calf') {
      const activeSide = this.lockedSide || 'right';
      const hip = activeSide === 'left' ? lHip : rHip;
      const knee = activeSide === 'left' ? lKnee : rKnee;
      const ankle = activeSide === 'left' ? lAnkle : rAnkle;

      const backLegAngle = this.calculateJointAngle(hip, knee, ankle, false, ar);
      return {
        angle: backLegAngle,
        jointCenter: ankle ? { x: ankle.x, y: ankle.y } : null,
        side: activeSide,
      };
    }

    // --- 15. Seated Piriformis Stretch (stretch_piriformis_seated) ---
    if (slug === 'stretch_piriformis_seated' || slug === 'piriformis_seated') {
      let trunkLean = 0;
      if (midShoulder && midHip) {
        trunkLean = this.calculateVerticalAngle(midShoulder as Landmark, midHip as Landmark, ar);
      }
      return {
        angle: trunkLean,
        jointCenter: midShoulder ? { x: midShoulder.x, y: midShoulder.y } : null,
        side: (this.lockedSide as any) || 'right',
      };
    }

    // Fallback using pose spec primary joint
    const spec = getPoseSpec(slug);
    if (spec.method === 'vertical_angle' && midShoulder && midHip) {
      const angle = this.calculateVerticalAngle(midShoulder as Landmark, midHip as Landmark, ar);
      return { angle, jointCenter: midShoulder ? { x: midShoulder.x, y: midShoulder.y } : null, side: 'bilateral' };
    }

    return { angle: 0, jointCenter: null, side: 'right' };
  }
}
