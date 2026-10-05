import { Landmark, PoseLandmarks } from '../types/pose';

export class LandmarkSmoother {
  private prevLandmarks: PoseLandmarks | null = null;
  private alpha: number;

  /**
   * @param alpha Smoothing factor between 0 (heavy smooth, more latency) and 1 (raw signal, no smooth)
   */
  constructor(alpha: number = 0.65) {
    this.alpha = alpha;
  }

  public smooth(currentLandmarks: PoseLandmarks): PoseLandmarks {
    if (!this.prevLandmarks || this.prevLandmarks.length !== currentLandmarks.length) {
      this.prevLandmarks = currentLandmarks.map(p => ({ ...p }));
      return currentLandmarks;
    }

    const smoothed: PoseLandmarks = currentLandmarks.map((curr, idx) => {
      const prev = this.prevLandmarks![idx];
      return {
        x: this.alpha * curr.x + (1 - this.alpha) * prev.x,
        y: this.alpha * curr.y + (1 - this.alpha) * prev.y,
        z: curr.z !== undefined && prev.z !== undefined ? this.alpha * curr.z + (1 - this.alpha) * prev.z : curr.z,
        visibility: curr.visibility,
      };
    });

    this.prevLandmarks = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.prevLandmarks = null;
  }
}
