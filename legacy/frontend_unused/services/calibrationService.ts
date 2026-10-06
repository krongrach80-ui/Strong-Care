import { PoseLandmarks, POSE_LANDMARKS } from '../types/pose';

export interface CalibrationStatus {
  isFaceAligned: boolean;
  isBodyComplete: boolean;
  isDistanceOptimal: boolean;
  distanceFeedback: 'TOO_CLOSE' | 'TOO_FAR' | 'OPTIMAL' | 'UNKNOWN';
  isLightingAdequate: boolean;
  isSteady: boolean;
  isFullyCalibrated: boolean;
  countdownSeconds: number; // 3, 2, 1, 0
  overallProgressPercent: number; // 0 - 100%
  spokenInstruction: string;
}

export class CalibrationEngine {
  private steadyFrameCount = 0;
  private readonly requiredSteadyFrames = 45; // ~1.5 - 2 seconds at 30fps
  private lastSpokenTime = 0;
  private lastInstruction = '';

  public evaluate(landmarks: PoseLandmarks | null, faceLandmarks?: PoseLandmarks | null): CalibrationStatus {
    if (!landmarks || landmarks.length === 0) {
      return {
        isFaceAligned: false,
        isBodyComplete: false,
        isDistanceOptimal: false,
        distanceFeedback: 'UNKNOWN',
        isLightingAdequate: false,
        isSteady: false,
        isFullyCalibrated: false,
        countdownSeconds: 3,
        overallProgressPercent: 0,
        spokenInstruction: 'กรุณายืนหน้ากล้องให้เห็นร่างกายชัดเจนครับ',
      };
    }

    const nose = landmarks[POSE_LANDMARKS.NOSE];
    const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const le = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const re = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const lw = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rw = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    // 1. Face alignment check
    const isFaceAligned = Boolean(
      (faceLandmarks && faceLandmarks.length > 50) ||
      (nose && (nose.visibility ?? 1) > 0.55 && nose.y > 0.05 && nose.y < 0.45)
    );

    // 2. Body completeness check (Upper body essentials)
    const upperJoints = [ls, rs, le, re, lw, rw, lh, rh];
    const visibleCount = upperJoints.filter(j => j && (j.visibility ?? 1) > 0.45).length;
    const isBodyComplete = visibleCount >= 7; // at least 7 of 8 critical joints visible

    // 3. Distance from Camera check
    let isDistanceOptimal = false;
    let distanceFeedback: 'TOO_CLOSE' | 'TOO_FAR' | 'OPTIMAL' | 'UNKNOWN' = 'UNKNOWN';

    if (ls && rs && lh && rh) {
      const midShoulderY = (ls.y + rs.y) / 2;
      const midHipY = (lh.y + rh.y) / 2;
      const torsoHeight = Math.abs(midHipY - midShoulderY);
      const shoulderWidth = Math.hypot(rs.x - ls.x, rs.y - ls.y);

      if (torsoHeight > 0.65 || shoulderWidth > 0.60) {
        distanceFeedback = 'TOO_CLOSE';
      } else if (torsoHeight < 0.18 || shoulderWidth < 0.14) {
        distanceFeedback = 'TOO_FAR';
      } else {
        distanceFeedback = 'OPTIMAL';
        isDistanceOptimal = true;
      }
    }

    // 4. Lighting Adequacy (heuristic: average visibility of all landmarks)
    const avgVis = landmarks.reduce((acc, l) => acc + (l.visibility ?? 1), 0) / landmarks.length;
    const isLightingAdequate = avgVis >= 0.50;

    // Ready condition
    const readyConditions = isFaceAligned && isBodyComplete && isDistanceOptimal && isLightingAdequate;

    if (readyConditions) {
      this.steadyFrameCount++;
    } else {
      this.steadyFrameCount = Math.max(0, this.steadyFrameCount - 2);
    }

    const countdownSeconds = Math.max(
      0,
      Math.ceil((this.requiredSteadyFrames - this.steadyFrameCount) / 15)
    );
    const isSteady = this.steadyFrameCount >= this.requiredSteadyFrames * 0.4;
    const isFullyCalibrated = this.steadyFrameCount >= this.requiredSteadyFrames;

    // Progress calculation
    let passedChecks = 0;
    if (isFaceAligned) passedChecks++;
    if (isBodyComplete) passedChecks++;
    if (isDistanceOptimal) passedChecks++;
    if (isLightingAdequate) passedChecks++;
    if (isSteady) passedChecks++;

    const overallProgressPercent = Math.min(
      100,
      Math.round((passedChecks / 5) * 60 + (this.steadyFrameCount / this.requiredSteadyFrames) * 40)
    );

    // Spoken prompt determination
    let spokenInstruction = '';
    if (!isFaceAligned) {
      spokenInstruction = 'กรุณามองตรงมาที่กล้องครับ';
    } else if (distanceFeedback === 'TOO_CLOSE') {
      spokenInstruction = 'กรุณาถอยหลังเล็กน้อยครับ คุณยืนใกล้กล้องเกินไป';
    } else if (distanceFeedback === 'TOO_FAR') {
      spokenInstruction = 'กรุณาขยับเข้ามาใกล้กล้องอีกนิดครับ';
    } else if (!isBodyComplete) {
      spokenInstruction = 'กรุณาจัดตำแหน่งให้เห็นลำตัวและแขนทั้งสองข้างครับ';
    } else if (!isLightingAdequate) {
      spokenInstruction = 'กรุณาเปิดไฟหรือเพิ่มความสว่างบริเวณหน้ากล้องครับ';
    } else if (!isFullyCalibrated) {
      spokenInstruction = `ยอดเยี่ยมครับ ยืนนิ่งอีก ${countdownSeconds} วินาทีเพื่อเริ่ม`;
    } else {
      spokenInstruction = 'ระบบพร้อมแล้วครับ เริ่มการฝึกได้เลย!';
    }

    return {
      isFaceAligned,
      isBodyComplete,
      isDistanceOptimal,
      distanceFeedback,
      isLightingAdequate,
      isSteady,
      isFullyCalibrated,
      countdownSeconds,
      overallProgressPercent,
      spokenInstruction,
    };
  }

  public reset(): void {
    this.steadyFrameCount = 0;
    this.lastSpokenTime = 0;
    this.lastInstruction = '';
  }
}
