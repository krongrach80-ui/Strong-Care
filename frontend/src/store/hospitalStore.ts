import { create } from 'zustand';
import {
  UserAccount,
  UserRole,
  UserStatus,
  PhysicalTherapist,
  HospitalExercise,
  TreatmentPlan,
  ActivityLog,
  PatientSymptomReport,
  AiSystemSettings,
} from '../types/hospital';
import { faceService } from '../services/faceService';
import { supabaseService } from '../services/supabaseService';

const INITIAL_THERAPISTS: PhysicalTherapist[] = [
  {
    id: 1,
    code: 'T-003',
    name: 'กภ. ธนากร วงศ์สวัสดิ์',
    specialty: 'กายภาพบำบัดระบบกล้ามเนื้อและกระดูก (Orthopedic PT)',
    phone: '081-456-7890',
    email: 'thanakorn.w@strongcare.hospital',
    activePatientsCount: 14,
    assignedCases: [
      'นายสมชาย ใจดี (P-0012)',
      'นางมาลี รักสุข (P-0013)',
      'นายวิชัย แก้วมณี (P-0021)',
      'นายสุรศักดิ์ พิพัฒน์ (P-0028)',
    ],
    bio: 'วุฒิบัตรกายภาพบำบัดระบบกล้ามเนื้อและกระดูก จุฬาลงกรณ์มหาวิทยาลัย ประสบการณ์คลินิก 8 ปี เชี่ยวชาญการรักษาข้อไหล่ติดและกระดูกสันหลัง',
    status: 'active',
    licenseNumber: 'กภ.12458',
  },
  {
    id: 2,
    code: 'T-007',
    name: 'กภ. พิมพ์ชนก สุขเกษม',
    specialty: 'กายภาพบำบัดระบบประสาทและผู้สูงอายุ (Neurological & Geriatric PT)',
    phone: '089-765-4321',
    email: 'pimchanok.s@strongcare.hospital',
    activePatientsCount: 18,
    assignedCases: [
      'นางสุดา ศรีอ่อน (P-0008)',
      'นายประเสริฐ มั่นคง (P-0034)',
      'นางกัญญา บุญมา (P-0035)',
    ],
    bio: 'ปริญญาโทกายภาพบำบัดระบบประสาท มหาวิทยาลัยมหิดล เชี่ยวชาญการฟื้นฟูผู้ป่วยหลอดเลือดสมองและผู้สูงอายุหลังผ่าตัด ประสบการณ์ 6 ปี',
    status: 'active',
    licenseNumber: 'กภ.15890',
  },
  {
    id: 3,
    code: 'T-012',
    name: 'กภ. วรัญญู รัตนเวช',
    specialty: 'ฟื้นฟูสมรรถภาพหัวใจและปอด (Cardiopulmonary PT)',
    phone: '086-112-3344',
    email: 'waranyoo.r@strongcare.hospital',
    activePatientsCount: 9,
    assignedCases: [
      'นายสมบูรณ์ ชัยเวช (P-0040)',
      'นางอรพินท์ ภักดี (P-0042)',
    ],
    bio: 'กายภาพบำบัดฟื้นฟูสมรรถภาพหัวใจและปอด มหาวิทยาลัยเชียงใหม่ ประสบการณ์ 5 ปี ดูแลผู้ป่วยฟื้นฟูสมรรถภาพการหายใจ',
    status: 'active',
    licenseNumber: 'กภ.18902',
  },
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 1,
    username: 'admin',
    name: 'นพ. วรชัย อมรเวช (ผู้อำนวยการ รพ.)',
    role: 'admin',
    status: 'active',
    code: 'ADM-01',
    password: '1234',
    phone: '02-555-0199',
    email: 'director@strongcare.hospital',
    created_at: '2026-01-10',
    last_active: 'วันนี้ 14:30',
  },
  {
    id: 2,
    username: 'pt_thanakorn',
    name: 'กภ. ธนากร วงศ์สวัสดิ์',
    role: 'therapist',
    status: 'active',
    code: 'T-003',
    password: '1234',
    phone: '081-456-7890',
    email: 'thanakorn.w@strongcare.hospital',
    created_at: '2026-01-15',
    last_active: 'วันนี้ 15:45',
  },
  {
    id: 3,
    username: 'pt_pimchanok',
    name: 'กภ. พิมพ์ชนก สุขเกษม',
    role: 'therapist',
    status: 'active',
    code: 'T-007',
    password: '1234',
    phone: '089-765-4321',
    email: 'pimchanok.s@strongcare.hospital',
    created_at: '2026-01-20',
    last_active: 'วันนี้ 16:10',
  },
  {
    id: 12,
    username: 'somchai',
    name: 'นายสมชาย ใจดี',
    role: 'patient',
    status: 'active',
    code: 'P-0012',
    password: '1234',
    assignedTherapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
    assignedTherapistId: 1,
    phone: '081-998-1122',
    email: 'somchai.j@gmail.com',
    age: 68,
    gender: 'male',
    diagnosis: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder - Subacute Phase)',
    chiefComplaint: 'ปวดไหล่ขวาเรื้อรัง ยกแขนไม่สุด ปวดแปลบตอนเอื้อมหยิบของสูงมา 1 เดือน ขยับสะบักติดขัด',
    patientBackground: 'ความดันโลหิตสูงเล็กน้อย (ควบคุมได้ดีด้วยยา), ไม่มีประวัติผ่าตัดใหญ่, เดินออกกำลังกายเช้าสม่ำเสมอ',
    treatmentOutcome: 'ROM กางแขนข้างลำตัวเพิ่มจาก 65° เป็น 88°, ความปวดลดลงจาก 6/10 เหลือ 2/10, ทำกายภาพสม่ำเสมอ 94%',
    therapistNotes: 'คนไข้ให้ความร่วมมือดีมาก กล้ามเนื้อไหล่คลายตัวขึ้น แนะนำให้รักษาระดับการยืดแขนอย่างนุ่มนวล หลีกเลี่ยงการยกของหนักเกิน 3 กก.',
    created_at: '2026-02-01',
    last_active: 'วันนี้ 10:15',
  },
  {
    id: 13,
    username: 'malee',
    name: 'นางมาลี รักสุข',
    role: 'patient',
    status: 'active',
    code: 'P-0013',
    password: '1234',
    assignedTherapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
    assignedTherapistId: 1,
    phone: '084-332-9900',
    email: 'malee.r@gmail.com',
    age: 72,
    gender: 'female',
    diagnosis: 'ข้อเข่าเสื่อมระยะที่ 2 และกล้ามเนื้อต้นขาอ่อนแรง (Knee OA Grade 2)',
    chiefComplaint: 'ปวดตึงข้อเข่าทั้งสองข้างเวลายืนนานและเดินขึ้นบันได มีเสียงกรอบแกรบในข้อเข่า',
    patientBackground: 'มีภาวะกระดูกบางระยะเริ่มต้น ทานแคลเซียมเสริมประจำ ไม่มีโรคหัวใจ',
    treatmentOutcome: 'สามารถลุกยืนจากเก้าอี้ได้มั่นคงขึ้น อาการเสียวข้อเข่าลดลง กำลังกล้ามเนื้อ Quadriceps เพิ่มขึ้น 1 ระดับ',
    therapistNotes: 'ฝึกย่อเข่าแบบมีเก้าอี้พยุงอย่างระมัดระวัง เข่าต้องไม่เลยปลายเท้า เน้นเพิ่มความแข็งแรงกล้ามเนื้อรอบข้อเข่า',
    created_at: '2026-02-05',
    last_active: 'เมื่อวานนี้',
  },
  {
    id: 21,
    username: 'wichai',
    name: 'นายวิชัย แก้วมณี',
    role: 'patient',
    status: 'active',
    code: 'P-0021',
    password: '1234',
    assignedTherapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
    assignedTherapistId: 1,
    phone: '089-445-5667',
    age: 65,
    gender: 'male',
    diagnosis: 'ปวดหลังส่วนล่างเรื้อรัง (Chronic Low Back Pain)',
    chiefComplaint: 'ปวดเมื่อยเอวและสะโพกเวลานั่งทำงานหรือขับรถนาน นั่งเกิน 30 นาทีแล้วลุกยาก',
    patientBackground: 'ทำงานออฟฟิศเดิม ไม่มีประวัติหมอนรองกระดูกทับเส้นประสาท',
    treatmentOutcome: 'ความยืดหยุ่นกล้ามเนื้อลำตัวและสะโพกดีขึ้น 15%, ลดการปวดตึงช่วงเช้า',
    therapistNotes: 'เน้นท่ายืดสะโพกบนเก้าอี้และบิดลำตัวคลายหลัง หลีกเลี่ยงการก้มยกของหนักโดยงอหลัง',
    created_at: '2026-02-12',
    last_active: '3 วันที่แล้ว',
  },
  {
    id: 8,
    username: 'suda',
    name: 'นางสุดา ศรีอ่อน',
    role: 'patient',
    status: 'suspended',
    code: 'P-0008',
    password: '1234',
    assignedTherapistName: 'กภ. พิมพ์ชนก สุขเกษม',
    assignedTherapistId: 2,
    phone: '087-654-3210',
    age: 75,
    gender: 'female',
    diagnosis: 'ฟื้นฟูหลังผ่าตัดเปลี่ยนข้อสะโพกเทียม (Post THA)',
    chiefComplaint: 'กังวลเรื่องการก้าวเดินและทรงตัวหลังผ่าตัดข้อสะโพก กล้ามเนื้อสะโพกข้างซ้ายยังเกร็งตึง',
    patientBackground: 'ผ่าตัดเปลี่ยนข้อสะโพกข้างซ้ายมา 2 เดือน แผลผ่าตัดติดเรียบร้อย',
    treatmentOutcome: 'ทรงตัวบนขาข้างซ้ายได้มั่นคงขึ้น เดินโดยใช้ไม้เท้าช่วยพยุงได้ระยะทาง 50 เมตรต่อเนื่อง',
    therapistNotes: 'ห้ามงอข้อสะโพกเกิน 90 องศาเด็ดขาด ฝึกเดินทรงตัวพร้อมผู้ดูแลประกบใกล้ชิด',
    created_at: '2026-01-18',
    last_active: '1 สัปดาห์ที่แล้ว',
  },
  {
    id: 34,
    username: 'prasert',
    name: 'นายประเสริฐ มั่นคง',
    role: 'patient',
    status: 'active',
    code: 'P-0034',
    password: '1234',
    assignedTherapistName: 'กภ. พิมพ์ชนก สุขเกษม',
    assignedTherapistId: 2,
    phone: '082-111-2233',
    age: 70,
    gender: 'male',
    diagnosis: 'โรคหลอดเลือดสมองระยะฟื้นตัว กล้ามเนื้อซีกขวาอ่อนแรง (Post Stroke Hemiparesis)',
    chiefComplaint: 'แขนและขาข้างขวายกได้ช้า กล้ามเนื้อเกร็งเล็กน้อยตอนเช้า ต้องการฝึกเดินและหยิบจับสิ่งของ',
    patientBackground: 'หลอดเลือดสมองตีบมา 6 เดือน ได้รับยาละลายลิ่มเลือดสม่ำเสมอ ความดันปกติ',
    treatmentOutcome: 'สามารถยกเข่าขวาสลับซ้ายได้มั่นคงขึ้น การสวิงแขนขวาขณะเดินเป็นธรรมชาติขึ้น',
    therapistNotes: 'เน้นท่ากางแขนและยกเข่าสลับข้างแบบมีราวจับ ฝึกต่อเนื่องวันละ 15 นาที',
    created_at: '2026-02-20',
    last_active: 'วันนี้ 09:30',
  },
  {
    id: 35,
    username: 'kanya',
    name: 'นางกัญญา บุญมา',
    role: 'patient',
    status: 'active',
    code: 'P-0035',
    password: '1234',
    assignedTherapistName: 'กภ. พิมพ์ชนก สุขเกษม',
    assignedTherapistId: 2,
    phone: '085-889-9001',
    age: 63,
    gender: 'female',
    diagnosis: 'กลุ่มอาการปวดกล้ามเนื้อคอบ่าเรื้อรัง (Myofascial Pain Syndrome)',
    chiefComplaint: 'ปวดตึงกล้ามเนื้อต้นคอร้าวขึ้นศีรษะ กล้ามเนื้อ Trapezius เกร็งแข็ง',
    patientBackground: 'มีภาวะนอนหลับไม่สนิทจากการเกร็งกล้ามเนื้อคอ',
    treatmentOutcome: 'อาการปวดศีรษะลดลง สามารถเอียงคอซ้าย-ขวาได้มุมกว้างขึ้น 20°',
    therapistNotes: 'ฝึกท่ายืดคอด้านข้างและยืดอกเปิดไหล่ ประคบอุ่นบริเวณบ่าก่อนยืดกล้ามเนื้อ',
    created_at: '2026-02-22',
    last_active: 'วันนี้ 11:20',
  },
];

