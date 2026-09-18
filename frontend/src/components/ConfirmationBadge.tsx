import React from 'react';
import { CheckCircle2, AlertCircle, Scan, Sparkles } from 'lucide-react';

interface ConfirmationBadgeProps {
  status: string;
  name?: string | null;
  confidence: number;
  confirmed: boolean;
  count: number;
  target: number;
}

export const ConfirmationBadge: React.FC<ConfirmationBadgeProps> = ({
  status,
  name,
  confidence,
  confirmed,
  count,
  target
}) => {
  if (status === 'no_face' || status === 'no_frame') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 text-xs shadow-lg">
        <Scan className="w-4 h-4 text-slate-500 animate-pulse" />
        <span>Looking for faces in camera view...</span>
      </div>
    );
  }

  if (status === 'unknown') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-950/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs shadow-lg shadow-amber-950/30">
        <AlertCircle className="w-4 h-4 text-amber-400 animate-bounce" />
        <div>
          <div className="font-semibold">Unknown Person (บุคคลไม่ทราบชื่อ)</div>
          <div className="text-[10px] text-amber-400/80">Confidence: {(confidence * 100).toFixed(1)}% (Below threshold)</div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-950/80 backdrop-blur-md border-2 border-emerald-500 text-emerald-100 shadow-2xl shadow-emerald-500/30 animate-pulse-glow">
        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide font-['Outfit']">{name}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
              CONFIRMED
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-emerald-300/80 mt-0.5">
            <span>Confidence: <strong>{(confidence * 100).toFixed(1)}%</strong></span>
            <span>Anti-False: <strong>{count}/{target} Frames Confirmed</strong></span>
          </div>
        </div>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((count / target) * 100));

  return (
    <div className="flex flex-col gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-slate-200 text-xs shadow-xl shadow-cyan-950/40 min-w-[260px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Verifying: {name || 'Matching...'}</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 font-bold">
          {count}/{target} frames
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-150"
          style={{ width: percent + '%' }}
        />
      </div>
      <div className="text-[10px] text-slate-400 flex justify-between">
        <span>Temporal anti-false confirmation</span>
        <span>{(confidence * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};