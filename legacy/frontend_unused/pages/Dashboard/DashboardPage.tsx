import React from 'react';
import {
  Activity,
  Users,
  ShieldCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
  Cpu,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useSeniorStore } from '../../store/seniorStore';
import { ApprovalAuditService } from '../../services/approvalAuditService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { patients, selectedPatient, selectPatient, openFaceAuth } = usePatientStore();
  const { exercises } = useExerciseStore();
  const { isSeniorMode } = useSeniorStore();
  const auditRecords = ApprovalAuditService.getAuditRecords();

  const progressData = [
    { session: 'S-1', rom: 85, accuracy: 82, reps: 8 },
    { session: 'S-2', rom: 92, accuracy: 86, reps: 8 },
    { session: 'S-3', rom: 98, accuracy: 89, reps: 10 },
    { session: 'S-4', rom: 108, accuracy: 91, reps: 10 },
    { session: 'S-5', rom: 115, accuracy: 94, reps: 10 },
    { session: 'S-6', rom: 122, accuracy: 96, reps: 12 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 rounded-[18px] p-6 sm:p-8 text-white shadow-lg shadow-emerald-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-32 -translate-y-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>AI-assisted Rehabilitation Monitoring Platform</span>
            </div>
            <h1 className={`${isSeniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'} font-bold tracking-tight text-white`}>
              แดชบอร์ดภาพรวมการฟื้นฟู (Clinical Overview)
            </h1>
            <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
              ติดตามสถิติการฝึกกายภาพ วิเคราะห์องศาข้อต่อด้วย AI ตรวจสอบความปลอดภัยแบบเรียลไทม์ และกำกับดูแลการเปลี่ยนแผนการรักษาโดยนักกายภาพ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('training')}
              className="flex items-center gap-2 px-5 py-3 rounded-[12px] bg-white text-emerald-800 font-bold hover:bg-emerald-50 transition shadow-md hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-emerald-700 text-emerald-700" />
              <span>เริ่มการฝึกกายภาพ</span>
            </button>
            <button
              onClick={() => openFaceAuth('login')}
              className="flex items-center gap-2 px-4 py-3 rounded-[12px] bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold border border-emerald-400/40 transition active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>สแกนใบหน้า</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clinical Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[18px] p-5 border border-emerald-100/90 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">ผู้ป่วยในการดูแล</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{patients.length || 4} ราย</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              ลงทะเบียนชีวมิติเรียบร้อย
            </span>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-[18px] p-5 border border-emerald-100/90 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">ความแม่นยำเฉลี่ย (Accuracy)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">93.8%</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              +5.4% จากสัปดาห์ก่อน
            </span>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-teal-50 text-teal-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-[18px] p-5 border border-emerald-100/90 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">ป้องกันความเสี่ยง (Safety Halts)</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">18 ครั้ง</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold mt-1">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              ตัดเสียงฉุกเฉินทันที 100%
            </span>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-[18px] p-5 border border-emerald-100/90 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">การอนุมัติทางคลินิก (Audits)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{auditRecords.length} บันทึก</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold mt-1">
              <UserCheck className="w-3 h-3 text-indigo-600" />
              Human Oversight 100%
            </span>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Pipeline Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Rehabilitation Progress Curve */}
        <div className="lg:col-span-2 bg-white rounded-[18px] p-6 border border-emerald-100/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>พัฒนาการช่วงการเคลื่อนไหว (ROM & Accuracy Trajectory)</span>
              </h2>
              <p className="text-xs text-slate-500">เปรียบเทียบองศาข้อต่อและความแม่นยำ 6 เซสชันล่าสุดของผู้ป่วย</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ผู้ป่วย: {selectedPatient?.name || 'คุณสมชาย มีสุข'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="romGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="session" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[60, 140]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any, name: string) => [
                    name === 'rom' ? `${val}° (องศา)` : `${val}% (ความแม่นยำ)`,
                    name === 'rom' ? 'Peak ROM' : 'Accuracy'
                  ]}
                />
                <Area type="monotone" dataKey="rom" stroke="#22C55E" strokeWidth={2.5} fillOpacity={1} fill="url(#romGradient)" />
                <Area type="monotone" dataKey="accuracy" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#accGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Peak ROM (° องศา)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                Accuracy (% ความแม่นยำ)
              </span>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              ดูประวัติทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Clinical Oversight & Pending Approval Gate */}
        <div className="bg-white rounded-[18px] p-6 border border-emerald-100/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>ประตูการอนุมัติ (Approval Gate)</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                AI แนะนำ
              </span>
            </div>

            <div className="p-4 rounded-[14px] bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Shoulder Raise (กางแขนยกหัวไหล่)</span>
                <span className="text-[10px] text-slate-500">ผู้ป่วย PT-2026-001</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI วิเคราะห์พบผู้ป่วยทำความแม่นยำ 96% และ ROM 122° สม่ำเสมอ เสนอปรับเพิ่มเป้าหมายเป็น <strong>125°</strong> (เดิม 120°)
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onNavigate('history')}
                  className="flex-1 py-2 px-3 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                >
                  เปิด Approval Gate
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className="py-2 px-3 rounded-[10px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
                >
                  รายงาน
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">หลักการกำกับดูแลทางคลินิก (Governance)</span>
              <ul className="text-xs text-slate-500 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>AI เสนอแนะ แต่มนุษย์ต้องเป็นผู้อนุมัติเสมอ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>บันทึกชื่อผู้ดูแลและเหตุผลลงใน Audit Trail</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>ประมวลผลบนเครื่อง (Client-side Edge AI) ปลอดภัย 100%</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              บันทึกล่าสุด: {auditRecords[0]?.approved_by || 'กภ. วริศรา'}
            </span>
            <span className="text-emerald-700 font-bold">APPROVED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
