/**
 * ROM (Range of Motion) Algorithm
 * Tracks joint excursion, minimum start angle, peak extension/flexion, and ROM delta
 */

export interface RomTrackerState {
  minObservedAngle: number;
  maxObservedAngle: number;
  currentRom: number;
  peakRomInRep: number;
  targetRom: number;
  isTargetReached: boolean;
}

export class RomCalculator {
  private minAngle: number = 999;
  private maxAngle: number = -999;
  private targetAngle: number;
  private tolerance: number;

  constructor(targetAngle: number = 90, tolerance: number = 10) {
    this.targetAngle = targetAngle;
    this.tolerance = tolerance;
  }

  public resetRep(): void {
    this.minAngle = 999;
    this.maxAngle = -999;
  }

  public update(currentAngle: number): RomTrackerState {
    if (currentAngle < this.minAngle) this.minAngle = currentAngle;
    if (currentAngle > this.maxAngle) this.maxAngle = currentAngle;

    const currentRom = Math.max(0, this.maxAngle - (this.minAngle === 999 ? currentAngle : this.minAngle));
    const isTargetReached = currentAngle >= (this.targetAngle - this.tolerance);

    return {
      minObservedAngle: this.minAngle === 999 ? currentAngle : this.minAngle,
      maxObservedAngle: this.maxAngle === -999 ? currentAngle : this.maxAngle,
      currentRom: Math.round(currentRom * 10) / 10,
      peakRomInRep: Math.round((this.maxAngle === -999 ? currentAngle : this.maxAngle) * 10) / 10,
      targetRom: this.targetAngle,
      isTargetReached,
    };
  }

  public setTarget(targetAngle: number, tolerance: number = 10): void {
    this.targetAngle = targetAngle;
    this.tolerance = tolerance;
  }
}
