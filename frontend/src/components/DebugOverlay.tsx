import React from 'react';
import { Cpu, Zap, Activity, Clock, Crosshair } from 'lucide-react';

interface TelemetryData {
  detection_ms?: number;
  embedding_ms?: number;
  search_ms?: number;
  total_ms?: number;
  fps?: number;
}

interface DebugOverlayProps {
  telemetry?: TelemetryData;
  visible: boolean;
  status: string;
  confidence: number;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  telemetry = {},
  visible,
  status,
  confidence
}) => {
  if (!visible) return null;

  const detMs = telemetry.detection_ms ?? 0;
  const embMs = telemetry.embedding_ms ?? 0;
  const searchMs = telemetry.search_ms ?? 0;
  const totalMs = telemetry.total_ms ?? 0;
  const fps = telemetry.fps ?? 0;

  return (
    <div className="absolute top-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3.5 text-xs text-slate-200 shadow-xl shadow-cyan-950/40 min-w-[220px] font-mono select-none pointer-events-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
          <Crosshair className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>AI Telemetry HUD</span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
          {fps} FPS
        </span>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Detection:
          </span>
          <span className="font-bold text-amber-300">{detMs} ms</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-violet-400" /> Feature Embedding:
          </span>
          <span className="font-bold text-violet-300">{embMs} ms</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" /> Vector Cosine Match:
          </span>
          <span className="font-bold text-emerald-300">{searchMs} ms</span>
        </div>

        <div className="border-t border-white/10 pt-1.5 flex justify-between items-center font-bold">
          <span className="text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> Total Loop Latency:
          </span>
          <span className="text-cyan-400">{totalMs} ms</span>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
        <span className="text-slate-400">Similarity Score:</span>
        <span className="font-bold text-white">{(confidence * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};
