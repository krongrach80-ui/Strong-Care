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
  Trophy,
  Zap,
  Star,
  Lock,
  Unlock,
  Pause,
  Key,
  X,
  ShieldCheck,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Patient } from '../../types/patient';
import { useHospitalStore } from '../../store/hospitalStore';
import { usePatientStore } from '../../store/patientStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { faceRegistryService } from '../../services/faceRegistryService';
import { poseService } from '../../services/poseService';
import { audioFeedback } from '../../services/audioService';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { TreatmentPlan } from '../../types/hospital';
import { STRETCH_EXERCISES, StretchExerciseItem } from '../../data/stretchExercises';

// ============================================================================
// Hook 1: useKioskCountdown
// ซิงโครไนซ์ตัวนับถอยหลัง 5 วินาทีของ Step 5 และ Step 6
// เก็บ interval ใน useRef, เคลียร์ใน cleanup, และเคลียร์ทันทีเมื่อกดปุ่ม
// ============================================================================
interface UseKioskCountdownOptions {
  initialSeconds: number;
  isActive: boolean;
  onComplete: () => void;
}

function useKioskCountdown({ initialSeconds, isActive, onComplete }: UseKioskCountdownOptions) {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const proceedImmediately = useCallback(() => {
    clearTimer();
    onComplete();
  }, [clearTimer, onComplete]);

  useEffect(() => {
    if (!isActive) {
      clearTimer();
      setSeconds(initialSeconds);
      setIsPaused(false);
      return;
    }

    if (isPaused) {
      clearTimer();
      return;
    }

    setSeconds(initialSeconds);
    clearTimer();

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearTimer();
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [isActive, isPaused, initialSeconds, onComplete, clearTimer]);

  return {
    seconds,
    isPaused,
    togglePause,
    proceedImmediately,
    clearTimer,
  };
}

// ============================================================================
// Hook 2: useHandTracker
// Shared Hand Tracking Hook ตัวเดียวระหว่าง Step 2 และ Step 3
// จำกัดการตรวจจับที่ ~15 fps, เก็บตำแหน่งมือใน useRef (ไม่ setState ทุกเฟรม),
// ควบคุม cursor DOM โดยตรง, และเรียก close() เมื่อออกจาก Step 3
// ============================================================================
interface UseHandTrackerOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  cursorElementRef: React.RefObject<HTMLDivElement>;
  cursorProgressCircleRef: React.RefObject<SVGCircleElement>;
  cursorLabelRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
  onTargetTrigger: (targetId: string) => void;
  onArmPoseConfirm: (pose: 'right_yes' | 'left_no') => void;
  onArmPoseChange?: (pose: 'none' | 'right_yes' | 'left_no', progress: number) => void;
}

function useHandTracker({
  videoRef,
  containerRef,
  cursorElementRef,
  cursorProgressCircleRef,
  cursorLabelRef,
  enabled,
  onTargetTrigger,
  onArmPoseConfirm,
  onArmPoseChange,
}: UseHandTrackerOptions) {
  // เก็บตำแหน่งและสถานะมือใน useRef ไม่ทำให้ React re-render ทุกเฟรม
  const handPosRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredTargetRef = useRef<string | null>(null);
  const hoverStartTimeRef = useRef<number | null>(null);
  const lastTickElapsedRef = useRef<number>(0);
  const isCooldownRef = useRef<boolean>(false);
  const lastArmPoseRef = useRef<'none' | 'right_yes' | 'left_no'>('none');
  const armHoldCounterRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      // ซ่อน Cursor เมื่อไม่ได้อยู่ใน Step 2 หรือ 3
      if (cursorElementRef.current) cursorElementRef.current.style.opacity = '0';
      if (cursorProgressCircleRef.current) cursorProgressCircleRef.current.style.strokeDashoffset = '150.8';
      if (cursorLabelRef.current) cursorLabelRef.current.style.opacity = '0';
      return;
    }

    let cancelled = false;
    let rafId: number | null = null;
    let lastFrameTime = 0;
    const FPS_INTERVAL = 1000 / 15; // ~15 FPS (66.6ms) เพื่อลดภาระ CPU/GPU

    // ตรวจสอบความพร้อมของ HandLandmarker (พรีโหลดไว้แล้วจาก Step 1)
    poseService.ensureHandLandmarker().catch((err) => {
      console.warn('⚠️ Hand Landmarker check warning:', err);
    });

    const loop = () => {
      if (cancelled) return;

      const now = performance.now();
      if (now - lastFrameTime >= FPS_INTERVAL) {
        lastFrameTime = now;
        const video = videoRef.current;
        if (video && video.readyState >= 2 && !video.paused) {
          try {
            const res = poseService.detectHolistic(video, now, { enableHands: true });
            
            // 1. ตรวจจับตำแหน่งปลายนิ้ว (Hand Tracking)
            let activeFingertip: { x: number; y: number } | null = null;
            if (res?.handLandmarks && res.handLandmarks.length > 0 && res.handLandmarks[0].length > 8) {
              activeFingertip = { x: res.handLandmarks[0][8].x, y: res.handLandmarks[0][8].y };
            } else if (res?.poseLandmarks) {
              const lm = res.poseLandmarks;
              const rightIdx = lm[20] || lm[16];
              const leftIdx = lm[19] || lm[15];
              if (rightIdx && (rightIdx.visibility === undefined || rightIdx.visibility > 0.3)) {
                activeFingertip = { x: rightIdx.x, y: rightIdx.y };
              } else if (leftIdx && (leftIdx.visibility === undefined || leftIdx.visibility > 0.3)) {
                activeFingertip = { x: leftIdx.x, y: leftIdx.y };
              }
            }

            // อัปเดตพิกัดลงใน DOM Element โดยตรง (Hardware Accelerated CSS Transform, 0 React Re-renders!)
            const containerEl = containerRef.current || video;
            if (activeFingertip && containerEl && cursorElementRef.current) {
              const rect = containerEl.getBoundingClientRect();
              const mirroredX = 1 - activeFingertip.x;
              const pixelX = rect.left + mirroredX * rect.width;
              const pixelY = rect.top + activeFingertip.y * rect.height;

              handPosRef.current = { x: pixelX, y: pixelY };

              cursorElementRef.current.style.transform = `translate3d(${pixelX}px, ${pixelY}px, 0)`;
              cursorElementRef.current.style.opacity = '1';

              // Hit Testing แตะปุ่ม [data-kiosk-target]
              if (!isCooldownRef.current) {
                const hitEl = document.elementFromPoint(pixelX, pixelY);
                const targetEl = hitEl?.closest('[data-kiosk-target]');
                const targetId = targetEl?.getAttribute('data-kiosk-target');

                if (targetId) {
                  if (hoveredTargetRef.current === targetId) {
                    const elapsed = now - (hoverStartTimeRef.current || now);
                    const prog = Math.min(100, Math.round((elapsed / 1000) * 100));

                    // อัปเดตวงแหวนนับเวลา SVG ผ่าน DOM ref
                    if (cursorProgressCircleRef.current) {
                      cursorProgressCircleRef.current.style.strokeDashoffset = String(150.8 - (150.8 * prog) / 100);
                    }
                    if (cursorLabelRef.current) {
                      cursorLabelRef.current.textContent = `แตะค้าง 1 วินาที (${prog}%)`;
                      cursorLabelRef.current.style.opacity = '1';
                    }

                    if (Math.floor(elapsed / 250) > Math.floor(lastTickElapsedRef.current / 250)) {
                      audioFeedback.playHoldTick();
                    }
                    lastTickElapsedRef.current = elapsed;

                    if (prog >= 100) {
                      isCooldownRef.current = true;
                      audioFeedback.playRepSuccess();
                      onTargetTrigger(targetId);
                      hoveredTargetRef.current = null;
                      hoverStartTimeRef.current = null;
                      lastTickElapsedRef.current = 0;
                      if (cursorProgressCircleRef.current) cursorProgressCircleRef.current.style.strokeDashoffset = '150.8';
                      if (cursorLabelRef.current) cursorLabelRef.current.style.opacity = '0';
                      setTimeout(() => {
                        isCooldownRef.current = false;
                      }, 800);
                    }
                  } else {
                    hoveredTargetRef.current = targetId;
                    hoverStartTimeRef.current = now;
                    lastTickElapsedRef.current = 0;
                    if (cursorLabelRef.current) {
                      cursorLabelRef.current.textContent = 'แตะค้าง 1 วินาที (0%)';
                      cursorLabelRef.current.style.opacity = '1';
                    }
                  }
                } else {
                  if (hoveredTargetRef.current) {
                    hoveredTargetRef.current = null;
                    hoverStartTimeRef.current = null;
                    lastTickElapsedRef.current = 0;
                    if (cursorProgressCircleRef.current) cursorProgressCircleRef.current.style.strokeDashoffset = '150.8';
                    if (cursorLabelRef.current) cursorLabelRef.current.style.opacity = '0';
                  }
                }
              }
            } else if (cursorElementRef.current) {
              cursorElementRef.current.style.opacity = '0';
              if (cursorProgressCircleRef.current) cursorProgressCircleRef.current.style.strokeDashoffset = '150.8';
              if (cursorLabelRef.current) cursorLabelRef.current.style.opacity = '0';
            }

            // 2. Arm Pose Detection (ยกแขนขวา=ใช่, ซ้าย=ไม่)
            if (res?.poseLandmarks) {
              const lm = res.poseLandmarks;
              const leftShoulder = lm[11];
              const leftWrist = lm[15];
              const rightShoulder = lm[12];
              const rightWrist = lm[16];

              const isRightRaised = rightWrist && rightShoulder && rightWrist.y < (rightShoulder.y - 0.05);
              const isLeftRaised = leftWrist && leftShoulder && leftWrist.y < (leftShoulder.y - 0.05);

              if (isRightRaised && !isLeftRaised) {
                if (lastArmPoseRef.current === 'right_yes') {
                  armHoldCounterRef.current++;
                } else {
                  armHoldCounterRef.current = 1;
                  lastArmPoseRef.current = 'right_yes';
                }
                const prog = Math.min(100, Math.round((armHoldCounterRef.current / 27) * 100));
                onArmPoseChange?.('right_yes', prog);
                if (armHoldCounterRef.current >= 27) {
                  armHoldCounterRef.current = 0;
                  onArmPoseConfirm('right_yes');
                }
              } else if (isLeftRaised && !isRightRaised) {
                if (lastArmPoseRef.current === 'left_no') {
                  armHoldCounterRef.current++;
                } else {
                  armHoldCounterRef.current = 1;
                  lastArmPoseRef.current = 'left_no';
                }
                const prog = Math.min(100, Math.round((armHoldCounterRef.current / 27) * 100));
                onArmPoseChange?.('left_no', prog);
                if (armHoldCounterRef.current >= 27) {
                  armHoldCounterRef.current = 0;
                  onArmPoseConfirm('left_no');
                }
              } else {
                if (armHoldCounterRef.current > 0) {
                  armHoldCounterRef.current = Math.max(0, armHoldCounterRef.current - 2);
                  const prog = Math.min(100, Math.round((armHoldCounterRef.current / 27) * 100));
                  onArmPoseChange?.(lastArmPoseRef.current, prog);
                } else {
                  lastArmPoseRef.current = 'none';
                  onArmPoseChange?.('none', 0);
                }
              }
            }
          } catch (e) {
            // ignore frame glitch
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (cursorElementRef.current) cursorElementRef.current.style.opacity = '0';
      if (cursorProgressCircleRef.current) cursorProgressCircleRef.current.style.strokeDashoffset = '150.8';
      if (cursorLabelRef.current) cursorLabelRef.current.style.opacity = '0';
    };
  }, [enabled, videoRef, containerRef, cursorElementRef, cursorProgressCircleRef, cursorLabelRef, onTargetTrigger, onArmPoseConfirm, onArmPoseChange]);
}

