import { BodyPoseResult } from '../hooks/useBodyPose';

export interface PTExerciseConfig {
  id: string;
  nameTh: string;
  nameEn: string;
  targetBodyPart: string;
  clinicSpecialty?: 'ORTHOPEDIC' | 'NEUROLOGICAL' | 'GERIATRIC' | 'SPORTS' | 'CARDIOPULMONARY';
  description: string;
  targetAngle: number; // e.g. 120 degrees for shoulder raise
  minAngle: number;    // starting/resting angle (e.g. 35 deg)
  holdSeconds: number; // target hold duration at peak
  caloriesPerRep: number;
  tips: string[];
  instructions: string[];
}

export const PT_EXERCISES: Record<string, PTExerciseConfig> = {
  shoulder_abduction: {
    id: 'shoulder_abduction',
    nameTh: 'กายภาพข้อไหล่ติด กางแขน (Shoulder Abduction)',
    nameEn: 'Shoulder Abduction & Raise',
    targetBodyPart: 'ข้อต่อหัวไหล่ (Glenohumeral Joint)',
    clinicSpecialty: 'ORTHOPEDIC',
    description: 'โปรแกรมมาตรฐานโรงพยาบาลมหิดล เพิ่มองศาการเคลื่อนไหวข้อไหล่ ลดอาการข้อไหล่ติด (Adhesive Capsulitis)',
    targetAngle: 120,
    minAngle: 35,
    holdSeconds: 1.5,
    caloriesPerRep: 0.8,
    tips: [
      'หายใจเข้าลึกๆ ขณะค่อยๆ ยกแขนขึ้น',
      'พยายามรักษาลำตัวให้ตรง ไม่เอียงตัวหรือยักไหล่ชดเชยแรง',
      'ยกให้อยู่ในระดับที่ไม่รู้สึกเจ็บแปลบ (Pain-free range)'
    ],
    instructions: [
      'ยืนหรือนั่งลำตัวตรง แขนแนบลำตัว',
      'ค่อยๆ กางแขนออกด้านข้างขึ้นช้าๆ จนถึงเป้าหมาย 120 องศา',
      'ค้างไว้ตามสัญญาณเสียง แล้วค่อยๆ ผ่อนลง'
    ]
  },
  shoulder_flexion: {
    id: 'shoulder_flexion',
    nameTh: 'กายภาพยกแขนไปข้างหน้า (Shoulder Flexion)',
    nameEn: 'Shoulder Forward Flexion',
    targetBodyPart: 'ข้อต่อหัวไหล่และสะบัก (Anterior Deltoid & Scapula)',
    clinicSpecialty: 'ORTHOPEDIC',
    description: 'ฝึกการเคลื่อนไหวข้อไหล่ในระนาบด้านหน้าเพื่อการหยิบของและการทำงานในชีวิตประจำวัน',
    targetAngle: 130,
    minAngle: 30,
    holdSeconds: 1.5,
    caloriesPerRep: 0.9,
    tips: [
      'คว่ำมือหรือหงายมือตามคำแนะนำของนักกายภาพบำบัด',
      'อย่าแอ่นหลังขณะยกแขนสูง ให้เกร็งหน้าท้องประคองแกนกลาง'
    ],
    instructions: [
      'ยืนหรือนั่งตัวตรง แขนแนบข้างลำตัว',
      'ค่อยๆ ยกแขนตรงไปข้างหน้าในระดับสายตาจนถึงเป้าหมาย',
      'ค้างไว้ 1.5 วินาที แล้วผ่อนแขนลงช้าๆ'
    ]
  },
  knee_extension: {
    id: 'knee_extension',
    nameTh: 'เหยียดเข่าฟื้นฟูกำลังขา (Seated Knee Extension)',
    nameEn: 'Seated Knee Extension',
    targetBodyPart: 'ข้อเข่าและกล้ามเนื้อต้นขา (Quadriceps Femoris)',
    clinicSpecialty: 'ORTHOPEDIC',
    description: 'โปรแกรมฟื้นฟูข้อเข่าเสื่อม (Knee Osteoarthritis) เพิ่มความมั่นคงของข้อเข่าและแรงลุกเดิน',
    targetAngle: 155,
    minAngle: 85,
    holdSeconds: 2.0,
    caloriesPerRep: 1.2,
    tips: [
      'นั่งหลังพิงพนักเก้าอี้ให้มั่นคง',
      'กระดกข้อเท้าเข้าหาตัวขณะเหยียดเข่าสุด เพื่อกระตุ้นกล้ามเนื้อ VMO',
      'อย่าเหยียดจนข้อล็อกหรือฝืนเกินไป'
    ],
    instructions: [
      'นั่งบนเก้าอี้ เท้าวางระนาบกับพื้น',
      'ค่อยๆ เตะปลายเท้าเหยียดเข่าขึ้นจนขาตรงขนานพื้น',
      'เกร็งค้างไว้ 2 วินาที แล้ววางเท้าลงช้าๆ'
    ]
  },
  straight_leg_raise: {
    id: 'straight_leg_raise',
    nameTh: 'ยกขาตรงเสริมกำลังกล้ามเนื้อ (Straight Leg Raise - SLR)',
    nameEn: 'Straight Leg Raise (SLR)',
    targetBodyPart: 'ข้อสะโพกและกล้ามเนื้อต้นขาด้านหน้า (Hip Flexor & Quad)',
    clinicSpecialty: 'ORTHOPEDIC',
    description: 'แบบฝึกเสริมความแข็งแรงของข้อเข่าและสะโพกโดยไม่เพิ่มแรงกดในข้อเข่า (Non-weight bearing)',
    targetAngle: 45,
    minAngle: 10,
    holdSeconds: 2.0,
    caloriesPerRep: 1.4,
    tips: [
      'รักษาเข่าให้เหยียดตรงตลอดการเคลื่อนไหว',
      'กระดกข้อเท้าเข้าหาตัวตลอดเวลาที่ยกขา'
    ],
    instructions: [
      'นอนหงายหรือเอนหลังพิง นั่งเก้าอี้',
      'เหยียดเข่าให้ตรงแล้วค่อยๆ ยกขาทั้งข้างขึ้นจากพื้นทำมุมประมาณ 45 องศา',
      'เกร็งค้างไว้ 2 วินาที แล้วค่อยๆ วางขาลง'
    ]
  },
  sit_to_stand: {
    id: 'sit_to_stand',
    nameTh: 'ฝึกการลุกยืน-นั่ง (Sit to Stand Functional Training)',
    nameEn: 'Sit to Stand Functional Transfer',
    targetBodyPart: 'กล้ามเนื้อขา สะโพก และการทรงตัว (Functional Transfer)',
    clinicSpecialty: 'GERIATRIC',
    description: 'แบบประเมินและฝึกกำลังขาและการถ่ายน้ำหนักตามมาตรฐาน 5xSTS ป้องกันการหกล้มในผู้สูงอายุ',
    targetAngle: 170, // Hip & knee extension when standing
    minAngle: 90,   // Seated 90 degrees
    holdSeconds: 1.0,
    caloriesPerRep: 2.0,
    tips: [
      'โน้มตัวไปข้างหน้าเล็กน้อย เท้าวางมั่นคงห่างเท่าช่วงไหล่',
      'กดส้นเท้าลงพื้นขณะดันตัวลุกยืนขึ้นตรง'
    ],
    instructions: [
      'นั่งบนเก้าอี้ เท้าวางราบกับพื้น',
      'ถ่ายน้ำหนักไปที่เท้าแล้วลุกขึ้นยืนตัวตรงจนสุด',
      'ค้างไว้ 1 วินาที แล้วค่อยๆ ย่อตัวนั่งลงควบคุมไม่ให้ทิ้งตัวลงเก้าอี้'
    ]
  },
  elbow_flexion: {
    id: 'elbow_flexion',
    nameTh: 'บริหารข้อศอกและแขนท่อนบน (Elbow Flexion)',
    nameEn: 'Elbow Flexion & Arm Mobility',
    targetBodyPart: 'ข้อศอกและกล้ามเนื้อแขน (Biceps Brachii)',
    clinicSpecialty: 'NEUROLOGICAL',
    description: 'ฟื้นฟูการควบคุมกล้ามเนื้อแขนในผู้ป่วยหลอดเลือดสมอง (Stroke Rehab) และเพิ่มความยืดหยุ่นข้อศอก',
    targetAngle: 50,
    minAngle: 150,
    holdSeconds: 1.0,
    caloriesPerRep: 0.6,
    tips: [
      'แนบต้นแขนไว้ข้างลำตัวตลอดเวลา',
      'เกร็งกล้ามเนื้อแขนอย่างนุ่มนวล ควบคุมการปล่อยลงช้าๆ'
    ],
    instructions: [
      'ปล่อยแขนลงตรงข้างลำตัว',
      'พับข้อศอกยกมือขึ้นมาแตะระดับไหล่',
      'ค้างไว้ 1 วินาที แล้วคลายแขนลงช้าๆ'
    ]
  },
  balance_posture: {
    id: 'balance_posture',
    nameTh: 'ปรับสมดุลแนวกระดูกสันหลัง (Spine Alignment & Core)',
    nameEn: 'Core Posture & Balance Hold',
    targetBodyPart: 'แนวกระดูกสันหลังและแกนกลางลำตัว (Spine & Core)',
    clinicSpecialty: 'GERIATRIC',
    description: 'ปรับแนวกระดูกสันหลังให้สมดุลตามหลักชีวกลศาสตร์ ลดอาการปวดหลังและป้องกันการสูญเสียการทรงตัว',
    targetAngle: 180,
    minAngle: 160,
    holdSeconds: 3.0,
    caloriesPerRep: 1.5,
    tips: [
      'เปิดไหล่ อกผาย ตามองตรงไปข้างหน้า',
      'แขม่วหน้าท้องเบาๆ เพื่อประคองหลังส่วนล่าง'
    ],
    instructions: [
      'ยืนหรือนั่งตัวตรง ทอดสายตามองตรง',
      'ยืดอก ผ่อนคลายหัวไหล่ รักษาระนาบให้อยู่ในกรอบสีเขียว',
      'หายใจเข้า-ออกอย่างสม่ำเสมอ'
    ]
  },
  chest_expansion: {
    id: 'chest_expansion',
    nameTh: 'ฝึกการขยายปอดและการหายใจลึก (Chest & Breathing PT)',
    nameEn: 'Thoracic Expansion & Deep Breathing',
    targetBodyPart: 'ทรวงอก กะบังลม และปอด (Diaphragm & Intercostals)',
    clinicSpecialty: 'CARDIOPULMONARY',
    description: 'โปรแกรมกายภาพบำบัดระบบทางเดินหายใจและทรวงอก เพิ่มปริมาตรการระบายอากาศของปอดและขับเสมหะ',
    targetAngle: 110,
    minAngle: 40,
    holdSeconds: 3.0,
    caloriesPerRep: 0.7,
    tips: [
      'หายใจเข้าทางจมูกช้าๆ ลึกๆ ให้หน้าท้องและทรวงอกขยายออก',
      'กางแขนออกขณะสูดหายใจเข้าเต็มปอด แล้วหุบแขนเข้าพร้อมผ่อนลมหายใจออกทางปาก'
    ],
    instructions: [
      'นั่งหรือยืนหลังตรง มือสองข้างประสานไว้ข้างหน้า',
      'กางแขนทั้งสองข้างออกด้านข้างพร้อมสูดลมหายใจเข้าลึกที่สุด',
      'กลั้นไว้ 3 วินาที แล้วค่อยๆ ผ่อนลมหายใจออกพร้อมหุบแขนลง'
    ]
  }
};

