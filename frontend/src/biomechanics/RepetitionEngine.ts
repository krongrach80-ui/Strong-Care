import { ExerciseDefinition, RepState } from '../types/exercise';
import { RepetitionTelemetry } from './types';
import { getPoseSpec, PoseSpec } from './poseSpecs';

export interface RepTransitionEvent {
  fromState: RepState;
  toState: RepState;
  timestamp: number;
}

/**
 * RepetitionEngine
 * Sub-engine running a 5-State Automaton with Hysteresis to count repetitions,
 * prevent bouncing/fluttering, enforce isometric hold at peak ROM, and capture
 * phase durations (concentric, hold, eccentric).
 *
 * Clinical enhancements:
 * - Timeout and abort when returning to rest before reaching target
 * - Per-exercise hysteresis and threshold envelopes from PoseSpec
 * - Minimum rep duration gate (1.2s) to prevent false flutter counts
 * - Continuous target envelope requirement for isometric hold timer
 */
export class RepetitionEngine {
  private exercise: ExerciseDefinition;
  private spec: PoseSpec;
  private state: RepState = 'START';
  private repCount: number = 0;
  private correctReps: number = 0;

  // Phase Timing
  private stateEnteredTime: number = 0;
  private repStartTime: number = 0;
  private concentricStartTime: number = 0;
  private concentricEndTime: number = 0;
  private holdStartTime: number = 0;
  private holdEndTime: number = 0;
  private eccentricStartTime: number = 0;
  private eccentricEndTime: number = 0;

  private holdDurationRequiredMs: number = 600; // Clinical hold at apex
  private isDecreasingTarget: boolean;
  private outOfZoneSince: number | null = null;
  private continuousHoldDurationMs: number = 0;
  private lastHoldTimestamp: number = 0;
  private minRepDurationMs: number = 1200; // Minimum duration per rep (1.2s)

  constructor(exercise: ExerciseDefinition, holdDurationMs: number = 600) {
    this.exercise = exercise;
    this.spec = getPoseSpec(exercise.slug);
    this.holdDurationRequiredMs = holdDurationMs;
    this.isDecreasingTarget = this.spec.isDecreasingTarget;
    this.stateEnteredTime = Date.now();
  }

  public reset(): void {
    this.state = 'START';
    this.repCount = 0;
    this.correctReps = 0;
    this.stateEnteredTime = Date.now();
    this.repStartTime = 0;
    this.outOfZoneSince = null;
    this.continuousHoldDurationMs = 0;
    this.lastHoldTimestamp = 0;
  }

  public getRepCount(): number {
    return this.repCount;
  }

  public getCorrectReps(): number {
    return this.correctReps;
  }

  public getState(): RepState {
    return this.state;
  }

