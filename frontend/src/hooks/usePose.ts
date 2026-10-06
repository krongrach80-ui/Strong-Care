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

  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const noPoseFrameCountRef = useRef<number>(0);

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

  // When camera becomes active, switch off mock mode so user's real camera feed is tracked
  useEffect(() => {
    if (isCameraActive) {
      poseService.setMockMode(false);
      setIsMockModeState(false);
    }
  }, [isCameraActive]);

  const setMockMode = useCallback((val: boolean) => {
    poseService.setMockMode(val);
    setIsMockModeState(val);
  }, []);

  // Frame processing loop
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
      setLandmarks(mockPose);
      setHandLandmarks(null);
      setFaceLandmarks(null);
    } else if (videoRef.current && isCameraActive && videoRef.current.readyState >= 2) {
      const results = poseService.detectHolistic(videoRef.current, now);
      if (results && results.poseLandmarks) {
        noPoseFrameCountRef.current = 0;
        setLandmarks(results.poseLandmarks);
        setHandLandmarks(results.handLandmarks || null);
        setFaceLandmarks(results.faceLandmarks || null);
      } else {
        noPoseFrameCountRef.current++;
        if (noPoseFrameCountRef.current >= 15) {
          setLandmarks(null);
          setHandLandmarks(null);
          setFaceLandmarks(null);
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(processFrame);
  }, [videoRef, isCameraActive, exerciseSlug, isMockMode]);

  useEffect(() => {
    if (isCameraActive || isMockMode) {
      animationFrameId.current = requestAnimationFrame(processFrame);
    } else {
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
    handLandmarks,
    faceLandmarks,
    isModelLoading,
    modelError,
    fps,
    isMockMode,
    setMockMode,
  };
}
