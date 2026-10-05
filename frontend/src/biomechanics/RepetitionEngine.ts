import { ExerciseDefinition, RepState } from '../types/exercise';
import { RepetitionTelemetry } from './types';

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
 */
export class RepetitionEngine {
  private exercise: ExerciseDefinition;
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

  constructor(exercise: ExerciseDefinition, holdDurationMs: number = 600) {
    this.exercise = exercise;
    this.holdDurationRequiredMs = holdDurationMs;
    this.isDecreasingTarget = exercise.slug === 'bicep_curl' || exercise.slug === 'knee_squat';
    this.stateEnteredTime = Date.now();
  }

  public reset(): void {
    this.state = 'START';
    this.repCount = 0;
    this.correctReps = 0;
    this.stateEnteredTime = Date.now();
    this.repStartTime = 0;
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
    const { target_angle, min_angle, max_angle } = this.exercise;
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

    // Resting threshold definitions with hysteresis
    const restAngleThreshold = this.isDecreasingTarget ? 135 : 45;
    const triggerMotionThreshold = this.isDecreasingTarget ? 125 : 50;

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
          feedback = this.isDecreasingTarget ? 'ยืดข้อต่อกลับสู่ท่าเริ่มต้น' : 'วางแขนลงข้างลำตัวเพื่อเริ่ม';
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
        // Concentric movement towards target
        const reachedTarget = this.isDecreasingTarget
          ? currentAngle <= target_angle + 10
          : currentAngle >= target_angle - 10;

        if (reachedTarget) {
          this.concentricEndTime = timestamp;
          this.holdStartTime = timestamp;
          this.transitionTo('HOLD', timestamp);
          feedback = 'ดีมาก! ค้างไว้สักครู่...';
        } else {
          feedback = 'เคลื่อนไหวอย่างต่อเนื่อง เข้าสู่มุมเป้าหมาย';
        }
        break;
      }

      case 'HOLD': {
        // Must stay in target range for required duration
        const inTargetZone = currentAngle >= min_angle - 8 && currentAngle <= max_angle + 8;
        const elapsedHold = timestamp - this.holdStartTime;

        holdProgressPercent = Math.min(100, Math.round((elapsedHold / this.holdDurationRequiredMs) * 100));

        if (!inTargetZone) {
          feedback = 'พยายามรักษาระดับองศาให้นิ่งในโซนเป้าหมาย';
        } else {
          if (elapsedHold >= this.holdDurationRequiredMs) {
            this.holdEndTime = timestamp;
            this.eccentricStartTime = timestamp;
            this.transitionTo('COMPLETE', timestamp);
            feedback = 'ยอดเยี่ยม! ค่อยๆ คลายท่ากลับสู่จุดเริ่มต้น';
          } else {
            const secLeft = Math.max(0.1, (this.holdDurationRequiredMs - elapsedHold) / 1000).toFixed(1);
            feedback = `ค้างท่าไว้... ${secLeft} วินาที`;
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
          this.eccentricEndTime = timestamp;
          this.repCount++;
          if (isPostureValid) this.correctReps++;
          isRepJustCompleted = true;

          this.transitionTo('READY', timestamp);
          feedback = `นับแล้ว ครั้งที่ ${this.repCount}! เตรียมเริ่มครั้งถัดไป`;
        } else {
          feedback = 'ค่อยๆ คลายท่ากลับสู่จุดเริ่มต้นอย่างควบคุม';
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
      : (phase === 'apex_hold' ? (timestamp - this.holdStartTime) / 1000 : 0);

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