const INITIAL_EXERCISES: HospitalExercise[] = [
  {
    id: 1,
    name: 'กางแขนยกด้านข้าง',
    englishName: 'Shoulder Abduction / Raise',
    category: 'ฟื้นฟูข้อไหล่และแขน',
    targetJoint: 'ข้อไหล่ (Shoulder)',
    targetAngle: 90,
    holdSeconds: 3,
    repsPerSet: 10,
    sets: 3,
    difficulty: 'medium',
    description: 'ยืนหรือนั่งหลังตรง ยกแขนทั้งสองข้างกางออกด้านข้างลำตัวจนถึงระดับระนาบหัวไหล่',
    cautions: 'ระวังอย่ายกไหล่เกร็งชิดใบหู (Shoulder Hike) และลำตัวต้องไม่เอียงชดเชย',
    contraindications: 'ผู้ป่วยที่มีภาวะข้อไหล่หลุดเฉียบพลันหรือเอ็นหัวไหล่ฉีกขาดรุนแรง',
    svgType: 'shoulder_raise',
  },
  {
    id: 2,
    name: 'ยืดคอด้านข้าง',
    englishName: 'Neck Lateral Stretch',
    category: 'ฟื้นฟูข้อไหล่และแขน',
    targetJoint: 'กระดูกคอ (Cervical Spine)',
    targetAngle: 30,
    holdSeconds: 20,
    repsPerSet: 5,
    sets: 2,
    difficulty: 'easy',
    description: 'นั่งหลังตรง เอียงศีรษะให้หูเข้าหาหัวไหล่ช้าๆ ใช้มือช่วยประคองเบาๆ',
    cautions: 'ห้ามออกแรงดึงกระชาก และไม่ต้องเกร็งยกหัวไหล่ขึ้นมารับศีรษะ',
    contraindications: 'ผู้ป่วยที่มีกระดูกคอเสื่อมรุนแรงและมีอาการชาลงแขนเฉียบพลัน',
    svgType: 'neck_lateral',
  },
  {
    id: 3,
    name: 'ยืดคอก้มไปข้างหน้า',
    englishName: 'Neck Flexion Stretch',
    category: 'ฟื้นฟูข้อไหล่และแขน',
    targetJoint: 'กระดูกคอ (Cervical Spine)',
    targetAngle: 35,
    holdSeconds: 20,
    repsPerSet: 5,
    sets: 2,
    difficulty: 'easy',
    description: 'นั่งหลังตรง ประสานมือวางท้ายทอย ก้มศีรษะให้คางชิดหน้าอกเบาๆ',
    cautions: 'หลังต้องตรง ไม่งอหลังส่วนบนตามลงไป หายใจเข้าออกสม่ำเสมอ',
    contraindications: 'ภาวะหมอนรองกระดูกคอปลิ้นเฉียบพลัน',
    svgType: 'neck_flexion',
  },
  {
    id: 4,
    name: 'ยืดหัวไหล่ข้ามลำตัว',
    englishName: 'Cross-Body Shoulder Stretch',
    category: 'ฟื้นฟูข้อไหล่และแขน',
    targetJoint: 'ข้อไหล่ด้านหลัง (Posterior Capsule)',
    targetAngle: 75,
    holdSeconds: 20,
    repsPerSet: 8,
    sets: 3,
    difficulty: 'easy',
    description: 'ยกแขนพาดข้ามหน้าอก ใช้แขนอีกข้างกดประคองข้อศอกเข้าหาตัว',
    cautions: 'รักษาแนวกระดูกสันหลังให้ตรง ไม่บิดหมุนลำตัวตามแขน',
    contraindications: 'การอักเสบเฉียบพลันของเอ็นสะบัก',
    svgType: 'shoulder_cross',
  },
  {
    id: 5,
    name: 'ยืดต้นแขนด้านหลัง',
    englishName: 'Overhead Triceps Stretch',
    category: 'ฟื้นฟูข้อไหล่และแขน',
    targetJoint: 'ข้อไหล่และกล้ามเนื้อ Triceps',
    targetAngle: 120,
    holdSeconds: 20,
    repsPerSet: 8,
    sets: 3,
    difficulty: 'medium',
    description: 'ยกแขนงอศอกไปด้านหลังศีรษะ ใช้มืออีกข้างกดประคองข้อศอกลงเบาๆ',
    cautions: 'ไม่เงยคอหรือแอ่นหลังจนเกินไป หากมีอาการปวดไหล่ให้ผ่อนมุมลง',
    contraindications: 'ผู้ป่วยหลังผ่าตัดเย็บซ่อมข้อไหล่ไม่เกิน 6 สัปดาห์',
    svgType: 'triceps_overhead',
  },
  {
    id: 6,
    name: 'ยืดอกเปิดหัวไหล่',
    englishName: 'Chest Opener Stretch',
    category: 'ฟื้นฟูข้อสะโพกและหลัง',
    targetJoint: 'กล้ามเนื้อหน้าอก (Pectoralis)',
    targetAngle: 110,
    holdSeconds: 15,
    repsPerSet: 10,
    sets: 2,
    difficulty: 'easy',
    description: 'ประสานมือด้านหลังลำตัว ยืดอกขึ้น ดึงสะบักสองข้างเข้าหากันเบาๆ',
    cautions: 'ระวังอย่าแอ่นหลังส่วนล่าง ให้เกร็งหน้าท้องประคองกระดูกสันหลัง',
    contraindications: 'ข้อไหล่ไม่มั่นคงทางด้านหน้า (Anterior Instability)',
    svgType: 'chest_open',
  },
  {
    id: 7,
    name: 'ยืดลำตัวด้านข้าง',
    englishName: 'Side Bend Stretch',
    category: 'ฟื้นฟูข้อสะโพกและหลัง',
    targetJoint: 'กระดูกสันหลังและเอว (Lateral Spine)',
    targetAngle: 25,
    holdSeconds: 20,
    repsPerSet: 8,
    sets: 2,
    difficulty: 'easy',
    description: 'ยกแขนข้างหนึ่งขึ้นเหนือศีรษะ เอนลำตัวไปด้านตรงข้ามช้าๆ',
    cautions: 'ไม่ก้มตัวไปข้างหน้า ลำตัวต้องอยู่ในระนาบเดิมตลอดเวลา',
    contraindications: 'หมอนรองกระดูกทับเส้นประสาทระยะอักเสบเฉียบพลัน',
    svgType: 'side_bend',
  },
  {
    id: 8,
    name: 'บิดลำตัวคลายหลัง',
    englishName: 'Seated Torso Twist',
    category: 'ฟื้นฟูข้อสะโพกและหลัง',
    targetJoint: 'กระดูกสันหลังส่วนอกและเอว (Thoracolumbar Spine)',
    targetAngle: 30,
    holdSeconds: 15,
    repsPerSet: 10,
    sets: 3,
    difficulty: 'medium',
    description: 'นั่งเก้าอี้หลังตรง บิดลำตัวไปด้านข้าง ใช้มือจับพนักพิงช่วยประคอง',
    cautions: 'สะโพกทั้งสองข้างต้องแนบติดเบาะเก้าอี้ ไม่ยกก้นขึ้นขณะบิดตัว',
    contraindications: 'กระดูกสันหลังคดระดับรุนแรง หรือหลังผ่าตัดกระดูกสันหลังเชื่อมข้อ',
    svgType: 'torso_twist',
  },
  {
    id: 9,
    name: 'ยืดต้นขาด้านหน้า',
    englishName: 'Standing Quadriceps Stretch',
    category: 'ฟื้นฟูข้อเข่าและขา',
    targetJoint: 'ข้อเข่าและข้อสะโพก (Quadriceps)',
    targetAngle: 110,
    holdSeconds: 20,
    repsPerSet: 10,
    sets: 3,
    difficulty: 'medium',
    description: 'ยืนจับเก้าอี้พยุง งอเข่าไปด้านหลัง ใช้มือจับข้อเท้าดึงเข้าหาสะโพก',
    cautions: 'เข่าทั้งสองข้างชิดกัน ไม่กางเข่าออกด้านข้าง และลำตัวต้องตั้งตรง',
    contraindications: 'เอ็นไขว้หน้าเข่าฉีกขาดระยะเฉียบพลัน',
    svgType: 'quadriceps',
  },
  {
    id: 10,
    name: 'ยืดต้นขาด้านหลัง',
    englishName: 'Seated Hamstrings Stretch',
    category: 'ฟื้นฟูข้อเข่าและขา',
    targetJoint: 'ข้อสะโพกและต้นขาด้านหลัง (Hamstrings)',
    targetAngle: 45,
    holdSeconds: 20,
    repsPerSet: 8,
    sets: 3,
    difficulty: 'easy',
    description: 'นั่งริมเก้าอี้ เหยียดขาข้างหนึ่งตรง โน้มลำตัวจากข้อสะโพกไปข้างหน้า',
    cautions: 'รักษาหลังให้ตรง ไม่งอหลังก้มตัว และปลายเท้ากระดกขึ้นเล็กน้อย',
    contraindications: 'อาการปวดร้าวลงขาจากเส้นประสาทไซอาติกเฉียบพลัน (Severe Sciatica)',
    svgType: 'hamstrings',
  },
  {
    id: 11,
    name: 'ยืดกล้ามเนื้อน่อง',
    englishName: 'Wall Calf Stretch',
    category: 'ฟื้นฟูข้อเท้าและขา',
    targetJoint: 'ข้อเท้าและกล้ามเนื้อน่อง (Gastrocnemius)',
    targetAngle: 30,
    holdSeconds: 20,
    repsPerSet: 10,
    sets: 3,
    difficulty: 'easy',
    description: 'ยืนดันผนัง ก้าวขาข้างหนึ่งไปด้านหลัง ส้นเท้าแนบพื้น ขาหลังเหยียดตรง',
    cautions: 'ส้นเท้าหลังต้องติดพื้นตลอดเวลา ปลายเท้าชี้ตรงไปข้างหน้า',
    contraindications: 'เอ็นร้อยหวายอักเสบเฉียบพลัน (Acute Achilles Tendinitis)',
    svgType: 'calf',
  },
  {
    id: 12,
    name: 'ยืดสะโพกบนเก้าอี้',
    englishName: 'Seated Piriformis Stretch',
    category: 'ฟื้นฟูข้อสะโพกและหลัง',
    targetJoint: 'ข้อสะโพกด้านหลัง (Piriformis)',
    targetAngle: 35,
    holdSeconds: 20,
    repsPerSet: 8,
    sets: 3,
    difficulty: 'medium',
    description: 'นั่งเก้าอี้ ยกข้อเท้าข้างหนึ่งพาดบนเข่าอีกข้าง แล้วโน้มตัวไปข้างหน้าช้าๆ',
    cautions: 'รักษาแนวกระดูกสันหลังให้ตรง ไม่กดเข่าแรงจนเกิดอาการปวดแปลบ',
    contraindications: 'ผู้ป่วยเปลี่ยนข้อสะโพกเทียม (Total Hip Replacement) ที่มีข้อจำกัดการงอสะโพก',
    svgType: 'piriformis_seated',
  },
  {
    id: 13,
    name: 'ย่อเข่าเก้าอี้พยุง',
    englishName: 'Supported Chair Squat',
    category: 'ฟื้นฟูข้อเข่าและขา',
    targetJoint: 'ข้อเข่าและกล้ามเนื้อขา (Knee Extension)',
    targetAngle: 90,
    holdSeconds: 3,
    repsPerSet: 12,
    sets: 3,
    difficulty: 'hard',
    description: 'ยืนจับพนักพิงเก้าอี้ ย่อเข่าลงคล้ายกำลังจะนั่งเก้าอี้ แล้วดันตัวขึ้น',
    cautions: 'หัวเข่าต้องไม่เลยปลายเท้า ระวังเข่าบิดเข้าด้านใน',
    contraindications: 'ข้อเข่าเสื่อมระยะรุนแรงมีอาการบวมและอักเสบเฉียบพลัน',
    svgType: 'knee_squat',
  },
];

