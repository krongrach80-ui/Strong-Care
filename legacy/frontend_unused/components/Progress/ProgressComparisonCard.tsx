import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Info,
  CheckCircle2,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';
import { ProgressComparison } from '../../types/progress';
import { useExerciseStore } from '../../store/exerciseStore';
import { CaregiverApprovalGateModal } from './CaregiverApprovalGateModal';

interface ProgressComparisonCardProps {
  progress: ProgressComparison;
  exerciseId?: number;
  onApplyAdaptiveConfig?: (newAngle?: number, newReps?: number) => void;
}

export const ProgressComparisonCard: React.FC<ProgressComparisonCardProps> = ({
  progress,
  exerciseId,
  onApplyAdaptiveConfig,
}) => {
  const { selectedExercise } = useExerciseStore();
  const [applied, setApplied] = useState(false);
  const [isApprovalGateOpen, setIsApprovalGateOpen] = useState(false);

  const handleOpenApprovalGate = () => {
    setIsApprovalGateOpen(true);
  };

  const handleApprovalSuccess = (newAngle: number, newReps: number) => {
    setApplied(true);
    if (onApplyAdaptiveConfig) {
      onApplyAdaptiveConfig(newAngle, newReps);
    }
  };

  const { current, previous, deltas, baseline, trend, adaptiveRecommendation } = progress;
  const xai = adaptiveRecommendation?.xaiReasoning;

  return (
    <div className="bg-white border border-emerald-100 rounded-[20px] p-6 sm:p-7 shadow-sm space-y-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              พัฒนาการและการเปรียบเทียบ (Patient Progress & Baseline)
            </h3>
            <p className="text-xs text-slate-500">
              วิเคราะห์เปรียบเทียบจุดเริ่มต้น (Baseline), ครั้งก่อนหน้า และแนวโน้มประสิทธิภาพ
            </p>
          </div>
        </div>

        {progress.hasPreviousSession && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono inline-flex items-center gap-1.5 self-start sm:self-auto ${
              progress.isImproved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {progress.isImproved ? <TrendingUp className="w-3.5 h-3.5 text-emerald-700" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-700" />}
            {progress.isImproved ? 'พัฒนาการดีขึ้น (Improving)' : 'คงที่ / ล้ากล้ามเนื้อ'}
          </span>
        )}
      </div>

      {/* 1. Patient Baseline Trajectory */}
      {baseline && (
        <div className="p-4 rounded-[16px] bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-blue-50/40 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>จุดอ้างอิงเริ่มต้นของผู้ป่วย (Patient Baseline Comparison)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              บันทึกเมื่อ: {baseline.baselineDate.split(' ')[0]}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-white/90 rounded-[12px] border border-emerald-100 shadow-xs">
              <span className="text-[10px] text-slate-500 block">Baseline ROM</span>
              <span className="text-base font-black text-slate-800 font-mono">{baseline.baselineRom}°</span>
              <span className="text-[10px] text-slate-400 block">จุดเริ่มต้น</span>
            </div>

            <div className="p-3 bg-white/90 rounded-[12px] border border-emerald-100 shadow-xs">
              <span className="text-[10px] text-slate-500 block">Current Peak ROM</span>
              <span className="text-base font-black text-emerald-700 font-mono">{Math.round(current.maxAngle)}°</span>
              <span className="text-[10px] font-bold text-emerald-600 block">
                +{baseline.romImprovementPct}% พัฒนาขึ้น
              </span>
            </div>

            <div className="p-3 bg-white/90 rounded-[12px] border border-emerald-100 shadow-xs">
              <span className="text-[10px] text-slate-500 block">Baseline Accuracy</span>
              <span className="text-base font-black text-slate-800 font-mono">{baseline.baselineAccuracy}%</span>
              <span className="text-[10px] text-slate-400 block">ความแม่นยำแรกเริ่ม</span>
            </div>

            <div className="p-3 bg-white/90 rounded-[12px] border border-emerald-100 shadow-xs">
              <span className="text-[10px] text-slate-500 block">Current Accuracy</span>
              <span className="text-base font-black text-teal-700 font-mono">{current.accuracy}%</span>
              <span className="text-[10px] font-bold text-teal-600 block">
                +{baseline.accuracyImprovementPct}% แม่นยำขึ้น
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Today vs Previous Session Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Session */}
        <div className="p-4 rounded-[16px] bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>🌟 เซสชันวันนี้ (Current Session)</span>
            <span className="font-mono text-slate-500">{current.date.split(' ')[0]}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white rounded-[10px] border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-500 block">จำนวนครั้ง</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{current.totalReps}</span>
              <span className="text-[10px] text-slate-400 block">Reps</span>
            </div>
            <div className="p-2.5 bg-white rounded-[10px] border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-500 block">ความแม่นยำ</span>
              <span className="text-lg font-bold text-emerald-600 font-mono">{current.accuracy}%</span>
              <span className="text-[10px] text-slate-400 block">Accuracy</span>
            </div>
            <div className="p-2.5 bg-white rounded-[10px] border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-500 block">ช่วงข้อต่อ (ROM)</span>
              <span className="text-lg font-bold text-teal-600 font-mono">{Math.round(current.maxAngle)}°</span>
              <span className="text-[10px] text-slate-400 block">Peak Angle</span>
            </div>
          </div>
        </div>

        {/* Previous Session with Deltas */}
        <div className="p-4 rounded-[16px] bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>📅 ครั้งก่อนหน้า (Previous Session)</span>
            <span className="font-mono text-slate-400">
              {previous ? previous.date.split(' ')[0] : 'ยังไม่มีข้อมูลก่อนหน้า'}
            </span>
          </div>

          {previous ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-[10px] border border-slate-100 shadow-xs">
                <span className="text-[10px] text-slate-500 block">จำนวนครั้ง</span>
                <span className="text-lg font-bold text-slate-700 font-mono">{previous.totalReps}</span>
                {deltas.repsDiff !== 0 && (
                  <span className={`text-[10px] font-bold block ${deltas.repsDiff > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {deltas.repsDiff > 0 ? `+${deltas.repsDiff}` : deltas.repsDiff}
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-white rounded-[10px] border border-slate-100 shadow-xs">
                <span className="text-[10px] text-slate-500 block">ความแม่นยำ</span>
                <span className="text-lg font-bold text-slate-700 font-mono">{previous.accuracy}%</span>
                {deltas.accuracyDiff !== 0 && (
                  <span className={`text-[10px] font-bold block ${deltas.accuracyDiff > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {deltas.accuracyDiff > 0 ? `+${deltas.accuracyDiff}%` : `${deltas.accuracyDiff}%`}
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-white rounded-[10px] border border-slate-100 shadow-xs">
                <span className="text-[10px] text-slate-500 block">ช่วงข้อต่อ (ROM)</span>
                <span className="text-lg font-bold text-slate-700 font-mono">{Math.round(previous.maxAngle)}°</span>
                {deltas.romDiff !== 0 && (
                  <span className={`text-[10px] font-bold block ${deltas.romDiff > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {deltas.romDiff > 0 ? `+${Math.round(deltas.romDiff)}°` : `${Math.round(deltas.romDiff)}°`}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center text-xs text-slate-400">
              นี่คือการฝึกเซสชันแรกของผู้ป่วย
            </div>
          )}
        </div>
      </div>

      {/* 3. Performance Trend Observation */}
      {trend && trend.length > 0 && (
        <div className="p-3.5 rounded-[14px] bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">📈 Performance Trend:</span>
            <span className="text-slate-600 italic">
              {xai?.trendObservation || '“แนวโน้มการควบคุม ROM ดีขึ้นอย่างต่อเนื่อง ไม่พบอาการเกร็งชดเชย”'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            {trend.map((pt, i) => (
              <span
                key={i}
                title={`${pt.sessionLabel}: ROM ${pt.rom}°, Acc ${pt.accuracy}%`}
                className={`px-2 py-0.5 rounded ${
                  i === trend.length - 1 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pt.rom}°
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Explainable AI (XAI) Recommendation Card */}
      {adaptiveRecommendation && (
        <div className="p-5 rounded-[18px] bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white border border-emerald-300 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-slate-900">
                {adaptiveRecommendation.title}
              </h4>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {xai?.recommendationCode || 'REC-SC-00421'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                AI Confidence: {xai?.confidenceScore || 96}%
              </span>
            </div>
          </div>

          {/* XAI Evidence & Metrics Breakdown */}
          {xai && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-[10px] bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
                <span className="font-bold text-emerald-700 text-sm">{xai.metricsSummary.accuracyPct}% ↑</span>
              </div>
              <div className="p-2 rounded-[10px] bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-sans">ROM Delta</span>
                <span className="font-bold text-teal-700 text-sm">
                  {xai.metricsSummary.romDeltaDeg >= 0 ? `+${xai.metricsSummary.romDeltaDeg}°` : `${xai.metricsSummary.romDeltaDeg}°`}
                </span>
              </div>
              <div className="p-2 rounded-[10px] bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-sans">Correct Reps</span>
                <span className="font-bold text-slate-800 text-sm">{xai.metricsSummary.correctRepsRatio}</span>
              </div>
              <div className="p-2 rounded-[10px] bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-sans">Safety Events</span>
                <span className="font-bold text-emerald-700 text-sm">{xai.metricsSummary.safetyEventsCount}</span>
              </div>
            </div>
          )}

          {/* Transparent Reasoning Checklist */}
          {xai?.reasons && (
            <div className="space-y-1.5 p-3.5 rounded-[12px] bg-white/80 border border-emerald-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">
                ทำไม AI ถึงแนะนำการปรับระดับนี้? (Explainable AI Rationale):
              </span>
              {xai.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Proposed Values vs Current Prescription */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="text-xs text-slate-700 space-y-0.5">
              <span className="font-bold text-emerald-900 block">ข้อเสนอการปรับเปลี่ยน (AI Proposed):</span>
              <p className="font-mono text-slate-600">
                Target ROM: {selectedExercise?.target_angle || 110}° → <strong>{adaptiveRecommendation.suggestedTargetAngle || 115}°</strong> &bull; Reps: {selectedExercise?.target_reps || 8} → <strong>{adaptiveRecommendation.suggestedTargetReps || 10} ครั้ง</strong>
              </p>
            </div>

            {adaptiveRecommendation.requiresCaregiverApproval && (
              <button
                onClick={handleOpenApprovalGate}
                disabled={applied}
                className={`py-2.5 px-5 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 flex-shrink-0 ${
                  applied
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                }`}
              >
                {applied ? (
                  <>
                    <Check className="w-4 h-4" /> แผนใหม่ได้รับอนุมัติแล้ว
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-4 h-4" /> พิจารณาอนุมัติ (Caregiver Approval Gate)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clinical Approval Gate Modal */}
      {adaptiveRecommendation && (
        <CaregiverApprovalGateModal
          isOpen={isApprovalGateOpen}
          onClose={() => setIsApprovalGateOpen(false)}
          exerciseId={exerciseId || selectedExercise?.id || 1}
          currentAngle={selectedExercise?.target_angle || current.maxAngle || 110}
          currentReps={selectedExercise?.target_reps || current.totalReps || 8}
          suggestedAngle={adaptiveRecommendation.suggestedTargetAngle || 115}
          suggestedReps={adaptiveRecommendation.suggestedTargetReps || 10}
          recommendationCode={xai?.recommendationCode || 'REC-SC-00421'}
          xaiReasons={xai?.reasons}
          reason={adaptiveRecommendation.description}
          onApproved={handleApprovalSuccess}
        />
      )}
    </div>
  );
};
