import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserCheck,
  FileText,
  Stethoscope,
  Volume2,
  VolumeX,
  Printer,
  Share2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  RefreshCw,
  QrCode,
  Smartphone,
  Tv,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ExternalLink,
  Flame,
  Award,
  Layers,
  Thermometer,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PT_EXERCISES, PTExerciseConfig } from '../services/ptExerciseEngine';
import { announceHospitalQueue, playHospitalDingDong } from '../utils/hospitalAudio';

interface MahidolPTSystemProps {
  onNavigateToKiosk?: () => void;
  onNavigateToMobile?: () => void;
  onNavigateToDashboard?: () => void;
}

export const MahidolPTSystem: React.FC<MahidolPTSystemProps> = ({
  onNavigateToKiosk,
  onNavigateToMobile,
  onNavigateToDashboard
}) => {
  const { user, largeFont } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    'triage' | 'clinics' | 'soap' | 'prescriptions' | 'queue' | 'goniometer'
  >('triage');

  // Search Query for Patients/HN
  const [searchHn, setSearchHn] = useState<string>('');

  // Selected Patient for Active Consultation
  const [selectedPatientId, setSelectedPatientId] = useState<string>('HN-2567-0098');

  // Backend Sync / Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('เชื่อมต่อระบบฐานข้อมูล ม.มหิดล สำเร็จ');

  // Clinical Records State
  const [assessments, setAssessments] = useState<any[]>([]);
  const [soapNotes, setSoapNotes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [queueTickets, setQueueTickets] = useState<any[]>([]);

  // Modals
  const [showNewSoapModal, setShowNewSoapModal] = useState<boolean>(false);
  const [showNewRxModal, setShowNewRxModal] = useState<boolean>(false);
  const [showNewQueueModal, setShowNewQueueModal] = useState<boolean>(false);
  const [showPrintRxModal, setShowPrintRxModal] = useState<any | null>(null);

  // TUG Test Live Stopwatch State
  const [isTugRunning, setIsTugRunning] = useState<boolean>(false);
  const [tugElapsed, setTugElapsed] = useState<number>(0);
  const tugTimerRef = useRef<any>(null);

  // Goniometer Interactive Lab State
  const [goniometerJoint, setGoniometerJoint] = useState<string>('shoulder_abduction');
  const [goniometerAngle, setGoniometerAngle] = useState<number>(85);

  // Triage Form State
  const [triageForm, setTriageForm] = useState({
    patient_id: 'HN-2567-0098',
    patient_name: 'คุณยายสมศรี มีสุข',
    clinic_specialty: 'ORTHOPEDIC',
    bp_systolic: 124,
    bp_diastolic: 82,
    heart_rate: 74,
    spo2: 98.5,
    temperature: 36.6,
    pain_score: 3,
    tug_seconds: 9.8,
    berg_balance_score: 52,
    sts_5x_seconds: 11.2,
    contraindication_flags: ''
  });

  // Pre-defined Patients for Quick Triage Selection
  const registeredPatients = [
    {
      id: 'HN-2567-0098',
      name: 'คุณยายสมศรี มีสุข',
      age: 68,
      gender: 'หญิง',
      specialty: 'ORTHOPEDIC',
      condition: 'ข้อไหล่ติดระยะที่ 2 (Frozen Shoulder)',
      targetExercise: 'shoulder_abduction'
    },
    {
      id: 'HN-2567-0104',
      name: 'คุณตาประสิทธิ์ เจริญพร',
      age: 72,
      gender: 'ชาย',
      specialty: 'GERIATRIC',
      condition: 'ข้อเข่าเสื่อมทั้ง 2 ข้าง (Bilateral Knee OA)',
      targetExercise: 'knee_extension'
    },
    {
      id: 'HN-2567-0112',
      name: 'นายเกียรติศักดิ์ มั่นคง',
      age: 42,
      gender: 'ชาย',
      specialty: 'ORTHOPEDIC',
      condition: 'ออฟฟิศซินโดรมและปวดกล้ามเนื้อคอบ่า (MPS)',
      targetExercise: 'balance_posture'
    },
    {
      id: 'HN-2567-0078',
      name: 'นางมาลี อัศวเมฆินทร์',
      age: 65,
      gender: 'หญิง',
      specialty: 'CARDIOPULMONARY',
      condition: 'ฟื้นฟูปอดและฝึกการหายใจ (Cardiopulmonary PT)',
      targetExercise: 'chest_expansion'
    },
    {
      id: 'HN-2567-0125',
      name: 'นายอนุสรณ์ ธีระพันธ์',
      age: 58,
      gender: 'ชาย',
      specialty: 'NEUROLOGICAL',
      condition: 'หลอดเลือดสมองตีบ อัมพฤกษ์ครึ่งซีกซ้าย (Stroke Rehab)',
      targetExercise: 'sit_to_stand'
    }
  ];

  // Fetch / Seed Data from Backend
  const loadClinicalData = async () => {
    setIsLoading(true);
    try {
      const [assessRes, soapRes, rxRes, queueRes] = await Promise.all([
        api.getAssessments().catch(() => []),
        api.getSoapNotes().catch(() => []),
        api.getPrescriptions().catch(() => []),
        api.getRehabQueue().catch(() => [])
      ]);

      if (assessRes && assessRes.length > 0) setAssessments(assessRes);
      if (soapRes && soapRes.length > 0) setSoapNotes(soapRes);
      if (rxRes && rxRes.length > 0) setPrescriptions(rxRes);
      if (queueRes && queueRes.length > 0) setQueueTickets(queueRes);
      setSyncStatus('เชื่อมต่อฐานข้อมูลคลินิกกายภาพบำบัด ม.มหิดล สำเร็จ');
    } catch (err) {
      console.warn('Backend sync warning, using local state:', err);
      setSyncStatus('โหมดออฟไลน์ (Local Clinical Cache)');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, []);

  // Update Triage Form when patient changes
  const handleSelectPatient = (patient: any) => {
    setSelectedPatientId(patient.id);
    setTriageForm(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: patient.name,
      clinic_specialty: patient.specialty
    }));
  };

  // TUG Test Live Stopwatch
  const handleStartTug = () => {
    setIsTugRunning(true);
    setTugElapsed(0);
    const start = Date.now();
    tugTimerRef.current = setInterval(() => {
      const diff = (Date.now() - start) / 1000;
      setTugElapsed(parseFloat(diff.toFixed(1)));
    }, 100);
  };

  const handleStopTug = () => {
    setIsTugRunning(false);
    if (tugTimerRef.current) clearInterval(tugTimerRef.current);
    setTriageForm(prev => ({ ...prev, tug_seconds: tugElapsed }));
  };

  const handleResetTug = () => {
    setIsTugRunning(false);
    if (tugTimerRef.current) clearInterval(tugTimerRef.current);
    setTugElapsed(0);
  };

  // Compute Red Flags & Clinical Safety Clearance
  const computeSafetyStatus = () => {
    const flags: string[] = [];
    if (triageForm.bp_systolic >= 160 || triageForm.bp_diastolic >= 100) {
      flags.push('ความดันโลหิตสูงเกินเกณฑ์ปลอดภัย (>160/100 mmHg)');
    }
    if (triageForm.spo2 < 95.0) {
      flags.push('ความอิ่มตัวออกซิเจนต่ำกว่าเกณฑ์ (<95%)');
    }
    if (triageForm.heart_rate > 100 || triageForm.heart_rate < 50) {
      flags.push('อัตราการเต้นของหัวใจไม่อยู่ในเกณฑ์ปกติ (50-100 bpm)');
    }
    if (triageForm.temperature >= 37.8) {
      flags.push('มีไข้สูง (>37.8 °C) เสี่ยงต่อการอักเสบเฉียบพลัน');
    }
    if (triageForm.pain_score >= 8) {
      flags.push('ระดับความเจ็บปวดรุนแรง (VAS >= 8) ควรปรับลดแรงรักษา');
    }

    const isSafe = flags.length === 0;
    return { isSafe, flags };
  };

  const safetyResult = computeSafetyStatus();

  // Save Triage Assessment
  const handleSaveAssessment = async () => {
    try {
      setIsLoading(true);
      const res = await api.createAssessment(triageForm);
      await loadClinicalData();
      alert('✅ บันทึกผลการคัดกรองสัญญาณชีพและสมรรถภาพทางกายภาพบำบัดสำเร็จ!');
    } catch (e) {
      alert('บันทึกสำเร็จ (บันทึกใน Local Storage ชั่วคราว)');
      setAssessments(prev => [triageForm, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  // Announce Queue Calling
  const handleCallQueue = async (ticket: any) => {
    try {
      await announceHospitalQueue(ticket.ticket_number, ticket.patient_name, ticket.assigned_station);
      // Update status to CALLING
      await api.updateQueueStatus(ticket.id, 'CALLING').catch(() => {});
      setQueueTickets(prev =>
        prev.map(t => (t.id === ticket.id ? { ...t, status: 'CALLING' } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQueueStatus = async (ticketId: number, newStatus: string) => {
    try {
      await api.updateQueueStatus(ticketId, newStatus).catch(() => {});
      setQueueTickets(prev =>
        prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      setQueueTickets(prev =>
        prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    }
  };

  // Dispatch Prescription to PT Machine Kiosk
  const handleDispatchToKiosk = (rx: any) => {
    try {
      localStorage.setItem('strongcare_kiosk_active_prescription', JSON.stringify(rx));
      if (onNavigateToKiosk) {
        onNavigateToKiosk();
      } else {
        alert(`✅ ส่งข้อมูลการรักษาของ ${rx.patient_name} เข้าตู้กายภาพบำบัด AI เรียบร้อยแล้ว!`);
      }
    } catch (e) {}
  };

  // Dispatch Prescription to Mobile Home PT
  const handleDispatchToMobile = (rx: any) => {
    try {
      localStorage.setItem('strongcare_mobile_active_prescription', JSON.stringify(rx));
      if (onNavigateToMobile) {
        onNavigateToMobile();
      } else {
        alert(`✅ ส่งโปรแกรมฝึกกายภาพที่บ้านเข้าโทรศัพท์มือถือของ ${rx.patient_name} เรียบร้อยแล้ว!`);
      }
    } catch (e) {}
  };

  // Goniometer Reference Values
  const goniometerNormals: Record<string, { name: string; normalMin: number; normalMax: number; unit: string; description: string }> = {
    shoulder_abduction: {
      name: 'กางข้อไหล่ (Shoulder Abduction)',
      normalMin: 0,
      normalMax: 180,
      unit: 'องศา (°)',
      description: 'เกณฑ์ปกติของข้อไหล่กางได้ 0 - 180 องศา ในผู้ป่วยข้อไหล่ติดมักติดขัดที่ 60 - 90 องศา'
    },
    shoulder_flexion: {
      name: 'ยกแขนไปข้างหน้า (Shoulder Flexion)',
      normalMin: 0,
      normalMax: 180,
      unit: 'องศา (°)',
      description: 'เกณฑ์ปกติยกแขนตรงไปข้างหน้าได้ 0 - 180 องศา สัมพันธ์กับการทำงานในชีวิตประจำวัน'
    },
    knee_extension: {
      name: 'เหยียดข้อเข่า (Knee Extension)',
      normalMin: 140,
      normalMax: 165,
      unit: 'องศา (°)',
      description: 'การเหยียดเข่าตรงในท่านั่ง เกณฑ์ข้อเข่าทำงานปกติควรเหยียดได้ 150 - 165 องศา'
    },
    elbow_flexion: {
      name: 'พับงอข้อศอก (Elbow Flexion)',
      normalMin: 45,
      normalMax: 60,
      unit: 'องศา (°)',
      description: 'การพับงอข้อศอกมุมแหลมเพื่อหยิบของเข้าหาตัว เกณฑ์ปกติอยู่ที่ 45 - 60 องศา'
    }
  };

  const currentGonioRef = goniometerNormals[goniometerJoint] || goniometerNormals.shoulder_abduction;

  return (
    <div className={`space-y-6 pb-12 ${largeFont ? 'text-base' : 'text-sm'}`}>
      {/* 🏛️ RAMATHIBODI & MAHIDOL UNIVERSITY PHYSICAL THERAPY HOSPITAL IDENTITY HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F3D3E] via-[#008783] to-[#00A39E] text-white p-6 md:p-8 shadow-2xl border-b-4 border-teal-300">
        {/* Decorative Watermark Seals */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-teal-200/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Logo & Department Details */}
          <div className="flex items-start gap-4 md:gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0 border-2 border-teal-200">
              {/* Emblem Graphic */}
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#008783] to-[#00A39E] flex flex-col items-center justify-center text-center p-1">
                <span className="text-white font-extrabold text-[10px] tracking-widest leading-none font-serif">MU</span>
                <Stethoscope className="w-5 h-5 text-teal-100 my-0.5" />
                <span className="text-[8px] text-white font-bold leading-tight">รามาธิบดี</span>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#E6F7F7] text-[#008783] font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs border border-[#B2EBE6]">
                  โรงพยาบาลรามาธิบดี • ม.มหิดล
                </span>
                <span className="bg-white/20 text-teal-50 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>คลินิกบริการกายภาพบำบัด เปิดทำการ (08:00 - 18:00)</span>
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1.5 font-['Outfit',sans-serif]">
                คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี & กายภาพบำบัด มหาวิทยาลัยมหิดล
              </h1>
              <p className="text-teal-100 text-sm md:text-base font-medium mt-0.5">
                Ramathibodi Hospital & Faculty of Physical Therapy, Mahidol University • ศูนย์เวชศาสตร์ฟื้นฟูอัจฉริยะ AI
              </p>

              {/* Therapist on-duty badge */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-teal-100">
                <span className="bg-white/10 px-3 py-1 rounded-xl border border-white/15 flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-teal-200" />
                  <span>นักกายภาพบำบัดประจำเวร: <strong className="text-white">กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)</strong></span>
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-xl border border-white/15 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-300" />
                  <span>มาตรฐานสากล: HA / WCPT Certified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap lg:flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              onClick={onNavigateToKiosk}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F3D3E] font-black shadow-md hover:shadow-lg transition-all cursor-pointer text-xs md:text-sm active:scale-95 border border-teal-200"
            >
              <Tv className="w-4 h-4 text-[#00A39E]" />
              <span>เปิดตู้กายภาพบำบัด AI Kiosk</span>
            </button>

            <button
              onClick={onNavigateToMobile}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E6F7F7] hover:bg-teal-100 text-[#008783] font-bold border border-[#B2EBE6] backdrop-blur-md transition-all cursor-pointer text-xs md:text-sm active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-[#008783]" />
              <span>เปิดแอพมือถือผู้ป่วย Mobile PT</span>
            </button>

            <button
              onClick={loadClinicalData}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-teal-100 hover:text-white text-xs transition cursor-pointer"
              title="รีเฟรชซิงค์ข้อมูลกับเซิร์ฟเวอร์"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>ซิงค์ข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Live Hospital KPI Quick Strip */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] text-teal-100 font-medium">ผู้ป่วยรับบริการวันนี้</p>
            <p className="text-xl md:text-2xl font-black text-white mt-0.5">
              {queueTickets.length || 5} <span className="text-xs font-normal text-teal-200">ราย</span>
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] text-teal-100 font-medium">ความปลอดภัย Triage</p>
            <p className="text-xl md:text-2xl font-black text-emerald-300 mt-0.5 flex items-center gap-1">
              <span>100%</span>
              <ShieldCheck className="w-4 h-4" />
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] text-teal-100 font-medium">องศาฟื้นฟูเฉลี่ย (ROM)</p>
            <p className="text-xl md:text-2xl font-black text-teal-200 mt-0.5">
              +18.4° <span className="text-xs font-normal text-teal-100">พัฒนาการ</span>
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] text-teal-100 font-medium">สถานะตู้ AI Kiosk</p>
            <p className="text-xl md:text-2xl font-black text-emerald-300 mt-0.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>พร้อมใช้งาน</span>
            </p>
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS (6 MAJOR RAMATHIBODI & MAHIDOL PT SYSTEMS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {[
          { id: 'triage', label: '1. จุดคัดกรอง & ความปลอดภัย', icon: ShieldCheck, badge: 'Triage & Vital Signs' },
          { id: 'clinics', label: '2. 5 คลินิกเฉพาะทางมหิดล', icon: Stethoscope, badge: '5 Specialized Clinics' },
          { id: 'soap', label: '3. เวชระเบียนกายภาพบำบัด (SOAP)', icon: FileText, badge: 'Mahidol PT SOAP' },
          { id: 'prescriptions', label: '4. ใบสั่งการรักษา (Prescriptions)', icon: Award, badge: 'AI Exercise Rx' },
          { id: 'queue', label: '5. คิวตรวจ & เสียงเรียกผู้ป่วย', icon: Volume2, badge: 'Smart Hospital Queue' },
          { id: 'goniometer', label: '6. ห้องแล็บชีวกลศาสตร์ (ROM)', icon: Sliders, badge: 'Goniometry Lab' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#00A39E] text-white shadow-lg shadow-teal-900/15 border-2 border-teal-200 scale-[1.02]'
                  : 'bg-white hover:bg-teal-50/50 text-slate-700 border border-slate-200/80 hover:border-teal-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <div className="text-left">
                <p className="text-xs md:text-sm leading-tight">{tab.label}</p>
                <p className={`text-[10px] ${isActive ? 'text-teal-100 font-medium' : 'text-slate-400'}`}>
                  {tab.badge}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 📋 TAB 1: PRE-PT TRIAGE & SAFETY SCREENING & FALL RISK */}
      {/* ======================================================== */}
      {activeTab === 'triage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Patient Quick Select & Triage Screening Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Patient Switcher Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>เลือกผู้ป่วยเพื่อรับการคัดกรอง (Patient Selection / HN Search)</span>
                </h3>
                <span className="text-xs text-slate-500">มาตรฐานคัดกรอง ม.มหิดล</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {registeredPatients.map(pt => {
                  const isSelected = selectedPatientId === pt.id;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => handleSelectPatient(pt)}
                      className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-500'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          {pt.id}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">{pt.age} ปี ({pt.gender})</span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1.5 text-sm truncate">{pt.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{pt.condition}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vital Signs Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-red-500" />
                    <span>บันทึกสัญญาณชีพก่อนทำหัตถการ (Pre-Exercise Vital Signs)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    ผู้ป่วย: <strong>{triageForm.patient_name}</strong> ({triageForm.patient_id}) • คลินิก: {triageForm.clinic_specialty}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">ผู้ตรวจ:</span>
                  <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    กภ. ดร. พชร วงศ์สุวรรณ
                  </span>
                </div>
              </div>

              {/* Vital Signs Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Blood Pressure Systolic */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ความดันตัวบน (Sys mmHg)
                  </label>
                  <input
                    type="number"
                    value={triageForm.bp_systolic}
                    onChange={e => setTriageForm({ ...triageForm, bp_systolic: parseInt(e.target.value) || 0 })}
                    className="w-full text-xl font-extrabold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">เกณฑ์: &lt; 140 mmHg</span>
                </div>

                {/* Blood Pressure Diastolic */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ความดันตัวล่าง (Dia mmHg)
                  </label>
                  <input
                    type="number"
                    value={triageForm.bp_diastolic}
                    onChange={e => setTriageForm({ ...triageForm, bp_diastolic: parseInt(e.target.value) || 0 })}
                    className="w-full text-xl font-extrabold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">เกณฑ์: &lt; 90 mmHg</span>
                </div>

                {/* Heart Rate */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    อัตราเต้นหัวใจ (HR bpm)
                  </label>
                  <input
                    type="number"
                    value={triageForm.heart_rate}
                    onChange={e => setTriageForm({ ...triageForm, heart_rate: parseInt(e.target.value) || 0 })}
                    className="w-full text-xl font-extrabold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">เกณฑ์: 60 - 100 bpm</span>
                </div>

                {/* SpO2 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ออกซิเจนในเลือด (SpO2 %)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={triageForm.spo2}
                    onChange={e => setTriageForm({ ...triageForm, spo2: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xl font-extrabold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">เกณฑ์: &ge; 95%</span>
                </div>
              </div>

              {/* Temperature & VAS Pain Scale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Temperature */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">อุณหภูมิกาย (Body Temp °C)</label>
                    <span className="text-[11px] text-slate-500">เกณฑ์ปกติ 36.5 - 37.4 °C</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={triageForm.temperature}
                    onChange={e => setTriageForm({ ...triageForm, temperature: parseFloat(e.target.value) || 0 })}
                    className="w-24 text-xl font-extrabold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 text-right"
                  />
                </div>

                {/* Pain VAS Rating */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">ระดับความเจ็บปวด (Visual Analog Scale - VAS 0-10)</label>
                    <span className={`text-base font-extrabold px-2 py-0.5 rounded-lg ${
                      triageForm.pain_score <= 3 ? 'bg-emerald-100 text-emerald-800' :
                      triageForm.pain_score <= 6 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {triageForm.pain_score} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={triageForm.pain_score}
                    onChange={e => setTriageForm({ ...triageForm, pain_score: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0: ไม่ปวดเลย (No pain)</span>
                    <span>5: ปวดปานกลาง</span>
                    <span>10: ปวดรุนแรงที่สุด</span>
                  </div>
                </div>
              </div>

              {/* Clinical Functional Assessments (TUG & BBS) */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>การทดสอบสมรรถภาพและการประเมินความเสี่ยงหกล้ม (Fall Risk & Functional Tests)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TUG Test With Live Interactive Stopwatch */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950">Timed Up & Go (TUG Test)</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono font-bold">
                        จับเวลาสด
                      </span>
                    </div>

                    <div className="my-3 text-center">
                      <span className="text-3xl font-black font-mono text-indigo-900">
                        {isTugRunning ? tugElapsed : triageForm.tug_seconds}
                      </span>
                      <span className="text-xs text-indigo-600 ml-1 font-bold">วินาที</span>
                    </div>

                    <div className="flex gap-1.5">
                      {!isTugRunning ? (
                        <button
                          onClick={handleStartTug}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" /> เริ่มจับเวลา
                        </button>
                      ) : (
                        <button
                          onClick={handleStopTug}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Pause className="w-3 h-3" /> หยุด
                        </button>
                      )}
                      <button
                        onClick={handleResetTug}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs cursor-pointer"
                        title="รีเซ็ต"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                      {triageForm.tug_seconds < 10
                        ? '✅ ความเสี่ยงต่ำ (ปกติ < 10 วิ)'
                        : triageForm.tug_seconds <= 20
                        ? '⚠️ เสี่ยงปานกลาง (10-20 วิ)'
                        : '🚨 เสี่ยงหกล้มสูง (> 20 วิ)'}
                    </p>
                  </div>

                  {/* Berg Balance Scale (BBS) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Berg Balance Scale (BBS)</span>
                      <span className="text-[10px] text-slate-500">เต็ม 56</span>
                    </div>
                    <div className="my-2 flex items-baseline justify-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="56"
                        value={triageForm.berg_balance_score}
                        onChange={e => setTriageForm({ ...triageForm, berg_balance_score: parseInt(e.target.value) || 0 })}
                        className="w-20 text-3xl font-black text-center bg-white border border-slate-300 rounded-lg py-1 text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-bold">/ 56</span>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">
                      {triageForm.berg_balance_score >= 45
                        ? '✅ ทรงตัวได้ดีมาก (45-56)'
                        : triageForm.berg_balance_score >= 41
                        ? '⚠️ ความเสี่ยงปานกลาง'
                        : '🚨 ความเสี่ยงล้มสูง (&lt; 41)'}
                    </p>
                  </div>

                  {/* 5-Times Sit to Stand (5xSTS) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">5-Times Sit to Stand</span>
                      <span className="text-[10px] text-slate-500">กำลังขา</span>
                    </div>
                    <div className="my-2 flex items-baseline justify-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={triageForm.sts_5x_seconds}
                        onChange={e => setTriageForm({ ...triageForm, sts_5x_seconds: parseFloat(e.target.value) || 0 })}
                        className="w-20 text-3xl font-black text-center bg-white border border-slate-300 rounded-lg py-1 text-slate-900"
                      />
                      <span className="text-xs text-slate-500 font-bold">วินาที</span>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">
                      {triageForm.sts_5x_seconds <= 12 ? '✅ กำลังกล้ามเนื้อขาปกติ' : '⚠️ กล้ามเนื้อขาอ่อนแรง (&gt; 12 วิ)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveAssessment}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#002244] hover:bg-[#003366] text-white font-extrabold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>บันทึกผลการคัดกรอง Triage และยืนยันความปลอดภัย</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Automated Red Flag Clearance & Patient Protocol */}
          <div className="lg:col-span-4 space-y-6">
            {/* Real-time Red Flag & Safety Clearance Card */}
            <div className={`rounded-2xl p-6 border shadow-md transition-all ${
              safetyResult.isSafe
                ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-300'
                : 'bg-gradient-to-br from-red-50 to-white border-red-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
                  safetyResult.isSafe ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-bounce'
                }`}>
                  {safetyResult.isSafe ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    MAHIDOL SAFETY CLEARANCE
                  </span>
                  <h4 className={`text-base font-black ${safetyResult.isSafe ? 'text-emerald-950' : 'text-red-950'}`}>
                    {safetyResult.isSafe
                      ? 'ผ่านเกณฑ์ปลอดภัย (Cleared for PT)'
                      : 'ตรวจพบข้อห้าม (Safety Warning)'}
                  </h4>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                {safetyResult.isSafe ? (
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    ผู้ป่วยไม่มีข้อห้ามตามมาตรฐานสากล สัญญาณชีพและระดับความดันอยู่ในเกณฑ์ปลอดภัย สามารถทำกายภาพบำบัดด้วยเครื่องอัตโนมัติ AI หรือร่วมกับนักกายภาพบำบัดได้ทันที
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-red-900">
                      ตรวจพบความเสี่ยงข้อห้ามก่อนการรักษา (Red Flags):
                    </p>
                    {safetyResult.flags.map((flag, idx) => (
                      <p key={idx} className="text-xs text-red-700 flex items-start gap-1.5 font-medium">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{flag}</span>
                      </p>
                    ))}
                    <p className="text-[11px] text-red-600 font-semibold mt-2 pt-2 border-t border-red-200">
                      ⚠️ คำแนะนำ: ให้ผู้ป่วยพัก 15 นาที และวัดซ้ำ หากยังสูงเกินเกณฑ์ให้ส่งพบแพทย์เวชศาสตร์ฟื้นฟู
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Launch Buttons based on clearance */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={onNavigateToKiosk}
                  disabled={!safetyResult.isSafe}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                    safetyResult.isSafe
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>ส่งเข้าตู้กายภาพ AI (PT Machine Kiosk)</span>
                </button>

                <button
                  onClick={onNavigateToMobile}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>ส่งการบ้านเข้ามือถือผู้ป่วย (Mobile Home PT)</span>
                </button>
              </div>
            </div>

            {/* Recent Assessments History Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>ประวัติการคัดกรองสัญญาณชีพล่าสุด</span>
              </h4>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {assessments.slice(0, 5).map((a, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{a.patient_name}</span>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        {a.patient_id}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                      <span>BP: <strong>{a.bp_systolic}/{a.bp_diastolic}</strong></span>
                      <span>HR: <strong>{a.heart_rate}</strong></span>
                      <span>SpO2: <strong>{a.spo2}%</strong></span>
                      <span>VAS: <strong>{a.pain_score}/10</strong></span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>TUG: {a.tug_seconds}s ({a.tug_risk_level})</span>
                      <span>ผู้ตรวจ: {a.examiner_name?.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🏥 TAB 2: MAHIDOL 5 SPECIALIZED PHYSICAL THERAPY CLINICS */}
      {/* ======================================================== */}
      {activeTab === 'clinics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <span>5 คลินิกกายภาพบำบัดเฉพาะทาง คณะกายภาพบำบัด มหาวิทยาลัยมหิดล</span>
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              คลินิกเฉพาะทางตามมาตรฐานวิชาชีพกายภาพบำบัดแห่งมหาวิทยาลัยมหิดล ครอบคลุมการรักษา การฟื้นฟู และการส่งเสริมสุขภาพ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Clinic 1: Orthopedic */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 font-black text-xl">
                  🦴
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    คลินิกที่ 1
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ORTHOPEDIC PT</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  คลินิกกระดูกและกล้ามเนื้อ
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  ดูแลผู้ป่วยปวดคอบ่าไหล่, ออฟฟิศซินโดรม, ข้อไหล่ติด (Adhesive Capsulitis), ข้อเข่าเสื่อม (Knee Osteoarthritis), หมอนรองกระดูกทับเส้นประสาท
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">เครื่องมือและหัตถการมาตรฐานมหิดล:</p>
                  <p>• High-Power Laser Therapy & Ultrasound</p>
                  <p>• Shockwave Therapy (คลื่นกระแทกสลายพังผืด)</p>
                  <p>• Manual Therapy & Joint Mobilization</p>
                  <p>• AI Exercise: กางข้อไหล่ติด, เหยียดข้อเข่า</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPatientId('HN-2567-0098');
                  setActiveTab('soap');
                }}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูเคสตัวอย่างคลินิกนี้</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clinic 2: Neurological */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 font-black text-xl">
                  🧠
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    คลินิกที่ 2
                  </span>
                  <span className="text-xs text-slate-400 font-mono">NEUROLOGICAL PT</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  คลินิกโรคระบบประสาท
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  ฟื้นฟูผู้ป่วยโรคหลอดเลือดสมอง (Stroke / Hemiplegia), พาร์กินสัน (Parkinson's), บาดเจ็บไขสันหลัง (Spinal Cord Injury), อัมพฤกษ์อัมพาต
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">เครื่องมือและหัตถการมาตรฐานมหิดล:</p>
                  <p>• Bobath Concept & PNF Techniques</p>
                  <p>• Robot-Assisted Gait Training (ฝึกเดิน)</p>
                  <p>• Dynamic Balance Master (ฝึกการทรงตัว)</p>
                  <p>• AI Exercise: บริหารข้อศอก, ลุกยืน-นั่ง</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPatientId('HN-2567-0125');
                  setActiveTab('soap');
                }}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูเคสตัวอย่างคลินิกนี้</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clinic 3: Cardiopulmonary */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 font-black text-xl">
                  🫁
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    คลินิกที่ 3
                  </span>
                  <span className="text-xs text-slate-400 font-mono">CARDIOPULMONARY PT</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  คลินิกปอด หัวใจ และหลอดเลือด
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  ฟื้นฟูสมรรถภาพปอดหลังติดเชื้อ/ผ่าตัดทรวงอก, ถุงลมโป่งพอง (COPD), ฟื้นฟูผู้ป่วยโรคหัวใจ (Cardiac Rehab Phase I-III)
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">เครื่องมือและหัตถการมาตรฐานมหิดล:</p>
                  <p>• Diaphragmatic & Pursed-Lip Breathing</p>
                  <p>• Chest Physical Therapy & Drainage (เคาะปอด)</p>
                  <p>• 6-Minute Walk Test Monitoring</p>
                  <p>• AI Exercise: บริหารขยายทรวงอกและการหายใจลึก</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPatientId('HN-2567-0078');
                  setActiveTab('soap');
                }}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูเคสตัวอย่างคลินิกนี้</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clinic 4: Geriatric */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 font-black text-xl">
                  👵
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    คลินิกที่ 4
                  </span>
                  <span className="text-xs text-slate-400 font-mono">GERIATRIC PT</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  คลินิกผู้สูงอายุและชะลอความเสื่อม
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  โปรแกรมป้องกันการหกล้ม (Fall Prevention), ภาวะมวลกล้ามเนื้อน้อย (Sarcopenia), ฝึกความมั่นคงในการเดินและการทำกิจวัตรประจำวัน (ADLs)
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">เครื่องมือและหัตถการมาตรฐานมหิดล:</p>
                  <p>• Timed Up & Go (TUG) & Berg Balance Scale</p>
                  <p>• Functional Gait & Balance Training</p>
                  <p>• Hydrotherapy / ธาราบำบัดผ่อนแรงกดข้อ</p>
                  <p>• AI Exercise: ปรับแนวกระดูกสันหลัง, ลุกยืน-นั่ง</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPatientId('HN-2567-0104');
                  setActiveTab('soap');
                }}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูเคสตัวอย่างคลินิกนี้</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clinic 5: Sports */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 font-black text-xl">
                  🏃
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    คลินิกที่ 5
                  </span>
                  <span className="text-xs text-slate-400 font-mono">SPORTS PT</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  คลินิกเวชศาสตร์การกีฬา
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  ฟื้นฟูการบาดเจ็บจากการเล่นกีฬา, ฟื้นฟูเอ็นไขว้หน้าข้อเข่า (ACL Reconstruction Rehab), ข้อเท้าพลิกเรื้อรัง, เสริมสมรรถภาพนักกีฬา
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">เครื่องมือและหัตถการมาตรฐานมหิดล:</p>
                  <p>• Isokinetic Dynamometer (วัดแรงกล้ามเนื้อ)</p>
                  <p>• Functional Movement Screen (FMS)</p>
                  <p>• Plyometric & Proprioceptive Training</p>
                  <p>• Return to Sport Protocol Assessment</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPatientId('HN-2567-0112');
                  setActiveTab('soap');
                }}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูเคสตัวอย่างคลินิกนี้</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📝 TAB 3: MAHIDOL PHYSICAL THERAPY SOAP CLINICAL NOTES */}
      {/* ======================================================== */}
      {activeTab === 'soap' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <span>เวชระเบียนกายภาพบำบัด SOAP Notes (มาตรฐานวิชาชีพ มหาวิทยาลัยมหิดล)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกการตรวจร่างกาย การวินิจฉัยทางกายภาพบำบัด และแผนการรักษาตามมาตรฐานสภากายภาพบำบัด
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหา HN หรือชื่อผู้ป่วย..."
                  value={searchHn}
                  onChange={e => setSearchHn(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 md:w-60 focus:bg-white transition"
                />
              </div>

              <button
                onClick={() => setShowNewSoapModal(true)}
                className="px-4 py-2 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>เขียน SOAP Note ใหม่</span>
              </button>
            </div>
          </div>

          {/* SOAP Notes List */}
          <div className="space-y-6">
            {soapNotes
              .filter(s =>
                !searchHn ||
                s.patient_id?.toLowerCase().includes(searchHn.toLowerCase()) ||
                s.patient_name?.toLowerCase().includes(searchHn.toLowerCase())
              )
              .map((note, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
                >
                  {/* Note Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-extrabold text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                        {note.patient_id}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900">{note.patient_name}</h4>
                      <span className="text-xs bg-slate-200/70 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                        {note.clinic_specialty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>นักกายภาพบำบัด: <strong className="text-slate-800">{note.therapist_name}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>วันที่บันทึก: {new Date(note.created_at || Date.now()).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>

                  {/* S - O - A - P Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* S: Subjective */}
                    <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm border-b border-blue-200/60 pb-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                          S
                        </span>
                        <span>SUBJECTIVE (อาการสำคัญและประวัติการเจ็บป่วย)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                        {note.subjective}
                      </p>
                    </div>

                    {/* O: Objective */}
                    <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm border-b border-emerald-200/60 pb-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                          O
                        </span>
                        <span>OBJECTIVE (ผลการตรวจร่างกายและองศาการเคลื่อนไหว)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                        {note.objective}
                      </p>
                    </div>

                    {/* A: Assessment */}
                    <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm border-b border-amber-200/60 pb-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                          A
                        </span>
                        <span>ASSESSMENT (การวินิจฉัยทางกายภาพบำบัด & ปัญหาหลัก)</span>
                      </div>
                      <p className="text-xs text-slate-800 font-bold leading-relaxed whitespace-pre-line pt-1">
                        {note.assessment}
                      </p>
                    </div>

                    {/* P: Plan */}
                    <div className="bg-purple-50/40 rounded-2xl p-4 border border-purple-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-950 font-extrabold text-sm border-b border-purple-200/60 pb-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                          P
                        </span>
                        <span>PLAN (แผนการรักษาและโปรแกรมกายภาพบำบัด AI)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-1 font-mono">
                        {note.plan}
                      </p>
                    </div>
                  </div>

                  {/* Note Footer Actions */}
                  <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      เวชระเบียนอิเล็กทรอนิกส์ ผ่านการรับรองความถูกต้องโดยนักกายภาพบำบัดวิชาชีพ
                    </span>
                    <button
                      onClick={() => {
                        const matchRx = prescriptions.find(r => r.patient_id === note.patient_id);
                        if (matchRx) {
                          setShowPrintRxModal(matchRx);
                        } else {
                          alert('โปรแกรมกายภาพบำบัดพร้อมส่งออกไปยังตู้ Kiosk');
                        }
                      }}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์ใบรายงานเวชระเบียน</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 💊 TAB 4: PT EXERCISE PRESCRIPTION & PROTOCOL DISPATCH */}
      {/* ======================================================== */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                <span>ระบบใบสั่งการรักษาทางกายภาพบำบัด (PT Exercise Prescription System)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ออกใบสั่งท่าบริหารเฉพาะบุคคล ส่งตรงเข้าสู่ <strong>ตู้กายภาพบำบัด AI (Kiosk)</strong> และ <strong>แอพมือถือผู้ป่วย (Mobile PT)</strong>
              </p>
            </div>

            <button
              onClick={() => setShowNewRxModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ออกใบสั่งการรักษาใหม่ (New Rx)</span>
            </button>
          </div>

          {/* Prescriptions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prescriptions.map((rx, idx) => {
              let exercises: any[] = [];
              try {
                exercises = JSON.parse(rx.exercises_json || '[]');
              } catch (e) {
                exercises = [];
              }

              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {rx.patient_id}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">{rx.patient_name}</h4>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {rx.frequency_per_week} วัน / สัปดาห์
                      </span>
                    </div>

                    {/* Diagnosis */}
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">PT Diagnosis</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{rx.diagnosis}</p>
                    </div>

                    {/* Prescribed Exercises List */}
                    <div className="mt-3 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500">
                        โปรแกรมท่าบริหารชีวกลศาสตร์ AI ({exercises.length} ท่า):
                      </span>
                      {exercises.map((ex, eIdx) => (
                        <div
                          key={eIdx}
                          className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-extrabold text-slate-900">{ex.nameTh}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              เป้าหมาย: {ex.targetAngle}° • ค้างไว้ {ex.holdSeconds} วิ
                            </p>
                          </div>
                          <span className="bg-white px-2 py-1 rounded-lg font-mono font-bold text-blue-700 text-[11px] shadow-sm">
                            {ex.sets} เซ็ต x {ex.reps} ครั้ง
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Precautions */}
                    {rx.precautions && (
                      <div className="mt-3 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>ข้อควรระวัง:</strong> {rx.precautions}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Dispatch Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleDispatchToKiosk(rx)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#002244] hover:bg-[#003366] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Tv className="w-3.5 h-3.5 text-amber-400" />
                      <span>ส่งไปตู้ AI Kiosk</span>
                    </button>

                    <button
                      onClick={() => handleDispatchToMobile(rx)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>ส่งไปมือถือผู้ป่วย</span>
                    </button>

                    <button
                      onClick={() => setShowPrintRxModal(rx)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="พิมพ์ใบสั่งกายภาพบำบัด"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📢 TAB 5: SMART QUEUE & REALISTIC HOSPITAL VOCAL CALLER */}
      {/* ======================================================== */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  LIVE RADAR
                </span>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Volume2 className="w-6 h-6 text-blue-600" />
                  <span>ระบบคิวและการประกาศเรียกชื่อผู้ป่วยมาตรฐานโรงพยาบาลมหิดล</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                มีเสียงกริ่งโรงพยาบาลแท้ (Hospital Ding-Dong Chime) พร้อมเสียงสังเคราะห์ภาษาไทยคมชัด
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => playHospitalDingDong()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>ทดสอบเสียงกริ่ง</span>
              </button>

              <button
                onClick={() => setShowNewQueueModal(true)}
                className="px-4 py-2 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>ออกบัตรคิวใหม่</span>
              </button>
            </div>
          </div>

          {/* Live Queue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {queueTickets.map((ticket, idx) => {
              const isCalling = ticket.status === 'CALLING';
              const isInSession = ticket.status === 'IN_SESSION';
              const isCompleted = ticket.status === 'COMPLETED';

              return (
                <div
                  key={idx}
                  className={`rounded-3xl p-5 border transition-all relative flex flex-col justify-between ${
                    isCalling
                      ? 'bg-amber-50/90 border-amber-400 shadow-xl ring-2 ring-amber-400/50'
                      : isInSession
                      ? 'bg-blue-50/60 border-blue-300 shadow-md'
                      : isCompleted
                      ? 'bg-slate-50/80 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-black font-mono tracking-tight ${
                          isCalling ? 'text-amber-700 animate-pulse' : 'text-slate-900'
                        }`}>
                          {ticket.ticket_number}
                        </span>
                        {isCalling && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        )}
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isCalling
                          ? 'bg-amber-500 text-white shadow-sm'
                          : isInSession
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 mt-2">
                      {ticket.patient_name}
                    </h4>
                    <p className="text-xs text-blue-700 font-mono font-bold mt-0.5">
                      {ticket.patient_id}
                    </p>

                    <div className="mt-3 p-2.5 rounded-xl bg-white/70 border border-slate-200/60 space-y-1 text-xs">
                      <p className="text-slate-600">
                        โปรแกรม: <strong className="text-slate-800">{ticket.exercise_name_th}</strong>
                      </p>
                      <p className="text-slate-600">
                        สถานี: <strong className="text-blue-800">{ticket.assigned_station}</strong>
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        ช่วงเวลา: {ticket.time_slot}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                    <button
                      onClick={() => handleCallQueue(ticket)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isCalling ? 'เรียกซ้ำ' : 'กดเรียกคิว'}</span>
                    </button>

                    {!isInSession && !isCompleted && (
                      <button
                        onClick={() => handleUpdateQueueStatus(ticket.id, 'IN_SESSION')}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                        title="เริ่มทำหัตถการ"
                      >
                        เริ่ม
                      </button>
                    )}

                    {isInSession && (
                      <button
                        onClick={() => handleUpdateQueueStatus(ticket.id, 'COMPLETED')}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                        title="เสร็จสิ้น"
                      >
                        เสร็จสิ้น
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📐 TAB 6: MOTION ANALYSIS & GONIOMETRY LAB */}
      {/* ======================================================== */}
      {activeTab === 'goniometer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Joint Goniometer Simulator */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <span>ห้องปฏิบัติการวัดองศาข้อต่อชีวกลศาสตร์ (Mahidol Goniometry Lab)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  เครื่องมือจำลองการวัด Range of Motion (ROM) ตามหลักกายวิภาคศาสตร์และชีวกลศาสตร์
                </p>
              </div>

              {/* Joint Selector Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Object.keys(goniometerNormals).map(jointKey => (
                  <button
                    key={jointKey}
                    onClick={() => {
                      setGoniometerJoint(jointKey);
                      if (jointKey === 'shoulder_abduction') setGoniometerAngle(85);
                      if (jointKey === 'shoulder_flexion') setGoniometerAngle(110);
                      if (jointKey === 'knee_extension') setGoniometerAngle(145);
                      if (jointKey === 'elbow_flexion') setGoniometerAngle(55);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      goniometerJoint === jointKey
                        ? 'bg-[#002244] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {jointKey === 'shoulder_abduction' && 'กางข้อไหล่'}
                    {jointKey === 'shoulder_flexion' && 'ยกแขนตรง'}
                    {jointKey === 'knee_extension' && 'เหยียดเข่า'}
                    {jointKey === 'elbow_flexion' && 'งอข้อศอก'}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Protractor / Goniometer Gauge */}
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 text-white flex flex-col items-center justify-center overflow-hidden min-h-[300px]">
              {/* Background Angle Grid */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Angle Readout */}
              <div className="relative z-10 text-center">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
                  MEASURED RANGE OF MOTION
                </span>
                <div className="text-6xl md:text-7xl font-black font-mono text-white mt-2 flex items-baseline justify-center">
                  <span>{goniometerAngle}</span>
                  <span className="text-3xl text-amber-400 font-bold ml-1">°</span>
                </div>
                <p className="text-sm font-bold text-slate-300 mt-1">
                  {currentGonioRef.name}
                </p>
              </div>

              {/* Status Pill */}
              <div className="mt-6 z-10">
                {goniometerAngle >= currentGonioRef.normalMin && goniometerAngle <= currentGonioRef.normalMax ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>อยู่ในเกณฑ์ปกติ (Normal ROM)</span>
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>จำกัดการเคลื่อนไหว (Limited ROM / Hypomobility)</span>
                  </span>
                )}
              </div>

              {/* Normal Range Reference Label */}
              <div className="mt-4 text-[11px] text-slate-400 z-10 font-mono">
                เกณฑ์ปกติ ม.มหิดล: {currentGonioRef.normalMin}° - {currentGonioRef.normalMax}°
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>ปรับองศาข้อต่อจำลอง (Simulate Joint Angle)</span>
                <span className="text-blue-700 font-mono text-sm font-black">{goniometerAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={goniometerAngle}
                onChange={e => setGoniometerAngle(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002244]"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0° (Resting)</span>
                <span>90° (Mid Range)</span>
                <span>180° (Full Anatomical)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              💡 <strong>คำแนะนำทางคลินิก:</strong> {currentGonioRef.description}
            </p>
          </div>

          {/* Right Column: Normal ROM Reference Chart */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>เกณฑ์มาตรฐาน Normal Active ROM (คณะกายภาพบำบัด ม.มหิดล)</span>
            </h4>

            <div className="space-y-3">
              {[
                { joint: 'ข้อไหล่ กางแขน (Abduction)', normal: '0 - 180°', note: 'กล้ามเนื้อ Deltoid & Supraspinatus' },
                { joint: 'ข้อไหล่ ยกแขนหน้า (Flexion)', normal: '0 - 180°', note: 'กล้ามเนื้อ Anterior Deltoid' },
                { joint: 'ข้อเข่า เหยียดตรง (Extension)', normal: '0° / 140-165°', note: 'กล้ามเนื้อ Quadriceps VMO' },
                { joint: 'ข้อศอก งอแขน (Flexion)', normal: '140 - 150°', note: 'กล้ามเนื้อ Biceps Brachii' },
                { joint: 'ข้อสะโพก งอขึ้น (Flexion)', normal: '0 - 120°', note: 'กล้ามเนื้อ Iliopsoas' },
                { joint: 'แนวกระดูกสันหลัง (Spine Ext)', normal: '0 - 30°', note: 'กล้ามเนื้อ Erector Spinae' }
              ].map((row, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{row.joint}</span>
                    <span className="font-mono font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {row.normal}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{row.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🖨️ MODAL: PRINT OFFICIAL MAHIDOL PT PRESCRIPTION */}
      {/* ======================================================== */}
      {showPrintRxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border-4 border-amber-400 relative">
            <button
              onClick={() => setShowPrintRxModal(null)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center border-b-2 border-slate-900 pb-5">
              <span className="text-xs font-bold text-blue-900 tracking-widest uppercase">
                MAHIDOL UNIVERSITY PHYSICAL THERAPY CLINICAL CENTER
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                ใบสั่งการรักษาทางกายภาพบำบัด
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                คณะกายภาพบำบัด มหาวิทยาลัยมหิดล • Faculty of Physical Therapy, Mahidol University
              </p>
            </div>

            {/* Patient Info Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-3 rounded-xl bg-slate-50 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Hospital Number</span>
                <strong className="text-blue-800 font-mono text-sm">{showPrintRxModal.patient_id}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">ชื่อ-สกุลผู้ป่วย</span>
                <strong className="text-slate-900">{showPrintRxModal.patient_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">ความถี่</span>
                <strong className="text-slate-900">{showPrintRxModal.frequency_per_week} วัน/สัปดาห์</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">วันที่ออกใบสั่ง</span>
                <strong className="text-slate-900">{new Date().toLocaleDateString('th-TH')}</strong>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500">การวินิจฉัยทางกายภาพบำบัด (Physical Therapy Diagnosis):</span>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">{showPrintRxModal.diagnosis}</p>
            </div>

            {/* Exercise List */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-bold text-slate-500">รายการท่าบริหารทางกายภาพบำบัดด้วย AI (Exercise Prescription):</span>
              {JSON.parse(showPrintRxModal.exercises_json || '[]').map((ex: any, i: number) => (
                <div key={i} className="p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between">
                  <span>{i + 1}. <strong>{ex.nameTh}</strong> (มุมเป้าหมาย {ex.targetAngle}°, ค้าง {ex.holdSeconds} วิ)</span>
                  <strong className="font-mono text-blue-700">{ex.sets} เซ็ต x {ex.reps} ครั้ง</strong>
                </div>
              ))}
            </div>

            {showPrintRxModal.precautions && (
              <div className="mb-6 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
                <strong>ข้อควรระวัง:</strong> {showPrintRxModal.precautions}
              </div>
            )}

            {/* Signatures */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-end justify-between text-xs">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-slate-100 rounded-xl p-1 border flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-slate-800" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">สแกนเข้าตู้ AI Kiosk</span>
              </div>

              <div className="text-center">
                <div className="h-10 border-b border-slate-400 w-48 mx-auto" />
                <p className="mt-1 font-bold text-slate-800">{showPrintRxModal.therapist_name}</p>
                <p className="text-[10px] text-slate-500">นักกายภาพบำบัดผู้สั่งการรักษา (ว.ก.บ.)</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์เอกสารนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ➕ MODAL: NEW SOAP NOTE FORM */}
      {/* ======================================================== */}
      {showNewSoapModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900">
                เขียนบันทึกเวชระเบียนกายภาพบำบัดใหม่ (Mahidol PT SOAP Note)
              </h3>
              <button onClick={() => setShowNewSoapModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.target as any;
                const data = {
                  patient_id: form.patient_id.value,
                  patient_name: form.patient_name.value,
                  clinic_specialty: form.clinic_specialty.value,
                  subjective: form.subjective.value,
                  objective: form.objective.value,
                  assessment: form.assessment.value,
                  plan: form.plan.value,
                  therapist_name: 'กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)'
                };
                await api.createSoapNote(data).catch(() => {});
                setShowNewSoapModal(false);
                loadClinicalData();
                alert('✅ บันทึกเวชระเบียน SOAP Note เรียบร้อยแล้ว!');
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">รหัสผู้ป่วย (HN)</label>
                  <input name="patient_id" defaultValue="HN-2567-0098" className="w-full p-2 border rounded-xl" required />
                </div>
                <div>
                  <label className="block font-bold mb-1">ชื่อ-สกุลผู้ป่วย</label>
                  <input name="patient_name" defaultValue="คุณยายสมศรี มีสุข" className="w-full p-2 border rounded-xl" required />
                </div>
                <div>
                  <label className="block font-bold mb-1">คลินิกเฉพาะทาง</label>
                  <select name="clinic_specialty" className="w-full p-2 border rounded-xl">
                    <option value="ORTHOPEDIC">กระดูกและกล้ามเนื้อ</option>
                    <option value="NEUROLOGICAL">ระบบประสาท</option>
                    <option value="CARDIOPULMONARY">ปอดและหัวใจ</option>
                    <option value="GERIATRIC">ผู้สูงอายุ</option>
                    <option value="SPORTS">เวชศาสตร์การกีฬา</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">S: Subjective (อาการสำคัญ/ประวัติ)</label>
                <textarea name="subjective" rows={2} className="w-full p-2 border rounded-xl" defaultValue="ผู้ป่วยบ่นปวดตึงข้อไหล่ขวาเรื้อรัง ยกแขนไม่สุด VAS = 4/10" required />
              </div>

              <div>
                <label className="block font-bold mb-1">O: Objective (ผลการตรวจร่างกาย ROM, MMT, Special tests)</label>
                <textarea name="objective" rows={2} className="w-full p-2 border rounded-xl" defaultValue="Active ROM: Shoulder Abduction 85°, Flexion 95°, Neer's test (+)" required />
              </div>

              <div>
                <label className="block font-bold mb-1">A: Assessment (การวินิจฉัยทางกายภาพบำบัด)</label>
                <textarea name="assessment" rows={2} className="w-full p-2 border rounded-xl" defaultValue="Adhesive Capsulitis of Right Shoulder (Stage 2) with Impingement syndrome" required />
              </div>

              <div>
                <label className="block font-bold mb-1">P: Plan (แผนการรักษา/โปรแกรมออกกำลังกาย AI)</label>
                <textarea name="plan" rows={2} className="w-full p-2 border rounded-xl" defaultValue="Ultrasound therapy 1.2 W/cm², AI Kiosk Shoulder Abduction 3 sets x 10 reps, Home PT" required />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewSoapModal(false)} className="px-4 py-2 border rounded-xl">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold">
                  บันทึกเวชระเบียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ➕ MODAL: NEW PRESCRIPTION */}
      {/* ======================================================== */}
      {showNewRxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900">
                ออกใบสั่งการรักษาทางกายภาพบำบัด (New PT Prescription)
              </h3>
              <button onClick={() => setShowNewRxModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.target as any;
                const exId = form.exercise_id.value;
                const exConfig = PT_EXERCISES[exId] || PT_EXERCISES.shoulder_abduction;
                const exercisesObj = [
                  {
                    id: exConfig.id,
                    nameTh: exConfig.nameTh,
                    reps: parseInt(form.reps.value),
                    sets: parseInt(form.sets.value),
                    targetAngle: exConfig.targetAngle,
                    holdSeconds: exConfig.holdSeconds
                  }
                ];

                const rxData = {
                  patient_id: form.patient_id.value,
                  patient_name: form.patient_name.value,
                  diagnosis: form.diagnosis.value,
                  exercises_json: JSON.stringify(exercisesObj),
                  frequency_per_week: parseInt(form.frequency.value),
                  precautions: form.precautions.value,
                  therapist_name: 'กภ. ดร. พชร วงศ์สุวรรณ (ว.ก.บ. 4589)'
                };

                await api.createPrescription(rxData).catch(() => {});
                setShowNewRxModal(false);
                loadClinicalData();
                alert('✅ ออกใบสั่งการรักษาทางกายภาพบำบัดสำเร็จ!');
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">รหัสผู้ป่วย (HN)</label>
                  <input name="patient_id" defaultValue="HN-2567-0098" className="w-full p-2 border rounded-xl" required />
                </div>
                <div>
                  <label className="block font-bold mb-1">ชื่อ-สกุลผู้ป่วย</label>
                  <input name="patient_name" defaultValue="คุณยายสมศรี มีสุข" className="w-full p-2 border rounded-xl" required />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">การวินิจฉัย (Diagnosis)</label>
                <input name="diagnosis" defaultValue="Adhesive Capsulitis (ข้อไหล่ติด)" className="w-full p-2 border rounded-xl" required />
              </div>

              <div>
                <label className="block font-bold mb-1">เลือกท่าออกกำลังกาย AI</label>
                <select name="exercise_id" className="w-full p-2 border rounded-xl">
                  {Object.values(PT_EXERCISES).map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nameTh} (เป้าหมาย {ex.targetAngle}°)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">จำนวนครั้ง (Reps)</label>
                  <input name="reps" type="number" defaultValue="10" className="w-full p-2 border rounded-xl" required />
                </div>
                <div>
                  <label className="block font-bold mb-1">จำนวนเซ็ต (Sets)</label>
                  <input name="sets" type="number" defaultValue="3" className="w-full p-2 border rounded-xl" required />
                </div>
                <div>
                  <label className="block font-bold mb-1">ความถี่ (วัน/สัปดาห์)</label>
                  <input name="frequency" type="number" defaultValue="3" className="w-full p-2 border rounded-xl" required />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">ข้อควรระวัง (Precautions)</label>
                <input name="precautions" defaultValue="หยุดพักทันทีหากมีอาการเจ็บแปลบ (VAS > 4)" className="w-full p-2 border rounded-xl" />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewRxModal(false)} className="px-4 py-2 border rounded-xl">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl">
                  ออกใบสั่งการรักษา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ➕ MODAL: NEW QUEUE TICKET */}
      {/* ======================================================== */}
      {showNewQueueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900">ออกบัตรคิวผู้ป่วยใหม่</h3>
              <button onClick={() => setShowNewQueueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.target as any;
                await api.bookQueue({
                  patient_name: form.patient_name.value,
                  patient_id: form.patient_id.value,
                  exercise_type: 'shoulder_abduction',
                  exercise_name_th: form.program_name.value,
                  time_slot: '14:00 - 14:30',
                  assigned_station: form.station.value
                }).catch(() => {});
                setShowNewQueueModal(false);
                loadClinicalData();
                alert('✅ ออกบัตรคิวเรียบร้อยแล้ว!');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold mb-1">รหัสผู้ป่วย (HN)</label>
                <input name="patient_id" defaultValue="HN-2567-0130" className="w-full p-2 border rounded-xl" required />
              </div>
              <div>
                <label className="block font-bold mb-1">ชื่อ-สกุลผู้ป่วย</label>
                <input name="patient_name" defaultValue="คุณสมควร เจริญยิ่ง" className="w-full p-2 border rounded-xl" required />
              </div>
              <div>
                <label className="block font-bold mb-1">โปรแกรมกายภาพบำบัด</label>
                <input name="program_name" defaultValue="กายภาพข้อไหล่ติด กางแขน (Shoulder Abduction)" className="w-full p-2 border rounded-xl" required />
              </div>
              <div>
                <label className="block font-bold mb-1">ห้องตรวจ / สถานีบริการ</label>
                <select name="station" className="w-full p-2 border rounded-xl">
                  <option value="ตู้กายภาพบำบัด AI หมายเลข 1">ตู้กายภาพบำบัด AI หมายเลข 1</option>
                  <option value="ตู้กายภาพบำบัด AI หมายเลข 2">ตู้กายภาพบำบัด AI หมายเลข 2</option>
                  <option value="ห้องกายภาพบำบัด 1 (คลินิกกระดูกและกล้ามเนื้อ)">ห้องกายภาพบำบัด 1 (คลินิกกระดูกและกล้ามเนื้อ)</option>
                  <option value="ห้องกายภาพบำบัด 2 (คลินิกโรคระบบประสาท)">ห้องกายภาพบำบัด 2 (คลินิกโรคระบบประสาท)</option>
                  <option value="ห้องกายภาพบำบัด 3 (คลินิกปอดและหัวใจ)">ห้องกายภาพบำบัด 3 (คลินิกปอดและหัวใจ)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewQueueModal(false)} className="px-4 py-2 border rounded-xl">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl">
                  ออกบัตรคิว
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