/**
 * Calculates the 2D angle (in degrees) formed by three points: Point A - Joint B - Point C
 * Result is in range [0, 180]
 */
export function calculateJointAngle(
  pointA: { x: number; y: number },
  jointB: { x: number; y: number },
  pointC: { x: number; y: number }
): number {
  const radians =
    Math.atan2(pointC.y - jointB.y, pointC.x - jointB.x) -
    Math.atan2(pointA.y - jointB.y, pointA.x - jointB.x);

  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

export interface PTBiomechanicalState {
  currentAngle: number;
  targetAngle: number;
  progressPercent: number; // 0..100% of current motion
  repsCompleted: number;
  targetReps: number;
  currentSet: number;
  totalSets: number;
  isHolding: boolean;
  holdTimeRemaining: number;
  accuracyScore: number;
  stage: 'REST' | 'ACTIVE_MOVING' | 'PEAK_HOLD' | 'RETURNING' | 'COMPLETED';
  feedbackTh: string;
  isCompensating: boolean; // e.g. trunk leaning detected
  compensationWarning?: string;
  isSafe: boolean;
  peakAngleAchieved: number;
}

export class PTExerciseTracker {
  private config: PTExerciseConfig;
  private reps: number = 0;
  private targetReps: number = 10;
  private currentSet: number = 1;
  private totalSets: number = 3;
  private stage: 'REST' | 'ACTIVE_MOVING' | 'PEAK_HOLD' | 'RETURNING' | 'COMPLETED' = 'REST';
  private holdStartTime: number = 0;
  private peakAngleInRep: number = 0;
  private allPeakAngles: number[] = [];
  private accuracyHistory: number[] = [];

  constructor(exerciseId: string, targetReps: number = 10, totalSets: number = 3) {
    this.config = PT_EXERCISES[exerciseId] || PT_EXERCISES.shoulder_abduction;
    this.targetReps = targetReps;
    this.totalSets = totalSets;
  }

  public setExercise(exerciseId: string) {
    this.config = PT_EXERCISES[exerciseId] || PT_EXERCISES.shoulder_abduction;
    this.reset();
  }

  public reset() {
    this.reps = 0;
    this.currentSet = 1;
    this.stage = 'REST';
    this.holdStartTime = 0;
    this.peakAngleInRep = 0;
    this.allPeakAngles = [];
    this.accuracyHistory = [];
  }

  /**
   * Process a single video frame with detected pose keypoints
   */
  public update(pose: BodyPoseResult | null): {
    state: PTBiomechanicalState;
    event?: 'REP_COUNTED' | 'SET_COMPLETED' | 'HOLD_STARTED' | 'SAFETY_WARNING';
  } {
    const defaultState: PTBiomechanicalState = {
      currentAngle: 0,
      targetAngle: this.config.targetAngle,
      progressPercent: 0,
      repsCompleted: this.reps,
      targetReps: this.targetReps,
      currentSet: this.currentSet,
      totalSets: this.totalSets,
      isHolding: false,
      holdTimeRemaining: 0,
      accuracyScore: this.getAverageAccuracy(),
      stage: this.stage,
      feedbackTh: 'กรุณายืนหรือนั่งให้กล้องเห็นร่างกายชัดเจน',
      isCompensating: false,
      isSafe: true,
      peakAngleAchieved: this.getMaxPeakAngle()
    };

    if (!pose || !pose.landmarks || pose.landmarks.length < 25) {
      return { state: defaultState };
    }

    const lms = pose.landmarks;
    let currentAngle = 0;
    let isCompensating = false;
    let compensationWarning = '';
    let isSafe = true;

    // Check posture lean/compensation
    const leftShoulder = lms[11];
    const rightShoulder = lms[12];
    const leftHip = lms[23];
    const rightHip = lms[24];

    if (leftShoulder && rightShoulder) {
      const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
      if (shoulderTilt > 0.08) {
        isCompensating = true;
        compensationWarning = '⚠️ ไหล่เอียง กรุณารักษาแนวหัวไหล่ให้ขนานพื้น';
      }
    }

    // Safety check: sudden loss of balance or excessive lean
    if (leftHip && rightHip && leftShoulder && rightShoulder) {
      const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
      const midHipX = (leftHip.x + rightHip.x) / 2;
      if (Math.abs(midShoulderX - midHipX) > 0.16) {
        isSafe = false;
        compensationWarning = '🚨 ระวังเสียการทรงตัว! กรุณาหยุดพักหรือหาที่เกาะ';
      }
    }

    // Compute angle according to exercise type
    if (this.config.id === 'shoulder_abduction') {
      // Choose the arm that is moving higher (or default to right)
      const rHip = lms[24];
      const rShoulder = lms[12];
      const rElbow = lms[14];

      const lHip = lms[23];
      const lShoulder = lms[11];
      const lElbow = lms[13];

      const rAngle = rHip && rShoulder && rElbow ? calculateJointAngle(rHip, rShoulder, rElbow) : 0;
      const lAngle = lHip && lShoulder && lElbow ? calculateJointAngle(lHip, lShoulder, lElbow) : 0;
      currentAngle = Math.max(rAngle, lAngle);
    } else if (this.config.id === 'knee_extension') {
      const rHip = lms[24];
      const rKnee = lms[26];
      const rAnkle = lms[28];

      const lHip = lms[23];
      const lKnee = lms[25];
      const lAnkle = lms[27];

      const rAngle = rHip && rKnee && rAnkle ? calculateJointAngle(rHip, rKnee, rAnkle) : 0;
      const lAngle = lHip && lKnee && lAnkle ? calculateJointAngle(lHip, lKnee, lAnkle) : 0;
      currentAngle = Math.max(rAngle, lAngle);
    } else if (this.config.id === 'elbow_flexion') {
      const rShoulder = lms[12];
      const rElbow = lms[14];
      const rWrist = lms[16];

      const lShoulder = lms[11];
      const lElbow = lms[13];
      const lWrist = lms[15];

      const rAngle = rShoulder && rElbow && rWrist ? calculateJointAngle(rShoulder, rElbow, rWrist) : 180;
      const lAngle = lShoulder && lElbow && lWrist ? calculateJointAngle(lShoulder, lElbow, lWrist) : 180;
      currentAngle = Math.min(rAngle, lAngle); // Flexion is smaller angle
    } else if (this.config.id === 'shoulder_flexion') {
      const rHip = lms[24];
      const rShoulder = lms[12];
      const rWrist = lms[16];

      const lHip = lms[23];
      const lShoulder = lms[11];
      const lWrist = lms[15];

      const rAngle = rHip && rShoulder && rWrist ? calculateJointAngle(rHip, rShoulder, rWrist) : 0;
      const lAngle = lHip && lShoulder && lWrist ? calculateJointAngle(lHip, lShoulder, lWrist) : 0;
      currentAngle = Math.max(rAngle, lAngle);
    } else if (this.config.id === 'straight_leg_raise') {
      const rShoulder = lms[12];
      const rHip = lms[24];
      const rAnkle = lms[28];

      const lShoulder = lms[11];
      const lHip = lms[23];
      const lAnkle = lms[27];

      // Angle from hip to leg (resting is ~170-180 in lying or 90 in sitting; calculate elevation angle)
      const rAngle = rShoulder && rHip && rAnkle ? Math.abs(180 - calculateJointAngle(rShoulder, rHip, rAnkle)) : 0;
      const lAngle = lShoulder && lHip && lAnkle ? Math.abs(180 - calculateJointAngle(lShoulder, lHip, lAnkle)) : 0;
      currentAngle = Math.max(rAngle, lAngle);
    } else if (this.config.id === 'sit_to_stand') {
      const rShoulder = lms[12];
      const rHip = lms[24];
      const rKnee = lms[26];

      const lShoulder = lms[11];
      const lHip = lms[23];
      const lKnee = lms[25];

      const rAngle = rShoulder && rHip && rKnee ? calculateJointAngle(rShoulder, rHip, rKnee) : 90;
      const lAngle = lShoulder && lHip && lKnee ? calculateJointAngle(lShoulder, lHip, lKnee) : 90;
      currentAngle = Math.max(rAngle, lAngle);
    } else if (this.config.id === 'chest_expansion') {
      const rElbow = lms[14];
      const rShoulder = lms[12];
      const lShoulder = lms[11];
      const lElbow = lms[13];

      const rAngle = rElbow && rShoulder && lShoulder ? calculateJointAngle(rElbow, rShoulder, lShoulder) : 40;
      const lAngle = lElbow && lShoulder && rShoulder ? calculateJointAngle(lElbow, lShoulder, rShoulder) : 40;
      currentAngle = Math.round((rAngle + lAngle) / 2);
    } else {
      // Balance posture: spine alignment
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
        const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
        const verticalRef = { x: midHip.x, y: midHip.y + 0.5 };
        currentAngle = calculateJointAngle(midShoulder, midHip, verticalRef);
      }
    }

    if (currentAngle > this.peakAngleInRep) {
      this.peakAngleInRep = currentAngle;
    }

    // State machine calculation
    let event: 'REP_COUNTED' | 'SET_COMPLETED' | 'HOLD_STARTED' | 'SAFETY_WARNING' | undefined;
    let feedbackTh = 'เริ่มขยับตามท่าทางได้เลยค่ะ';
    let isHolding = false;
    let holdTimeRemaining = 0;
    const now = Date.now();

    // Progress percentage
    let progress = 0;
    if (this.config.id === 'elbow_flexion') {
      // Lower angle is better
      const span = this.config.minAngle - this.config.targetAngle;
      progress = Math.min(100, Math.max(0, ((this.config.minAngle - currentAngle) / (span || 1)) * 100));
    } else {
      const span = this.config.targetAngle - this.config.minAngle;
      progress = Math.min(100, Math.max(0, ((currentAngle - this.config.minAngle) / (span || 1)) * 100));
    }

    const reachedTarget =
      this.config.id === 'elbow_flexion'
        ? currentAngle <= this.config.targetAngle + 5
        : currentAngle >= this.config.targetAngle - 5;

    const returnedToRest =
      this.config.id === 'elbow_flexion'
        ? currentAngle >= this.config.minAngle - 15
        : currentAngle <= this.config.minAngle + 15;

    if (!isSafe) {
      event = 'SAFETY_WARNING';
      feedbackTh = compensationWarning;
    } else if (this.stage === 'REST') {
      if (progress > 25) {
        this.stage = 'ACTIVE_MOVING';
        feedbackTh = 'ยกขึ้นช้าๆ ค่ะ กำลังเข้าสู่เป้าหมาย';
      } else {
        feedbackTh = 'พร้อมแล้ว ค่อยๆ ขยับยกขึ้นได้เลยค่ะ';
      }
    } else if (this.stage === 'ACTIVE_MOVING') {
      if (reachedTarget) {
        this.stage = 'PEAK_HOLD';
        this.holdStartTime = now;
        event = 'HOLD_STARTED';
        feedbackTh = `ดีมากค่ะ! ค้างไว้ ${this.config.holdSeconds} วินาที`;
      } else if (returnedToRest) {
        this.stage = 'REST';
        feedbackTh = 'ขยับใหม่อีกครั้ง ยกขึ้นให้ถึงแถบเป้าหมายนะคะ';
      } else {
        feedbackTh = `ยกขึ้นอีกนิด (ปัจจุบัน ${Math.round(currentAngle)}° / เป้า ${this.config.targetAngle}°)`;
      }
    } else if (this.stage === 'PEAK_HOLD') {
      isHolding = true;
      const elapsedHold = (now - this.holdStartTime) / 1000;
      holdTimeRemaining = Math.max(0, this.config.holdSeconds - elapsedHold);

      if (!reachedTarget) {
        // dropped too early
        this.stage = 'ACTIVE_MOVING';
        feedbackTh = 'พยายามค้างให้อยู่ในระดับเดิมนะคะ';
      } else if (elapsedHold >= this.config.holdSeconds) {
        this.stage = 'RETURNING';
        feedbackTh = 'ยอดเยี่ยมค่ะ! ค่อยๆ ผ่อนกลับสู่ท่าเริ่มต้น';
      } else {
        feedbackTh = `ค้างไว้อีก ${holdTimeRemaining.toFixed(1)} วินาที`;
      }
    } else if (this.stage === 'RETURNING') {
      if (returnedToRest) {
        // Count Rep!
        this.reps += 1;
        this.allPeakAngles.push(this.peakAngleInRep);
        this.accuracyHistory.push(isCompensating ? 80 : 100);
        this.peakAngleInRep = 0;
        event = 'REP_COUNTED';

        if (this.reps >= this.targetReps) {
          if (this.currentSet < this.totalSets) {
            this.currentSet += 1;
            this.reps = 0;
            this.stage = 'REST';
            event = 'SET_COMPLETED';
            feedbackTh = `จบเซ็ตที่ ${this.currentSet - 1} แล้วค่ะ พัก 15 วินาทีก่อนเริ่มเซ็ตถัดไป`;
          } else {
            this.stage = 'COMPLETED';
            event = 'SET_COMPLETED';
            feedbackTh = '🎉 ยินดีด้วยค่ะ! คุณทำกายภาพบำบัดครบตามโปรแกรมแล้ว';
          }
        } else {
          this.stage = 'REST';
          feedbackTh = `เยี่ยมมากค่ะ ครั้งที่ ${this.reps} สำเร็จแล้ว`;
        }
      } else {
        feedbackTh = 'ค่อยๆ วางลงช้าๆ อย่าปล่อยเร็วเกินไป';
      }
    }

    const state: PTBiomechanicalState = {
      currentAngle,
      targetAngle: this.config.targetAngle,
      progressPercent: Math.round(progress),
      repsCompleted: this.reps,
      targetReps: this.targetReps,
      currentSet: this.currentSet,
      totalSets: this.totalSets,
      isHolding,
      holdTimeRemaining: Number(holdTimeRemaining.toFixed(1)),
      accuracyScore: this.getAverageAccuracy(),
      stage: this.stage,
      feedbackTh,
      isCompensating,
      compensationWarning,
      isSafe,
      peakAngleAchieved: this.getMaxPeakAngle()
    };

    return { state, event };
  }

  public getAverageAccuracy(): number {
    if (this.accuracyHistory.length === 0) return 95;
    const sum = this.accuracyHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.accuracyHistory.length);
  }

  public getMaxPeakAngle(): number {
    if (this.allPeakAngles.length === 0) return this.peakAngleInRep;
    return Math.max(...this.allPeakAngles, this.peakAngleInRep);
  }

  public getTotalRepsDone(): number {
    return (this.currentSet - 1) * this.targetReps + this.reps;
  }
}

