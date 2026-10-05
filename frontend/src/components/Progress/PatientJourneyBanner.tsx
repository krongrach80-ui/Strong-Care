import React from 'react';
import {
  Calendar,
  UserCheck,
  Compass,
  Activity,
  ShieldAlert,
  BarChart3,
  GitCompare,
  Sparkles,
  Stethoscope,
  ChevronRight,
  ArrowDown
} from 'lucide-react';

interface PatientJourneyBannerProps {
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const PatientJourneyBanner: React.FC<PatientJourneyBannerProps> = ({
  onStepClick,
  className = '',
}) => {
  const journeySteps = [
    {
      num: 1,
      title: 'วันนี้',
      desc: 'นัดหมายกายภาพ',
      icon: Calendar,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      num: 2,
      title: 'ตรวจสอบตัวตน',
      desc: 'Face + Liveness',
      icon: UserCheck,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    {
      num: 3,
      title: 'ประเมินความพร้อม',
      desc: 'Calibration 3..2..1',
      icon: Compass,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      num: 4,
      title: 'ฝึก',
      desc: 'Real-time Angle & Reps',
      icon: Activity,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    },
    {
      num: 5,
      title: 'ตรวจความปลอดภัย',
      desc: 'Safety Engine Watchdog',
      icon: ShieldAlert,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      num: 6,
      title: 'สรุปผล',
      desc: 'ROM, Reps, Accuracy',
      icon: BarChart3,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      num: 7,
      title: 'เปรียบเทียบอดีต',
      desc: 'Baseline vs Current',
      icon: GitCompare,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      num: 8,
      title: 'AI Recommendation',
      desc: 'Explainable AI (XAI)',
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      num: 9,
      title: 'Therapist Approval',
      desc: 'Human Gate & Audit',
      icon: Stethoscope,
      color: 'bg-teal-100 text-teal-900 border-teal-400 font-bold',
    },
    {
      num: 10,
      title: 'แผนครั้งถัดไป',
      desc: 'Updated Prescription',
      icon: Calendar,
      color: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
    },
  ];

  return (
    <div className={`p-5 rounded-[20px] bg-white border border-emerald-100 shadow-sm space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 font-bold">
            👤
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span>PATIENT JOURNEY — การเดินทางฟื้นฟูของผู้ป่วย</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                10-Sec Clinical Value
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              กระบวนการฟื้นฟูตั้งแต่ระบุตัวตนจนถึงการอนุมัติแผนใหม่ โดยมีมนุษย์เป็นผู้ตัดสินใจขั้นสุดท้าย
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Desktop Flow / Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {journeySteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              onClick={() => onStepClick && onStepClick(index)}
              className={`p-2.5 rounded-[14px] border text-center transition flex flex-col justify-between items-center group cursor-pointer hover:shadow-md hover:scale-[1.03] ${step.color}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[9px] font-mono font-bold opacity-70">#{step.num}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold leading-tight block mb-0.5">{step.title}</span>
              <span className="text-[9px] opacity-80 leading-snug">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
