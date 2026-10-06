import { useState, useEffect, useRef, useCallback } from 'react';
import { poseService } from '../services/poseService';
import { PoseLandmarks } from '../types/pose';

export function usePose(videoRef: React.RefObject<HTMLVideoElement>, isCameraActive: boolean, exerciseSlug?: string) {
  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [handLandmarks, setHandLandmarks] = useState<PoseLandmarks[] | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<PoseLandmarks | null>(null);

  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [isMockMode, setIsMockModeState] = useState<boolean>(poseService.getIsMockMode());

  const landmarksRef = useRef<PoseLandmarks | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const noPoseFrameCountRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastUiUpdateRef = useRef<number>(0);

  // Initialize offline models (Pose, Hands, Face)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsModelLoading(true);
        await poseService.initialize();
        if (isMounted) {
          setIsModelLoading(false);
          setIsMockModeState(poseService.getIsMockMode());
          if (poseService.getErrorMessage()) {
            setModelError(poseService.getErrorMessage());
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('Pose model loading warning:', err);
          setIsModelLoading(false);
          setModelError(poseService.getErrorMessage() || 'ไม่สามารถดาวน์โหลดโมเดลตรวจจับท่าทางได้ กรุณาตรวจสอบอินเทอร์เน็ต');
          setIsMockModeState(poseService.getIsMockMode());
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // When camera becomes active, verify real landmarker readiness before switching off mock mode
  useEffect(() => {
    if (isCameraActive) {
      const realLandmarker = poseService.getPoseLandmarker();
      if (!realLandmarker) {
        // Real model failed to initialize!
        const errMsg = poseService.getErrorMessage() || 'โมเดลตรวจจับท่าทาง (MediaPipe PoseLandmarker) ไม่พร้อมใช้งาน';
        console.warn('⚠️ PoseLandmarker is not ready:', errMsg);
        setModelError(errMsg);
      } else {
        poseService.setMockMode(false);
        setIsMockModeState(false);
        setModelError(null);
      }
    }
  }, [isCameraActive]);

  const setMockMode = useCallback((val: boolean) => {
    poseService.setMockMode(val);
    setIsMockModeState(val);
  }, []);

  // Frame processing loop with video timestamp gating and React render throttling
  const processFrame = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;

    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (isMockMode) {
      const mockPose = poseService.generateSyntheticPose(exerciseSlug || 'shoulder_raise');
      landmarksRef.current = mockPose;

      // Throttle React state update to ~22 fps
      if (now - lastUiUpdateRef.current >= 45) {
        setLandmarks(mockPose);
        setHandLandmarks(null);
        setFaceLandmarks(null);
        lastUiUpdateRef.current = now;
      }
    } else if (videoRef.current && isCameraActive && videoRef.current.readyState >= 2) {
      const video = videoRef.current;

      // Video frame check: Avoid running inference on static duplicate frames
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        const results = poseService.detectHolistic(video, now);
        if (results && results.poseLandmarks) {
          noPoseFrameCountRef.current = 0;
          landmarksRef.current = results.poseLandmarks;

          // Throttle React state updates to ~22 fps to avoid heavy React re-renders
          if (now - lastUiUpdateRef.current >= 45) {
            setLandmarks(results.poseLandmarks);
            setHandLandmarks(results.handLandmarks || null);
            setFaceLandmarks(results.faceLandmarks || null);
            lastUiUpdateRef.current = now;
          }
        } else {
          noPoseFrameCountRef.current++;
          if (noPoseFrameCountRef.current >= 15) {
            landmarksRef.current = null;
            if (now - lastUiUpdateRef.current >= 45) {
              setLandmarks(null);
              setHandLandmarks(null);
              setFaceLandmarks(null);
              lastUiUpdateRef.current = now;
            }
          }
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(processFrame);
  }, [videoRef, isCameraActive, exerciseSlug, isMockMode]);

  useEffect(() => {
    if (isCameraActive || isMockMode) {
      animationFrameId.current = requestAnimationFrame(processFrame);
    } else {
      landmarksRef.current = null;
      setLandmarks(null);
      setHandLandmarks(null);
      setFaceLandmarks(null);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, isMockMode, processFrame]);

  return {
    landmarks,
    landmarksRef,
    handLandmarks,
    faceLandmarks,
    isModelLoading,
    modelError,
    fps,
    isMockMode,
    setMockMode,
  };
}
