import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  User,
  Shield,
  ArrowRight,
  Play,
  Heart,
  ChevronRight,
  Stethoscope,
  Clock,
  Calendar,
  Check,
  UserCheck,
  Info,
  Maximize2,
  Volume2,
  Gamepad2,
  Activity,
  Hand,
} from 'lucide-react';
import { Patient } from '../../types/patient';
import { useHospitalStore } from '../../store/hospitalStore';
import { usePatientStore } from '../../store/patientStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { faceRegistryService } from '../../services/faceRegistryService';
import { poseService } from '../../services/poseService';
import { audioFeedback } from '../../services/audioService';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { TreatmentPlan } from '../../types/hospital';

interface KioskSixStepWorkflowProps {
  onLoginComplete: (patient: Patient) => void;
  onStartExerciseDirectly: (patient: Patient, plan?: TreatmentPlan, mode?: 'physio' | 'minigame') => void;
  onOpenHospitalPortal: () => void;
  onOpenAbout?: () => void;
  kioskStationName?: string;
}

export const KioskSixStepWorkflow: React.FC<KioskSixStepWorkflowProps> = ({
  onLoginComplete,
  onStartExerciseDirectly,
  onOpenHospitalPortal,
  onOpenAbout,
  kioskStationName = 'STRONG CARE (ตู้ Kiosk ประจำสถานี 1)',
}) => {
  // Active step: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Time & Date strings (รูปแบบไทย ว/ด/ป)
  const [thaiDateStr, setThaiDateStr] = useState<string>('');
  const [thaiTimeStr, setThaiTimeStr] = useState<string>('');

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Motion/Presence simulation for Step 1
  const [isPersonDetected, setIsPersonDetected] = useState<boolean>(false);
  const [isSlideUpAnimating, setIsSlideUpAnimating] = useState<boolean>(false);

  // Arm Pose Detection State (ยกแขนขวา = ใช่ | ยกแขนซ้าย = ไม่)
  const [detectedArmPose, setDetectedArmPose] = useState<'none' | 'right_yes' | 'left_no'>('none');
  const [armHoldProgress, setArmHoldProgress] = useState<number>(0); // 0 to 100%
  const armHoldTimerRef = useRef<any>(null);
  const detectionFrameRef = useRef<number | null>(null);
  const lastPoseDetectedRef = useRef<'none' | 'right_yes' | 'left_no'>('none');

  // Step 4: Face Scanning & Registration states
  const [scanStep, setScanStep] = useState<'front' | 'left' | 'right' | 'done'>('front');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('กรุณาจัดใบหน้าให้อยู่ในกรอบวงรี');
  const [matchedProfile, setMatchedProfile] = useState<any | null>(null);
  const [isNewRegistration, setIsNewRegistration] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('คุณสมชาย ใจดี');
  const [regHn, setRegHn] = useState<string>('P-0012');

  // Step 5: Countdown timer (5 seconds)
  const [step5Countdown, setStep5Countdown] = useState<number>(5);

  // Step 6: Selected Therapy Mode & Countdown (5 seconds)
  const [selectedTherapyType, setSelectedTherapyType] = useState<'physio' | 'minigame'>('physio');
  const [step6Countdown, setStep6Countdown] = useState<number>(5);

  // Logged-in Patient & Associated Treatment Plan
  const [activePatient, setActivePatient] = useState<Patient>({
    id: 12,
    patient_code: 'P-0012',
    name: 'นายสมชาย ใจดี',
    age: 68,
    gender: 'male',
    notes: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)',
  });
  const [activePlan, setActivePlan] = useState<TreatmentPlan | null>(null);

  const { users, treatmentPlans } = useHospitalStore();
  const { selectPatient, patients } = usePatientStore();
  const { selectExercise, exercises } = useExerciseStore();

  // 1. Clock updater (ว/ด/ป)
  useEffect(() => {
    const thaiDayNames = [
      'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
    ];
    const thaiMonthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const updateClock = () => {
      const now = new Date();
      const dName = thaiDayNames[now.getDay()];
      const dNum = now.getDate();
      const mName = thaiMonthNames[now.getMonth()];
      const bYear = now.getFullYear() + 543;

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      setThaiDateStr(`${dName}ที่ ${dNum} ${mName} พ.ศ. ${bYear}`);
      setThaiTimeStr(`${hh}:${mm}:${ss} น.`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Initialize Camera
  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('ไม่พบอุปกรณ์กล้องบนอุปกรณ์นี้ กำลังเปิดโหมดจำลองภาพเสมือน');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Kiosk Camera start warning:', err);
      setCameraError('ไม่สามารถเปิดกล้องจริงได้ (เปิดโหมดจำลองภาพ)');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    poseService.initialize().catch(() => {});
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
      }
    };
  }, []);

  // Re-attach video stream whenever videoRef re-mounts
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentStep, isCameraActive]);

  // 3. Step 1: Detect presence or trigger slide-up
  const triggerSlideUp = () => {
    if (isSlideUpAnimating) return;
    setIsSlideUpAnimating(true);
    audioFeedback.playRepSuccess();
    try {
      voiceAssistant.speak('ยินดีต้อนรับสู่ระบบ Strong Care ค่ะ ยกแขนขวาเพื่อตอบใช่ หรือยกแขนซ้ายเพื่อตอบไม่', {
        level: 'system',
      });
    } catch {}

    setTimeout(() => {
      setCurrentStep(2);
      setIsSlideUpAnimating(false);
    }, 600);
  };

  // 4. Arm Detection Logic for Steps 2 & 3:
  // "ถ้าใช่ ให้ยกแขนขวา | ถ้าไม่ ให้ยกแขนซ้าย"
  const handleConfirmYes = useCallback(() => {
    audioFeedback.playRepSuccess();
    setArmHoldProgress(0);
    setDetectedArmPose('none');
    if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
      handlePerformFaceScan();
    }
  }, [currentStep]);

  const handleConfirmNo = useCallback(() => {
    audioFeedback.playHoldTick();
    setArmHoldProgress(0);
    setDetectedArmPose('none');
    if (currentStep === 2) {
      alert('พักผ่อนให้สบายนะคะ เมื่อพร้อมสามารถมานั่งหน้ากล้องใหม่ได้ทุกเมื่อค่ะ');
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  }, [currentStep]);

  // Pose Detection Loop in Steps 2 & 3
  useEffect(() => {
    if (currentStep !== 2 && currentStep !== 3) {
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = null;
      }
      setDetectedArmPose('none');
      setArmHoldProgress(0);
      return;
    }

    let isRunning = true;
    let holdCounter = 0;
    const REQUIRED_HOLD_FRAMES = 18; // ~600ms hold to confirm

    const runPoseLoop = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && !video.paused) {
        try {
          const res = poseService.detectHolistic(video, performance.now());
          if (res && res.poseLandmarks && res.poseLandmarks.length >= 17) {
            const lm = res.poseLandmarks;
            // 11: left shoulder, 13: left elbow, 15: left wrist
            // 12: right shoulder, 14: right elbow, 16: right wrist
            const leftShoulder = lm[11];
            const leftWrist = lm[15];
            const rightShoulder = lm[12];
            const rightWrist = lm[16];

            // In user's body:
            // Right arm raised = right wrist y < right shoulder y (wrist above shoulder)
            // Left arm raised = left wrist y < left shoulder y (wrist above shoulder)
            const isRightRaised = rightWrist && rightShoulder && rightWrist.y < (rightShoulder.y - 0.05);
            const isLeftRaised = leftWrist && leftShoulder && leftWrist.y < (leftShoulder.y - 0.05);

            if (isRightRaised && !isLeftRaised) {
              // Right arm = YES
              if (lastPoseDetectedRef.current === 'right_yes') {
                holdCounter++;
              } else {
                holdCounter = 1;
                lastPoseDetectedRef.current = 'right_yes';
                setDetectedArmPose('right_yes');
                audioFeedback.playHoldTick();
              }

              const prog = Math.min(100, Math.round((holdCounter / REQUIRED_HOLD_FRAMES) * 100));
              setArmHoldProgress(prog);

              if (holdCounter >= REQUIRED_HOLD_FRAMES) {
                holdCounter = 0;
                handleConfirmYes();
                return;
              }
            } else if (isLeftRaised && !isRightRaised) {
              // Left arm = NO
              if (lastPoseDetectedRef.current === 'left_no') {
                holdCounter++;
              } else {
                holdCounter = 1;
                lastPoseDetectedRef.current = 'left_no';
                setDetectedArmPose('left_no');
                audioFeedback.playHoldTick();
              }

              const prog = Math.min(100, Math.round((holdCounter / REQUIRED_HOLD_FRAMES) * 100));
              setArmHoldProgress(prog);

              if (holdCounter >= REQUIRED_HOLD_FRAMES) {
                holdCounter = 0;
                handleConfirmNo();
                return;
              }
            } else {
              // Neither or both
              holdCounter = 0;
              lastPoseDetectedRef.current = 'none';
              setDetectedArmPose('none');
              setArmHoldProgress(0);
            }
          }
        } catch (e) {
          // ignore frame errors
        }
      }

      detectionFrameRef.current = requestAnimationFrame(runPoseLoop);
    };

    detectionFrameRef.current = requestAnimationFrame(runPoseLoop);

    return () => {
      isRunning = false;
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = null;
      }
    };
  }, [currentStep, handleConfirmYes, handleConfirmNo]);

  // 5. Step 5 Countdown (ค้างไว้ 5 วินาที)
  useEffect(() => {
    let timer: any;
    if (currentStep === 5) {
      setStep5Countdown(5);
      timer = setInterval(() => {
        setStep5Countdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCurrentStep(6);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep]);

  // 6. Step 6 Countdown (ค้างไว้ 5 วินาที)
  useEffect(() => {
    let timer: any;
    if (currentStep === 6) {
      setStep6Countdown(5);
      timer = setInterval(() => {
        setStep6Countdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleProceedToExercise(selectedTherapyType);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, selectedTherapyType, activePatient, activePlan]);

  // Find treatment plan when activePatient changes
  useEffect(() => {
    const plan = treatmentPlans.find(
      (p) =>
        p.patientCode?.toLowerCase() === activePatient.patient_code.toLowerCase() ||
        p.patientName?.includes(activePatient.name) ||
        p.patientId === activePatient.id
    );
    if (plan) {
      setActivePlan(plan);
    } else {
      setActivePlan({
        id: 1,
        patientId: activePatient.id,
        patientName: activePatient.name,
        patientCode: activePatient.patient_code,
        therapistId: 1,
        therapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
        diagnosis: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)',
        targetJoint: 'ข้อไหล่และสะบัก (Shoulder & Scapula)',
        assignedExercises: [
          { exerciseSlug: 'shoulder_raise', exerciseName: 'กางแขนยกด้านข้าง', sets: 3, reps: 10, holdSeconds: 3, difficulty: 'beginner' },
          { exerciseSlug: 'stretch_shoulder_cross', exerciseName: 'ยืดไหล่ข้ามอก', sets: 3, reps: 5, holdSeconds: 20, difficulty: 'beginner' },
          { exerciseSlug: 'stretch_chest_open', exerciseName: 'ยืดอกเปิดไหล่', sets: 2, reps: 5, holdSeconds: 15, difficulty: 'beginner' },
        ],
        clinicalNotes: 'เน้นเพิ่มองศาการยกแขนข้างซ้าย หลีกเลี่ยงการยกกระตุกเร็ว สังเกตอาการปวดไม่ให้เกินระดับ 3/10',
        createdAt: '2026-10-01',
        status: 'active',
        scheduleDays: ['จันทร์', 'พุธ', 'ศุกร์'],
        timeSlot: '09:30 - 10:30',
        roomStation: 'ตู้ Kiosk 1',
      });
    }
  }, [activePatient, treatmentPlans]);

  // Proceed to exercise (กายภาพบำบัด หรือ กายภาพมินิเกม)
  const handleProceedToExercise = (mode: 'physio' | 'minigame' = selectedTherapyType) => {
    audioFeedback.playRepSuccess();
    selectPatient(activePatient);
    onStartExerciseDirectly(activePatient, activePlan || undefined, mode);
  };

  // Step 4: Execute Scan & Match Check
  const handlePerformFaceScan = () => {
    setIsScanning(true);
    setScanStatusMessage('ระบบกำลังวิเคราะห์ใบหน้าและตรวจสอบฐานข้อมูล...');
    audioFeedback.playHoldTick();

    setTimeout(() => {
      const profiles = faceRegistryService.getAllProfiles();
      let targetPatient: Patient = {
        id: 12,
        patient_code: 'P-0012',
        name: 'นายสมชาย ใจดี',
        age: 68,
        gender: 'male',
        notes: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)',
      };

      if (profiles && profiles.length > 0) {
        const found = profiles[0];
        targetPatient = {
          id: Number(found.patientId) || 12,
          patient_code: found.patientCode || 'P-0012',
          name: found.name || 'นายสมชาย ใจดี',
          age: found.age || 68,
          gender: (found.gender as any) || 'male',
          notes: 'ข้อมูลใบหน้าที่ลงทะเบียนแล้ว',
        };
      }

      setActivePatient(targetPatient);
      setMatchedProfile(targetPatient);
      setIsScanning(false);
      setScanStep('done');
      setScanStatusMessage(`ตรวจสอบเรียบร้อย พบข้อมูล: ${targetPatient.name} (${targetPatient.patient_code})`);

      audioFeedback.playRepSuccess();
      try {
        voiceAssistant.speak(`ยินดีต้อนรับ ${targetPatient.name} เข้าสู่ระบบสำเร็จ`, {
          level: 'system',
        });
      } catch {}

      setTimeout(() => {
        setCurrentStep(5);
      }, 1000);
    }, 1500);
  };

  // Step 4: Register New Face
  const handleSaveNewFaceRegistration = () => {
    if (!regName.trim()) return;
    const newProfile = {
      patientId: Date.now(),
      patientCode: regHn || `P-${Math.floor(1000 + Math.random() * 9000)}`,
      name: regName,
      age: 65,
      gender: 'male',
      embeddings: [new Array(128).fill(0.08)],
      enrolledAt: new Date().toISOString(),
    };

    faceRegistryService.saveProfile(newProfile);

    const createdPatient: Patient = {
      id: newProfile.patientId,
      patient_code: newProfile.patientCode,
      name: newProfile.name,
      age: 65,
      gender: 'male',
      notes: 'ลงทะเบียนใบหน้าใหม่ ณ ตู้ Kiosk',
    };

    setActivePatient(createdPatient);
    setIsNewRegistration(false);
    audioFeedback.playRepSuccess();
    setCurrentStep(5);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[92vh] py-3 sm:py-6 px-3 relative z-10 select-none">
      
      {/* ======================================================== */}
      {/* ส่วนหัวทุกภาพ: ชื่อเครื่อง & ว/ด/ป (ตามภาพวาด) */}
      {/* ======================================================== */}
      <div className="flex flex-col items-center justify-center text-center mb-3 sm:mb-4">
        {/* ชื่อเครื่อง (ขีดเส้นใต้ หนา ชัดเจน) */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0B2B2B] tracking-wide underline underline-offset-8 decoration-2 decoration-[#0B2B2B]">
          {kioskStationName}
        </h1>
        {/* ว/ด/ป วันเดือนปีและเวลาแบบไทย */}
        <p className="text-xs sm:text-sm md:text-base font-bold text-[#0B2B2B]/85 mt-2.5 flex items-center gap-1.5 justify-center">
          <Calendar className="w-4 h-4 text-[#1E8A4C]" />
          <span>{thaiDateStr || 'กำลังโหลดวันที่...'}</span>
          <span className="text-gray-400 font-normal">|</span>
          <Clock className="w-4 h-4 text-[#1E8A4C]" />
          <span className="font-mono font-bold text-[#1E8A4C]">{thaiTimeStr || '00:00:00 น.'}</span>
        </p>
      </div>

      {/* ======================================================== */}
      {/* กรอบ Card หลักสีขาว ขอบมนตามภาพวาด (The Main Kiosk White Card) */}
      {/* ======================================================== */}
      <div className="w-full max-w-[440px] sm:max-w-[480px] bg-white rounded-[36px] sm:rounded-[44px] border-2 sm:border-[2.5px] border-black/85 shadow-2xl relative overflow-hidden flex flex-col items-center p-5 sm:p-7 min-h-[580px] sm:min-h-[640px] justify-between transition-all duration-500">
        
        {/* ---------------------------------------------------- */}
        {/* ภาพที่ 1: หน้าพักหน้าจอ (Screensaver)               */}
        {/* ---------------------------------------------------- */}
        {currentStep === 1 && (
          <div
            className={`w-full flex-1 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out relative ${
              isSlideUpAnimating ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
            }`}
          >
            {/* โลโก้ทรงกลม (วิวธรรมชาติ ท้องฟ้า ก้อนเมฆ และภูเขาเขียว) ตาม Mockup ภาพที่ 1 */}
            <div className="relative group cursor-pointer" onClick={triggerSlideUp}>
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-2 border-emerald-300 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#BEE5F9] via-[#D5F0FD] to-[#86C232] relative transform group-hover:scale-105 transition duration-300">
                <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                  <rect width="200" height="200" fill="url(#skyGradient)" />
                  <defs>
                    <linearGradient id="skyGradient" x1="100" y1="0" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#A8E0F9" />
                      <stop offset="0.6" stopColor="#E2F5FE" />
                      <stop offset="1" stopColor="#EDF9FE" />
                    </linearGradient>
                    <linearGradient id="hillGreen1" x1="0" y1="120" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#9BCB3C" />
                      <stop offset="1" stopColor="#6C9A20" />
                    </linearGradient>
                    <linearGradient id="hillGreen2" x1="0" y1="130" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#7EAD29" />
                      <stop offset="1" stopColor="#557B18" />
                    </linearGradient>
                  </defs>

                  <g fill="#FFFFFF" opacity="0.95">
                    <ellipse cx="100" cy="80" rx="32" ry="18" />
                    <circle cx="85" cy="74" r="16" />
                    <circle cx="115" cy="74" r="18" />
                    <circle cx="100" cy="65" r="15" />
                  </g>

                  <path
                    d="M-20 160 Q 60 110, 150 145 T 220 160 L 220 220 L -20 220 Z"
                    fill="url(#hillGreen1)"
                  />
                  <path
                    d="M-10 180 Q 90 135, 210 170 L 210 220 L -10 220 Z"
                    fill="url(#hillGreen2)"
                  />
                </svg>

                <div className="absolute inset-0 rounded-full border-4 border-white/40 pointer-events-none animate-pulse" />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-300 text-[#1E8A4C] text-sm font-bold shadow-sm animate-bounce">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>หน้าพักหน้าจอ (ระบบพร้อมใช้งาน)</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-2.5">
                เมื่อมีคนมานั่งหน้ากล้อง หรือแตะหน้าจอ ระบบจะเลื่อนขึ้นอัตโนมัติ
              </p>
            </div>

            <div className="mt-6 w-full max-w-xs">
              <button
                onClick={triggerSlideUp}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#6FD67F] to-[#1E8A4C] text-white font-extrabold text-base shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
                id="btnSitInFrontOfCamera"
              >
                <span>นั่งหน้ากล้อง / แตะเพื่อเริ่มต้น</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ภาพที่ 2: ถามความพร้อมกายภาพ (คุณพร้อมแล้วใช่หรือไม่) */}
        {/* ---------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn">
            {/* กล่องข้อความฟ้าด้านบนตาม Wireframe 2 */}
            <div className="w-full bg-[#E3F5FC] border border-[#BDE3F5] rounded-3xl py-3 px-5 text-center shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-[#0B2B2B]">
                คุณพร้อมแล้วใช่หรือไม่
              </h2>
              {/* คำแนะนำระบบ Detection: ยกแขนขวา = ใช่ | ยกแขนซ้าย = ไม่ */}
              <div className="mt-1 flex items-center justify-center gap-3 text-xs font-extrabold">
                <span className="text-[#1E8A4C] bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                  🙋‍♂️ ยกแขนขวา = <b>ใช่</b>
                </span>
                <span className="text-[#E03131] bg-rose-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                  🙋‍♀️ ยกแขนซ้าย = <b>ไม่</b>
                </span>
              </div>
            </div>

            {/* ปุ่ม 2 ข้าง: ซ้าย = ใช่ (เขียว) | ขวา = ไม่ (แดง) ตาม Wireframe 2 */}
            <div className="w-full flex items-center justify-between px-2 sm:px-4 my-3">
              {/* ปุ่ม ใช่ (ยกแขนขวา) */}
              <div className="relative">
                <button
                  onClick={handleConfirmYes}
                  className={`w-28 h-20 sm:w-32 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center shadow-md active:scale-95 transition cursor-pointer relative overflow-hidden ${
                    detectedArmPose === 'right_yes'
                      ? 'bg-emerald-200 border-emerald-600 text-emerald-950 scale-105 shadow-emerald-400/50 shadow-lg'
                      : 'bg-[#E8F8EE] border-[#A8E6BA] text-[#1E8A4C] hover:bg-[#d5f5df]'
                  }`}
                  id="btnReadyYes"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold">ใช่</span>
                  <span className="text-[10px] font-bold text-emerald-800">ยกแขนขวา 🙋‍♂️</span>

                  {/* Progress bar inside button when holding arm */}
                  {detectedArmPose === 'right_yes' && (
                    <div
                      className="absolute bottom-0 left-0 h-2 bg-emerald-500 transition-all duration-75"
                      style={{ width: `${armHoldProgress}%` }}
                    />
                  )}
                </button>
              </div>

              {/* ปุ่ม ไม่ (ยกแขนซ้าย) */}
              <div className="relative">
                <button
                  onClick={handleConfirmNo}
                  className={`w-28 h-20 sm:w-32 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center shadow-md active:scale-95 transition cursor-pointer relative overflow-hidden ${
                    detectedArmPose === 'left_no'
                      ? 'bg-rose-200 border-rose-600 text-rose-950 scale-105 shadow-rose-400/50 shadow-lg'
                      : 'bg-[#FEECEC] border-[#F9B7B7] text-[#E03131] hover:bg-[#fedcdc]'
                  }`}
                  id="btnReadyNo"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold">ไม่</span>
                  <span className="text-[10px] font-bold text-rose-800">ยกแขนซ้าย 🙋‍♀️</span>

                  {/* Progress bar inside button when holding arm */}
                  {detectedArmPose === 'left_no' && (
                    <div
                      className="absolute bottom-0 left-0 h-2 bg-rose-500 transition-all duration-75"
                      style={{ width: `${armHoldProgress}%` }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* หน้าเราที่กล้องจับอยู่ (Live Camera Feed Silhouette) ตรงกลาง-ล่าง */}
            <div className="w-full flex-1 max-h-[300px] sm:max-h-[340px] rounded-[32px] overflow-hidden border-2 border-slate-300 relative bg-slate-100 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Silhouette Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-2 border-emerald-400/60 bg-emerald-500/10 backdrop-blur-[1px] animate-pulse flex items-center justify-center">
                  <User className="w-20 h-20 text-emerald-700/40" />
                </div>
              </div>

              {/* Live Detection Status Banner */}
              {detectedArmPose !== 'none' && (
                <div className="absolute top-2 inset-x-3 bg-black/80 backdrop-blur-md text-white text-xs py-1.5 px-3 rounded-xl flex items-center justify-between border border-emerald-400 animate-fadeIn">
                  <span className="font-bold flex items-center gap-1.5">
                    {detectedArmPose === 'right_yes' ? (
                      <span className="text-emerald-400">🟢 ตรวจพบ: ยกแขนขวา (ใช่)</span>
                    ) : (
                      <span className="text-rose-400">🔴 ตรวจพบ: ยกแขนซ้าย (ไม่)</span>
                    )}
                  </span>
                  <span className="font-mono text-yellow-300 font-bold">{armHoldProgress}%</span>
                </div>
              )}

              {/* Hand Touch Prompt Guide */}
              <div className="absolute bottom-2 inset-x-2 bg-black/75 backdrop-blur-md rounded-2xl py-1.5 px-3 text-center text-white text-[11px] font-medium">
                ยกแขน <span className="text-emerald-300 font-bold">ขวา = ใช่</span> | ยกแขน <span className="text-rose-300 font-bold">ซ้าย = ไม่</span> (หรือเอามือแตะที่จอ)
              </div>
            </div>

            {/* Quick Test Simulation Row (for testing without camera) */}
            <div className="w-full flex items-center justify-center gap-2 mt-2">
              <button
                onClick={handleConfirmYes}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
              >
                🙋‍♂️ จำลองยกแขนขวา (ใช่)
              </button>
              <button
                onClick={handleConfirmNo}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200"
              >
                🙋‍♀️ จำลองยกแขนซ้าย (ไม่)
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ภาพที่ 3: ถามความพร้อมเข้าสู่ระบบ                  */}
        {/* ---------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn">
            {/* กล่องข้อความฟ้าด้านบนตาม Wireframe 3 */}
            <div className="w-full bg-[#E3F5FC] border border-[#BDE3F5] rounded-3xl py-3 px-5 text-center shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-[#0B2B2B]">
                คุณพร้อมเข้าสู่ระบบใช่หรือไม่
              </h2>
              {/* คำแนะนำระบบ Detection: ยกแขนขวา = ใช่ | ยกแขนซ้าย = ไม่ */}
              <div className="mt-1 flex items-center justify-center gap-3 text-xs font-extrabold">
                <span className="text-[#1E8A4C] bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                  🙋‍♂️ ยกแขนขวา = <b>ใช่</b>
                </span>
                <span className="text-[#E03131] bg-rose-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                  🙋‍♀️ ยกแขนซ้าย = <b>ไม่</b>
                </span>
              </div>
            </div>

            {/* ปุ่ม 2 ข้าง: ใช่ (เขียว) | ไม่ (แดง) ตาม Wireframe 3 */}
            <div className="w-full flex items-center justify-between px-2 sm:px-4 my-3">
              {/* ปุ่ม ใช่ (ยกแขนขวา) */}
              <div className="relative">
                <button
                  onClick={handleConfirmYes}
                  className={`w-28 h-20 sm:w-32 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center shadow-md active:scale-95 transition cursor-pointer relative overflow-hidden ${
                    detectedArmPose === 'right_yes'
                      ? 'bg-emerald-200 border-emerald-600 text-emerald-950 scale-105 shadow-emerald-400/50 shadow-lg'
                      : 'bg-[#E8F8EE] border-[#A8E6BA] text-[#1E8A4C] hover:bg-[#d5f5df]'
                  }`}
                  id="btnLoginYes"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold">ใช่</span>
                  <span className="text-[10px] font-bold text-emerald-800">ยกแขนขวา 🙋‍♂️</span>

                  {detectedArmPose === 'right_yes' && (
                    <div
                      className="absolute bottom-0 left-0 h-2 bg-emerald-500 transition-all duration-75"
                      style={{ width: `${armHoldProgress}%` }}
                    />
                  )}
                </button>
              </div>

              {/* ปุ่ม ไม่ (ยกแขนซ้าย) */}
              <div className="relative">
                <button
                  onClick={handleConfirmNo}
                  className={`w-28 h-20 sm:w-32 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center shadow-md active:scale-95 transition cursor-pointer relative overflow-hidden ${
                    detectedArmPose === 'left_no'
                      ? 'bg-rose-200 border-rose-600 text-rose-950 scale-105 shadow-rose-400/50 shadow-lg'
                      : 'bg-[#FEECEC] border-[#F9B7B7] text-[#E03131] hover:bg-[#fedcdc]'
                  }`}
                  id="btnLoginNo"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold">ไม่</span>
                  <span className="text-[10px] font-bold text-rose-800">ยกแขนซ้าย 🙋‍♀️</span>

                  {detectedArmPose === 'left_no' && (
                    <div
                      className="absolute bottom-0 left-0 h-2 bg-rose-500 transition-all duration-75"
                      style={{ width: `${armHoldProgress}%` }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* หน้าเราที่กล้องจับอยู่ ตรงกลาง-ล่าง */}
            <div className="w-full flex-1 max-h-[300px] sm:max-h-[340px] rounded-[32px] overflow-hidden border-2 border-slate-300 relative bg-slate-100 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Live Detection Status Banner */}
              {detectedArmPose !== 'none' && (
                <div className="absolute top-2 inset-x-3 bg-black/80 backdrop-blur-md text-white text-xs py-1.5 px-3 rounded-xl flex items-center justify-between border border-emerald-400 animate-fadeIn">
                  <span className="font-bold flex items-center gap-1.5">
                    {detectedArmPose === 'right_yes' ? (
                      <span className="text-emerald-400">🟢 ตรวจพบ: ยกแขนขวา (ใช่)</span>
                    ) : (
                      <span className="text-rose-400">🔴 ตรวจพบ: ยกแขนซ้าย (ไม่)</span>
                    )}
                  </span>
                  <span className="font-mono text-yellow-300 font-bold">{armHoldProgress}%</span>
                </div>
              )}

              {/* Hand Touch Prompt Guide */}
              <div className="absolute bottom-2 inset-x-2 bg-black/75 backdrop-blur-md rounded-2xl py-1.5 px-3 text-center text-white text-[11px] font-medium">
                ยกแขน <span className="text-emerald-300 font-bold">ขวา = สแกนหน้า</span> | ยกแขน <span className="text-rose-300 font-bold">ซ้าย = ย้อนกลับ</span>
              </div>
            </div>

            {/* Quick Test Simulation Row */}
            <div className="w-full flex items-center justify-center gap-2 mt-2">
              <button
                onClick={handleConfirmYes}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
              >
                🙋‍♂️ จำลองยกแขนขวา (ใช่)
              </button>
              <button
                onClick={handleConfirmNo}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200"
              >
                🙋‍♀️ จำลองยกแขนซ้าย (ไม่)
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ภาพที่ 4: หน้าต่างสแกนใบหน้า (ให้ทำตามที่ระบบบอก)   */}
        {/* ---------------------------------------------------- */}
        {currentStep === 4 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn">
            {/* กล่องฟ้าด้านบนตาม Wireframe 4: เอาบอกให้คนไข้ขยับตาม */}
            <div className="w-full bg-[#E3F5FC] border border-[#BDE3F5] rounded-3xl py-2.5 px-4 text-center shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-[#0B2B2B]">
                เอาบอกให้คนไข้ขยับตาม
              </h2>
              <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                {scanStatusMessage}
              </p>
            </div>

            {/* กรอบวงรีเส้นประไข่ (Dashed Oval Face Guide) ตรงกลางตาม Wireframe 4 */}
            <div className="w-full flex-1 max-h-[320px] sm:max-h-[350px] relative flex items-center justify-center my-2">
              <div className="w-60 h-72 sm:w-64 sm:h-80 border-[3px] border-dashed border-gray-800 rounded-[50%] relative overflow-hidden flex items-center justify-center bg-black/5 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                <div
                  className={`absolute inset-0 rounded-[50%] pointer-events-none transition-all duration-300 ${
                    isScanning ? 'border-4 border-emerald-400 animate-pulse' : 'border-2 border-transparent'
                  }`}
                />

                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-lg shadow-emerald-400/50" />
                )}
              </div>
            </div>

            {/* แถบ 4 ปุ่มด้านล่างตาม Wireframe 4: หน้าตรง / หันซ้าย / หันขวา / เสร็จสิ้น */}
            <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-2 mt-2">
              <button
                onClick={() => {
                  setScanStep('front');
                  setScanStatusMessage('1. จัดใบหน้ามองตรงไปที่กล้อง');
                }}
                className={`py-2 px-1 rounded-2xl text-xs sm:text-sm font-extrabold border-2 transition ${
                  scanStep === 'front'
                    ? 'bg-[#E8F8EE] border-[#1E8A4C] text-[#1E8A4C] shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                หน้าตรง
              </button>

              <button
                onClick={() => {
                  setScanStep('left');
                  setScanStatusMessage('2. ค่อยๆ เอียงหรือหันศีรษะไปทางซ้าย');
                }}
                className={`py-2 px-1 rounded-2xl text-xs sm:text-sm font-extrabold border-2 transition ${
                  scanStep === 'left'
                    ? 'bg-[#E8F8EE] border-[#1E8A4C] text-[#1E8A4C] shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                หันซ้าย
              </button>

              <button
                onClick={() => {
                  setScanStep('right');
                  setScanStatusMessage('3. ค่อยๆ เอียงหรือหันศีรษะไปทางขวา');
                }}
                className={`py-2 px-1 rounded-2xl text-xs sm:text-sm font-extrabold border-2 transition ${
                  scanStep === 'right'
                    ? 'bg-[#E8F8EE] border-[#1E8A4C] text-[#1E8A4C] shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                หันขวา
              </button>

              <button
                onClick={() => {
                  setScanStep('done');
                  handlePerformFaceScan();
                }}
                className="py-2 px-1 rounded-2xl text-xs sm:text-sm font-extrabold border-2 bg-emerald-600 border-emerald-700 text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
              >
                เสร็จสิ้น
              </button>
            </div>

            {/* ตัวเลือกลงทะเบียนใหม่ */}
            <div className="w-full flex items-center justify-between text-xs text-slate-500 font-medium mt-3 px-1">
              <button
                onClick={() => setIsNewRegistration(!isNewRegistration)}
                className="text-[#1E8A4C] font-bold hover:underline"
              >
                {isNewRegistration ? '← ซ่อนฟอร์มลงทะเบียน' : 'ยังไม่มีบัญชี? กดลงทะเบียนใบหน้าใหม่'}
              </button>
              <button
                onClick={handlePerformFaceScan}
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>สแกนซ้ำ</span>
              </button>
            </div>

            {isNewRegistration && (
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mt-2 text-left animate-fadeIn">
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  ลงทะเบียนใบหน้าคนไข้ใหม่ (ผูกกับ Kiosk)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white"
                  />
                  <input
                    type="text"
                    value={regHn}
                    onChange={(e) => setRegHn(e.target.value)}
                    placeholder="รหัส HN (เช่น P-0012)"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white"
                  />
                </div>
                <button
                  onClick={handleSaveNewFaceRegistration}
                  className="w-full mt-2 py-1.5 bg-[#1E8A4C] text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                >
                  บันทึกข้อมูลใบหน้าและเข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ภาพที่ 5: หน้าต่างล็อคอินเรียบร้อย (ค้างไว้ 5 วินาที) */}
        {/* ---------------------------------------------------- */}
        {currentStep === 5 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-fadeIn text-center py-6">
            <div className="w-full max-w-[320px] bg-[#F8F9FA] border border-gray-200 rounded-3xl py-8 px-6 text-center shadow-lg flex flex-col items-center transform hover:scale-105 transition duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-400 text-[#1E8A4C] flex items-center justify-center mb-4 shadow-sm animate-bounce">
                <Check className="w-12 h-12 stroke-[3]" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2B2B]">
                คุณล็อกอินสำเร็จ
              </h2>

              <div className="mt-4 p-3 rounded-2xl bg-white border border-slate-200 w-full shadow-inner">
                <p className="text-base font-bold text-[#1E8A4C]">
                  {activePatient.name}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  รหัสคนไข้ HN: {activePatient.patient_code} | อายุ {activePatient.age} ปี
                </p>
                <div className="mt-2 text-xs font-semibold text-slate-700 bg-emerald-50 py-1 px-2 rounded-lg">
                  การวินิจฉัย: {activePatient.notes || 'ข้อไหล่ติดระยะฟื้นฟู'}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-300 text-[#1E8A4C] text-sm font-bold shadow-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span>กำลังนำท่านสู่รายการที่หมอเซ็ตไว้ในอีก: <b className="text-lg font-mono text-emerald-800">{step5Countdown}</b> วินาที</span>
              </div>

              <button
                onClick={() => setCurrentStep(6)}
                className="mt-3 text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>กดเพื่อไปต่อทันที</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ภาพที่ 6: หน้ารายการกายภาพวันนี้ ตามแบบร่างใหม่ล่าสุด */}
        {/* ---------------------------------------------------- */}
        {currentStep === 6 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn text-left py-1">
            
            {/* กล่องหัวข้อด้านบน: "รายการกายภาพวันนี้" ตาม Wireframe 6 */}
            <div className="w-full bg-gradient-to-b from-[#EAEAEA] to-[#D5D5D5] border-2 border-[#BEBEBE] rounded-2xl py-3 px-5 text-center shadow-md mb-4">
              <h2 className="text-lg sm:text-xl font-black text-[#0B2B2B] tracking-wide">
                รายการกายภาพวันนี้
              </h2>
            </div>

            {/* ส่วนรายการ 2 แถวตาม Wireframe 6: [1] กายภาพบำบัด [ ] | [1] กายภาพมินิเกม [ ] */}
            <div className="w-full space-y-3 px-1 mb-4">
              
              {/* แถวที่ 1: [ 1 ] [ กายภาพบำบัด ] [ ✓ ] */}
              <div
                onClick={() => setSelectedTherapyType('physio')}
                className={`w-full flex items-center gap-2 sm:gap-3 cursor-pointer group transition ${
                  selectedTherapyType === 'physio' ? 'scale-[1.02]' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* กล่องซ้าย: [ 1 ] */}
                <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-gradient-to-b from-[#EFEFEF] to-[#D5D5D5] border-2 border-slate-400 flex items-center justify-center text-xl sm:text-2xl font-black text-[#0B2B2B] shadow-md flex-shrink-0">
                  1
                </div>

                {/* กล่องกลาง: [ กายภาพบำบัด ] */}
                <button
                  onClick={() => handleProceedToExercise('physio')}
                  className={`flex-1 h-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center px-4 font-black text-lg sm:text-xl shadow-md transition ${
                    selectedTherapyType === 'physio'
                      ? 'bg-gradient-to-b from-[#E8F8EE] via-[#D2F5DC] to-[#B6EFCE] border-[#1E8A4C] text-[#1E8A4C] shadow-emerald-400/30'
                      : 'bg-gradient-to-b from-[#EFEFEF] to-[#D8D8D8] border-slate-400 text-[#0B2B2B] hover:bg-slate-200'
                  }`}
                >
                  กายภาพบำบัด
                </button>

                {/* กล่องขวา: ช่อง Checkbox [ ✓ ] */}
                <div
                  className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center shadow-md flex-shrink-0 transition ${
                    selectedTherapyType === 'physio'
                      ? 'bg-[#1E8A4C] border-[#1E8A4C] text-white shadow-emerald-500/30'
                      : 'bg-white border-slate-400 text-slate-300'
                  }`}
                >
                  <Check className={`w-8 h-8 stroke-[3.5] ${selectedTherapyType === 'physio' ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              </div>

              {/* แถวที่ 2: [ 1 ] [ กายภาพมินิเกม ] [ ] */}
              <div
                onClick={() => setSelectedTherapyType('minigame')}
                className={`w-full flex items-center gap-2 sm:gap-3 cursor-pointer group transition ${
                  selectedTherapyType === 'minigame' ? 'scale-[1.02]' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* กล่องซ้าย: [ 1 ] ตามภาพวาดเป๊ะๆ */}
                <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-gradient-to-b from-[#EFEFEF] to-[#D5D5D5] border-2 border-slate-400 flex items-center justify-center text-xl sm:text-2xl font-black text-[#0B2B2B] shadow-md flex-shrink-0">
                  1
                </div>

                {/* กล่องกลาง: [ กายภาพมินิเกม ] */}
                <button
                  onClick={() => handleProceedToExercise('minigame')}
                  className={`flex-1 h-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center px-4 font-black text-lg sm:text-xl shadow-md transition ${
                    selectedTherapyType === 'minigame'
                      ? 'bg-gradient-to-b from-[#E8F8EE] via-[#D2F5DC] to-[#B6EFCE] border-[#1E8A4C] text-[#1E8A4C] shadow-emerald-400/30'
                      : 'bg-gradient-to-b from-[#EFEFEF] to-[#D8D8D8] border-slate-400 text-[#0B2B2B] hover:bg-slate-200'
                  }`}
                >
                  กายภาพมินิเกม
                </button>

                {/* กล่องขวา: ช่อง Checkbox [   ] */}
                <div
                  className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center shadow-md flex-shrink-0 transition ${
                    selectedTherapyType === 'minigame'
                      ? 'bg-[#1E8A4C] border-[#1E8A4C] text-white shadow-emerald-500/30'
                      : 'bg-white border-slate-400 text-slate-300'
                  }`}
                >
                  <Check className={`w-8 h-8 stroke-[3.5] ${selectedTherapyType === 'minigame' ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              </div>

            </div>

            {/* กล่องล่างสีเขียว: ข้อมูลหมอกายภาพ ตาม Wireframe 6 */}
            <div className="w-full bg-[#C8F5D0] border-2 border-black/85 rounded-3xl p-3 sm:p-4 shadow-md flex items-center gap-3 sm:gap-4 my-2">
              {/* การ์ดสีขาวรูป Avatar หมอด้านซ้าย */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center flex-shrink-0 p-2">
                {/* Silhouette Icon matching Wireframe 6 */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                  <circle cx="50" cy="34" r="22" />
                  <path d="M12 90 C12 66, 28 56, 50 56 C72 56, 88 66, 88 90 Z" />
                </svg>
              </div>

              {/* ข้อความขวา: ชื่อ - นามสกุล (ขีดเส้นใต้) และ ข้อมูลต่างๆของหมอ */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-base sm:text-lg font-black text-[#0B2B2B] underline underline-offset-4 decoration-2 decoration-[#0B2B2B] leading-tight">
                  <u>{activePlan?.therapistName || 'กภ. ธนากร วงศ์สวัสดิ์'}</u>
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#14532D] mt-1">
                  ข้อมูลต่างๆของหมอ
                </p>
                <div className="mt-1 text-[11px] sm:text-xs text-slate-800 leading-snug">
                  <span>วุฒิบัตร ภก.12458 • เวชศาสตร์ฟื้นฟู</span>
                  <p className="text-[10px] text-slate-700 mt-0.5 line-clamp-2">
                    {activePlan?.clinicalNotes || 'เน้นเพิ่มองศาการยกแขนอย่างนุ่มนวล หลีกเลี่ยงการยกกระตุก'}
                  </p>
                </div>
              </div>
            </div>

            {/* แถบล่างสุด: นับถอยหลัง 5 วินาที & ปุ่มเริ่มทันที */}
            <div className="w-full mt-2 flex flex-col items-center">
              <div className="text-xs text-slate-600 font-semibold mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>เริ่ม{selectedTherapyType === 'physio' ? 'กายภาพบำบัด' : 'กายภาพมินิเกม'}อัตโนมัติในอีก <b className="font-mono text-emerald-800 text-sm">{step6Countdown}</b> วินาที</span>
              </div>

              <button
                onClick={() => handleProceedToExercise(selectedTherapyType)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#6FD67F] via-[#22c55e] to-[#1E8A4C] text-white font-extrabold text-base shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                id="btnStartWorkoutNow"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>🚀 เริ่มต้นโปรแกรม ({selectedTherapyType === 'physio' ? 'กายภาพบำบัด' : 'กายภาพมินิเกม'})</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* แถบสลับดูแต่ละภาพ (Step Switcher 1-6 สำหรับทดสอบและสาธิต) */}
      {/* ======================================================== */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-md w-full">
        {[
          { step: 1, title: 'ภาพ 1: พักหน้าจอ' },
          { step: 2, title: 'ภาพ 2: พร้อมกายภาพ' },
          { step: 3, title: 'ภาพ 3: พร้อมเข้าสู่ระบบ' },
          { step: 4, title: 'ภาพ 4: สแกนใบหน้า' },
          { step: 5, title: 'ภาพ 5: ล็อกอินสำเร็จ' },
          { step: 6, title: 'ภาพ 6: รายการหมอเซ็ต' },
        ].map((item) => (
          <button
            key={item.step}
            onClick={() => setCurrentStep(item.step)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition shadow-sm ${
              currentStep === item.step
                ? 'bg-[#1E8A4C] text-white border border-emerald-600 scale-105'
                : 'bg-white/90 text-slate-700 hover:bg-emerald-50 border border-slate-200'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* ปุ่มทางลัดมุมล่าง: เข้าสู่ระบบบุคลากร และเกี่ยวกับระบบ */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 z-30">
        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            className="bg-white/95 hover:bg-emerald-50 border border-emerald-300 text-[#1E8A4C] font-bold text-xs px-3.5 py-2 rounded-full shadow-md flex items-center gap-1.5 transition active:scale-95"
            title="เกี่ยวกับระบบ"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เกี่ยวกับระบบ</span>
          </button>
        )}

        <button
          onClick={onOpenHospitalPortal}
          className="bg-white/95 hover:bg-emerald-50 border-2 border-[#1E8A4C] text-[#1E8A4C] font-bold text-xs px-3.5 py-2 rounded-full shadow-md flex items-center gap-1.5 transition active:scale-95"
          id="btnKioskHospitalPortal"
          title="เข้าสู่ระบบบุคลากร / รพ."
        >
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>ระบบบุคลากร / รพ.</span>
        </button>
      </div>

    </div>
  );
};
