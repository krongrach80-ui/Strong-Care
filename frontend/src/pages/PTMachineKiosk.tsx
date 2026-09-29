import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  Minimize,
  QrCode,
  Smartphone,
  Flame,
  Award,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
  HeartPulse,
  LogOut,
  Sliders
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useSpeech } from '../hooks/useSpeech';
import { useAuth } from '../context/AuthContext';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { useBodyPose, drawFullAnatomySkeleton } from '../hooks/useBodyPose';
import {
  PT_EXERCISES,
  PTExerciseTracker,
  PTExerciseConfig,
  PTBiomechanicalState,
  saveLocalRehabSession,
  getLocalRehabHistory,
  StoredRehabSession
} from '../services/ptExerciseEngine';

interface PTMachineKioskProps {
  onExit?: () => void;
  onSwitchToMobile?: () => void;
}

export const PTMachineKiosk: React.FC<PTMachineKioskProps> = ({ onExit, onSwitchToMobile }) => {
  const { user, largeFont, voiceGuide, toggleVoiceGuide } = useAuth();
  const { speak, playChime } = useSpeech();

  // Kiosk Phases: 'CHECKIN' | 'WORKOUT' | 'CHECKOUT'
  const [phase, setPhase] = useState<'CHECKIN' | 'WORKOUT' | 'CHECKOUT'>('CHECKIN');
  const [checkinMethod, setCheckinMethod] = useState<'FACE' | 'QR'>('FACE');

  // Camera & Video
  const {
    videoRef,
    isActive: isCameraActive,
    startCamera,
    stopCamera,
    captureFrame
  } = useCamera();

  // Face Detection for e-KYC Check-In
  const { faceResult } = useFaceDetection(videoRef, isCameraActive && phase === 'CHECKIN');

  // MediaPipe Pose for Exercise Session
  const { poseData, latestPoseRef } = useBodyPose(videoRef, isCameraActive && phase === 'WORKOUT');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fullscreen container
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Current Patient State
  const [activePatient, setActivePatient] = useState<{
    id: string;
    name: string;
    programName: string;
    targetExerciseId: string;
    targetAngle: number;
    recommendedSets: number;
    recommendedReps: number;
    lastMaxAngle: number;
  }>({
    id: 'HN-2567-0098',
    name: 'คุณยายสมศรี มีสุข',
    programName: 'โปรแกรมฟื้นฟูข้อไหล่ติดและข้อเข่าเสื่อม',
    targetExerciseId: 'shoulder_abduction',
    targetAngle: 120,
    recommendedSets: 3,
    recommendedReps: 10,
    lastMaxAngle: 114
  });

  // Check-In Scanning Progress Simulation / Lock
  const [checkInProgress, setCheckInProgress] = useState<number>(0);
  const [isFaceVerified, setIsFaceVerified] = useState<boolean>(false);

  // Workout Session State
  const [currentExerciseId, setCurrentExerciseId] = useState<string>('shoulder_abduction');
  const currentExercise = PT_EXERCISES[currentExerciseId] || PT_EXERCISES.shoulder_abduction;
  const trackerRef = useRef<PTExerciseTracker>(new PTExerciseTracker(currentExerciseId, 10, 3));
  const [bioState, setBioState] = useState<PTBiomechanicalState>(() => trackerRef.current.update(null).state);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const sessionTimerRef = useRef<any>(null);

  // Checkout State
  const [painRating, setPainRating] = useState<number>(2);
  const [isSyncingMobile, setIsSyncingMobile] = useState<boolean>(false);
  const [syncDone, setSyncDone] = useState<boolean>(false);
  const [lastSavedSession, setLastSavedSession] = useState<StoredRehabSession | null>(null);

  // Audio Speech Cooldown ref
  const lastAudioSpokenRef = useRef<number>(0);
  const lastSpokenTextRef = useRef<string>('');

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Handle Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.warn);
        setIsFullscreen(false);
      }
    }
  }, []);

  // Check-In Face / QR Auto Progress
  useEffect(() => {
    if (phase !== 'CHECKIN') return;

    if (checkinMethod === 'FACE') {
      if (faceResult?.detected && checkInProgress < 100) {
        const timer = setInterval(() => {
          setCheckInProgress((prev) => {
            if (prev >= 100) {
              clearInterval(timer);
              return 100;
            }
            return prev + 25;
          });
        }, 300);
        return () => clearInterval(timer);
      }
    }
  }, [phase, checkinMethod, faceResult?.detected, checkInProgress]);

  // Auto trigger verification when checkInProgress hits 100%
  useEffect(() => {
    if (phase === 'CHECKIN' && checkInProgress >= 100 && !isFaceVerified) {
      setIsFaceVerified(true);
      playChime('success');
      if (voiceGuide) {
        speak(`ยินดีต้อนรับค่ะ ${activePatient.name} ระบบดึงข้อมูลโปรแกรมกายภาพบำบัดเรียบร้อยแล้วค่ะ`);
      }
    }
  }, [phase, checkInProgress, isFaceVerified, activePatient.name, voiceGuide, speak, playChime]);

  // Proceed from Check-In to Workout
  const handleStartWorkout = () => {
    setPhase('WORKOUT');
    trackerRef.current.setExercise(currentExerciseId);
    trackerRef.current.reset();
    setBioState(trackerRef.current.update(null).state);
    setSessionSeconds(0);

    sessionTimerRef.current = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);

    if (voiceGuide) {
      speak(
        `เริ่มโปรแกรม ${currentExercise.nameTh} กรุณายืนหรือนั่งในระยะ 1.5 ถึง 2 เมตร มองตรงมาที่หน้าจอนะคะ`
      );
    }
  };

  // Workout Motion Analysis Loop & Canvas Skeleton Rendering
  useEffect(() => {
    if (phase !== 'WORKOUT') return;

    let animId: number;
    const processKioskMotion = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const currentPose = latestPoseRef.current;

      // Draw high-visibility hologram skeleton on canvas
      if (canvas && video && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (currentPose && currentPose.landmarks && currentPose.landmarks.length > 0) {
            drawFullAnatomySkeleton(ctx, currentPose, canvas.width, canvas.height, {
              showLabels: true,
              isConfirmed: true
            });
          }
        }
      }

      // Update biomechanical state machine
      if (trackerRef.current) {
        const { state, event } = trackerRef.current.update(currentPose);
        setBioState(state);

        const now = Date.now();

        if (event === 'REP_COUNTED') {
          playChime('success');
          if (voiceGuide) {
            speak(`ครั้งที่ ${state.repsCompleted} เยี่ยมมากค่ะ`);
          }
        } else if (event === 'HOLD_STARTED') {
          playChime('success');
          if (voiceGuide) {
            speak('ค้างไว้ค่ะ');
          }
        } else if (event === 'SET_COMPLETED') {
          playChime('success');
          if (state.stage === 'COMPLETED') {
            handleFinishWorkout();
          } else {
            if (voiceGuide) {
              speak(`จบเซ็ตที่ ${state.currentSet - 1} แล้วค่ะ พักสักครู่นะคะ`);
            }
          }
        } else if (event === 'SAFETY_WARNING') {
          if (now - lastAudioSpokenRef.current > 4000) {
            lastAudioSpokenRef.current = now;
            playChime('alert');
            if (voiceGuide && state.compensationWarning) {
              speak(state.compensationWarning);
            }
          }
        } else {
          // Speak feedback periodically
          if (
            voiceGuide &&
            state.feedbackTh &&
            state.feedbackTh !== lastSpokenTextRef.current &&
            now - lastAudioSpokenRef.current > 6000
          ) {
            lastSpokenTextRef.current = state.feedbackTh;
            lastAudioSpokenRef.current = now;
            speak(state.feedbackTh);
          }
        }
      }

      animId = requestAnimationFrame(processKioskMotion);
    };

    animId = requestAnimationFrame(processKioskMotion);
    return () => cancelAnimationFrame(animId);
  }, [phase, voiceGuide, speak, playChime]);

  // Finish Workout and Go to Checkout
  const handleFinishWorkout = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    setPhase('CHECKOUT');
    playChime('success');
    if (voiceGuide) {
      speak('ทำกายภาพบำบัดเสร็จสิ้นแล้วค่ะ กรุณาระบุระดับความปวด เพื่อบันทึกและส่งผลเข้าโทรศัพท์มือถือนะคะ');
    }
  };

  // Checkout Save & Push to Mobile
  const handleSaveAndSync = () => {
    setIsSyncingMobile(true);
    const totalReps = trackerRef.current.getTotalRepsDone() || 10;
    const session = saveLocalRehabSession({
      exerciseId: currentExercise.id,
      exerciseNameTh: currentExercise.nameTh,
      repsCompleted: totalReps,
      targetReps: 10,
      setsCompleted: bioState.currentSet,
      totalSets: bioState.totalSets,
      maxRomDeg: bioState.peakAngleAchieved || currentExercise.targetAngle,
      targetRomDeg: currentExercise.targetAngle,
      accuracyScore: bioState.accuracyScore || 96,
      painScore: painRating,
      caloriesBurned: Math.round(totalReps * currentExercise.caloriesPerRep),
      durationSeconds: sessionSeconds || 240,
      deviceType: 'MACHINE_KIOSK',
      notes: 'ตรวจวัดอัตโนมัติด้วยตู้เครื่องกายภาพบำบัดอัจฉริยะ Kiosk Station'
    });

    setLastSavedSession(session);

    setTimeout(() => {
      setIsSyncingMobile(false);
      setSyncDone(true);
      playChime('success');
      if (voiceGuide) {
        speak('ซิงค์ผลการรักษาเข้าโทรศัพท์มือถือของผู้ป่วยเรียบร้อยแล้วค่ะ');
      }
    }, 1200);
  };

  // Reset for next patient
  const handleResetForNextPatient = () => {
    setPhase('CHECKIN');
    setCheckInProgress(0);
    setIsFaceVerified(false);
    setSyncDone(false);
    setLastSavedSession(null);
    trackerRef.current.reset();
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-[#F8FAFB] text-slate-800 flex flex-col justify-between font-['Inter'] select-none overflow-x-hidden ${
        largeFont ? 'text-lg' : 'text-base'
      }`}
    >
      {/* Top Station Header (Hospital / Clinic Brand Bar - Ramathibodi Hospital Style) */}
      <header className="bg-white border-b-2 border-[#B2EBE6] px-6 py-4 flex items-center justify-between shadow-xs z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A39E] via-[#008783] to-[#0284C7] flex items-center justify-center text-white shadow-md shadow-teal-500/20 border border-teal-200">
            <HeartPulse className="w-7 h-7 animate-pulse text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-[#0F3D3E] font-['Outfit']">
                โรงพยาบาลรามาธิบดี ม.มหิดล <span className="text-[#00A39E]">• AI Kiosk Station</span>
              </h1>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6] font-mono flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping" />
                <span>เครื่องที่ 1 • พร้อมใช้งาน</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี & ศูนย์กายภาพบำบัด มหาวิทยาลัยมหิดล (One-Stop PT Kiosk)</p>
          </div>
        </div>

        {/* Right Station Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleVoiceGuide}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              voiceGuide
                ? 'bg-[#E6F7F7] border-[#B2EBE6] text-[#008783] shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {voiceGuide ? <Volume2 className="w-4 h-4 text-[#00A39E]" /> : <VolumeX className="w-4 h-4" />}
            <span>{voiceGuide ? 'เปิดเสียงโค้ช AI' : 'ปิดเสียง'}</span>
          </button>

          {onSwitchToMobile && (
            <button
              onClick={onSwitchToMobile}
              className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#008783] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="ดูมุมมองบนโทรศัพท์มือถือ"
            >
              <Smartphone className="w-4 h-4 text-[#00A39E]" />
              <span>โหมดโทรศัพท์</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition-colors cursor-pointer shadow-xs"
            title="เต็มจอ"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>ออก</span>
            </button>
          )}
        </div>
      </header>

      {/* =========================================================
          PHASE 1: CONTACTLESS ONE-STOP CHECK-IN (RAMATHIBODI STYLE)
         ========================================================= */}
      {phase === 'CHECKIN' && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6 items-center justify-center animate-fadeIn">
          {/* Left: Camera Scanner Viewport */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <div className="relative aspect-[4/3] w-full max-w-md rounded-3xl overflow-hidden bg-slate-900 border-4 border-[#B2EBE6] shadow-xl flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

              {/* Scanning Target Box & Reticle in Ramathibodi Teal */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {checkinMethod === 'FACE' ? (
                  <div className="w-56 h-72 rounded-[40px] border-4 border-dashed border-[#00A39E] flex items-center justify-center shadow-[0_0_50px_rgba(0,163,158,0.35)] animate-pulse">
                    <div className="w-48 h-64 rounded-[32px] border border-teal-300/40" />
                  </div>
                ) : (
                  <div className="w-60 h-60 rounded-3xl border-4 border-dashed border-[#00A39E] flex items-center justify-center shadow-[0_0_50px_rgba(0,163,158,0.35)] animate-pulse">
                    <QrCode className="w-24 h-24 text-[#00A39E]" />
                  </div>
                )}
              </div>

              {/* Scan HUD Overlay Banner in Ramathibodi Mint */}
              <div className="absolute bottom-4 inset-x-4 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#B2EBE6] text-center shadow-lg">
                <span className="text-xs font-bold text-[#0F3D3E]">
                  {checkinMethod === 'FACE'
                    ? 'วางใบหน้าให้อยู่ในกรอบเพื่อสแกนชีวมิติ'
                    : 'นำ QR Code จากโทรศัพท์มือถือมาส่องที่หน้ากล้อง'}
                </span>

                {/* Progress Bar in Rama Teal */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mt-2 border border-slate-300">
                  <div
                    className="h-full bg-gradient-to-r from-[#00A39E] to-[#0284C7] transition-all duration-300"
                    style={{ width: `${checkInProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Check-In Method Switcher Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setCheckinMethod('FACE');
                  setCheckInProgress(0);
                  setIsFaceVerified(false);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  checkinMethod === 'FACE'
                    ? 'bg-[#00A39E] hover:bg-[#008783] text-white shadow-md shadow-teal-500/25'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <User className="w-4 h-4" />
                <span>สแกนใบหน้า e-KYC</span>
              </button>

              <button
                onClick={() => {
                  setCheckinMethod('QR');
                  setCheckInProgress(100);
                  setIsFaceVerified(true);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  checkinMethod === 'QR'
                    ? 'bg-[#00A39E] hover:bg-[#008783] text-white shadow-md shadow-teal-500/25'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>สแกน QR Code มือถือ</span>
              </button>
            </div>
          </div>

          {/* Right: Patient Profile & Prescription Summary (Ramathibodi Card) */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div className="rounded-3xl bg-white border-2 border-[#B2EBE6] p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-[#008783] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00A39E]" />
                  <span>ระบบระบุตัวตนผู้ป่วยอัตโนมัติ</span>
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold font-mono ${
                    isFaceVerified
                      ? 'bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isFaceVerified ? '✓ ตรวจสอบผ่านแล้ว' : 'กำลังรอสแกน...'}
                </span>
              </div>

              {/* Patient Badge */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00A39E] to-[#0284C7] p-0.5 shadow-md">
                  <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                    <User className="w-9 h-9 text-[#00A39E]" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{activePatient.id}</span>
                  <h2 className="text-2xl font-black text-[#0F3D3E] mt-0.5">{activePatient.name}</h2>
                  <p className="text-xs text-[#00A39E] font-bold mt-0.5">สถานะ: มีโปรแกรมนัดหมายวันนี้</p>
                </div>
              </div>

              {/* Prescription Routine Loaded in Signature Ramathibodi Mint */}
              <div className="p-4 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F3D3E] uppercase tracking-wider">
                    โปรแกรมกายภาพบำบัดที่สั่งจ่าย
                  </h3>
                  <span className="text-[11px] text-[#008783] font-bold">นพ. ธนากร (แพทย์เวชศาสตร์ฟื้นฟู)</span>
                </div>

                <div className="text-sm font-extrabold text-[#0F3D3E] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00A39E]" />
                  <span>{currentExercise.nameTh}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[#B2EBE6]/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">เป้าหมาย</span>
                    <span className="font-extrabold text-[#0F3D3E] font-mono">{activePatient.targetAngle}°</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">จำนวน</span>
                    <span className="font-extrabold text-[#0F3D3E] font-mono">
                      {activePatient.recommendedSets} เซ็ต x {activePatient.recommendedReps} ครั้ง
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ครั้งก่อนทำได้</span>
                    <span className="font-extrabold text-[#008783] font-mono">{activePatient.lastMaxAngle}°</span>
                  </div>
                </div>
              </div>

              {/* Start Button in Ramathibodi Teal */}
              <button
                onClick={handleStartWorkout}
                disabled={!isFaceVerified}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-lg transition-all ${
                  isFaceVerified
                    ? 'bg-gradient-to-r from-[#00A39E] to-[#008783] hover:from-[#008783] hover:to-[#00706c] text-white shadow-teal-500/30 cursor-pointer active:scale-98'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>เริ่มทำกายภาพบำบัดทันที (One-Touch Start)</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          PHASE 2: AI INTERACTIVE PT WORKOUT HUD (RAMATHIBODI THEME)
         ========================================================= */}
      {phase === 'WORKOUT' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-5 animate-fadeIn">
          {/* Left: Patient Live Camera & Biomechanical HUD */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden bg-slate-900 border-4 border-[#B2EBE6] shadow-2xl flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]" />

              {/* Top Station HUD: Timer & Session Info */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
                <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#B2EBE6] text-[#0F3D3E] text-xs font-bold flex items-center gap-2 shadow-md">
                  <Activity className="w-4 h-4 text-[#00A39E]" />
                  <span>{currentExercise.nameTh}</span>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#B2EBE6] text-[#0F3D3E] text-xs font-mono font-bold flex items-center gap-2 shadow-md">
                  <Clock className="w-4 h-4 text-[#00A39E]" />
                  <span>
                    {Math.floor(sessionSeconds / 60)}:
                    {String(sessionSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Middle Coach Speech Toast in Ramathibodi Banner */}
              <div className="absolute top-16 inset-x-6 z-20 pointer-events-none flex justify-center">
                <div
                  className={`px-5 py-2.5 rounded-full text-sm font-extrabold shadow-2xl backdrop-blur-md border transition-all ${
                    bioState.isCompensating
                      ? 'bg-amber-500 text-white border-amber-300 animate-bounce'
                      : bioState.isHolding
                      ? 'bg-[#00A39E] text-white border-teal-200'
                      : 'bg-white/95 text-[#0F3D3E] border-[#B2EBE6]'
                  }`}
                >
                  {bioState.feedbackTh}
                </div>
              </div>

              {/* Bottom Large Gauges (Angle & Hold Counter) */}
              <div className="absolute bottom-4 inset-x-4 z-20 pointer-events-none flex items-end justify-between">
                {/* Big Angle Gauge */}
                <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-[#B2EBE6] text-center shadow-xl">
                  <span className="text-xs font-bold text-slate-500 block uppercase">องศาข้อต่อชีวกลศาสตร์</span>
                  <div className="text-5xl font-black text-[#0F3D3E] font-mono flex items-baseline justify-center my-1">
                    <span>{Math.round(bioState.currentAngle)}</span>
                    <span className="text-lg text-[#00A39E] font-bold ml-1">°</span>
                  </div>
                  <span className="text-xs font-bold text-[#008783] block">
                    เป้าหมาย {bioState.targetAngle}° (สูงสุด {bioState.peakAngleAchieved}°)
                  </span>
                </div>

                {/* Peak Hold Countdown Box in Ramathibodi Teal */}
                {bioState.isHolding && (
                  <div className="p-4 rounded-3xl bg-[#00A39E]/95 backdrop-blur-md border-2 border-teal-300 text-center shadow-2xl animate-pulse">
                    <span className="text-xs font-bold text-teal-100 block">ค้างท่าไว้</span>
                    <div className="text-5xl font-black text-white font-mono my-1">
                      {bioState.holdTimeRemaining}s
                    </div>
                    <span className="text-xs text-teal-100 font-semibold">เก่งมากค่ะ</span>
                  </div>
                )}

                {/* Accuracy Score */}
                <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-[#B2EBE6] text-center shadow-xl">
                  <span className="text-xs font-bold text-slate-500 block uppercase">คะแนนความถูกต้อง</span>
                  <div className="text-4xl font-black text-[#00A39E] font-mono my-1">
                    <span>{bioState.accuracyScore}</span>
                    <span className="text-sm font-normal">%</span>
                  </div>
                  <span className="text-xs text-slate-500">รักษาแนวลำตัวดี</span>
                </div>
              </div>
            </div>

            {/* Bottom Reps Progress Bar */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#B2EBE6] flex items-center justify-between shadow-md">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">
                    เซ็ตที่ {bioState.currentSet}/{bioState.totalSets}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-base font-mono font-black text-[#00A39E]">
                    ครั้งที่ {bioState.repsCompleted}/{bioState.targetReps}
                  </span>
                </div>
                <div className="w-80 h-3 rounded-full bg-slate-200 overflow-hidden mt-2 border border-slate-300">
                  <div
                    className="h-full bg-gradient-to-r from-[#00A39E] to-[#0284C7] transition-all duration-300"
                    style={{ width: `${bioState.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => trackerRef.current.reset()}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เริ่มนับใหม่</span>
                </button>
                <button
                  onClick={handleFinishWorkout}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A39E] to-[#008783] hover:from-[#008783] hover:to-[#00706c] text-white font-extrabold text-xs shadow-md shadow-teal-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  จบรอบและสรุปผล
                </button>
              </div>
            </div>
          </div>

          {/* Right: Virtual Therapist Guide & Technique Card */}
          <div className="w-full md:w-80 flex flex-col gap-4">
            {/* Guide Card in Ramathibodi Style */}
            <div className="rounded-3xl bg-white border-2 border-[#B2EBE6] p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#008783] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#00A39E]" />
                <span>เทคนิคการทำกายภาพท่านี้</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] flex flex-col gap-2">
                <h4 className="text-sm font-extrabold text-[#0F3D3E]">{currentExercise.nameTh}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{currentExercise.description}</p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-500">ขั้นตอนการปฏิบัติ:</span>
                <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5">
                  {currentExercise.instructions.map((ins, idx) => (
                    <li key={idx} className="leading-snug">
                      {ins}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>หากรู้สึกเจ็บแปลบที่ข้อต่อ ให้หยุดพักทันทีและกดปุ่มจบรอบนะคะ</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          PHASE 3: ONE-STOP CHECKOUT & AUTOMATIC MOBILE SYNC
         ========================================================= */}
      {phase === 'CHECKOUT' && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col items-center justify-center animate-fadeIn">
          <div className="w-full rounded-3xl bg-white border-2 border-[#B2EBE6] p-8 shadow-2xl flex flex-col gap-6">
            {/* Header Success */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#E6F7F7] text-[#00A39E] flex items-center justify-center mx-auto mb-3 shadow-md border border-[#B2EBE6]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold text-[#008783] uppercase tracking-wider">
                กายภาพบำบัดเสร็จสมบูรณ์
              </span>
              <h2 className="text-2xl font-black text-[#0F3D3E] mt-1 font-['Outfit']">
                สรุปผลการฟื้นฟูของ {activePatient.name}
              </h2>
              <p className="text-xs text-slate-500">{currentExercise.nameTh} • ตู้กายภาพบำบัดหมายเลข 1</p>
            </div>

            {/* Scorecard Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#F8FAFB] border border-[#B2EBE6] text-center">
                <span className="text-xs text-slate-500 block">จำนวนครั้งทั้งหมด</span>
                <span className="text-2xl font-black text-[#0F3D3E] font-mono mt-1 block">
                  {trackerRef.current.getTotalRepsDone() || 10} ครั้ง
                </span>
                <span className="text-[11px] text-[#008783] font-bold">ครบตามเป้าหมาย</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFB] border border-[#B2EBE6] text-center">
                <span className="text-xs text-slate-500 block">องศาข้อต่อสูงสุด (ROM)</span>
                <span className="text-2xl font-black text-[#00A39E] font-mono mt-1 block">
                  {bioState.peakAngleAchieved || currentExercise.targetAngle}°
                </span>
                <span className="text-[11px] text-[#008783]">เป้าหมาย {currentExercise.targetAngle}°</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFB] border border-[#B2EBE6] text-center">
                <span className="text-xs text-slate-500 block">คะแนนความถูกต้อง</span>
                <span className="text-2xl font-black text-[#00A39E] font-mono mt-1 block">
                  {bioState.accuracyScore || 96}%
                </span>
                <span className="text-[11px] text-slate-500">สรีระได้มาตรฐาน</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFB] border border-[#B2EBE6] text-center">
                <span className="text-xs text-slate-500 block">เวลา & เผาผลาญ</span>
                <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                  {Math.round((trackerRef.current.getTotalRepsDone() || 10) * currentExercise.caloriesPerRep)} kcal
                </span>
                <span className="text-[11px] text-slate-500">
                  {Math.floor(sessionSeconds / 60)} นาที {sessionSeconds % 60} วินาที
                </span>
              </div>
            </div>

            {/* Pain Scale Rating VAS Slider in Signature Mint */}
            <div className="p-5 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#0F3D3E]">บันทึกระดับความปวดหลังฝึก (Pain Scale VAS)</h4>
                  <p className="text-xs text-slate-500">กรุณาแตะเลื่อนแถบวัดเพื่อประเมินความรู้สึกเจ็บปวด</p>
                </div>
                <span
                  className={`text-base font-black font-mono px-3 py-1 rounded-xl ${
                    painRating <= 3 ? 'bg-white text-[#008783] border border-[#B2EBE6]' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {painRating} / 10
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={10}
                value={painRating}
                onChange={(e) => setPainRating(Number(e.target.value))}
                className="w-full h-3 bg-white rounded-lg appearance-none cursor-pointer accent-[#00A39E] border border-[#B2EBE6]"
              />

              <div className="flex justify-between text-xs text-slate-500">
                <span>0 ไม่ปวดเลย</span>
                <span>3 ปวดเล็กน้อย</span>
                <span>5 ปวดปานกลาง</span>
                <span>8 ปวดมาก</span>
                <span>10 ปวดมากที่สุด</span>
              </div>
            </div>

            {/* Action Buttons: Auto-Sync to Mobile & Finish */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleSaveAndSync}
                disabled={isSyncingMobile || syncDone}
                className={`flex-1 py-4 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 shadow-lg transition-all ${
                  syncDone
                    ? 'bg-[#E6F7F7] border border-[#B2EBE6] text-[#008783] cursor-default'
                    : 'bg-gradient-to-r from-[#00A39E] to-[#0284C7] hover:from-[#008783] hover:to-[#0274b0] text-white shadow-teal-500/25 cursor-pointer active:scale-98'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>
                  {isSyncingMobile
                    ? 'กำลังส่งข้อมูลเข้ามือถือ...'
                    : syncDone
                    ? '✓ ส่งผลการรักษาเข้าโทรศัพท์มือถือเรียบร้อยแล้ว'
                    : 'บันทึกและส่งผลเข้าโทรศัพท์มือถืออัตโนมัติ'}
                </span>
              </button>

              <button
                onClick={handleResetForNextPatient}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm border border-slate-200 transition-colors cursor-pointer"
              >
                เสร็จสิ้น / ผู้ป่วยท่านถัดไป
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Station Footer (Ramathibodi Hospital Identity) */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#0F3D3E]">โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</span>
          <span>•</span>
          <span>คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี (Dual One-Stop Kiosk)</span>
        </div>
        <div className="text-[#00A39E] font-mono font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping" />
          <span>Biomechanical Engine Active (60 FPS)</span>
        </div>
      </footer>
    </div>
  );
};
