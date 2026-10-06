import { ExerciseDefinition } from '../types/exercise';

export interface ExerciseConfigModel extends ExerciseDefinition {
  safeCutoff: number;
  tolerance: number;
  holdDuration: number;
  requiredLandmarks: string[];
  movementPattern: string;
  category: string;
  safetyRules?: Array<{
    type: string;
    threshold: number;
    message: string;
    severity: string;
  }>;
}

export const EXERCISE_CONFIGS: ExerciseConfigModel[] = [
  {
    id: 1,
    name: 'Shoulder Raise (กางแขนยกด้านข้าง)',
    slug: 'shoulder-raise',
    category: 'Upper Body',
    description: 'กางแขนยกขึ้นด้านข้างระดับไหล่ ช่วยเพิ่มช่วงการเคลื่อนไหวข้อไหล่และความแข็งแรงของกล้ามเนื้อเดลทอยด์',
    target_joint: 'Right Shoulder',
    target_angle: 120,
    min_angle: 20,
    max_angle: 130,
    safeCutoff: 140,
    tolerance: 10,
    target_reps: 10,
    holdDuration: 2,
    difficulty: 'beginner',
    instructions: 'ยืนหรือนั่งหลังตรง กางแขนออกด้านข้างช้าๆ จนถึงระดับไหล่ (ประมาณ 120 องศา) ค้างไว้ 2 วินาที แล้วค่อยๆ ลดแขนลง',
    requiredLandmarks: ['RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST', 'RIGHT_HIP'],
    movementPattern: 'Shoulder Abduction',
    safetyRules: [
      { type: 'OVER_ROM', threshold: 140, message: 'ห้ามยกแขนสูงเกิน 140° เพื่อป้องกันการเสียดสีของข้อต่อ', severity: 'CRITICAL_STOP' },
      { type: 'TRUNK_LEAN', threshold: 18, message: 'ลำตัวเอียงเกินไป กรุณาทรงตัวให้ตรง', severity: 'CAUTION' },
      { type: 'SHOULDER_HIKE', threshold: 15, message: 'อย่าเกร็งยกสะบักขึ้นขณะยกแขน', severity: 'CAUTION' },
    ],
  },
  {
    id: 2,
    name: 'Elbow Flexion (งอข้อศอก)',
    slug: 'elbow-flexion',
    category: 'Upper Body',
    description: 'พับงอข้อศอกขึ้นและเหยียดตรง ช่วยฟื้นฟูกำลังแขนท่อนบนและข้อศอก',
    target_joint: 'Right Elbow',
    target_angle: 140,
    min_angle: 30,
    max_angle: 150,
    safeCutoff: 160,
    tolerance: 10,
    target_reps: 10,
    holdDuration: 1,
    difficulty: 'beginner',
    instructions: 'แนบข้อศอกชิดลำตัว งอข้อศอกยกมือขึ้นช้าๆ ค้างไว้ 1 วินาที แล้วคลายลงสุด',
    requiredLandmarks: ['RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'],
    movementPattern: 'Elbow Flexion/Extension',
    safetyRules: [
      { type: 'OVER_ROM', threshold: 160, message: 'อย่ายัดข้อศอกตึงเกินไป', severity: 'CAUTION' },
      { type: 'TRUNK_LEAN', threshold: 18, message: 'อย่าโยกตัวเพื่อช่วยยก', severity: 'CAUTION' },
    ],
  },
  {
    id: 3,
    name: 'Knee Extension (เหยียดเข่าขณะนั่ง)',
    slug: 'knee-extension',
    category: 'Lower Body',
    description: 'นั่งบนเก้าอี้แล้วเหยียดเข่าตรงไปข้างหน้า ช่วยเพิ่มกำลังกล้ามเนื้อต้นขาด้านหน้า (Quadriceps)',
    target_joint: 'Right Knee',
    target_angle: 160,
    min_angle: 80,
    max_angle: 175,
    safeCutoff: 180,
    tolerance: 10,
    target_reps: 10,
    holdDuration: 2,
    difficulty: 'beginner',
    instructions: 'นั่งเก้าอี้หลังพิงพนัก เท้าแตะพื้น ค่อยๆ เตะขาเหยียดตรงขนานพื้น ค้างไว้ 2 วินาที แล้ววางลงช้าๆ',
    requiredLandmarks: ['RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'],
    movementPattern: 'Knee Extension',
    safetyRules: [
      { type: 'OVER_ROM', threshold: 182, message: 'อย่าล็อคเข่าแอ่นไปข้างหลัง (Hyperextension)', severity: 'CRITICAL_STOP' },
      { type: 'TRUNK_LEAN', threshold: 22, message: 'พยายามนั่งหลังตรง อย่าเอนตัวไปข้างหลังมากเกินไป', severity: 'CAUTION' },
    ],
  },
  {
    id: 4,
    name: 'Chair Squat (ลุกนั่งเก้าอี้)',
    slug: 'squat',
    category: 'Lower Body',
    description: 'ฝึกการลุกและนั่งลงบนเก้าอี้อย่างถูกวิธี เพื่อเพิ่มกำลังขาและการทรงตัวสำหรับผู้สูงอายุ',
    target_joint: 'Hip & Knee',
    target_angle: 90,
    min_angle: 70,
    max_angle: 110,
    safeCutoff: 125,
    tolerance: 10,
    target_reps: 8,
    holdDuration: 2,
    difficulty: 'intermediate',
    instructions: 'ยืนหน้าเก้าอี้ ย่อเข่าและสะโพกลงเหมือนจะนั่งจนแตะเบาะเก้าอี้เบาๆ ค้างไว้ 2 วินาที แล้วดันตัวยืนขึ้นตรง',
    requiredLandmarks: ['LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE', 'RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'],
    movementPattern: 'Hip & Knee Bi-articular Squat',
    safetyRules: [
      { type: 'OVER_ROM', threshold: 65, message: 'อย่าย่อต่ำเกินไป อาจทำให้เข่ารับแรงกดสูง', severity: 'CAUTION' },
      { type: 'TRUNK_LEAN', threshold: 30, message: 'ก้มตัวไปข้างหน้ามากเกินไป ระวังล้ม', severity: 'CRITICAL_STOP' },
    ],
  },
  {
    id: 5,
    name: 'Lateral Trunk Tilt (เอียงลำตัวทรงตัว)',
    slug: 'trunk-tilt',
    category: 'Core & Balance',
    description: 'เอียงลำตัวด้านข้างอย่างควบคุม ช่วยฝึกความยืดหยุ่นของกระดูกสันหลังและกล้ามเนื้อแกนกลางลำตัว',
    target_joint: 'Torso Lateral',
    target_angle: 25,
    min_angle: 10,
    max_angle: 30,
    safeCutoff: 35,
    tolerance: 5,
    target_reps: 8,
    holdDuration: 2,
    difficulty: 'intermediate',
    instructions: 'ยืนตรง มือแตะสะโพก เอียงลำตัวไปทางขวาช้าๆ ค้างไว้ 2 วินาที แล้วกลับสู่ท่ายืนตรง',
    requiredLandmarks: ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_HIP', 'RIGHT_HIP'],
    movementPattern: 'Lateral Spine Flexion',
    safetyRules: [
      { type: 'OVER_ROM', threshold: 35, message: 'ห้ามเอียงลำตัวเกิน 35° เพื่อความปลอดภัยของหมอนรองกระดูก', severity: 'CRITICAL_STOP' },
    ],
  },
];