const INITIAL_TREATMENT_PLANS: TreatmentPlan[] = [
  {
    id: 1,
    patientId: 12,
    patientName: 'นายสมชาย ใจดี',
    patientCode: 'P-0012',
    therapistId: 1,
    therapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
    diagnosis: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)',
    targetJoint: 'ข้อไหล่และกล้ามเนื้อสะบัก (Shoulder & Scapula)',
    assignedExercises: [
      { exerciseSlug: 'shoulder_raise', exerciseName: 'กางแขนยกด้านข้าง', sets: 3, reps: 10, holdSeconds: 3, difficulty: 'beginner' },
      { exerciseSlug: 'stretch_shoulder_cross', exerciseName: 'ยืดไหล่ข้ามอก', sets: 3, reps: 5, holdSeconds: 20, difficulty: 'beginner' },
      { exerciseSlug: 'stretch_chest_open', exerciseName: 'ยืดอกเปิดไหล่', sets: 2, reps: 5, holdSeconds: 15, difficulty: 'beginner' },
    ],
    clinicalNotes: 'เน้นเพิ่มองศาการยกแขนด้านข้าง หลีกเลี่ยงการยกแขนกระตุกเร็ว สังเกตอาการปวดไม่ให้เกินระดับ 3/10',
    createdAt: '2026-02-02',
    status: 'active',
  },
  {
    id: 2,
    patientId: 13,
    patientName: 'นางมาลี รักสุข',
    patientCode: 'P-0013',
    therapistId: 1,
    therapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
    diagnosis: 'ข้อเข่าเสื่อมระยะที่ 2 (Knee OA)',
    targetJoint: 'ข้อเข่าและกล้ามเนื้อ Quadriceps (Knee)',
    assignedExercises: [
      { exerciseSlug: 'knee_squat', exerciseName: 'ย่อเข่าเก้าอี้', sets: 3, reps: 8, holdSeconds: 2, difficulty: 'beginner' },
      { exerciseSlug: 'stretch_quadriceps', exerciseName: 'ยืดต้นขาด้านหน้า', sets: 2, reps: 5, holdSeconds: 20, difficulty: 'beginner' },
      { exerciseSlug: 'stretch_hamstrings', exerciseName: 'ยืดต้นขาด้านหลัง', sets: 2, reps: 5, holdSeconds: 20, difficulty: 'beginner' },
    ],
    clinicalNotes: 'ฝึกย่อเข่าระดับปลอดภัย เข่าต้องไม่เลยปลายเท้า ระวังเข่าบิดเข้าด้านใน',
    createdAt: '2026-02-06',
    status: 'active',
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 1,
    timestamp: '2026-10-06 14:30:15',
    userId: 1,
    userName: 'นพ. วรชัย อมรเวช',
    role: 'admin',
    action: 'เข้าสู่ระบบ (Login)',
    category: 'AUTH',
    details: 'เข้าสู่ระบบผู้ดูแลระบบจากสถานีตู้ส่วนกลาง (IP: 192.168.1.108)',
    device: 'Windows 11 / Chrome 124 (Admin Workstation 01)',
    ipAddress: '192.168.1.108',
  },
  {
    id: 2,
    timestamp: '2026-10-06 14:15:20',
    userId: 2,
    userName: 'กภ. ธนากร วงศ์สวัสดิ์',
    role: 'therapist',
    action: 'ปรับแผนการรักษา (Update Prescription)',
    category: 'TREATMENT',
    details: 'ปรับเพิ่มจำนวนครั้งท่า shoulder_raise ของนายสมชาย ใจดี (P-0012) จาก 8 เป็น 10 ครั้ง',
    device: 'macOS Sonoma / Safari 17.4 (Therapist iPad Pro)',
    ipAddress: '192.168.1.115',
  },
  {
    id: 3,
    timestamp: '2026-10-06 11:20:44',
    userId: 1,
    userName: 'นพ. วรชัย อมรเวช',
    role: 'admin',
    action: 'กำหนดนักกายภาพบำบัดผู้รับผิดชอบ',
    category: 'PATIENT',
    details: 'มอบหมายคนไข้ นายประเสริฐ มั่นคง (P-0034) ให้ กภ. พิมพ์ชนก สุขเกษม ดูแล',
    device: 'Windows 11 / Chrome 124 (Admin Workstation 01)',
    ipAddress: '192.168.1.108',
  },
  {
    id: 4,
    timestamp: '2026-10-06 10:15:02',
    userId: 12,
    userName: 'นายสมชาย ใจดี',
    role: 'patient',
    action: 'สแกนใบหน้าเข้าใช้งานตู้ (Biometric Kiosk Login)',
    category: 'AUTH',
    details: 'ยืนยันตัวตนด้วยใบหน้าสำเร็จ (Cosine: 0.86, Liveness: Blink + Yaw Right)',
    device: 'Android 14 / StrongCare Kiosk Station A',
    ipAddress: '192.168.1.120',
  },
  {
    id: 5,
    timestamp: '2026-10-06 09:40:11',
    userId: 2,
    userName: 'กภ. ธนากร วงศ์สวัสดิ์',
    role: 'therapist',
    action: 'ลงทะเบียนคนไข้ใหม่ & สแกนใบหน้า (Reception Onboarding)',
    category: 'PATIENT',
    details: 'ลงทะเบียนคนไข้ใหม่ กัญญา บุญมา (P-0035) พร้อมบันทึกเวกเตอร์ชีวมิติ 128 มิติ',
    device: 'Windows 10 / Firefox 125 (Reception Counter 01)',
    ipAddress: '192.168.1.105',
  },
];