  /**
   * Process current joint angle through the State Machine
   * Includes Fail-Safe: If pose is not confident or joints missing, frozen and no reps counted!
   */
  public process(
    currentAngle: number,
    isPostureValid: boolean = true,
    isPoseConfident: boolean = true,
    timestamp: number = Date.now()
  ): {
    telemetry: RepetitionTelemetry;
    isRepJustCompleted: boolean;
    phaseDurations: { concentricSec: number; holdSec: number; eccentricSec: number; totalSec: number };
    feedback: string;
  } {
    const targetAngle = this.spec.targetAngleDeg || this.exercise.target_angle;
    const tolerance = Math.min(10, this.spec.toleranceDeg || 10);
    let isRepJustCompleted = false;
    let feedback = '';
    let holdProgressPercent = 0;

    // Fail-Safe: When camera cannot see body joints clearly, freeze state and reject rep increments!
    if (!isPoseConfident) {
      return {
        telemetry: {
          state: this.state,
          repCount: this.repCount,
          correctReps: this.correctReps,
          phase: 'idle',
          holdProgressPercent: 0,
          timeInStateMs: 0,
        },
        isRepJustCompleted: false,
        phaseDurations: { concentricSec: 0, holdSec: 0, eccentricSec: 0, totalSec: 0 },
        feedback: '⚠️ จุดตรวจจับข้อต่อไม่ชัดเจน กรุณาขยับให้เห็นแขนและลำตัวชัดเจน (หยุดนับ Rep)',
      };
    }

    // Dynamic resting and triggering thresholds from PoseSpec
    const restAngleThreshold = this.spec.restAngleDeg;
    const triggerMotionThreshold = this.spec.triggerMotionDeg;

    switch (this.state) {
      case 'START':
      case 'READY': {
        const isAtRest = this.isDecreasingTarget
          ? currentAngle >= restAngleThreshold
          : currentAngle <= restAngleThreshold;

        if (isAtRest) {
          if (this.state !== 'READY') {
            this.transitionTo('READY', timestamp);
          }
          feedback = 'พร้อมแล้ว เริ่มขยับเข้าสู่ท่าทาง';
        } else {
          feedback = this.isDecreasingTarget ? 'ยืดข้อต่อกลับสู่ท่าเริ่มต้น' : 'วางแขนหรือขากลับสู่ท่าเริ่มต้น';
        }

        // Trigger motion start
        const startedMoving = this.isDecreasingTarget
          ? currentAngle < triggerMotionThreshold
          : currentAngle > triggerMotionThreshold;

        if (startedMoving && this.state === 'READY') {
          this.repStartTime = timestamp;
          this.concentricStartTime = timestamp;
          this.transitionTo(this.isDecreasingTarget ? 'DOWN' : 'UP', timestamp);
          feedback = 'กำลังเคลื่อนไหวเข้าสู่มุมเป้าหมาย...';
        }
        break;
      }

      case 'UP':
      case 'DOWN': {
        // 1. Concentric abort check: if user returned back to rest without reaching target
        const returnedToRest = this.isDecreasingTarget
          ? currentAngle >= restAngleThreshold - 4
          : currentAngle <= restAngleThreshold + 4;

        if (returnedToRest) {
          this.transitionTo('READY', timestamp);
          feedback = 'กลับสู่ท่าเริ่มต้นก่อนถึงเป้าหมาย กรุณาเริ่มรอบใหม่';
          break;
        }

        // 2. Timeout check: if concentric movement takes > 7.0 seconds without reaching target
        if (timestamp - this.stateEnteredTime > 7000) {
          this.transitionTo('READY', timestamp);
          feedback = 'หมดเวลาขยับท่าทาง กรุณาเริ่มใหม่อีกครั้ง';
          break;
        }

        // 3. Concentric target check: reached within tolerance zone
        const reachedTarget = this.isDecreasingTarget
          ? currentAngle <= targetAngle + tolerance
          : currentAngle >= targetAngle - tolerance;

        if (reachedTarget) {
          this.concentricEndTime = timestamp;
          this.holdStartTime = timestamp;
          this.lastHoldTimestamp = timestamp;
          this.continuousHoldDurationMs = 0;
          this.outOfZoneSince = null;
          this.transitionTo('HOLD', timestamp);
          feedback = 'ดีมาก! ค้างไว้ในโซนเป้าหมาย...';
        } else {
          feedback = 'เคลื่อนไหวอย่างต่อเนื่อง เข้าสู่มุมเป้าหมาย';
        }
        break;
      }

      case 'HOLD': {
        // Continuous target zone envelope check
        const inTargetZone = this.isDecreasingTarget
          ? currentAngle <= targetAngle + tolerance && currentAngle >= targetAngle - tolerance - 15
          : currentAngle >= targetAngle - tolerance && currentAngle <= targetAngle + tolerance + 15;

        if (inTargetZone) {
          // Accumulate continuous hold time
          if (this.lastHoldTimestamp > 0) {
            const dt = Math.max(0, Math.min(250, timestamp - this.lastHoldTimestamp));
            this.continuousHoldDurationMs += dt;
          }
          this.lastHoldTimestamp = timestamp;
          this.outOfZoneSince = null;

          holdProgressPercent = Math.min(
            100,
            Math.round((this.continuousHoldDurationMs / this.holdDurationRequiredMs) * 100)
          );

          if (this.continuousHoldDurationMs >= this.holdDurationRequiredMs) {
            this.holdEndTime = timestamp;
            this.eccentricStartTime = timestamp;
            this.transitionTo('COMPLETE', timestamp);
            feedback = 'ยอดเยี่ยม! ค่อยๆ คลายท่ากลับสู่จุดเริ่มต้น';
          } else {
            const secLeft = Math.max(0.1, (this.holdDurationRequiredMs - this.continuousHoldDurationMs) / 1000).toFixed(1);
            feedback = `ค้างท่าไว้ในโซน... ${secLeft} วินาที`;
          }
        } else {
          // Out of target envelope: pause hold progress
          this.lastHoldTimestamp = timestamp;
          this.outOfZoneSince ??= timestamp;

          // Grace period: if out of target zone for > 700ms, abort back to concentric
          if (timestamp - this.outOfZoneSince > 700) {
            this.outOfZoneSince = null;
            this.continuousHoldDurationMs = 0;
            this.transitionTo(this.isDecreasingTarget ? 'DOWN' : 'UP', timestamp);
            feedback = 'หลุดออกจากโซนเป้าหมาย กรุณาขยับเข้าสู่มุมเป้าหมายอีกครั้ง';
          } else {
            feedback = 'พยายามรักษาระดับองศาให้อยู่ในโซนเป้าหมาย';
          }
        }
        break;
      }

      case 'COMPLETE': {
        // Eccentric return to resting position
        const returnedToRest = this.isDecreasingTarget
          ? currentAngle >= restAngleThreshold - 5
          : currentAngle <= restAngleThreshold + 5;

        if (returnedToRest) {
          const totalDuration = timestamp - (this.repStartTime || timestamp);

          // Clinical gate: must satisfy minimum rep duration to avoid false flutter counts
          if (totalDuration >= this.minRepDurationMs) {
            this.eccentricEndTime = timestamp;
            this.repCount++;
            if (isPostureValid) this.correctReps++;
            isRepJustCompleted = true;

            this.transitionTo('READY', timestamp);
            feedback = `นับแล้ว ครั้งที่ ${this.repCount}! เตรียมเริ่มครั้งถัดไป`;
          } else {
            // Rep completed too quickly (< 1.2s), treated as false flutter
            this.transitionTo('READY', timestamp);
            feedback = 'ขยับเร็วเกินไป ไม่นับรอบ กรุณาขยับอย่างช้าๆ มั่นคง';
          }
        } else {
          // Timeout in eccentric phase (e.g. resting halfway)
          if (timestamp - this.stateEnteredTime > 8000) {
            this.transitionTo('READY', timestamp);
          } else {
            feedback = 'ค่อยๆ คลายท่ากลับสู่จุดเริ่มต้นอย่างควบคุม';
          }
        }
        break;
      }
    }

    // Determine current high-level phase
    let phase: RepetitionTelemetry['phase'] = 'idle';
    if (this.state === 'UP' || this.state === 'DOWN') phase = 'concentric';
    else if (this.state === 'HOLD') phase = 'apex_hold';
    else if (this.state === 'COMPLETE') phase = 'eccentric';
    else if (this.state === 'READY') phase = 'idle';

    const timeInStateMs = timestamp - this.stateEnteredTime;

    // Calculate phase durations
    const concentricSec = this.concentricEndTime > this.concentricStartTime
      ? (this.concentricEndTime - this.concentricStartTime) / 1000
      : (phase === 'concentric' ? (timestamp - this.concentricStartTime) / 1000 : 0);

    const holdSec = this.holdEndTime > this.holdStartTime
      ? (this.holdEndTime - this.holdStartTime) / 1000
      : (phase === 'apex_hold' ? (this.continuousHoldDurationMs) / 1000 : 0);

    const eccentricSec = this.eccentricEndTime > this.eccentricStartTime
      ? (this.eccentricEndTime - this.eccentricStartTime) / 1000
      : (phase === 'eccentric' ? (timestamp - this.eccentricStartTime) / 1000 : 0);

    const totalSec = Math.max(0.5, (timestamp - (this.repStartTime || timestamp)) / 1000);

    const telemetry: RepetitionTelemetry = {
      state: this.state,
      repCount: this.repCount,
      correctReps: this.correctReps,
      phase,
      timeInStateMs,
      holdProgressPercent,
    };

    return {
      telemetry,
      isRepJustCompleted,
      phaseDurations: {
        concentricSec: Math.round(concentricSec * 10) / 10,
        holdSec: Math.round(holdSec * 10) / 10,
        eccentricSec: Math.round(eccentricSec * 10) / 10,
        totalSec: Math.round(totalSec * 10) / 10,
      },
      feedback,
    };
  }

  private transitionTo(nextState: RepState, timestamp: number): void {
    this.state = nextState;
    this.stateEnteredTime = timestamp;
  }
}
