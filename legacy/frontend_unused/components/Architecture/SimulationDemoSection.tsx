import React, { useState } from 'react';
import { Play, Sparkles, CheckCircle2, User, Activity, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { SimulationDataService, SOMCHAI_PATIENT, SHOULDER_RAISE_DEMO_EXERCISE } from '../../services/simulationDataService';

interface SimulationDemoSectionProps {
  onLoadDemoComplete?: () => void;
  onOpenApprovalGate?: () => void;
}

export const SimulationDemoSection: React.FC<SimulationDemoSectionProps> = ({
  onLoadDemoComplete,
  onOpenApprovalGate,
}) => {
  const [isLoaded, setIsLoaded] = useState(SimulationDataService.isSimulationMode());
  const [loading, setLoading] = useState(false);

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await SimulationDataService.loadSomchaiDemoSession();
      setIsLoaded(true);
      if (onLoadDemoComplete) {
        onLoadDemoComplete();
      }
    } catch (e) {
      console.error('Error loading simulation:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Simulation Banner Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
              SIMULATION / DEMO DATA
            </span>
            <span className="font-bold text-amber-800 dark:text-amber-300">
              โหมดสาธิตจำลองข้อมูลสำหรับการแข่งขัน (Reproducible Presentation)
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            ในวันแข่งขัน หากแสงสว่างหรือกล้องในห้องประชุมไม่เสถียร สามารถกดปุ่มโหลดข้อมูลจำลองนี้เพื่อให้กรรมการเห็นวงจร
            <strong> “วิเคราะห์เปรียบเทียบ → AI Recommendation → Caregiver Approval Gate → อัปเดต Prescription” </strong>
            ได้ครบ 100% ภายใน 30 วินาที โดยไม่ต้องกังวลเรื่องอุปกรณ์
          </p>
        </div>
      </div>

      {/* Dataset Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Profile */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {SOMCHAI_PATIENT.name}
              </h4>
              <p className="text-[11px] font-mono text-slate-500">{SOMCHAI_PATIENT.patient_code} &bull; อายุ {SOMCHAI_PATIENT.age} ปี</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <strong>อาการ:</strong> {SOMCHAI_PATIENT.notes}
          </p>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>โปรแกรมกายภาพ: {SHOULDER_RAISE_DEMO_EXERCISE.name}</span>
          </div>
        </div>

        {/* Comparison Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            COMPARISON METRICS (PREVIOUS VS CURRENT)
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono font-bold text-slate-500 block">ครั้งก่อนหน้า (3 วันก่อน)</span>
              <div className="mt-1 space-y-0.5">
                <div>จำนวนครั้ง: <strong>8 ครั้ง</strong></div>
                <div>ความแม่นยำ: <strong>84%</strong></div>
                <div>ROM สูงสุด: <strong>105°</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200">
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 block">ครั้งล่าสุด (วันนี้)</span>
              <div className="mt-1 space-y-0.5">
                <div>จำนวนครั้ง: <strong className="text-emerald-600">10 ครั้ง (+2)</strong></div>
                <div>ความแม่นยำ: <strong className="text-emerald-600">92% (+8%)</strong></div>
                <div>ROM สูงสุด: <strong className="text-emerald-600">118° (+13°)</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Trigger Flow */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-300 dark:border-emerald-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              สาธิตวงจร AI Recommendation & Approval Gate
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              กดปุ่มด้านล่างเพื่อโหลดชุดข้อมูลจำลองและเปิดหน้าต่างอนุมัติแผนการฝึกสำหรับนักกายภาพทันที
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isLoaded ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isLoaded ? 'โหลดข้อมูลจำลองแล้ว (คลิกเพื่อโหลดซ้ำ)' : 'โหลดข้อมูลตัวอย่างคุณสมชาย'}</span>
            </button>

            {isLoaded && onOpenApprovalGate && (
              <button
                onClick={onOpenApprovalGate}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition active:scale-95 animate-pulse"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>เปิด Approval Gate ให้กรรมการดู</span>
              </button>
            )}
          </div>
        </div>

        {/* Flow visual */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200/60 dark:border-slate-700">
          <span>1. โหลดประวัติฝึก</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          <span>2. AI แนะนำ 115° (+10°)</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-amber-600 dark:text-amber-400">3. รอการอนุมัติ (Gate)</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-700 dark:text-emerald-300">4. ปรับแผนการฝึกใน DB</span>
        </div>
      </div>
    </div>
  );
};