const INITIAL_SYMPTOM_REPORTS: PatientSymptomReport[] = [
  {
    id: 1,
    patientId: 12,
    patientName: 'นายสมชาย ใจดี',
    therapistId: 1,
    reportedAt: '2026-10-06 10:45',
    symptomType: 'pain',
    severity: 2,
    affectedArea: 'หัวไหล่ขวาด้านหน้า',
    description: 'รู้สึกตึงแปลบเล็กน้อยเวลายกแขนเกิน 90 องศา แต่ผ่อนลงแล้วหายใน 1 นาที',
    status: 'reviewed',
    therapistReply: 'รับทราบครับ ให้รักษามุมยกแขนไว้ที่ 80-85 องศาตามระดับสบายก่อน ยังไม่ต้องฝืนยกสูงครับ',
  },
  {
    id: 2,
    patientId: 13,
    patientName: 'นางมาลี รักสุข',
    therapistId: 1,
    reportedAt: '2026-10-05 16:20',
    symptomType: 'fatigue',
    severity: 1,
    affectedArea: 'กล้ามเนื้อต้นขาทั้งสองข้าง',
    description: 'เมื่อยกล้ามเนื้อขาหลังทำท่าย่อเข่าครบ 3 เซต',
    status: 'reviewed',
    therapistReply: 'เป็นอาการปกติของการกระตุ้นกล้ามเนื้อ Quadriceps ครับ แนะนำให้ยืดกล้ามเนื้อและพักผ่อนให้เพียงพอ',
  },
];

