import React from 'react';
import { RepState } from '../../types/exercise';
import { Activity, CheckCircle2, Flame, Award } from 'lucide-react';

interface RepCounterProps {
  repCount: number;
  targetReps: number;
  state: RepState;
  accuracy: number;
}

const STATE_STEPS: { key: RepState; label: string }[] = [
  { key: 'READY', label: 'READY' },
  { key: 'UP', label: 'MOVE' },
  { key: 'HOLD', label: 'HOLD' },
  { key: 'COMPLETE', label: 'FINISH' },
];

export const RepCounter: React.FC<RepCounterProps> = ({
  repCount,
  targetReps,
  state,
  accuracy,
}) => {
  const progressPercent = Math.min(100, Math.round((repCount / targetReps) * 100));

  return (
    <div className="bg-white/95 border border-emerald-100 rounded-2xl p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 font-sans">
          <Activity className="w-3.5 h-3.5 text-emerald-600" /> Repetition Counter
        </span>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
          {progressPercent}% Complete
        </span>
      </div>

      {/* Main Counter Display */}
      <div className="flex items-baseline justify-between my-2">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black font-mono text-emerald-700 tracking-tight">
            {repCount}
          </span>
          <span className="text-2xl font-bold font-mono text-slate-400">
            / {targetReps}
          </span>
        </div>

        {/* Live Accuracy Meter */}
        <div className="text-right">
          <div className="text-xs text-slate-500 font-medium">ความแม่นยำ (Accuracy)</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 flex items-center justify-end gap-1">
            <Award className="w-5 h-5 text-emerald-600" />
            {accuracy}%
          </div>
        </div>
      </div>

      {/* State Machine Flow Indicator OR Emergency Halt Banner */}
      <div className="mt-4 pt-3 border-t border-emerald-100">
        {state === 'STOP' ? (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-center font-mono font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-ping" />
            <span>🔴 STATE: STOPPED (ระบบระงับการนับรอบตามกฎความปลอดภัย)</span>
          </div>
        ) : (
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-2">
              State Machine Workflow
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {STATE_STEPS.map((step) => {
                const isActive =
                  state === step.key ||
                  (step.key === 'UP' && (state === 'UP' || state === 'DOWN'));

                return (
                  <div
                    key={step.key}
                    className={`py-1.5 px-2 rounded-lg text-center font-mono text-[11px] font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 scale-105'
                        : 'bg-emerald-50/50 text-slate-500 border-emerald-100'
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
