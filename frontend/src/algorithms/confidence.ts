import { Landmark, PoseLandmarks } from '../types/pose';

/**
 * Confidence & Visibility Fail-Safe Algorithm
 * Exercise-aware: Evaluates only the joints pertinent to the specific movement.
 */

export interface ConfidenceEvaluation {
  overallConfidence: number; // 0 to 100%
  isReliable: boolean;
  occludedJoints: string[];
  keyJointsPresent: boolean;
}

export const EXERCISE_REQUIRED_LANDMARKS: Record<string, number[]> = {
  shoulder_raise:  [11, 12, 13, 14],            // Shoulders, elbows
  bicep_curl:      [11, 12, 13, 14, 15, 16],    // Shoulders, elbows, wrists
  elbow_extension: [11, 12, 13, 14, 15, 16],    // Shoulders, elbows, wrists
  knee_squat:      [23, 24, 25, 26, 27, 28],    // Hips, knees, ankles
  'chair_squat':   [23, 24, 25, 26, 27, 28],    // Hips, knees, ankles
  'alternating-knee-raise': [23, 24, 25, 26, 27, 28], // Hips, knees, ankles
};

export function evaluateLandmarkConfidence(
  landmarks: PoseLandmarks | null,
  exerciseOrIndices: string | number[] = [11, 12, 13, 14],
  minVisibilityThreshold: number = 0.35
): ConfidenceEvaluation {
  if (!landmarks || landmarks.length === 0) {
    return {
      overallConfidence: 0,
      isReliable: false,
      occludedJoints: ['Full Body Out of Frame'],
      keyJointsPresent: false,
    };
  }

  const indices: number[] = typeof exerciseOrIndices === 'string'
    ? (EXERCISE_REQUIRED_LANDMARKS[exerciseOrIndices] || [11, 12, 13, 14])
    : exerciseOrIndices;

  const occluded: string[] = [];
  let totalScore = 0;
  let count = 0;

  for (const idx of indices) {
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

  // Relaxed clinical reliability: allow at most 1 minor occluded landmark if overall confidence >= 45%
  const isReliable = (occluded.length === 0 || (occluded.length <= 1 && indices.length >= 4)) && overallConfidence >= 45;

  return {
    overallConfidence,
    isReliable,
    occludedJoints: occluded,
    keyJointsPresent: count > 0 && occluded.length <= 1,
  };
}
