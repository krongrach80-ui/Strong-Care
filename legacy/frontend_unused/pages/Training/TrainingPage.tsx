import React, { useEffect, useState, useRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { usePose } from '../../hooks/usePose';
import { useExercise } from '../../hooks/useExercise';
import { CameraView } from '../../components/Camera/CameraView';
import { AngleGauge } from '../../components/AngleIndicator/AngleGauge';
import { RepCounter } from '../../components/RepetitionCounter/RepCounter';
import { FeedbackPanel } from '../../components/PostureFeedback/FeedbackPanel';
import { usePatientStore } from '../../store/patientStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useSessionStore } from '../../store/sessionStore';
import { audioFeedback } from '../../services/audioService';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { VoiceGuideButton } from '../../components/VoiceAssistant/VoiceGuideButton';
import confetti from 'canvas-confetti';
import {
  Play,
  Square,
  Clock,
  User,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { SafetyEngine, SafetyTelemetry } from '../../biomechanics/SafetyEngine';
import { SafetyAlertBanner } from '../../components/Safety/SafetyAlertBanner';
import { SafetyDashboardWidget } from '../../components/Safety/SafetyDashboardWidget';
import { CalibrationEngine, CalibrationStatus } from '../../services/calibrationService';
import { PreExerciseCalibrationModal } from '../../components/Calibration/PreExerciseCalibrationModal';
import { useSeniorStore } from '../../store/seniorStore';
import { SeniorEmergencyButton } from '../../components/SeniorMode/SeniorEmergencyButton';

interface TrainingPageProps {
  onNavigate: (tab: string) => void;
}

export const TrainingPage: React.FC<TrainingPageProps> = ({ onNavigate }) => {
  const { selectedPatient } = usePatientStore();
  const { selectedExercise } = useExerciseStore();
  const {
    isActive,
    durationSeconds,
    startSession,
    tickDuration,
    finishSession,
    repResults,
    isSaving,
  } = useSessionStore();

  const [showGuide, setShowGuide] = useState(false);

  // Setup camera
  const {
    videoRef,
    isCameraReady,
    isCameraLoading,
    cameraError,
    startCamera,
    stopCamera,
    isFrontCamera,
  } = useCamera();

  // Setup Pose & Multi-Modal Vision detection
  const {
    landmarks,
    handLandmarks,
    faceLandmarks,
    fps,
    isMockMode,
    setMockMode,
  } = usePose(videoRef, isCameraReady, selectedExercise?.slug);

  const { isSeniorMode, isEmergencyAlertOpen } = useSeniorStore();

  // 1. Safety Engine Clinical Watchdog
  const safetyEngineRef = useRef<SafetyEngine>(new SafetyEngine());
  const [safetyTelemetry, setSafetyTelemetry] = useState<SafetyTelemetry>({
    state: 'SAFE',
    severity: 'NORMAL',
    isEmergencyStop: false,
    activeViolations: [],
    safetyScore: 100,
    canResume: true,
    confidenceScore: 100,
    isLowConfidenceFailSafe: false,
    statusMessage: 'ระบบอยู่ในสภาวะปลอดภัย (SAFE)',
  });

  // Setup Exercise Analysis bound to Safety Halt Watchdog
  const {
    analysis,
    biomechanics,
    primaryJoint,
  } = useExercise(selectedExercise, landmarks, safetyTelemetry.isEmergencyStop || isEmergencyAlertOpen);

  // 2. Pre-Exercise Calibration Engine
  const calibrationEngineRef = useRef<CalibrationEngine>(new CalibrationEngine());
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatus>(
    calibrationEngineRef.current.evaluate(null)
  );

  // Safety Engine Monitoring Loop: Evaluates every frame during active training
  useEffect(() => {
    if (!isActive || !biomechanics || !selectedExercise) return;

    const safety = safetyEngineRef.current.evaluate(biomechanics, landmarks, selectedExercise);
    setSafetyTelemetry(safety);

    if (safety.isEmergencyStop) {
      const voiceAlert = safetyEngineRef.current.getPendingVoiceAlert(safety);
      if (voiceAlert) {
        voiceAssistant.speakEmergency(voiceAlert);
      }
    }
  }, [isActive, biomechanics, landmarks, selectedExercise]);

  // Calibration Real-time Loop when modal is active
  useEffect(() => {
    if (!isCalibrating) return;
    const status = calibrationEngineRef.current.evaluate(landmarks, faceLandmarks);
    setCalibrationStatus(status);
  }, [isCalibrating, landmarks, faceLandmarks]);

  // Auto start camera or fallback to mock simulation
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Duration timer ticker (automatically pauses during Safety Emergency Stop OR User SOS!)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !safetyTelemetry.isEmergencyStop && !isEmergencyAlertOpen) {
      interval = setInterval(() => {
        tickDuration();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, safetyTelemetry.isEmergencyStop, isEmergencyAlertOpen, tickDuration]);

  // Check if target reps reached to trigger completion
  useEffect(() => {
    if (
      isActive &&
      selectedExercise &&
      analysis &&
      analysis.repCount >= selectedExercise.target_reps
    ) {
      handleCompleteSession();
    }
  }, [isActive, analysis?.repCount, selectedExercise]);

  // Trigger Pre-Exercise Calibration before session starts
  const handleInitiateWorkout = () => {
    calibrationEngineRef.current.reset();
    setIsCalibrating(true);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    safetyEngineRef.current.reset();
    startSession();
    audioFeedback.playHoldTick();
    voiceAssistant.speakExercise('เริ่มการฝึกกายภาพได้เลยครับ จัดท่าทางให้พร้อมนะครับ', {
      priority: 'instruction',
      force: true,
      chime: true,
    });
  };

  const handleResumeSafety = () => {
    safetyEngineRef.current.acknowledgeAndResume();
    setSafetyTelemetry((prev) => ({
      ...prev,
      isEmergencyStop: false,
      severity: 'NORMAL',
    }));
  };

  const handleCompleteSession = async () => {
    if (!selectedPatient || !selectedExercise) return;

    audioFeedback.playWorkoutComplete();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    voiceAssistant.speakResult('ยอดเยี่ยมครับ วันนี้ทำครบตามเป้าหมายแล้วครับ', {
      priority: 'success',
      force: true,
      chime: true,
    });

    try {
      await finishSession(selectedPatient.id, selectedExercise.id);
      onNavigate('result');
    } catch (e) {
      console.warn('Finish session error:', e);
      onNavigate('result');
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!selectedExercise) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">ยังไม่ได้เลือกโปรแกรมกายภาพ</h2>
        <button
          onClick={() => onNavigate('exercises')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20"
        >
          ไปเลือกโปรแกรมกายภาพ
        </button>
      </div>
    );
  }

  const currentAngle = analysis?.currentAngle || 0;
  const isCorrect = analysis ? analysis.isCorrect : true;

  return (
    <div className="space-y-2.5 sm:space-y-5 pb-16">
      {/* Persistent Safety STOP Banner — Fixed/Sticky & Always Visible on ALL Viewports */}
      {safetyTelemetry.isEmergencyStop && (
        <div className="sticky top-16 z-50 bg-rose-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl shadow-rose-950/40 border-2 border-rose-300 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                  SAFETY STOPPED
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">หยุดการฝึกชั่วคราวเพื่อความปลอดภัย</span>
              </div>
              <p className="text-xs text-rose-100 font-medium mt-0.5 leading-snug">
                {safetyTelemetry.statusMessage || 'พบการเคลื่อนไหวที่ผิดรูป — ตัวจับเวลาและ Repetition หยุดทำงานทันที'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResumeSafety}
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>ยืนยันความพร้อม &bull; ดำเนินการต่อ</span>
          </button>
        </div>
      )}

      {/* Top Session Header Bar */}
      <div className="bg-white/90 border border-emerald-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 backdrop-blur-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center font-bold text-emerald-700 flex-shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">{selectedPatient?.name}</h2>
              <span className="text-[10px] sm:text-xs font-mono text-emerald-800 px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200 flex-shrink-0">
                {selectedPatient?.patient_code}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              โปรแกรม:{' '}
              <strong className="text-slate-800 font-semibold">{selectedExercise.name}</strong> (เป้าหมาย {selectedExercise.target_reps} ครั้ง)
            </p>
          </div>
        </div>

        {/* Workout Timer and Control Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm font-mono text-emerald-900 flex-shrink-0 min-h-[36px] sm:min-h-[40px]">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
            <span>{formatTime(durationSeconds)}</span>
          </div>

          {/* Spoken Voice Guide for Exercise */}
          <VoiceGuideButton
            pageId="training"
            context={{ exerciseName: selectedExercise.name, targetReps: selectedExercise.target_reps }}
            label="ฟังคำแนะนำ"
          />

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-emerald-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition shadow-sm flex items-center justify-center"
            title="คำแนะนำท่ากายภาพ"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {!isActive ? (
            <button
              onClick={handleInitiateWorkout}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 min-h-[42px] sm:min-h-[44px] whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-white flex-shrink-0" /> เริ่มบันทึก (Start)
            </button>
          ) : (
            <button
              disabled={isSaving}
              onClick={handleCompleteSession}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition active:scale-95 disabled:opacity-50 min-h-[42px] sm:min-h-[44px] whitespace-nowrap"
            >
              <Square className="w-4 h-4 fill-white flex-shrink-0" /> จบเซสชัน (Finish)
            </button>
          )}
        </div>
      </div>

      {/* Senior Mode Friendly Large Status Banner */}
      {isSeniorMode && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-3xl sm:text-4xl">🧓</span>
            <div>
              <h3 className="text-base sm:text-xl md:text-2xl font-black text-amber-950 dark:text-amber-100">
                โหมดผู้สูงอายุ (เปิดใช้งานอยู่)
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-amber-800 dark:text-amber-300">
                {isCorrect ? '✅ ทำได้ดีมากครับ! ค่อยๆ ยกตามจังหวะสบายๆ' : '⚠️ ยกแขนขึ้นอีกนิด หรือปรับตัวให้ตรงครับ'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-900 dark:text-amber-400 block">ทำไปแล้ว</span>
            <span className="text-2xl sm:text-4xl font-black text-amber-950 dark:text-amber-100 font-mono">
              {analysis?.repCount || 0} <span className="text-sm sm:text-lg">/ {selectedExercise.target_reps}</span>
            </span>
          </div>
        </div>
      )}

      {/* Guide Banner Modal */}
      {showGuide && (
        <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl flex items-start gap-2.5 sm:gap-3 text-xs text-slate-700 shadow-sm">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-900 mb-0.5 sm:mb-1">คำแนะนำสำหรับ {selectedExercise.name}</h4>
            <p>{selectedExercise.instructions || selectedExercise.description}</p>
            <p className="mt-1 text-slate-600 font-mono text-[11px] sm:text-xs">
              • ช่วงมุมที่ถูกต้อง: {selectedExercise.min_angle}° ถึง {selectedExercise.max_angle}° (Target {selectedExercise.target_angle}°)
            </p>
          </div>
        </div>
      )}

      {/* Main Split Layout: Left Camera & Pose Skeleton / Right Live Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-6 items-start">
        {/* Left: Camera View (7 Cols) */}
        <div className="lg:col-span-7 space-y-2 sm:space-y-4">
          <CameraView
            videoRef={videoRef}
            isCameraReady={isCameraReady}
            isCameraLoading={isCameraLoading}
            cameraError={cameraError}
            landmarks={landmarks}
            handLandmarks={handLandmarks}
            faceLandmarks={faceLandmarks}
            startCamera={startCamera}
            stopCamera={stopCamera}
            isMockMode={isMockMode}
            setMockMode={setMockMode}
            isCorrect={isCorrect}
            activeJointPoint={primaryJoint}
            currentAngle={currentAngle}
            fps={fps}
            isFrontCamera={isFrontCamera}
          />

          {/* Responsive Camera Telemetry HUD Grid (2x2 on Mobile, 4-Col on Desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-center font-mono">
            {/* 1. ROM */}
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/95 border border-emerald-100 shadow-sm flex flex-col justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">
                ROM (องศา)
              </span>
              <span className="text-base sm:text-xl font-black text-emerald-800 mt-0.5">
                {Math.round(currentAngle)}°
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans">
                เป้าหมาย {selectedExercise.target_angle}°
              </span>
            </div>

            {/* 2. SAFETY */}
            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border shadow-sm flex flex-col justify-center transition-all ${
              safetyTelemetry.isEmergencyStop
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400 text-rose-700 animate-pulse'
                : 'bg-white/95 border-emerald-100 text-emerald-700'
            }`}>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">
                SAFETY
              </span>
              <span className={`text-sm sm:text-lg font-black mt-0.5 ${
                safetyTelemetry.isEmergencyStop ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {safetyTelemetry.isEmergencyStop ? '⚠️ STOPPED' : `SAFE (${safetyTelemetry.safetyScore}%)`}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans">
                {safetyTelemetry.isEmergencyStop ? 'หยุดการทำงาน' : 'Watchdog Active'}
              </span>
            </div>

            {/* 3. REPS */}
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/95 border border-emerald-100 shadow-sm flex flex-col justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">
                REPS (รอบ)
              </span>
              <span className="text-base sm:text-xl font-black text-slate-900 mt-0.5">
                {analysis?.repCount || 0}{' '}
                <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {selectedExercise.target_reps}</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans">
                สถานะ: {analysis?.state || 'READY'}
              </span>
            </div>

            {/* 4. CONFIDENCE */}
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/95 border border-emerald-100 shadow-sm flex flex-col justify-center">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">
                CONFIDENCE
              </span>
              <span className={`text-base sm:text-xl font-black mt-0.5 ${
                (safetyTelemetry.confidenceScore || 97) < 70 ? 'text-amber-600' : 'text-teal-700'
              }`}>
                {Math.round(safetyTelemetry.confidenceScore || 97)}%
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans truncate">
                {isMockMode ? 'Simulation' : 'MediaPipe'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry & Feedback Dashboard (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 🛡 Prominent Safety Status HUD Widget */}
          <SafetyDashboardWidget
            telemetry={safetyTelemetry}
            currentAngle={currentAngle}
            trunkLeanDeg={biomechanics?.posture.spineAngle ?? 8}
            shoulderHikeDeg={biomechanics?.posture.shoulderTilt ?? 4}
            velocityDegPerSec={biomechanics?.angle.angularVelocity ?? analysis?.angularVelocity ?? 45}
            onResume={handleResumeSafety}
          />

          {/* Angle Gauge */}
          <AngleGauge
            currentAngle={currentAngle}
            targetAngle={selectedExercise.target_angle}
            minAngle={selectedExercise.min_angle}
            maxAngle={selectedExercise.max_angle}
            jointName={selectedExercise.target_joint.toUpperCase()}
            isCorrect={isCorrect}
          />

          {/* Repetition State Machine Counter */}
          <RepCounter
            repCount={analysis?.repCount || 0}
            targetReps={selectedExercise.target_reps}
            state={analysis?.state || 'START'}
            accuracy={analysis?.accuracy || 0}
          />

          {/* Posture & Real-time Clinician Feedback */}
          <FeedbackPanel
            feedbackList={analysis?.feedback || []}
            isCorrect={isCorrect}
            stabilityScore={analysis?.stabilityScore ?? 95}
          />
        </div>
      </div>

      {/* 1. Clinical Safety Emergency Stop Alert Banner */}
      <SafetyAlertBanner
        safety={safetyTelemetry}
        onResume={handleResumeSafety}
        isSeniorMode={isSeniorMode}
      />

      {/* 2. Pre-Exercise 5-Point Calibration Modal */}
      <PreExerciseCalibrationModal
        isOpen={isCalibrating}
        status={calibrationStatus}
        exerciseName={selectedExercise.name}
        onCalibrationComplete={handleCalibrationComplete}
        onSkip={() => {
          setIsCalibrating(false);
          handleCalibrationComplete();
        }}
        isSeniorMode={isSeniorMode}
      />

      {/* 3. Floating Senior Caregiver Emergency SOS Button */}
      <SeniorEmergencyButton />
    </div>
  );
};
