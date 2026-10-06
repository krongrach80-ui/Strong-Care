import { Landmark } from '../types/pose';

/**
 * Calculate the angle at joint B formed by points A - B - C (0° to 180°)
 * @param a First landmark (e.g. Shoulder)
 * @param b Middle joint vertex (e.g. Elbow)
 * @param c Third landmark (e.g. Wrist)
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  if (!a || !b || !c) return 0;

  // Vector BA
  const baX = a.x - b.x;
  const baY = a.y - b.y;

  // Vector BC
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  // Dot product
  const dotProduct = baX * bcX + baY * bcY;

  // Magnitudes
  const magBA = Math.hypot(baX, baY);
  const magBC = Math.hypot(bcX, bcY);

  if (magBA === 0 || magBC === 0) return 0;

  // Clamp cosine to [-1, 1] to prevent NaN due to float inaccuracies
  const cosine = Math.max(-1, Math.min(1, dotProduct / (magBA * magBC)));
  const angleRad = Math.acos(cosine);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculate inclination angle with respect to the vertical (y-axis)
 * Useful for spine verticality, torso lean, or arm elevation
 */
export function calculateVerticalAngle(top: Landmark, bottom: Landmark): number {
  if (!top || !bottom) return 0;

  const dx = top.x - bottom.x;
  const dy = top.y - bottom.y;

  const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
  return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
}

/**
 * Calculate horizontal tilt angle (e.g. shoulder balance or hip tilt)
 */
export function calculateHorizontalTilt(left: Landmark, right: Landmark): number {
  if (!left || !right) return 0;

  const dy = right.y - left.y;
  const dx = right.x - left.x;

  const angleRad = Math.atan2(dy, dx);
  return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
}
