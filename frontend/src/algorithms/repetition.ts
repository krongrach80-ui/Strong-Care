import { ExerciseDefinition, RepResult, RepState } from '../types/exercise';

export interface RepCallbacks {
  onRepCompleted?: (result: RepResult) => void;
  onStateChanged?: (newState: RepState, oldState: RepState) => void;
}

export class RepetitionStateMachine {
  private exercise: ExerciseDefinition;
  private state: RepState = 'START';
  private repCount: number = 0;
  private correctReps: number = 0;
  private peakAngleInRep: number = 0;
  private minAngleInRep: number = 999;
  private repStartTime: number = 0;
  private holdStartTime: number = 0;
  private holdDurationMs: number = 600; // Hold at apex for 600ms
  private callbacks: RepCallbacks;

  constructor(exercise: ExerciseDefinition, callbacks: RepCallbacks = {}) {
    this.exercise = exercise;
    this.callbacks = callbacks;
  }

  public getState(): RepState {
    return this.state;
  }

  public getRepCount(): number {
    return this.repCount;
  }

  public getCorrectReps(): number {
    return this.correctReps;
  }

  public update(currentAngle: number, isPostureCorrect: boolean = true): {
    state: RepState;
    feedback: string;
    isCorrect: boolean;
    repCompletedResult?: RepResult;
  } {
    const now = Date.now();
    let feedback = '';
    let isCorrect = true;
    let repCompletedResult: RepResult | undefined = undefined;

    const { target_angle, min_angle, max_angle, slug } = this.exercise;

    // Track min/max angle reached during current repetition
    if (currentAngle > this.peakAngleInRep) this.peakAngleInRep = currentAngle;
    if (currentAngle < this.minAngleInRep) this.minAngleInRep = currentAngle;

    // State Machine Transitions tailored by exercise direction
    // In Shoulder Raise: Rest (~20-40° down), Target (~90° up)
    // In Bicep Curl: Rest (~150-170° extended), Target (~40-60° flexed)
    // In Knee Squat: Rest (~160-180° standing), Target (~90-105° squat)
    // In Elbow Extension: Rest (~70-90° bent), Target (~165-180° straight)

    const isDecreasingTarget = slug === 'bicep_curl' || slug === 'knee_squat';

    switch (this.state) {
      case 'START':
      case 'READY': {
        const isAtRest = isDecreasingTarget
          ? currentAngle >= 135 // Arms or legs extended at rest
          : currentAngle <= 45; // Arms down at sides at rest

        if (isAtRest) {
          if (this.state !== 'READY') {
            this.transitionTo('READY');
          }
          feedback = 'พร้อมแล้ว เริ่มขยับเข้าสู่ท่าทาง';
        } else {
          feedback = isDecreasingTarget ? 'ยืดข้อต่อกลับสู่ท่าเริ่มต้น' : 'วางแขนลงข้างลำตัวเพื่อเริ่ม';
        }
        break;
      }

      case 'DOWN': // Active Movement Phase towards target
      case 'UP': {
        const reachedTarget = isDecreasingTarget
          ? currentAngle <= target_angle + 12
          : currentAngle >= target_angle - 12;

        if (reachedTarget) {
          this.holdStartTime = now;
          this.transitionTo('HOLD');
          feedback = 'ดีมาก! ค้างไว้สักครู่...';
        } else {
          const halfway = isDecreasingTarget
            ? currentAngle < 110
            : currentAngle > 55;
          feedback = halfway ? 'ใกล้ถึงองศาเป้าหมายแล้ว อีกนิดเดียว' : 'ค่อยๆ ขยับตามจังหวะ';
        }
        break;
      }

      case 'HOLD': {
        // Must maintain target range during hold
        const inTargetZone = currentAngle >= min_angle - 5 && currentAngle <= max_angle + 5;

        if (!inTargetZone) {
          // Slipped out of zone before completing hold
          feedback = 'พยายามรักษาระดับองศาให้นิ่ง';
        } else {
          const elapsedHold = now - this.holdStartTime;
          if (elapsedHold >= this.holdDurationMs) {
            this.transitionTo('COMPLETE');
            feedback = 'ยอดเยี่ยม! ค่อยๆ คลายท่ากลับสู่จุดเริ่มต้น';
          } else {
            feedback = `ค้างท่าไว้... ${Math.ceil((this.holdDurationMs - elapsedHold) / 200)} วินาที`;
          }
        }
        break;
      }

      case 'COMPLETE': {
        const returnedToRest = isDecreasingTarget
          ? currentAngle >= 130
          : currentAngle <= 45;

        if (returnedToRest) {
          // Rep successfully finished!
          this.repCount++;
          const durationSec = Math.max(1, (now - this.repStartTime) / 1000);

          const extremeAngle = isDecreasingTarget ? this.minAngleInRep : this.peakAngleInRep;
          const angleDiff = Math.abs(extremeAngle - target_angle);

          // Accuracy scoring
          let accuracy = Math.max(50, Math.round(100 - angleDiff * 1.5));
          if (!isPostureCorrect) accuracy -= 15;
          accuracy = Math.min(100, Math.max(40, accuracy));

          const repOk = accuracy >= 75 && isPostureCorrect;
          if (repOk) this.correctReps++;

          let repFeedback = repOk ? 'ยอดเยี่ยม ฟอร์มถูกต้องและจังหวะดี' : 'มุมยังไม่ได้ระนาบ หรือสันหลังเอียงเล็กน้อย';
          if (durationSec < 1.8) {
            repFeedback += ' (ขยับเร็วเกินไป แนะนำให้ช้าลง)';
          }

          repCompletedResult = {
            rep_number: this.repCount,
            angle: extremeAngle,
            accuracy,
            duration: Math.round(durationSec * 10) / 10,
            is_correct: repOk,
            feedback: repFeedback,
            timestamp: now,
          };

          if (this.callbacks.onRepCompleted) {
            this.callbacks.onRepCompleted(repCompletedResult);
          }

          // Reset for next repetition
          this.peakAngleInRep = 0;
          this.minAngleInRep = 999;
          this.repStartTime = now;
          this.transitionTo('READY');
          feedback = `นับแล้ว ครั้งที่ ${this.repCount}! เตรียมเริ่มครั้งถัดไป`;
        } else {
          feedback = 'คลายกล้ามเนื้อกลับสู่ท่าเริ่มต้นให้สุด';
        }
        break;
      }
    }

    // Trigger movement initiation from READY
    if (this.state === 'READY') {
      const movedTowardsTarget = isDecreasingTarget
        ? currentAngle < 125
        : currentAngle > 50;

      if (movedTowardsTarget) {
        this.repStartTime = now;
        this.peakAngleInRep = currentAngle;
        this.minAngleInRep = currentAngle;
        this.transitionTo(isDecreasingTarget ? 'DOWN' : 'UP');
      }
    }

    return {
      state: this.state,
      feedback,
      isCorrect,
      repCompletedResult,
    };
  }

  private transitionTo(nextState: RepState): void {
    const old = this.state;
    this.state = nextState;
    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged(nextState, old);
    }
  }

  public reset(): void {
    this.state = 'START';
    this.repCount = 0;
    this.correctReps = 0;
    this.peakAngleInRep = 0;
    this.minAngleInRep = 999;
    this.repStartTime = 0;
    this.holdStartTime = 0;
  }
}
