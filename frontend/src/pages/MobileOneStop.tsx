import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Smartphone,
  QrCode,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  SwitchCamera,
  ChevronRight,
  ShieldCheck,
  User,
  HeartPulse,
  Flame,
  FileText,
  Share2,
  Sparkles,
  ArrowUpRight,
  X,
  Check,
  Radio,
  Tv
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useSpeech } from '../hooks/useSpeech';
import { useAuth } from '../context/AuthContext';
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
import { getLocalQueueTickets, bookNewQueue, QueueTicket } from '../services/queueService';

interface MobileOneStopProps {
  onSwitchToKiosk?: () => void;
  onExit?: () => void;
}

export const MobileOneStop: React.FC<MobileOneStopProps> = ({ onSwitchToKiosk, onExit }) => {
  const { user, largeFont, voiceGuide, toggleLargeFont, toggleVoiceGuide } = useAuth();
  const { speak, playChime } = useSpeech();

  // Active Bottom Tab: 'home' | 'pt_camera' | 'queue' | 'history' | 'kiosk_sync'
  const [activeTab, setActiveTab] = useState<'home' | 'pt_camera' | 'queue' | 'history' | 'kiosk_sync'>('home');

  // Camera & AI State for Home PT Camera Tab
  const {
    videoRef,
    isActive: isCameraActive,
    startCamera,
    stopCamera,
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    error: cameraError
  } = useCamera();

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('shoulder_abduction');
  const selectedExercise: PTExerciseConfig = PT_EXERCISES[selectedExerciseId] || PT_EXERCISES.shoulder_abduction;

  // MediaPipe Pose detection
  const { poseData, latestPoseRef } = useBodyPose(videoRef, isCameraActive && activeTab === 'pt_camera');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Biomechanical Tracker Instance
  const trackerRef = useRef<PTExerciseTracker>(new PTExerciseTracker(selectedExerciseId, 10, 3));
  const [bioState, setBioState] = useState<PTBiomechanicalState>(() => trackerRef.current.update(null).state);
  const lastSpokenFeedbackRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);

  // Post-Workout Completion Modal
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [painRating, setPainRating] = useState<number>(3);
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);
  const workoutTimerRef = useRef<any>(null);

  // QR Pass Modal
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Booking Modal
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookingTime, setBookingTime] = useState<string>('14:00 - 14:30');
  const [bookingExercise, setBookingExercise] = useState<string>('shoulder_abduction');

  // Local Data State
  const [rehabHistory, setRehabHistory] = useState<StoredRehabSession[]>(() => getLocalRehabHistory());
  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>(() => getLocalQueueTickets());

  // Patient Info (From Auth or Default Senior Profile)
  const patientName = user?.displayName || 'คุณยายสมศรี มีสุข';
  const patientId = 'HN-2567-0098';

  // Switch Exercise in Tracker
  useEffect(() => {
    if (trackerRef.current) {
      trackerRef.current.setExercise(selectedExerciseId);
      setBioState(trackerRef.current.update(null).state);
    }
  }, [selectedExerciseId]);

  // Start/Stop Camera when entering/leaving 'pt_camera' tab
  useEffect(() => {
    if (activeTab === 'pt_camera') {
      startCamera();
      workoutTimerRef.current = setInterval(() => {
        setWorkoutDuration((prev) => prev + 1);
      }, 1000);
      if (voiceGuide) {
        speak(`เริ่มโหมดกายภาพบำบัด ${selectedExercise.nameTh} กรุณายืนให้อยู่ในกรอบกล้องนะคะ`);
      }
    } else {
      stopCamera();
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
      }
    }
    return () => {
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
      }
    };
  }, [activeTab]);

  // Real-time Frame Analysis Loop & Canvas Skeleton Rendering
  useEffect(() => {
    if (activeTab !== 'pt_camera' || !isCameraActive) return;

    let animId: number;
    const processMotion = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const currentPose = latestPoseRef.current;

      // Draw skeleton on canvas overlay
      if (canvas && video && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (currentPose && currentPose.landmarks && currentPose.landmarks.length > 0) {
            drawFullAnatomySkeleton(ctx, currentPose, canvas.width, canvas.height, { showLabels: true });
          }
        }
      }

      // Update biomechanical state machine
      if (trackerRef.current) {
        const { state, event } = trackerRef.current.update(currentPose);
        setBioState(state);

        const now = Date.now();

        // Handle Audio Events
        if (event === 'REP_COUNTED') {
          playChime('success');
          if (voiceGuide) {
            speak(`ครั้งที่ ${state.repsCompleted} เก่งมากค่ะ`);
          }
        } else if (event === 'HOLD_STARTED') {
          playChime('success');
          if (voiceGuide) {
            speak('ค้างไว้ค่ะ');
          }
        } else if (event === 'SET_COMPLETED') {
          playChime('success');
          if (state.stage === 'COMPLETED') {
            setShowCompletionModal(true);
            if (voiceGuide) {
              speak('ยินดีด้วยค่ะ ครบโปรแกรมแล้ว บันทึกข้อมูลเรียบร้อยค่ะ');
            }
          } else {
            if (voiceGuide) {
              speak(`จบเซ็ตแล้วค่ะ พักสักครู่นะคะ`);
            }
          }
        } else if (event === 'SAFETY_WARNING') {
          if (now - lastSpokenTimeRef.current > 4000) {
            lastSpokenTimeRef.current = now;
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
            state.feedbackTh !== lastSpokenFeedbackRef.current &&
            now - lastSpokenTimeRef.current > 5000
          ) {
            lastSpokenFeedbackRef.current = state.feedbackTh;
            lastSpokenTimeRef.current = now;
            speak(state.feedbackTh);
          }
        }
      }

      animId = requestAnimationFrame(processMotion);
    };

    animId = requestAnimationFrame(processMotion);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, isCameraActive, voiceGuide, speak, playChime]);

  // Flip Camera handler for mobile
  const handleToggleCamera = useCallback(() => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextCamera = cameras[(currentIndex + 1) % cameras.length];
    if (nextCamera) {
      setSelectedCameraId(nextCamera.deviceId);
      startCamera(nextCamera.deviceId);
    }
  }, [cameras, selectedCameraId, startCamera, setSelectedCameraId]);

  // Save Workout Finish
  const handleSaveWorkout = () => {
    const totalReps = trackerRef.current.getTotalRepsDone();
    const newSession = saveLocalRehabSession({
      exerciseId: selectedExercise.id,
      exerciseNameTh: selectedExercise.nameTh,
      repsCompleted: totalReps || 10,
      targetReps: selectedExercise.id === 'balance_posture' ? 5 : 10,
      setsCompleted: bioState.currentSet,
      totalSets: bioState.totalSets,
      maxRomDeg: bioState.peakAngleAchieved || selectedExercise.targetAngle,
      targetRomDeg: selectedExercise.targetAngle,
      accuracyScore: bioState.accuracyScore || 94,
      painScore: painRating,
      caloriesBurned: Math.round((totalReps || 10) * selectedExercise.caloriesPerRep),
      durationSeconds: workoutDuration || 180,
      deviceType: 'MOBILE',
      notes: 'บันทึกอัตโนมัติจากการทำกายภาพบำบัดด้วยกล้องมือถือ'
    });

    setRehabHistory(getLocalRehabHistory());
    setShowCompletionModal(false);
    trackerRef.current.reset();
    setBioState(trackerRef.current.update(null).state);
    setWorkoutDuration(0);
    setActiveTab('history');
  };

  // Submit Queue Booking
  const handleBookQueue = () => {
    const exConfig = PT_EXERCISES[bookingExercise] || PT_EXERCISES.shoulder_abduction;
    const ticket = bookNewQueue(patientName, patientId, bookingExercise, exConfig.nameTh, bookingTime);
    setQueueTickets(getLocalQueueTickets());
    setShowBookingModal(false);
    playChime('success');
    if (voiceGuide) {
      speak(`จองคิวสำเร็จ ได้หมายเลข ${ticket.ticketNumber} ค่ะ`);
    }
    setActiveTab('queue');
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFB] text-slate-900 flex flex-col justify-between pb-24 select-none ${largeFont ? 'text-lg' : 'text-sm'}`}>
      {/* Top Mobile App Header (Ramathibodi Hospital & StrongCare Theme) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-[0_2px_10px_0_rgba(0,163,158,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008783] to-[#00A39E] flex items-center justify-center text-white shadow-md shadow-teal-900/15 border border-teal-200">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base tracking-tight text-[#0F3D3E] font-['Outfit']">StrongCare</h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]">
                รพ.รามาธิบดี
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">One-Stop Physical Therapy</p>
          </div>
        </div>

        {/* Quick Top Actions: Font size, Voice, Kiosk Switch */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleLargeFont}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              largeFont ? 'bg-[#E6F7F7] border-[#B2EBE6] text-[#008783]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="ปรับขนาดตัวหนังสือ"
          >
            A+
          </button>
          <button
            onClick={toggleVoiceGuide}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              voiceGuide ? 'bg-[#E6F7F7] border-[#B2EBE6] text-[#008783]' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
            title="เปิด/ปิด เสียง AI"
          >
            {voiceGuide ? <Volume2 className="w-4 h-4 text-[#008783]" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {onSwitchToKiosk && (
            <button
              onClick={onSwitchToKiosk}
              className="px-2.5 py-1.5 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              title="สลับไปหน้าจอเครื่องทำกายภาพ"
            >
              <Tv className="w-3.5 h-3.5 text-white" />
              <span className="hidden xs:inline">ตู้กายภาพ</span>
            </button>
          )}
          {onExit && (
            <button
              onClick={onExit}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="กลับหน้าแดชบอร์ด"
            >
              ออก
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col gap-4">
        {/* =========================================
            TAB 1: HOME & DIGITAL PASSPORT
           ========================================= */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Patient Digital Identity Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-[#B2EBE6] p-5 shadow-sm">
              <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] flex items-center justify-center shadow-xs">
                    <User className="w-7 h-7 text-[#008783]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#008783] font-bold">
                      {patientId}
                    </span>
                    <h2 className="text-lg font-black text-[#0F3D3E]">{patientName}</h2>
                    <p className="text-xs text-slate-500">โปรแกรม: กายภาพฟื้นฟูข้อไหล่และข้อเข่า</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-2.5 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] text-[#008783] hover:bg-teal-100 flex flex-col items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-6 h-6 text-[#008783]" />
                  <span className="text-[10px] font-bold">บัตร QR</span>
                </button>
              </div>

              {/* Fast Action: Touchless Machine Check-In Banner */}
              <div
                onClick={() => setShowQrModal(true)}
                className="mt-4 p-3.5 rounded-2xl bg-[#E6F7F7] hover:bg-teal-100/70 border border-[#B2EBE6] flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#008783] shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F3D3E]">แตะเพื่อเปิด QR สแกนเข้าตู้กายภาพ</h4>
                    <p className="text-[11px] text-slate-500">เข้าตู้ได้ทันทีโดยไม่ต้องกรอกข้อมูล</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#008783]" />
              </div>
            </div>

            {/* Daily PT Targets & Streak Tracker */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 flex flex-col items-center text-center shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1 border border-amber-200">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-[#0F3D3E]">5 วัน</span>
                <span className="text-[10px] text-slate-500">เป้าหมายต่อเนื่อง</span>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 flex flex-col items-center text-center shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#008783] flex items-center justify-center mb-1 border border-[#B2EBE6]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-[#0F3D3E]">2/3 เซ็ต</span>
                <span className="text-[10px] text-slate-500">ทำแล้ววันนี้</span>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 flex flex-col items-center text-center shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1 border border-sky-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-[#0F3D3E]">120°</span>
                <span className="text-[10px] text-slate-500">องศาข้อไหล่สูงสุด</span>
              </div>
            </div>

            {/* Prescribed Physical Therapy Routine */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#0F3D3E] flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#00A39E]" />
                  <span>โปรแกรมกายภาพประจำวัน (แพทย์สั่ง)</span>
                </h3>
                <span className="text-[11px] font-bold text-[#008783] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#B2EBE6]">
                  อัปเดตวันนี้
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {Object.values(PT_EXERCISES).slice(0, 3).map((ex, idx) => (
                  <div
                    key={ex.id}
                    onClick={() => {
                      setSelectedExerciseId(ex.id);
                      setActiveTab('pt_camera');
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-[#E6F7F7]/60 border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E6F7F7] border border-[#B2EBE6] text-[#008783] flex items-center justify-center font-black text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{ex.nameTh}</h4>
                        <p className="text-[11px] text-slate-500">เป้าหมาย {ex.targetAngle}° • 3 เซ็ต ละ 10 ครั้ง</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#008783] font-bold text-xs">
                      <span>เริ่มฝึก</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Start Big PT Button */}
              <button
                onClick={() => setActiveTab('pt_camera')}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#00A39E] hover:bg-[#008783] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>เปิดกล้องทำกายภาพด้วย AI ที่บ้าน</span>
              </button>
            </div>

            {/* Live Queue Radar Card */}
            <div className="rounded-3xl bg-white border border-[#B2EBE6] p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-[#008783] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping" />
                  <span>ระบบคิวเครื่องกายภาพสด</span>
                </span>
                <h4 className="text-sm font-black text-[#0F3D3E] mt-0.5">คิวล่าสุดที่กำลังเรียก: PT-012</h4>
                <p className="text-xs text-slate-500">ตู้หมายเลข 1 • รออีกประมาณ 10 นาที</p>
              </div>
              <button
                onClick={() => setActiveTab('queue')}
                className="px-3.5 py-2 rounded-xl bg-[#E6F7F7] hover:bg-teal-100 text-[#008783] font-bold text-xs border border-[#B2EBE6] transition-colors cursor-pointer"
              >
                ดูคิวของคุณ
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: AI HOME PHYSICAL THERAPY CAMERA
           ========================================= */}
        {activeTab === 'pt_camera' && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            {/* Exercise Selector Pill Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {Object.values(PT_EXERCISES).map((ex) => {
                const isSelected = ex.id === selectedExerciseId;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExerciseId(ex.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00A39E] text-white shadow-sm border border-teal-600'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-[#E6F7F7]'
                    }`}
                  >
                    {ex.nameTh.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Video Viewport Container */}
            <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Skeleton Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full pointer-events-none ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Top HUD Overlay (Exercise Title, Camera Flip, Voice status) */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                <div className="px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 text-xs font-black flex items-center gap-1.5 shadow-md">
                  <Activity className="w-3.5 h-3.5 text-[#00A39E]" />
                  <span>{selectedExercise.nameTh}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {cameras.length > 1 && (
                    <button
                      onClick={handleToggleCamera}
                      className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-[#00A39E] shadow-sm transition-colors cursor-pointer"
                      title="สลับกล้องหน้า/หลัง"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => trackerRef.current.reset()}
                    className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-[#00A39E] shadow-sm transition-colors cursor-pointer"
                    title="เริ่มนับใหม่"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Middle Floating Feedback Banner */}
              <div className="absolute top-14 inset-x-4 z-20 pointer-events-none flex justify-center">
                <div
                  className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border transition-all ${
                    bioState.isCompensating
                      ? 'bg-amber-500 text-white border-amber-300 animate-bounce'
                      : bioState.isHolding
                      ? 'bg-[#00A39E] text-white border-teal-300'
                      : 'bg-white/95 text-slate-900 border-slate-200'
                  }`}
                >
                  {bioState.feedbackTh}
                </div>
              </div>

              {/* Angle Dial Gauge & Hold Countdown */}
              <div className="absolute bottom-20 inset-x-4 z-20 pointer-events-none flex items-end justify-between">
                {/* Live Angle Gauge */}
                <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-center shadow-lg">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">องศาข้อต่อ</span>
                  <div className="text-3xl font-black text-[#0F3D3E] font-mono flex items-baseline justify-center">
                    <span>{Math.round(bioState.currentAngle)}</span>
                    <span className="text-xs text-[#00A39E] font-normal ml-0.5">°</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#00A39E] block">
                    เป้าหมาย {bioState.targetAngle}°
                  </span>
                </div>

                {/* Hold Counter if in Peak Hold */}
                {bioState.isHolding && (
                  <div className="p-3.5 rounded-2xl bg-[#00A39E] backdrop-blur-md border border-teal-300 text-center shadow-xl animate-pulse">
                    <span className="text-[10px] font-bold text-teal-100 block">ค้างไว้</span>
                    <span className="text-3xl font-black text-white font-mono">{bioState.holdTimeRemaining}s</span>
                  </div>
                )}

                {/* Accuracy Score */}
                <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-center shadow-lg">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">ความแม่นยำ</span>
                  <div className="text-2xl font-black text-[#008783] font-mono">
                    <span>{bioState.accuracyScore}</span>
                    <span className="text-xs font-normal">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500">ฟอร์มดีมาก</span>
                </div>
              </div>

              {/* Bottom Progress Bar & Repetition Counter */}
              <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-auto p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 flex items-center justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      เซ็ตที่ {bioState.currentSet}/{bioState.totalSets}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-mono font-black text-[#008783]">
                      ครั้งที่ {bioState.repsCompleted}/{bioState.targetReps}
                    </span>
                  </div>
                  <div className="w-44 h-2 rounded-full bg-slate-100 overflow-hidden mt-1.5 border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-[#008783] to-[#00A39E] transition-all duration-300"
                      style={{ width: `${bioState.progressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowCompletionModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all active:scale-95 cursor-pointer"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>

            {/* Exercise Instructions & Caution */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 flex flex-col gap-2 text-xs shadow-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#008783]" />
                <span>คำแนะนำขณะฝึก (มาตรฐาน รพ.รามาธิบดี):</span>
              </h4>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {selectedExercise.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 3: SMART QUEUE & APPOINTMENTS
           ========================================= */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Live Queue Calling Radar */}
            <div className="rounded-3xl bg-[#E6F7F7] border border-[#B2EBE6] p-5 text-center shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 text-[#008783] font-bold text-xs mb-1">
                <Radio className="w-4 h-4 animate-pulse text-[#00A39E]" />
                <span>รพ.รามาธิบดี • ถ่ายทอดสถานะคิวสด</span>
              </div>
              <span className="text-xs text-slate-500">หมายเลขคิวที่กำลังให้บริการ</span>
              <div className="text-5xl font-black text-[#008783] font-mono tracking-wider my-2">PT-012</div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#008783] border border-[#B2EBE6] text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping" />
                <span>ตู้กายภาพบำบัดหมายเลข 1</span>
              </div>
            </div>

            {/* User's Ticket Card */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0F3D3E] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00A39E]" />
                  <span>คิวของคุณ</span>
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#008783] font-bold border border-[#B2EBE6]">
                  รอรับบริการ (ลำดับที่ 2)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">บัตรคิวหมายเลข</span>
                  <div className="text-2xl font-black text-[#0F3D3E] font-mono">PT-013</div>
                  <span className="text-xs text-[#008783] font-medium">เวลาประมาณ 10:30 - 11:00 น.</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">รอประมาณ</span>
                  <div className="text-xl font-black text-[#008783] font-mono">10 นาที</div>
                  <span className="text-[11px] text-slate-500">ตู้หมายเลข 1</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex-1 py-2.5 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-700/20 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>แสดง QR สแกนเข้าตู้</span>
                </button>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer"
                >
                  จองเวลาอื่น
                </button>
              </div>
            </div>

            {/* All Active Queue Board */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 flex flex-col gap-2.5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">ลำดับคิวทั้งหมดในระบบ</h4>
              <div className="divide-y divide-slate-100">
                {queueTickets.map((q) => (
                  <div key={q.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${
                          q.status === 'CALLING'
                            ? 'bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {q.ticketNumber.split('-')[1]}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{q.patientName}</h5>
                        <p className="text-[11px] text-slate-500">{q.exerciseNameTh}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.status === 'CALLING'
                            ? 'bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.status === 'CALLING' ? 'กำลังเรียก' : 'รอคิว'}
                      </span>
                      <span className="text-[11px] text-slate-500 block font-mono mt-0.5">{q.timeSlot}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 4: HEALTH RECORDS & ROM PROGRESSION
           ========================================= */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Header with ROM Progression Graph */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#0F3D3E] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#00A39E]" />
                    <span>พัฒนาการองศาข้อไหล่ (ROM Trend)</span>
                  </h3>
                  <p className="text-xs text-slate-500">เปรียบเทียบการฟื้นฟู 4 ครั้งล่าสุด</p>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#E6F7F7] border border-[#B2EBE6] text-[#008783] font-bold text-xs">
                  +15° เพิ่มขึ้น
                </div>
              </div>

              {/* Custom CSS Bar Graph */}
              <div className="h-32 pt-4 pb-2 flex items-end justify-between gap-3 border-b border-slate-100">
                {[
                  { label: '3 วันก่อน', angle: 105, target: 120 },
                  { label: '2 วันก่อน', angle: 114, target: 120 },
                  { label: 'เมื่อวาน', angle: 120, target: 120 },
                  { label: 'วันนี้', angle: 125, target: 120 }
                ].map((item, idx) => {
                  const heightPercent = Math.min(100, Math.round((item.angle / 140) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-900 font-mono">{item.angle}°</span>
                      <div className="w-full max-w-[36px] h-24 bg-slate-100 rounded-t-lg overflow-hidden flex items-end border border-slate-200">
                        <div
                          className="w-full bg-gradient-to-t from-[#008783] to-[#00A39E] transition-all duration-500 rounded-t-lg"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Graph Stats Bar */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">ทำได้สูงสุด</span>
                  <span className="text-sm font-black text-[#0F3D3E] font-mono">125°</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">ระดับความปวด</span>
                  <span className="text-sm font-black text-[#008783] font-mono">ลดลงเหลือ 2/10</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">ความสม่ำเสมอ</span>
                  <span className="text-sm font-black text-[#00A39E] font-mono">94%</span>
                </div>
              </div>
            </div>

            {/* Session Logs List */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-[#0F3D3E]">บันทึกการทำกายภาพย้อนหลัง</h4>
                <span className="text-xs text-slate-500">{rehabHistory.length} รายการ</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {rehabHistory.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rec.deviceType === 'MACHINE_KIOSK' ? 'bg-[#00A39E]' : 'bg-[#008783]'
                          }`}
                        />
                        <h5 className="text-xs font-bold text-slate-900">{rec.exerciseNameTh}</h5>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(rec.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center py-2 bg-white rounded-xl text-xs border border-slate-200/60 shadow-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">จำนวน</span>
                        <span className="font-bold text-slate-900 font-mono">{rec.repsCompleted} ครั้ง</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">มุมสูงสุด</span>
                        <span className="font-bold text-[#00A39E] font-mono">{rec.maxRomDeg}°</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">คะแนนท่า</span>
                        <span className="font-bold text-[#008783] font-mono">{rec.accuracyScore}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">ระดับปวด</span>
                        <span className="font-bold text-amber-600 font-mono">{rec.painScore}/10</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>อุปกรณ์: {rec.deviceType === 'MACHINE_KIOSK' ? '🏥 ตู้กายภาพบำบัด' : '📱 โทรศัพท์มือถือ'}</span>
                      <span className="text-[#008783] font-bold">ซิงค์แล้ว ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 5: KIOSK SYNC & REMOTE COMPANION
           ========================================= */}
        {activeTab === 'kiosk_sync' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Direct QR Pass Display */}
            <div className="rounded-3xl bg-white border-2 border-[#B2EBE6] p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-xs font-bold text-[#008783] uppercase tracking-wider mb-2">
                บัตรประจำตัวเชื่อมต่อตู้กายภาพบำบัด (รพ.รามาธิบดี)
              </span>

              {/* QR Code Graphic Container */}
              <div className="p-4 bg-white rounded-2xl shadow-md my-2 border-2 border-[#B2EBE6]">
                <div className="w-48 h-48 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <QrCode className="w-40 h-40 text-white" />
                  <div className="absolute inset-0 bg-teal-500/10 pointer-events-none" />
                </div>
              </div>

              <span className="text-sm font-mono font-bold text-[#0F3D3E] mt-2">PIN: 849-210</span>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                ยื่นหน้าจอนี้ให้กล้องของตู้เครื่องทำกายภาพบำบัดสแกน เพื่อล็อกอินและโหลดโปรแกรมการรักษาอัตโนมัติ
              </p>

              {onSwitchToKiosk && (
                <button
                  onClick={onSwitchToKiosk}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-700/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  <span>เปิดโหมดเครื่องกายภาพบำบัด (Kiosk)</span>
                </button>
              )}
            </div>

            {/* Companion Remote Controller Feature */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 flex flex-col gap-3 shadow-xs">
              <h4 className="text-sm font-black text-[#0F3D3E] flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#00A39E]" />
                <span>รีโมตควบคุมตู้กายภาพผ่านมือถือ</span>
              </h4>
              <p className="text-xs text-slate-500">
                ขณะยืนทำกายภาพหน้าเครื่อง คุณสามารถกดปุ่มบนมือถือนี้เพื่อสั่งการตู้ได้โดยไม่ต้องเดินไปกดหน้าจอ
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => {
                    playChime('success');
                    if (voiceGuide) speak('ส่งคำสั่งเริ่มกายภาพไปยังตู้แล้วค่ะ');
                  }}
                  className="py-3 rounded-xl bg-[#E6F7F7] border border-[#B2EBE6] text-[#008783] font-bold text-xs flex flex-col items-center gap-1 hover:bg-teal-100 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-[#008783]" />
                  <span>เริ่มการฝึก</span>
                </button>

                <button
                  onClick={() => {
                    playChime('success');
                    if (voiceGuide) speak('พักชั่วคราว');
                  }}
                  className="py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex flex-col items-center gap-1 hover:bg-amber-100 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>รีเซ็ตเซ็ต</span>
                </button>

                <button
                  onClick={() => {
                    playChime('success');
                    if (voiceGuide) speak('เปลี่ยนท่ากายภาพถัดไป');
                  }}
                  className="py-3 rounded-xl bg-teal-50 border border-teal-200 text-[#008783] font-bold text-xs flex flex-col items-center gap-1 hover:bg-teal-100 active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>ท่าถัดไป</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================
          BOTTOM NAVIGATION BAR (MOBILE APP STYLE)
         ========================================= */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_0_rgba(0,163,158,0.08)] max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-[#00A39E] font-black scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-[10px]">หน้าหลัก</span>
        </button>

        <button
          onClick={() => setActiveTab('pt_camera')}
          className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'pt_camera' ? 'text-[#008783] font-black scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div
            className={`w-11 h-11 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-transform ${
              activeTab === 'pt_camera'
                ? 'bg-gradient-to-tr from-[#008783] to-[#00A39E] text-white ring-4 ring-white shadow-teal-700/30'
                : 'bg-white text-slate-600 border border-slate-200 shadow-md'
            }`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[10px]">กล้องฝึก AI</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'queue' ? 'text-[#00A39E] font-black scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">จองคิว</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history' ? 'text-[#00A39E] font-black scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px]">สถิติฟื้นฟู</span>
        </button>

        <button
          onClick={() => setActiveTab('kiosk_sync')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'kiosk_sync' ? 'text-[#008783] font-black scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px]">บัตรตู้</span>
        </button>
      </nav>

      {/* =========================================
          MODAL 1: QR CODE FULLSCREEN PASSPORT
         ========================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-[#B2EBE6] rounded-3xl p-6 max-w-sm w-full flex flex-col items-center text-center shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-extrabold text-[#008783] uppercase tracking-widest mt-2">
              StrongCare One-Stop Pass
            </span>
            <h3 className="text-lg font-black text-[#0F3D3E] mt-1">{patientName}</h3>
            <span className="text-xs text-slate-500 font-mono mb-4">{patientId}</span>

            {/* High Contrast QR Code */}
            <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-[#B2EBE6]">
              <div className="w-52 h-52 bg-slate-900 rounded-xl flex items-center justify-center p-2">
                <QrCode className="w-44 h-44 text-white" />
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] text-left w-full text-xs text-[#008783]">
              <p className="font-bold mb-1">💡 วิธีใช้งานที่ตู้เครื่องกายภาพ:</p>
              <p>หันหน้าจอโทรศัพท์นี้ให้กล้องตู้สแกน เครื่องจะเข้าสู่โหมดกายภาพและเปิดโปรแกรมของคุณโดยอัตโนมัติ</p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full mt-4 py-3 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-extrabold text-sm shadow-md shadow-teal-700/20 cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: POST-WORKOUT SUMMARY & PAIN RATING
         ========================================= */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#E6F7F7] text-[#008783] flex items-center justify-center mx-auto mb-2 border border-[#B2EBE6]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#0F3D3E]">บันทึกผลการทำกายภาพ</h3>
              <p className="text-xs text-slate-500">{selectedExercise.nameTh}</p>
            </div>

            {/* Stats Summary Box */}
            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">จำนวน</span>
                <span className="text-base font-black text-[#0F3D3E] font-mono">
                  {trackerRef.current.getTotalRepsDone() || 10} ครั้ง
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">มุมสูงสุด</span>
                <span className="text-base font-black text-[#00A39E] font-mono">
                  {bioState.peakAngleAchieved || selectedExercise.targetAngle}°
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">คะแนนท่า</span>
                <span className="text-base font-black text-[#008783] font-mono">
                  {bioState.accuracyScore}%
                </span>
              </div>
            </div>

            {/* Pain Scale (VAS 0-10) Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">ระดับความเจ็บปวดหลังฝึก (Pain Scale)</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    painRating <= 3 ? 'bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6]' : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00A39E]"
              />

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 ไม่ปวดเลย</span>
                <span>5 ปวดปานกลาง</span>
                <span>10 ปวดมากที่สุด</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveWorkout}
              className="w-full py-3 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-extrabold text-sm shadow-md shadow-teal-700/20 transition-all active:scale-95 cursor-pointer"
            >
              บันทึกและซิงค์ข้อมูล
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: BOOKING NEW QUEUE
         ========================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0F3D3E] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00A39E]" />
                <span>จองคิวเครื่องทำกายภาพ</span>
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">เลือกโปรแกรมกายภาพ</label>
                <select
                  value={bookingExercise}
                  onChange={(e) => setBookingExercise(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#00A39E]"
                >
                  {Object.values(PT_EXERCISES).map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">ช่วงเวลาที่ต้องการเข้ารับบริการ</label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#00A39E] font-mono"
                >
                  <option value="11:00 - 11:30">11:00 - 11:30 น.</option>
                  <option value="13:30 - 14:00">13:30 - 14:00 น.</option>
                  <option value="14:00 - 14:30">14:00 - 14:30 น.</option>
                  <option value="15:00 - 15:30">15:00 - 15:30 น.</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleBookQueue}
              className="w-full mt-2 py-3 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-extrabold text-sm shadow-md shadow-teal-700/20 cursor-pointer"
            >
              ยืนยันการจองคิว
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
