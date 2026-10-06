import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Eye,
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  Sparkles,
  RotateCcw,
  Play,
} from 'lucide-react';
import { ExercisePosePreview } from './ExercisePosePreview';
import { ExercisePhase, ExerciseConfig } from '../../types/exercise';
import { StretchStickFigure } from '../StickFigure/StretchStickFigure';

export interface ExerciseInstructionCardProps {
  currentExercise: ExerciseConfig;
  currentIndex: number;
  totalExercises: number;
  prevExercise?: ExerciseConfig | null;
  nextExercise?: ExerciseConfig | null;
  exercisePhase: ExercisePhase;
  countdownNumber: number; // 3, 2, 1
  realtimeStatus: 'ready' | 'adjust' | 'stop' | 'preparing';
  statusMessage?: string;
  currentReps?: number;
  targetReps?: number;
  currentHoldSeconds?: number;
  targetHoldSeconds?: number;
  isStretchHold?: boolean;
  activeSide?: 'left' | 'right' | 'both';
  onSelectPrevious?: () => void;
  onSelectNext?: () => void;
  onRestartCountdown?: () => void;
  onResumeAfterSafety?: () => void;
  className?: string;
}

export const ExerciseInstructionCard: React.FC<ExerciseInstructionCardProps> = ({
  currentExercise,
  currentIndex,
  totalExercises,
  prevExercise,
  nextExercise,
  exercisePhase,
  countdownNumber,
  realtimeStatus,
  statusMessage,
  currentReps = 0,
  targetReps = 10,
  currentHoldSeconds = 20,
  targetHoldSeconds = 20,
  isStretchHold = false,
  activeSide = 'both',
  onSelectPrevious,
  onSelectNext,
  onRestartCountdown,
  onResumeAfterSafety,
  className,
}) => {
  const [showVideo, setShowVideo] = useState<boolean>(true);

  // Compute progress percentage
  const progressPercent = isStretchHold
    ? Math.min(100, Math.max(0, Math.round(((targetHoldSeconds - currentHoldSeconds) / Math.max(1, targetHoldSeconds)) * 100)))
    : Math.min(100, Math.round((currentReps / Math.max(1, targetReps)) * 100));

  const isCompleted = isStretchHold ? currentHoldSeconds <= 0 : currentReps >= targetReps;
  const isCountingDown =
    exercisePhase === 'PREPARING' ||
    exercisePhase === 'COUNTDOWN_3' ||
    exercisePhase === 'COUNTDOWN_2' ||
    exercisePhase === 'COUNTDOWN_1' ||
    exercisePhase === 'READY';
  const isSafetyHalted = exercisePhase === 'SAFETY_STOP';

  return (
    <div className={`w-full bg-white border-[1.5px] border-emerald-300 rounded-[24px] p-2.5 sm:p-3.5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${className || ''}`}>
      {/* 1. Top 3-Exercise Preview Selector Header */}
      <div className="w-full flex items-center justify-between mb-1.5 sm:mb-2 border-b border-emerald-100/80 pb-1.5 sm:pb-2">
        {/* Left: Previous Exercise Nav Capsule */}
        <button
          type="button"
          onClick={() => prevExercise && onSelectPrevious && onSelectPrevious()}
          disabled={!prevExercise}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
            prevExercise
              ? 'text-stone-700 bg-stone-50 hover:bg-emerald-50 hover:text-[#1E8A4C] cursor-pointer border border-stone-200'
              : 'text-stone-300 bg-transparent cursor-default border border-transparent'
          }`}
          title={prevExercise ? `ก่อนหน้า: ${prevExercise.name}` : 'ท่าแรก'}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="truncate max-w-[85px] sm:max-w-[110px]">
            {prevExercise ? prevExercise.name : 'เริ่มต้น'}
          </span>
        </button>

        {/* Center: Current Exercise Index Tag */}
        <div className="flex items-center gap-1.5 bg-[#E9FCEB] border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#1E8A4C] animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold text-[#1E8A4C]">
            ท่า {currentIndex + 1} / {totalExercises}
          </span>
        </div>

        {/* Right: Next Exercise Nav Capsule */}
        <button
          type="button"
          onClick={() => nextExercise && onSelectNext && onSelectNext()}
          disabled={!nextExercise}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
            nextExercise
              ? 'text-stone-700 bg-stone-50 hover:bg-emerald-50 hover:text-[#1E8A4C] cursor-pointer border border-stone-200'
              : 'text-stone-300 bg-transparent cursor-default border border-transparent'
          }`}
          title={nextExercise ? `ถัดไป: ${nextExercise.name}` : 'ท่าสุดท้าย'}
        >
          <span className="truncate max-w-[85px] sm:max-w-[110px]">
            {nextExercise ? nextExercise.name : 'ท่าสุดท้าย'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Clear Exercise Name & Senior-Friendly Headline */}
      <div className="w-full flex items-start justify-between gap-2 mb-1 sm:mb-1.5 flex-shrink-0">
        <div className="flex-1 min-w-0">
          {/* Main Thai Name (Large & Clear) */}
          <h2 className="text-xl sm:text-2xl font-black text-[#0B2B2B] tracking-tight leading-snug">
            {currentExercise.name}
          </h2>
          {/* Secondary English Name */}
          <p className="text-xs sm:text-sm font-semibold text-stone-500 mt-0.5 tracking-wide">
            {currentExercise.englishName}
          </p>
        </div>

        {/* Status & Side Pill Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {activeSide !== 'both' && (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-2xs border ${
                activeSide === 'left'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-teal-600 text-white border-teal-500'
              }`}
            >
              <span>{activeSide === 'left' ? '👈 ข้างซ้าย' : '👉 ข้างขวา'}</span>
            </div>
          )}
          {isSafetyHalted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300 shadow-2xs animate-bounce">
              <OctagonAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>🔴 หยุดตรวจเช็ค</span>
            </div>
          ) : isCountingDown ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>เตรียมพร้อม</span>
            </div>
          ) : isCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ทำครบแล้ว</span>
            </div>
          ) : realtimeStatus === 'ready' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>🟢 พร้อม (ถูกต้อง)</span>
            </div>
          ) : realtimeStatus === 'adjust' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>🟡 ปรับท่า</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>🔴 ไม่ปลอดภัย</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Center: Pose Preview / Video Demonstration Area with Countdown Overlay */}
      <div className="relative w-full bg-[#FAFDFB] border border-emerald-200/90 rounded-2xl p-1.5 sm:p-2.5 my-1 sm:my-1.5 min-h-[130px] flex-1 flex items-center justify-center overflow-hidden">
        {/* Pose Preview: Video > Animation > Skeleton */}
        <ExercisePosePreview
          demoVideoUrl={currentExercise.demoVideoUrl}
          thumbnailUrl={currentExercise.thumbnailUrl}
          svgType={currentExercise.targetPose || 'neck_lateral'}
          name={currentExercise.name}
          englishName={currentExercise.englishName}
          activeSide={activeSide}
          isHighlighted={true}
          showVideoPlayer={showVideo}
          onToggleVideo={() => setShowVideo(!showVideo)}
        />

        {/* 4. Giant 3-Second Pre-Exercise Countdown Overlay (Floating over video) */}
        {isCountingDown && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px] rounded-2xl flex flex-col items-center justify-center p-3 text-center z-20 animate-fadeIn pointer-events-none">
            {exercisePhase === 'PREPARING' && (
              <div className="bg-white/95 text-[#0B2B2B] px-5 py-3 rounded-2xl shadow-xl border border-emerald-300 space-y-1 animate-pulse">
                <div className="text-xs sm:text-sm font-extrabold text-[#1E8A4C]">
                  เตรียมพร้อมสำหรับ
                </div>
                <div className="text-lg sm:text-xl font-black text-[#0B2B2B]">
                  {currentExercise.name}
                </div>
                <div className="text-[11px] text-stone-500 font-semibold">
                  ดูตัวอย่างท่าก่อนเริ่ม...
                </div>
              </div>
            )}

            {(exercisePhase === 'COUNTDOWN_3' ||
              exercisePhase === 'COUNTDOWN_2' ||
              exercisePhase === 'COUNTDOWN_1') && (
              <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-3xl shadow-2xl border-2 border-emerald-400 flex flex-col items-center justify-center animate-scaleIn">
                <span className="text-[11px] font-black text-stone-500 uppercase tracking-widest mb-0.5">
                  เริ่มใน
                </span>
                {/* Giant Senior-Accessible Countdown Number */}
                <div
                  key={`cnt-${countdownNumber}`}
                  className="text-6xl sm:text-7xl font-black font-mono text-[#1E8A4C] leading-none drop-shadow-sm scale-110 animate-bounce"
                >
                  {countdownNumber}
                </div>
                <span className="text-[11px] font-bold text-emerald-800 mt-1 bg-[#E9FCEB] px-3 py-0.5 rounded-full">
                  จัดท่าทางให้พร้อมหน้ากล้อง
                </span>
              </div>
            )}

            {exercisePhase === 'READY' && (
              <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl border-2 border-emerald-400 flex flex-col items-center justify-center animate-scaleIn">
                <div className="w-12 h-12 rounded-full bg-[#1E8A4C] text-white flex items-center justify-center mb-1.5 shadow-md shadow-emerald-600/30">
                  <Play className="w-6 h-6 fill-white translate-x-0.5" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#1E8A4C]">
                  เริ่มได้เลย!
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                  ระบบเริ่มตรวจจับท่าทางและนับรอบ
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Safety Stop Intervention Overlay */}
        {isSafetyHalted && (
          <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center z-30 text-white animate-fadeIn">
            <OctagonAlert className="w-12 h-12 text-rose-400 mb-2 animate-bounce" />
            <h3 className="text-lg sm:text-xl font-black text-rose-200 mb-1">
              หยุดชั่วคราวเพื่อความปลอดภัย
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-[320px] mb-3 leading-relaxed">
              {statusMessage || 'ตรวจพบการเคลื่อนไหวที่ไม่ปลอดภัยหรืออยู่นอกกรอบกล้อง'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResumeAfterSafety}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>จัดท่าแล้ว ทำต่อ</span>
              </button>
              <button
                type="button"
                onClick={onRestartCountdown}
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition active:scale-95 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>นับเริ่มใหม่</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Real-time Status Message & Hint Banner */}
      <div className="w-full mb-1.5 sm:mb-2 flex-shrink-0">
        <div
          className={`flex items-center justify-between px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
            realtimeStatus === 'ready'
              ? 'bg-[#E9FCEB] text-emerald-900 border-emerald-200'
              : realtimeStatus === 'adjust'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : realtimeStatus === 'stop'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-stone-50 text-stone-700 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {realtimeStatus === 'ready' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : realtimeStatus === 'adjust' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            ) : (
              <OctagonAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="truncate">
              {statusMessage || (realtimeStatus === 'ready' ? 'ทำท่าได้ถูกต้อง รักษาระดับไว้' : 'เตรียมพร้อม')}
            </span>
          </div>

          {/* Video Toggle Button */}
          {currentExercise.demoVideoUrl && !isCountingDown && !isSafetyHalted && (
            <button
              type="button"
              onClick={() => setShowVideo(!showVideo)}
              className="flex-shrink-0 ml-2 inline-flex items-center gap-1 text-xs font-bold text-[#1E8A4C] hover:underline cursor-pointer"
            >
              {showVideo ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>ดูท่าจำลอง</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>ดูวิดีโอตัวอย่าง</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 7. Reps / Hold Target & Progress Bar */}
      <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2 sm:p-2.5 space-y-1 flex-shrink-0">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-stone-700">
          <span>
            {isStretchHold ? 'เวลาค้างท่าเป้าหมาย' : 'จำนวนครั้งเป้าหมาย'}:
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-lg sm:text-xl font-black text-[#0B2B2B]">
              {isStretchHold
                ? `${targetHoldSeconds - currentHoldSeconds} / ${targetHoldSeconds}`
                : `${currentReps} / ${targetReps}`}
            </span>
            <span className="text-xs font-bold text-stone-500">
              {isStretchHold ? 'วินาที' : 'ครั้ง'}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar (████████░░ 80%) */}
        <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-[#6FD67F] to-[#1E8A4C]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Completed Toast Banner */}
        {isCompleted && (
          <div className="pt-1 flex items-center justify-between text-xs font-extrabold text-emerald-800 animate-fadeIn">
            <span>🎉 ทำครบแล้ว พักก่อนเปลี่ยนท่า</span>
            {nextExercise && onSelectNext && (
              <button
                type="button"
                onClick={onSelectNext}
                className="text-[#1E8A4C] underline hover:text-emerald-900 cursor-pointer"
              >
                ไปท่าถัดไป →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
