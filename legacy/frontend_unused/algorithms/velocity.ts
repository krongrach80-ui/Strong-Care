/**
 * Angular Velocity & Jerk Algorithm
 * Evaluates rate of joint movement (degrees per second) to flag excessive speed or spastic jerks
 */

export interface VelocityTrackerState {
  velocityDegPerSec: number;
  isExcessiveVelocity: boolean;
  peakVelocity: number;
}

export class VelocityTracker {
  private lastAngle: number | null = null;
  private lastTimestamp: number | null = null;
  private peakVelocity: number = 0;
  private maxAllowedVelocityDegPerSec: number;

  constructor(maxAllowedVelocity: number = 220) {
    this.maxAllowedVelocityDegPerSec = maxAllowedVelocity;
  }

  public reset(): void {
    this.lastAngle = null;
    this.lastTimestamp = null;
    this.peakVelocity = 0;
  }

  public update(currentAngle: number, timestampMs: number = Date.now()): VelocityTrackerState {
    if (this.lastAngle === null || this.lastTimestamp === null) {
      this.lastAngle = currentAngle;
      this.lastTimestamp = timestampMs;
      return {
        velocityDegPerSec: 0,
        isExcessiveVelocity: false,
        peakVelocity: 0,
      };
    }

    const dt = (timestampMs - this.lastTimestamp) / 1000;
    if (dt <= 0.005) {
      return {
        velocityDegPerSec: 0,
        isExcessiveVelocity: false,
        peakVelocity: this.peakVelocity,
      };
    }

    const dAngle = Math.abs(currentAngle - this.lastAngle);
    const velocity = dAngle / dt;

    if (velocity > this.peakVelocity) {
      this.peakVelocity = velocity;
    }

    this.lastAngle = currentAngle;
    this.lastTimestamp = timestampMs;

    return {
      velocityDegPerSec: Math.round(velocity * 10) / 10,
      isExcessiveVelocity: velocity > this.maxAllowedVelocityDegPerSec,
      peakVelocity: Math.round(this.peakVelocity * 10) / 10,
    };
  }
}
