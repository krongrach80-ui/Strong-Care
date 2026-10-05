import React, { useState } from 'react';
import {
  X,
  Layers,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Database,
  Eye,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Server,
  Zap,
  GitBranch,
  Play,
  AlertCircle,
  PhoneCall,
  History,
} from 'lucide-react';
import { TestMatrixSection } from './TestMatrixSection';
import { SimulationDemoSection } from './SimulationDemoSection';
import { FinalChecklistSection } from './FinalChecklistSection';
import { FailSafeMatrixSection } from './FailSafeMatrixSection';

export type ArchitectureTab = 'pipeline' | 'demoflow' | 'failsafe' | 'matrix' | 'checklist' | 'simulation' | 'boundary';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDemoStep?: (step: string) => void;
  onOpenApprovalGate?: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  onNavigateToDemoStep,
  onOpenApprovalGate,
}) => {
  const [activeTab, setActiveTab] = useState<ArchitectureTab>('pipeline');

  if (!isOpen) return null;

  const demoSteps = [
    {
      num: '①',
      time: '00:00 - 00:20',
      title: 'INTRO & IDENTIFY',
      sub: 'สแกนใบหน้า (Face Login)',
      desc: 'แนะนำแพลตฟอร์ม สแกนใบหน้า MediaPipe 478 จุด ผ่านการคำนวณ Anthropometric Geometric Projection เป็น 128-D Feature Embedding เข้ารหัส AES-GCM',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      num: '②',
      time: '00:20 - 00:40',
      title: 'VERIFY',
      sub: 'Liveness Check (EAR)',
      desc: 'ตรวจจับการกะพริบตาธรรมชาติ และการหันศีรษะ ป้องกันรูปถ่ายนิ่งหรือจอมือถือหลอก',
      color: 'from-cyan-500 to-teal-500',
    },
    {
      num: '③',
      time: '00:40 - 01:20',
      title: 'CALIBRATE',
      sub: 'ตรวจความพร้อม 5 ด่าน',
      desc: 'ตรวจแสงสว่าง ระยะห่าง ร่างกายในเฟรม และความเสถียร นับถอยหลัง 3..2..1..',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      num: '④',
      time: '01:20 - 02:00',
      title: 'ANALYZE',
      sub: 'Shoulder Raise Analysis',
      desc: 'คำนวณมุมข้อต่อ (Angle), ROM จริง, การทรงตัว และนับรอบด้วย 5-State Automaton',
      color: 'from-emerald-500 to-green-600',
    },
    {
      num: '⑤',
      time: '02:00 - 02:30',
      title: 'PROTECT',
      sub: 'Auto Stop & User SOS',
      desc: 'จงใจเอียงตัว → ตรวจจับความเสี่ยง → Safety Voice Preemption → สั่งหยุดฉุกเฉิน (พร้อมปุ่ม SOS)',
      color: 'from-rose-500 to-red-600',
    },
    {
      num: '⑥',
      time: '02:30 - 03:00',
      title: 'IMPROVE',
      sub: 'Progress Tracking',
      desc: 'เปรียบเทียบผลครั้งนี้กับครั้งก่อน (Delta Reps +2, Delta Accuracy +8%, Delta ROM +13°)',
      color: 'from-amber-500 to-orange-500',
    },
    {
      num: '⑦',
      time: '03:00 - 03:20',
      title: 'ADAPT',
      sub: 'AI Recommendation',
      desc: 'สมองกลชีวกลศาสตร์เสนอปรับ Target ROM จาก 105° เป็น 115° ตามสมรรถภาพจริง',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      num: '⑧',
      time: '03:20 - 03:50',
      title: 'APPROVE',
      sub: 'Approval Gate & Audit Trail',
      desc: 'นักกายภาพลงนามอนุมัติ (หรือแก้ค่า) บันทึก Audit Trail ครบ 8 Fields ตามหลัก Governance',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      num: '⑨',
      time: '03:50 - 04:30',
      title: 'OFFLINE & CLOSING',
      sub: 'IndexedDB, Sync & Core Pitch',
      desc: 'บันทึกออฟไลน์ เข้าคิวรอซิงค์ PHP/MySQL และกล่าวประโยคปิดเรื่องความปลอดภัยและความเป็นส่วนตัว',
      color: 'from-indigo-600 to-violet-700',
    },
  ];

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

        {/* Modal Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  SYSTEM ARCHITECTURE & AI PIPELINE
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">v2.4 (Competition Grade)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                สถาปัตยกรรมระบบ & AI Pipeline (สำหรับกรรมการและผู้ทรงคุณวุฒิ)
              </h2>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'pipeline'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📐 AI Pipeline
            </button>
            <button
              onClick={() => setActiveTab('demoflow')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'demoflow'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🏆 3-5 Min Runbook
            </button>
            <button
              onClick={() => setActiveTab('failsafe')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'failsafe'
                  ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🛡 Fail-Safe Matrix
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🧪 Test Matrix (30 เกณฑ์)
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'checklist'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📋 Final Checklist
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'simulation'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 shadow-xs font-bold border border-amber-300 dark:border-amber-700'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-900'
              }`}
            >
              ⚡ Simulation Mode
            </button>
            <button
              onClick={() => setActiveTab('boundary')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'boundary'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🔒 Edge vs Cloud
            </button>
          </div>
        </div>

        {/* TAB 1: AI PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-emerald-900 dark:text-emerald-200 block mb-1">
                สถาปัตยกรรมแบบ Layered Edge Intelligence:
              </strong>
              ระบบทำงานแบบ Client-Side First ประมวลผลทุกโมเดลบนคอมพิวเตอร์ผู้ใช้ผ่าน WebAssembly และ Web Audio โดยไม่มีการส่งภาพหรือสตรีมวิดีโอออกนอกเครื่อง ทำให้ตอบสนองได้แบบ Real-time 30-60 FPS และปกป้องความเป็นส่วนตัวขั้นสูงสุด
            </div>

            {/* Hierarchical Pipeline Block Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              {/* Level 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Layer 1: Sensor & Vision</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">Vision Input</h4>
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    • WebRTC Camera Stream
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-400/40 text-emerald-700 dark:text-emerald-400 font-bold">
                    • MediaPipe Pose (33 Landmark)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-cyan-400/40 text-cyan-700 dark:text-cyan-400 font-bold">
                    • MediaPipe Hand (21 Knuckles)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-400/40 text-teal-700 dark:text-teal-400 font-bold">
                    • MediaPipe Face (478 Points)
                  </div>
                </div>
              </div>

              {/* Level 2 */}
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-2">
                <span className="text-[10px] font-bold text-teal-600 block uppercase">Layer 2: Biomechanics</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">Kinematics Engine</h4>
                <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-200">
                    • Vector Dot Product (Angle)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-200">
                    • RomEngine (Active ROM)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-200">
                    • PostureEngine (Spine Lean)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-200">
                    • State Machine (5 Phases)
                  </div>
                </div>
              </div>

              {/* Level 3 */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <span className="text-[10px] font-bold text-rose-600 block uppercase">Layer 3: Clinical Safety</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">Safety Engine</h4>
                <div className="space-y-1.5 text-[11px] text-rose-900 dark:text-rose-200">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-200 font-bold text-rose-700">
                    • Auto Emergency Stop (AI Detection)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-300 font-bold text-red-800 dark:text-rose-100 bg-rose-100/40">
                    • User SOS (Human Override)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-200">
                    • System-configured safety thresholds (Trunk Lean &gt; 22°, Shoulder Hike &gt; 18°)
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-200 font-bold">
                    • Immediate Voice Preemption: Safety voice immediately interrupts normal guidance
                  </div>
                </div>
              </div>

              {/* Level 4 */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2">
                <span className="text-[10px] font-bold text-purple-600 block uppercase">Layer 4: Storage & Sync</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">IndexedDB & API</h4>
                <div className="space-y-1.5 text-[11px] text-purple-950 dark:text-purple-200">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 font-bold">
                    • IndexedDB Local Stores
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-purple-200">
                    • AES-GCM 128D Encrypted
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-purple-200">
                    • Caregiver Approval Gate
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 text-teal-700 font-bold">
                    • PHP REST API & MySQL
                  </div>
                </div>
              </div>
            </div>

            {/* Master Full-Stack Architecture Tree Diagram (Competition Blueprint) */}
            <div className="p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-emerald-500/40 shadow-inner overflow-x-auto">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-3">
                <span className="font-bold flex items-center gap-1.5 text-white">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  STRONG CARE END-TO-END PIPELINE ARCHITECTURE (COMPETITION MASTER BLUEPRINT)
                </span>
                <span className="text-[10px] text-emerald-400">EDGE AI + CLINICAL GATEWAY</span>
              </div>
              <pre className="leading-relaxed select-all text-[11px] sm:text-xs">
{`                 STRONG CARE PLATFORM
                            │
             ┌──────────────┴──────────────┐
             │                             │
        IDENTIFY                        VERIFY
    Face Recognition                 Liveness (EAR)
     [128-D Embedding]              [Anti-Spoofing]
             │                             │
             └──────────────┬──────────────┘
                            ▼
                       CALIBRATE
              5-Point Readiness Engine
              [Light, Distance, Body, Stable 3..2..1]
                            │
                            ▼
                         ANALYZE
                  Pose + Biomechanics
                  [Trigonometry BA•BC, ROM, Smoothness]
                            │
           ┌────────────────┴────────────────┐
           ▼                                 ▼
        PROTECT                           EXERCISE
     Safety Engine                       Rep / ROM
  ├── Auto Emergency Stop (AI Detection) [5-State Automaton]
  └── User SOS (Human Override)              │
           │                                 │
           └────────────────┬────────────────┘
                            ▼
                         IMPROVE
                      Progress Data
             [ΔReps, ΔAccuracy, ΔROM Historical Deltas]
                            │
                            ▼
                          ADAPT
                     AI Recommendation
                [Target ROM / Reps Adjustment]
                            │
                            ▼
                        APPROVE
                  Therapist / Caregiver
            [Clinical Approval Gate & Audit]
                            │
                            ▼
                       NEW CONFIG
                  [Updated Prescription]
                            │
                            ▼
                   IndexedDB / Sync Queue
                            │
                            ▼
                   PHP REST API / MySQL`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: 3-5 MINUTE DEMO FLOW RUNBOOK */}
        {activeTab === 'demoflow' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Runbook Header */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong className="block mb-0.5">แผนการสาธิต 3-5 นาทีสำหรับวันแข่งขัน (Winning Demo Runbook):</strong>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  สาธิตครบวงจรแบบ Deterministic & High Confidence ตอบกรรมการได้ชัดเจนทุกจุด
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-500 text-white font-mono font-bold text-xs rounded-xl shadow-xs">
                Total Time: 04:30
              </span>
            </div>

            {/* Demo Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {demoSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-emerald-400 transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black font-mono text-emerald-600">{step.num}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {step.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        {step.time}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{step.sub}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Official Winning Closing Pitch Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-950 text-white border-2 border-emerald-400/40 shadow-xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300 uppercase">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>ประโยคปิดการนำเสนอ (Closing Pitch Statement):</span>
              </div>
              <blockquote className="text-sm sm:text-base font-bold text-emerald-100 italic border-l-4 border-emerald-400 pl-4 py-1 leading-relaxed">
                “Strong Care — แพลตฟอร์ม AI ช่วยติดตามและวิเคราะห์การฝึกกายภาพ เพื่อการฝึกที่ปลอดภัย เหมาะสมกับผู้ใช้แต่ละราย และคำนึงถึงความเป็นส่วนตัว โดยทุกการเปลี่ยนแปลงแผนการฝึกยังอยู่ภายใต้การตัดสินใจของมนุษย์”
              </blockquote>
              <p className="text-xs text-slate-300 pl-4 font-mono">
                Core Pitch: “Strong Care — AI-assisted rehabilitation monitoring platform for safer, personalized, and privacy-conscious physical rehabilitation.”
              </p>
            </div>
          </div>
        )}

        {/* TAB: FAIL-SAFE MATRIX */}
        {activeTab === 'failsafe' && (
          <FailSafeMatrixSection />
        )}

        {/* TAB 3: TEST MATRIX */}
        {activeTab === 'matrix' && (
          <TestMatrixSection />
        )}

        {/* TAB 4: FINAL CHECKLIST */}
        {activeTab === 'checklist' && (
          <FinalChecklistSection />
        )}

        {/* TAB 4: SIMULATION MODE */}
        {activeTab === 'simulation' && (
          <SimulationDemoSection
            onLoadDemoComplete={() => {
              // Stay or notify
            }}
            onOpenApprovalGate={() => {
              if (onOpenApprovalGate) {
                onClose();
                onOpenApprovalGate();
              }
            }}
          />
        )}

        {/* TAB 5: EDGE VS CLOUD BOUNDARY */}
        {activeTab === 'boundary' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Edge processing */}
              <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-700 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                      CLIENT-SIDE EDGE AI
                    </span>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      Core rehabilitation monitoring operates offline
                    </h4>
                  </div>
                </div>

                <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300 font-mono">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Real-time Webcam Video Stream (ไม่ส่งออกเน็ต)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Google MediaPipe WASM (Pose + Hand + Face)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Biomechanics & Kinetic Angles Calculation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Safety Engine & Automatic Stop + User SOS Override</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>IndexedDB Local Storage (Sessions & Rep Trails)</span>
                  </li>
                </ul>
              </div>

              {/* Server boundary */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-md">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      TELEHEALTH & DATA SERVER
                    </span>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      เซิร์ฟเวอร์ฐานข้อมูลกลาง (เมื่อออนไลน์)
                    </h4>
                  </div>
                </div>

                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400 font-mono">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>PHP 8.x REST API (`index.php`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>MySQL Database (เก็บบันทึกประวัติเพื่อติดตามระยะยาว)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>Sync Queue Manager (ซิงค์อัตโนมัติเมื่อต่อเน็ต)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>ไม่บันทึกภาพถ่ายใบหน้าดิบ จัดเก็บเฉพาะเวกเตอร์ตัวเลข</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
          <div>
            <span>Strong Care v1.0 &bull; AI-assisted rehabilitation monitoring platform</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            ปิดหน้าต่าง (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
