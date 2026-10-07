import { PoseLandmarks, POSE_LANDMARKS } from '../types/pose';
import { StretchExerciseItem } from '../data/stretchExercises';
import { getPoseSpec } from './poseSpecs';

export interface StretchEvaluationResult {
  isHoldingPose: boolean;
  score: number; // 0 to 100
  currentAngle: number;
  targetAngle: number;
  tolerance: number;
  jointName: string;
  isWithinTargetBand: boolean;
  feedback: string;
}

/**
 * Aspect-ratio-corrected 2D angle (degrees) between 3 points: A -> B (vertex) -> C
 */
function calculate2DAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  ar: number = 1.0
): number {
  const baX = (a.x - b.x) * ar;
  const baY = a.y - b.y;
  const bcX = (c.x - b.x) * ar;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.hypot(baX, baY);
  const magBC = Math.hypot(bcX, bcY);

  if (magBA === 0 || magBC === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

/**
 * 3D angle in metric meters (from worldLandmarks)
 */
function calculate3DAngle(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number },
  c: { x: number; y: number; z?: number }
): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const baZ = (a.z ?? 0) - (b.z ?? 0);

  const bcX = c.x - b.x;
  const bcY = c.y - b.y;
  const bcZ = (c.z ?? 0) - (b.z ?? 0);

  const dot = baX * bcX + baY * bcY + baZ * bcZ;
  const magBA = Math.hypot(baX, baY, baZ);
  const magBC = Math.hypot(bcX, bcY, bcZ);

  if (magBA === 0 || magBC === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

function getKeyLandmarksForExercise(id: string): number[] {
  switch (id) {
    case 'stretch_neck_lateral':
      return [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.RIGHT_EAR, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER];
    case 'stretch_neck_flexion':
      return [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER];
    case 'stretch_shoulder_cross':
    case 'stretch_triceps_overhead':
      return [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST];
    case 'stretch_chest_open':
      return [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST];
    case 'stretch_side_bend':
    case 'stretch_torso_twist':
      return [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP];
    case 'stretch_quadriceps':
    case 'stretch_calf':
      return [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE];
    case 'stretch_hamstrings':
    case 'stretch_piriformis_seated':
      return [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP];
    default:
      return [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER];
  }
}

/**
 * Evaluate whether the user is actively adopting the required posture for a stretch exercise.
 * Evaluates real kinematic angles, applies aspect-ratio scaling, and calculates score
 * proportionally to deviations beyond toleranceDeg.
 */
export function evaluateStretchPose(
  landmarks: PoseLandmarks | null,
  stretch: StretchExerciseItem | null,
  activeSide: 'left' | 'right' | 'both' = 'left',
  aspectRatio: number = 1.0,
  worldLandmarks?: PoseLandmarks | null
): StretchEvaluationResult {
  if (!landmarks || landmarks.length === 0 || !stretch) {
    return {
      isHoldingPose: false,
      score: 0,
      currentAngle: 0,
      targetAngle: 90,
      tolerance: 10,
      jointName: 'ข้อต่อ',
      isWithinTargetBand: false,
      feedback: 'ไม่พบตำแหน่งร่างกายในกรอบกล้อง',
    };
  }

  const ar = aspectRatio > 0 ? aspectRatio : 1.0;
  const spec = getPoseSpec(stretch.id);
  const targetAngle = stretch.scoring?.targetAngleDeg ?? spec.targetAngleDeg;
  const tolerance = Math.min(10, stretch.scoring?.toleranceDeg ?? spec.toleranceDeg ?? 10);

  // Key landmark visibility check: If > 2 key landmarks have visibility < 0.55, reject calculation
  const keyIndices = getKeyLandmarksForExercise(stretch.id);
  let lowVisibilityCount = 0;
  for (const idx of keyIndices) {
    const pt = landmarks[idx];
    if (!pt || (pt.visibility ?? 1) < 0.55) {
      lowVisibilityCount++;
    }
  }

  if (lowVisibilityCount > 2) {
    return {
      isHoldingPose: false,
      score: 0,
      currentAngle: 0,
      targetAngle,
      tolerance,
      jointName: stretch.scoring?.primaryJoint || 'ข้อต่อ',
      isWithinTargetBand: false,
      feedback: 'มองไม่เห็นร่างกายชัดเจน กรุณาจัดตัวให้อยู่ในเฟรม',
    };
  }

  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const lEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
  const rEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
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
  let jointName = 'ข้อต่อ';
  let feedback = 'ทำท่าทางตามภาพตัวอย่าง';

  const wls = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.LEFT_SHOULDER] : null;
  const wrs = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER] : null;
  const wle = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.LEFT_ELBOW] : null;
  const wre = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.RIGHT_ELBOW] : null;
  const wlw = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.LEFT_WRIST] : null;
  const wrw = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.RIGHT_WRIST] : null;
  const wlh = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.LEFT_HIP] : null;
  const wrh = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.RIGHT_HIP] : null;
  const wlk = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.LEFT_KNEE] : null;
  const wrk = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.RIGHT_KNEE] : null;
  const wla = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.LEFT_ANKLE] : null;
  const wra = worldLandmarks ? worldLandmarks[POSE_LANDMARKS.RIGHT_ANKLE] : null;

  switch (id) {
    case 'stretch_neck_lateral': {
      jointName = 'คอ';
      // Lateral neck stretch: ear line vs shoulder line tilt or nose to shoulder vertical inclination
      if (lEar && rEar && ls && rs) {
        const earTilt = (Math.atan2(rEar.y - lEar.y, (rEar.x - lEar.x) * ar) * 180) / Math.PI;
        const shoulderTilt = (Math.atan2(rs.y - ls.y, (rs.x - ls.x) * ar) * 180) / Math.PI;
        measuredAngle = Math.round(Math.abs(earTilt - shoulderTilt));
      } else if (nose && midShoulder) {
        const dx = Math.abs((nose.x - midShoulder.x) * ar);
        const dy = Math.abs(midShoulder.y - nose.y);
        measuredAngle = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
      }
      isHolding = measuredAngle >= (targetAngle - tolerance);
      feedback = isHolding ? 'เอียงคอได้ระดับดี ยืดค้างไว้' : 'ค่อยๆ เอียงศีรษะไปด้านข้างให้รู้สึกตึงสบาย';
      break;
    }

    case 'stretch_neck_flexion': {
      jointName = 'คอ';
      // Neck flexion: Chin tucked down towards chest
      if (nose && midShoulder) {
        const dy = midShoulder.y - nose.y;
        const dx = Math.abs((nose.x - midShoulder.x) * ar);
        // Scaled angle of chin drop
        measuredAngle = Math.round(Math.max(0, (0.22 - dy) * 160));
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'ก้มคางเข้าหาอกได้ดี ค้างไว้' : 'ค่อยๆ ก้มศีรษะนำคางเข้าหาหน้าอก';
      }
      break;
    }

    case 'stretch_shoulder_cross': {
      jointName = 'ไหล่';
      // Cross-body shoulder stretch: active arm wrist crossed over center line
      const activeWrist = activeSide === 'left' ? lw : rw;
      const activeShoulder = activeSide === 'left' ? ls : rs;
      const oppShoulder = activeSide === 'left' ? rs : ls;

      const wActiveWrist = activeSide === 'left' ? wlw : wrw;
      const wActiveShoulder = activeSide === 'left' ? wls : wrs;
      const wOppShoulder = activeSide === 'left' ? wrs : wls;

      if (wActiveWrist && wActiveShoulder && wOppShoulder) {
        const armAngle = calculate3DAngle(wOppShoulder, wActiveShoulder, wActiveWrist);
        measuredAngle = Math.max(0, 180 - armAngle);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'โอบแขนข้ามอกได้ดี ค้างไว้' : 'ยกแขนพาดข้ามหน้าอกและใช้มือประคอง';
      } else if (activeWrist && activeShoulder && oppShoulder) {
        const armAngle = calculate2DAngle(oppShoulder, activeShoulder, activeWrist, ar);
        measuredAngle = Math.max(0, 180 - armAngle);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'โอบแขนข้ามอกได้ดี ค้างไว้' : 'ยกแขนพาดข้ามหน้าอกและใช้มือประคอง';
      }
      break;
    }

    case 'stretch_triceps_overhead': {
      jointName = 'ศอก';
      // Overhead triceps stretch: active elbow above shoulder and bent
      const activeElbow = activeSide === 'left' ? le : re;
      const activeShoulder = activeSide === 'left' ? ls : rs;
      const activeWrist = activeSide === 'left' ? lw : rw;

      const wActiveElbow = activeSide === 'left' ? wle : wre;
      const wActiveShoulder = activeSide === 'left' ? wls : wrs;
      const wActiveWrist = activeSide === 'left' ? wlw : wrw;

      if (wActiveElbow && wActiveShoulder && wActiveWrist) {
        measuredAngle = calculate3DAngle(wActiveShoulder, wActiveElbow, wActiveWrist);
        const isElbowRaised = activeElbow ? activeElbow.y < (activeShoulder?.y ?? 0) + 0.05 : true;
        isHolding = isElbowRaised && measuredAngle <= (targetAngle + tolerance);
        feedback = isHolding ? 'ยกศอกขึ้นเหนือศีรษะได้ดี ยืดค้างไว้' : 'ยกข้อศอกขึ้นเหนือศีรษะแล้วงอศอกไปด้านหลัง';
      } else if (activeElbow && activeShoulder && activeWrist) {
        measuredAngle = calculate2DAngle(activeShoulder, activeElbow, activeWrist, ar);
        const isElbowRaised = activeElbow.y < activeShoulder.y + 0.05;
        isHolding = isElbowRaised && measuredAngle <= (targetAngle + tolerance);
        feedback = isHolding ? 'ยกศอกขึ้นเหนือศีรษะได้ดี ยืดค้างไว้' : 'ยกข้อศอกขึ้นเหนือศีรษะแล้วงอศอกไปด้านหลัง';
      }
      break;
    }

    case 'stretch_chest_open': {
      jointName = 'อก/ไหล่';
      // Chest opener: arms retracted backward
      if (wls && wrs && wlw && wrw) {
        const leftArmAngle = calculate3DAngle(wrs, wls, wlw);
        const rightArmAngle = calculate3DAngle(wls, wrs, wrw);
        measuredAngle = Math.round((leftArmAngle + rightArmAngle) / 2);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'เปิดอกและดึงสะบักไปด้านหลังได้ดี ค้างไว้' : 'ประสานมือด้านหลัง ยืดอกเปิดไหล่';
      } else if (ls && rs && lw && rw) {
        const leftArmAngle = calculate2DAngle(rs, ls, lw, ar);
        const rightArmAngle = calculate2DAngle(ls, rs, rw, ar);
        measuredAngle = Math.round((leftArmAngle + rightArmAngle) / 2);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'เปิดอกและดึงสะบักไปด้านหลังได้ดี ค้างไว้' : 'ประสานมือด้านหลัง ยืดอกเปิดไหล่';
      }
      break;
    }

    case 'stretch_side_bend': {
      jointName = 'ลำตัว';
      // Standing side bend: trunk lateral tilt
      if (midShoulder && midHip) {
        const dx = Math.abs((midShoulder.x - midHip.x) * ar);
        const dy = Math.abs(midShoulder.y - midHip.y);
        measuredAngle = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'เอียงข้างลำตัวได้ระดับดี ค้างไว้' : 'ยกแขนขึ้นแล้วเอียงลำตัวไปด้านข้าง';
      }
      break;
    }

    case 'stretch_torso_twist': {
      jointName = 'ลำตัว';
      // Standing torso twist: shoulder horizontal tilt relative to hips
      if (ls && rs && lh && rh) {
        const shoulderTilt = (Math.atan2(rs.y - ls.y, (rs.x - ls.x) * ar) * 180) / Math.PI;
        const hipTilt = (Math.atan2(rh.y - lh.y, (rh.x - lh.x) * ar) * 180) / Math.PI;
        measuredAngle = Math.round(Math.abs(shoulderTilt - hipTilt));
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'บิดลำตัวส่วนบนได้ดี ค้างไว้' : 'บิดลำตัวส่วนบนช้าๆ ค้างไว้ หายใจสบายๆ';
      }
      break;
    }

    case 'stretch_quadriceps': {
      jointName = 'เข่า';
      // Quadriceps stretch: knee flexion of bent leg
      const activeHip = activeSide === 'left' ? lh : rh;
      const activeKnee = activeSide === 'left' ? lk : rk;
      const activeAnkle = activeSide === 'left' ? la : ra;

      const wActiveHip = activeSide === 'left' ? wlh : wrh;
      const wActiveKnee = activeSide === 'left' ? wlk : wrk;
      const wActiveAnkle = activeSide === 'left' ? wla : wra;

      if (wActiveHip && wActiveKnee && wActiveAnkle) {
        measuredAngle = calculate3DAngle(wActiveHip, wActiveKnee, wActiveAnkle);
        isHolding = measuredAngle <= (targetAngle + tolerance);
        feedback = isHolding ? 'พับเข่าดึงส้นเท้าได้ดี ยืดค้างไว้' : 'งอเข่าพับส้นเท้าเข้าหาก้น ใช้มือจับข้อเท้า';
      } else if (activeHip && activeKnee && activeAnkle) {
        measuredAngle = calculate2DAngle(activeHip, activeKnee, activeAnkle, ar);
        isHolding = measuredAngle <= (targetAngle + tolerance);
        feedback = isHolding ? 'พับเข่าดึงส้นเท้าได้ดี ยืดค้างไว้' : 'งอเข่าพับส้นเท้าเข้าหาก้น ใช้มือจับข้อเท้า';
      } else {
        isHolding = Boolean(ls && rs);
      }
      break;
    }

    case 'stretch_hamstrings':
    case 'stretch_piriformis_seated': {
      jointName = 'สะโพก/หลัง';
      // Forward trunk tilt relative to vertical
      if (midShoulder && midHip) {
        const dx = Math.abs((midShoulder.x - midHip.x) * ar);
        const dy = Math.abs(midShoulder.y - midHip.y);
        measuredAngle = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'โน้มตัวไปข้างหน้าได้ดี ค้างไว้' : 'รักษาหลังให้ตรง ค่อยๆ โน้มสะโพกไปข้างหน้า';
      }
      break;
    }

    case 'stretch_calf': {
      jointName = 'เข่า/ขา';
      // Calf stretch: rear leg knee angle
      const backKnee = activeSide === 'left' ? lk : rk;
      const backHip = activeSide === 'left' ? lh : rh;
      const backAnkle = activeSide === 'left' ? la : ra;

      const wBackKnee = activeSide === 'left' ? wlk : wrk;
      const wBackHip = activeSide === 'left' ? wlh : wrh;
      const wBackAnkle = activeSide === 'left' ? wla : wra;

      if (wBackHip && wBackKnee && wBackAnkle) {
        measuredAngle = calculate3DAngle(wBackHip, wBackKnee, wBackAnkle);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'เหยียดขาหลังตรงได้ดี ยืดค้างไว้' : 'ก้าวขาไปด้านหลัง เหยียดขาตรง ส้นเท้าแนบพื้น';
      } else if (backHip && backKnee && backAnkle) {
        measuredAngle = calculate2DAngle(backHip, backKnee, backAnkle, ar);
        isHolding = measuredAngle >= (targetAngle - tolerance);
        feedback = isHolding ? 'เหยียดขาหลังตรงได้ดี ยืดค้างไว้' : 'ก้าวขาไปด้านหลัง เหยียดขาตรง ส้นเท้าแนบพื้น';
      } else {
        isHolding = Boolean(ls && rs);
      }
      break;
    }

    default: {
      jointName = 'ข้อต่อ';
      isHolding = Boolean(ls && rs);
      measuredAngle = targetAngle;
      feedback = 'ยืดค้างไว้ในท่าทางที่สบาย';
      break;
    }
  }

  // Dynamic clinical score: drops proportionally when exceeding tolerance
  const diff = Math.abs(measuredAngle - targetAngle);
  const isWithinTargetBand = diff <= tolerance;
  let score = 100;
  if (diff <= tolerance) {
    score = Math.round(100 - (diff / Math.max(1, tolerance)) * 10);
  } else {
    const excess = (diff - tolerance) / Math.max(1, tolerance);
    score = Math.max(0, Math.round(90 - excess * 45));
  }

  return {
    isHoldingPose: isHolding,
    score,
    currentAngle: measuredAngle,
    targetAngle,
    tolerance,
    jointName,
    isWithinTargetBand,
    feedback,
  };
}
