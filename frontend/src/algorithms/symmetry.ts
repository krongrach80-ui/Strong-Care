/**
 * Bilateral Symmetry Algorithm
 * Evaluates left vs right joint angle symmetry, deviation, and balance index
 */

export interface SymmetryResult {
  leftValue: number;
  rightValue: number;
  symmetryRatio: number; // 0 to 1.0 (1.0 = perfect bilateral symmetry)
  deviationDeg: number;
  isBalanced: boolean;
}

export function calculateSymmetry(
  leftAngle: number,
  rightAngle: number,
  maxAllowableDeviationDeg: number = 15
): SymmetryResult {
  const deviation = Math.abs(leftAngle - rightAngle);
  const maxVal = Math.max(leftAngle, rightAngle, 1);
  const minVal = Math.min(leftAngle, rightAngle);
  
  // Symmetry index between 0 and 1
  const ratio = Math.max(0, Math.min(1, minVal / maxVal));

  return {
    leftValue: Math.round(leftAngle * 10) / 10,
    rightValue: Math.round(rightAngle * 10) / 10,
    symmetryRatio: Math.round(ratio * 100) / 100,
    deviationDeg: Math.round(deviation * 10) / 10,
    isBalanced: deviation <= maxAllowableDeviationDeg,
  };
}
