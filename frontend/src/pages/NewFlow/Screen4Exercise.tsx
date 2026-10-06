import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  Check,
  Send,
  HelpCircle,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  OctagonAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCamera } from '../../hooks/useCamera';
import { usePose } from '../../hooks/usePose';
import { poseService } from '../../services/poseService';
import { useExercise } from '../../hooks/useExercise';
import { ExerciseDefinition, ExercisePhase, ExerciseConfig } from '../../types/exercise';
import {
  StretchExerciseItem,
  STRETCH_PROGRAM_METADATA,
  getStretchVideoEmbedUrl,
  getStretchVideoWatchUrl,
  getExerciseUnifiedConfig,
} from '../../data/stretchExercises';
import { StretchStickFigure } from '../../components/StickFigure/StretchStickFigure';
import { ExerciseInstructionCard } from '../../components/Exercise/ExerciseInstructionCard';
import { ExercisePosePreview } from '../../components/Exercise/ExercisePosePreview';
import { ExerciseVideoModal } from '../../components/VideoPlayer/ExerciseVideoModal';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { api } from '../../services/api';
import { OfflineStorageService } from '../../services/offlineStorageService';
import { Session } from '../../types/session';
import { SafetyEngine, SafetyTelemetry } from '../../biomechanics/SafetyEngine';
import { evaluateStretchPose } from '../../biomechanics/stretchEvaluator';

interface Screen4ExerciseProps {
  onBack: () => void;
  onOpenTherapistModal: (score: number | null, poseName: string, romAngle: number | null) => void;
  selectedExercise: ExerciseDefinition | null;
  stretchQueue?: StretchExerciseItem[];
  customHoldTimes?: Record<string, number>;
  patientId?: number;
  isGameMode?: boolean;
}

