import { useEffect, useRef, useState } from 'react';
import { ExerciseDefinition, LiveAnalysisFrame, RepResult } from '../types/exercise';
import { PoseLandmarks } from '../types/pose';
import { ExerciseAnalyzer } from '../services/exerciseService';
import { audioFeedback } from '../services/audioService';
import { voiceAssistant } from '../services/voiceAssistantService';
import { useSessionStore } from '../store/sessionStore';

export function useExercise(
  exercise: ExerciseDefinition | null,
  landmarks: PoseLandmarks | null,
  isEmergencyStop: boolean = false
) {
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null);
  const [analysis, setAnalysis] = useState<LiveAnalysisFrame | null>(null);
  const [primaryJoint, setPrimaryJoint] = useState<{ x: number; y: number } | null>(null);

  const addRepResult = useSessionStore((s) => s.addRepResult);
  const updateLiveFrame = useSessionStore((s) => s.updateLiveFrame);
  const finishSession = useSessionStore((s) => s.finishSession);

  const [biomechanics, setBiomechanics] = useState<import('../biomechanics/types').BiomechanicsFrame | null>(null);

  // Propagate Emergency Stop watchdog status to analyzer immediately
  useEffect(() => {
    if (analyzerRef.current) {
      analyzerRef.current.setEmergencyStop(isEmergencyStop);
    }
  }, [isEmergencyStop]);

  // Initialize or re-create analyzer when exercise changes
  useEffect(() => {
    if (!exercise) return;

    analyzerRef.current = new ExerciseAnalyzer(exercise, (repResult: RepResult) => {
      audioFeedback.playRepSuccess();
      addRepResult(repResult);

      // Level 2 Voice: Rep counter speech
      voiceAssistant.speakExercise(`ดีมากครับ ครบ ${repResult.rep_number} ครั้งแล้วครับ`, {
        priority: 'success',
        key: `rep_complete_${repResult.rep_number}`,
        cooldown: 2000,
        chime: true,
      });
    });

    if (analyzerRef.current) {
      analyzerRef.current.setEmergencyStop(isEmergencyStop);
    }

    return () => {
      analyzerRef.current = null;
    };
  }, [exercise, addRepResult]);

  // Analyze landmarks on each frame
  useEffect(() => {
    if (!analyzerRef.current || !landmarks || !exercise) return;

    const result = analyzerRef.current.analyze(landmarks);
    setAnalysis(result.frame);
    setBiomechanics(result.biomechanicsFrame);
    setPrimaryJoint(result.primaryJointPoint);
    updateLiveFrame(result.frame);

    // Audio cues for hold phase ticks or warnings (ONLY when not stopped!)
    if (!isEmergencyStop && result.frame.state === 'HOLD') {
      audioFeedback.playHoldTick();
    }

    // Biomechanics & Pose Voice Feedback Manager
    if (result.frame) {
      const feedbackMsgs = result.frame.feedback || [];
      const isPostureBad = !result.frame.isCorrect;
      const state = result.frame.state;
      const angle = result.frame.currentAngle;
      const targetAngle = exercise.target_angle;

      // 1. Posture Compensation / Trunk Lean (Critical)
      if (isPostureBad || feedbackMsgs.some((m) => m.includes('เอียง') || m.includes('โกง') || m.includes('ปรับท่า'))) {
        voiceAssistant.speakExercise('กรุณาปรับท่าทางก่อนครับ ตัวตรงนะครับ', {
          priority: 'critical',
          key: 'posture_lean_warning',
          cooldown: 4500,
          chime: true,
        });
      }
      // 2. Jerky / Too Fast Movement
      else if (feedbackMsgs.some((m) => m.includes('ช้าลง') || m.includes('เร็ว') || m.includes('กระตุก') || m.includes('อย่ารีบ'))) {
        voiceAssistant.speakExercise('ค่อย ๆ ยกนะครับ อย่ารีบครับ', {
          priority: 'warning',
          key: 'speed_warning',
          cooldown: 4000,
        });
      }
      // 3. Insufficient ROM / Angle not reached yet in UP/DOWN motion
      else if ((state === 'UP' || state === 'DOWN') && Math.abs(angle - targetAngle) > 22) {
        const bodyPartPrompt = exercise.slug.includes('squat')
          ? 'ย่อเข่าลงอีกเล็กน้อยครับ'
          : exercise.slug.includes('leg')
          ? 'ยกขาขึ้นอีกเล็กน้อยครับ'
          : 'ยกแขนขึ้นอีกเล็กน้อยครับ';

        voiceAssistant.speakExercise(bodyPartPrompt, {
          priority: 'warning',
          key: 'rom_insufficient',
          cooldown: 4500,
        });
      }
      // 4. In HOLD phase: Hold still
      else if (state === 'HOLD') {
        voiceAssistant.speakExercise('ดีมากครับ ค้างท่าไว้นิ่งๆ ครับ', {
          priority: 'instruction',
          key: 'hold_phase_instruction',
          cooldown: 5000,
        });
      }
      // 5. Correct posture encouragement
      else if (result.frame.stabilityScore >= 85 && (state === 'UP' || state === 'DOWN')) {
        voiceAssistant.speakExercise('ดีมากครับ ทำได้ถูกต้องครับ', {
          priority: 'instruction',
          key: 'good_posture_encourage',
          cooldown: 7000,
        });
      }
    }
  }, [landmarks, updateLiveFrame, exercise, isEmergencyStop]);

  return {
    analysis,
    biomechanics,
    primaryJoint,
    history: analyzerRef.current ? analyzerRef.current.getHistory() : [],
    finishSession,
  };
}
