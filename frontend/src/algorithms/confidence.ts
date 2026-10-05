import { Landmark, PoseLandmarks } from '../types/pose';

/**
 * Confidence & Visibility Fail-Safe Algorithm
 * Ensures AI halts calculation rather than guessing when joint visibility is degraded
 */

export interface ConfidenceEvaluation {
  overallConfidence: number; // 0 to 100%
  isReliable: boolean;
  occludedJoints: string[];
  keyJointsPresent: boolean;
}

export function evaluateLandmarkConfidence(
  landmarks: PoseLandmarks | null,
  requiredIndices: number[] = [11, 12, 13, 14, 15, 16], // Shoulders, elbows, wrists
  minVisibilityThreshold: number = 0.45
): ConfidenceEvaluation {
  if (!landmarks || landmarks.length === 0) {
    return {
      overallConfidence: 0,
      isReliable: false,
      occludedJoints: ['Full Body Out of Frame'],
      keyJointsPresent: false,
    };
  }

  const occluded: string[] = [];
  let totalScore = 0;
  let count = 0;

  for (const idx of requiredIndices) {
    const lm: Landmark | undefined = landmarks[idx];
    const vis = lm?.visibility ?? 0;
    totalScore += vis;
    count++;

    if (vis < minVisibilityThreshold) {
      occluded.push(`Joint #${idx}`);
    }
  }

  const avgVisibility = count > 0 ? totalScore / count : 0;
  const overallConfidence = Math.round(avgVisibility * 100);
  const isReliable = occluded.length === 0 && overallConfidence >= 50;

  return {
    overallConfidence,
    isReliable,
    occludedJoints: occluded,
    keyJointsPresent: count > 0 && occluded.length <= 1,
  };
}
