import { create } from 'zustand';
import {
  UserAccount,
  UserRole,
  UserStatus,
  PhysicalTherapist,
  TreatmentPlan,
  ActivityLog,
  PatientSymptomReport,
  AiSystemSettings,
} from '../types/hospital';

const INITIAL_THERAPISTS: PhysicalTherapist[] = [
  {
    id: 1,
    code: 'T-003',
    name: 'กภ. ธนากร วงศ์สวัสดิ์',
    specialty: 'กายภาพบำบัดระบบกล้ามเนื้อและกระดูก (Orthopedic PT)',
    phone: '081-456-7890',
    email: 'thanakorn.w@strongcare.hospital',
    activePatientsCount: 14,
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
    assignedTherapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
    assignedTherapistId: 1,
    phone: '081-998-1122',
    age: 68,
    gender: 'male',
    diagnosis: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder - Subacute Phase)',
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
    assignedTherapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
    assignedTherapistId: 1,
    phone: '084-332-9900',
    age: 72,
    gender: 'female',
    diagnosis: 'ข้อเข่าเสื่อมระยะที่ 2 และกล้ามเนื้อต้นขาอ่อนแรง (Knee OA Grade 2)',
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
    assignedTherapistName: 'ยังไม่ได้กำหนด',
    phone: '089-445-5667',
    age: 65,
    gender: 'male',
    diagnosis: 'ปวดหลังส่วนล่างเรื้อรัง (Chronic Low Back Pain)',
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
    assignedTherapistName: 'กภ. พิมพ์ชนก สุขเกษม',
    assignedTherapistId: 2,
    phone: '087-654-3210',
    age: 75,
    gender: 'female',
    diagnosis: 'ฟื้นฟูหลังผ่าตัดเปลี่ยนข้อสะโพกเทียม (Post THA)',
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
    assignedTherapistName: 'กภ. พิมพ์ชนก สุขเกษม',
    assignedTherapistId: 2,
    phone: '082-111-2233',
    age: 70,
    gender: 'male',
    diagnosis: 'โรคหลอดเลือดสมองระยะฟื้นตัว กล้ามเนื้อซีกขวาอ่อนแรง (Post Stroke Hemiparesis)',
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
    assignedTherapistName: 'ยังไม่ได้กำหนด',
    phone: '085-889-9001',
    age: 63,
    gender: 'female',
    diagnosis: 'กลุ่มอาการปวดกล้ามเนื้อคอบ่าเรื้อรัง (Myofascial Pain Syndrome)',
    created_at: '2026-02-22',
    last_active: 'วันนี้ 11:20',
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
  currentUserId: number;
  users: UserAccount[];
  therapists: PhysicalTherapist[];
  treatmentPlans: TreatmentPlan[];
  activityLogs: ActivityLog[];
  symptomReports: PatientSymptomReport[];
  aiSettings: AiSystemSettings;

  // Role switching
  setCurrentRole: (role: UserRole) => void;
  setCurrentUserId: (id: number) => void;

  // User Management
  addUser: (user: Omit<UserAccount, 'id' | 'created_at'>) => UserAccount;
  updateUser: (id: number, data: Partial<UserAccount>) => void;
  deleteUser: (id: number) => void;
  toggleUserStatus: (id: number) => void;
  resetUserPassword: (id: number, newPin?: string) => string;
  changeUserRole: (id: number, newRole: UserRole) => void;
  assignTherapist: (patientId: number, therapistId: number, therapistName: string) => void;

  // Physical Therapist Management
  addTherapist: (therapist: Omit<PhysicalTherapist, 'id'>) => void;
  updateTherapist: (id: number, data: Partial<PhysicalTherapist>) => void;
  deleteTherapist: (id: number) => void;

  // Treatment Plans
  saveTreatmentPlan: (plan: Omit<TreatmentPlan, 'id' | 'createdAt'> & { id?: number }) => void;
  deleteTreatmentPlan: (id: number) => void;

  // Symptoms & Logs
  reportSymptom: (report: Omit<PatientSymptomReport, 'id' | 'reportedAt' | 'status'>) => void;
  reviewSymptom: (id: number, reply: string) => void;
  addActivityLog: (action: string, category: ActivityLog['category'], details: string) => void;

  // AI Configuration
  updateAiSettings: (settings: Partial<AiSystemSettings>) => void;
}