export const Screen4Exercise: React.FC<Screen4ExerciseProps> = ({
  onBack,
  onOpenTherapistModal,
  selectedExercise,
  stretchQueue,
  customHoldTimes,
  patientId = 1,
  isGameMode = false,
}) => {
  // Check if we are running in Stretch Queue Mode
  const isStretchMode = Boolean(stretchQueue && stretchQueue.length > 0);
  const queue = useMemo(() => stretchQueue || [], [stretchQueue]);

  // Unified Exercise Queue (Supports 11 Stretches as well as Physio Exercises like Alternating Knee Raise)
  const unifiedQueue: ExerciseConfig[] = useMemo(() => {
    if (isStretchMode && queue.length > 0) {
      return queue.map((item) => getExerciseUnifiedConfig(item));
    }
    if (selectedExercise) {
      return [getExerciseUnifiedConfig(selectedExercise)];
    }
    return [getExerciseUnifiedConfig(null)]; // Defaults to Alternating Knee Raise
  }, [isStretchMode, queue, selectedExercise]);

  // Queue Progression States
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSide, setCurrentSide] = useState<'left' | 'right' | 'both'>('left');
  const [isSwitchingSide, setIsSwitchingSide] = useState<boolean>(false);
  const [switchCountdown, setSwitchCountdown] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompletedAll, setIsCompletedAll] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isStepsModalOpen, setIsStepsModalOpen] = useState<boolean>(false);
  const [pipPosition, setPipPosition] = useState<'right' | 'left'>('right');
  const [isPipMinimized, setIsPipMinimized] = useState<boolean>(false);

  // Time & Score Tracking
  const currentStretch = isStretchMode ? queue[currentIndex] || queue[0] : null;
  const currentExerciseConfig: ExerciseConfig = unifiedQueue[currentIndex] || unifiedQueue[0];
  const prevExerciseConfig: ExerciseConfig | null = currentIndex > 0 ? unifiedQueue[currentIndex - 1] : null;
  const nextExerciseConfig: ExerciseConfig | null = currentIndex < unifiedQueue.length - 1 ? unifiedQueue[currentIndex + 1] : null;

  // Helper to resolve customized duration for any pose
  const getPoseHoldSeconds = useCallback(
    (item: StretchExerciseItem | null) => {
      if (!item) return 20;
      if (customHoldTimes && customHoldTimes[item.id] !== undefined) {
        return customHoldTimes[item.id];
      }
      return item.holdSeconds;
    },
    [customHoldTimes]
  );

  const initialSeconds = currentStretch ? getPoseHoldSeconds(currentStretch) : 20;
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [totalElapsedTimeSec, setTotalElapsedTimeSec] = useState<number>(0);
  const [poseScores, setPoseScores] = useState<Record<string, number | null>>({});
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [completedPoseIds, setCompletedPoseIds] = useState<string[]>([]);
  const [skippedPoseIds, setSkippedPoseIds] = useState<string[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const hasSavedSessionRef = useRef<boolean>(false);

  // Preparation & Countdown State Machine
  const [exercisePhase, setExercisePhase] = useState<ExercisePhase>('PREPARING');
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const countdownTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Safety Watchdog
  const safetyEngineRef = useRef<SafetyEngine>(new SafetyEngine());
  const [safetyTelemetry, setSafetyTelemetry] = useState<SafetyTelemetry | null>(null);
  const [isSafetyHalted, setIsSafetyHalted] = useState<boolean>(false);

  // Setup Camera Hook
  const {
    videoRef,
    isCameraReady,
    isCameraLoading,
    cameraError,
    startCamera,
    stopCamera,
  } = useCamera();

  // Automatically start camera on mount for elderly kiosk users
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Pose Detection Hook
  const { landmarks, fps, modelError, isMockMode } = usePose(videoRef, isCameraReady, currentExerciseConfig?.targetPose || 'shoulder_raise');

  const videoDimensions = useMemo(() => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      return { width: video.videoWidth, height: video.videoHeight };
    }
    return undefined;
  }, [videoRef, isCameraReady]);

  // Biomechanics Analysis Hook
  const { analysis, biomechanics } = useExercise(selectedExercise, landmarks, isSafetyHalted, videoDimensions);

  // Canvas overlay for real-time skeletal drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clear running countdown timers safely
  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((t) => clearTimeout(t));
    countdownTimersRef.current = [];
  }, []);

  // State Machine Flow: PREPARING -> COUNTDOWN_3 -> COUNTDOWN_2 -> COUNTDOWN_1 -> READY -> ACTIVE
  const startExercisePreparation = useCallback((targetEx: ExerciseConfig) => {
    clearCountdownTimers();
    setIsSafetyHalted(false);
    setExercisePhase('PREPARING');
    setCountdownNumber(3);

    // AI Voice Step 1: "เตรียมตัวสำหรับ [ชื่อท่า]"
    voiceAssistant.speakInstruction(`เตรียมตัวสำหรับ ${targetEx.name}`, {
      key: `prep_${targetEx.id}`,
      force: true,
      cooldown: 500,
    });

    // Step 2: 3-2-1 Countdown
    const t1 = setTimeout(() => {
      setExercisePhase('COUNTDOWN_3');
      setCountdownNumber(3);
      voiceAssistant.speakInstruction('สาม', { key: 'count_3', force: true, cooldown: 200 });
    }, 1200);

    const t2 = setTimeout(() => {
      setExercisePhase('COUNTDOWN_2');
      setCountdownNumber(2);
      voiceAssistant.speakInstruction('สอง', { key: 'count_2', force: true, cooldown: 200 });
    }, 2200);

    const t3 = setTimeout(() => {
      setExercisePhase('COUNTDOWN_1');
      setCountdownNumber(1);
      voiceAssistant.speakInstruction('หนึ่ง', { key: 'count_1', force: true, cooldown: 200 });
    }, 3200);

    const t4 = setTimeout(() => {
      setExercisePhase('READY');
      voiceAssistant.speakInstruction('เริ่มได้เลย', { key: 'count_ready', force: true, cooldown: 200 });
    }, 4200);

    const t5 = setTimeout(() => {
      setExercisePhase('ACTIVE');
    }, 4800);

    countdownTimersRef.current = [t1, t2, t3, t4, t5];
  }, [clearCountdownTimers]);

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      clearCountdownTimers();
    };
  }, [clearCountdownTimers]);

  // Reset timer & start countdown ONLY on exercise index / side change
  useEffect(() => {
    if (currentExerciseConfig) {
      setTimeLeft(currentStretch ? getPoseHoldSeconds(currentStretch) : 20);
      setIsPaused(false);
      startExercisePreparation(currentExerciseConfig);
    }
  }, [currentIndex, currentSide]); // Strictly gated: NOT per-frame!

  // Continuous Clinical Safety Watchdog
  useEffect(() => {
    if (!landmarks || landmarks.length === 0 || !biomechanics || exercisePhase === 'IDLE') return;

    const effectiveEx: ExerciseDefinition = selectedExercise || {
      id: 1,
      name: currentExerciseConfig.name,
      slug: (currentExerciseConfig.targetPose as any) || 'shoulder_raise',
      category: 'Rehab',
      description: currentExerciseConfig.description,
      target_joint: 'shoulder',
      target_angle: currentExerciseConfig.targetAngle ?? 90,
      min_angle: 30,
      max_angle: currentExerciseConfig.targetRom ?? 110,
      target_reps: currentExerciseConfig.recommendedReps ?? 10,
      difficulty: 'beginner',
    };

    const telemetry = safetyEngineRef.current.evaluate(biomechanics, landmarks, effectiveEx);
    setSafetyTelemetry(telemetry);

    // If critical safety stop is triggered, override immediately!
    if (telemetry.state === 'STOP' || telemetry.isEmergencyStop) {
      if (exercisePhase !== 'SAFETY_STOP') {
        clearCountdownTimers();
        setExercisePhase('SAFETY_STOP');
        setIsSafetyHalted(true);

        const alertMsg = telemetry.activeViolations[0]?.voiceMessage || 'หยุดก่อนครับ ตรวจพบการเคลื่อนไหวที่ไม่ปลอดภัย';
        voiceAssistant.speakEmergency(alertMsg);
      }
    }
  }, [landmarks, biomechanics, exercisePhase, selectedExercise, currentExerciseConfig, clearCountdownTimers]);

  // Evaluate stretch posture adherence in real-time
  const stretchEval = useMemo(() => {
    if (!isStretchMode || !currentStretch) return null;
    const video = videoRef.current;
    const ar = (video && video.videoHeight > 0) ? (video.videoWidth / video.videoHeight) : 1.0;
    return evaluateStretchPose(landmarks, currentStretch, currentSide, ar);
  }, [isStretchMode, landmarks, currentStretch, currentSide, videoRef]);

  // Real-time posture status computation
  const realtimeStatus: 'ready' | 'adjust' | 'stop' | 'preparing' = useMemo(() => {
    if (exercisePhase === 'SAFETY_STOP' || safetyTelemetry?.state === 'STOP') {
      return 'stop';
    }
    if (exercisePhase !== 'ACTIVE') {
      return 'preparing';
    }
    if (!isCameraReady) {
      return 'ready';
    }
    if (isStretchMode && landmarks && landmarks.length > 0) {
      if (stretchEval && !stretchEval.isHoldingPose) {
        return 'adjust';
      }
      return 'ready';
    }
    if (analysis) {
      if (!analysis.isCorrect || (safetyTelemetry && safetyTelemetry.state === 'WARNING')) {
        return 'adjust';
      }
      return 'ready';
    }
    return 'ready';
  }, [exercisePhase, safetyTelemetry, isCameraReady, isStretchMode, landmarks, stretchEval, analysis]);

  const statusMessage = useMemo(() => {
    if (exercisePhase === 'SAFETY_STOP' || safetyTelemetry?.state === 'STOP') {
      return safetyTelemetry?.activeViolations[0]?.message || 'ตรวจพบการเคลื่อนไหวที่ไม่ปลอดภัย';
    }
    if (exercisePhase === 'PREPARING') return 'เตรียมท่าให้พร้อม...';
    if (exercisePhase === 'COUNTDOWN_3' || exercisePhase === 'COUNTDOWN_2' || exercisePhase === 'COUNTDOWN_1') {
      return 'จัดตำแหน่งร่างกายให้ตรงหน้ากล้อง';
    }
    if (exercisePhase === 'READY') return 'เริ่มได้เลย!';
    if (isCameraReady && (!landmarks || landmarks.length === 0) && exercisePhase === 'ACTIVE') {
      return 'กรุณาเข้ามายืนในกรอบกล้องเพื่อเริ่มจับเวลา';
    }
    if (isStretchMode && isCameraReady && landmarks && landmarks.length > 0 && exercisePhase === 'ACTIVE') {
      if (stretchEval) {
        return stretchEval.feedback;
      }
    }
    if (realtimeStatus === 'adjust') {
      if (analysis && analysis.feedback && analysis.feedback.length > 0) {
        return analysis.feedback[0];
      }
      return 'กรุณาปรับท่าทางให้ตรงตามคำแนะนำ';
    }
    return 'ทำท่าได้ถูกต้อง รักษาระดับไว้';
  }, [exercisePhase, safetyTelemetry, realtimeStatus, analysis, isCameraReady, landmarks, isStretchMode, stretchEval]);

  // Total elapsed workout timer
  useEffect(() => {
    if (isCompletedAll || isPaused || isSafetyHalted) return;
    const interval = setInterval(() => {
      setTotalElapsedTimeSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompletedAll, isPaused, isSafetyHalted]);

  // Auto-save summary to backend (IndexedDB first, then server sync)
  const handleAutoSaveSummary = useCallback(
    async (
      customPoseScores?: Record<string, number | null>,
      customCompleted?: string[],
      customSkipped?: string[]
    ) => {
      if (hasSavedSessionRef.current) return;

      if (poseService.getIsMockMode()) {
        console.info('ℹ️ เซสชันมาจากโหมดจำลอง (Mock Mode) - ข้ามการบันทึกข้อมูล');
        return;
      }

      const scoresToUse = customPoseScores || poseScores;
      const completedToUse = customCompleted || completedPoseIds;
      const skippedToUse = customSkipped || skippedPoseIds;

      const validScores = Object.values(scoresToUse).filter(
        (s): s is number => typeof s === 'number' && !isNaN(s)
      );
      const calculatedAvgScore =
        validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : null;

      const pad = (n: number) => String(n).padStart(2, '0');
      const toLocalDT = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      const totalCount = unifiedQueue.length;
      const completedCount = completedToUse.length;
      const skippedCount = skippedToUse.length;

      const realExerciseId =
        selectedExercise && typeof selectedExercise.id === 'number' && selectedExercise.id > 0
          ? selectedExercise.id
          : 1;

      const sessionPayload: Session = {
        id: Date.now(),
        patient_id: patientId ?? 1,
        exercise_id: realExerciseId,
        started_at: toLocalDT(new Date(Date.now() - totalElapsedTimeSec * 1000)),
        ended_at: toLocalDT(new Date()),
        total_reps: totalCount,
        correct_reps: completedCount,
        accuracy: calculatedAvgScore ?? 0,
        avg_duration_per_rep: Math.round(totalElapsedTimeSec / Math.max(1, totalCount)),
        status: 'completed',
        notes: `ทำครบ ${completedCount} จาก ${totalCount} ท่า (ข้าม ${skippedCount} ท่า) เวลา ${Math.round(totalElapsedTimeSec / 60)} นาที ${calculatedAvgScore !== null ? `คะแนนเฉลี่ย ${calculatedAvgScore}%` : 'ไม่มีคะแนน (โหมดจับเวลา)'}`,
      };

      const safetyLogs = safetyEngineRef.current ? safetyEngineRef.current.getViolationLog() : [];
      hasSavedSessionRef.current = true;

      // 1. บันทึกลง IndexedDB (Local Offline-First) ก่อนเสมอ
      try {
        OfflineStorageService.saveLocalSession(sessionPayload, safetyLogs);
      } catch (dbErr) {
        console.error('IndexedDB save failed:', dbErr);
        setSaveErrorMessage(
          'เกิดข้อผิดพลาดในการบันทึกผลลง IndexedDB: ' +
            (dbErr instanceof Error ? dbErr.message : String(dbErr))
        );
        return;
      }

      // 2. ลองส่งขึ้นเซิร์ฟเวอร์
      try {
        await api.saveSession(sessionPayload);
        setSaveSuccessMessage('บันทึกผลการฝึกขึ้นเซิร์ฟเวอร์สำเร็จ');
      } catch (serverErr) {
        console.warn('Auto save session to server failed, queued for sync:', serverErr);
        OfflineStorageService.addToSyncQueue(sessionPayload);
        setSaveErrorMessage(
          'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ผลการฝึกถูกบันทึกในเครื่อง (IndexedDB) แล้ว และจะซิงก์อัตโนมัติเมื่อออนไลน์'
        );
      }
    },
    [
      poseScores,
      completedPoseIds,
      skippedPoseIds,
      unifiedQueue.length,
      selectedExercise,
      patientId,
      totalElapsedTimeSec,
    ]
  );

  // Handle phase completion (Switch Side or Proceed to Next Pose)
  const handlePhaseFinish = useCallback(() => {
    const poseKey = currentStretch ? currentStretch.id : currentExerciseConfig.id;

    // Record score for this pose
    const updatedScores: Record<string, number | null> = {
      ...poseScores,
      [poseKey]: liveScore,
    };
    setPoseScores(updatedScores);

    // Record as completed
    const updatedCompleted = Array.from(new Set([...completedPoseIds, poseKey]));
    setCompletedPoseIds(updatedCompleted);

    // If pose has 2 sides and currently on 'left', switch to 'right'
    if (currentStretch && currentStretch.sides === 'both_sides' && currentSide === 'left') {
      setIsSwitchingSide(true);
      setSwitchCountdown(3);

      voiceAssistant.speakExercise('ดีมากครับ ตอนนี้สลับเป็นข้างขวาครับ', {
        key: 'stretch_switch_right',
        priority: 'instruction',
        force: true,
      });

      const switchTimer = setInterval(() => {
        setSwitchCountdown((cnt) => {
          if (cnt <= 1) {
            clearInterval(switchTimer);
            setIsSwitchingSide(false);
            setCurrentSide('right');
            setTimeLeft(getPoseHoldSeconds(currentStretch));
            return 3;
          }
          return cnt - 1;
        });
      }, 1000);

      return;
    }

    // Finished this pose (or finished both sides)
    voiceAssistant.speakExercise(`ดีมากครับ ทำท่า ${currentExerciseConfig.name} ครบแล้วครับ`, {
      priority: 'success',
      cooldown: 1500,
    });

    if (currentIndex < unifiedQueue.length - 1) {
      // Advance to next exercise
      setCurrentIndex((idx) => idx + 1);
      setCurrentSide('left');
    } else {
      // Completed all exercises in queue!
      setIsCompletedAll(true);
      setExercisePhase('COMPLETED');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}

      if (updatedCompleted.length === unifiedQueue.length) {
        voiceAssistant.speakResult(
          'ยอดเยี่ยมมากครับ คุณทำกายภาพบำบัดครบทุกท่าแล้วครับ วันนี้ทำได้ดีเยี่ยมมากครับ',
          {
            key: 'stretch_complete_all',
            priority: 'success',
            force: true,
          }
        );
      } else {
        voiceAssistant.speakResult(
          `การฝึกเสร็จสิ้น ทำครบ ${updatedCompleted.length} จาก ${unifiedQueue.length} ท่าครับ`,
          {
            key: 'stretch_complete_partial',
            priority: 'success',
            force: true,
          }
        );
      }

      // Auto-save session to backend with finalized scores (including this last pose!)
      handleAutoSaveSummary(updatedScores, updatedCompleted, skippedPoseIds);
    }
  }, [
    currentStretch,
    currentExerciseConfig,
    currentSide,
    currentIndex,
    unifiedQueue.length,
    liveScore,
    poseScores,
    completedPoseIds,
    skippedPoseIds,
    getPoseHoldSeconds,
    handleAutoSaveSummary,
  ]);

  // Main countdown timer for hold phase (strictly paused during preparation / countdown or when posture is off!)
  useEffect(() => {
    if (!isStretchMode || isPaused || isCompletedAll || isSwitchingSide || exercisePhase !== 'ACTIVE' || isSafetyHalted) return;

    // ถ้าเปิดกล้องอยู่ ให้เริ่มนับเวลาค้างเมื่อทำท่าทางถูกต้องเท่านั้น (stretchEval.isHoldingPose)
    if (isCameraReady) {
      if (!landmarks || landmarks.length === 0) {
        return;
      }
      if (stretchEval && !stretchEval.isHoldingPose) {
        return; // Pauses countdown until stretch posture is adopted!
      }
    }

    if (timeLeft <= 0) {
      handlePhaseFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [
    timeLeft,
    isPaused,
    isCompletedAll,
    isSwitchingSide,
    isStretchMode,
    exercisePhase,
    isSafetyHalted,
    isCameraReady,
    landmarks,
    stretchEval,
    handlePhaseFinish,
  ]);

  // Calculate live score from landmarks or stretch evaluator using dynamic target and tolerance
  useEffect(() => {
    if (isCameraReady && landmarks && landmarks.length > 0) {
      if (isStretchMode && stretchEval) {
        setLiveScore(stretchEval.isHoldingPose ? stretchEval.score : Math.max(30, stretchEval.score - 20));
      } else if (currentExerciseConfig && analysis) {
        const target = currentExerciseConfig.targetAngle || 90;
        const tol = (currentExerciseConfig as any).toleranceDeg ?? (currentExerciseConfig as any).tolerance_angle ?? 15;
        const measuredAngle = analysis?.currentAngle ?? target;
        const diff = Math.abs(measuredAngle - target);

        let calculatedScore = 100;
        if (diff <= tol) {
          calculatedScore = Math.round(100 - (diff / Math.max(1, tol)) * 10);
        } else {
          const excess = (diff - tol) / Math.max(1, tol);
          calculatedScore = Math.max(0, Math.round(90 - excess * 45));
        }

        if (isNaN(calculatedScore)) {
          calculatedScore = 0;
        }
        setLiveScore(calculatedScore);
      } else {
        setLiveScore(null);
      }
    } else {
      setLiveScore(null);
    }
  }, [landmarks, isCameraReady, isStretchMode, stretchEval, currentExerciseConfig, analysis]);

  // Canvas skeletal rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isCameraReady) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    canvas.width = parent?.clientWidth || 400;
    canvas.height = parent?.clientHeight || 300;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (landmarks && landmarks.length > 0) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#4AE387'; // Mint green glow
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 8;

      const drawBone = (idx1: number, idx2: number) => {
        const p1 = landmarks[idx1];
        const p2 = landmarks[idx2];
        if (p1 && p2 && (p1.visibility ?? 1) > 0.3 && (p2.visibility ?? 1) > 0.3) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.stroke();
        }
      };

      drawBone(11, 12); // Shoulders
      drawBone(11, 13); // Left Upper Arm
      drawBone(13, 15); // Left Forearm
      drawBone(12, 14); // Right Upper Arm
      drawBone(14, 16); // Right Forearm
      drawBone(11, 23); // Left Torso
      drawBone(12, 24); // Right Torso
      drawBone(23, 24); // Hips
      drawBone(23, 25); // Left Thigh
      drawBone(24, 26); // Right Thigh
      drawBone(25, 27); // Left Shin
      drawBone(26, 28); // Right Shin

      [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
        const lm = landmarks[idx];
        if (lm && (lm.visibility ?? 1) > 0.3) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#1E8A4C';
          ctx.stroke();
        }
      });
    }
  }, [landmarks, isCameraReady]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Compute average score (excluding null timer-only scores)
  const averageScore = useMemo(() => {
    const scores = Object.values(poseScores).filter(
      (s): s is number => typeof s === 'number' && !isNaN(s)
    );
    if (scores.length === 0) return null;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }, [poseScores]);

  // Skip to next exercise
  const handleSkipNext = useCallback(() => {
    const poseKey = currentStretch ? currentStretch.id : currentExerciseConfig.id;
    const updatedSkipped = Array.from(new Set([...skippedPoseIds, poseKey]));
    setSkippedPoseIds(updatedSkipped);

    if (currentIndex < unifiedQueue.length - 1) {
      setCurrentIndex((i) => i + 1);
      setCurrentSide('left');
    } else {
      setIsCompletedAll(true);
      setExercisePhase('COMPLETED');
      handleAutoSaveSummary(poseScores, completedPoseIds, updatedSkipped);
    }
  }, [
    currentStretch,
    currentExerciseConfig,
    currentIndex,
    unifiedQueue.length,
    skippedPoseIds,
    completedPoseIds,
    poseScores,
    handleAutoSaveSummary,
  ]);

  // Back to previous exercise
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setCurrentSide('left');
    }
  };

  // Safe exit and save handler
  const handleExit = useCallback(async () => {
    if (!hasSavedSessionRef.current && totalElapsedTimeSec > 5) {
      await handleAutoSaveSummary();
    }
    onBack();
  }, [handleAutoSaveSummary, onBack, totalElapsedTimeSec]);

  // Resume after safety stop
  const handleResumeAfterSafety = () => {
    setIsSafetyHalted(false);
    setExercisePhase('ACTIVE');
    voiceAssistant.speakInstruction('จัดท่าทางตรงแล้ว เริ่มฝึกต่อได้เลยครับ', { force: true });
  };

  // Restart countdown from beginning
  const handleRestartCountdown = () => {
    setIsSafetyHalted(false);
    startExercisePreparation(currentExerciseConfig);
  };

  // --------------------------------------------------------------------------
  // Summary View when all exercises are complete
  // --------------------------------------------------------------------------
  if (isCompletedAll) {
    const totalMinutes = Math.floor(totalElapsedTimeSec / 60);
    const totalSeconds = totalElapsedTimeSec % 60;
    const completedCount = completedPoseIds.length;
    const skippedCount = skippedPoseIds.length;
    const totalCount = unifiedQueue.length;

    return (
      <div className="w-full max-w-[540px] mx-auto flex flex-col items-center animate-fadeIn relative z-10 py-4 px-2">
        <div className="w-full bg-white/95 backdrop-blur-xl border border-emerald-300 rounded-[32px] p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#1E8A4C] to-[#6FD67F] rounded-full mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2B2B]">
              {completedCount === totalCount
                ? 'ฝึกกายภาพสำเร็จครบทุกท่า!'
                : completedCount === 0
                ? 'ข้ามการฝึกทุกท่า'
                : `ทำครบ ${completedCount} จาก ${totalCount} ท่า`}
            </h2>
            <p className="text-sm sm:text-base font-semibold text-emerald-800">
              {completedCount === totalCount
                ? 'ยอดเยี่ยมมากครับ กล้ามเนื้อได้รับการฟื้นฟูและยืดคลายอย่างสมบูรณ์'
                : `ทำครบ ${completedCount} จาก ${totalCount} ท่า ข้าม ${skippedCount} ท่า`}
            </p>
          </div>

          {/* Error / Success Alerts */}
          {saveErrorMessage && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>{saveErrorMessage}</span>
            </div>
          )}
          {saveSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-[#E9FCEB] border border-emerald-200 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-800">ผลการฝึก</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#0B2B2B] mt-0.5">
                {completedCount}/{totalCount}
              </span>
              <span className="text-[11px] font-medium text-emerald-700">
                ข้าม {skippedCount} ท่า
              </span>
            </div>

            <div className="bg-[#E9FCEB] border border-emerald-200 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-800">เวลารวม</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#0B2B2B] mt-0.5">
                {totalMinutes}:{totalSeconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[11px] font-medium text-emerald-700">นาที</span>
            </div>

            <div className="bg-[#E9FCEB] border border-emerald-200 rounded-2xl p-3 flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-800">คะแนนเฉลี่ย</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#1E8A4C] mt-0.5">
                {averageScore !== null ? `${averageScore}%` : 'ไม่มีคะแนน'}
              </span>
              <span className="text-[11px] font-medium text-emerald-700">
                {averageScore !== null ? 'ความแม่นยำ' : 'โหมดจับเวลา'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExit}
              className="btn-primary-capsule !w-full !max-w-none shadow-lg text-base sm:text-lg min-h-[52px]"
            >
              เสร็จสิ้น กลับสู่เมนู
            </button>
          </div>
        </div>
      </div>
    );
  }

  const targetHoldSec = currentStretch ? getPoseHoldSeconds(currentStretch) : 20;
  const targetRepsCount = currentExerciseConfig.recommendedReps ?? 10;
  const currentRepsCount = analysis?.repCount ?? 0;

  const progressPercent = isStretchMode
    ? Math.min(100, Math.max(0, Math.round(((targetHoldSec - timeLeft) / Math.max(1, targetHoldSec)) * 100)))
    : Math.min(100, Math.round((currentRepsCount / Math.max(1, targetRepsCount)) * 100));

  return (
    <div className="w-full max-w-4xl h-full flex flex-col justify-between overflow-hidden relative z-10 px-1 sm:px-2 select-none animate-fadeIn mx-auto">
      {/* 1. Top Bar: Back Button + Exercise 3-Way Switcher + Action Badges */}
      <div className="w-full flex items-center justify-between py-1 px-1 flex-shrink-0 h-10 sm:h-11 border-b border-emerald-100/60 mb-0.5">
        {/* Left: Back to menu */}
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-emerald-300 text-xs sm:text-sm font-bold text-[#0B2B2B] hover:bg-emerald-50 transition active:scale-95 shadow-2xs cursor-pointer"
          aria-label="กลับสู่เมนูผู้ใช้"
        >
          <ArrowLeft className="w-4 h-4 text-[#1E8A4C]" />
          <span>กลับสู่เมนู</span>
        </button>

        {/* Center: 3-Exercise Quick Switcher */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`p-1.5 rounded-full transition ${
              currentIndex > 0
                ? 'text-[#0B2B2B] hover:bg-emerald-50 bg-white/90 border border-emerald-200 cursor-pointer shadow-2xs'
                : 'text-stone-300 bg-transparent border border-transparent cursor-default'
            }`}
            title="ท่าก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1E8A4C] animate-pulse" />
            <span className="text-xs sm:text-sm font-black text-[#0B2B2B] truncate max-w-[150px] sm:max-w-none">
              ท่า {currentIndex + 1}/{unifiedQueue.length}: {currentExerciseConfig.name}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkipNext}
            disabled={currentIndex === unifiedQueue.length - 1}
            className={`p-1.5 rounded-full transition ${
              currentIndex < unifiedQueue.length - 1
                ? 'text-[#0B2B2B] hover:bg-emerald-50 bg-white/90 border border-emerald-200 cursor-pointer shadow-2xs'
                : 'text-stone-300 bg-transparent border border-transparent cursor-default'
            }`}
            title="ท่าถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls: Steps Info + Camera Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isGameMode && (
            <div className="hidden min-[520px]:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-stone-900 font-extrabold text-[11px] shadow-2xs border border-amber-300">
              <Sparkles className="w-3 h-3 text-stone-900" />
              <span>🎮 โหมดมินิเกม</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsStepsModalOpen(true)}
            className="text-xs font-bold text-stone-700 bg-white/95 hover:bg-stone-50 border border-stone-200 px-2.5 sm:px-3 py-1.5 rounded-full transition flex items-center gap-1 shadow-2xs cursor-pointer"
            title="ดูวิธีฝึกและข้อควรระวังอย่างละเอียด"
          >
            <Info className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">วิธีฝึก</span>
          </button>

          {isCameraReady ? (
            <button
              onClick={() => stopCamera()}
              className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full hover:bg-rose-100 transition shadow-2xs cursor-pointer"
            >
              ปิดกล้อง
            </button>
          ) : (
            <button
              onClick={() => startCamera()}
              className="text-xs font-bold text-[#1E8A4C] bg-white border border-emerald-300 px-3 py-1.5 rounded-full hover:bg-emerald-50 transition shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>เปิดกล้อง</span>
            </button>
          )}
        </div>
      </div>

      {/* Model Loading Error Warning Banner if any */}
      {modelError && (
        <div className="w-full bg-amber-500/90 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl mb-1 flex items-center justify-center gap-2 z-20">
          <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
          <span>{modelError}</span>
        </div>
      )}

      {/* Prominent Mock Mode Warning Banner */}
      {isMockMode && (
        <div className="w-full bg-amber-600/95 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-xl mb-1 flex items-center justify-center gap-2 z-20 shadow-md border border-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-200 flex-shrink-0 animate-bounce" />
          <span>⚠️ กำลังใช้งานในโหมดจำลองท่าทาง (Mock Mode) - ข้อมูลไม่ใช่การตรวจจับจากร่างกายจริง</span>
        </div>
      )}

      {/* 2. FULLSCREEN VERTICAL SMART-MIRROR CAMERA (With Inset PiP Clip inside!) */}
      <div className="w-full flex-1 min-h-0 bg-stone-950 rounded-[28px] overflow-hidden relative border-2 border-emerald-400 shadow-xl flex items-center justify-center my-1 sm:my-1.5">
        
        {/* Live Patient Video Feed Element */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
            isCameraReady ? 'block' : 'hidden'
          }`}
          autoPlay
          playsInline
          muted
        />

        {/* Live Skeletal MediaPipe Landmarks Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none -scale-x-100 ${
            isCameraReady ? 'block' : 'hidden'
          }`}
        />

        {/* Silhouette Placeholder when camera is off */}
        {!isCameraReady && (
          <div
            className="w-full h-full flex flex-col items-center justify-center relative p-4 text-center cursor-pointer group"
            onClick={() => {
              if (!isCameraReady && !isCameraLoading) {
                startCamera();
              }
            }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-950/70 flex items-center justify-center text-emerald-400 mb-3 border-2 border-emerald-500/50 group-hover:scale-105 transition shadow-2xl">
              <Camera className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <span className="text-white font-black text-base sm:text-lg">
              {isCameraLoading ? 'กำลังเปิดกล้องตรวจจับ...' : 'แตะเพื่อเปิดกล้องตรวจจับท่าทาง (AI Live Feed)'}
            </span>
            <span className="text-emerald-300/80 text-xs sm:text-sm mt-1 max-w-sm font-medium">
              ระบบ AI จะตรวจจับข้อต่อโครงกระดูกของคุณแบบเรียลไทม์ พร้อมคำแนะนำความปลอดภัย
            </span>
          </div>
        )}

        {/* --- INSET OVERLAYS INSIDE THE CAMERA --- */}

        {/* A. Picture-in-Picture (PiP) Video of Doctor's Demo (คลิปหมอสาธิตในกล้อง) */}
        {currentExerciseConfig.demoVideoUrl && !isPipMinimized && (
          <div
            className={`absolute top-2.5 sm:top-3.5 ${
              pipPosition === 'right' ? 'right-2.5 sm:right-3.5' : 'left-2.5 sm:left-3.5'
            } z-20 w-48 xs:w-56 sm:w-64 md:w-72 bg-black/90 backdrop-blur-md rounded-2xl border-2 border-emerald-400 p-1.5 shadow-2xl transition-all duration-300 animate-fadeIn`}
          >
            {/* PiP Header */}
            <div className="flex items-center justify-between pb-1 px-1 border-b border-emerald-500/30 text-[11px] text-white font-bold">
              <div className="flex items-center gap-1.5 text-emerald-300 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate">👨‍⚕️ คลิปหมอสาธิต</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Swap Left/Right Corner */}
                <button
                  type="button"
                  onClick={() => setPipPosition((p) => (p === 'right' ? 'left' : 'right'))}
                  className="hover:bg-white/20 p-1 rounded-md transition text-emerald-200 cursor-pointer"
                  title={pipPosition === 'right' ? 'ย้ายคลิปไปมุมซ้าย' : 'ย้ายคลิปไปมุมขวา'}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                {/* Minimize PiP */}
                <button
                  type="button"
                  onClick={() => setIsPipMinimized(true)}
                  className="hover:bg-white/20 p-1 rounded-md transition text-stone-300 cursor-pointer"
                  title="ย่อคลิปวิดีโอ"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="w-full aspect-video rounded-xl overflow-hidden mt-1 bg-black">
              <ExercisePosePreview
                demoVideoUrl={currentExerciseConfig.demoVideoUrl}
                thumbnailUrl={currentExerciseConfig.thumbnailUrl}
                svgType={currentExerciseConfig.targetPose || 'neck_lateral'}
                name={currentExerciseConfig.name}
                englishName={currentExerciseConfig.englishName}
                activeSide={currentSide}
                isHighlighted={true}
                showVideoPlayer={true}
              />
            </div>
          </div>
        )}

        {/* Minimized PiP Button if user minimized it */}
        {currentExerciseConfig.demoVideoUrl && isPipMinimized && (
          <button
            type="button"
            onClick={() => setIsPipMinimized(false)}
            className={`absolute top-2.5 sm:top-3.5 ${
              pipPosition === 'right' ? 'right-2.5 sm:right-3.5' : 'left-2.5 sm:left-3.5'
            } z-20 bg-black/85 hover:bg-black backdrop-blur-md border-2 border-emerald-400 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl transition active:scale-95 cursor-pointer animate-fadeIn`}
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>👨‍⚕️ ดูคลิปหมอสาธิต</span>
          </button>
        )}

        {/* B. Floating Telemetry HUD (Placed in opposite corner from PiP video) */}
        <div
          className={`absolute top-2.5 sm:top-3.5 ${
            pipPosition === 'right' ? 'left-2.5 sm:left-3.5' : 'right-2.5 sm:right-3.5'
          } z-10 flex flex-col items-start gap-1.5 pointer-events-none`}
        >
          {/* Active Side Badge */}
          {currentSide !== 'both' && (
            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black shadow-lg border ${
                currentSide === 'left'
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-teal-600 text-white border-teal-400'
              }`}
            >
              <span>{currentSide === 'left' ? '👈 ข้างซ้าย' : '👉 ข้างขวา'}</span>
            </div>
          )}

          {/* AI Accuracy & FPS Pill */}
          {isCameraReady && (
            <div className="bg-black/80 backdrop-blur-md border border-emerald-400/50 text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-mono">
                {liveScore !== null ? `ความถูกต้อง: ${liveScore}%` : 'ไม่มีคะแนน (โหมดจับเวลา)'}
              </span>
              <span className="text-stone-400 font-normal">|</span>
              <span className="text-stone-300">{fps || 30} FPS</span>
            </div>
          )}
        </div>

        {/* C. Center 3-2-1 Giant Countdown Overlay */}
        {(isCameraReady || isMockMode) && (exercisePhase === 'PREPARING' ||
          exercisePhase === 'COUNTDOWN_3' ||
          exercisePhase === 'COUNTDOWN_2' ||
          exercisePhase === 'COUNTDOWN_1' ||
          exercisePhase === 'READY') && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-30 animate-fadeIn pointer-events-none">
            {exercisePhase === 'PREPARING' && (
              <div className="bg-white/95 text-[#0B2B2B] px-6 py-4 rounded-3xl shadow-2xl border-2 border-emerald-400 space-y-1 animate-scaleIn">
                <div className="text-xs sm:text-sm font-extrabold text-[#1E8A4C]">
                  เตรียมพร้อมสำหรับ
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0B2B2B]">
                  {currentExerciseConfig.name}
                </div>
                <div className="text-xs text-stone-500 font-semibold">
                  จัดตำแหน่งตัวให้อยู่หน้ากล้อง...
                </div>
              </div>
            )}

            {(exercisePhase === 'COUNTDOWN_3' ||
              exercisePhase === 'COUNTDOWN_2' ||
              exercisePhase === 'COUNTDOWN_1') && (
              <div className="bg-white/95 backdrop-blur-md px-8 py-5 rounded-3xl shadow-2xl border-2 border-emerald-400 flex flex-col items-center justify-center animate-scaleIn">
                <span className="text-xs font-black text-stone-500 uppercase tracking-widest mb-1">
                  เริ่มใน
                </span>
                <div
                  key={`cnt-${countdownNumber}`}
                  className="text-7xl sm:text-8xl font-black font-mono text-[#1E8A4C] leading-none drop-shadow-md scale-110 animate-bounce"
                >
                  {countdownNumber}
                </div>
                <span className="text-xs font-bold text-emerald-800 mt-2 bg-[#E9FCEB] px-3.5 py-1 rounded-full">
                  จัดท่าทางให้พร้อม
                </span>
              </div>
            )}

            {exercisePhase === 'READY' && (
              <div className="bg-white/95 backdrop-blur-md px-8 py-5 rounded-3xl shadow-2xl border-2 border-emerald-400 flex flex-col items-center justify-center animate-scaleIn">
                <div className="w-14 h-14 rounded-full bg-[#1E8A4C] text-white flex items-center justify-center mb-2 shadow-lg shadow-emerald-600/30">
                  <Play className="w-8 h-8 fill-white translate-x-0.5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#1E8A4C]">
                  เริ่มได้เลย!
                </div>
                <div className="text-xs font-semibold text-emerald-700 mt-1">
                  ระบบเริ่มตรวจจับท่าทางและนับรอบ
                </div>
              </div>
            )}
          </div>
        )}

        {/* D. Safety Stop Alert in Camera Center */}
        {isSafetyHalted && (
          <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-30 text-white animate-fadeIn">
            <OctagonAlert className="w-14 h-14 text-rose-400 mb-2 animate-bounce" />
            <h3 className="text-xl sm:text-2xl font-black text-rose-200 mb-1">
              หยุดชั่วคราวเพื่อความปลอดภัย
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-[340px] mb-4 leading-relaxed">
              {statusMessage || 'ตรวจพบการเคลื่อนไหวที่ไม่ปลอดภัยหรืออยู่นอกกรอบกล้อง'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResumeAfterSafety}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>จัดท่าแล้ว ทำต่อ</span>
              </button>
              <button
                type="button"
                onClick={handleRestartCountdown}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>นับเริ่มใหม่</span>
              </button>
            </div>
          </div>
        )}

        {/* E. Side Switching Overlay */}
        {isSwitchingSide && (
          <div className="absolute inset-0 bg-[#0B2B2B]/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-25 animate-fadeIn text-white text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E8A4C] flex items-center justify-center text-white mb-2 shadow-lg animate-bounce">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold mb-1">สลับทำข้างขวา</h3>
            <p className="text-xs sm:text-sm text-emerald-200 mb-3 font-medium">
              จัดท่าทางข้างขวาให้พร้อม เริ่มต้นใน {switchCountdown} วินาที...
            </p>
            <div className="text-3xl font-black font-mono bg-white/20 px-5 py-1 rounded-full">
              {switchCountdown}
            </div>
          </div>
        )}

        {/* F. BOTTOM FLOATING HUD (Posture Feedback + Progress Bar + Caution) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 z-15 flex flex-col gap-1.5 max-w-xl mx-auto pointer-events-auto">
          
          {/* 1) Posture Feedback Banner */}
          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-emerald-400/70 text-white text-xs sm:text-sm font-bold shadow-lg">
            <div className="flex items-center gap-2 truncate">
              {realtimeStatus === 'ready' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : realtimeStatus === 'adjust' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <OctagonAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span className="truncate">
                {statusMessage || (realtimeStatus === 'ready' ? 'ทำท่าได้ถูกต้อง รักษาระดับไว้' : 'เตรียมพร้อม')}
              </span>
            </div>
            <span className="text-[11px] text-emerald-300 font-bold bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
              {liveScore !== null ? `ความถูกต้อง: ${liveScore}%` : 'ไม่มีคะแนน (โหมดจับเวลา)'}
            </span>
          </div>

          {/* 2) Target Reps / Hold Time Progress */}
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-2 sm:p-2.5 text-white shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="text-stone-300">
                {isStretchMode ? 'เวลาค้างท่าเป้าหมาย' : 'จำนวนครั้งเป้าหมาย'}:
              </span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {isStretchMode
                    ? `${targetHoldSec - timeLeft} / ${targetHoldSec}`
                    : `${currentRepsCount} / ${targetRepsCount}`}
                </span>
                <span className="text-xs text-stone-400">
                  {isStretchMode ? 'วินาที' : 'ครั้ง'}
                </span>
              </div>
            </div>

            {/* Progress Bar Line */}
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6FD67F] to-[#1E8A4C] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3) Caution Tip Strip */}
          <div className="flex items-center gap-1.5 text-amber-200 bg-amber-950/85 backdrop-blur-md border border-amber-500/50 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs truncate font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">
              ข้อควรระวัง: {currentStretch?.caution || currentExerciseConfig.safetyTips[0]}
            </span>
          </div>
        </div>

      </div>

      {/* 3. PINNED BOTTOM ACTION CONTROLS BAR (Single Row, Never Scrolls Out!) */}
      <div className="w-full flex-shrink-0 grid grid-cols-4 gap-1.5 sm:gap-3 py-1 border-t border-emerald-100/60 mt-0.5 h-11 sm:h-12">
        {/* 1) Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`h-full rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 border ${
            currentIndex > 0
              ? 'bg-white border-emerald-300 text-[#0B2B2B] hover:bg-emerald-50 shadow-2xs cursor-pointer'
              : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
          }`}
          aria-label="ย้อนกลับไปท่าก่อนหน้า"
        >
          <SkipBack className="w-4 h-4 flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold">ท่าก่อนหน้า</span>
        </button>

        {/* 2) Pause / Resume Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`h-full rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md ${
            isPaused
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-600/30'
              : 'bg-[#1E8A4C] hover:bg-[#187540] text-white shadow-emerald-700/25'
          }`}
          aria-label={isPaused ? 'ทำต่อ' : 'พักชั่วคราว'}
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4 fill-white flex-shrink-0" />
              <span>ทำต่อ</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4 fill-white flex-shrink-0" />
              <span>พักชั่วคราว</span>
            </>
          )}
        </button>

        {/* 3) Skip Next Button */}
        <button
          onClick={handleSkipNext}
          className="h-full rounded-2xl bg-white border border-emerald-300 text-[#0B2B2B] font-bold text-xs sm:text-sm hover:bg-emerald-50 transition active:scale-95 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
          aria-label="ข้ามไปท่าถัดไป"
        >
          <span className="text-[11px] sm:text-xs font-bold">ข้ามท่า</span>
          <SkipForward className="w-4 h-4 flex-shrink-0" />
        </button>

        {/* 4) Tell Therapist Action Button */}
        <button
          onClick={() => {
            const rom = (analysis && typeof analysis.currentAngle === 'number' && !isNaN(analysis.currentAngle))
              ? Math.round(analysis.currentAngle)
              : null;
            const poseName = `ท่าที่ ${currentIndex + 1}: ${currentExerciseConfig.name}`;
            onOpenTherapistModal(liveScore, poseName, rom);
          }}
          className="h-full rounded-2xl bg-gradient-to-r from-[#6FD67F] to-[#1E8A4C] hover:brightness-105 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          id="btnNotifyTherapist"
        >
          <Send className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">ส่งผลให้นักกายภาพ</span>
        </button>
      </div>

      {/* 4. Steps & Caution Modal Dialog */}
      {isStepsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-emerald-300 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0B2B2B]">
                  วิธีฝึกท่า {currentExerciseConfig.name}
                </h3>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">
                  {currentExerciseConfig.englishName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStepsModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-emerald-900 block mb-1.5">
                  ขั้นตอนการปฏิบัติ:
                </span>
                <ol className="text-sm text-[#0B2B2B] space-y-2 list-decimal list-inside bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  {(currentStretch?.steps || currentExerciseConfig.safetyTips).map((step, idx) => (
                    <li key={idx} className="leading-snug">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-start gap-2 text-xs sm:text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">
                  ข้อควรระวัง: {currentStretch?.caution || currentExerciseConfig.safetyTips[0]}
                </span>
              </div>

              <div className="text-[11px] text-stone-500">
                อ้างอิง: {STRETCH_PROGRAM_METADATA.channel} ({STRETCH_PROGRAM_METADATA.instructor})
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsStepsModalOpen(false)}
                className="btn-primary-capsule !w-full !max-w-none min-h-[46px] text-sm font-bold"
              >
                เข้าใจแล้ว ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
