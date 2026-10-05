import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';

interface FeedbackPanelProps {
  feedbackList: string[];
  isCorrect: boolean;
  stabilityScore: number;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedbackList,
  isCorrect,
  stabilityScore,
}) => {
  return (
    <div className="bg-white/95 border border-emerald-100 rounded-2xl p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 font-sans">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-600" /> Live Posture & Form Feedback
        </span>

        {/* Stability pill */}
        <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> เสถียรภาพ {stabilityScore}%
        </span>
      </div>

      {/* Dynamic Feedback items */}
      <div className="space-y-2 min-h-[85px] flex flex-col justify-center">
        {feedbackList && feedbackList.length > 0 ? (
          feedbackList.map((msg, idx) => {
            const isWarning = msg.includes('⚠') || msg.includes('ช้าลง') || msg.includes('เอียง') || msg.includes('กรุณา') || msg.includes('ระวัง') || msg.includes('อย่า');
            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  isWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                <span>{msg}</span>
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>ท่าทางถูกต้องและอยู่ในเกณฑ์มาตรฐานการฟื้นฟู</span>
          </div>
        )}
      </div>

      {/* Stability Progress Bar */}
      <div className="mt-3 pt-3 border-t border-emerald-100">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>ความมั่นคงของสรีระ (Posture Stability)</span>
          <span className="font-mono text-emerald-800 font-bold">{stabilityScore}%</span>
        </div>
        <div className="w-full h-2 bg-emerald-100/60 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              stabilityScore >= 80 ? 'bg-emerald-500' : stabilityScore >= 60 ? 'bg-teal-500' : 'bg-amber-500'
            }`}
            style={{ width: `${stabilityScore}%` }}
          />
        </div>
      </div>
    </div>
  );
};
