import React, { useState } from 'react';
import {
  X,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  UserCheck,
  Eye,
  Compass,
  Activity,
  Layers,
  Zap,
  Lock,
  Edit3,
  XCircle,
  Clock,
  Wifi,
  Database,
  Camera,
  BookOpen,
  HelpCircle,
  Mic,
  AlertOctagon,
  Check,
  ExternalLink
} from 'lucide-react';
import { PatientJourneyBanner } from '../Progress/PatientJourneyBanner';

interface CompetitionDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

interface DemoStage {
  id: string;
  timeRange: string;
  stepNum: number;
  name: string;
  badge: string;
  confidence: number;
  desc: string;
  rule: string;
  presenterScript: string;
  forbiddenPhrases: string[];
  keySoundbites: string[];
}

interface JudgeQAItem {
  id: number;
  question: string;
  quickAnswer: string;
  fullRationale: string;
  cautionTrap: string;
  category: 'AI_SAFETY' | 'BIOMETRICS' | 'CLINICAL' | 'ARCHITECTURE';
}

export const CompetitionDemoModal: React.FC<CompetitionDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'RUNBOOK' | 'JUDGE_QA'>('RUNBOOK');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(true);
  const [isTeleprompterMode, setIsTeleprompterMode] = useState<boolean>(true);

  // Simulation mock states
  const [approvalDecision, setApprovalDecision] = useState<'APPROVED' | 'MODIFIED' | 'REJECTED' | null>(null);
  const [activeQaFilter, setActiveQaFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const demoStages: DemoStage[] = [
    {
      id: 'open',
      timeRange: '00:00 - 00:20',
      stepNum: 1,
      name: 'เปิด Strong Care (Platform Overview)',
      badge: 'Architecture Ready',
      confidence: 100,
      desc: 'แนะนำแพลตฟอร์ม Strong Care v1.0 — ระบบ AI-assisted ติดตามและวิเคราะห์การฟื้นฟูกายภาพบำบัดด้วย Privacy by Design และ Clinical Governance',
      rule: 'ห้ามเคลมว่า AI วินิจฉัยโรค หรือปลอดภัย 100%',
      presenterScript: '“สวัสดีครับกรรมการทุกท่าน วันนี้เราขอแนะนำ Strong Care v1.0 แพลตฟอร์มช่วยติดตามและวิเคราะห์การฝึกกายภาพด้วย AI สำหรับผู้สูงอายุและผู้ป่วยฟื้นฟูสมรรถภาพ โดยมีแกนหลักคือความปลอดภัยทางการแพทย์ การรักษาความเป็นส่วนตัว และการมีมนุษย์เป็นผู้ตัดสินใจสูงสุด (Human Oversight)”',
      forbiddenPhrases: ['AI วินิจฉัยผู้ป่วย', 'ระบบปลอดภัย 100%', 'PDPA Compliant (ถ้ายังไม่มีใบรับรอง)'],
      keySoundbites: ['AI-assisted Platform', 'Privacy by Design', 'Clinical Governance'],
    },
    {
      id: 'face',
      timeRange: '00:20 - 00:40',
      stepNum: 2,
      name: 'Face Authentication (128-D Projection)',
      badge: 'Face Match 98%',
      confidence: 98,
      desc: 'ตรวจจับโครงสร้างใบหน้าผ่าน MediaPipe Holistic สกัด Geometric Features Projection เป็นเวกเตอร์ 128 มิติ เข้ารหัสและเก็บเฉพาะเวกเตอร์ ไม่ส่งรูปภาพขึ้นคลาวด์',
      rule: 'Confidence < 85% → ปฏิเสธการเข้าใช้งาน / บล็อกการฝึก',
      presenterScript: '“ก่อนเริ่มฝึก ระบบยืนยันตัวตนด้วย Anthropometric Geometric Projection 128 มิติ โดยคำนวณจากสัดส่วนกายวิภาค เช่น ระยะระหว่างดวงตา (IOD) และโครงสร้างโหนกแก้ม โดยไม่มีการส่งภาพถ่ายใบหน้าขึ้นคลาวด์แม้แต่ภาพเดียว”',
      forbiddenPhrases: ['เก็บรูปถ่ายคนไข้ไว้บน Cloud', 'ใช้แค่ landmarks.slice(0, 128)'],
      keySoundbites: ['128-D Feature Embedding', 'IOD Normalization', 'Zero Raw Image Storage'],
    },
    {
      id: 'liveness',
      timeRange: '00:40 - 01:00',
      stepNum: 3,
      name: 'Liveness Verification (Anti-Spoofing)',
      badge: 'Liveness 96%',
      confidence: 96,
      desc: 'วิเคราะห์พลวัตการกระพริบตาธรรมชาติ (Eye Aspect Ratio - EAR) และการหันศีรษะ (Head Yaw) ป้องกันการนำรูปถ่ายหรือจอมือถือมาหลอกระบบ',
      rule: 'ภาพถ่ายนิ่ง / ไม่มีพลวัตกระพริบตา → Reject ทันที',
      presenterScript: '“เพื่อป้องกัน Presentation Attack ระบบตรวจจับการกะพริบตาธรรมชาติด้วย Eye Aspect Ratio และตรวจจับการเอียงศีรษะ หากมีผู้นำรูปถ่ายนิ่งหรือหน้าจอมือถือมาวาง ระบบจะ Reject ทันที”',
      forbiddenPhrases: ['ไม่มีทางโดนหลอก 100%'],
      keySoundbites: ['Dynamic EAR Analysis', 'Presentation Attack Detection', 'Anti-Spoofing Gate'],
    },
    {
      id: 'calibration',
      timeRange: '01:00 - 01:20',
      stepNum: 4,
      name: '5-Point Calibration (Readiness Gate)',
      badge: 'Readiness 100%',
      confidence: 99,
      desc: 'ประเมิน 5 เงื่อนไขความพร้อม: แสงสว่างเพียงพอ, ระยะห่างกล้อง 1.8-2.5m, ลำตัวครบทั้ง 33 จุดในเฟรม, กระดูกสันหลังตั้งตรง, และนับถอยหลังเตรียมตัว',
      rule: 'ข้อต่อไม่ครบ หรือระยะไม่ได้เกณฑ์ → ไม่อนุญาตให้เริ่มฝึก',
      presenterScript: '“เมื่อยืนยันตัวตนสำเร็จ ระบบจะเข้าสู่ 5-Point Calibration เพื่อเตรียมสภาพแวดล้อมให้ปลอดภัย ทั้งระยะห่าง แสงสว่าง และการตรวจจับข้อต่อ หากคนไข้ยืนไม่ตรงหรือมีสิ่งกีดขวาง ระบบจะไม่เริ่มนับรอบ”',
      forbiddenPhrases: ['ใครๆ ก็ฝึกได้ทันทีโดยไม่ต้องตรวจ'],
      keySoundbites: ['5-Point Calibration', 'Pre-Exercise Readiness', 'Safety Calibration Gate'],
    },
    {
      id: 'pose',
      timeRange: '01:20 - 02:00',
      stepNum: 5,
      name: 'Live Pose + Biomechanics (Kinematics)',
      badge: 'Pose Conf. 97%',
      confidence: 97,
      desc: 'ประมวลผลท่าทาง 33 จุด คำนวณมุมข้อต่อ (Joint Angles) และ AROM ด้วยเวกเตอร์ตรีโกณมิติแบบเรียลไทม์ 30-60 FPS บนเครื่องผู้ใช้',
      rule: 'Confidence < 50% → NO DECISION / NO REP เด็ดขาด',
      presenterScript: '“ระหว่างการฝึก Engine จะวิเคราะห์ชีวกลศาสตร์แบบเรียลไทม์บนเครื่อง ทั้งมุมองศา Active ROM และความเร็วเชิงมุม โดยมีกฎเหล็กว่า หากความมั่นใจในการตรวจจับต่ำกว่าเกณฑ์ ระบบจะไม่ตัดสินผล และไม่เพิ่มจำนวนรอบเด็ดขาด”',
      forbiddenPhrases: ['ระบบคำนวณถูกต้อง 100% ทุกมุม'],
      keySoundbites: ['Active Range of Motion (AROM)', 'Vector Dot Product', 'Client-Side WebAssembly'],
    },
    {
      id: 'safety',
      timeRange: '02:00 - 02:30',
      stepNum: 6,
      name: 'Safety Event Real Halt (สั่งหยุดจริง)',
      badge: 'Emergency Stop Active',
      confidence: 99,
      desc: 'จำลองเหตุการณ์จริง: คนไข้เอียงตัวชดเชย Trunk Lean 24° (> เกณฑ์ระบบ 22°) → Watchdog สั่ง Emergency Stop ทันที, ตัวจับเวลาหยุด, ไม่เพิ่ม Rep, และ Voice Preemption ตัดบทพูดเตือนทันที',
      rule: 'Trunk Lean > 22° → STOP ทันที คนไข้ต้องแก้ท่าก่อน Resume',
      presenterScript: '“นี่คือหัวใจของความปลอดภัยครับ เมื่อคนไข้เกิดการเอียงตัวชดเชย 24 องศา ซึ่งเกินกว่าเกณฑ์ความปลอดภัยของระบบที่ตั้งไว้ 22 องศา ระบบจะสั่งหยุดฉุกเฉินจริง ตัวจับเวลาหยุด ตัวนับรอบหยุด และเสียงเตือนจะแทรกบทพูดปกติทันที”',
      forbiddenPhrases: ['22° คือมาตรฐานการแพทย์สากลที่ทุกโรงพยาบาลใช้'],
      keySoundbites: ['System-configured Safety Threshold', 'Immediate Voice Preemption', 'Safety Watchdog Real Halt'],
    },
    {
      id: 'progress',
      timeRange: '02:30 - 03:00',
      stepNum: 7,
      name: 'Progress / Baseline (Performance Trend)',
      badge: 'Improvement +31.7%',
      confidence: 96,
      desc: 'เปรียบเทียบ Baseline แรกเข้า (82°) กับปัจจุบัน (108°, +31.7%) แสดงแนวโน้มพัฒนาการเชิงตัวเลขตลอด 5 เซสชัน',
      rule: 'ห้ามพูดว่าผู้ป่วยหายดีแล้ว ให้ใช้ Performance Trend แทน',
      presenterScript: '“ในด้านพัฒนาการ Strong Care ไม่ได้บอกว่าคนไข้หายแล้ว แต่แสดงเป็น Performance Trend เชิงประจักษ์ เปรียบเทียบจาก Baseline แรกรับ 82 องศา สู่ 108 องศาในปัจจุบัน ซึ่งพัฒนาขึ้น 31.7%”',
      forbiddenPhrases: ['AI รู้ว่าคนไข้หายดีแล้ว', 'ผู้ป่วยหายเป็นปกติแล้ว'],
      keySoundbites: ['Patient Baseline', 'Performance Trend', 'Empirical ROM Delta'],
    },
    {
      id: 'xai',
      timeRange: '03:00 - 03:30',
      stepNum: 8,
      name: 'Explainable AI (เหตุผลประกอบคำแนะนำ)',
      badge: 'XAI Recommendation',
      confidence: 96,
      desc: 'ระบบระบุเหตุผลชัดเจน: Accuracy > 90%, ROM เพิ่มขึ้นอย่างต่อเนื่อง, และไม่มี Safety Event ใน 3 เซสชันล่าสุด → เสนอปรับ Target ROM จาก 110° เป็น 115°',
      rule: 'AI ไม่สุ่มแนะนำ ทุกข้อเสนอมีหลักฐานทางชีวกลศาสตร์รองรับ',
      presenterScript: '“เมื่อระบบเสนอปรับเป้าหมายจาก 110 เป็น 115 องศา ระบบสามารถตอบคำถามกรรมการได้ทันทีว่า ทำไมถึงแนะนำเช่นนี้ เพราะ Accuracy สูงกว่า 90% มีพัฒนาการองศาเพิ่มขึ้นต่อเนื่อง และไม่มี Safety Event ตลอด 3 เซสชันล่าสุด”',
      forbiddenPhrases: ['AI รู้ใจคนไข้', 'AI สั่งจ่ายยาเอง'],
      keySoundbites: ['Explainable AI (XAI)', 'Clinical Evidence Chain', 'Prescription Recommendation'],
    },
    {
      id: 'approval',
      timeRange: '03:30 - 04:00',
      stepNum: 9,
      name: 'Therapist Approval Gate (Security Boundary)',
      badge: 'Human-in-the-Loop',
      confidence: 100,
      desc: 'AI เสนอได้ แต่ AI ไม่มีสิทธิ์แก้ Prescription ลงฐานข้อมูลโดยตรง ข้อเสนอถูกกักที่ PENDING_CLINICAL_APPROVAL รอให้นักกายภาพเป็นผู้เซ็น APPROVE, MODIFY, หรือ REJECT',
      rule: 'ห้ามมีทางเดินข้อมูลจาก AI ไปยัง Database โดยตรง',
      presenterScript: '“จุดขายสำคัญด้าน Governance คือ AI เสนอได้ แต่ไม่มีสิทธิ์เปลี่ยนแผนการรักษาเองเด็ดขาด ข้อเสนอจะถูกกักไว้ที่ Approval Gate เพื่อให้นักกายภาพหรือแพทย์เป็นผู้กด Approve หรือปรับเปลี่ยน พร้อมบันทึก Digital Audit Trail กำกับทุกครั้ง”',
      forbiddenPhrases: ['AI อัปเดตแผนการรักษาลงฐานข้อมูลอัตโนมัติ'],
      keySoundbites: ['Approval Gate Security Boundary', 'Human-in-the-Loop Gate', 'Clinical Governance Audit Trail'],
    },
    {
      id: 'offline',
      timeRange: '04:00 - 04:30',
      stepNum: 10,
      name: 'Offline / StrongCareDB Sync',
      badge: 'Offline-First Ready',
      confidence: 100,
      desc: 'การประมวลผลภาพทำบนเครื่อง 100% หากเน็ตหลุด เซสชันจะถูกเก็บลง StrongCareDB (IndexedDB) และเข้าคิว Sync อัตโนมัติเมื่อต่ออินเทอร์เน็ต',
      rule: 'Core rehabilitation monitoring operates offline',
      presenterScript: '“แม้สัญญาณอินเทอร์เน็ตจะขาดหาย Core Rehabilitation ของ Strong Care ก็ยังทำงานได้สมบูรณ์บนเครื่อง ข้อมูลจะถูกพักไว้ใน StrongCareDB และซิงค์ขึ้นระบบเฉพาะสรุปผลเมื่อกลับมาออนไลน์ จึงตอบโจทย์พื้นที่ห่างไกลได้อย่างแท้จริง”',
      forbiddenPhrases: ['ต้องต่ออินเทอร์เน็ตความเร็วสูงตลอดเวลา'],
      keySoundbites: ['Edge AI Architecture', 'StrongCareDB (IndexedDB)', 'Offline-First Resilience'],
    },
    {
      id: 'failsafe',
      timeRange: '04:30 - 05:00',
      stepNum: 11,
      name: 'Fail-Safe Matrix (10/10 Verification) & บทสรุป',
      badge: '10/10 Verified Safe',
      confidence: 100,
      desc: 'พิสูจน์ความปลอดภัยด้วย Automated 10/10 Fail-Safe Test Suite ที่รันผ่านทุกกรณี: กล้องหลุด, ท่าทางเอียง, เน็ตหลุด, Liveness ปลอม, และ AI กักกันข้อเสนอ',
      rule: 'พิสูจน์ด้วยโค้ดทดสอบจริง ไม่ใช่เพียงคำอ้างบนสไลด์',
      presenterScript: '“สุดท้ายนี้ เราไม่ได้แค่พูดว่าระบบปลอดภัย แต่เรามี Automated Fail-Safe Test Suite ที่ทดสอบผ่านจริง 10 จาก 10 ด่านความปลอดภัย Strong Care จึงไม่ใช่แค่เว็บตรวจจับท่าทาง แต่เป็น AI Rehabilitation Platform ที่พร้อมใช้งานอย่างรับผิดชอบและมีธรรมาภิบาล ขอบคุณครับ”',
      forbiddenPhrases: ['เราเป็นระบบที่ดีที่สุดในโลก'],
      keySoundbites: ['10/10 Clinical Fail-Safe', 'Automated Verification Harness', 'Responsible AI in Healthcare'],
    },
  ];

  const judgeQAList: JudgeQAItem[] = [
    {
      id: 1,
      category: 'AI_SAFETY',
      question: 'AI สามารถเปลี่ยนแผนการรักษาเองไหม?',
      quickAnswer: 'ไม่ครับ AI ทำหน้าที่วิเคราะห์และเสนอ Recommendation เท่านั้น การเปลี่ยน Prescription ต้องผ่าน Therapist Approval Gate เสมอ',
      fullRationale: 'สถาปัตยกรรมของ Strong Care วาง Security Boundary ชัดเจน ข้อเสนอจาก Adaptive Engine จะมีสถานะเริ่มต้นเป็น PENDING_CLINICAL_APPROVAL เสมอ และไม่มี Endpoint หรือ Direct Database Write ใดๆ ให้ AI สามารถบันทึกทับแผนการรักษาเดิมโดยปราศจากลายมือชื่อดิจิทัลของนักกายภาพ',
      cautionTrap: 'ห้ามตอบว่า "เปลี่ยนได้เฉพาะเคสง่ายๆ" หรือ "ระบบเปลี่ยนให้ล่วงหน้าแล้วให้นักกายภาพตรวจทีหลัง"',
    },
    {
      id: 2,
      category: 'AI_SAFETY',
      question: 'ถ้า AI มองไม่เห็นตัวผู้ป่วยหรือความมั่นใจต่ำ ระบบจะทำอย่างไร?',
      quickAnswer: 'ระบบจะลด Confidence Score และเข้าสู่ Fail-Safe ทันที โดยใช้กฎ NO DECISION, NO REP, NO RECOMMENDATION',
      fullRationale: 'ระบบมี Confidence Gatekeeper คอยตรวจจับ Visibility ของข้อต่อหลัก 33 จุด หากคะแนนเฉลี่ยต่ำกว่าเกณฑ์ 50% หรือลำตัวหลุดออกจากเฟรม ระบบจะล็อก State Machine ห้ามเพิ่มจำนวน Rep, ห้ามให้คะแนนความถูกต้อง, และไม่สร้างคำแนะนำใดๆ จากข้อมูลที่ขาดความน่าเชื่อถือ',
      cautionTrap: 'ห้ามตอบว่า "ระบบจะเดาตำแหน่งต่อให้" หรือ "ใช้ AI เติมจุดที่หายไป"',
    },
    {
      id: 3,
      category: 'ARCHITECTURE',
      question: 'ถ้า Internet หลุดระหว่างที่คนไข้กำลังฝึก?',
      quickAnswer: 'Core rehabilitation monitoring ยังทำงานต่อบนเครื่องได้ตามปกติ ข้อมูลจะถูกเก็บใน StrongCareDB และเข้าคิว Sync อัตโนมัติ',
      fullRationale: 'โมเดล MediaPipe และ Biomechanics Engine ทั้งหมดรันอยู่บน Client-Side WebAssembly ในเบราว์เซอร์ของผู้ใช้ ข้อมูลทุกครั้งที่ยกและเซสชันจะถูกเขียนลง IndexedDB (StrongCareDB) ภายในเครื่อง เมื่อเครือข่ายเชื่อมต่อได้ใหม่ Sync Queue Manager จะส่งเฉพาะ Summary ขึ้นเซิร์ฟเวอร์',
      cautionTrap: 'ห้ามพูดว่า "ระบบต้องส่งภาพไปประมวลผลที่คลาวด์ตลอดเวลา"',
    },
    {
      id: 4,
      category: 'BIOMETRICS',
      question: 'ข้อมูลใบหน้าถูกส่งขึ้น Cloud หรือมีความเสี่ยงละเมิดความเป็นส่วนตัวไหม?',
      quickAnswer: 'ไม่มีการส่งภาพถ่ายใบหน้าขึ้น Cloud สถาปัตยกรรมทำงานแบบ Local-First และบันทึกเฉพาะเวกเตอร์ 128 มิติที่เข้ารหัสแล้ว',
      fullRationale: 'ระบบถูกออกแบบตามหลัก Privacy by Design ภาพจากกล้องจะถูกประมวลผลบนหน่วยความจำของเครื่องเพื่อสกัดเวกเตอร์ทางเรขาคณิต (128-D Feature Embedding) แล้วทิ้ง Frame ภาพทันที ไม่มีภาพถ่ายคนไข้ถูกจัดเก็บบน Disk หรือส่งข้ามระบบเครือข่าย',
      cautionTrap: 'อย่าพูดว่า "PDPA Compliant 100%" หากยังไม่มีผลตรวจประเมินทางกฎหมายอย่างเป็นทางการ ให้ใช้คำว่า Privacy by Design / Privacy-oriented architecture',
    },
    {
      id: 5,
      category: 'CLINICAL',
      question: 'ค่า Trunk Lean 22° เป็นมาตรฐานทางการแพทย์สากลหรือเปล่า?',
      quickAnswer: 'ไม่ใช่อ้างว่าเป็น universal clinical standard แต่เป็น System-configured safety threshold ที่สามารถปรับแต่งได้ตามความเสี่ยงของผู้ป่วย',
      fullRationale: 'เกณฑ์ 22 องศาเป็นพารามิเตอร์เริ่มต้นในระบบความปลอดภัยเพื่อตรวจจับการเอียงกระดูกสันหลังชดเชย (Spinal Compensation) ในท่ายกแขน โดยนักกายภาพสามารถปรับเพิ่มหรือลดได้ตามประวัติการบาดเจ็บและความเสี่ยงของคนไข้แต่ละรายในระบบ Configuration',
      cautionTrap: 'อย่าอ้างว่าเป็น "มาตรฐานกระทรวงสาธารณสุข" หรือ "กฎสากลที่ทุกโรงพยาบาลบังคับ"',
    },
    {
      id: 6,
      category: 'BIOMETRICS',
      question: 'เวกเตอร์ 128-D Face Embedding คำนวณมาจากไหน มีความหมายทางชีวมิติจริงหรือไม่?',
      quickAnswer: 'สร้างจาก MediaPipe 478 landmarks ผ่าน Anthropometric Geometric Projection แล้วทำ L2 Normalization ไม่ใช่การ mock slice',
      fullRationale: 'Pipeline ทำการวัดระยะทางสัดส่วนกายวิภาคเทียบกับระยะระหว่างม่านตา (Inter-Ocular Distance: IOD), มุมตรีโกณมิติ atan2 ของสามเหลี่ยมโครงหน้า, อัตราส่วนความสูง-กว้างของใบหน้า, ความสมมาตรซ้ายขวา และ Polar Harmonic Projections 64 จุดรอบศูนย์กลางใบหน้า ก่อนทำ Unit Hypersphere Projection (||v|| = 1.0)',
      cautionTrap: 'อย่าตอบคลุมเครือ ต้องอธิบายกระบวนการ IOD Normalization และ Geometric Projection ให้ชัดเจน',
    },
    {
      id: 7,
      category: 'CLINICAL',
      question: 'ทำไมต้องใช้ AI ในเมื่อคนไข้สามารถดูคลิปวิดีโอทั่วไปเพื่อออกกำลังกายได้?',
      quickAnswer: 'เพราะวิดีโอทั่วไปไม่มี Feedback และไม่มี Safety Watchdog คอยเตือนเมื่อเกิดท่าทางชดเชยที่เสี่ยงอันตราย',
      fullRationale: 'การดูคลิปอย่างเดียว ผู้สูงอายุมักไม่รู้ตัวว่ากำลังเอียงตัวชดเชยหรือเกร็งบ่ายกแขน Strong Care นำ AI เข้ามาทำหน้าที่เสมือนกระจกชีวกลศาสตร์ (Biofeedback Mirror) ที่ให้ Real-time Voice Guidance และสั่งหยุดก่อนที่จะเกิดการบาดเจ็บซ้ำ',
      cautionTrap: 'อย่าตอบว่า "เพื่อทดแทนนักกายภาพบำบัดในโรงพยาบาล"',
    },
    {
      id: 8,
      category: 'CLINICAL',
      question: 'ระบบรู้ได้อย่างไรว่าผู้ป่วยมีพัฒนาการดีขึ้นจริง?',
      quickAnswer: 'เปรียบเทียบ Baseline แรกเข้า กับ Session ปัจจุบัน ผ่านตัวชี้วัดเชิงปริมาณ เช่น ROM Delta, Accuracy, และ Form Stability',
      fullRationale: 'ระบบเก็บประวัติ Baseline วันแรก (เช่น 82°) แล้วติดตามเส้นพัฒนาการ Performance Trend ในแต่ละเซสชัน หากคนไข้ทำ ROM ได้เพิ่มขึ้นสม่ำเสมอ โดยที่ไม่มี Safety Event และการควบคุมกล้ามเนื้อมีความราบรื่น (Smoothness Score สูง) จึงจะสรุปเป็นแนวโน้มพัฒนาการ',
      cautionTrap: 'ห้ามพูดว่า "AI รู้ว่าคนไข้หายป่วยแล้ว" ให้พูดว่า "มี Performance Trend ดีขึ้นเชิงปริมาณ"',
    },
    {
      id: 9,
      category: 'AI_SAFETY',
      question: 'ถ้าหาก AI แนะนำเพิ่มองศาการฝึกผิดพลาด จะเกิดอันตรายต่อผู้ป่วยไหม?',
      quickAnswer: 'ไม่เกิดอันตรายครับ เพราะข้อเสนอถูกกักที่ Approval Gate และระหว่างการฝึกยังมี Safety Watchdog คอยคุมเพดานความปลอดภัยอีกชั้น',
      fullRationale: 'ระบบมี Dual Safety Layer: 1) แผนการรักษาใหม่จะไม่มีผลจนกว่านักกายภาพจะตรวจสอบและอนุมัติ และ 2) แม้จะเริ่มฝึกในเป้าหมายใหม่ หากคนไข้ยกเกินพิกัดปลอดภัยสูงสุด (Over-ROM) หรือเกิดอาการกระตุก SafetyEngine Watchdog จะสั่งหยุดฉุกเฉินและตัดการฝึกทันที',
      cautionTrap: 'อย่าตอบว่า "AI ของเราแม่นยำมากจนไม่มีทางแนะนำผิด"',
    },
    {
      id: 10,
      category: 'ARCHITECTURE',
      question: 'จุดเด่นที่แท้จริงของ Strong Care ที่แตกต่างจากโปรเจกต์ Pose Estimation ทั่วไปคืออะไร?',
      quickAnswer: 'Strong Care เป็นระบบปิดครบวงจรตั้งแต่ Identify → Verify → Calibrate → Analyze → Protect → Adapt → Approve โดยมี Safety & Governance เป็นแกนหลัก',
      fullRationale: 'โปรเจกต์ทั่วไปมักเป็นเพียงการนำโมเดลตรวจจับท่าทางมานับจำนวนครั้ง แต่ Strong Care ถูกออกแบบสำหรับบริบทเวชศาสตร์ฟื้นฟูโดยเฉพาะ มีระบบ Liveness ป้องกันการสวมรอย, Pre-Exercise 5-Point Calibration, Safety Emergency Stop สั่งหยุดจริง, Explainable AI อธิบายเหตุผลได้, และ Approval Gate สำหรับบุคลากรทางการแพทย์',
      cautionTrap: 'อย่าตอบแค่เรื่องหน้าตา UI สวย หรือมีฟีเจอร์เยอะ แต่ให้เน้นเรื่อง Closed-Loop Safety & Clinical Governance',
    },
  ];

  const currentStage = demoStages[currentStepIndex];

  const handleStartDemo = () => {
    setIsDemoActive(true);
    setCurrentStepIndex(0);
    setApprovalDecision(null);
  };

  const handleNext = () => {
    if (currentStepIndex < demoStages.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const filteredQAs = activeQaFilter === 'ALL'
    ? judgeQAList
    : judgeQAList.filter(q => q.category === activeQaFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-8 max-w-[min(95vw,900px)] w-full shadow-2xl relative max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Master Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  FEATURE FREEZE 🔒 COMPETITION BUILD
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Strong Care v1.0 Final</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                🏆 Competition Pitch & Presentation Hub
              </h2>
            </div>
          </div>

          {/* Tab Selector & Mode Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('RUNBOOK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'RUNBOOK'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>⏱ 5-Min Runbook</span>
              </button>

              <button
                onClick={() => setActiveTab('JUDGE_QA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'JUDGE_QA'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>⚖️ Judge Q&A (10 ข้อ)</span>
              </button>
            </div>

            {onNavigateToTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('training');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
                title="สลับไปทดสอบหน้ากล้องจริง"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>ไปที่หน้ากล้องจริง (Live Camera E2E)</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: 5-MINUTE COMPETITION DEMO RUNBOOK & TELEPROMPTER */}
        {/* ========================================================================= */}
        {activeTab === 'RUNBOOK' && (
          <div className="space-y-5">
            {/* Timeline Bar with 11 Stages */}
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    5-MINUTE DEMO SCRIPT TIMELINE (00:00 - 05:00)
                  </span>
                </div>

                <button
                  onClick={() => setIsTeleprompterMode(!isTeleprompterMode)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1 ${
                    isTeleprompterMode
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isTeleprompterMode ? 'ซ่อนบทพูดพรีเซนต์' : 'เปิดโหมดบทพูดพรีเซนต์ (Teleprompter)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-1 font-mono text-center">
                {demoStages.map((stage, idx) => (
                  <button
                    key={stage.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`p-1.5 rounded-lg border transition text-[10px] ${
                      currentStepIndex === idx
                        ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-md scale-105'
                        : idx < currentStepIndex
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-900'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    <span className="block font-bold text-[9px] opacity-75">{stage.timeRange.split(' - ')[0]}</span>
                    <span className="truncate block font-semibold">#{stage.stepNum} {stage.id.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Stage Interactive Showcase Card */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              {/* Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-md shadow-emerald-600/30">
                    {currentStage.stepNum}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        ⏱ {currentStage.timeRange}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                        STAGE {currentStage.stepNum} OF 11
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{currentStage.name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    [ DEMO DATA ]
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {currentStage.badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                    Confidence: {currentStage.confidence}%
                  </span>
                </div>
              </div>

              {/* Presenter Teleprompter Script Drawer */}
              {isTeleprompterMode && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border border-emerald-500/50 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Mic className="w-4 h-4" />
                      บทพูดพรีเซนต์ภาษาไทย (Presenter Teleprompter Script)
                    </span>
                    <span className="text-slate-400 text-[11px]">เวลาที่แนะนำ: ~20-30 วินาที</span>
                  </div>

                  <p className="text-sm font-sans leading-relaxed text-emerald-50 font-medium pl-3 border-l-2 border-emerald-400">
                    {currentStage.presenterScript}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-600/40 text-rose-200 flex items-start gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-300 block text-[10px]">❌ คำที่ห้ามพูดเด็ดขาด:</strong>
                        <span>{currentStage.forbiddenPhrases.join(' • ')}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-200 flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-300 block text-[10px]">✅ คีย์เวิร์ดที่ต้องเน้น:</strong>
                        <span>{currentStage.keySoundbites.join(' • ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Description & Fail-Safe Rule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-500 block mb-1">กลไกสถาปัตยกรรมเบื้องหลัง:</span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans">{currentStage.desc}</p>
                </div>
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-300 text-amber-900 dark:text-amber-200">
                  <span className="font-bold block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Fail-Safe Rule:
                  </span>
                  <p className="font-mono text-[11px] leading-relaxed">{currentStage.rule}</p>
                </div>
              </div>

              {/* Dynamic Stage Widgets */}
              <div className="pt-2">
                {/* Step 1 & 2: Face & Liveness */}
                {(currentStage.id === 'open' || currentStage.id === 'face' || currentStage.id === 'liveness') && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-[10px] text-slate-400 block font-sans">Face Mesh Points</span>
                      <strong className="text-emerald-600 text-base">478 Points</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-[10px] text-slate-400 block font-sans">Feature Vector</span>
                      <strong className="text-teal-600 text-base">128-D Projected</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-[10px] text-slate-400 block font-sans">Anti-Spoofing EAR</span>
                      <strong className="text-blue-600 text-base">0.31 (Natural)</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-[10px] text-slate-400 block font-sans">Storage</span>
                      <strong className="text-purple-600 text-base">Local Encrypted</strong>
                    </div>
                  </div>
                )}

                {/* Step 4: Calibration */}
                {currentStage.id === 'calibration' && (
                  <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                    {['1. แสงสว่าง', '2. ระยะ 2m', '3. ลำตัวในเฟรม', '4. ร่างกายเสถียร', '5. นับถอยหลัง'].map((step, i) => (
                      <div key={i} className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                        <span className="font-bold block text-[11px]">{step}</span>
                        <span className="text-[10px] opacity-75 font-sans">ผ่านเกณฑ์</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 5: Pose */}
                {currentStage.id === 'pose' && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <span className="text-[10px] text-slate-400 block font-sans">Active ROM</span>
                        <strong className="text-emerald-600 text-lg">108°</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
                        <strong className="text-teal-600 text-lg">94%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <span className="text-[10px] text-slate-400 block font-sans">Reps Completed</span>
                        <strong className="text-slate-900 dark:text-white text-lg">9 / 10</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <span className="text-[10px] text-slate-400 block font-sans">Confidence</span>
                        <strong className="text-cyan-600 text-lg">97% (Passed)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Safety Stop Simulation */}
                {currentStage.id === 'safety' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600 text-white font-mono font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 animate-bounce" />
                      <span>EMERGENCY STOP TRIGGERED (Fail-Safe Verified)</span>
                    </div>
                    <h4 className="text-base font-black text-rose-900">
                      🔴 พบการเคลื่อนไหวที่อยู่นอก Safety Configuration
                    </h4>
                    <p className="text-xs text-rose-700 max-w-md mx-auto">
                      Trunk Lean 24° (เกินเกณฑ์ระบบ 22°) &bull; ระบบหยุดการนับรอบทันที &bull; Immediate Voice Preemption: Safety voice immediately interrupts normal guidance
                    </p>
                    <div className="flex justify-center gap-2 pt-1 font-mono text-[11px]">
                      <span className="px-2.5 py-1 bg-white rounded-lg border border-rose-200 text-rose-800">
                        Trunk Lean: 24° (เกิน)
                      </span>
                      <span className="px-2.5 py-1 bg-white rounded-lg border border-rose-200 text-rose-800">
                        State: STOPPED
                      </span>
                      <span className="px-2.5 py-1 bg-white rounded-lg border border-rose-200 text-rose-800">
                        Priority: 10 (Voice Preempt)
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 7: Patient Baseline */}
                {currentStage.id === 'progress' && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-slate-500 font-sans block">ROM Baseline vs Current</span>
                        <div className="flex justify-between items-end mt-1">
                          <span>Baseline: <strong>82°</strong> &rarr; Now: <strong>108°</strong></span>
                          <strong className="text-emerald-700 text-sm font-bold">+31.7% ↑</strong>
                        </div>
                      </div>

                      <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200">
                        <span className="text-[10px] text-slate-500 font-sans block">Accuracy Baseline vs Current</span>
                        <div className="flex justify-between items-end mt-1">
                          <span>Baseline: <strong>71%</strong> &rarr; Now: <strong>94%</strong></span>
                          <strong className="text-teal-700 text-sm font-bold">+23% ↑</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center text-xs font-mono text-slate-600 dark:text-slate-300">
                      Performance Trend: S1 (80°) &rarr; S2 (88°) &rarr; S3 (96°) &rarr; S4 (102°) &rarr; S5 (108°)
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold font-sans mt-0.5">
                        “แนวโน้มการควบคุม ROM ดีขึ้นอย่างต่อเนื่อง”
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 8: Explainable AI Recommendation */}
                {currentStage.id === 'xai' && (
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 font-mono">AI Recommendation #SC-00421</span>
                      <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-mono font-bold text-[10px]">
                        Adaptive Prescription
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                        <span className="text-slate-400 text-[10px] block">Previous Config</span>
                        <strong>Target ROM: 110° &bull; Reps: 8</strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-purple-300 text-purple-900">
                        <span className="text-purple-600 text-[10px] block font-bold">AI Proposed</span>
                        <strong>Target ROM: 115° &bull; Reps: 10</strong>
                      </div>
                    </div>

                    <div className="space-y-1 font-sans text-slate-700 bg-white p-3 rounded-xl border border-purple-100">
                      <span className="font-bold text-purple-900 block font-mono text-[11px] mb-1">เหตุผลเชิงประจักษ์ (XAI Reasons):</span>
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ควบคุมท่าได้ดีขึ้น (Accuracy 94%)</p>
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ROM เพิ่มขึ้นอย่างต่อเนื่อง (+12° ใน 3 เซสชัน)</p>
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ไม่มี Safety Event ใน 3 sessions ล่าสุด</p>
                    </div>
                  </div>
                )}

                {/* Step 9: Clinical Approval Gate */}
                {currentStage.id === 'approval' && (
                  <div className="p-4 rounded-2xl bg-teal-50/60 border-2 border-teal-400 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900 font-mono">Approval Gate & Audit Trail</span>
                      {approvalDecision && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] uppercase bg-emerald-600 text-white">
                          Decision: {approvalDecision}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setApprovalDecision('APPROVED')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> [ APPROVE ]
                      </button>
                      <button
                        onClick={() => setApprovalDecision('MODIFIED')}
                        className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> [ MODIFY ] (ROM 112°)
                      </button>
                      <button
                        onClick={() => setApprovalDecision('REJECTED')}
                        className="flex-1 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> [ REJECT ]
                      </button>
                    </div>

                    {approvalDecision && (
                      <div className="p-3 bg-white rounded-xl border border-teal-200 font-mono text-[11px] space-y-0.5 animate-in fade-in">
                        <p>Approved by: <strong>กภ. วริศรา (Therapist)</strong></p>
                        <p>Decision: <strong>{approvalDecision}</strong></p>
                        <p>Final ROM: <strong>{approvalDecision === 'MODIFIED' ? '112°' : approvalDecision === 'APPROVED' ? '115°' : '110°'}</strong></p>
                        <p>Audit Receipt: <strong>GOV-2026-SC0421</strong></p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 10: Offline Storage */}
                {currentStage.id === 'offline' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Offline Storage Verified (StrongCareDB)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-sans">
                      เซสชันถูกบันทึกลง IndexedDB ภายในเครื่องอย่างสมบูรณ์แม้ไม่มีอินเทอร์เน็ต เมื่อระบบเชื่อมต่อเครือข่าย Sync Controller จะส่งข้อมูลสรุป (Session Summary Only) ไปยังเซิร์ฟเวอร์โดยอัตโนมัติ
                    </p>
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200 font-mono text-[11px] text-emerald-800 flex items-center justify-between">
                      <span>● Core rehabilitation monitoring operates offline</span>
                      <span className="font-bold">✓ StrongCareDB Ready</span>
                    </div>
                  </div>
                )}

                {/* Step 11: Fail-Safe 10/10 */}
                {currentStage.id === 'failsafe' && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white border border-emerald-500/50 space-y-3 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">10/10 CLINICAL FAIL-SAFE AUTOMATED TEST HARNESS</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px]">
                        0 FAILURES
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans">
                      ระบบผ่านการทดสอบอัตโนมัติ 10 กรณีทางคลินิก: กล้องดับ, ความมั่นใจต่ำ (&lt;50%), หลุดกรอบ, Over-ROM, ลำตัวเอียง (&gt;22°), ไหล่ยก (&gt;18°), เคลื่อนไหวเร็ว (&gt;220°/s), ภาพถ่ายปลอม, เน็ตหลุด, และ AI กักกันข้อเสนอ
                    </p>
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                      <span>✓ VERIFIED MEDICAL SAFETY BOUNDARY</span>
                      <span className="font-bold">10/10 PASSED</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stepper Navigation Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-95 disabled:opacity-40"
                >
                  ◀ ขั้นก่อนหน้า
                </button>

                <span className="font-mono text-xs text-slate-500">
                  {currentStepIndex + 1} / {demoStages.length}
                </span>

                {currentStepIndex < demoStages.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5"
                  >
                    <span>ขั้นถัดไป ▶</span>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95"
                  >
                    เสร็จสิ้นการซ้อม (Done)
                  </button>
                )}
              </div>
            </div>

            {/* Embedded Patient Journey Component */}
            <div>
              <PatientJourneyBanner
                onStepClick={(idx) => {
                  setIsDemoActive(true);
                  setCurrentStepIndex(Math.min(idx, demoStages.length - 1));
                }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: JUDGE Q&A CHEAT SHEET (10 คำถาม-คำตอบ สำหรับกรรมการ) */}
        {/* ========================================================================= */}
        {activeTab === 'JUDGE_QA' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-emerald-500/40 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">
                    10 คำถาม-คำตอบ ป้องกันตัวต่อหน้ากรรมการ (JUDGE Q&A DEFENSE KIT)
                  </h3>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1 flex-wrap text-[11px] font-mono">
                  {['ALL', 'AI_SAFETY', 'CLINICAL', 'BIOMETRICS', 'ARCHITECTURE'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveQaFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        activeQaFilter === cat
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 font-mono">
                แนวทางตอบคำถามเชิงลึกสำหรับคณะกรรมการสายแพทย์ ชีวการแพทย์ และความมั่นคงปลอดภัยไซเบอร์ — ตอบตรงประเด็น ไม่โอ้อวดเกินจริง ยึดหลัก Clinical Governance
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredQAs.map((qa) => (
                <div
                  key={qa.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold flex items-center justify-center flex-shrink-0 text-xs border border-emerald-300 dark:border-emerald-700">
                        Q{qa.id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {qa.question}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {qa.category}
                    </span>
                  </div>

                  {/* One-Liner Quick Answer */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-700/60">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5 text-[11px]">
                      💡 คำตอบสั้น (Direct Soundbite สำหรับตอบทันที):
                    </span>
                    <p className="text-emerald-800 dark:text-emerald-200 font-semibold leading-relaxed">
                      {qa.quickAnswer}
                    </p>
                  </div>

                  {/* Deep Clinical Rationale */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-500 block mb-1 text-[11px]">
                      🔍 เหตุผลทางสถาปัตยกรรมและชีวการแพทย์ (Full Technical Rationale):
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                      {qa.fullRationale}
                    </p>
                  </div>

                  {/* Danger Trap Alert */}
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 font-mono text-[11px] flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>⚠️ กับดักที่ห้ามตอบ: {qa.cautionTrap}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