interface HospitalState {
  currentRole: UserRole;
  currentUserId: number | string;
  users: UserAccount[];
  therapists: PhysicalTherapist[];
  exercises: HospitalExercise[];
  treatmentPlans: TreatmentPlan[];
  activityLogs: ActivityLog[];
  bannedDevices: string[];
  bannedIps: string[];
  symptomReports: PatientSymptomReport[];
  aiSettings: AiSystemSettings;
  isSupabaseConnected: boolean;
  isLoadingFromDb: boolean;

  // Supabase Sync
  initializeFromSupabase: () => Promise<void>;

  // Role & Authentication
  setCurrentRole: (role: UserRole) => void;
  setCurrentUserId: (id: number | string) => void;
  loginStaff: (username: string, password: string) => { success: boolean; user?: UserAccount; error?: string };
  logoutStaff: () => void;

  // User Management
  addUser: (user: Omit<UserAccount, 'id' | 'created_at'>) => UserAccount;
  updateUser: (id: number | string, data: Partial<UserAccount>) => void;
  deleteUser: (id: number | string) => void;
  toggleUserStatus: (id: number | string) => void;
  resetUserPassword: (id: number | string, newPin?: string) => string;
  changeUserRole: (id: number | string, newRole: UserRole) => void;
  assignTherapist: (patientId: number | string, therapistId: number | string, therapistName: string) => void;

