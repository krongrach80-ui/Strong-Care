/**
 * StrongCare - Data-Driven Biomechanical Pose Specifications
 * 
 * Defines kinematic metrics, required joints, measurement methods,
 * resting/target envelopes, and exercise-specific allowed postures
 * across all rehabilitation and stretching exercises.
 */

export type MeasurementMethod =
  | '3_point_angle'     // Planar angle between 3 landmarks (A -> B=vertex -> C)
  | 'vertical_angle'    // Angle of vector relative to gravitational vertical (Y-axis)
  | 'horizontal_tilt'   // Horizontal tilt of vector (e.g. shoulder line)
  | 'head_pose_roll'    // Head lateral tilt from FaceLandmarker or ear-shoulder line
  | 'head_pose_pitch'   // Neck flexion (chin drop)
  | 'cross_midline';    // Distance of limb crossing the thoracic midline

export interface AllowedPostureExceptions {
  maxAllowableSpineLeanDeg?: number; // e.g. 35° for side_bend vs 14° standard
  allowShoulderTilt?: boolean;       // e.g. neck_lateral, side_bend
  allowTorsoTwist?: boolean;         // e.g. torso_twist
  requireHips?: boolean;             // false for seated / upper-body exercises
  requireKnees?: boolean;            // true for squats / lower-limb exercises
}

export interface PoseSpec {
  slug: string;
  name: string;
  primaryJoint: string;
  method: MeasurementMethod;
  landmarksUsed: number[]; // MediaPipe indices
  targetAngleDeg: number;
  toleranceDeg: number;
  restAngleDeg: number;
  triggerMotionDeg: number;
  isDecreasingTarget: boolean; // True if flexing towards smaller angle (e.g. bicep curl)
  allowedPostures: AllowedPostureExceptions;
}

