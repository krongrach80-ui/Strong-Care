export interface JointAngle {
  jointName: string;
  angleDeg: number;
  minAngleDeg: number;
  maxAngleDeg: number;
  confidence: number;
}

export interface PostureMetrics {
  isInFrame: boolean;
  isFacingCamera: boolean;
  trunkLeanDeg: number;
  shoulderHikeDeg: number;
  shoulderLevelDeg: number;
  hipLevelDeg: number;
  postureScore: number; // 0-100
}

export interface SymmetryMetrics {
  bilateralSymmetryRatio: number; // 0-1.0 (1.0 = perfect bilateral symmetry)
  leftRom: number;
  rightRom: number;
  deviationDeg: number;
}

export interface VelocityMetrics {
  angularVelocityDegPerSec: number;
  isJerky: boolean;
  peakVelocity: number;
}

export interface BiomechanicsTelemetry {
  timestamp: number;
  primaryAngle: number;
  jointAngles: Record<string, number>;
  posture: PostureMetrics;
  symmetry?: SymmetryMetrics;
  velocity: VelocityMetrics;
  qualityScore: number;
}
