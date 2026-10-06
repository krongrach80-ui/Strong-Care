import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Check,
  Play,
  CalendarCheck,
  Activity,
  Heart,
  Cross,
  Plus,
  Minus,
  Edit2,
  X,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  TherapyMode,
  TimeSelectionMode,
  ExerciseCategoryType,
  TherapyScheduleConfig,
  getSavedTherapyConfig,
  saveTherapyConfig,
  getTodayDateString,
  getDefaultDateString,
  getDefaultTimeString,
  formatThaiDateTime,
} from '../../services/therapySettingsService';
import {
  STRETCH_EXERCISES,
  STRETCH_PROGRAM_METADATA,
  calculateEstimatedMinutes,
  formatExerciseTimeTag,
  StretchExerciseItem,
} from '../../data/stretchExercises';
import { StretchStickFigure } from '../../components/StickFigure/StretchStickFigure';
import { ExerciseVideoModal } from '../../components/VideoPlayer/ExerciseVideoModal';
import { CustomPosesPage } from '../../components/CustomPoses/CustomPosesPage';
import { getCustomPoseCount } from '../../services/customPoseService';

interface Screen3ScheduleConfigProps {
  mode: TherapyMode; // 'physio' | 'minigame'
  patientId?: number;
  onBack: () => void;
  onStartNow: (config: TherapyScheduleConfig) => void;
  onScheduleSaved: (config: TherapyScheduleConfig, message: string) => void;
}

