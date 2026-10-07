import { asset } from '../utils/asset';
/**
 * Strong Care - 11 Stretch Rehabilitation Exercises Dataset & Exercise Configurations
 * 
 * หมายเหตุทางคลินิก:
 * "เนื้อหาท่าเป็นร่างต้นแบบ รอนักกายภาพตรวจสอบก่อนใช้กับผู้ป่วยจริง"
 * 
 * ทุกท่า: ระดับความยาก 1–2, ค้างท่าตามที่ระบุ, ท่าที่มีสองด้านให้ทำซ้าย-ขวา
 * ค่าตรวจจับท่า (scoring): landmark/มุมข้อต่อหลักของ MediaPipe Pose + ค่ามุมเป้าหมาย + ค่าคลาดเคลื่อนที่ยอมรับได้
 */

export interface StretchPoseScoring {
  primaryJoint: string; // e.g. 'neck', 'shoulder', 'elbow', 'spine', 'hip', 'knee', 'ankle'
  targetAngleDeg: number;
  toleranceDeg: number;
  landmarksUsed: number[]; // MediaPipe Landmark indices
  description: string;
}

export type StretchSideType = 'bilateral' | 'single' | 'both_sides';

export interface StretchExerciseItem {
  id: string;
  number: number;
  name: string; // ชื่อภาษาไทย
  englishName: string; // ชื่อภาษาอังกฤษ
  type: 'stretch';
  bodyArea: string; // บริเวณร่างกาย
  preparation: string; // ท่าเตรียม (ยืน/นั่ง/ใช้ผนัง-เก้าอี้)
  description: string; // คำอธิบาย 1 บรรทัด (แสดงในรายการ)
  steps: string[]; // ขั้นตอน 3–4 ข้อ (ภาษาง่ายๆ เหมาะผู้สูงอายุ)
  holdSeconds: number; // เวลาค้าง (วินาที)
  sets: number; // จำนวนเซ็ต
  sides: StretchSideType; // 'both_sides' = ซ้าย+ขวา, 'bilateral' = สองข้างพร้อมกัน, 'single' = กึ่งกลาง
  caution: string; // ข้อควรระวัง 1 ข้อ (สั้นและปลอดภัย)
  safetyTips: string[]; // ข้อแนะนำความปลอดภัย 2-3 ข้อ
  scoring: StretchPoseScoring; // ค่าตรวจจับท่า (scoring)
  svgType: string; // identifier for stick figure rendering
  videoStartSeconds: number; // วินาทีเริ่มต้นของท่านี้ในคลิป YouTube
  demoVideoUrl: string; // URL คลิปสาธิตท่านี้
  thumbnailUrl?: string; // ภาพตัวอย่างท่า
  targetPose: string; // Target pose identifier
  targetAngle: number; // Target Joint Angle
  targetRom: number; // Target Range of Motion
  recommendedReps: number; // Reps หรือจำนวนรอบ
  cooldownSeconds: number; // เวลาพักฟื้นตัวก่อนท่าถัดไป
}

/**
 * อ้างอิงโปรแกรมการฝึก:
 * "อยากแข็งแรง ไม่ปวด ไม่เมื่อย ต้องฝึกยืดกล้ามเนื้อทั้งตัว ผู้สูงอายุก็ทำได้"
 * โดย นพ. กฤติณห์ นิ่มศิริเรืองผล (หมอเฟม) จากช่อง หมอชวนฟิต DeDoctor
 * วิดีโอ: https://youtu.be/3vOTTj_X3kQ
 */
export const STRETCH_PROGRAM_METADATA = {
  title: 'อยากแข็งแรง ไม่ปวด ไม่เมื่อย ต้องฝึกยืดกล้ามเนื้อทั้งตัว (11 ท่า)',
  instructor: 'นพ. กฤติณห์ นิ่มศิริเรืองผล (หมอเฟม)',
  channel: 'หมอชวนฟิต DeDoctor',
  youtubeId: '3vOTTj_X3kQ',
  videoUrl: 'https://youtu.be/3vOTTj_X3kQ',
  minSecondsPerPose: 10,
  maxSecondsPerPose: 60,
  stepSeconds: 5,
};

/**
 * สร้าง URL สำหรับฝังวิดีโอ YouTube (Embed iframe) โดยเริ่มตามวินาทีที่ระบุ
 */
export function getStretchVideoEmbedUrl(startSeconds: number = 0, autoplay: boolean = true): string {
  const videoId = STRETCH_PROGRAM_METADATA.youtubeId;
  const autoParam = autoplay ? '1' : '0';
  return `https://www.youtube.com/embed/${videoId}?start=${startSeconds}&autoplay=${autoParam}&rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * สร้าง URL สำหรับเปิดดูใน YouTube ตามเวลาที่ระบุ
 */
export function getStretchVideoWatchUrl(startSeconds: number = 0): string {
  const videoId = STRETCH_PROGRAM_METADATA.youtubeId;
  return `https://youtu.be/${videoId}?t=${startSeconds}`;
}

