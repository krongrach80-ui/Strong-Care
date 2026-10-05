import React, { useEffect } from 'react';
import {
  Activity,
  Play,
  Users,
  Award,
  ShieldCheck,
  Cpu,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Camera,
  UserCheck,
  Smile,
  ShieldAlert,
  Flame,
  LayoutDashboard
} from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useSeniorStore } from '../../store/seniorStore';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { VoiceGuideButton } from '../../components/VoiceAssistant/VoiceGuideButton';
import { PatientJourneyBanner } from '../../components/Progress/PatientJourneyBanner';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { selectedPatient, openFaceAuth } = usePatientStore();
  const { selectedExercise } = useExerciseStore();
  const { isSeniorMode } = useSeniorStore();

  useEffect(() => {
    voiceAssistant.speakSystem(
      'สวัสดีครับ ยินดีต้อนรับเข้าสู่ Strong Care ระบบช่วยติดตามและวิเคราะห์การฝึกกายภาพด้วย AI เพื่อความปลอดภัยและการฟื้นฟูที่เหมาะสมครับ',
      { key: 'welcome_app', cooldown: 20000 }
    );
  }, []);

  return (
    <div className="space-y-10 pb-16 animate-fadeIn">
      {/* Hero Section (Responsive Hardening: fluid max-width, clamp padding & gap) */}
      <section className="hero relative rounded-[24px] sm:rounded-[28px] overflow-hidden bg-gradient-to-br from-white via-[#f4fbf7] to-[#e8f8ef] border border-emerald-200/80 shadow-lg shadow-emerald-500/5 py-6 sm:py-8 xl:py-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 hero-content items-center">
          {/* Left Column (1.15fr) */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300/80 text-emerald-800 text-[11px] sm:text-xs font-semibold uppercase tracking-wider shadow-sm max-w-full truncate">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Next-Gen AI Vision Rehabilitation Platform</span>
            </div>

            <h1 className={`${isSeniorMode ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-4xl lg:text-5xl'} font-extrabold text-slate-900 tracking-tight leading-tight`}>
              Strong Care{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                AI Rehabilitation
              </span>
            </h1>

            <div className="space-y-1">
              <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-800 leading-snug">
                “แพลตฟอร์ม AI ช่วยติดตามและวิเคราะห์การฝึกกายภาพ เพื่อการฝึกที่ปลอดภัย เหมาะสมกับผู้ใช้แต่ละราย และคำนึงถึงความเป็นส่วนตัว”
              </p>
              <p className="text-xs sm:text-sm text-emerald-800 font-mono">
                “AI-assisted rehabilitation monitoring platform for safer, personalized, and privacy-conscious physical rehabilitation.”
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              ยึดหลักการ <strong className="text-slate-800">AI วิเคราะห์ → AI เสนอ → มนุษย์ตรวจสอบ → มนุษย์อนุมัติ → ระบบจึงเปลี่ยนแผน</strong> โดยห้าม AI เปลี่ยนแปลง Prescription เองเด็ดขาด พร้อมการันตีความปลอดภัยด้วยระบบ <strong className="text-emerald-700">Immediate Voice Preemption</strong> และการประมวลผลเวกเตอร์ชีวมิติ 128 มิติแบบ Edge AI
            </p>

            {/* CTAs (Stack on mobile, row on tablet/desktop) */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => onNavigate('training')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/20 transition transform active:scale-95 min-h-[44px]"
              >
                <Play className="w-5 h-5 fill-white flex-shrink-0" />
                <span>เริ่มกายภาพทันที (Start Workout)</span>
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-emerald-50/80 text-slate-800 border border-emerald-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-sm min-h-[44px]"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>แดชบอร์ดภาพรวม</span>
              </button>

              <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                <VoiceGuideButton pageId="home" label="ฟังคำแนะนำ" />
              </div>
            </div>

            {/* Active Status Banner */}
            <div className="pt-3 border-t border-emerald-200/70 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600">
              <div>
                ผู้ป่วยปัจจุบัน:{' '}
                <strong className="text-slate-900 font-semibold">
                  {selectedPatient ? selectedPatient.name : 'กำลังโหลด...'}
                </strong>
              </div>
              <div>
                โปรแกรมที่เลือก:{' '}
                <strong className="text-emerald-700 font-semibold">
                  {selectedExercise ? selectedExercise.name : 'Shoulder Raise'}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Column: Elderly Face Login Card (0.85fr, min 360px) */}
          <div className="w-full">
            <div className="bg-white/95 rounded-[20px] p-5 sm:p-7 border border-emerald-100 shadow-xl shadow-emerald-600/5 space-y-4 max-w-lg mx-auto xl:max-w-none">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">ยืนยันตัวตนด้วยใบหน้า</h3>
                    <p className="text-[10px] text-slate-500 truncate">สำหรับผู้สูงอายุ ไม่ต้องพิมพ์รหัสผ่าน</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                  Liveness Active
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between text-slate-800 font-semibold gap-2">
                  <span className="truncate">ผู้ใช้งาน: {selectedPatient?.name || 'คุณสมศักดิ์ ชัยชนะ'}</span>
                  <span className="text-emerald-600 font-mono text-[11px] font-bold flex-shrink-0">128-D Vector</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  สแกนตรวจจับการกระพริบตาและหันศีรษะ (EAR & Yaw) ป้องกันการนำรูปถ่ายมาหลอกระบบ
                </p>
              </div>

              <button
                onClick={() => openFaceAuth('login')}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-98 min-h-[44px]"
              >
                <Camera className="w-4 h-4 flex-shrink-0" />
                <span>เปิดกล้องสแกนใบหน้าเข้าใช้งาน</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>ปลอดภัย เข้ารหัส AES-GCM 256</span>
                <button
                  onClick={() => openFaceAuth('enroll')}
                  className="text-emerald-700 font-semibold hover:underline min-h-[30px]"
                >
                  ลงทะเบียนใบหน้าใหม่
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Journey Visual Roadmap (10-Second Elevator Pitch) */}
      <section>
        <PatientJourneyBanner
          onStepClick={(idx) => {
            if (idx === 1) openFaceAuth('login');
            else if (idx === 3 || idx === 4) onNavigate('training');
            else if (idx >= 6) onNavigate('history');
          }}
        />
      </section>

      {/* Master 8-Pillars Flow Architecture */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Master Pipeline</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            ขั้นตอนการทำงาน 8 ขั้นตอนของ Strong Care
          </h2>
          <p className="text-xs text-slate-500">
            ระบบทำงานประสานระหว่าง Edge AI บนเครื่อง และการกำกับดูแลโดยนักกายภาพบำบัด
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { step: '1', title: 'IDENTIFY', desc: 'Face Recognition 128-D', icon: '👤' },
            { step: '2', title: 'VERIFY', desc: 'Liveness EAR Blink', icon: '👁️' },
            { step: '3', title: 'CALIBRATE', desc: '5-Point Readiness', icon: '🎯' },
            { step: '4', title: 'ANALYZE', desc: 'Pose AI 33 Landmarks', icon: '📐' },
            { step: '5', title: 'PROTECT', desc: 'Safety Watchdog Stop', icon: '🛡️' },
            { step: '6', title: 'IMPROVE', desc: 'Delta Progress Tracking', icon: '📈' },
            { step: '7', title: 'ADAPT', desc: 'AI Recommendation', icon: '💡' },
            { step: '8', title: 'APPROVE', desc: 'Therapist Gate', icon: '✍️' },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-[16px] p-3 border border-emerald-100/90 shadow-sm text-center space-y-1.5 hover:border-emerald-300 hover:shadow-md transition"
            >
              <div className="text-xl">{item.icon}</div>
              <div className="text-[10px] font-mono font-bold text-emerald-800">
                {item.step}. {item.title}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Principles & Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-800">AI Assistance & Human Oversight</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            AI ทำหน้าที่วิเคราะห์และให้ข้อเสนอแนะ แต่ไม่มีสิทธิ์ปรับเปลี่ยน Prescription เองโดยพลการ ทุกการเปลี่ยนแปลงต้องผ่านการตรวจสอบและอนุมัติจาก Therapist หรือ Caregiver
          </p>
        </div>

        <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-[12px] bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Safety First & Voice Preemption</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            ระบบ Safety Watchdog มีสิทธิ์หยุดการฝึกฉุกเฉินทันทีเมื่อพบการเคลื่อนไหวกระตุกเกินพิกัด หรือมุม Over-ROM พร้อมตัดเสียงบรรยายและแจ้งเตือนฉุกเฉิน (Priority 10)
          </p>
        </div>

        <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-[12px] bg-teal-50 text-teal-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Privacy by Design & Offline-First</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            ประมวลผลภาพบนเบราว์เซอร์ของผู้ใช้ ไม่ส่งเฟรมวิดีโอหรือภาพใบหน้าไปเซิร์ฟเวอร์ บันทึกข้อมูลลง StrongCareDB พร้อมทำงานออฟไลน์และซิงค์เมื่อมีอินเทอร์เน็ต
          </p>
        </div>
      </section>
    </div>
  );
};