export const Screen3ScheduleConfig: React.FC<Screen3ScheduleConfigProps> = ({
  mode,
  patientId,
  onBack,
  onStartNow,
  onScheduleSaved,
}) => {
  // Load initial settings from localStorage / defaults
  const [timeMode, setTimeMode] = useState<TimeSelectionMode>('now');
  const [scheduledDate, setScheduledDate] = useState<string>(getDefaultDateString());
  const [scheduledTime, setScheduledTime] = useState<string>(getDefaultTimeString());
  const [category, setCategory] = useState<ExerciseCategoryType>('stretch');
  const [customArea, setCustomArea] = useState<string>('');
  const [showCustomPosesView, setShowCustomPosesView] = useState<boolean>(false);
  const [customPosesCount, setCustomPosesCount] = useState<number>(() => getCustomPoseCount(patientId));
  const [selectedStretchIds, setSelectedStretchIds] = useState<string[]>(
    STRETCH_EXERCISES.map((e) => e.id)
  );
  const [customHoldTimes, setCustomHoldTimes] = useState<Record<string, number>>({});
  const [videoModalExercise, setVideoModalExercise] = useState<StretchExerciseItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const defaultDateStr = getDefaultDateString();

  // Reload custom poses count when patientId changes
  useEffect(() => {
    setCustomPosesCount(getCustomPoseCount(patientId));
  }, [patientId]);

  // Load saved config on mount
  useEffect(() => {
    const saved = getSavedTherapyConfig(mode, patientId);
    setTimeMode(saved.timeMode);
    setScheduledDate(saved.scheduledDate || defaultDateStr);
    setScheduledTime(saved.scheduledTime || getDefaultTimeString());
    setCategory(saved.category || 'stretch');
    if (saved.customArea) {
      setCustomArea(saved.customArea);
    }
    if (saved.selectedStretchIds && saved.selectedStretchIds.length > 0) {
      setSelectedStretchIds(saved.selectedStretchIds);
    } else {
      setSelectedStretchIds(STRETCH_EXERCISES.map((e) => e.id));
    }
    if (saved.customHoldTimes) {
      setCustomHoldTimes(saved.customHoldTimes);
    }
  }, [mode, patientId, todayStr]);

  // Stretch exercise selection handlers
  const handleToggleStretch = (id: string) => {
    setSelectedStretchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllStretches = () => {
    setSelectedStretchIds(STRETCH_EXERCISES.map((e) => e.id));
  };

  const handleClearAllStretches = () => {
    setSelectedStretchIds([]);
  };

  // Adjust duration per exercise
  const handleAdjustTime = (id: string, deltaSeconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSec = STRETCH_EXERCISES.find((ex) => ex.id === id)?.holdSeconds ?? 20;
    const current = customHoldTimes[id] !== undefined ? customHoldTimes[id] : defaultSec;
    const updated = Math.max(
      STRETCH_PROGRAM_METADATA.minSecondsPerPose,
      Math.min(STRETCH_PROGRAM_METADATA.maxSecondsPerPose, current + deltaSeconds)
    );
    setCustomHoldTimes((prev) => ({
      ...prev,
      [id]: updated,
    }));
  };

  const handleResetAllTimes = () => {
    setCustomHoldTimes({});
  };

  // Handle Category selection
  const handleSelectCategory = (cat: ExerciseCategoryType) => {
    setCategory(cat);
    if (cat === 'custom') {
      setShowCustomPosesView(true);
      setCategoryNotice('หมวดหมู่ส่วนอื่นๆ (ท่าที่เพิ่มเอง) ยังไม่รองรับการเริ่มฝึกด้วย AI ในขณะนี้ กรุณาเลือก "กายภาพยืดเส้น" สำหรับการฝึก');
    } else if (cat !== 'stretch') {
      setCategoryNotice(`หมวดหมู่${cat === 'recovery' ? 'กายภาพฟื้นฟู' : 'กายภาพบำบัด'} อยู่ระหว่างจัดเตรียมชุดท่าทางเฉพาะบุคคล กรุณาเลือก "กายภาพยืดเส้น" สำหรับการฝึกในปัจจุบัน`);
    } else {
      setCategoryNotice(null);
    }
  };

  // Get human-friendly category title
  const getCategoryTitle = (): string => {
    switch (category) {
      case 'stretch':
        return 'กายภาพยืดเส้น';
      case 'recovery':
        return 'กายภาพฟื้นฟู';
      case 'therapy':
        return 'กายภาพบำบัด';
      case 'custom':
        return customPosesCount > 0 ? `ส่วนอื่นๆ (${customPosesCount} ท่า)` : 'ส่วนอื่นๆ (ท่าที่เพิ่มเอง)';
      default:
        return 'กายภาพยืดเส้น';
    }
  };

  // Submit action
  const handlePrimaryAction = () => {
    setTimeError(null);
    setCategoryNotice(null);

    // 1. Validation: Scheduled date and time must not be in the past
    if (timeMode === 'schedule') {
      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const now = new Date();
      if (isNaN(selectedDateTime.getTime()) || selectedDateTime <= now) {
        setTimeError('ไม่สามารถเลือกเวลาในอดีตได้ กรุณาเลือกวันและเวลาที่เป็นปัจจุบันหรือในอนาคต');
        return;
      }
    }

    // 2. Validation: If category does not have stretch queue, warn user
    if (category !== 'stretch') {
      setCategoryNotice('หมวดหมู่นี้ยังไม่มีชุดท่ากายภาพเฉพาะบุคคล กรุณาเลือก "กายภาพยืดเส้น" เพื่อเริ่มฝึก');
      return;
    }

    // 3. Validation: If stretch category is chosen, must have at least 1 exercise selected
    if (category === 'stretch' && selectedStretchIds.length === 0) {
      return;
    }

    const config: TherapyScheduleConfig = {
      mode,
      timeMode,
      scheduledDate,
      scheduledTime,
      category,
      categoryTitle: getCategoryTitle(),
      selectedStretchIds,
      customHoldTimes,
      patientId,
    };

    // Save to persistent storage with patientId
    saveTherapyConfig(config, patientId);

    if (timeMode === 'now') {
      // Start immediately -> Screen 4
      onStartNow(config);
    } else {
      // Scheduled booking -> return to Screen 3 Menu with confirmation
      const formattedDate = formatThaiDateTime(scheduledDate, scheduledTime);
      const confirmationMsg = `บันทึกนัดหมายฝึกกายภาพเรียบร้อย: ${formattedDate}`;
      onScheduleSaved(config, confirmationMsg);
    }
  };

  if (showCustomPosesView) {
    return (
      <CustomPosesPage
        patientId={patientId}
        onBack={() => {
          setShowCustomPosesView(false);
          setCustomPosesCount(getCustomPoseCount(patientId));
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[720px] mx-auto flex flex-col animate-fadeIn relative z-10 py-3 sm:py-6 px-1">
      
      {/* 1. Top Back Navigation Bar */}
      <header className="flex items-center justify-between w-full mb-3 sm:mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-emerald-300 text-sm sm:text-base font-bold text-[#0B2B2B] hover:bg-white transition active:scale-95 shadow-sm min-h-[44px]"
          aria-label="ย้อนกลับไปหน้าเมนูผู้ใช้"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E8A4C]" />
          <span>ย้อนกลับ</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-[#D7F9E1]/80 px-3 py-1 rounded-full border border-emerald-200">
            {mode === 'minigame' ? '🎮 ตั้งค่ามินิเกม' : '🩺 ตั้งค่ากายภาพ'}
          </span>
        </div>
      </header>

      {/* 2. Main Content Card */}
      <main className="bg-white/90 backdrop-blur-xl border border-emerald-200/90 rounded-[28px] sm:rounded-[36px] p-4 sm:p-7 shadow-xl shadow-emerald-700/5 space-y-6">
        
        {/* หัวข้อหน้าจอ (ตามภาพที่ 1) */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2B2B] tracking-tight">
            เลือกเวลาและท่าทาง
          </h1>
          <p className="text-sm sm:text-lg font-medium text-emerald-900/80">
            เลือกเวลาเริ่มฝึก และบริเวณที่ต้องการยืด
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ส่วนที่ 1: "เริ่มฝึกเมื่อไร?" (การ์ด 2 ใบเรียงข้างกัน) */}
        {/* ------------------------------------------------------------- */}
        <section aria-labelledby="time-selection-heading">
          <h2
            id="time-selection-heading"
            className="text-base sm:text-lg font-bold text-[#0B2B2B] mb-2.5 flex items-center gap-2"
          >
            <span>เริ่มฝึกเมื่อไร?</span>
          </h2>

          <div
            role="radiogroup"
            aria-label="เลือกเวลาเริ่มฝึก"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {/* ใบที่ 1: "เริ่มตอนนี้" (ค่าเริ่มต้น) */}
            <div
              role="radio"
              aria-checked={timeMode === 'now'}
              tabIndex={0}
              onClick={() => setTimeMode('now')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setTimeMode('now');
                }
              }}
              className={`relative rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 cursor-pointer transition-all duration-200 min-h-[96px] text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                timeMode === 'now'
                  ? 'border-[2.5px] border-[#1E8A4C] bg-[#E9FCEB] shadow-md shadow-emerald-500/10'
                  : 'border border-emerald-200/90 bg-white/80 hover:bg-white hover:border-emerald-300'
              }`}
            >
              {/* Top-Right Indicator: Checkmark in green circle if selected */}
              <div
                className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  timeMode === 'now'
                    ? 'bg-[#1E8A4C] text-white shadow-sm'
                    : 'border-2 border-emerald-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {timeMode === 'now' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>

              {/* Icon Container */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  timeMode === 'now'
                    ? 'bg-[#1E8A4C] text-white'
                    : 'bg-emerald-100 text-[#1E8A4C]'
                }`}
              >
                <Clock className="w-6 h-6" />
              </div>

              {/* Text Information */}
              <div className="flex-1 pr-6">
                <div className="text-base sm:text-lg font-bold text-[#0B2B2B]">
                  เริ่มตอนนี้
                </div>
                <div className="text-xs sm:text-sm text-emerald-800/80 font-medium">
                  พร้อมแล้ว เริ่มได้ทันที
                </div>
              </div>
            </div>

            {/* ใบที่ 2: "ตั้งเวลา" */}
            <div
              role="radio"
              aria-checked={timeMode === 'schedule'}
              tabIndex={0}
              onClick={() => setTimeMode('schedule')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setTimeMode('schedule');
                }
              }}
              className={`relative rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 cursor-pointer transition-all duration-200 min-h-[96px] text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                timeMode === 'schedule'
                  ? 'border-[2.5px] border-[#1E8A4C] bg-[#E9FCEB] shadow-md shadow-emerald-500/10'
                  : 'border border-emerald-200/90 bg-white/80 hover:bg-white hover:border-emerald-300'
              }`}
            >
              {/* Top-Right Indicator */}
              <div
                className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  timeMode === 'schedule'
                    ? 'bg-[#1E8A4C] text-white shadow-sm'
                    : 'border-2 border-emerald-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {timeMode === 'schedule' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>

              {/* Icon Container */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  timeMode === 'schedule'
                    ? 'bg-[#1E8A4C] text-white'
                    : 'bg-emerald-100 text-[#1E8A4C]'
                }`}
              >
                <Calendar className="w-6 h-6" />
              </div>

              {/* Text Information */}
              <div className="flex-1 pr-6">
                <div className="text-base sm:text-lg font-bold text-[#0B2B2B]">
                  ตั้งเวลา
                </div>
                <div className="text-xs sm:text-sm text-emerald-800/80 font-medium">
                  เลือกวันและเวลาที่สะดวก
                </div>
              </div>
            </div>
          </div>

          {/* สไลด์เปิดลงมาเมื่อเลือก "ตั้งเวลา": แสดงช่องเลือกวันที่และเวลา */}
          {timeMode === 'schedule' && (
            <div className="mt-3.5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-[#D7F9E1]/50 border-2 border-emerald-300/80 shadow-inner animate-fadeIn space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1E8A4C]">
                <Calendar className="w-4 h-4" />
                <span>กำหนดวันและเวลาที่ต้องการฝึก (ห้ามเลือกเวลาในอดีต)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date Input */}
                <div>
                  <label htmlFor="scheduleDateInput" className="block text-xs font-bold text-[#0B2B2B] mb-1">
                    วันที่ฝึก (พ.ศ.)
                  </label>
                  <input
                    id="scheduleDateInput"
                    type="date"
                    min={todayStr}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-base sm:text-lg font-bold p-3 rounded-xl border border-emerald-300 bg-white text-[#0B2B2B] focus:ring-2 focus:ring-[#1E8A4C] focus:outline-none min-h-[50px] shadow-sm"
                  />
                </div>

                {/* Time Input */}
                <div>
                  <label htmlFor="scheduleTimeInput" className="block text-xs font-bold text-[#0B2B2B] mb-1">
                    เวลาฝึก (น.)
                  </label>
                  <input
                    id="scheduleTimeInput"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full text-base sm:text-lg font-bold p-3 rounded-xl border border-emerald-300 bg-white text-[#0B2B2B] focus:ring-2 focus:ring-[#1E8A4C] focus:outline-none min-h-[50px] shadow-sm"
                  />
                </div>
              </div>

              {/* Preview Formatted Thai text */}
              <div className="text-xs sm:text-sm font-semibold text-emerald-900 bg-white/90 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1E8A4C] flex-shrink-0" />
                <span className="truncate">
                  {formatThaiDateTime(scheduledDate, scheduledTime)}
                </span>
              </div>

              {/* Past Date & Time Validation Error Alert */}
              {timeError && (
                <div className="text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-300 p-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{timeError}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* ส่วนที่ 2: "เลือกบริเวณที่ต้องการยืด" (การ์ด 4 ใบ จัดกริด 2x2) */}
        {/* ------------------------------------------------------------- */}
        <section aria-labelledby="area-selection-heading">
          <div className="flex items-center justify-between mb-2.5">
            <h2
              id="area-selection-heading"
              className="text-base sm:text-lg font-bold text-[#0B2B2B]"
            >
              เลือกบริเวณที่ต้องการยืด
            </h2>
            {category === 'custom' && (
              <button
                onClick={() => setShowCustomPosesView(true)}
                className="text-xs sm:text-sm font-bold text-[#1E8A4C] hover:underline flex items-center gap-1"
                aria-label="จัดการท่ากายภาพที่เพิ่มเอง"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>จัดการท่าที่เพิ่มเอง ({customPosesCount} ท่า)</span>
              </button>
            )}
          </div>

          <div
            role="radiogroup"
            aria-label="เลือกบริเวณที่ต้องการยืด"
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {/* 1. "กายภาพยืดเส้น" (ค่าเริ่มต้น) */}
            <div
              role="radio"
              aria-checked={category === 'stretch'}
              tabIndex={0}
              onClick={() => handleSelectCategory('stretch')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectCategory('stretch');
                }
              }}
              className={`relative rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[110px] sm:min-h-[120px] select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                category === 'stretch'
                  ? 'border-[2.5px] border-[#1E8A4C] bg-[#E9FCEB] shadow-md shadow-emerald-500/10'
                  : 'border border-emerald-200/90 bg-white/80 hover:bg-white hover:border-emerald-300'
              }`}
            >
              {/* Top-Right Indicator */}
              <div
                className={`absolute top-2.5 right-2.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                  category === 'stretch'
                    ? 'bg-[#1E8A4C] text-white shadow-sm'
                    : 'border-2 border-emerald-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {category === 'stretch' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Custom SVG Icon: Person Stretching arms */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-colors ${
                  category === 'stretch' ? 'bg-[#1E8A4C] text-white' : 'bg-emerald-100 text-[#1E8A4C]'
                }`}
              >
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Head */}
                  <circle cx="12" cy="4" r="2" />
                  {/* Spine */}
                  <line x1="12" y1="6" x2="12" y2="14" />
                  {/* Stretched Arms Upward */}
                  <path d="M6 9l6-3 6 3" />
                  <path d="M5 4l2 5" />
                  <path d="M19 4l-2 5" />
                  {/* Legs */}
                  <path d="M9 20l3-6 3 6" />
                </svg>
              </div>

              <span className="text-sm sm:text-base font-bold text-[#0B2B2B]">
                กายภาพยืดเส้น
              </span>
              <span className="text-[11px] sm:text-xs text-emerald-800/80 font-medium mt-0.5">
                ยืดเหยียด คลายกล้ามเนื้อ
              </span>
            </div>

            {/* 2. "กายภาพฟื้นฟู" (แก้คำสะกดผิดจาก กาพภาพฟื้นฟู) */}
            <div
              role="radio"
              aria-checked={category === 'recovery'}
              tabIndex={0}
              onClick={() => handleSelectCategory('recovery')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectCategory('recovery');
                }
              }}
              className={`relative rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[110px] sm:min-h-[120px] select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                category === 'recovery'
                  ? 'border-[2.5px] border-[#1E8A4C] bg-[#E9FCEB] shadow-md shadow-emerald-500/10'
                  : 'border border-emerald-200/90 bg-white/80 hover:bg-white hover:border-emerald-300'
              }`}
            >
              {/* Top-Right Indicator */}
              <div
                className={`absolute top-2.5 right-2.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                  category === 'recovery'
                    ? 'bg-[#1E8A4C] text-white shadow-sm'
                    : 'border-2 border-emerald-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {category === 'recovery' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Custom SVG Icon: Heart with Pulse Line */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-colors ${
                  category === 'recovery' ? 'bg-[#1E8A4C] text-white' : 'bg-emerald-100 text-[#1E8A4C]'
                }`}
              >
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M3.22 12H7l2-4 3 8 2-5 1.5 2.5H20.8" />
                </svg>
              </div>

              <span className="text-sm sm:text-base font-bold text-[#0B2B2B]">
                กายภาพฟื้นฟู
              </span>
              <span className="text-[11px] sm:text-xs text-emerald-800/80 font-medium mt-0.5">
                ฟื้นฟูข้อต่อและข้อพับ
              </span>
            </div>

            {/* 3. "กายภาพบำบัด" */}
            <div
              role="radio"
              aria-checked={category === 'therapy'}
              tabIndex={0}
              onClick={() => handleSelectCategory('therapy')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectCategory('therapy');
                }
              }}
              className={`relative rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[110px] sm:min-h-[120px] select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                category === 'therapy'
                  ? 'border-[2.5px] border-[#1E8A4C] bg-[#E9FCEB] shadow-md shadow-emerald-500/10'
                  : 'border border-emerald-200/90 bg-white/80 hover:bg-white hover:border-emerald-300'
              }`}
            >
              {/* Top-Right Indicator */}
              <div
                className={`absolute top-2.5 right-2.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                  category === 'therapy'
                    ? 'bg-[#1E8A4C] text-white shadow-sm'
                    : 'border-2 border-emerald-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {category === 'therapy' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Custom SVG Icon: Medical Cross / Healing Care */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-colors ${
                  category === 'therapy' ? 'bg-[#1E8A4C] text-white' : 'bg-emerald-100 text-[#1E8A4C]'
                }`}
              >
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="4" />
                  <line x1="12" y1="8" x2="12" y2="16" strokeWidth="2.5" />
                  <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2.5" />
                </svg>
              </div>

              <span className="text-sm sm:text-base font-bold text-[#0B2B2B]">
                กายภาพบำบัด
              </span>
              <span className="text-[11px] sm:text-xs text-emerald-800/80 font-medium mt-0.5">
                รักษาอาการปวดเฉพาะจุด
              </span>
            </div>

            {/* 4. "ส่วนอื่นๆ" */}
            <div
              role="radio"
              aria-checked={category === 'custom'}
              tabIndex={0}
              onClick={() => handleSelectCategory('custom')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectCategory('custom');
                }
              }}
              className={`relative rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[110px] sm:min-h-[120px] select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                category === 'custom'
                  ? 'border-[2.5px] border-[#1E8A4C] bg-[#E9FCEB] shadow-md shadow-emerald-500/10'
                  : 'border border-emerald-200/90 bg-white/80 hover:bg-white hover:border-emerald-300'
              }`}
            >
              {/* Top-Right Indicator */}
              <div
                className={`absolute top-2.5 right-2.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                  category === 'custom'
                    ? 'bg-[#1E8A4C] text-white shadow-sm'
                    : 'border-2 border-emerald-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {category === 'custom' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Custom SVG Icon: Body Joints Target / Plus */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-colors ${
                  category === 'custom' ? 'bg-[#1E8A4C] text-white' : 'bg-emerald-100 text-[#1E8A4C]'
                }`}
              >
                <Plus className="w-7 h-7" />
              </div>

              <span className="text-sm sm:text-base font-bold text-[#0B2B2B] flex items-center justify-center gap-1.5">
                <span>ส่วนอื่นๆ</span>
                <span className="text-xs font-bold text-[#1E8A4C] bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  {customPosesCount} ท่า
                </span>
              </span>
              <span className="text-[11px] sm:text-xs text-emerald-800/80 font-medium mt-0.5">
                {customPosesCount > 0 ? 'แตะเพื่อจัดการท่า' : 'แตะเพื่อเพิ่มท่าใหม่'}
              </span>
            </div>
          </div>

          {/* Category Notice Alert if non-stretch category is chosen */}
          {categoryNotice && (
            <div className="text-xs sm:text-sm font-bold text-amber-900 bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-center gap-2 mt-3 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{categoryNotice}</span>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* ส่วนแทรก: "เลือกท่า" (แสดงเฉพาะเมื่อเลือก "กายภาพยืดเส้น") */}
        {/* ------------------------------------------------------------- */}
        {category === 'stretch' && (
          <section
            aria-labelledby="stretch-selection-heading"
            className="space-y-3.5 pt-3 border-t border-emerald-100 animate-fadeIn"
          >
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
                    <span className="text-xs font-bold text-emerald-950">
                      {STRETCH_PROGRAM_METADATA.title}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium">
                    โดย {STRETCH_PROGRAM_METADATA.instructor} • {STRETCH_PROGRAM_METADATA.channel}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold">
                    💡 สามารถกดปุ่ม <span className="text-emerald-700 font-extrabold bg-white px-1 rounded border border-emerald-200">[-]</span> และ <span className="text-emerald-700 font-extrabold bg-white px-1 rounded border border-emerald-200">[+]</span> เพื่อปรับเวลาค้างของแต่ละท่า ({STRETCH_PROGRAM_METADATA.minSecondsPerPose} - {STRETCH_PROGRAM_METADATA.maxSecondsPerPose} วิ)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setVideoModalExercise(null);
                    setIsVideoModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#1E8A4C] to-[#2ecc71] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-sm transition active:scale-95 flex-shrink-0 min-h-[38px] cursor-pointer"
                  title="ดูคลิปวิดีโอสอนยืดกล้ามเนื้อทั้ง 11 ท่า"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>ดูคลิปในแอป</span>
                </button>
              </div>
            </div>

            {/* Header: Title + Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3
                  id="stretch-selection-heading"
                  className="text-lg sm:text-xl font-extrabold text-[#0B2B2B] flex items-center gap-2"
                >
                  <span>เลือกท่า</span>
                  <span className="text-xs font-bold text-[#1E8A4C] bg-[#E9FCEB] border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    11 ท่ายืดเส้น
                  </span>
                </h3>
              </div>

              {/* Action Buttons: เลือกทั้งหมด / ล้างทั้งหมด / รีเซ็ตเวลา */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAllStretches}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#1E8A4C] bg-[#E9FCEB] hover:bg-emerald-200 border border-emerald-300 active:scale-95 transition min-h-[36px]"
                  aria-label="เลือกท่าทั้งหมด 11 ท่า"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={handleClearAllStretches}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 active:scale-95 transition min-h-[36px]"
                  aria-label="ล้างการเลือกท่าทั้งหมด"
                >
                  ล้างทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={handleResetAllTimes}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 active:scale-95 transition min-h-[36px] flex items-center gap-1.5 shadow-2xs"
                  aria-label="รีเซ็ตเวลาทุกท่าเป็นค่ามาตรฐาน"
                  title="รีเซ็ตเวลาค้างทุกท่ากลับเป็นค่ามาตรฐาน"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>รีเซ็ตเวลา</span>
                </button>
              </div>
            </div>

            {/* Summary Bar: "เลือกแล้ว X ท่า • ประมาณ Y นาที" */}
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
                    ? `เลือกแล้ว ${selectedStretchIds.length} จาก ${STRETCH_EXERCISES.length} ท่า`
                    : 'ยังไม่ได้เลือกท่ากายภาพ'}
                </span>
              </div>

              {selectedStretchIds.length > 0 && (
                <div className="text-xs sm:text-sm font-bold text-emerald-800 bg-white/80 px-3 py-1 rounded-full border border-emerald-200 shadow-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1E8A4C]" />
                  <span>ประมาณ {calculateEstimatedMinutes(selectedStretchIds, customHoldTimes)} นาที</span>
                </div>
              )}
            </div>

            {/* 11 Exercises List Rows */}
            <div
              className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 select-none focus:outline-none"
              role="group"
              aria-label="รายการท่ายืดเส้น 11 ท่า"
            >
              {STRETCH_EXERCISES.map((item) => {
                const isSelected = selectedStretchIds.includes(item.id);
                const currentSec = customHoldTimes[item.id] !== undefined ? customHoldTimes[item.id] : item.holdSeconds;

                return (
                  <div
                    key={item.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => handleToggleStretch(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleToggleStretch(item.id);
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
                      {/* SVG Thumbnail Container */}
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

                      {/* Text info */}
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
                          {/* Duration Stepper Control */}
                          <div
                            className="inline-flex items-center bg-white border border-emerald-300 rounded-lg shadow-2xs overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            role="group"
                            aria-label={`ปรับเวลาสำหรับท่า ${item.name}`}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleAdjustTime(item.id, -STRETCH_PROGRAM_METADATA.stepSeconds, e)}
                              disabled={currentSec <= STRETCH_PROGRAM_METADATA.minSecondsPerPose}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              aria-label={`ลดเวลาท่า ${item.name} ${STRETCH_PROGRAM_METADATA.stepSeconds} วินาที`}
                              title={`ลด ${STRETCH_PROGRAM_METADATA.stepSeconds} วินาที`}
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="px-2 font-black text-xs sm:text-sm text-[#0B2B2B] select-none whitespace-nowrap min-w-[50px] text-center">
                              {currentSec} วิ {item.sides === 'both_sides' ? '/ ข้าง' : ''}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleAdjustTime(item.id, STRETCH_PROGRAM_METADATA.stepSeconds, e)}
                              disabled={currentSec >= STRETCH_PROGRAM_METADATA.maxSecondsPerPose}
                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              aria-label={`เพิ่มเวลาท่า ${item.name} ${STRETCH_PROGRAM_METADATA.stepSeconds} วินาที`}
                              title={`เพิ่ม ${STRETCH_PROGRAM_METADATA.stepSeconds} วินาที`}
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>

                          {/* Watch Video Clip Button for this pose */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoModalExercise(item);
                              setIsVideoModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1E8A4C] border border-emerald-300 text-xs font-extrabold transition active:scale-90 shadow-2xs cursor-pointer min-h-[28px]"
                            title={`ดูคลิปวิดีโอหมอเฟมสาธิตท่า ${item.name}`}
                            aria-label={`ดูคลิปวิดีโอสาธิตท่า ${item.name}`}
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

                    {/* Right: Accessible Checkbox (min-size 48x48px for seniors) */}
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
                        {isSelected && <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ส่วนที่ 3: ปุ่มหลักด้านล่างเต็มความกว้าง (Dynamic Primary Button) */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-2">
          {category === 'stretch' && selectedStretchIds.length === 0 && (
            <div
              role="alert"
              className="text-center text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-2 flex items-center justify-center gap-1.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>กรุณาเลือกท่าที่ต้องการฝึกอย่างน้อย 1 ท่าเพื่อเริ่มโปรแกรม</span>
            </div>
          )}

          <button
            onClick={handlePrimaryAction}
            disabled={category === 'stretch' && selectedStretchIds.length === 0}
            className={`w-full min-h-[56px] py-3.5 px-6 rounded-full text-white font-extrabold text-base sm:text-lg shadow-lg flex items-center justify-center gap-2.5 transition-all outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 ${
              category === 'stretch' && selectedStretchIds.length === 0
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-[#6FD67F] to-[#1E8A4C] shadow-emerald-600/25 hover:opacity-95 hover:shadow-emerald-600/35 active:scale-[0.98] cursor-pointer'
            }`}
            id="btnPrimaryScheduleAction"
          >
            {timeMode === 'now' ? (
              <>
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                <span>เริ่มฝึกตอนนี้</span>
              </>
            ) : (
              <>
                <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>บันทึกเวลานัด</span>
              </>
            )}
          </button>
        </div>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* Modal ดูวิดีโอคลิป YouTube แต่ละท่าทาง */}
      {/* ------------------------------------------------------------- */}
      <ExerciseVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        exercise={videoModalExercise}
      />

    </div>
  );
};
