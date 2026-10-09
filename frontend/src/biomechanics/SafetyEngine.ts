import { PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { ExerciseDefinition } from '../types/exercise';
import { BiomechanicsFrame } from './types';
import { getPoseSpec } from './poseSpecs';

export type SafetySeverity = 'NORMAL' | 'CAUTION' | 'CRITICAL_STOP';

export type ClinicalSafetyState =
  | 'NO_DATA'       // ไม่พบแลนด์มาร์ก หรือกล้องถูกบัง (Pose confidence < 48%)
  | 'CALIBRATING'   // อยู่ในขั้นตอน Pre-Exercise Calibration (3..2..1)
  | 'READY'         // พร้อมเริ่มฝึก ข้อต่อครบ แสงสว่างพอ
  | 'SAFE'          // กำลังฝึกอยู่ในช่วงมุมและท่าทางที่ถูกต้อง ปลอดภัย
  | 'WARNING'       // เริ่มมี Compensations (เช่น ลำตัวเอียง 15°-22° หรือยกไหล่)
  | 'STOP';         // สั่งหยุดฉุกเฉิน (Over-ROM, เอียงเกิน 22°, กระตุกเร็วเกิน 220°/s)

export interface SafetyViolation {
  code: 'OVER_ROM' | 'EXTREME_TRUNK_LEAN' | 'SEVERE_SHOULDER_HIKE' | 'OUT_OF_FRAME' | 'LOW_CONFIDENCE' | 'ERRATIC_VELOCITY';
  severity: SafetySeverity;
  title: string;
  message: string;
  voiceMessage: string;
  timestamp: number;
  value?: number;
  threshold?: number;
}

export interface SafetyTelemetry {
  state: ClinicalSafetyState;
  severity: SafetySeverity;
  isEmergencyStop: boolean;
  activeViolations: SafetyViolation[];
  safetyScore: number; // 0 - 100
  canResume: boolean;
  emergencyStopTimestamp?: number;
  confidenceScore: number; // 0 - 100%
  isLowConfidenceFailSafe: boolean; // True when AI cannot reliably assess pose
  statusMessage: string;
}

/**
 * SafetyEngine
 * Clinical safety watchdog that continuously analyzes biomechanical telemetry.
 * Automatically halts exercises and triggers Thai voice alerts when dangerous
 * joint hyper-extension, compensation, frame loss, or rapid jerky motions occur.
 */
export class SafetyEngine {
  private violationHistory: SafetyViolation[] = [];
  private consecutiveUnsafeFrames = 0;
  private consecutiveSafeFrames = 0;
  private isEmergencyStopActive = false;
  private emergencyStopTimestamp?: number;
  private lastVoiceWarningTime = 0;

  // Configurable clinical safety thresholds
  private config = {
    maxTrunkLeanDeg: 22,         // Max allowable spine lean before stop
    maxShoulderHikingDeg: 18,    // Max allowable shoulder hike tilt
    maxAngularVelocityDegPerSec: 220, // Rapid uncontrolled jerk / fall risk
    minConfidenceVisibility: 0.35,
    minFramesToStop: 8,          // ~0.25s of continuous danger triggers STOP
    minFramesToResume: 25,       // ~0.8s of stable safe posture to allow resume
    voiceCooldownMs: 4000,       // Do not spam voice warnings
  };

  /**
   * Process biomechanics frame and raw pose landmarks through clinical safety rules
   */
  public evaluate(
    frame: BiomechanicsFrame,
    landmarks: PoseLandmarks | null,
    exercise: ExerciseDefinition
  ): SafetyTelemetry {
    const violations: SafetyViolation[] = [];
    const now = Date.now();
    const spec = getPoseSpec(exercise.slug);
    const maxLeanAllowed = spec.allowedPostures.maxAllowableSpineLeanDeg ?? this.config.maxTrunkLeanDeg;
    const allowShoulderTilt = spec.allowedPostures.allowShoulderTilt ?? false;

    // Check key joint visibilities & compute confidence score
    let confidenceScore = 0;
    let isLowConfidenceFailSafe = false;

    if (!landmarks || landmarks.length === 0 || !frame.posture.isInFrame) {
      confidenceScore = 0;
      isLowConfidenceFailSafe = true;
      violations.push({
        code: 'OUT_OF_FRAME',
        severity: 'CAUTION',
        title: 'อยู่นอกกรอบกล้อง (หยุดนับชั่วคราว)',
        message: 'ไม่พบตำแหน่งร่างกาย กรุณากลับเข้ามาในกรอบกล้องเพื่อฝึกต่อ',
        voiceMessage: 'กรุณากลับเข้ามาในกรอบกล้องครับ',
        timestamp: now,
      });
    } else {
      const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const le = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
      const re = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
      const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];

      const keyJoints = (spec.landmarksUsed && spec.landmarksUsed.length > 0)
        ? spec.landmarksUsed.map((idx) => landmarks[idx]).filter(Boolean)
        : [ls, rs, le, re, lh, rh].filter(Boolean);

      const avgVisibility = keyJoints.length > 0
        ? keyJoints.reduce((acc, j) => acc + (j?.visibility ?? 1), 0) / keyJoints.length
        : 0;

      confidenceScore = Math.round(avgVisibility * 100);

      // Fail-Safe: If confidence < 40%, pause rep increment
      if (confidenceScore < 40) {
        isLowConfidenceFailSafe = true;
        violations.push({
          code: 'LOW_CONFIDENCE',
          severity: 'CAUTION',
          title: 'ความมั่นใจต่ำ (Fail-Safe)',
          message: 'จุดตรวจจับข้อต่อไม่ชัดเจน (หยุดนับ Rep ชั่วคราว) กรุณาจัดตำแหน่งใหม่',
          voiceMessage: 'ขยับให้เห็นแขนและลำตัวชัดเจนครับ',
          timestamp: now,
          value: confidenceScore,
          threshold: 40,
        });
      }
    }

    // 2. Check Over-ROM / Joint Hyper-extension beyond Safe Envelope
    // Default safe max is either configured max_safe_angle or exercise max_angle + 18°
    const maxSafeRom = (exercise as any).max_safe_angle || (exercise.max_angle + 18);
    if (frame.angle.currentAngle > maxSafeRom) {
      violations.push({
        code: 'OVER_ROM',
        severity: 'CRITICAL_STOP',
        title: 'มุมข้อต่อเกินพิกัดปลอดภัย',
        message: `มุมปัจจุบัน ${Math.round(frame.angle.currentAngle)}° เกินเกณฑ์ปลอดภัยสูงสุด (${maxSafeRom}°)`,
        voiceMessage: 'กรุณาหยุดก่อนครับ มุมข้อต่อสูงเกินช่วงปลอดภัยแล้วครับ ค่อยๆ ลดระดับลงนะครับ',
        timestamp: now,
        value: Math.round(frame.angle.currentAngle),
        threshold: maxSafeRom,
      });
    }

    // 3. Check Severe Spinal Trunk Lean (Dangerous Compensation)
    if (frame.posture.spineAngle > maxLeanAllowed) {
      violations.push({
        code: 'EXTREME_TRUNK_LEAN',
        severity: 'CRITICAL_STOP',
        title: 'ลำตัวเอียงมากเกินไป',
        message: `ลำตัวเอียง ${Math.round(frame.posture.spineAngle)}° เกินพิกัดปลอดภัยสำหรับท่านี้ (${maxLeanAllowed}°)`,
        voiceMessage: 'ระวังลำตัวเอียงมากเกินไปครับ รักษาสันหลังให้ตรงนะครับ',
        timestamp: now,
        value: Math.round(frame.posture.spineAngle),
        threshold: maxLeanAllowed,
      });
    } else if (frame.posture.spineAngle > Math.max(14, maxLeanAllowed - 8) && !spec.allowedPostures.allowTorsoTwist) {
      violations.push({
        code: 'EXTREME_TRUNK_LEAN',
        severity: 'CAUTION',
        title: 'เริ่มมีอาการเอียงลำตัว',
        message: 'อย่าใช้ลำตัวช่วยยก รักษากระดูกสันหลังให้ตั้งตรง',
        voiceMessage: 'รักษาสันหลังให้ตรงครับ อย่าเอียงตัวช่วยนะครับ',
        timestamp: now,
        value: Math.round(frame.posture.spineAngle),
        threshold: Math.max(14, maxLeanAllowed - 8),
      });
    }

    // 4. Check Severe Shoulder Hiking (Trapezius compensation)
    if (!allowShoulderTilt && frame.posture.shoulderTilt > this.config.maxShoulderHikingDeg) {
      violations.push({
        code: 'SEVERE_SHOULDER_HIKE',
        severity: 'CAUTION',
        title: 'ยกหัวไหล่เกร็งผิดท่า',
        message: `ไหล่เอียง ${Math.round(frame.posture.shoulderTilt)}° กรุณาผ่อนคลายกล้ามเนื้อบ่า`,
        voiceMessage: 'ผ่อนคลายกล้ามเนื้อบ่าและหัวไหล่ครับ อย่าเกร็งยกไหล่',
        timestamp: now,
        value: Math.round(frame.posture.shoulderTilt),
        threshold: this.config.maxShoulderHikingDeg,
      });
    }

    // 5. Check Erratic / Jerky Rapid Motion (Tremor / Spasm / Balance loss)
    const angularVel = Math.abs(frame.angle.angularVelocity || 0);
    if (angularVel > this.config.maxAngularVelocityDegPerSec) {
      violations.push({
        code: 'ERRATIC_VELOCITY',
        severity: 'CAUTION',
        title: 'เคลื่อนไหวเร็วผิดปกติ',
        message: `ความเร็วการเคลื่อนไหว ${Math.round(angularVel)}°/วินาที เร็วเกินไปสำหรับกายภาพ`,
        voiceMessage: 'ค่อยๆ เคลื่อนไหวช้าๆ อย่างควบคุมครับ ไม่ต้องรีบนะครับ',
        timestamp: now,
        value: Math.round(angularVel),
        threshold: this.config.maxAngularVelocityDegPerSec,
      });
    }

    // Determine highest severity
    const hasCritical = violations.some(v => v.severity === 'CRITICAL_STOP');
    const hasCaution = violations.some(v => v.severity === 'CAUTION');
    const currentSeverity: SafetySeverity = hasCritical ? 'CRITICAL_STOP' : hasCaution ? 'CAUTION' : 'NORMAL';

    // State machine for Emergency Stop latch
    if (hasCritical) {
      this.consecutiveUnsafeFrames++;
      this.consecutiveSafeFrames = 0;
      if (this.consecutiveUnsafeFrames >= this.config.minFramesToStop) {
        if (!this.isEmergencyStopActive) {
          this.isEmergencyStopActive = true;
          this.emergencyStopTimestamp = now;
        }
      }
    } else {
      this.consecutiveSafeFrames++;
      this.consecutiveUnsafeFrames = 0;
    }

    // Save history of violations (avoid duplicates within 2s)
    violations.forEach(v => {
      const isRecent = this.violationHistory.some(
        hv => hv.code === v.code && now - hv.timestamp < 2000
      );
      if (!isRecent) {
        this.violationHistory.push(v);
      }
    });

    // Determine 6-Stage Clinical Safety State
    let clinicalState: ClinicalSafetyState = 'SAFE';
    let statusMessage = 'ระบบอยู่ในสภาวะปลอดภัย (SAFE)';

    if (isLowConfidenceFailSafe || !frame.posture.isInFrame || !landmarks || landmarks.length === 0) {
      clinicalState = 'NO_DATA';
      statusMessage = 'ไม่พบข้อมูลหรือความมั่นใจต่ำ (NO_DATA) - หยุดนับ Rep ชั่วคราวเพื่อความปลอดภัย';
    } else if (this.isEmergencyStopActive || hasCritical) {
      clinicalState = 'STOP';
      statusMessage = 'สั่งหยุดฉุกเฉิน (STOP) - ตรวจพบท่าทางเสี่ยงอันตราย';
    } else if (hasCaution) {
      clinicalState = 'WARNING';
      statusMessage = 'แจ้งเตือนท่าทางชดเชย (WARNING) - กรุณาปรับท่าทาง';
    } else {
      clinicalState = 'SAFE';
      statusMessage = 'ท่าทางอยู่ในเกณฑ์ปลอดภัย (SAFE)';
    }

    // Safety Score (100 = flawless, drops with violations)
    let safetyScore = 100;
    if (clinicalState === 'NO_DATA') safetyScore = 20;
    else {
      if (hasCritical) safetyScore -= 50;
      if (hasCaution) safetyScore -= 20;
      safetyScore = Math.max(0, Math.min(100, safetyScore - violations.length * 5));
    }

    const canResume = this.consecutiveSafeFrames >= this.config.minFramesToResume && !isLowConfidenceFailSafe;

    return {
      state: clinicalState,
      severity: this.isEmergencyStopActive ? 'CRITICAL_STOP' : currentSeverity,
      isEmergencyStop: this.isEmergencyStopActive,
      activeViolations: violations,
      safetyScore,
      canResume,
      emergencyStopTimestamp: this.emergencyStopTimestamp,
      confidenceScore,
      isLowConfidenceFailSafe,
      statusMessage,
    };
  }

  /**
   * Get voice prompt if an alert needs to be spoken and cooldown has elapsed
   */
  public getPendingVoiceAlert(telemetry: SafetyTelemetry): string | null {
    const now = Date.now();
    if (now - this.lastVoiceWarningTime < this.config.voiceCooldownMs) {
      return null;
    }

    if (telemetry.isEmergencyStop) {
      const topViolation = telemetry.activeViolations.find(v => v.severity === 'CRITICAL_STOP') || telemetry.activeViolations[0];
      if (topViolation) {
        this.lastVoiceWarningTime = now;
        return topViolation.voiceMessage;
      }
    } else if (telemetry.severity === 'CAUTION') {
      const topViolation = telemetry.activeViolations[0];
      if (topViolation) {
        this.lastVoiceWarningTime = now;
        return topViolation.voiceMessage;
      }
    }
    return null;
  }

  /**
   * Manually trigger emergency stop (e.g. from UI Emergency Stop button)
   */
  public triggerManualEmergencyStop(reason: string = 'ผู้ป่วยหรือผู้ดูแลกดปุ่มหยุดฉุกเฉิน'): SafetyViolation {
    const violation: SafetyViolation = {
      code: 'ERRATIC_VELOCITY',
      severity: 'CRITICAL_STOP',
      title: '🛑 หยุดฉุกเฉิน (Manual Emergency Stop)',
      message: reason,
      voiceMessage: 'หยุดฉุกเฉิน พักการฝึกชั่วคราวครับ',
      timestamp: Date.now(),
    };
    this.isEmergencyStopActive = true;
    this.emergencyStopTimestamp = Date.now();
    this.violationHistory.push(violation);
    return violation;
  }

  /**
   * Reset / dismiss emergency stop (e.g. user acknowledged warning)
   */
  public acknowledgeAndResume(): void {
    this.isEmergencyStopActive = false;
    this.consecutiveUnsafeFrames = 0;
    this.consecutiveSafeFrames = this.config.minFramesToResume;
  }

  public getViolationLog(): SafetyViolation[] {
    return [...this.violationHistory];
  }

  public reset(): void {
    this.isEmergencyStopActive = false;
    this.consecutiveUnsafeFrames = 0;
    this.consecutiveSafeFrames = 0;
    this.violationHistory = [];
  }
}