export const POSE_SPECS: Record<string, PoseSpec> = {
  // --- Physio Exercises ---
  shoulder_raise: {
    slug: 'shoulder_raise',
    name: 'กางแขนยกด้านข้าง',
    primaryJoint: 'shoulder',
    method: '3_point_angle',
    landmarksUsed: [23, 11, 13, 24, 12, 14], // Hips, shoulders, elbows
    targetAngleDeg: 90,
    toleranceDeg: 15,
    restAngleDeg: 35,
    triggerMotionDeg: 45,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 15,
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: false,
    },
  },
  bicep_curl: {
    slug: 'bicep_curl',
    name: 'งอข้อศอกฟื้นฟูแขน',
    primaryJoint: 'elbow',
    method: '3_point_angle',
    landmarksUsed: [11, 13, 15, 12, 14, 16], // Shoulders, elbows, wrists
    targetAngleDeg: 50,
    toleranceDeg: 15,
    restAngleDeg: 140,
    triggerMotionDeg: 125,
    isDecreasingTarget: true,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 15,
      allowShoulderTilt: false,
      requireHips: false,
      requireKnees: false,
    },
  },
  elbow_extension: {
    slug: 'elbow_extension',
    name: 'เหยียดข้อศอก',
    primaryJoint: 'elbow',
    method: '3_point_angle',
    landmarksUsed: [11, 13, 15, 12, 14, 16],
    targetAngleDeg: 170,
    toleranceDeg: 15,
    restAngleDeg: 85,
    triggerMotionDeg: 105,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 15,
      allowShoulderTilt: false,
      requireHips: false,
      requireKnees: false,
    },
  },
  knee_squat: {
    slug: 'knee_squat',
    name: 'ย่อเข่าเก้าอี้',
    primaryJoint: 'knee',
    method: '3_point_angle',
    landmarksUsed: [23, 25, 27, 24, 26, 28], // Hips, knees, ankles
    targetAngleDeg: 90,
    toleranceDeg: 15,
    restAngleDeg: 165,
    triggerMotionDeg: 150,
    isDecreasingTarget: true,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 24,
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: true,
    },
  },
  chair_squat: {
    slug: 'chair_squat',
    name: 'ย่อเข่าเก้าอี้',
    primaryJoint: 'knee',
    method: '3_point_angle',
    landmarksUsed: [23, 25, 27, 24, 26, 28],
    targetAngleDeg: 90,
    toleranceDeg: 15,
    restAngleDeg: 165,
    triggerMotionDeg: 150,
    isDecreasingTarget: true,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 24,
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: true,
    },
  },
  'alternating-knee-raise': {
    slug: 'alternating-knee-raise',
    name: 'ท่ายกเข่าสลับ',
    primaryJoint: 'hip',
    method: '3_point_angle',
    landmarksUsed: [11, 23, 25, 12, 24, 26], // Shoulder, hip, knee
    targetAngleDeg: 90,
    toleranceDeg: 18,
    restAngleDeg: 165,
    triggerMotionDeg: 145,
    isDecreasingTarget: true,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 20,
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: true,
    },
  },

  // --- 11 Stretch Rehabilitation Exercises ---
  stretch_neck_lateral: {
    slug: 'stretch_neck_lateral',
    name: 'ยืดคอด้านข้าง',
    primaryJoint: 'neck',
    method: 'head_pose_roll',
    landmarksUsed: [0, 11, 12], // Nose/head, shoulders
    targetAngleDeg: 28,
    toleranceDeg: 12,
    restAngleDeg: 8,
    triggerMotionDeg: 14,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 18,
      allowShoulderTilt: true, // Natural head-tilt may slightly incline shoulder
      requireHips: false,
      requireKnees: false,
    },
  },
  stretch_neck_flexion: {
    slug: 'stretch_neck_flexion',
    name: 'ยืดคอก้มหน้า',
    primaryJoint: 'neck',
    method: 'head_pose_pitch',
    landmarksUsed: [0, 11, 12],
    targetAngleDeg: 35,
    toleranceDeg: 15,
    restAngleDeg: 10,
    triggerMotionDeg: 18,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 18,
      allowShoulderTilt: false,
      requireHips: false,
      requireKnees: false,
    },
  },
  stretch_shoulder_cross: {
    slug: 'stretch_shoulder_cross',
    name: 'ยืดไหล่ข้ามอก',
    primaryJoint: 'shoulder',
    method: 'cross_midline',
    landmarksUsed: [11, 12, 13, 14, 15, 16], // Shoulders, elbows, wrists
    targetAngleDeg: 40,
    toleranceDeg: 15,
    restAngleDeg: 10,
    triggerMotionDeg: 20,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 16,
      allowShoulderTilt: true,
      requireHips: false,
      requireKnees: false,
    },
  },
  stretch_triceps_overhead: {
    slug: 'stretch_triceps_overhead',
    name: 'ยืดต้นแขนด้านหลัง',
    primaryJoint: 'elbow',
    method: '3_point_angle',
    landmarksUsed: [11, 13, 15, 12, 14, 16],
    targetAngleDeg: 55,
    toleranceDeg: 20,
    restAngleDeg: 140,
    triggerMotionDeg: 110,
    isDecreasingTarget: true,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 16,
      allowShoulderTilt: true,
      requireHips: false,
      requireKnees: false,
    },
  },
  stretch_chest_open: {
    slug: 'stretch_chest_open',
    name: 'ยืดอก',
    primaryJoint: 'shoulder',
    method: '3_point_angle',
    landmarksUsed: [11, 12, 15, 16, 23, 24],
    targetAngleDeg: 30,
    toleranceDeg: 15,
    restAngleDeg: 10,
    triggerMotionDeg: 18,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 16,
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: false,
    },
  },
  stretch_side_bend: {
    slug: 'stretch_side_bend',
    name: 'ยืดข้างลำตัว',
    primaryJoint: 'spine',
    method: 'vertical_angle',
    landmarksUsed: [11, 12, 23, 24],
    targetAngleDeg: 25,
    toleranceDeg: 10,
    restAngleDeg: 6,
    triggerMotionDeg: 12,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 36, // Side bend naturally leans the spine! DO NOT STOP!
      allowShoulderTilt: true,
      requireHips: true,
      requireKnees: false,
    },
  },
  stretch_torso_twist: {
    slug: 'stretch_torso_twist',
    name: 'บิดลำตัวท่ายืน',
    primaryJoint: 'spine',
    method: 'horizontal_tilt',
    landmarksUsed: [11, 12, 23, 24],
    targetAngleDeg: 30,
    toleranceDeg: 12,
    restAngleDeg: 6,
    triggerMotionDeg: 14,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 18,
      allowShoulderTilt: true,
      allowTorsoTwist: true,
      requireHips: true,
      requireKnees: false,
    },
  },
  stretch_quadriceps: {
    slug: 'stretch_quadriceps',
    name: 'ยืดต้นขาด้านหน้า',
    primaryJoint: 'knee',
    method: '3_point_angle',
    landmarksUsed: [23, 25, 27, 24, 26, 28],
    targetAngleDeg: 50,
    toleranceDeg: 25,
    restAngleDeg: 160,
    triggerMotionDeg: 130,
    isDecreasingTarget: true,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 18,
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: true,
    },
  },
  stretch_hamstrings: {
    slug: 'stretch_hamstrings',
    name: 'ยืดต้นขาด้านหลัง',
    primaryJoint: 'hip',
    method: 'vertical_angle',
    landmarksUsed: [11, 12, 23, 24, 25, 26],
    targetAngleDeg: 65,
    toleranceDeg: 20,
    restAngleDeg: 15,
    triggerMotionDeg: 28,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 42, // Forward trunk lean from hips
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: true,
    },
  },
  stretch_calf: {
    slug: 'stretch_calf',
    name: 'ยืดน่อง',
    primaryJoint: 'ankle',
    method: 'vertical_angle',
    landmarksUsed: [23, 24, 25, 26, 27, 28],
    targetAngleDeg: 75,
    toleranceDeg: 15,
    restAngleDeg: 45,
    triggerMotionDeg: 55,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 28,
      allowShoulderTilt: false,
      requireHips: true,
      requireKnees: true,
    },
  },
  stretch_piriformis_seated: {
    slug: 'stretch_piriformis_seated',
    name: 'ยืดสะโพกและก้น (นั่งไขว้ขา)',
    primaryJoint: 'hip',
    method: 'vertical_angle',
    landmarksUsed: [11, 12, 23, 24, 25, 26],
    targetAngleDeg: 60,
    toleranceDeg: 18,
    restAngleDeg: 12,
    triggerMotionDeg: 24,
    isDecreasingTarget: false,
    allowedPostures: {
      maxAllowableSpineLeanDeg: 40, // Seated forward trunk lean
      allowShoulderTilt: false,
      requireHips: false, // Sitting close to desk/camera
      requireKnees: false,
    },
  },
};

/**
 * Resolve PoseSpec with safe fallback
 */
export function getPoseSpec(slug: string): PoseSpec {
  const normalized = slug.replace(/-/g, '_');
  if (POSE_SPECS[slug]) return POSE_SPECS[slug];
  if (POSE_SPECS[normalized]) return POSE_SPECS[normalized];

  // Try matching prefix / suffix
  const match = Object.keys(POSE_SPECS).find((k) => slug.includes(k) || k.includes(slug));
  if (match) return POSE_SPECS[match];

  // Default to shoulder raise
  return POSE_SPECS['shoulder_raise'];
}
