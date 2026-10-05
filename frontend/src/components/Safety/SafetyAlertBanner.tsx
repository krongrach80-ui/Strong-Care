import React from 'react';
import { ShieldAlert, AlertTriangle, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SafetyTelemetry, SafetyViolation } from '../../biomechanics/SafetyEngine';

interface SafetyAlertBannerProps {
  safety: SafetyTelemetry;
  onResume: () => void;
  isSeniorMode?: boolean;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({
  safety,
  onResume,
  isSeniorMode = false,
}) => {
  // Only show when there is an active safety issue or NO_DATA fail-safe
  if (
    !safety.isEmergencyStop &&
    safety.severity !== 'CAUTION' &&
    safety.state !== 'NO_DATA' &&
    safety.state !== 'STOP' &&
    safety.state !== 'WARNING'
  ) {
    return null;
  }

  const isStop = safety.state === 'STOP' || safety.isEmergencyStop;
  const isNoData = safety.state === 'NO_DATA';

  return (
    <div
      className={`fixed inset-x-3 sm:inset-x-4 top-16 sm:top-20 z-50 mx-auto max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-in fade-in slide-from-top-4 ${
        isStop
          ? 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50'
          : isNoData
          ? 'bg-slate-900/95 border-amber-500/80 text-amber-100 shadow-slate-950/50'
          : 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-950/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {/* Pulsing Safety Badge */}
        <div
          className={`flex-shrink-0 w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
            isStop
              ? 'bg-rose-600/30 border-rose-400 text-rose-300 animate-pulse shadow-rose-600/30'
              : isNoData
              ? 'bg-amber-600/20 border-amber-400 text-amber-300 shadow-amber-600/20'
              : 'bg-amber-600/30 border-amber-400 text-amber-300 shadow-amber-600/30'
          }`}
        >
          {isStop ? (
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8" />
          ) : (
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase font-mono ${
                isStop
                  ? 'bg-rose-500 text-white'
                  : isNoData
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {isStop ? 'SAFETY EMERGENCY STOP' : isNoData ? 'FAIL-SAFE: NO_DATA' : 'SAFETY WARNING'}
            </span>
            <span className="text-[11px] sm:text-xs opacity-75 font-mono">
              สถานะ: {safety.state} ({safety.safetyScore}/100)
            </span>
            {safety.confidenceScore !== undefined && (
              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-black/30 text-amber-200">
                Confidence: {safety.confidenceScore}%
              </span>
            )}
          </div>

          <h3
            className={`font-black mt-1.5 ${
              isSeniorMode ? 'text-xl sm:text-2xl text-white' : 'text-base sm:text-lg text-white'
            }`}
          >
            {isStop
              ? '⚠️ หยุดการฝึกชั่วคราวเพื่อความปลอดภัย'
              : isNoData
              ? '⚠️ ไม่พบข้อต่อชัดเจน (ระบบหยุดนับ Rep ชั่วคราว)'
              : 'ข้อควรระวังในการเคลื่อนไหว'}
          </h3>

          {/* List of active violations */}
          <div className="mt-2 space-y-1.5">
            {safety.activeViolations.map((v, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs sm:text-sm bg-black/25 rounded-lg px-3 py-1.5"
              >
                <span className="font-semibold text-rose-300 flex-shrink-0">• {v.title}:</span>
                <span className="text-slate-200">{v.message}</span>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
            <p className="text-xs text-slate-300">
              {safety.canResume
                ? '✅ ตรวจพบท่าทางปลอดภัยแล้ว พร้อมฝึกต่อได้ทันที'
                : 'กรุณาปรับท่าทางให้ตั้งตรง หรือกลับเข้ามาในกรอบกล้อง'}
            </p>

            {isStop && (
              <button
                onClick={onResume}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 min-h-[44px] ${
                  safety.canResume
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 animate-bounce'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                }`}
              >
                <Play className="w-4 h-4 fill-current flex-shrink-0" />
                <span>{safety.canResume ? 'ดำเนินการต่อ (Resume)' : 'ยืนยันความพร้อม & ฝึกต่อ'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
