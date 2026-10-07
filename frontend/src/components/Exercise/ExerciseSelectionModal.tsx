import React from 'react';
import {
  X,
  Play,
  Clock,
  RotateCcw,
  Check,
  Minus,
  Plus,
  Sparkles,
  AlertCircle,
  Activity,
  Heart,
  Stethoscope,
} from 'lucide-react';
import {
  StretchExerciseItem,
  STRETCH_EXERCISES,
  STRETCH_PROGRAM_METADATA,
  calculateEstimatedMinutes,
} from '../../data/stretchExercises';
import { StretchStickFigure } from '../StickFigure/StretchStickFigure';
import { ExerciseCategoryType } from '../../services/therapySettingsService';

export interface ExerciseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ExerciseCategoryType;
  selectedStretchIds: string[];
  customHoldTimes: Record<string, number>;
  onToggleStretch: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onResetAllTimes: () => void;
  onAdjustTime: (id: string, delta: number, e: React.MouseEvent) => void;
  onOpenVideoModal: (exercise: StretchExerciseItem | null) => void;
}

export const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({
  isOpen,
  onClose,
  category,
  selectedStretchIds,
  customHoldTimes,
  onToggleStretch,
  onSelectAll,
  onClearAll,
  onResetAllTimes,
  onAdjustTime,
  onOpenVideoModal,
}) => {
  if (!isOpen) return null;

  // Filter exercises based on category if needed, or default to stretch
  const exercises = STRETCH_EXERCISES;

  const getCategoryTitle = () => {
    switch (category) {
      case 'recovery':
        return 'กายภาพฟื้นฟู (ฟื้นฟูข้อต่อและข้อพับ)';
      case 'therapy':
        return 'กายภาพบำบัด (รักษาอาการปวดเฉพาะจุด)';
      case 'custom':
        return 'ส่วนอื่นๆ (ท่าที่เพิ่มเอง)';
      default:
        return 'กายภาพยืดเส้น (ยืดเหยียด คลายกล้ามเนื้อ)';
    }
  };

  const estimatedMinutes = calculateEstimatedMinutes(selectedStretchIds, customHoldTimes);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0F2F2B]/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl sm:max-w-3xl bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[92vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* 1. MODAL HEADER                                                   */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-7 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1E8A4C] text-white flex items-center justify-center shadow-md shadow-emerald-700/20 flex-shrink-0">
              {category === 'recovery' ? (
                <Heart className="w-5 h-5" />
              ) : category === 'therapy' ? (
                <Activity className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-xl text-[#0B2B2B] flex items-center gap-2">
                <span>เลือกท่ากายภาพ</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {exercises.length} ท่า
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-emerald-900/80 font-medium">
                {getCategoryTitle()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="ปิดหน้าต่างเลือกท่า"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* 2. MODAL BODY (Scrollable)                                        */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4 text-xs select-none">
          {/* Banner: YouTube Video Reference & Dr. Fame Attribution */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E8A4C] to-[#2ecc71] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-[#1E8A4C] bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                    สูตรกายภาพ 11 ท่า
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-950">
                    {STRETCH_PROGRAM_METADATA.title}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  โดย {STRETCH_PROGRAM_METADATA.instructor} • {STRETCH_PROGRAM_METADATA.channel}
                </p>
                <p className="text-[11px] text-emerald-800 font-semibold">
                  💡 สามารถกดปุ่ม{' '}
                  <span className="text-emerald-700 font-extrabold bg-white px-1 rounded border border-emerald-200">
                    [-]
                  </span>{' '}
                  และ{' '}
                  <span className="text-emerald-700 font-extrabold bg-white px-1 rounded border border-emerald-200">
                    [+]
                  </span>{' '}
                  เพื่อปรับเวลาค้างของแต่ละท่า ({STRETCH_PROGRAM_METADATA.minSecondsPerPose} -{' '}
                  {STRETCH_PROGRAM_METADATA.maxSecondsPerPose} วิ)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => onOpenVideoModal(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#1E8A4C] to-[#2ecc71] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-sm transition active:scale-95 flex-shrink-0 min-h-[38px] cursor-pointer"
                title="ดูคลิปวิดีโอสอนยืดกล้ามเนื้อทั้ง 11 ท่า"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>ดูคลิปในแอป</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar & Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-[#0B2B2B] flex items-center gap-2">
                <span>เลือกท่า</span>
                <span className="text-xs font-bold text-[#1E8A4C] bg-[#E9FCEB] border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  11 ท่ายืดเส้น
                </span>
              </h3>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onSelectAll}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#1E8A4C] bg-[#E9FCEB] hover:bg-emerald-200 border border-emerald-300 active:scale-95 transition min-h-[36px] cursor-pointer"
                aria-label="เลือกท่าทั้งหมด 11 ท่า"
              >
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 active:scale-95 transition min-h-[36px] cursor-pointer"
                aria-label="ล้างการเลือกท่าทั้งหมด"
              >
                ล้างทั้งหมด
              </button>
              <button
                type="button"
                onClick={onResetAllTimes}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 active:scale-95 transition min-h-[36px] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                aria-label="รีเซ็ตเวลาทุกท่าเป็นค่ามาตรฐาน"
                title="รีเซ็ตเวลาค้างทุกท่ากลับเป็นค่ามาตรฐาน"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>รีเซ็ตเวลา</span>
              </button>
            </div>
          </div>

          {/* Summary Status Bar */}
          <div
            className={`p-3 rounded-2xl flex items-center justify-between transition-colors ${
              selectedStretchIds.length > 0
                ? 'bg-gradient-to-r from-[#E9FCEB] to-[#D7F9E1] border border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedStretchIds.length > 0
                    ? 'bg-[#1E8A4C] text-white shadow-sm'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {selectedStretchIds.length}
              </div>
              <span className="text-sm sm:text-base font-extrabold">
                {selectedStretchIds.length > 0
                  ? `เลือกแล้ว ${selectedStretchIds.length} จาก ${exercises.length} ท่า`
                  : 'ยังไม่ได้เลือกท่ากายภาพ'}
              </span>
            </div>

            {selectedStretchIds.length > 0 && (
              <div className="text-xs sm:text-sm font-bold text-emerald-800 bg-white/90 px-3 py-1 rounded-full border border-emerald-200 shadow-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1E8A4C]" />
                <span>ประมาณ {estimatedMinutes} นาที</span>
              </div>
            )}
          </div>

          {/* Exercise List */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {exercises.map((item) => {
              const isSelected = selectedStretchIds.includes(item.id);
              const currentSec =
                customHoldTimes[item.id] !== undefined
                  ? customHoldTimes[item.id]
                  : item.holdSeconds;

              return (
                <div
                  key={item.id}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => onToggleStretch(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      onToggleStretch(item.id);
                    }
                  }}
                  className={`group w-full min-h-[64px] p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isSelected
                      ? 'bg-[#E9FCEB]/90 border-emerald-400 shadow-xs'
                      : 'bg-white/80 border-emerald-100 hover:bg-white hover:border-emerald-200 opacity-80'
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Stick Figure Thumbnail */}
                    <div
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border ${
                        isSelected
                          ? 'bg-white border-emerald-300 shadow-xs'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                      aria-label={`รูปท่า ${item.name}`}
                    >
                      <StretchStickFigure
                        type={item.svgType}
                        className="w-10 h-12 sm:w-11 sm:h-14"
                        isHighlighted={isSelected}
                      />
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          ท่าที่ {item.number}
                        </span>
                        <span className="text-base sm:text-lg font-extrabold text-[#0B2B2B] truncate">
                          {item.name}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-emerald-900/80 font-medium line-clamp-1 mt-0.5">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] sm:text-xs text-emerald-700 font-semibold flex-wrap">
                        {/* Stepper Duration Control */}
                        <div
                          className="inline-flex items-center bg-white border border-emerald-300 rounded-lg shadow-2xs overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                          role="group"
                          aria-label={`ปรับเวลาสำหรับท่า ${item.name}`}
                        >
                          <button
                            type="button"
                            onClick={(e) =>
                              onAdjustTime(
                                item.id,
                                -STRETCH_PROGRAM_METADATA.stepSeconds,
                                e
                              )
                            }
                            disabled={
                              currentSec <= STRETCH_PROGRAM_METADATA.minSecondsPerPose
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            aria-label={`ลดเวลาท่า ${item.name} ${STRETCH_PROGRAM_METADATA.stepSeconds} วินาที`}
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="px-2 font-black text-xs sm:text-sm text-[#0B2B2B] select-none whitespace-nowrap min-w-[50px] text-center">
                            {currentSec} วิ{' '}
                            {item.sides === 'both_sides' ? '/ ข้าง' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={(e) =>
                              onAdjustTime(
                                item.id,
                                STRETCH_PROGRAM_METADATA.stepSeconds,
                                e
                              )
                            }
                            disabled={
                              currentSec >= STRETCH_PROGRAM_METADATA.maxSecondsPerPose
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            aria-label={`เพิ่มเวลาท่า ${item.name} ${STRETCH_PROGRAM_METADATA.stepSeconds} วินาที`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Watch Video Clip Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenVideoModal(item);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1E8A4C] border border-emerald-300 text-xs font-extrabold transition active:scale-90 shadow-2xs cursor-pointer min-h-[28px]"
                          title={`ดูคลิปวิดีโอสาธิตท่า ${item.name}`}
                        >
                          <Play className="w-3 h-3 fill-[#1E8A4C]" />
                          <span>ดูคลิปท่านี้</span>
                        </button>

                        <span className="hidden sm:inline-block text-stone-500">
                          • {item.preparation}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Checkbox */}
                  <div
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center flex-shrink-0"
                    aria-hidden="true"
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#1E8A4C] text-white shadow-sm ring-2 ring-emerald-300 ring-offset-1'
                          : 'border-2 border-emerald-300 bg-white group-hover:border-emerald-400'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. MODAL FOOTER                                                   */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-emerald-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {selectedStretchIds.length > 0 ? (
              <span>
                เลือก <strong>{selectedStretchIds.length}</strong> ท่า (~{estimatedMinutes} นาที)
              </span>
            ) : (
              <span className="text-rose-600 font-bold">กรุณาเลือกอย่างน้อย 1 ท่า</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer text-xs sm:text-sm"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#1E8A4C] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>เสร็จสิ้นการเลือกท่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
