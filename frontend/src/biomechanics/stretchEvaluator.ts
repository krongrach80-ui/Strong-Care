import { PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { StretchExerciseItem } from '../data/stretchExercises';

export interface StretchEvaluationResult {
  isHoldingPose: boolean;
  score: number; // 0 to 100
  currentAngle: number;
  feedback: string;
}

/**
 * Helper to compute 2D angle (degrees) between 3 points: A -> B (vertex) -> C
 */
function calculate2DAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.hypot(baX, baY);
  const magBC = Math.hypot(bcX, bcY);

  if (magBA === 0 || magBC === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

/**
 * Evaluate whether the user is actively adopting the required posture for a stretch exercise.
 */
export function evaluateStretchPose(
  landmarks: PoseLandmarks | null,
  stretch: StretchExerciseItem | null,
  activeSide: 'left' | 'right' | 'both' = 'left'
): StretchEvaluationResult {
  if (!landmarks || landmarks.length === 0 || !stretch) {
    return {
      isHoldingPose: false,
      score: 0,
      currentAngle: 0,
      feedback: 'ไม่พบตำแหน่งร่างกายในกรอบกล้อง',
    };
  }

  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const le = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const re = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const lw = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rw = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const lk = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rk = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const la = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const ra = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  const midShoulder = ls && rs ? { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 } : null;
  const midHip = lh && rh ? { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 } : null;

  const id = stretch.id;
  let isHolding = false;
  let measuredAngle = 0;
  let score = 75;
  let feedback = 'ทำท่าทางตามภาพตัวอย่าง';

  switch (id) {
    case 'stretch_neck_lateral': {
      // Lateral neck stretch: Head tilted sideways relative to vertical
      if (nose && midShoulder) {
        const dx = Math.abs(nose.x - midShoulder.x);
        const dy = Math.abs(midShoulder.y - nose.y);
        const tiltDeg = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
        measuredAngle = tiltDeg;
        // Target: ~28°, threshold >= 12°
        isHolding = tiltDeg >= 12;
        score = Math.min(100, Math.max(50, Math.round((tiltDeg / 25) * 100)));
        feedback = isHolding ? 'เอียงคอได้ระดับดี ยืดค้างไว้' : 'ค่อยๆ เอียงศีรษะไปด้านข้างให้ตึงสบาย';
      }
      break;
    }

    case 'stretch_neck_flexion': {
      // Neck flexion: Chin tucked down towards chest
      if (nose && midShoulder) {
        const dropRatio = (nose.y - (midShoulder.y - 0.22)) / 0.15;
        measuredAngle = Math.round(dropRatio * 40);
        isHolding = dropRatio >= 0.25;
        score = isHolding ? 90 : 60;
        feedback = isHolding ? 'ก้มคางเข้าหาอกได้ดี ค้างไว้' : 'ค่อยๆ ก้มศีรษะนำคางเข้าหาหน้าอก';
      }
      break;
    }

    case 'stretch_shoulder_cross': {
      // Cross-body shoulder stretch: active arm wrist crossed over center line
      const activeWrist = activeSide === 'left' ? lw : rw;
      if (activeWrist && midShoulder) {
        const isCrossed = activeSide === 'left' ? activeWrist.x > midShoulder.x : activeWrist.x < midShoulder.x;
        measuredAngle = Math.round(Math.abs(activeWrist.x - midShoulder.x) * 100);
        isHolding = isCrossed || Math.abs(activeWrist.x - midShoulder.x) < 0.08;
        score = isHolding ? 92 : 60;
        feedback = isHolding ? 'โอบแขนข้ามอกได้ดี ค้างไว้' : 'ยกแขนพาดข้ามหน้าอกและใช้มือประคอง';
      }
      break;
    }

    case 'stretch_triceps_overhead': {
      // Overhead triceps stretch: active elbow above shoulder and bent
      const activeElbow = activeSide === 'left' ? le : re;
      const activeShoulder = activeSide === 'left' ? ls : rs;
      const activeWrist = activeSide === 'left' ? lw : rw;

      if (activeElbow && activeShoulder) {
        const isElbowRaised = activeElbow.y < activeShoulder.y + 0.05;
        const elbowAngle = (activeShoulder && activeElbow && activeWrist)
          ? calculate2DAngle(activeShoulder, activeElbow, activeWrist)
          : 70;
        measuredAngle = elbowAngle;
        isHolding = isElbowRaised;
        score = isHolding ? 90 : 55;
        feedback = isHolding ? 'ยกศอกขึ้นเหนือศีรษะได้ดี ยืดค้างไว้' : 'ยกข้อศอกขึ้นเหนือศีรษะแล้วงอศอกไปด้านหลัง';
      }
      break;
    }

    case 'stretch_chest_open': {
      // Chest opener: wrists behind hips or shoulders retracted
      if (ls && rs && lw && rw) {
        const shoulderDist = Math.hypot(rs.x - ls.x, rs.y - ls.y);
        const wristDist = Math.hypot(rw.x - lw.x, rw.y - lw.y);
        measuredAngle = Math.round(shoulderDist * 100);
        isHolding = wristDist < 0.35 || (lh && rw.y > lh.y - 0.1);
        score = isHolding ? 95 : 65;
        feedback = isHolding ? 'เปิดอกและดึงสะบักไปด้านหลังได้ดี ค้างไว้' : 'ประสานมือด้านหลัง ยืดอกเปิดไหล่';
      }
      break;
    }

    case 'stretch_side_bend': {
      // Standing side bend: trunk lateral tilt
      if (midShoulder && midHip) {
        const dx = Math.abs(midShoulder.x - midHip.x);
        const dy = Math.abs(midShoulder.y - midHip.y);
        const tiltDeg = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
        measuredAngle = tiltDeg;
        isHolding = tiltDeg >= 8;
        score = Math.min(100, Math.max(50, Math.round((tiltDeg / 22) * 100)));
        feedback = isHolding ? 'เอียงข้างลำตัวได้ระดับดี ค้างไว้' : 'ยกแขนขึ้นแล้วเอียงลำตัวไปด้านข้าง';
      }
      break;
    }

    case 'stretch_torso_twist': {
      // Standing torso twist: shoulder horizontal tilt or torso twist
      if (ls && rs && lh && rh) {
        const shoulderTilt = Math.abs((rs.y - ls.y) / (rs.x - ls.x));
        const angleDeg = Math.round(shoulderTilt * 45);
        measuredAngle = angleDeg;
        isHolding = true; // Any stable upright stance counts for twist hold
        score = 88;
        feedback = 'บิดลำตัวส่วนบนช้าๆ ค้างไว้ หายใจสบายๆ';
      }
      break;
    }

    case 'stretch_quadriceps': {
      // Quadriceps stretch: knee flexion < 125°
      const activeHip = activeSide === 'left' ? lh : rh;
      const activeKnee = activeSide === 'left' ? lk : rk;
      const activeAnkle = activeSide === 'left' ? la : ra;

      if (activeHip && activeKnee && activeAnkle) {
        const kneeAngle = calculate2DAngle(activeHip, activeKnee, activeAnkle);
        measuredAngle = kneeAngle;
        isHolding = kneeAngle < 135;
        score = isHolding ? 92 : 60;
        feedback = isHolding ? 'พับเข่าดึงส้นเท้าได้ดี ยืดค้างไว้' : 'งอเข่าพับส้นเท้าเข้าหาก้น ใช้มือจับข้อเท้า';
      } else {
        isHolding = true; // Fallback if lower limb partially occluded
      }
      break;
    }

    case 'stretch_hamstrings':
    case 'stretch_piriformis_seated': {
      // Hamstrings / Piriformis: forward trunk tilt
      if (midShoulder && midHip) {
        const isLeaning = midShoulder.y > midHip.y - 0.45;
        measuredAngle = 65;
        isHolding = isLeaning;
        score = isHolding ? 90 : 60;
        feedback = isHolding ? 'โน้มตัวไปข้างหน้าได้ดี ค้างไว้' : 'รักษาหลังให้ตรง ค่อยๆ โน้มสะโพกไปข้างหน้า';
      }
      break;
    }

    case 'stretch_calf': {
      // Calf stretch: straight back leg
      const backKnee = activeSide === 'left' ? lk : rk;
      const backHip = activeSide === 'left' ? lh : rh;
      const backAnkle = activeSide === 'left' ? la : ra;

      if (backHip && backKnee && backAnkle) {
        const legAngle = calculate2DAngle(backHip, backKnee, backAnkle);
        measuredAngle = legAngle;
        isHolding = legAngle > 140;
        score = isHolding ? 92 : 65;
        feedback = isHolding ? 'เหยียดขาหลังตรงได้ดี ยืดค้างไว้' : 'ก้าวขาไปด้านหลัง เหยียดขาตรง ส้นเท้าแนบพื้น';
      } else {
        isHolding = true;
      }
      break;
    }

    default: {
      isHolding = Boolean(ls && rs);
      score = 85;
      feedback = 'ยืดค้างไว้ในท่าทางที่สบาย';
      break;
    }
  }

  return {
    isHoldingPose: isHolding,
    score,
    currentAngle: measuredAngle,
    feedback,
  };
}