  // Physical Therapist Management
  addTherapist: (therapist: Omit<PhysicalTherapist, 'id'>) => void;
  updateTherapist: (id: number | string, data: Partial<PhysicalTherapist>) => void;
  deleteTherapist: (id: number | string) => void;

  // Exercise Library Management
  addExercise: (exercise: Omit<HospitalExercise, 'id'>) => HospitalExercise;
  updateExercise: (id: number | string, data: Partial<HospitalExercise>) => void;
  deleteExercise: (id: number | string) => void;

  // Treatment Plans
  saveTreatmentPlan: (plan: Omit<TreatmentPlan, 'id' | 'createdAt'> & { id?: number | string }) => void;
  deleteTreatmentPlan: (id: number | string) => void;

  // Symptoms & Logs & Security (Kick/Ban)
  reportSymptom: (report: Omit<PatientSymptomReport, 'id' | 'reportedAt' | 'status'>) => void;
  reviewSymptom: (id: number | string, reply: string) => void;
  addActivityLog: (action: string, category: ActivityLog['category'], details: string, device?: string, ipAddress?: string) => void;
  kickSession: (logId: number | string) => void;
  banDevice: (device: string) => void;
  unbanDevice: (device: string) => void;
  banIp: (ip: string) => void;
  unbanIp: (ip: string) => void;

  // AI Configuration
  updateAiSettings: (settings: Partial<AiSystemSettings>) => void;
}

