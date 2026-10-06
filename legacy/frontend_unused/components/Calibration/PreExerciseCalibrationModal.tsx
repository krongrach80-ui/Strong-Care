import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Camera,
  Sun,
  Maximize,
  UserCheck,
  Play,
  Volume2,
  X,
} from 'lucide-react';
import { CalibrationStatus } from '../../services/calibrationService';
import { voiceAssistant } from '../../services/voiceAssistantService';

interface PreExerciseCalibrationModalProps {
  isOpen: boolean;
  status: CalibrationStatus;
  exerciseName: string;
  onCalibrationComplete: () => void;
  onSkip: () => void;
  isSeniorMode?: boolean;
}

export const PreExerciseCalibrationModal: React.FC<PreExerciseCalibrationModalProps> = ({
  isOpen,
  status,
  exerciseName,
  onCalibrationComplete,
  onSkip,
  isSeniorMode = false,
}) => {
  const lastSpokenRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  // Periodic voice guidance
  useEffect(() => {
    if (!isOpen) return;

    const now = Date.now();
    if (
      status.spokenInstruction &&
      (status.spokenInstruction !== lastSpokenRef.current || now - lastTimeRef.current > 4500)
    ) {
      lastSpokenRef.current = status.spokenInstruction;
      lastTimeRef.current = now;
      voiceAssistant.speakInstruction(status.spokenInstruction, {
        priority: 'instruction',
        force: false,
      });
    }
  }, [isOpen, status.spokenInstruction]);

  // Auto-complete when fully calibrated
  useEffect(() => {
    if (isOpen && status.isFullyCalibrated) {
      const timer = setTimeout(() => {
        onCalibrationComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, status.isFullyCalibrated, onCalibrationComplete]);

  if (!isOpen) return null;

  const checks = [
    {
      id: 'face',
      label: 'ตรวจจับใบหน้า (Face Detection)',
      passed: status.isFaceAligned,
      icon: UserCheck,
      hint: 'มองตรงมาที่กล้อง',
    },
    {
      id: 'distance',
      label: 'ระยะห่างจากกล้อง (Optimal Distance)',
      passed: status.isDistanceOptimal,
      icon: Maximize,
      hint:
        status.distanceFeedback === 'TOO_CLOSE'
          ? '⚠️ ใกล้เกินไป (กรุณาถอยหลัง)'
          : status.distanceFeedback === 'TOO_FAR'
          ? '⚠️ ไกลเกินไป (กรุณาเดินเข้าใกล้)'
          : 'ระยะกำลังพอดี',
    },
    {
      id: 'body',
      label: 'ความครบถ้วนของร่างกาย (Full Body Joints)',
      passed: status.isBodyComplete,
      icon: Camera,
      hint: 'เห็นศีรษะ หัวไหล่ แขน และลำตัวครบ',
    },
    {
      id: 'light',
      label: 'ระดับแสงสว่าง (Lighting Adequacy)',
      passed: status.isLightingAdequate,
      icon: Sun,
      hint: 'แสงสว่างเพียงพอ ชัดเจน',
    },
    {
      id: 'steady',
      label: 'ความนิ่งของท่าทาง (Stability & Ready)',
      passed: status.isSteady,
      icon: Sparkles,
      hint: status.isFullyCalibrated
        ? 'พร้อมเริ่มการฝึก!'
        : `ยืนนิ่งอีก ${status.countdownSeconds} วิ...`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-5 sm:p-8 max-w-[min(95vw,560px)] w-full max-h-[90dvh] overflow-y-auto shadow-2xl relative">
        {/* Accessible Close Button */}
        <button
          onClick={onSkip}
          aria-label="Close"
          className="absolute top-3 sm:top-4 right-3 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top ambient glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" /> PRE-EXERCISE CALIBRATION
          </div>
          <h2
            className={`font-black text-slate-900 dark:text-white ${
              isSeniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            }`}
          >
            ตรวจเช็คความพร้อมก่อนเริ่ม
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            โปรแกรม: <strong className="text-emerald-600 font-bold">{exerciseName}</strong>
          </p>
        </div>

        {/* Calibration Checklist */}
        <div className="space-y-3 mb-6">
          {checks.map((chk) => {
            const Icon = chk.icon;
            return (
              <div
                key={chk.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  chk.passed
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      chk.passed
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4
                      className={`font-bold ${
                        isSeniorMode ? 'text-base' : 'text-xs sm:text-sm'
                      }`}
                    >
                      {chk.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {chk.hint}
                    </p>
                  </div>
                </div>

                {chk.passed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 animate-in zoom-in" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Real-time Voice / Status Hint banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center gap-3 mb-6">
          <Volume2 className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
          <p
            className={`font-semibold text-emerald-900 dark:text-emerald-200 ${
              isSeniorMode ? 'text-base' : 'text-xs sm:text-sm'
            }`}
          >
            "{status.spokenInstruction}"
          </p>
        </div>

        {/* Progress & Actions */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1.5">
              <span>ความพร้อมของระบบ</span>
              <span className="font-bold text-emerald-600">{status.overallProgressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{ width: `${status.overallProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
            >
              ข้ามการตรวจสอบ (Skip)
            </button>

            <button
              onClick={onCalibrationComplete}
              disabled={!status.isFullyCalibrated}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                status.isFullyCalibrated
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30 animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {status.isFullyCalibrated ? 'พร้อมแล้ว เริ่มฝึกเลย!' : `รอความพร้อม (${status.countdownSeconds}s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
