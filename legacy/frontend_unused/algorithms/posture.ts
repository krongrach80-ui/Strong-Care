import { PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { calculateHorizontalTilt, calculateVerticalAngle } from './angle';

export interface PostureEvaluation {
  isUpright: boolean;
  isShouldersBalanced: boolean;
  isInFrame: boolean;
  spineAngle: number;
  shoulderTilt: number;
  feedback: string[];
  stabilityScore: number;
}

export function evaluatePosture(landmarks: PoseLandmarks): PostureEvaluation {
  const feedback: string[] = [];

  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const nose = landmarks[POSE_LANDMARKS.NOSE];

  // Visibility check
  const required = [leftShoulder, rightShoulder, leftHip, rightHip];
  const allVisible = required.every(l => l && (l.visibility === undefined || l.visibility > 0.45));

  if (!allVisible) {
    return {
      isUpright: false,
      isShouldersBalanced: false,
      isInFrame: false,
      spineAngle: 0,
      shoulderTilt: 0,
      feedback: ['กรุณาขยับตัวให้อยู่ในกรอบกล้อง ให้เห็นลำตัวชัดเจน'],
      stabilityScore: 0,
    };
  }

  // Spine inclination (Mid-shoulder to Mid-hip vertical alignment)
  const midShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const spineAngle = calculateVerticalAngle(midShoulder, midHip);
  const isUpright = spineAngle <= 14;

  if (!isUpright) {
    feedback.push('รักษาสันหลังให้ตรง อย่าเอียงลำตัว');
  }

  // Shoulder balance (tilt angle)
  const shoulderTilt = Math.abs(calculateHorizontalTilt(leftShoulder, rightShoulder));
  const isShouldersBalanced = shoulderTilt <= 10;

  if (!isShouldersBalanced) {
    feedback.push('ระวังไหล่เอียง รักษาแนวระดับหัวไหล่ให้เท่ากัน');
  }

  let stabilityScore = 100;
  if (!isUpright) stabilityScore -= 20;
  if (!isShouldersBalanced) stabilityScore -= 15;

  return {
    isUpright,
    isShouldersBalanced,
    isInFrame: true,
    spineAngle,
    shoulderTilt,
    feedback,
    stabilityScore: Math.max(0, stabilityScore),
  };
}