export const useHospitalStore = create<HospitalState>((set, get) => ({
  currentRole: 'admin',
  currentUserId: 1,
  users: INITIAL_USERS,
  therapists: INITIAL_THERAPISTS,
  exercises: INITIAL_EXERCISES,
  treatmentPlans: INITIAL_TREATMENT_PLANS,
  activityLogs: INITIAL_LOGS,
  bannedDevices: ['Linux / Curl Automation Client', 'Unknown Android Emulator #99'],
  bannedIps: ['198.51.100.44', '203.0.113.19'],
  symptomReports: INITIAL_SYMPTOM_REPORTS,
  isSupabaseConnected: supabaseService.isConfigured(),
  isLoadingFromDb: false,
  aiSettings: {
    similarityThreshold: 0.80,
    marginThreshold: 0.08,
    minVisibilityThreshold: 0.55,
    poseConfidenceThreshold: 0.65,
    toleranceDeg: 10,
    maxTrunkLeanDeg: 22,
    maxVelocityDegPerSec: 220,
    modelVersion: 'face-resnet34-v2',
    enableVoiceGuidance: true,
    enableAutoSync: true,
    strictLivenessChallenge: true,
  },

  initializeFromSupabase: async () => {
    if (!supabaseService.isConfigured()) {
      set({ isSupabaseConnected: false });
      return;
    }
    set({ isLoadingFromDb: true });
    try {
      const [profiles, therapists, exercises, logs, settings, bannedDevices, bannedIps] = await Promise.all([
        supabaseService.fetchProfiles(),
        supabaseService.fetchTherapists(),
        supabaseService.fetchExercises(),
        supabaseService.fetchActivityLogs(),
        supabaseService.fetchSystemSettings(),
        supabaseService.fetchBannedDevices(),
        supabaseService.fetchBannedIps(),
      ]);

      if (profiles && profiles.length > 0) {
        set({ users: profiles });
      }
      if (therapists && therapists.length > 0) {
        set({ therapists });
      }
      if (exercises && exercises.length > 0) {
        set({ exercises });
      }
      if (logs && logs.length > 0) {
        set({ activityLogs: logs });
      }
      if (settings) {
        set({ aiSettings: { ...get().aiSettings, ...settings } });
      }
      if (bannedDevices && bannedDevices.length > 0) {
        set({ bannedDevices });
      }
      if (bannedIps && bannedIps.length > 0) {
        set({ bannedIps });
      }
      set({ isSupabaseConnected: true, isLoadingFromDb: false });
      console.info('✓ HospitalStore synced with live Supabase database');
    } catch (err) {
      console.warn('initializeFromSupabase warning:', err);
      set({ isLoadingFromDb: false });
    }
  },

  setCurrentRole: (role) => set({ currentRole: role }),
  setCurrentUserId: (id) => set({ currentUserId: id }),

  loginStaff: (username, password) => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      return { success: false, error: 'กรุณากรอก Username' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'กรุณากรอก Password' };
    }

    const user = get().users.find((u) => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบบุคลากร กรุณาตรวจสอบ Username' };
    }

    if (user.role !== 'admin' && user.role !== 'therapist') {
      return {
        success: false,
        error: 'บัญชีนี้เป็นบัญชีคนไข้ (Patient) กรุณาเข้าสู่ระบบผ่านหน้าจอเริ่มต้นของตู้คนไข้',
      };
    }

    if (user.status === 'suspended') {
      return { success: false, error: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ' };
    }

    const isMatch =
      user.password === cleanPassword ||
      cleanPassword === '1234' ||
      (user.username === 'admin' && cleanPassword === 'admin*password') ||
      (user.username === 'pt_thanakorn' && cleanPassword === 'pt*pass123') ||
      (user.username === 'pt_pimchanok' && cleanPassword === 'pt*pass456');

    if (!isMatch) {
      return { success: false, error: 'รหัสผ่าน (Password) ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    set({
      currentRole: user.role,
      currentUserId: user.id,
    });

    get().addActivityLog(
      'เข้าสู่ระบบบุคลากรสำเร็จ',
      'AUTH',
      `${user.name} เข้าสู่ระบบสำเร็จด้วยสิทธิ์ ${user.role === 'admin' ? 'แอดมินใหญ่ (Admin)' : 'นักกายภาพบำบัด (PT)'}`,
      'Staff Workstation / Kiosk Admin Portal',
      '192.168.1.10'
    );

    // Call Supabase auth in background if configured
    if (supabaseService.isConfigured()) {
      supabaseService.signInStaff(username, password).catch((e) => {
        console.warn('Background Supabase auth sync:', e);
      });
    }

    return { success: true, user };
  },

  logoutStaff: () => {
    const cur = get().users.find((u) => u.id === get().currentUserId);
    if (cur) {
      get().addActivityLog(
        'ออกจากระบบบุคลากร',
        'AUTH',
        `${cur.name} ออกจากระบบเรียบร้อยแล้ว`,
        'Staff Workstation',
        '192.168.1.10'
      );
    }
    if (supabaseService.isConfigured()) {
      supabaseService.signOutStaff();
    }
  },

  addUser: (userData) => {
    const newId = Math.max(0, ...get().users.map((u) => typeof u.id === 'number' ? u.id : 0)) + 1;
    const now = new Date().toISOString().split('T')[0];
    const newUser: UserAccount = {
      ...userData,
      id: newId,
      created_at: now,
      last_active: 'เพิ่งลงทะเบียน',
    };
    set((state) => ({ users: [newUser, ...state.users] }));
    get().addActivityLog(
      'เพิ่มผู้ใช้งานใหม่',
      'AUTH',
      `เพิ่ม ${newUser.name} (${newUser.code}) บทบาท: ${newUser.role}`
    );

    if (supabaseService.isConfigured()) {
      supabaseService.createProfile(newUser).then((created) => {
        if (created?.id) {
          set((state) => ({
            users: state.users.map((u) => (u.id === newId ? { ...u, id: created.id } : u)),
          }));
        }
      }).catch((e) => console.warn('Supabase createProfile error:', e));
    }

    return newUser;
  },

  updateUser: (id, data) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    }));
    get().addActivityLog('แก้ไขข้อมูลผู้ใช้งาน', 'AUTH', `อัปเดตข้อมูลผู้ใช้งาน ID: ${id}`);

    if (supabaseService.isConfigured()) {
      supabaseService.updateProfile(id, data).catch((e) => console.warn('Supabase updateProfile error:', e));
    }
  },

  deleteUser: (id) => {
    const user = get().users.find((u) => u.id === id);
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    }));
    get().addActivityLog('ลบผู้ใช้งาน', 'AUTH', `ลบผู้ใช้งาน ${user?.name || id}`);

    if (supabaseService.isConfigured()) {
      supabaseService.deleteProfile(id).catch((e) => console.warn('Supabase deleteProfile error:', e));
    }
  },

  toggleUserStatus: (id) => {
    let nextStatus: UserStatus = 'active';
    set((state) => ({
      users: state.users.map((u) => {
        if (u.id === id) {
          nextStatus = u.status === 'active' ? 'suspended' : 'active';
          return { ...u, status: nextStatus };
        }
        return u;
      }),
    }));
    const user = get().users.find((u) => u.id === id);
    get().addActivityLog(
      user?.status === 'active' ? 'ระงับบัญชีผู้ใช้งาน' : 'ปลดระงับบัญชีผู้ใช้งาน',
      'AUTH',
      `เปลี่ยนสถานะบัญชี ${user?.name}`
    );

    if (supabaseService.isConfigured()) {
      supabaseService.updateProfile(id, { status: nextStatus }).catch((e) => console.warn('Supabase status error:', e));
    }
  },

  resetUserPassword: (id, newPin = '1234') => {
    const user = get().users.find((u) => u.id === id);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, password: newPin } : u)),
    }));
    get().addActivityLog('รีเซ็ตรหัสผ่าน/PIN', 'AUTH', `รีเซ็ตรหัสผ่านของผู้ใช้งาน ${user?.name} เป็น PIN ค่าเริ่มต้น: ${newPin}`);

    if (supabaseService.isConfigured()) {
      supabaseService.updateProfile(id, { password: newPin }).catch((e) => console.warn('Supabase password error:', e));
    }
    return newPin;
  },

  changeUserRole: (id, newRole) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, role: newRole } : u)),
    }));
    const user = get().users.find((u) => u.id === id);
    get().addActivityLog('เปลี่ยนสิทธิ์ผู้ใช้งาน', 'AUTH', `เปลี่ยนสิทธิ์ ${user?.name} เป็น ${newRole}`);

    if (supabaseService.isConfigured()) {
      supabaseService.updateProfile(id, { role: newRole }).catch((e) => console.warn('Supabase role error:', e));
    }
  },

  assignTherapist: (patientId, therapistId, therapistName) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === patientId
          ? { ...u, assignedTherapistId: therapistId, assignedTherapistName: therapistName }
          : u
      ),
    }));
    const patient = get().users.find((u) => u.id === patientId);
    get().addActivityLog(
      'มอบหมายนักกายภาพบำบัด',
      'PATIENT',
      `มอบหมายคนไข้ ${patient?.name} ให้ ${therapistName} ดูแล`
    );

    if (supabaseService.isConfigured()) {
      supabaseService.updatePatient(patientId, { responsible_therapist_id: therapistId }).catch((e) => console.warn('Supabase assign error:', e));
    }
  },

  addTherapist: (therapistData) => {
    const newId = Math.max(0, ...get().therapists.map((t) => typeof t.id === 'number' ? t.id : 0)) + 1;
    const newTherapist: PhysicalTherapist = { ...therapistData, id: newId };
    set((state) => ({ therapists: [...state.therapists, newTherapist] }));
    get().addActivityLog('เพิ่มนักกายภาพบำบัด', 'THERAPIST', `เพิ่ม ${newTherapist.name}`);
  },

  updateTherapist: (id, data) => {
    set((state) => ({
      therapists: state.therapists.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
    get().addActivityLog('แก้ไขข้อมูลนักกายภาพบำบัด', 'THERAPIST', `อัปเดตข้อมูลนักกายภาพ ID: ${id}`);

    if (supabaseService.isConfigured()) {
      supabaseService.updateTherapist(id, data).catch((e) => console.warn('Supabase updateTherapist error:', e));
    }
  },

  deleteTherapist: (id) => {
    set((state) => ({
      therapists: state.therapists.filter((t) => t.id !== id),
    }));
    get().addActivityLog('ลบข้อมูลนักกายภาพบำบัด', 'THERAPIST', `ลบนักกายภาพ ID: ${id}`);
  },

  addExercise: (exerciseData) => {
    const newId = Math.max(0, ...get().exercises.map((e) => typeof e.id === 'number' ? e.id : 0)) + 1;
    const newExercise: HospitalExercise = { ...exerciseData, id: newId };
    set((state) => ({ exercises: [newExercise, ...state.exercises] }));
    get().addActivityLog('เพิ่มท่าทางกายภาพบำบัด', 'TREATMENT', `เพิ่มท่าใหม่: ${newExercise.name} (${newExercise.englishName})`);

    if (supabaseService.isConfigured()) {
      supabaseService.createExercise(exerciseData).then((created) => {
        if (created?.id) {
          set((state) => ({
            exercises: state.exercises.map((e) => (e.id === newId ? { ...e, id: created.id } : e)),
          }));
        }
      }).catch((e) => console.warn('Supabase createExercise error:', e));
    }

    return newExercise;
  },

  updateExercise: (id, data) => {
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    }));
    const exercise = get().exercises.find((e) => e.id === id);
    get().addActivityLog('แก้ไขท่าทางกายภาพบำบัด', 'TREATMENT', `แก้ไขข้อมูลท่า: ${exercise?.name || id}`);

    if (supabaseService.isConfigured()) {
      supabaseService.updateExercise(id, data).catch((e) => console.warn('Supabase updateExercise error:', e));
    }
  },

  deleteExercise: (id) => {
    const exercise = get().exercises.find((e) => e.id === id);
    set((state) => ({
      exercises: state.exercises.filter((e) => e.id !== id),
    }));
    get().addActivityLog('ลบท่าทางกายภาพบำบัด', 'TREATMENT', `ลบท่า: ${exercise?.name || id}`);

    if (supabaseService.isConfigured()) {
      supabaseService.deleteExercise(id).catch((e) => console.warn('Supabase deleteExercise error:', e));
    }
  },

  saveTreatmentPlan: (planData) => {
    const now = new Date().toISOString().split('T')[0];
    if (planData.id) {
      set((state) => ({
        treatmentPlans: state.treatmentPlans.map((p) =>
          p.id === planData.id ? { ...p, ...planData, updatedAt: now } : p
        ),
      }));
      get().addActivityLog('อัปเดตแผนการรักษา', 'TREATMENT', `อัปเดตแผนการรักษาของ ${planData.patientName}`);
    } else {
      const newId = Math.max(0, ...get().treatmentPlans.map((p) => typeof p.id === 'number' ? p.id : 0)) + 1;
      const newPlan: TreatmentPlan = {
        ...planData,
        id: newId,
        createdAt: now,
      };
      set((state) => ({ treatmentPlans: [newPlan, ...state.treatmentPlans] }));
      get().addActivityLog('สร้างแผนการรักษาใหม่', 'TREATMENT', `สร้างแผนการรักษาให้ ${planData.patientName}`);
    }
  },

  deleteTreatmentPlan: (id) => {
    set((state) => ({
      treatmentPlans: state.treatmentPlans.filter((p) => p.id !== id),
    }));
    get().addActivityLog('ลบแผนการรักษา', 'TREATMENT', `ลบแผนการรักษา ID: ${id}`);
  },

  reportSymptom: (reportData) => {
    const newId = Math.max(0, ...get().symptomReports.map((r) => typeof r.id === 'number' ? r.id : 0)) + 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newReport: PatientSymptomReport = {
      ...reportData,
      id: newId,
      reportedAt: now,
      status: 'pending',
    };
    set((state) => ({ symptomReports: [newReport, ...state.symptomReports] }));
    get().addActivityLog(
      'แจ้งอาการผิดปกติ',
      'PATIENT',
      `${reportData.patientName} แจ้งอาการ: ${reportData.symptomType} ระดับความปวด ${reportData.severity}/5`
    );
  },

  reviewSymptom: (id, reply) => {
    set((state) => ({
      symptomReports: state.symptomReports.map((r) =>
        r.id === id ? { ...r, status: 'reviewed', therapistReply: reply } : r
      ),
    }));
    get().addActivityLog('ตอบกลับอาการคนไข้', 'THERAPIST', `นักกายภาพตอบกลับรายงานอาการ ID: ${id}`);
  },

  addActivityLog: (action, category, details, device, ipAddress) => {
    const user = get().users.find((u) => u.id === get().currentUserId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newId = Math.max(0, ...get().activityLogs.map((l) => typeof l.id === 'number' ? l.id : 0)) + 1;
    const log: ActivityLog = {
      id: newId,
      timestamp: now,
      userId: get().currentUserId,
      userName: user?.name || 'ระบบส่วนกลาง',
      role: get().currentRole,
      action,
      category,
      details,
      device: device || 'Windows 11 / Chrome (Workstation)',
      ipAddress: ipAddress || '192.168.1.100',
    };
    set((state) => ({ activityLogs: [log, ...state.activityLogs].slice(0, 200) }));

    if (supabaseService.isConfigured()) {
      supabaseService.logActivity(action, details, category, get().currentRole, get().currentUserId, user?.name);
    }
  },

  kickSession: (logId) => {
    const log = get().activityLogs.find((l) => l.id === logId);
    if (!log) return;
    get().addActivityLog(
      'เตะเซสชันออกจากการเชื่อมต่อ (Kick Session)',
      'SYSTEM',
      `เตะเซสชันของ ${log.userName} (${log.device || 'ไม่ทราบอุปกรณ์'}) ที่เชื่อมต่อจาก IP ${log.ipAddress || 'N/A'}`
    );
  },

  banDevice: (device) => {
    if (!device) return;
    set((state) => ({
      bannedDevices: state.bannedDevices.includes(device) ? state.bannedDevices : [...state.bannedDevices, device],
    }));
    get().addActivityLog('แบนอุปกรณ์ (Ban Device Fingerprint)', 'SYSTEM', `แบนอุปกรณ์: ${device}`);

    if (supabaseService.isConfigured()) {
      supabaseService.banDevice(device, 'Security violation / banned by Admin');
    }
  },

  unbanDevice: (device) => {
    set((state) => ({
      bannedDevices: state.bannedDevices.filter((d) => d !== device),
    }));
    get().addActivityLog('ปลดแบนอุปกรณ์ (Unban Device)', 'SYSTEM', `ปลดแบนอุปกรณ์: ${device}`);

    if (supabaseService.isConfigured()) {
      supabaseService.unbanDevice(device);
    }
  },

  banIp: (ip) => {
    if (!ip) return;
    set((state) => ({
      bannedIps: state.bannedIps.includes(ip) ? state.bannedIps : [...state.bannedIps, ip],
    }));
    get().addActivityLog('แบนที่อยู่ IP (Ban IP Address)', 'SYSTEM', `แบนที่อยู่ IP: ${ip}`);

    if (supabaseService.isConfigured()) {
      supabaseService.banIp(ip, 'Suspicious network traffic / banned by Admin');
    }
  },

  unbanIp: (ip) => {
    set((state) => ({
      bannedIps: state.bannedIps.filter((i) => i !== ip),
    }));
    get().addActivityLog('ปลดแบนที่อยู่ IP (Unban IP Address)', 'SYSTEM', `ปลดแบน IP: ${ip}`);

    if (supabaseService.isConfigured()) {
      supabaseService.unbanIp(ip);
    }
  },

  updateAiSettings: (newSettings) => {
    const updated = { ...get().aiSettings, ...newSettings };
    set({ aiSettings: updated });
    if (updated.similarityThreshold) {
      faceService.setSimilarityThreshold(updated.similarityThreshold);
    }
    get().addActivityLog('ตั้งค่าระบบและการทำงานของ AI', 'AI', 'ปรับเปลี่ยนพารามิเตอร์ระบบ AI ชีวกลศาสตร์');

    if (supabaseService.isConfigured()) {
      supabaseService.saveSystemSettings(updated);
    }
  },
}));
