import { Landmark, PoseLandmarks } from '../types/pose';

/**
 * 1€ Filter (Casiez, Roussel, Vogel, CHI 2012)
 * Adaptive first-order low-pass filter:
 * - At low speed (standing still / holding posture): uses low cutoff frequency fc_min to eliminate jitter
 * - At high speed (moving rapidly): dynamically increases cutoff frequency with slope beta to eliminate lag
 */
export class OneEuroFilter1D {
  private minCutoff: number; // fc_min in Hz (default: 1.0)
  private beta: number;      // speed coefficient (default: 0.007)
  private dCutoff: number;   // cutoff frequency for derivative in Hz (default: 1.0)
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  public reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  private smoothingFactor(te: number, cutoff: number): number {
    const r = 2 * Math.PI * cutoff * te;
    return r / (r + 1);
  }

  public filter(x: number, timestampMs: number): number {
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestampMs;
      return x;
    }

    const te = Math.max(0.001, (timestampMs - this.tPrev) / 1000);
    this.tPrev = timestampMs;

    // Filter derivative
    const dx = (x - this.xPrev) / te;
    const alphaD = this.smoothingFactor(te, this.dCutoff);
    const edx = alphaD * dx + (1 - alphaD) * this.dxPrev;
    this.dxPrev = edx;

    // Dynamic cutoff based on velocity
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const alpha = this.smoothingFactor(te, cutoff);
    const xFiltered = alpha * x + (1 - alpha) * this.xPrev;
    this.xPrev = xFiltered;

    return xFiltered;
  }
}

/**
 * LandmarkSmoother
 * Applies OneEuroFilter1D to (x, y, z) coordinates of each landmark based on frame timestamps.
 * Eliminates jitter during isometric holds without lag during dynamic concentric motions.
 */
export class LandmarkSmoother {
  private filters: Array<{ x: OneEuroFilter1D; y: OneEuroFilter1D; z: OneEuroFilter1D }> = [];
  private minCutoff: number;
  private beta: number;

  /**
   * @param minCutoff Lower cutoff for jitter suppression (default: 1.0 Hz)
   * @param beta Speed coefficient (default: 0.007)
   */
  constructor(minCutoff: number = 1.0, beta: number = 0.007) {
    this.minCutoff = minCutoff;
    this.beta = beta;
  }

  public smooth(
    currentLandmarks: PoseLandmarks,
    timestampMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now()
  ): PoseLandmarks {
    if (!currentLandmarks || currentLandmarks.length === 0) {
      this.reset();
      return currentLandmarks;
    }

    // Initialize filters if landmark count changed
    if (this.filters.length !== currentLandmarks.length) {
      this.filters = currentLandmarks.map(
        () => ({
          x: new OneEuroFilter1D(this.minCutoff, this.beta, 1.0),
          y: new OneEuroFilter1D(this.minCutoff, this.beta, 1.0),
          z: new OneEuroFilter1D(this.minCutoff, this.beta, 1.0),
        })
      );
    }

    return currentLandmarks.map((curr, idx) => {
      const f = this.filters[idx];
      const smoothX = f.x.filter(curr.x, timestampMs);
      const smoothY = f.y.filter(curr.y, timestampMs);
      const smoothZ = curr.z !== undefined ? f.z.filter(curr.z, timestampMs) : undefined;

      return {
        x: smoothX,
        y: smoothY,
        z: smoothZ,
        visibility: curr.visibility,
      };
    });
  }

  public reset(): void {
    for (const f of this.filters) {
      f.x.reset();
      f.y.reset();
      f.z.reset();
    }
  }
}