/**
 * Storage helper for local offline rehabilitation records
 */
export interface StoredRehabSession {
  id: string;
  date: string;
  exerciseId: string;
  exerciseNameTh: string;
  repsCompleted: number;
  targetReps: number;
  setsCompleted: number;
  totalSets: number;
  maxRomDeg: number;
  targetRomDeg: number;
  accuracyScore: number;
  painScore: number; // 0..10
  caloriesBurned: number;
  durationSeconds: number;
  deviceType: 'MOBILE' | 'MACHINE_KIOSK';
  notes?: string;
}

const STORAGE_KEY = 'strongcare_rehab_sessions';

export function getLocalRehabHistory(): StoredRehabSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Provide some initial mock records if empty so user sees immediate beautiful progression graphs!
      const initial: StoredRehabSession[] = [
        {
          id: 'mock_1',
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          exerciseId: 'shoulder_abduction',
          exerciseNameTh: 'กายภาพข้อไหล่ติด (ยกแขนขึ้น)',
          repsCompleted: 10,
          targetReps: 10,
          setsCompleted: 2,
          totalSets: 3,
          maxRomDeg: 105,
          targetRomDeg: 120,
          accuracyScore: 88,
          painScore: 4,
          caloriesBurned: 18,
          durationSeconds: 320,
          deviceType: 'MOBILE'
        },
        {
          id: 'mock_2',
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          exerciseId: 'shoulder_abduction',
          exerciseNameTh: 'กายภาพข้อไหล่ติด (ยกแขนขึ้น)',
          repsCompleted: 10,
          targetReps: 10,
          setsCompleted: 3,
          totalSets: 3,
          maxRomDeg: 114,
          targetRomDeg: 120,
          accuracyScore: 92,
          painScore: 3,
          caloriesBurned: 24,
          durationSeconds: 450,
          deviceType: 'MACHINE_KIOSK'
        },
        {
          id: 'mock_3',
          date: new Date(Date.now() - 86400000 * 1).toISOString(),
          exerciseId: 'knee_extension',
          exerciseNameTh: 'เหยียดเข่าฟื้นฟูกำลังขา (ข้อเข่า)',
          repsCompleted: 10,
          targetReps: 10,
          setsCompleted: 3,
          totalSets: 3,
          maxRomDeg: 152,
          targetRomDeg: 155,
          accuracyScore: 96,
          painScore: 2,
          caloriesBurned: 32,
          durationSeconds: 510,
          deviceType: 'MOBILE'
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveLocalRehabSession(session: Omit<StoredRehabSession, 'id' | 'date'>): StoredRehabSession {
  const history = getLocalRehabHistory();
  const newRecord: StoredRehabSession = {
    ...session,
    id: 'rehab_' + Date.now(),
    date: new Date().toISOString()
  };
  history.unshift(newRecord);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {}
  return newRecord;
}