// TODO: ตรวจสอบ videoStartSeconds ของ 11 ท่ายืดกับคลิปวิดีโอจริง (3vOTTj_X3kQ) อย่างละเอียดก่อนใช้งานจริง
export const STRETCH_EXERCISES: StretchExerciseItem[] = [
  {
    id: 'stretch_neck_lateral',
    number: 1,
    name: 'ยืดคอด้านข้าง',
    englishName: 'Lateral Neck Stretch',
    type: 'stretch',
    bodyArea: 'คอและบ่า',
    preparation: 'นั่งหรือยืนหลังตรง ผ่อนคลายไหล่ทั้งสองข้าง',
    description: 'เอียงศีรษะให้หูเข้าหาไหล่ช้าๆ ผ่อนคลายกล้ามเนื้อคอ',
    steps: [
      'นั่งหรือยืนตัวตรง มองตรงไปข้างหน้า',
      'ค่อยๆ เอียงศีรษะให้หูเข้าหาหัวไหล่ข้างหนึ่ง',
      'ค้างท่านิ่งไว้ หายใจเข้าออกสม่ำเสมอ',
      'สลับทำอีกข้างด้วยจังหวะเดียวกัน',
    ],
    holdSeconds: 20,
    sets: 1,
    sides: 'both_sides',
    caution: 'ยืดจนรู้สึกตึงสบาย ไม่เกร็งยกไหล่ตาม และไม่กดศีรษะแรง',
    safetyTips: [
      'ยืดจนรู้สึกตึงสบาย ไม่เกร็งยกไหล่ตาม และไม่กดศีรษะแรง',
      'หายใจเข้าออกสม่ำเสมอ ไม่กลั้นหายใจ',
      'หากมีอาการมึนศีรษะหรือชาให้หยุดทันที',
    ],
    scoring: {
      primaryJoint: 'neck',
      targetAngleDeg: 28,
      toleranceDeg: 8,
      landmarksUsed: [0, 11, 12],
      description: 'ตรวจจับมุมเอียงของศีรษะเทียบกับระนาบหัวไหล่',
    },
    svgType: 'neck_lateral',
    videoStartSeconds: 115, // 1:55
    demoVideoUrl: getStretchVideoEmbedUrl(115, false),
    thumbnailUrl: asset('images/poses/stretch_1.png'),
    targetPose: 'neck_lateral',
    targetAngle: 28,
    targetRom: 40,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_neck_flexion',
    number: 2,
    name: 'ยืดคอก้มหน้า',
    englishName: 'Neck Flexion Stretch',
    type: 'stretch',
    bodyArea: 'ต้นคอด้านหลัง',
    preparation: 'นั่งหรือยืนหลังตรง ไม่ห่อไหล่',
    description: 'ก้มคางเข้าหาหน้าอกช้าๆ ยืดกล้ามเนื้อท้ายทอย',
    steps: [
      'นั่งตัวตรง ปล่อยมือวางบนหน้าตักสบายๆ',
      'ค่อยๆ ก้มศีรษะ นำคางเข้าหาหน้าอกอย่างช้าๆ',
      'ค้างไว้ รู้สึกตึงสบายบริเวณท้ายทอยและคอด้านหลัง',
      'เงยศีรษะกลับสู่ท่าตรงอย่างนุ่มนวล',
    ],
    holdSeconds: 15,
    sets: 1,
    sides: 'single',
    caution: 'หยุดทันทีถ้าปวดแหลม ชา หรือมีอาการเวียนศีรษะ',
    safetyTips: [
      'หยุดทันทีถ้าปวดแหลม ชา หรือมีอาการเวียนศีรษะ',
      'ค่อยๆ ก้มและเงยอย่างนุ่มนวล ไม่กระตุกหรือสะบัดคอ',
    ],
    scoring: {
      primaryJoint: 'neck',
      targetAngleDeg: 35,
      toleranceDeg: 8,
      landmarksUsed: [0, 11, 12],
      description: 'ตรวจจับระยะการลดระดับคางลงสู่เส้นระดับไหล่',
    },
    svgType: 'neck_flexion',
    videoStartSeconds: 175, // 2:55
    demoVideoUrl: getStretchVideoEmbedUrl(175, false),
    thumbnailUrl: asset('images/poses/stretch_2.png'),
    targetPose: 'neck_flexion',
    targetAngle: 35,
    targetRom: 50,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_shoulder_cross',
    number: 3,
    name: 'ยืดไหล่ข้ามอก',
    englishName: 'Cross-Body Shoulder Stretch',
    type: 'stretch',
    bodyArea: 'หัวไหล่และสะบัก',
    preparation: 'ยืนหรือนั่งตัวตรง ไหล่ไม่ยกเกร็ง',
    description: 'ยกแขนข้างหนึ่งข้ามอก ใช้แขนอีกข้างกดประคองเบาๆ',
    steps: [
      'ยกแขนข้างหนึ่งพาดผ่านหน้าอกไปฝั่งตรงข้าม',
      'ใช้แขนอีกข้างหรือมือโอบประคองข้อศอกไว้เบาๆ',
      'ดึงแขนเข้าหาตัวจนรู้สึกตึงบริเวณหัวไหล่และสะบัก',
      'ค้างไว้แล้วค่อยๆ คลาย สลับทำอีกข้าง',
    ],
    holdSeconds: 20,
    sets: 1,
    sides: 'both_sides',
    caution: 'ยืดจนรู้สึกตึง ไม่ใช่เจ็บ และอย่าบิดลำตัวตามแขน',
    safetyTips: [
      'ยืดจนรู้สึกตึง ไม่ใช่เจ็บ และอย่าบิดลำตัวตามแขน',
      'ผ่อนคลายหัวไหล่ไม่ให้ยกเกร็งชิดใบหู',
    ],
    scoring: {
      primaryJoint: 'shoulder',
      targetAngleDeg: 40,
      toleranceDeg: 10,
      landmarksUsed: [11, 12, 13, 14, 15, 16],
      description: 'ตรวจจับข้อมือและข้อศอกที่ข้ามผ่านแนวกึ่งกลางอก',
    },
    svgType: 'shoulder_cross',
    videoStartSeconds: 225, // 3:45
    demoVideoUrl: getStretchVideoEmbedUrl(225, false),
    thumbnailUrl: asset('images/poses/stretch_3.png'),
    targetPose: 'shoulder_cross',
    targetAngle: 40,
    targetRom: 55,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_triceps_overhead',
    number: 4,
    name: 'ยืดต้นแขนด้านหลัง',
    englishName: 'Overhead Triceps Stretch',
    type: 'stretch',
    bodyArea: 'ต้นแขนและหลังแขน',
    preparation: 'นั่งหรือยืนหลังตรง ไม่แอ่นหลัง',
    description: 'ยกแขนขึ้นงอศอกหลังศีรษะ มืออีกข้างดันศอกเบาๆ',
    steps: [
      'ยกแขนข้างหนึ่งขึ้นเหนือศีรษะ แล้วงอศอกให้มือแตะหลังคอ',
      'ใช้มืออีกข้างช่วยประคองดันข้อศอกไปด้านหลังเบาๆ',
      'ยืดค้างไว้ รู้สึกตึงบริเวณต้นแขนด้านหลัง',
      'ค่อยๆ ลดแขนลง แล้วสลับทำอีกข้าง',
    ],
    holdSeconds: 20,
    sets: 1,
    sides: 'both_sides',
    caution: 'อย่ากดข้อศอกแรงเกินไป และรักษาศีรษะให้ตั้งตรงไม่ก้มต่ำ',
    safetyTips: [
      'อย่ากดข้อศอกแรงเกินไป และรักษาศีรษะให้ตั้งตรงไม่ก้มต่ำ',
      'หากมีอาการไหล่ติด ยกแขนเท่าที่สบาย ไม่ฝืนดันข้อต่อ',
    ],
    scoring: {
      primaryJoint: 'elbow',
      targetAngleDeg: 55,
      toleranceDeg: 10,
      landmarksUsed: [11, 12, 13, 14],
      description: 'ตรวจจับข้อศอกยกสูงกว่าระดับหูและงอข้อศอก',
    },
    svgType: 'triceps_overhead',
    videoStartSeconds: 280, // 4:40
    demoVideoUrl: getStretchVideoEmbedUrl(280, false),
    thumbnailUrl: asset('images/poses/stretch_4.png'),
    targetPose: 'triceps_overhead',
    targetAngle: 55,
    targetRom: 75,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_chest_open',
    number: 5,
    name: 'ยืดอก',
    englishName: 'Chest Opener Stretch',
    type: 'stretch',
    bodyArea: 'หน้าอกและหัวไหล่ด้านหน้า',
    preparation: 'ยืนเท้าห่างเท่าช่วงไหล่ หลังตรง',
    description: 'ประสานมือด้านหลัง ยืดแขนลง เปิดอกและดึงสะบักเข้าหากัน',
    steps: [
      'นำมือทั้งสองข้างไปประสานกันไว้ที่ด้านหลังสะโพก',
      'ค่อยๆ เหยียดแขนตรง พร้อมยืดอกและดึงหัวไหล่ไปด้านหลัง',
      'รู้สึกตึงสบายบริเวณหน้าอก ค้างท่านิ่งไว้ หายใจสม่ำเสมอ',
      'คลายมือออกอย่างช้าๆ กลับสู่ท่าสบาย',
    ],
    holdSeconds: 20,
    sets: 1,
    sides: 'bilateral',
    caution: 'ยืดเท่าที่ไหว ไม่ต้องยกแขนสูงเกินไปจนเจ็บไหล่หรือหลังแอ่น',
    safetyTips: [
      'ยืดเท่าที่ไหว ไม่ต้องยกแขนสูงเกินไปจนเจ็บไหล่หรือหลังแอ่น',
      'เปิดอกและดึงสะบักเข้าหากันเบาๆ โดยไม่เกร็งคอ',
    ],
    scoring: {
      primaryJoint: 'shoulder',
      targetAngleDeg: 30,
      toleranceDeg: 8,
      landmarksUsed: [11, 12, 15, 16, 23, 24],
      description: 'ตรวจจับสะบักหนีบเข้าหากันและข้อมืออยู่ด้านหลังสะโพก',
    },
    svgType: 'chest_open',
    videoStartSeconds: 335, // 5:35
    demoVideoUrl: getStretchVideoEmbedUrl(335, false),
    thumbnailUrl: asset('images/poses/stretch_5.png'),
    targetPose: 'chest_open',
    targetAngle: 30,
    targetRom: 45,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_side_bend',
    number: 6,
    name: 'ยืดข้างลำตัว',
    englishName: 'Standing Side Bend Stretch',
    type: 'stretch',
    bodyArea: 'ชายโครงและสีข้าง',
    preparation: 'ยืนแยกเท้ากว้างเท่าหัวไหล่ ลำตัวตรงมั่นคง',
    description: 'ยกแขนข้างหนึ่งเหนือศีรษะ เอียงลำตัวไปด้านตรงข้าม',
    steps: [
      'ยกแขนข้างหนึ่งชูขึ้นเหนือศีรษะ แขนอีกข้างปล่อยแนบข้างลำตัว',
      'ค่อยๆ เอียงลำตัวส่วนบนไปฝั่งตรงข้ามจนตึงสีข้าง',
      'ค้างไว้โดยไม่โน้มตัวมาด้านหน้าหรือด้านหลัง',
      'ดึงตัวกลับมาตรง แล้วสลับทำอีกข้าง',
    ],
    holdSeconds: 20,
    sets: 1,
    sides: 'both_sides',
    caution: 'จับเก้าอี้หรือผนังไว้ถ้าทรงตัวไม่มั่นคง และอย่าก้มหรือแอ่นตัว',
    safetyTips: [
      'จับเก้าอี้หรือผนังไว้ถ้าทรงตัวไม่มั่นคง และอย่าก้มหรือแอ่นตัว',
      'เอียงเฉพาะลำตัวช่วงบนในระนาบด้านข้างอย่างนุ่มนวล',
    ],
    scoring: {
      primaryJoint: 'spine',
      targetAngleDeg: 25,
      toleranceDeg: 8,
      landmarksUsed: [11, 12, 23, 24],
      description: 'ตรวจจับมุมเอียงของแกนกระดูกสันหลังด้านข้าง',
    },
    svgType: 'side_bend',
    videoStartSeconds: 390, // 6:30
    demoVideoUrl: getStretchVideoEmbedUrl(390, false),
    thumbnailUrl: asset('images/poses/stretch_6.png'),
    targetPose: 'side_bend',
    targetAngle: 25,
    targetRom: 35,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_torso_twist',
    number: 7,
    name: 'บิดลำตัวท่ายืน',
    englishName: 'Standing Torso Twist',
    type: 'stretch',
    bodyArea: 'แกนกลางลำตัวและเอว',
    preparation: 'ยืนแยกเท้ากว้างเท่าหัวไหล่ เท้าทั้งสองข้างแนบพื้นมั่นคง',
    description: 'มือไขว้หน้าอก บิดลำตัวส่วนบนช้าๆ สะโพกตรงไปข้างหน้า',
    steps: [
      'ยกแขนไขว้ไว้บริเวณหน้าอก หรือประสานมือระดับอก',
      'ค่อยๆ บิดลำตัวส่วนบนไปทางซ้ายช้าๆ สะโพกชี้ไปข้างหน้า',
      'ค้างท่านิ่งไว้ 15 วินาที พร้อมหายใจสบายๆ',
      'หมุนตัวกลับมาช้าๆ แล้วบิดไปทางขวาอีก 15 วินาที',
    ],
    holdSeconds: 15,
    sets: 1,
    sides: 'both_sides',
    caution: 'บิดช้าๆ นุ่มนวล ไม่กระตุกแรง และไม่บิดสะโพกตาม',
    safetyTips: [
      'บิดช้าๆ นุ่มนวล ไม่กระตุกแรง และไม่บิดสะโพกตาม',
      'ให้ฝ่าเท้าทั้งสองข้างแนบติดพื้นมั่นคง',
    ],
    scoring: {
      primaryJoint: 'spine',
      targetAngleDeg: 30,
      toleranceDeg: 8,
      landmarksUsed: [11, 12, 23, 24],
      description: 'ตรวจจับความต่างของระนาบไหล่เทียบกับระนาบสะโพก',
    },
    svgType: 'torso_twist',
    videoStartSeconds: 445, // 7:25
    demoVideoUrl: getStretchVideoEmbedUrl(445, false),
    thumbnailUrl: asset('images/poses/stretch_7.png'),
    targetPose: 'torso_twist',
    targetAngle: 30,
    targetRom: 42,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_quadriceps',
    number: 8,
    name: 'ยืดต้นขาด้านหน้า',
    englishName: 'Standing Quadriceps Stretch',
    type: 'stretch',
    bodyArea: 'ต้นขาด้านหน้าและหน้าขา',
    preparation: 'ยืนข้างผนังหรือเก้าอี้ ใช้มือข้างหนึ่งจับพนักพิงไว้มั่นคง',
    description: 'ยืนจับผนังหรือเก้าอี้ งอเข่าพับส้นเท้าเข้าหาก้น ดึงข้อเท้าเบาๆ',
    steps: [
      'มือข้างหนึ่งจับเก้าอี้หรือผนังเพื่อทรงตัว',
      'งอเข่าอีกข้าง พับปลายเท้าขึ้นไปด้านหลัง ใช้มือจับข้อเท้าไว้',
      'ค่อยๆ ดึงส้นเท้าเข้าหาบั้นท้ายจนรู้สึกตึงหน้าขา เข่าชิดกัน',
      'ค้างไว้ 20 วินาที จากนั้นสลับทำอีกข้าง',
    ],
    holdSeconds: 20,
    sets: 1,
    sides: 'both_sides',
    caution: 'ต้องจับพนักเก้าอี้หรือผนังเสมอเพื่อป้องกันการล้ม และไม่แอ่นหลัง',
    safetyTips: [
      'ต้องจับพนักเก้าอี้หรือผนังเสมอเพื่อป้องกันการล้ม และไม่แอ่นหลัง',
      'รักษาเข่าทั้งสองข้างให้อยู่ชิดกัน ไม่กางออกด้านข้าง',
    ],
    scoring: {
      primaryJoint: 'knee',
      targetAngleDeg: 50,
      toleranceDeg: 10,
      landmarksUsed: [23, 24, 25, 26, 27, 28],
      description: 'ตรวจจับมุมงอเข่าพับส้นเท้าเข้าหาสะโพก',
    },
    svgType: 'quadriceps',
    videoStartSeconds: 500, // 8:20
    demoVideoUrl: getStretchVideoEmbedUrl(500, false),
    thumbnailUrl: asset('images/poses/stretch_8.png'),
    targetPose: 'quadriceps',
    targetAngle: 50,
    targetRom: 75,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_hamstrings',
    number: 9,
    name: 'ยืดต้นขาด้านหลัง',
    englishName: 'Hamstring Stretch',
    type: 'stretch',
    bodyArea: 'ใต้ข้อพับและหลังต้นขา',
    preparation: 'ยืนหน้าขั้นบันไดเตี้ยหรือกล่องเตี้ย มือจับเก้าอี้ข้างลำตัว',
    description: 'วางส้นเท้าบนขั้นเตี้ย ขาเหยียดตรง โน้มตัวไปข้างหน้าโดยหลังตรง',
    steps: [
      'ก้าวขาข้างหนึ่งวางส้นเท้าบนพื้นหรือขั้นเตี้ย ปลายเท้ากระดกขึ้น',
      'ขาที่ยืดเหยียดตรง ขาหลังงอเข่าเล็กน้อยเพื่อทรงตัว',
      'ค่อยๆ โน้มสะโพกและลำตัวไปข้างหน้าโดยรักษาหลังให้ตรง',
      'รู้สึกตึงใต้ต้นขาด้านหลัง ค้างไว้แล้วสลับข้าง',
    ],
    holdSeconds: 20,
    sets: 1,
    sides: 'both_sides',
    caution: 'รักษาหลังให้ตรง ห้ามก้มหลังโก่งงอ และระวังเสียการทรงตัว',
    safetyTips: [
      'รักษาหลังให้ตรงเสมอ ห้ามก้มหลังโก่งงอ และระวังเสียการทรงตัว',
      'จับเก้าอี้หรือผนังช่วยพยุงตลอดเวลา',
    ],
    scoring: {
      primaryJoint: 'hip',
      targetAngleDeg: 65,
      toleranceDeg: 10,
      landmarksUsed: [11, 12, 23, 24, 25, 26],
      description: 'ตรวจจับการโน้มสะโพกไปข้างหน้าโดยแนวหลังยังเหยียดตรง',
    },
    svgType: 'hamstrings',
    videoStartSeconds: 555, // 9:15
    demoVideoUrl: getStretchVideoEmbedUrl(555, false),
    thumbnailUrl: asset('images/poses/stretch_9.png'),
    targetPose: 'hamstrings',
    targetAngle: 65,
    targetRom: 85,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_calf',
    number: 10,
    name: 'ยืดน่อง',
    englishName: 'Standing Calf Stretch',
    type: 'stretch',
    bodyArea: 'น่องและเอ็นร้อยหวาย',
    preparation: 'ยืนหันหน้าเข้าหาผนัง วางฝ่ามือทั้งสองข้างยันผนังระดับอก',
    description: 'ยืนหันหน้าเข้าผนัง ก้าวขาข้างหนึ่งไปข้างหลัง ส้นเท้าแนบพื้น ขาหลังตรง',
    steps: [
      'ยืนหันหน้าเข้าผนัง มือยันผนัง ก้าวขาข้างหนึ่งไปด้านหลัง',
      'เหยียดขาหลังตรง กดส้นเท้าให้แนบติดพื้น ขาหน้าย่อเข่าลงเล็กน้อย',
      'ดันสะโพกไปข้างหน้าช้าๆ จนรู้สึกตึงสบายที่กล้ามเนื้อน่องขาหลัง',
      'ค้างไว้ 25 วินาที จากนั้นสลับข้าง',
    ],
    holdSeconds: 25,
    sets: 1,
    sides: 'both_sides',
    caution: 'ส้นเท้าขาหลังต้องแนบติดพื้นเสมอ และไม่เปิดส้นเท้าขึ้น',
    safetyTips: [
      'ส้นเท้าขาหลังต้องแนบติดพื้นเสมอ และไม่เปิดส้นเท้าขึ้น',
      'วางมือยันผนังให้มั่นคง ปลายเท้าทั้งสองข้างชี้ตรงไปข้างหน้า',
    ],
    scoring: {
      primaryJoint: 'ankle',
      targetAngleDeg: 75,
      toleranceDeg: 10,
      landmarksUsed: [23, 24, 25, 26, 27, 28],
      description: 'ตรวจจับขาหลังเหยียดตรงและทำมุมลาดชันกับพื้น',
    },
    svgType: 'calf',
    videoStartSeconds: 615, // 10:15
    demoVideoUrl: getStretchVideoEmbedUrl(615, false),
    thumbnailUrl: asset('images/poses/stretch_10.png'),
    targetPose: 'calf',
    targetAngle: 75,
    targetRom: 90,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
  {
    id: 'stretch_piriformis_seated',
    number: 11,
    name: 'ยืดสะโพกและก้น (นั่งไขว้ขา)',
    englishName: 'Seated Piriformis Stretch',
    type: 'stretch',
    bodyArea: 'สะโพกและกล้ามเนื้อก้น',
    preparation: 'นั่งบนเก้าอี้ที่มั่นคง หลังตรง เท้าทั้งสองข้างแตะพื้น',
    description: 'นั่งเก้าอี้ วางข้อเท้าข้างหนึ่งบนเข่าอีกข้าง โน้มตัวไปข้างหน้าเบาๆ',
    steps: [
      'นั่งหลังตรงบนเก้าอี้ ยกข้อเท้าข้างหนึ่งขึ้นมาพาดไว้บนหัวเข่าอีกข้าง',
      'จัดท่าทางให้ผ่อนคลาย มือวางประคองหน้าแข้งไว้เบาๆ',
      'ค่อยๆ โน้มลำตัวท่อนบนไปข้างหน้าช้าๆ จากข้อสะโพก หลังตรง',
      'รู้สึกตึงสบายบริเวณสะโพกและก้น ค้างไว้แล้วสลับข้าง',
    ],
    holdSeconds: 25,
    sets: 1,
    sides: 'both_sides',
    caution: 'โน้มตัวเพียงเล็กน้อยเท่าที่ตึงสบาย ห้ามกดหรือกดทับเข่าแรง',
    safetyTips: [
      'โน้มตัวเพียงเล็กน้อยเท่าที่ตึงสบาย ห้ามกดหรือกดทับเข่าแรง',
      'นั่งเก้าอี้ที่มีพนักพิงมั่นคง ไม่ลื่นไถล',
    ],
    scoring: {
      primaryJoint: 'hip',
      targetAngleDeg: 60,
      toleranceDeg: 10,
      landmarksUsed: [11, 12, 23, 24, 25, 26],
      description: 'ตรวจจับลำตัวโน้มพับไปข้างหน้าขณะอยู่ในท่านั่ง',
    },
    svgType: 'piriformis_seated',
    videoStartSeconds: 670, // 11:10
    demoVideoUrl: getStretchVideoEmbedUrl(670, false),
    thumbnailUrl: asset('images/poses/stretch_11.png'),
    targetPose: 'piriformis_seated',
    targetAngle: 60,
    targetRom: 78,
    recommendedReps: 1,
    cooldownSeconds: 5,
  },
];

/**
 * มาตรฐานการกำหนดค่าแบบ Exercise Configuration Structure
 * สำหรับท่าฟื้นฟูกายภาพบำบัดมาตรฐาน (Physiotherapy & Rehabilitation)
 */
export interface PhysioExerciseConfig {
  id: string;
  name: string;
  englishName: string;
  description: string;
  demoVideoUrl?: string;
  thumbnailUrl?: string;
  targetPose: string;
  targetAngle: number;
  targetRom: number;
  recommendedReps: number;
  cooldownSeconds: number;
  safetyTips: string[];
}

export const PHYSIO_EXERCISES_CONFIG: Record<string, PhysioExerciseConfig> = {
  'alternating-knee-raise': {
    id: 'alternating-knee-raise',
    name: 'ท่ายกเข่าสลับ',
    englishName: 'Alternating Knee Raise',
    description: 'ยืนตัวตรง ยกเข่าขึ้นสลับซ้าย-ขวา เสริมกำลังกล้ามเนื้อสะโพกและหน้าท้อง',
    demoVideoUrl: 'https://www.youtube.com/embed/3vOTTj_X3kQ?start=15',
    thumbnailUrl: asset('images/poses/alternating_knee_raise.png'),
    targetPose: 'alternating_knee_raise',
    targetAngle: 90,
    targetRom: 100,
    recommendedReps: 10,
    cooldownSeconds: 15,
    safetyTips: [
      'ยกเข่าขึ้นช้าๆ ให้ขนานกับพื้น',
      'ทรงตัวให้มั่นคง หากไม่มั่นใจให้จับพนักเก้าอี้',
      'ไม่เอียงตัวไปด้านหลังขณะยกเข่า',
    ],
  },
  'shoulder_raise': {
    id: 'shoulder_raise',
    name: 'กางแขนยกด้านข้าง',
    englishName: 'Shoulder Lateral Raise',
    description: 'กางแขนยกขึ้นด้านข้างระดับไหล่ ช่วยเพิ่มช่วงการเคลื่อนไหวข้อไหล่และความแข็งแรงของกล้ามเนื้อเดลทอยด์',
    // TODO: กำหนดคลิปวิดีโอสาธิตท่ายกแขนด้านข้างที่ตรงกับท่าทาง (ปัจจุบันใช้ภาพประกอบ/Stick Figure)
    thumbnailUrl: asset('images/poses/shoulder_raise.png'),
    targetPose: 'shoulder_raise',
    targetAngle: 90,
    targetRom: 110,
    recommendedReps: 10,
    cooldownSeconds: 10,
    safetyTips: [
      'ไม่ยกไหล่เกร็งชิดใบหู',
      'รักษาสันหลังให้ตรง ไม่แอ่นหลัง',
      'ยกขึ้นในระดับที่ไม่ทำให้เจ็บแปลบ',
    ],
  },
  'bicep_curl': {
    id: 'bicep_curl',
    name: 'งอข้อศอกฟื้นฟูแขน',
    englishName: 'Bicep Curl',
    description: 'พับงอข้อศอกขึ้นและเหยียดตรง ช่วยฟื้นฟูกำลังแขนท่อนบนและข้อศอก',
    // TODO: กำหนดคลิปวิดีโอสาธิตท่างอข้อศอกที่ตรงกับท่าทาง (ปัจจุบันใช้ภาพประกอบ/Stick Figure)
    thumbnailUrl: asset('images/poses/bicep_curl.png'),
    targetPose: 'bicep_curl',
    targetAngle: 50,
    targetRom: 65,
    recommendedReps: 10,
    cooldownSeconds: 10,
    safetyTips: [
      'แนบข้อศอกชิดข้างลำตัว ไม่กางข้อศอกออก',
      'เคลื่อนไหวอย่างช้าๆ นุ่มนวล ไม่กระตุกแขน',
    ],
  },
  'knee_squat': {
    id: 'knee_squat',
    name: 'ย่อเข่าเก้าอี้',
    englishName: 'Chair Squat',
    description: 'ย่อสะโพกและเข่าลงเบาๆ เสริมกำลังขาและการทรงตัวสำหรับผู้สูงอายุ',
    // TODO: กำหนดคลิปวิดีโอสาธิตท่าย่อเข่าเก้าอี้ที่ตรงกับท่าทาง (ปัจจุบันใช้ภาพประกอบ/Stick Figure)
    thumbnailUrl: asset('images/poses/knee_squat.png'),
    targetPose: 'knee_squat',
    targetAngle: 90,
    targetRom: 110,
    recommendedReps: 8,
    cooldownSeconds: 15,
    safetyTips: [
      'หัวเข่าไม่เลยปลายเท้า',
      'เข่าไม่บิดยุบเข้าด้านใน (Knee Valgus)',
      'มีเก้าอี้รองรับด้านหลังเสมอ',
    ],
  },
};

/**
 * แปลงข้อมูล Exercise ใดๆ ให้กลายเป็น ExerciseConfig ที่สมบูรณ์
 */
export function getExerciseUnifiedConfig(item: any): PhysioExerciseConfig {
  if (!item) {
    return PHYSIO_EXERCISES_CONFIG['alternating-knee-raise'];
  }

  // หากเป็น StretchExerciseItem
  if (item.type === 'stretch' || item.holdSeconds !== undefined) {
    return {
      id: item.id,
      name: item.name,
      englishName: item.englishName || 'Stretch Exercise',
      description: item.description || '',
      demoVideoUrl: item.demoVideoUrl || getStretchVideoEmbedUrl(item.videoStartSeconds || 0, false),
      thumbnailUrl: item.thumbnailUrl,
      targetPose: item.targetPose || item.svgType || 'stretch',
      targetAngle: item.targetAngle || item.scoring?.targetAngleDeg || 45,
      targetRom: item.targetRom || 60,
      recommendedReps: item.recommendedReps || 1,
      cooldownSeconds: item.cooldownSeconds || 5,
      safetyTips: item.safetyTips || [item.caution || 'ฝึกเท่าที่ร่างกายรับไหว'],
    };
  }

  // หากมี key ใน PHYSIO_EXERCISES_CONFIG
  const slug = item.slug || item.id;
  if (slug && PHYSIO_EXERCISES_CONFIG[slug]) {
    return PHYSIO_EXERCISES_CONFIG[slug];
  }

  // Fallback จาก ExerciseDefinition ทั่วไป
  return {
    id: String(item.id ?? 'exercise-1'),
    name: item.name ?? 'ท่ายกเข่าสลับ',
    englishName: item.englishName ?? (item.slug ? item.slug.replace(/_/g, ' ') : 'Exercise'),
    description: item.description ?? '',
    demoVideoUrl: item.demoVideoUrl ?? 'https://www.youtube.com/embed/3vOTTj_X3kQ',
    thumbnailUrl: item.thumbnailUrl,
    targetPose: item.targetPose ?? item.slug ?? 'exercise',
    targetAngle: item.target_angle ?? 90,
    targetRom: item.max_angle ?? 110,
    recommendedReps: item.target_reps ?? 10,
    cooldownSeconds: item.cooldownSeconds ?? 10,
    safetyTips: item.safetyTips ?? ['จัดท่าทางให้ตรง ไม่เกร็งกล้ามเนื้อ', 'หากปวดให้หยุดทันที'],
  };
}

/**
 * คำนวณเวลารวมโดยประมาณเป็นนาที
 * (เวลาค้าง × จำนวนข้าง × จำนวนเซ็ต) รวมเวลาเตรียมตัวเล็กน้อย
 */
export function calculateEstimatedMinutes(
  selectedIds: string[],
  customHoldTimes?: Record<string, number>
): number {
  if (!selectedIds || selectedIds.length === 0) return 0;
  
  let totalSeconds = 0;
  selectedIds.forEach((id) => {
    const item = STRETCH_EXERCISES.find((e) => e.id === id);
    if (item) {
      const holdTime = customHoldTimes?.[id] !== undefined ? customHoldTimes[id] : item.holdSeconds;
      const multiplier = item.sides === 'both_sides' ? 2 : 1;
      const exerciseTime = holdTime * multiplier * item.sets;
      const transitionTime = 8 * multiplier; // 8 วินาที สำหรับเตรียมตัว/สลับข้าง
      totalSeconds += exerciseTime + transitionTime;
    }
  });

  return Math.max(1, Math.ceil(totalSeconds / 60));
}

/**
 * สรุปเวลาสำหรับแสดงในแต่ละแถว เช่น "20 วิ × 2 ข้าง" หรือ "15 วิ"
 */
export function formatExerciseTimeTag(
  item: StretchExerciseItem,
  customHoldTime?: number
): string {
  const time = customHoldTime !== undefined ? customHoldTime : item.holdSeconds;
  if (item.sides === 'both_sides') {
    return `${time} วิ × 2 ข้าง`;
  }
  return `${time} วินาที`;
}
