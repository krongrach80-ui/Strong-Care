import React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  CheckCircle,
  Eye,
  Zap,
  RotateCcw
} from 'lucide-react';
import { SafetyTelemetry, ClinicalSafetyState } from '../../types/safety';

interface SafetyDashboardWidgetProps {
  telemetry: SafetyTelemetry;
  currentAngle?: number;
  trunkLeanDeg?: number;
  shoulderHikeDeg?: number;
  velocityDegPerSec?: number;
  onEmergencyStop?: () => void;
  onResume?: () => void;
  className?: string;
}

export const SafetyDashboardWidget: React.FC<SafetyDashboardWidgetProps> = ({
  telemetry,
  currentAngle = 90,
  trunkLeanDeg = 8,
  shoulderHikeDeg = 4,
  velocityDegPerSec = 45,
  onEmergencyStop,
  onResume,
  className = '',
}) => {
  const isStop = telemetry.state === 'STOP' || telemetry.isEmergencyStop;
  const isWarning = telemetry.state === 'WARNING';
  const isLowConfidence = telemetry.isLowConfidenceFailSafe || telemetry.confidenceScore < 50;

  // Determine state badge styling
  const stateColor = isStop
    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
    : isWarning
    ? 'bg-amber-500 text-white border-amber-600'
    : 'bg-emerald-500 text-white border-emerald-600';

  const stateLabel = isStop ? 'STOP (หยุดฉุกเฉิน)' : isWarning ? 'WARNING (เตือนท่าทาง)' : 'SAFE (ปลอดภัย)';

  return (
    <div className={`rounded-[18px] border shadow-sm transition-all overflow-hidden ${
      isStop
        ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20'
        : isWarning
        ? 'bg-amber-50/90 border-amber-300'
        : 'bg-white border-emerald-200'
    } ${className}`}>
      {/* Widget Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        isStop ? 'border-rose-200 bg-rose-100/60' : isWarning ? 'border-amber-200 bg-amber-100/60' : 'border-slate-100 bg-slate-50/60'
      }`}>
        <div className="flex items-center gap-2">
          {isStop ? (
            <ShieldAlert className="w-5 h-5 text-rose-600 animate-bounce" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            🛡 SAFETY STATUS
          </span>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${stateColor}`}>
          ● {stateLabel}
        </span>
      </div>

      {/* Main Status Display if Stopped */}
      {isStop ? (
        <div className="p-4 space-y-3 text-center bg-rose-50/80">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-600 text-white shadow-md shadow-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-rose-900">
              🔴 EMERGENCY STOP
            </h3>
            <p className="text-xs text-rose-700 font-medium mt-1 leading-relaxed max-w-sm mx-auto">
              {telemetry.statusMessage || 'พบการเคลื่อนไหวที่อยู่นอก Safety Configuration — ระบบหยุดการนับรอบแล้ว'}
            </p>
          </div>

          <div className="p-2.5 rounded-[12px] bg-white border border-rose-200 text-xs text-slate-700 space-y-1 text-left">
            <span className="font-bold text-rose-800 block text-[11px]">การทำงานของระบบ Fail-Safe:</span>
            <p className="text-[11px] text-slate-600">• หยุดตัวจับเวลาการฝึกอัตโนมัติ</p>
            <p className="text-[11px] text-slate-600">• หยุดการนับ Repetition ทันที</p>
            <p className="text-[11px] text-slate-600">• ระบบเสียงตัดบทด้วย Immediate Voice Preemption (Priority 10)</p>
          </div>

          {onResume && (
            <button
              onClick={onResume}
              className="w-full py-2.5 px-4 rounded-[12px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ปรับท่าทางถูกต้องแล้ว &bull; ดำเนินการต่อ</span>
            </button>
          )}
        </div>
      ) : isLowConfidence ? (
        /* Low Confidence Fail-Safe Notice */
        <div className="p-4 space-y-2 bg-amber-50/90 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
            <Eye className="w-3.5 h-3.5" />
            <span>AI Fail-Safe Triggered</span>
          </div>
          <h4 className="text-xs font-bold text-amber-900">
            ความมั่นใจต่ำกว่าเกณฑ์ ({telemetry.confidenceScore}%)
          </h4>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            ระบบหยุดการตัดสินผลชั่วคราวเพื่อป้องกันการนับรอบผิดพลาด กรุณาขยับเข้าใกล้กล้องหรือปรับแสงสว่าง
          </p>
        </div>
      ) : (
        /* Normal Safety Metrics Telemetry Grid */
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <div className="p-2 rounded-[10px] bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">ROM Status</span>
              <span className="font-bold text-emerald-700 text-xs">
                {currentAngle > 135 ? 'Over-ROM' : 'Normal'}
              </span>
            </div>

            <div className="p-2 rounded-[10px] bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">Trunk Lean</span>
              <span className={`font-bold text-xs ${trunkLeanDeg > 18 ? 'text-amber-600' : 'text-slate-700'}`}>
                {Math.round(trunkLeanDeg)}°
              </span>
            </div>

            <div className="p-2 rounded-[10px] bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">Shoulder Hike</span>
              <span className={`font-bold text-xs ${shoulderHikeDeg > 15 ? 'text-amber-600' : 'text-slate-700'}`}>
                {Math.round(shoulderHikeDeg)}°
              </span>
            </div>

            <div className="p-2 rounded-[10px] bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">Velocity</span>
              <span className={`font-bold text-xs ${velocityDegPerSec > 200 ? 'text-rose-600' : 'text-slate-700'}`}>
                {velocityDegPerSec > 200 ? 'Fast' : 'Normal'}
              </span>
            </div>

            <div className="p-2 rounded-[10px] bg-slate-50 border border-slate-100 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block font-sans">Pose Conf.</span>
              <span className="font-bold text-emerald-700 text-xs">
                {telemetry.confidenceScore || 97}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              System-configured safety thresholds active
            </span>
            <span className="font-semibold text-slate-600">
              Score: {telemetry.safetyScore}/100
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