export const useHospitalStore = create<HospitalState>((set, get) => ({
  currentRole: 'admin',
  currentUserId: 1,
  users: INITIAL_USERS,
  therapists: INITIAL_THERAPISTS,
  treatmentPlans: INITIAL_TREATMENT_PLANS,
  activityLogs: INITIAL_LOGS,
  symptomReports: INITIAL_SYMPTOM_REPORTS,
  aiSettings: {
    similarityThreshold: 0.82,
    marginThreshold: 0.08,
    minVisibilityThreshold: 0.35,
    maxTrunkLeanDeg: 22,
    maxVelocityDegPerSec: 220,
    modelVersion: 'face-resnet34-v2',
    enableVoiceGuidance: true,
    enableAutoSync: true,
    strictLivenessChallenge: true,
  },

  setCurrentRole: (role) => set({ currentRole: role }),
  setCurrentUserId: (id) => set({ currentUserId: id }),

  addUser: (userData) => {
    const newId = Math.max(0, ...get().users.map((u) => u.id)) + 1;
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
    return newUser;
  },

  updateUser: (id, data) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    }));
    get().addActivityLog('แก้ไขข้อมูลผู้ใช้งาน', 'AUTH', `อัปเดตข้อมูลผู้ใช้งาน ID: ${id}`);
  },

  deleteUser: (id) => {
    const user = get().users.find((u) => u.id === id);
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    }));
    get().addActivityLog('ลบผู้ใช้งาน', 'AUTH', `ลบผู้ใช้งาน ${user?.name || id}`);
  },

  toggleUserStatus: (id) => {
    set((state) => ({
      users: state.users.map((u) => {
        if (u.id === id) {
          const nextStatus: UserStatus = u.status === 'active' ? 'suspended' : 'active';
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
  },

  resetUserPassword: (id, newPin = '1234') => {
    const user = get().users.find((u) => u.id === id);
    get().addActivityLog('รีเซ็ตรหัสผ่าน/PIN', 'AUTH', `รีเซ็ตรหัสผ่านของผู้ใช้งาน ${user?.name} เป็น PIN ค่าเริ่มต้น`);
    return newPin;
  },

  changeUserRole: (id, newRole) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, role: newRole } : u)),
    }));
    const user = get().users.find((u) => u.id === id);
    get().addActivityLog('เปลี่ยนสิทธิ์ผู้ใช้งาน', 'AUTH', `เปลี่ยนสิทธิ์ ${user?.name} เป็น ${newRole}`);
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
  },

  addTherapist: (therapistData) => {
    const newId = Math.max(0, ...get().therapists.map((t) => t.id)) + 1;
    const newTherapist: PhysicalTherapist = { ...therapistData, id: newId };
    set((state) => ({ therapists: [...state.therapists, newTherapist] }));
    get().addActivityLog('เพิ่มนักกายภาพบำบัด', 'THERAPIST', `เพิ่ม ${newTherapist.name}`);
  },

  updateTherapist: (id, data) => {
    set((state) => ({
      therapists: state.therapists.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
    get().addActivityLog('แก้ไขข้อมูลนักกายภาพบำบัด', 'THERAPIST', `อัปเดตข้อมูลนักกายภาพ ID: ${id}`);
  },

  deleteTherapist: (id) => {
    set((state) => ({
      therapists: state.therapists.filter((t) => t.id !== id),
    }));
    get().addActivityLog('ลบข้อมูลนักกายภาพบำบัด', 'THERAPIST', `ลบนักกายภาพ ID: ${id}`);
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
      const newId = Math.max(0, ...get().treatmentPlans.map((p) => p.id)) + 1;
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
    const newId = Math.max(0, ...get().symptomReports.map((r) => r.id)) + 1;
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

  addActivityLog: (action, category, details) => {
    const user = get().users.find((u) => u.id === get().currentUserId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newId = Math.max(0, ...get().activityLogs.map((l) => l.id)) + 1;
    const log: ActivityLog = {
      id: newId,
      timestamp: now,
      userId: get().currentUserId,
      userName: user?.name || 'ระบบส่วนกลาง',
      role: get().currentRole,
      action,
      category,
      details,
    };
    set((state) => ({ activityLogs: [log, ...state.activityLogs].slice(0, 200) }));
  },

  updateAiSettings: (newSettings) => {
    set((state) => ({
      aiSettings: { ...state.aiSettings, ...newSettings },
    }));
    get().addActivityLog('ตั้งค่าระบบและการทำงานของ AI', 'AI', 'ปรับเปลี่ยนพารามิเตอร์ระบบ AI ชีวกลศาสตร์');
  },
}));