// ============================================================================
// Main Component: KioskSixStepWorkflow
// ============================================================================
interface KioskSixStepWorkflowProps {
  onLoginComplete: (patient: Patient) => void;
  onStartExerciseDirectly: (
    patient: Patient,
    plan?: TreatmentPlan,
    mode?: 'physio' | 'minigame',
    stretchQueue?: StretchExerciseItem[],
    customHoldTimes?: Record<string, number>
  ) => void;
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
  // Query param flags: อนุญาต Demo Mode เฉพาะขณะรัน Local Development Server เท่านั้น (ใน Production Build จะเป็น false เสมอ)
  const isExplicitDemo = Boolean(
    import.meta.env.DEV &&
    typeof window !== 'undefined' && (
      new URLSearchParams(window.location.search).get('demo') === '1' ||
      new URLSearchParams(window.location.search).get('dev') === '1'
    )
  );

  const initialStepParam = typeof window !== 'undefined'
    ? parseInt(new URLSearchParams(window.location.search).get('step') || '1', 10)
    : 1;
  const validInitialStep = !isNaN(initialStepParam) && initialStepParam >= 1 && initialStepParam <= 6 ? initialStepParam : 1;
  const [currentStep, setCurrentStep] = useState<number>(validInitialStep);

  // Settings
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isExplicitDemo);
  const [seniorSimpleMode, setSeniorSimpleMode] = useState<boolean>(true);

  // Stretch Modal State
  const [showStretchModal, setShowStretchModal] = useState<boolean>(false);
  const [selectedStretchIds, setSelectedStretchIds] = useState<string[]>(
    STRETCH_EXERCISES.map((s) => s.id)
  );
  const [customHoldTimes, setCustomHoldTimes] = useState<Record<string, number>>({});

  // Clock
  const [thaiDateStr, setThaiDateStr] = useState<string>('');
  const [thaiTimeStr, setThaiTimeStr] = useState<string>('');

  // Global MediaStream & Video References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Step 1 Presence State
  const [isPersonDetected, setIsPersonDetected] = useState<boolean>(false);
  const [presenceProgress, setPresenceProgress] = useState<number>(0);
  const [isSlideUpAnimating, setIsSlideUpAnimating] = useState<boolean>(false);

  // Step 2 & 3 Arm Pose State
  const [detectedArmPose, setDetectedArmPose] = useState<'none' | 'right_yes' | 'left_no'>('none');
  const [armHoldProgress, setArmHoldProgress] = useState<number>(0);
  const [gameXp, setGameXp] = useState<number>(100);
  const [comboCount, setComboCount] = useState<number>(1);

  // Hand Tracking DOM Refs (ป้องกัน React Re-render ทุกเฟรม)
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorElementRef = useRef<HTMLDivElement | null>(null);
  const cursorProgressCircleRef = useRef<SVGCircleElement | null>(null);
  const cursorLabelRef = useRef<HTMLDivElement | null>(null);

  // Step 4 Face Liveness & Biometric State
  const [scanStep, setScanStep] = useState<'front' | 'left' | 'right' | 'done'>('front');
  const [faceHoldProgress, setFaceHoldProgress] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('กรุณาจัดใบหน้าให้อยู่ในกรอบวงรี');
  const [isNewRegistration, setIsNewRegistration] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('');
  const [regHn, setRegHn] = useState<string>('');
  const [biometricPhase, setBiometricPhase] = useState<number>(0);
  const [biometricProgress, setBiometricProgress] = useState<number>(0);
  const challengeProgressRef = useRef<{ front: boolean; left: boolean; right: boolean }>({
    front: false,
    left: false,
    right: false,
  });
  const biometricTimersRef = useRef<NodeJS.Timeout[]>([]);

  // PIN Modal State
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Step 6 Selected Therapy Mode
  const [selectedTherapyType, setSelectedTherapyType] = useState<'physio' | 'minigame'>('physio');

  // Active Patient & Plan
  const [activePatient, setActivePatient] = useState<Patient>({
    id: 12,
    patient_code: 'P-0012',
    name: 'นายสมชาย ใจดี',
    age: 68,
    gender: 'male',
    notes: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)',
  });
  const [activePlan, setActivePlan] = useState<TreatmentPlan | null>(null);

  const { treatmentPlans } = useHospitalStore();
  const { selectPatient, selectedPatient, patients } = usePatientStore();

  useEffect(() => {
    if (selectedPatient && selectedPatient.id) {
      setActivePatient(selectedPatient);
    }
  }, [selectedPatient]);

  // 1. Clock updater
  useEffect(() => {
    const thaiDayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
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

  // ============================================================================
  // 2. Global MediaStream Management: เริ่มครั้งเดียวที่ Parent เลเวล
  // ไม่เรียกซ้ำเมื่อเปลี่ยน Step และหยุดแทร็กเมื่อเข้า PIN หรือจบคีออส
  // ============================================================================
  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('ไม่พบอุปกรณ์กล้องบนอุปกรณ์นี้ กำลังเปิดโหมดจำลองภาพเสมือน');
        return;
      }
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) throw new Error('ไม่สามารถรับสัญญาณภาพจากกล้องเว็บแคมได้');

      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Kiosk Camera start warning:', err);
      setCameraError('ไม่สามารถใช้งานกล้องได้ กรุณาอนุญาตการใช้กล้องในการตั้งค่าเบราว์เซอร์ หรือเข้าสู่ระบบด้วยรหัส PIN');
      setIsCameraActive(false);
    }
  }, []);

  // เริ่มต้นกล้องครั้งเดียวเมื่อตู้ Kiosk โหลด และทำความสะอาดทรัพยากรเมื่อ Unmount จาก Kiosk ทั้งหมด
  useEffect(() => {
    startCamera();
    return () => {
      stopMediaStream();
      poseService.closeHandLandmarker();
      poseService.closeFaceLandmarker();
      biometricTimersRef.current.forEach((t) => clearTimeout(t));
      biometricTimersRef.current = [];
    };
  }, [startCamera, stopMediaStream]);

  // เชื่อมต่อ stream เข้า videoRef ถาวร
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  // Preload Pose, Hand Tracker และ Face Liveness ล่วงหน้าใน Background ตอนอยู่ Step 1
  useEffect(() => {
    if (currentStep === 1) {
      let cancelled = false;
      const timer = setTimeout(() => {
        if (cancelled) return;
        poseService.initialize().catch(() => {});
        poseService.ensureHandLandmarker().catch(() => {});
        poseService.ensureFaceLandmarker().catch(() => {});
      }, 400);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [currentStep]);

  // Central Step Transition
  const changeStep = useCallback((nextStep: number) => {
    biometricTimersRef.current.forEach((t) => clearTimeout(t));
    biometricTimersRef.current = [];
    setDetectedArmPose('none');
    setArmHoldProgress(0);
    setCurrentStep(nextStep);
  }, []);

  // 3. Step 1: Presence Detection Loop (Throttled ~15 FPS)
  useEffect(() => {
    if (currentStep !== 1) return;

    let cancelled = false;
    let rafId: number | null = null;
    let presenceCounter = 0;
    const REQUIRED_FRAMES = 27; // ~1.8 วินาทีที่ 15 FPS
    let lastTime = 0;

    const loop = () => {
      if (cancelled) return;
      const now = performance.now();
      if (now - lastTime >= 66.6) {
        lastTime = now;
        const video = videoRef.current;
        if (video && video.readyState >= 2 && !video.paused) {
          try {
            const res = poseService.detectHolistic(video, now, { enableHands: false });
            const lm = res?.poseLandmarks;
            const isPersonVisible = Boolean(
              lm && (
                (lm[0] && (lm[0].visibility === undefined || lm[0].visibility > 0.35)) ||
                (lm[11] && lm[12])
              )
            );

            if (isPersonVisible) {
              presenceCounter++;
              setIsPersonDetected(true);
              const prog = Math.min(100, Math.round((presenceCounter / REQUIRED_FRAMES) * 100));
              setPresenceProgress(prog);

              if (presenceCounter % 8 === 0) audioFeedback.playHoldTick();

              if (presenceCounter >= REQUIRED_FRAMES) {
                presenceCounter = 0;
                setIsPersonDetected(false);
                setPresenceProgress(100);
                audioFeedback.playRepSuccess();
                changeStep(2);
                return;
              }
            } else {
              if (presenceCounter > 0) {
                presenceCounter = Math.max(0, presenceCounter - 2);
                setPresenceProgress(Math.round((presenceCounter / REQUIRED_FRAMES) * 100));
              } else {
                setIsPersonDetected(false);
              }
            }
          } catch (e) {}
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentStep, changeStep]);

  // Confetti helper
  const triggerMiniGameConfetti = (originX = 0.5) => {
    if (seniorSimpleMode) return;
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: originX, y: 0.6 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24'],
      });
    } catch {}
  };

  // Step Action Handlers
  const triggerSlideUp = useCallback(() => {
    if (isSlideUpAnimating) return;
    setIsSlideUpAnimating(true);
    audioFeedback.playRepSuccess();
    try {
      voiceAssistant.speak('ยินดีต้อนรับสู่ระบบ Strong Care ค่ะ ยื่นมือแตะปุ่ม หรือเลือกคำตอบบนหน้าจอได้เลยค่ะ', {
        level: 'system',
      });
    } catch {}

    setTimeout(() => {
      setIsSlideUpAnimating(false);
      setPresenceProgress(0);
      setIsPersonDetected(false);
      changeStep(2);
    }, 400);
  }, [isSlideUpAnimating, changeStep]);

  const handleStep2Yes = useCallback(() => {
    audioFeedback.playRepSuccess();
    triggerMiniGameConfetti(0.25);
    setGameXp((prev) => prev + 50);
    setComboCount((prev) => prev + 1);
    changeStep(3);
  }, [changeStep]);

  const handleStep2No = useCallback(() => {
    audioFeedback.playHoldTick();
    try {
      voiceAssistant.speak('พักผ่อนให้สบายนะคะ เมื่อพร้อมสามารถมานั่งหน้ากล้องใหม่ได้ทุกเมื่อค่ะ', {
        level: 'system',
      });
    } catch {}
    changeStep(1);
  }, [changeStep]);

  const handleStep3Yes = useCallback(() => {
    audioFeedback.playRepSuccess();
    triggerMiniGameConfetti(0.25);
    setGameXp((prev) => prev + 50);
    setScanStatusMessage('กรุณาจัดใบหน้าให้อยู่ในกรอบวงรี (มองตรงเพื่อเริ่มต้น)');
    changeStep(4);
  }, [changeStep]);

  const handleStep3No = useCallback(() => {
    audioFeedback.playHoldTick();
    try {
      voiceAssistant.speak('ยกเลิกการเข้าสู่ระบบ กำลังกลับสู่หน้าแรกค่ะ', {
        level: 'system',
      });
    } catch {}
    changeStep(1);
  }, [changeStep]);

  // Target trigger dispatcher
  const handleKioskTarget = useCallback((targetId: string) => {
    switch (targetId) {
      case 'step1-start':
        triggerSlideUp();
        break;
      case 'step1-pin':
      case 'step4-pin':
        setShowPinModal(true);
        break;
      case 'step2-yes':
        handleStep2Yes();
        break;
      case 'step2-no':
        handleStep2No();
        break;
      case 'step3-yes':
        handleStep3Yes();
        break;
      case 'step3-no':
        handleStep3No();
        break;
      case 'step4-rescan':
        challengeProgressRef.current = { front: false, left: false, right: false };
        setScanStep('front');
        setScanStatusMessage('กรุณาจัดใบหน้าให้อยู่ในกรอบวงรี');
        break;
      default:
        break;
    }
  }, [triggerSlideUp, handleStep2Yes, handleStep2No, handleStep3Yes, handleStep3No]);

  // เชื่อมต่อ useHandTracker สำหรับ Step 2 และ Step 3
  useHandTracker({
    videoRef,
    containerRef: cameraContainerRef,
    cursorElementRef,
    cursorProgressCircleRef,
    cursorLabelRef,
    enabled: currentStep === 2 || currentStep === 3,
    onTargetTrigger: handleKioskTarget,
    onArmPoseConfirm: useCallback((pose: 'right_yes' | 'left_no') => {
      if (pose === 'right_yes') {
        if (currentStep === 2) handleStep2Yes();
        else if (currentStep === 3) handleStep3Yes();
      } else if (pose === 'left_no') {
        if (currentStep === 2) handleStep2No();
        else if (currentStep === 3) handleStep3No();
      }
    }, [currentStep, handleStep2Yes, handleStep3Yes, handleStep2No, handleStep3No]),
    onArmPoseChange: useCallback((pose: 'none' | 'right_yes' | 'left_no', prog: number) => {
      setDetectedArmPose(pose);
      setArmHoldProgress(prog);
    }, []),
  });

  // Step 4 Face Liveness Detection Hook (สร้างเมื่อเข้า Step 4 และ close() ตอนออก)
  useEffect(() => {
    if (currentStep !== 4 || isScanning) return;

    let cancelled = false;
    let rafId: number | null = null;
    let faceHoldCounter = 0;
    const REQUIRED_FACE_HOLD_FRAMES = 24; // ~1.5 วินาทีที่ 15 FPS
    let lastTime = 0;

    // ใช้ FaceLandmarker ที่โหลดไว้แล้วจาก Background ใน Step 1 (ไม่สร้างใหม่)
    poseService.ensureFaceLandmarker().catch(() => {});

    const loop = () => {
      if (cancelled) return;
      const now = performance.now();
      if (now - lastTime >= 66.6) {
        lastTime = now;
        const video = videoRef.current;
        if (video && video.readyState >= 2 && !video.paused) {
          try {
            const res = poseService.detectHolistic(video, now, { enableFace: true });
            const lm = res?.poseLandmarks;
            if (lm) {
              const nose = lm[0];
              const leftEye = lm[2];
              const rightEye = lm[5];

              if (nose && leftEye && rightEye) {
                const eyeMidX = (leftEye.x + rightEye.x) / 2;
                const eyeDist = Math.max(0.04, Math.abs(leftEye.x - rightEye.x));
                const yawOffset = (nose.x - eyeMidX) / eyeDist;

                if (scanStep === 'front') {
                  const isFacingFront = Math.abs(yawOffset) < 0.28;
                  if (isFacingFront) {
                    faceHoldCounter++;
                    const prog = Math.min(100, Math.round((faceHoldCounter / REQUIRED_FACE_HOLD_FRAMES) * 100));
                    setFaceHoldProgress(prog);
                    if (faceHoldCounter % 8 === 0) audioFeedback.playHoldTick();

                    if (faceHoldCounter >= REQUIRED_FACE_HOLD_FRAMES) {
                      faceHoldCounter = 0;
                      challengeProgressRef.current.front = true;
                      setScanStep('left');
                      setScanStatusMessage('✓ 1. หน้าตรง สำเร็จ! ต่อไปค่อยๆ หันศีรษะไปทางซ้าย (ค้างไว้ 1.5 วินาที)');
                      audioFeedback.playRepSuccess();
                    }
                  } else {
                    faceHoldCounter = Math.max(0, faceHoldCounter - 1);
                    setFaceHoldProgress(Math.round((faceHoldCounter / REQUIRED_FACE_HOLD_FRAMES) * 100));
                  }
                } else if (scanStep === 'left') {
                  const isTurningLeft = yawOffset > 0.22;
                  if (isTurningLeft) {
                    faceHoldCounter++;
                    const prog = Math.min(100, Math.round((faceHoldCounter / REQUIRED_FACE_HOLD_FRAMES) * 100));
                    setFaceHoldProgress(prog);
                    if (faceHoldCounter % 8 === 0) audioFeedback.playHoldTick();

                    if (faceHoldCounter >= REQUIRED_FACE_HOLD_FRAMES) {
                      faceHoldCounter = 0;
                      challengeProgressRef.current.left = true;
                      setScanStep('right');
                      setScanStatusMessage('✓ 2. หันซ้าย สำเร็จ! ต่อไปค่อยๆ หันศีรษะไปทางขวา (ค้างไว้ 1.5 วินาที)');
                      audioFeedback.playRepSuccess();
                    }
                  } else {
                    faceHoldCounter = Math.max(0, faceHoldCounter - 1);
                    setFaceHoldProgress(Math.round((faceHoldCounter / REQUIRED_FACE_HOLD_FRAMES) * 100));
                  }
                } else if (scanStep === 'right') {
                  const isTurningRight = yawOffset < -0.22;
                  if (isTurningRight) {
                    faceHoldCounter++;
                    const prog = Math.min(100, Math.round((faceHoldCounter / REQUIRED_FACE_HOLD_FRAMES) * 100));
                    setFaceHoldProgress(prog);
                    if (faceHoldCounter % 8 === 0) audioFeedback.playHoldTick();

                    if (faceHoldCounter >= REQUIRED_FACE_HOLD_FRAMES) {
                      faceHoldCounter = 0;
                      challengeProgressRef.current = { front: true, left: true, right: true };
                      setScanStep('done');
                      setScanStatusMessage('✓ ครบทุกท่าแล้ว! กำลังตรวจสอบข้อมูลชีวมิติ...');
                      audioFeedback.playRepSuccess();
                      handlePerformFaceScan(true);
                    }
                  } else {
                    faceHoldCounter = Math.max(0, faceHoldCounter - 1);
                    setFaceHoldProgress(Math.round((faceHoldCounter / REQUIRED_FACE_HOLD_FRAMES) * 100));
                  }
                }
              }
            }
          } catch (e) {}
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentStep, scanStep, isScanning]);

  // Proceed to Exercise
  const handleProceedToExercise = useCallback((
    mode: 'physio' | 'minigame' = selectedTherapyType,
    customQueue?: StretchExerciseItem[]
  ) => {
    audioFeedback.playRepSuccess();
    selectPatient(activePatient);
    onStartExerciseDirectly(activePatient, activePlan || undefined, mode, customQueue, customHoldTimes);
  }, [activePatient, activePlan, selectedTherapyType, customHoldTimes, selectPatient, onStartExerciseDirectly]);

  // Step 4 Verification Sequence
  const handlePerformFaceScan = (bypass = false) => {
    biometricTimersRef.current.forEach((t) => clearTimeout(t));
    biometricTimersRef.current = [];

    setIsScanning(true);
    setBiometricPhase(1);
    setBiometricProgress(25);
    setScanStatusMessage('🛡️ [1/3] ตรวจสอบ Liveness & 3D Anti-Spoofing...');
    audioFeedback.playHoldTick();

    const t1 = setTimeout(() => {
      setBiometricPhase(2);
      setBiometricProgress(60);
      setScanStatusMessage('🧬 [2/3] วิเคราะห์โครงสร้างใบหน้า 468 จุด และสกัด 128-D Biometric Embedding...');
      audioFeedback.playHoldTick();
    }, 800);

    const t2 = setTimeout(() => {
      setBiometricPhase(3);
      setBiometricProgress(90);
      setScanStatusMessage('📋 [3/3] เปรียบเทียบอัตลักษณ์บุคคล (Dual-Metric: Cosine ≥ 0.90)...');
      audioFeedback.playHoldTick();
    }, 1600);

    const t3 = setTimeout(() => {
      // ตรวจสอบโหมดสาธิต (Demo Bypass): อนุญาตเฉพาะเมื่อเปิดโหมดสาธิตเพื่อการทดสอบ Flow
      if (bypass && (isDemoMode || isExplicitDemo)) {
        setBiometricPhase(4);
        setBiometricProgress(100);
        setScanStep('done');
        setScanStatusMessage(`⭐ โหมดสาธิต: ผ่านการตรวจสอบ ยินดีต้อนรับ: ${activePatient.name}`);
        audioFeedback.playRepSuccess();

        try {
          voiceAssistant.speak(`ยินดีต้อนรับ ${activePatient.name} เข้าสู่ระบบสำเร็จ`, { level: 'system' });
        } catch {}

        const t4 = setTimeout(() => {
          setIsScanning(false);
          setBiometricPhase(0);
          changeStep(5);
        }, 1000);

        biometricTimersRef.current.push(t4);
        return;
      }

      // ในโหมดจริง: ตัด mock vector [new Array(128).fill(0.08)] และตัด profiles[0] ออก ไม่สร้างบัญชีปลอม
      setIsScanning(false);
      setBiometricPhase(0);
      setScanStatusMessage('ยังไม่เชื่อมต่อการจดจำใบหน้าจริง');
      audioFeedback.playHoldTick();
    }, 2400);

    biometricTimersRef.current.push(t1, t2, t3);
  };

  const handleManualChallenge = (step: 'front' | 'left' | 'right') => {
    challengeProgressRef.current[step] = true;
    audioFeedback.playRepSuccess();

    if (step === 'front') {
      setScanStep('left');
      setScanStatusMessage('✓ 1. หน้าตรง สำเร็จ! ต่อไปค่อยๆ หันศีรษะไปทางซ้าย (ค้างไว้ 1.5 วินาที)');
    } else if (step === 'left') {
      setScanStep('right');
      setScanStatusMessage('✓ 2. หันซ้าย สำเร็จ! ต่อไปค่อยๆ หันศีรษะไปทางขวา (ค้างไว้ 1.5 วินาที)');
    } else if (step === 'right') {
      challengeProgressRef.current = { front: true, left: true, right: true };
      setScanStep('done');
      setScanStatusMessage('✓ ครบทุกท่าแล้ว! กำลังตรวจสอบข้อมูลชีวมิติ...');
      setTimeout(() => handlePerformFaceScan(true), 300);
    }
  };

  // Event listener สำหรับการทดสอบความปลอดภัยและ E2E Testing ในสภาพแวดล้อม Headless/CI
  useEffect(() => {
    const handleTriggerScan = () => {
      handlePerformFaceScan(true);
    };
    window.addEventListener('kiosk:trigger-face-scan', handleTriggerScan);
    return () => {
      window.removeEventListener('kiosk:trigger-face-scan', handleTriggerScan);
    };
  }, []);

  // 4. Synchronized Countdowns for Step 5 & Step 6
  const step5Countdown = useKioskCountdown({
    initialSeconds: 5,
    isActive: currentStep === 5,
    onComplete: useCallback(() => changeStep(6), [changeStep]),
  });

  const step6Countdown = useKioskCountdown({
    initialSeconds: 5,
    isActive: currentStep === 6,
    onComplete: useCallback(() => handleProceedToExercise(selectedTherapyType), [handleProceedToExercise, selectedTherapyType]),
  });

  // Confetti on Step 5
  useEffect(() => {
    if (currentStep === 5) {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
        });
      } catch {}
    }
  }, [currentStep]);

  // Load treatment plan
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

  // PIN Handlers
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 8) {
      setPinInput((prev) => prev + digit);
      setPinError(null);
      audioFeedback.playHoldTick();
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
    audioFeedback.playHoldTick();
  };

  const handlePinClear = () => {
    setPinInput('');
    setPinError(null);
  };

  const handleSelectQuickPatient = (pat: Patient, pinCode: string) => {
    setActivePatient(pat);
    setPinInput(pinCode);
    setPinError(null);
    stopMediaStream();
    setTimeout(() => {
      setShowPinModal(false);
      audioFeedback.playRepSuccess();
      changeStep(5);
    }, 300);
  };

  const handleVerifyPinSubmit = () => {
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setPinError('กรุณาป้อนรหัส PIN หรือรหัสคนไข้');
      return;
    }

    // ในโหมด Development: อนุญาต Mock PIN สำหรับการทดสอบ Flow และ UI
    if (import.meta.env.DEV) {
      if (cleanPin === '1234' || cleanPin === '123456' || cleanPin.toUpperCase() === 'P-0012') {
        const somchai: Patient = {
          id: 12,
          patient_code: 'P-0012',
          name: 'นายสมชาย ใจดี',
          age: 68,
          gender: 'male',
          notes: 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)',
        };
        setActivePatient(somchai);
        setShowPinModal(false);
        stopMediaStream();
        audioFeedback.playRepSuccess();
        changeStep(5);
        return;
      }

      if (cleanPin === '5678' || cleanPin.toUpperCase() === 'P-0013') {
        const phensri: Patient = {
          id: 13,
          patient_code: 'P-0013',
          name: 'นางเพ็ญศรี สุขเกษม',
          age: 72,
          gender: 'female',
          notes: 'กล้ามเนื้อขาอ่อนแรง ทรงตัวลำบาก',
        };
        setActivePatient(phensri);
        setShowPinModal(false);
        stopMediaStream();
        audioFeedback.playRepSuccess();
        changeStep(5);
        return;
      }

      const foundInStore = patients.find(
        (p) => p.patient_code.toLowerCase() === cleanPin.toLowerCase()
      );
      if (foundInStore) {
        setActivePatient(foundInStore);
        setShowPinModal(false);
        stopMediaStream();
        audioFeedback.playRepSuccess();
        changeStep(5);
        return;
      }

      setPinError('❌ รหัส PIN ไม่ถูกต้อง (ทดสอบ: 1234, 5678 หรือ P-0012)');
      audioFeedback.playHoldTick();
      return;
    }

    // ในโหมด Production: ต้องตรวจสอบผ่าน Backend API (POST /api/auth/pin) เท่านั้น
    // ป้องกันการบายพาสทางฝั่ง Client โดยเด็ดขาด
    setPinError('ระบบยังไม่เปิดให้ใช้ PIN กรุณาติดต่อเจ้าหน้าที่ (รอสร้าง POST /api/auth/pin)');
    audioFeedback.playHoldTick();
  };

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[92vh] py-3 sm:py-6 px-3 relative z-10 select-none">
      
      {/* ส่วนหัวทุกภาพ: ชื่อเครื่อง & ว/ด/ป */}
      <div className="flex flex-col items-center justify-center text-center mb-2.5 sm:mb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0B2B2B] tracking-wide underline underline-offset-8 decoration-2 decoration-[#0B2B2B]">
          {kioskStationName}
        </h1>
        <p className="text-xs sm:text-sm md:text-base font-bold text-[#0B2B2B]/85 mt-2 flex items-center gap-1.5 justify-center">
          <Calendar className="w-4 h-4 text-[#1E8A4C]" />
          <span>{thaiDateStr || 'กำลังโหลดวันที่...'}</span>
          <span className="text-gray-400 font-normal">|</span>
          <Clock className="w-4 h-4 text-[#1E8A4C]" />
          <span className="font-mono font-bold text-[#1E8A4C]">{thaiTimeStr || '00:00:00 น.'}</span>
        </p>

        {/* แถบควบคุมโหมด */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2 z-20">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-sm flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 ออฟไลน์พร้อมใช้งาน (IndexedDB)</span>
          </div>

          {isExplicitDemo && (
            <button
              onClick={() => {
                setIsDemoMode(!isDemoMode);
                audioFeedback.playHoldTick();
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition shadow flex items-center gap-1.5 cursor-pointer min-h-[38px] ${
                isDemoMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-emerald-700 text-white border border-emerald-800 shadow-emerald-700/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>โหมดสาธิต (Demo Mode)</span>
              <span className="text-[10px] bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded-md font-bold">อนุญาตข้าม</span>
            </button>
          )}

          <button
            onClick={() => {
              setSeniorSimpleMode(!seniorSimpleMode);
              audioFeedback.playHoldTick();
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-black transition shadow-sm flex items-center gap-2 cursor-pointer min-h-[44px] ${
              seniorSimpleMode
                ? 'bg-blue-600 text-white border border-blue-700 shadow-blue-500/30'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>👴 โหมดผู้สูงอายุ</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${seniorSimpleMode ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {seniorSimpleMode ? 'เปิดใช้งาน' : 'ปิด'}
            </span>
          </button>

          <button
            onClick={() => {
              setShowPinModal(true);
              audioFeedback.playHoldTick();
            }}
            className="px-4 py-2 rounded-full text-xs sm:text-sm font-black bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-400 shadow-sm transition flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            id="btnKioskPinFallbackHeader"
          >
            <Key className="w-4 h-4 text-emerald-600" />
            <span>เข้าด้วยรหัส PIN</span>
          </button>
        </div>
      </div>

      {/* กรอบ Card หลักสีขาว */}
      <div className="w-full max-w-[440px] sm:max-w-[480px] bg-white rounded-[36px] sm:rounded-[44px] border-2 sm:border-[2.5px] border-black/85 shadow-2xl relative overflow-hidden flex flex-col items-center p-5 sm:p-7 min-h-[580px] sm:min-h-[640px] justify-between transition-all duration-300">
        
        {/* กล่องแจ้งเตือนเมื่อขอสิทธิ์กล้องไม่สำเร็จ พร้อมปุ่มสัมผัสสำรอง PIN ทันที */}
        {cameraError && currentStep <= 4 && (
          <div className="w-full bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 mb-2 text-amber-950 text-xs shadow-md animate-fadeIn flex flex-col gap-2 z-30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="flex-1 font-bold leading-relaxed">
                {cameraError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>แตะที่นี่เพื่อเข้าสู่ระบบด้วยรหัส PIN สำรองทันที</span>
            </button>
          </div>
        )}
        
        {/* ================================================================= */}
        {/* Permanent Video Element at Parent Level: มีอยู่ตลอดใน Step 1-4   */}
        {/* ไม่ unmount หรือขอสิทธิ์กล้องใหม่ระหว่างสลับ Step                */}
        {/* ================================================================= */}
        <div
          ref={cameraContainerRef}
          className={`transition-all duration-300 ease-in-out relative ${
            currentStep === 1
              ? 'fixed top-0 left-0 w-2 h-2 opacity-0 pointer-events-none -z-50 overflow-hidden'
              : currentStep === 2 || currentStep === 3
              ? 'w-full flex-1 min-h-[280px] max-h-[340px] rounded-[32px] overflow-hidden border-2 border-emerald-400/80 bg-slate-900 flex items-center justify-center shadow-2xl my-2.5 z-10'
              : currentStep === 4
              ? 'w-56 h-68 sm:w-60 sm:h-74 border-[3px] border-dashed border-gray-800 rounded-[50%] overflow-hidden flex items-center justify-center bg-black/5 shadow-inner mx-auto my-2 z-10'
              : 'fixed top-0 left-0 w-2 h-2 opacity-0 pointer-events-none -z-50 overflow-hidden'
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100 opacity-90"
          />

          {/* Overlays สำหรับ Step 2 & 3 บนกล้อง */}
          {(currentStep === 2 || currentStep === 3) && (
            <>
              {/* แป้นเป้าหมายวงกลมซ้าย (ไม่) */}
              <div
                data-kiosk-target={currentStep === 2 ? 'step2-no' : 'step3-no'}
                className="absolute top-4 left-4 z-20 flex flex-col items-center cursor-pointer transition hover:scale-105 active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-rose-700/90 border-2 border-rose-300 flex flex-col items-center justify-center text-white shadow-lg backdrop-blur-sm">
                  <span className="font-black text-sm">ไม่</span>
                  <span className="text-[10px] text-rose-200 font-bold">{currentStep === 2 ? 'แขนซ้าย' : 'ย้อนกลับ'}</span>
                </div>
                <span className="text-[11px] font-black text-white bg-black/70 px-2 py-0.5 rounded-full mt-1.5 border border-rose-400/50">
                  แตะ &quot;ไม่&quot;
                </span>
              </div>

              {/* แป้นเป้าหมายวงกลมขวา (ใช่) */}
              <div
                data-kiosk-target={currentStep === 2 ? 'step2-yes' : 'step3-yes'}
                className="absolute top-4 right-4 z-20 flex flex-col items-center cursor-pointer transition hover:scale-105 active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-700/90 border-2 border-emerald-300 flex flex-col items-center justify-center text-white shadow-lg backdrop-blur-sm">
                  <span className="font-black text-sm">ใช่</span>
                  <span className="text-[10px] text-emerald-200 font-bold flex items-center gap-0.5">
                    {currentStep === 2 ? 'แขนขวา' : 'เข้าสู่ระบบ'}
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                  </span>
                </div>
                <span className="text-[11px] font-black text-white bg-black/70 px-2 py-0.5 rounded-full mt-1.5 border border-emerald-400/50">
                  แตะ &quot;ใช่&quot;
                </span>
              </div>

              {/* กึ่งกลาง: เส้นไกด์บุคคล */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-36 rounded-full border-2 border-dashed border-emerald-400/50 flex items-center justify-center bg-emerald-500/5">
                  <User className="w-16 h-16 text-emerald-400/35" />
                </div>
              </div>

              {/* ข้อความแนะนำด้านล่างกล้อง */}
              <div className="absolute bottom-2 inset-x-2 z-20 bg-black/85 backdrop-blur-md rounded-2xl py-1.5 px-3 text-center border border-emerald-400/40">
                <p className="text-[11px] sm:text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                  <span>✋</span>
                  <span>ยื่นมือแตะลูกแก้วบนภาพค้าง 1 วินาที หรือกดปุ่มขนาดใหญ่ด้านล่าง</span>
                </p>
              </div>
            </>
          )}

          {/* Overlays สำหรับ Step 4 บนกรอบวงรี */}
          {currentStep === 4 && (
            <div className="absolute inset-0 pointer-events-none border-4 border-dashed border-emerald-400/60 rounded-[50%]" />
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* Step 1: หน้าพักหน้าจอ (Screensaver)                  */}
        {/* ---------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center animate-fadeIn relative">
            {isPersonDetected && (
              <div className="absolute top-0 inset-x-2 z-30 bg-emerald-950/95 backdrop-blur-md border-2 border-emerald-400 text-white rounded-2xl p-3 shadow-2xl flex flex-col items-center animate-fadeIn">
                <div className="flex items-center justify-between w-full text-xs font-black mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <User className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>ตรวจพบคนไข้นั่งหน้ากล้อง</span>
                  </span>
                  <span className="font-mono text-yellow-300 font-black text-sm">{presenceProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1 border border-emerald-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 transition-all duration-75 rounded-full"
                    style={{ width: `${presenceProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-200 font-semibold">
                  ⏳ กรุณานั่งนิ่งๆ สักครู่ ระบบกำลังเปิดหน้าต่างใน 1.8 วินาที...
                </p>
              </div>
            )}

            <div className="relative group cursor-pointer my-4" onClick={triggerSlideUp}>
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-2 border-emerald-300 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#BEE5F9] via-[#D5F0FD] to-[#86C232] relative transform group-hover:scale-105 transition duration-300">
                <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                  <rect width="200" height="200" fill="#BEE5F9" />
                  <ellipse cx="100" cy="80" rx="32" ry="18" fill="#FFFFFF" opacity="0.95" />
                  <path d="M-20 160 Q 60 110, 150 145 T 220 160 L 220 220 L -20 220 Z" fill="#9BCB3C" />
                  <path d="M-10 180 Q 90 135, 210 170 L 210 220 L -10 220 Z" fill="#7EAD29" />
                </svg>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#E6F9EE] border border-emerald-300 text-emerald-900 rounded-full px-4 py-1.5 text-xs font-black shadow-xs mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E8A4C] animate-ping" />
              <span>หน้าพักหน้าจอ (ระบบกล้องพร้อมทำงาน)</span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-gray-700 max-w-[340px] leading-relaxed mb-6">
              เมื่อคนใช้นั่งหน้ากล้องนิ่งๆ 1.8 วินาที หรือแตะปุ่ม ระบบจะเลื่อนขึ้นอัตโนมัติ
            </p>

            <div className="w-full space-y-2.5">
              <button
                data-kiosk-target="step1-start"
                onClick={triggerSlideUp}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#6FD67F] via-[#22c55e] to-[#1E8A4C] text-white font-extrabold text-base shadow-xl hover:shadow-2xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer min-h-[56px]"
              >
                <span>นั่งหน้ากล้อง / แตะเพื่อเริ่มต้น</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                data-kiosk-target="step1-pin"
                onClick={() => {
                  setShowPinModal(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[46px]"
              >
                <Key className="w-4 h-4 text-emerald-600" />
                <span>หรือ เข้าสู่ระบบด้วย PIN 6 หลัก</span>
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Step 2: ถามความพร้อมทำกายภาพ                         */}
        {/* ---------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn">
            <div className="w-full bg-[#E3F5FC] border border-[#BDE3F5] rounded-3xl py-3 px-4 text-center shadow-sm relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>โหมดสัมผัสง่าย</span>
                </span>
                <span className="text-[11px] font-mono font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{gameXp} XP</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0B2B2B]">
                คุณพร้อมทำกายภาพหรือไม่?
              </h2>
              <p className="text-xs text-[#0B2B2B]/75 font-semibold mt-0.5">
                แตะปุ่มขนาดใหญ่ด้านล่างเพื่อเลือกคำตอบ
              </p>
            </div>

            {/* ปุ่มกดขนาดใหญ่สำหรับผู้สูงอายุ */}
            <div className="w-full flex items-center gap-2.5 mt-2">
              <button
                data-kiosk-target="step2-yes"
                onClick={handleStep2Yes}
                className="flex-1 py-4 px-3 rounded-2xl bg-[#0EA358] hover:bg-[#0C894A] text-white font-extrabold text-sm sm:text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[54px]"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>ใช่ (พร้อมทำกายภาพ)</span>
              </button>

              <button
                data-kiosk-target="step2-no"
                onClick={handleStep2No}
                className="w-36 py-4 px-3 rounded-2xl bg-[#E6284F] hover:bg-[#C91F41] text-white font-extrabold text-sm sm:text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[54px]"
              >
                <X className="w-5 h-5 stroke-[3]" />
                <span>ไม่ (พักก่อน)</span>
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Step 3: ถามความพร้อมเข้าสู่ระบบ                      */}
        {/* ---------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn">
            <div className="w-full bg-[#E3F5FC] border border-[#BDE3F5] rounded-3xl py-3 px-4 text-center shadow-sm relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>ขั้นตอนยืนยันตัวตน</span>
                </span>
                <span className="text-[11px] font-mono font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{gameXp} XP</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0B2B2B]">
                คุณพร้อมเข้าสู่ระบบหรือไม่?
              </h2>
              <p className="text-xs text-[#0B2B2B]/75 font-semibold mt-0.5">
                แตะปุ่มขนาดใหญ่ด้านล่างเพื่อเข้าสู่ระบบ
              </p>
            </div>

            <div className="w-full flex items-center gap-2.5 mt-2">
              <button
                data-kiosk-target="step3-yes"
                onClick={handleStep3Yes}
                className="flex-1 py-4 px-3 rounded-2xl bg-[#0EA358] hover:bg-[#0C894A] text-white font-extrabold text-sm sm:text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[54px]"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>ใช่ (เข้าสู่ระบบ)</span>
              </button>

              <button
                data-kiosk-target="step3-no"
                onClick={handleStep3No}
                className="w-36 py-4 px-3 rounded-2xl bg-[#E6284F] hover:bg-[#C91F41] text-white font-extrabold text-sm sm:text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[54px]"
              >
                <X className="w-5 h-5 stroke-[3]" />
                <span>ไม่ (ย้อนกลับ)</span>
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Step 4: สแกนใบหน้าและอัตลักษณ์ชีวมิติ                */}
        {/* ---------------------------------------------------- */}
        {currentStep === 4 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn">
            <div className="w-full bg-[#E3F5FC] border border-[#BDE3F5] rounded-3xl py-2.5 px-4 text-center shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Face Verification{isDemoMode ? ' (โหมดสาธิต)' : ''}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  ทำภารกิจตามลำดับ (ค้างไว้ 1.5s/ท่า)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0B2B2B]">
                สแกนใบหน้าเพื่อเข้าสู่ระบบ
              </h2>
              <p className="text-xs text-[#0B2B2B]/75 font-semibold mt-0.5">
                {scanStatusMessage}
              </p>
            </div>

            {/* แถบภารกิจ 4 ท่า: แสดงเฉพาะเมื่อเปิดโหมดสาธิตหรือ debug flag (ค่าเริ่มต้นปิดในโหมดจริง) */}
            {(isDemoMode || isExplicitDemo) && (
              <div className="w-full grid grid-cols-4 gap-1.5 my-2">
                {[
                  { key: 'front', label: 'หน้าตรง' },
                  { key: 'left', label: 'หันซ้าย' },
                  { key: 'right', label: 'หันขวา' },
                  { key: 'done', label: 'เสร็จสิ้น' },
                ].map((task) => (
                  <button
                    key={task.key}
                    data-kiosk-target={`step4-${task.key}`}
                    onClick={() => {
                      if (task.key !== 'done') handleManualChallenge(task.key as any);
                      else handlePerformFaceScan(true);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition border flex flex-col items-center justify-center cursor-pointer min-h-[44px] ${
                      challengeProgressRef.current[task.key as 'front' | 'left' | 'right'] || scanStep === 'done'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : scanStep === task.key
                        ? 'bg-white text-emerald-800 border-2 border-emerald-500 animate-pulse'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>{task.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* PIN Keypad Fallback Bar */}
            <div className="w-full space-y-2">
              <button
                data-kiosk-target="step4-pin"
                onClick={() => {
                  setShowPinModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4 text-amber-600" />
                <span>🔢 ผู้สูงอายุ หรือ สแกนหน้าไม่ติด? แตะเพื่อใส่รหัส PIN</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold px-1">
                <button
                  onClick={() => setIsNewRegistration(true)}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>ยังไม่มีบัญชี? ลงทะเบียนใบหน้าใหม่</span>
                </button>
                <button
                  data-kiosk-target="step4-rescan"
                  onClick={() => {
                    challengeProgressRef.current = { front: false, left: false, right: false };
                    setScanStep('front');
                    setScanStatusMessage('กรุณาจัดใบหน้าให้อยู่ในกรอบวงรี');
                  }}
                  className="hover:underline flex items-center gap-1 cursor-pointer text-slate-600"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ลองใหม่ / สแกนซ้ำ</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Step 5: ล็อกอินสำเร็จและแสดงข้อมูลคนไข้               */}
        {/* ---------------------------------------------------- */}
        {currentStep === 5 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-fadeIn text-center py-4">
            <div className="w-full max-w-[360px] bg-[#F8F9FA] border border-gray-200 rounded-3xl py-6 px-5 text-center shadow-lg flex flex-col items-center relative">
              <div className="inline-flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>ยืนยันตัวตนชีวมิติสำเร็จ 100%</span>
              </div>

              <div className="w-20 h-20 rounded-full border-4 border-emerald-400 bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                <Check className="w-10 h-10 stroke-[3.5]" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#0B2B2B] tracking-wide mb-3">
                เข้าสู่ระบบเรียบร้อย
              </h2>

              <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-xs text-center space-y-1">
                <h3 className="text-lg font-black text-emerald-800">
                  {activePatient.name}
                </h3>
                <p className="text-xs text-gray-500 font-bold">
                  รหัสคนไข้ HN: {activePatient.patient_code} | อายุ {activePatient.age} ปี
                </p>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="text-xs text-emerald-950 font-bold bg-emerald-50 py-1.5 px-2 rounded-xl">
                    การวินิจฉัย: {activePatient.notes || 'ข้อไหล่ติดระยะฟื้นฟู'}
                  </p>
                </div>
              </div>
            </div>

            {/* แถบนับถอยหลังซิงโครไนซ์ผ่าน useKioskCountdown */}
            <div className="w-full max-w-[360px] mt-4 space-y-2.5">
              <div className="bg-[#E6F9EE] border border-emerald-200 rounded-2xl py-2 px-3 text-center flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-900">
                  {step5Countdown.isPaused
                    ? 'หยุดเวลานับถอยหลังชั่วคราว'
                    : `ไปหน้ารายการกายภาพอัตโนมัติใน: ${step5Countdown.seconds} วินาที`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={step5Countdown.togglePause}
                  className="py-3 px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>{step5Countdown.isPaused ? 'เล่นต่อ' : 'หยุดเวลาไว้ก่อน'}</span>
                </button>

                <button
                  onClick={step5Countdown.proceedImmediately}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#0EA358] hover:bg-[#0C894A] text-white font-extrabold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>ไปต่อทันที</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Step 6: รายการกายภาพที่หมอเซ็ตไว้                    */}
        {/* ---------------------------------------------------- */}
        {currentStep === 6 && (
          <div className="w-full flex-1 flex flex-col items-center justify-between animate-fadeIn text-left py-1">
            <div className="w-full bg-gradient-to-b from-[#EAEAEA] to-[#D5D5D5] border-2 border-[#BEBEBE] rounded-2xl py-2 px-4 text-center shadow-md mb-2">
              <h2 className="text-base sm:text-lg font-black text-[#0B2B2B]">
                รายการกายภาพของวันนี้
              </h2>
            </div>

            {/* กล่องแพทย์ผู้ดูแล */}
            <div className="w-full bg-[#EBF7EE] border-2 border-[#76CA85] rounded-2xl p-2.5 shadow-sm flex items-start gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-emerald-700 flex-shrink-0 shadow-2xs mt-0.5">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-800">แพทย์ / นักกายภาพผู้ดูแล</span>
                </div>
                <h3 className="text-xs sm:text-sm font-black text-[#0B2B2B] truncate">
                  {activePlan?.therapistName || 'กภ. ธนากร วงศ์สวัสดิ์'}
                </h3>
                <p className="text-[11px] text-gray-700 font-bold truncate">
                  นักกายภาพบำบัดชำนาญการ • เวชศาสตร์ฟื้นฟูกล้ามเนื้อและกระดูก
                </p>
                <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                  {activePlan?.clinicalNotes || 'เน้นเพิ่มองศาการยกแขนด้านข้าง หลีกเลี่ยงการยกกระตุกเร็ว'}
                </p>
              </div>
            </div>

            {/* รายการท่าที่หมอกำหนด */}
            <div className="w-full flex-1 flex flex-col justify-start bg-slate-50/70 border border-slate-200 rounded-2xl p-2 space-y-1.5 overflow-hidden">
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900 px-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ท่าที่แพทย์กำหนด (3 ท่า)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {activePlan?.targetJoint || 'ข้อไหล่และสะบัก'}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
                {activePlan?.assignedExercises?.map((ex, idx) => (
                  <div
                    key={ex.exerciseSlug || idx}
                    className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs text-slate-800 block truncate">
                          {ex.exerciseName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">ระดับเริ่มต้น</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-black block">
                        {ex.sets} เซ็ต × {ex.reps} ครั้ง
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">ค้าง {ex.holdSeconds} วิ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ตัวเลือกสลับโหมด */}
            <div className="w-full grid grid-cols-2 gap-2 my-2">
              <button
                onClick={() => setSelectedTherapyType('physio')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTherapyType === 'physio'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>กายภาพบำบัด</span>
              </button>

              <button
                onClick={() => setSelectedTherapyType('minigame')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTherapyType === 'minigame'
                    ? 'bg-purple-50 text-purple-800 border-2 border-purple-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-purple-600" />
                <span>กายภาพมินิเกม</span>
              </button>
            </div>

            {/* ปุ่มคลังท่ายืด 11 ท่า */}
            <button
              onClick={() => {
                step6Countdown.togglePause();
                setShowStretchModal(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-between shadow-2xs mb-2 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>📋</span>
                <span>เลือกโปรแกรมยืดกล้ามเนื้อ 11 ท่า</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-black">
                {selectedStretchIds.length} ท่า
              </span>
            </button>

            {/* แถบตัวนับถอยหลังซิงโครไนซ์ */}
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {step6Countdown.isPaused
                      ? 'หยุดเวลานับถอยหลัง'
                      : `เริ่มทำกายภาพอัตโนมัติในอีก ${step6Countdown.seconds} วินาที`}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={step6Countdown.togglePause}
                  className="py-3 px-3.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[48px]"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>{step6Countdown.isPaused ? 'เล่นต่อ' : 'หยุดเวลา'}</span>
                </button>

                <button
                  onClick={() => handleProceedToExercise(selectedTherapyType)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#6FD67F] via-[#22c55e] to-[#1E8A4C] text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
                  id="btnStartWorkoutNow"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>เริ่มทำกายภาพ ({selectedTherapyType === 'physio' ? 'กายภาพบำบัด' : 'กายภาพมินิเกม'})</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* โมดอลเลือกและปรับเวลา 11 ท่ายืดกล้ามเนื้อ */}
      {showStretchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border-2 border-emerald-500 relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0B2B2B]">
                  📋 คลังโปรแกรมยืดเหยียด 11 ท่า
                </h3>
                <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                  นพ. กฤติณห์ (หมอเฟม) • ปรับเวลาค้างท่าได้อิสระ
                </p>
              </div>
              <button
                onClick={() => setShowStretchModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 text-xs font-bold text-slate-600 border-b border-slate-100">
              <span className="text-emerald-800">
                เลือกแล้ว {selectedStretchIds.length} จาก 11 ท่า
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStretchIds(STRETCH_EXERCISES.map((s) => s.id))}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStretchIds([])}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  ล้างการเลือก
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1 my-1">
              {STRETCH_EXERCISES.map((item) => {
                const isSelected = selectedStretchIds.includes(item.id);
                const currentHold = customHoldTimes[item.id] ?? item.holdSeconds;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border-2 transition ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStretchIds((prev) => [...prev, item.id]);
                            } else {
                              setSelectedStretchIds((prev) => prev.filter((id) => id !== item.id));
                            }
                          }}
                          className="w-5 h-5 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-[#0B2B2B]">
                              ท่า {item.number}: {item.name}
                            </span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                              {item.bodyArea}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.englishName} • {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] font-bold text-slate-500">เวลาค้าง</span>
                        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-1.5 py-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(10, currentHold - 5);
                              setCustomHoldTimes((prev) => ({ ...prev, [item.id]: next }));
                            }}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-xs text-emerald-800 w-8 text-center">
                            {currentHold}s
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(60, currentHold + 5);
                              setCustomHoldTimes((prev) => ({ ...prev, [item.id]: next }));
                            }}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStretchModal(false)}
                className="py-3 px-4 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition cursor-pointer min-h-[48px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={selectedStretchIds.length === 0}
                onClick={() => {
                  setShowStretchModal(false);
                  const queueToRun = STRETCH_EXERCISES.filter((s) => selectedStretchIds.includes(s.id));
                  handleProceedToExercise('physio', queueToRun);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer min-h-[48px] ${
                  selectedStretchIds.length > 0
                    ? 'bg-gradient-to-r from-[#6FD67F] via-[#22c55e] to-[#1E8A4C] hover:brightness-105 active:scale-95'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>เริ่มฝึกโปรแกรมที่เลือก ({selectedStretchIds.length} ท่า)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* โมดอล PIN สำหรับผู้สูงอายุ */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-[32px] p-5 shadow-2xl border-2 border-emerald-500 relative flex flex-col items-center">
            <button
              data-kiosk-target="pin-modal-close"
              onClick={() => {
                setShowPinModal(false);
                setPinError(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#1E8A4C] flex items-center justify-center mb-2 mt-1">
              <Key className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-[#0B2B2B]">
              เข้าสู่ระบบด้วยรหัส PIN
            </h3>
            <p className="text-xs text-slate-600 text-center mt-0.5">
              สำหรับผู้สูงอายุ หรือเมื่อไม่สะดวกสแกนใบหน้า
            </p>

            <div className="w-full bg-slate-50 border-2 border-emerald-300 rounded-2xl py-3 px-4 my-3 text-center">
              <span className="font-mono text-2xl font-black tracking-widest text-emerald-800">
                {pinInput ? pinInput.replace(/./g, '● ') : 'ป้อน PIN 4-6 หลัก'}
              </span>
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-bold mb-2 animate-bounce">
                {pinError}
              </p>
            )}

            {import.meta.env.DEV && (
              <div className="w-full mb-3">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  บัญชีคนไข้ตัวอย่าง (แตะเพื่อเข้าทันที):
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    onClick={() =>
                      handleSelectQuickPatient(
                        {
                          id: 12,
                          patient_code: 'P-0012',
                          name: 'นายสมชาย ใจดี',
                          age: 68,
                          gender: 'male',
                          notes: 'ข้อไหล่ติดระยะฟื้นฟู',
                        },
                        '1234'
                      )
                    }
                    className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-left truncate cursor-pointer"
                  >
                    🟢 นายสมชาย (1234)
                  </button>
                  <button
                    onClick={() =>
                      handleSelectQuickPatient(
                        {
                          id: 13,
                          patient_code: 'P-0013',
                          name: 'นางเพ็ญศรี สุขเกษม',
                          age: 72,
                          gender: 'female',
                          notes: 'กล้ามเนื้อขาอ่อนแรง',
                        },
                        '5678'
                      )
                    }
                    className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-left truncate cursor-pointer"
                  >
                    🟢 นางเพ็ญศรี (5678)
                  </button>
                </div>
              </div>
            )}

            <div className="w-full grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinDigit(digit)}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-emerald-100 text-slate-800 font-black text-xl active:scale-95 transition shadow-sm border border-slate-200 cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handlePinClear}
                className="h-12 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm active:scale-95 transition cursor-pointer"
              >
                ล้าง
              </button>

              <button
                onClick={() => handlePinDigit('0')}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-emerald-100 text-slate-800 font-black text-xl active:scale-95 transition shadow-sm border border-slate-200 cursor-pointer"
              >
                0
              </button>

              <button
                onClick={handlePinBackspace}
                className="h-12 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm active:scale-95 transition cursor-pointer"
              >
                ลบ ⌫
              </button>
            </div>

            <button
              onClick={handleVerifyPinSubmit}
              className="w-full mt-3 py-3 rounded-2xl bg-[#1E8A4C] hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg active:scale-95 transition cursor-pointer"
            >
              ยืนยันรหัส PIN และเข้าสู่ระบบ
            </button>
          </div>
        </div>
      )}

      {/* แถบสลับดูแต่ละภาพ (Step Switcher 1-6 สำหรับทดสอบและสาธิต) */}
      {isExplicitDemo && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-md w-full">
          {[
            { step: 1, title: 'ภาพ 1: พักหน้าจอ' },
            { step: 2, title: 'ภาพ 2: พร้อมกายภาพ' },
            { step: 3, title: 'ภาพ 3: ยืนยันระบบ' },
            { step: 4, title: 'ภาพ 4: สแกนใบหน้า' },
            { step: 5, title: 'ภาพ 5: ล็อกอินสำเร็จ' },
            { step: 6, title: 'ภาพ 6: รายการหมอเซ็ต' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => changeStep(item.step)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition shadow-sm cursor-pointer ${
                currentStep === item.step
                  ? 'bg-[#1E8A4C] text-white border border-emerald-600 scale-105'
                  : 'bg-white/90 text-slate-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      {/* ปุ่มทางลัดมุมล่าง */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 z-30">
        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            className="bg-white/95 hover:bg-emerald-50 border border-emerald-300 text-[#1E8A4C] font-bold text-xs px-3.5 py-2 rounded-full shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="เกี่ยวกับระบบ"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เกี่ยวกับระบบ</span>
          </button>
        )}

        <button
          onClick={onOpenHospitalPortal}
          className="bg-white/95 hover:bg-emerald-50 border-2 border-[#1E8A4C] text-[#1E8A4C] font-bold text-xs px-3.5 py-2 rounded-full shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          id="btnKioskHospitalPortal"
          title="เข้าสู่ระบบบุคลากร / รพ."
        >
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>ระบบบุคลากร / รพ.</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* Hand Tracking Virtual Touch Cursor & 1.0s Circular Dwell          */}
      {/* จัดการผ่าน Ref โดยตรง ไม่ผ่าน React State Render ทุกเฟรม          */}
      {/* ================================================================= */}
      <div
        ref={cursorElementRef}
        className="fixed pointer-events-none z-50 opacity-0 will-change-transform"
        style={{
          left: '0px',
          top: '0px',
          transform: 'translate3d(-100px, -100px, 0)',
          margin: '-32px 0 0 -32px',
        }}
      >
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-16 h-16 -rotate-90 filter drop-shadow-[0_0_10px_rgba(34,197,94,0.9)]">
            <circle
              cx="32"
              cy="32"
              r="24"
              fill="rgba(0, 0, 0, 0.45)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="4"
            />
            <circle
              ref={cursorProgressCircleRef}
              cx="32"
              cy="32"
              r="24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              strokeDasharray="150.8"
              strokeDashoffset="150.8"
              strokeLinecap="round"
            />
          </svg>

          <div className="w-5 h-5 rounded-full bg-teal-400 border-2 border-white shadow-[0_0_12px_#14b8a6] absolute" />

          <div
            ref={cursorLabelRef}
            className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 text-emerald-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-400/60 shadow-lg opacity-0 transition-opacity duration-150"
          >
            แตะค้าง 1 วินาที (0%)
          </div>
        </div>
      </div>

    </div>
  );
};
