import { Landmark } from '../types/pose';

/**
 * Calculate Euclidean 2D distance between two landmarks
 */
export function calculateDistance(a: Landmark, b: Landmark): number {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Torso scale normalization factor based on shoulder-to-hip length
 * Allows invariant comparison across camera distances
 */
export function calculateTorsoScale(
  leftShoulder: Landmark,
  rightShoulder: Landmark,
  leftHip: Landmark,
  rightHip: Landmark
): number {
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = Math.abs(hipMidY - shoulderMidY);

  return torsoHeight > 0.05 ? torsoHeight : 0.3; // Default safe baseline
}
