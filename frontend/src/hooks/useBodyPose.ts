import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose as MpPose } from '@mediapipe/pose';

export interface BodyKeypoint {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  z?: number;
  visibility?: number;
}

export interface BodyPoseResult {
  detected: boolean;
  landmarks: BodyKeypoint[];
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  posture: string;
  posture_th: string;
  isArmRaised: boolean;
  isProfile?: boolean;
  orientation?: 'FRONTAL' | 'PROFILE_LEFT' | 'PROFILE_RIGHT';
  headBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export const POSE_CONNECTIONS_MAP = [
  [11, 12], // Left Shoulder to Right Shoulder
  [11, 13], // Left Shoulder to Left Elbow
  [13, 15], // Left Elbow to Left Wrist
  [12, 14], // Right Shoulder to Right Elbow
  [14, 16], // Right Elbow to Right Wrist
  [11, 23], // Left Shoulder to Left Hip
  [12, 24], // Right Shoulder to Right Hip
  [23, 24], // Left Hip to Right Hip
  [23, 25], // Left Hip to Left Knee
  [25, 27], // Left Knee to Left Ankle
  [24, 26], // Right Hip to Right Knee
  [26, 28], // Right Knee to Right Ankle
  [15, 17], // Left Wrist to Left Pinky
  [15, 19], // Left Wrist to Left Index
  [16, 18], // Right Wrist to Right Pinky
  [16, 20], // Right Wrist to Right Index
  [0, 11],  // Neck/Nose to Left Shoulder
  [0, 12],  // Neck/Nose to Right Shoulder
];

export const useBodyPose = (
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true
) => {
  const poseRef = useRef<any>(null);
  const [poseData, setPoseData] = useState<BodyPoseResult | null>(null);
  const latestPoseRef = useRef<BodyPoseResult | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastSendTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Smoothing buffers for jitter-free 60FPS motion
  const prevLandmarksRef = useRef<BodyKeypoint[] | null>(null);
  const prevBoxRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;
    let retryTimer: any;
    let retries = 0;

    const initPose = async () => {
      if (isCancelled) return;
      try {
        const PoseConstructor = (window as any).Pose || MpPose;
        if (!PoseConstructor) {
          if (retries < 60) {
            retries++;
            retryTimer = setTimeout(initPose, 150);
          } else {
            console.warn('[Pose] Waiting for MediaPipe Pose timed out.');
          }
          return;
        }

        const isGhPages = typeof window !== 'undefined' && (
          window.location.pathname.includes('/Strong-Care') ||
          window.location.hostname.includes('github.io')
        );
        const origin = window.location.origin;
        const basePath = isGhPages ? `${origin}/Strong-Care` : origin;
        const pose = new PoseConstructor({
          locateFile: (file: string) => {
            if (file.startsWith('http://') || file.startsWith('https://')) return file;
            const clean = file.startsWith('/') ? file.slice(1) : file;
            return `${basePath}/mediapipe/pose/${clean}`;
          }
        });

        pose.setOptions({
          modelComplexity: 0, // Lite model: ultra fast, < 3MB, instant 60FPS in browser
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.20, // Highly sensitive for dim lighting / webcam selfie
          minTrackingConfidence: 0.20
        });

        pose.onResults((results: any) => {
          if (isCancelled) return;
          try {
            if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
              latestPoseRef.current = null;
              setPoseData(null);
              prevLandmarksRef.current = null;
              return;
            }

          const rawLms: BodyKeypoint[] = results.poseLandmarks;
          const prevLms = prevLandmarksRef.current;
          const video = videoRef.current;
          const vw = video?.videoWidth || 640;
          const vh = video?.videoHeight || 480;

          // 1. Exponential Moving Average (EMA) Landmark Smoothing
          const smoothedLms: BodyKeypoint[] = rawLms.map((cur, i) => {
            const prev = prevLms?.[i];
            if (!prev) return { ...cur };

            const curVis = cur.visibility ?? 1;
            const prevVis = prev.visibility ?? 1;
            if (curVis < 0.20 && prevVis > 0.30) {
              return { ...prev, visibility: prevVis * 0.9 };
            }

            const dist = Math.hypot(cur.x - prev.x, cur.y - prev.y);
            const alpha = Math.min(0.68, Math.max(0.24, dist * 6.0));
            return {
              x: prev.x + (cur.x - prev.x) * alpha,
              y: prev.y + (cur.y - prev.y) * alpha,
              z: prev.z !== undefined && cur.z !== undefined
                ? prev.z + (cur.z - prev.z) * alpha
                : cur.z,
              visibility: curVis
            };
          });
          prevLandmarksRef.current = smoothedLms;

          // 2. Compute tight bounding box covering visible body parts
          const validPoints = smoothedLms.filter((p) => (p.visibility ?? 1) > 0.20);
          const pts = validPoints.length > 4 ? validPoints : smoothedLms.slice(0, 25);

          const minX = Math.max(0, Math.min(...pts.map((p) => p.x)));
          const maxX = Math.min(1, Math.max(...pts.map((p) => p.x)));
          const minY = Math.max(0, Math.min(...pts.map((p) => p.y)));
          const maxY = Math.min(1, Math.max(...pts.map((p) => p.y)));

          const padX = 0.04;
          const padY = 0.04;

          const rawBoxX = Math.max(0, (minX - padX) * vw);
          const rawBoxY = Math.max(0, (minY - padY) * vh);
          const rawBoxW = Math.min(vw - rawBoxX, (maxX - minX + padX * 2) * vw);
          const rawBoxH = Math.min(vh - rawBoxY, (maxY - minY + padY * 2) * vh);

          // Smooth body bounding box
          let smoothBox = {
            x: Math.round(rawBoxX),
            y: Math.round(rawBoxY),
            width: Math.round(rawBoxW),
            height: Math.round(rawBoxH)
          };
          if (prevBoxRef.current) {
            const pb = prevBoxRef.current;
            smoothBox = {
              x: Math.round(pb.x + (rawBoxX - pb.x) * 0.30),
              y: Math.round(pb.y + (rawBoxY - pb.y) * 0.30),
              width: Math.round(pb.width + (rawBoxW - pb.width) * 0.30),
              height: Math.round(pb.height + (rawBoxH - pb.height) * 0.30)
            };
          }
          prevBoxRef.current = smoothBox;

          // 3. Side Profile & Orientation Detection
          const leftShoulder = smoothedLms[11];
          const rightShoulder = smoothedLms[12];
          const leftElbow = smoothedLms[13];
          const rightElbow = smoothedLms[14];
          const leftWrist = smoothedLms[15];
          const rightWrist = smoothedLms[16];
          const nose = smoothedLms[0];
          const leftEar = smoothedLms[7];
          const rightEar = smoothedLms[8];

          const shSpanX = Math.abs((leftShoulder?.x ?? 0) - (rightShoulder?.x ?? 0));
          const shSpanZ = Math.abs((leftShoulder?.z ?? 0) - (rightShoulder?.z ?? 0));

          let isProfile = false;
          let orientation: 'FRONTAL' | 'PROFILE_LEFT' | 'PROFILE_RIGHT' = 'FRONTAL';

          if (shSpanX < 0.16 || shSpanZ > 0.22) {
            isProfile = true;
            if ((leftShoulder?.z ?? 0) > (rightShoulder?.z ?? 0)) {
              orientation = 'PROFILE_RIGHT';
            } else {
              orientation = 'PROFILE_LEFT';
            }
          } else if (nose && leftEar && rightEar) {
            const leftDist = Math.hypot(nose.x - leftEar.x, nose.y - leftEar.y);
            const rightDist = Math.hypot(nose.x - rightEar.x, nose.y - rightEar.y);
            if (leftDist < rightDist * 0.50) {
              isProfile = true;
              orientation = 'PROFILE_LEFT';
            } else if (rightDist < leftDist * 0.50) {
              isProfile = true;
              orientation = 'PROFILE_RIGHT';
            }
          }

          // 4. Compute Fallback Head Bounding Box (always tracks face even in profile)
          const headPoints = smoothedLms.slice(0, 11).filter((p) => (p.visibility ?? 1) > 0.18);
          let headBox = null;
          if (headPoints.length >= 2) {
            const hMinX = Math.min(...headPoints.map((p) => p.x));
            const hMaxX = Math.max(...headPoints.map((p) => p.x));
            const hMinY = Math.min(...headPoints.map((p) => p.y));
            const hMaxY = Math.max(...headPoints.map((p) => p.y));
            const hPadX = 0.035;
            const hPadY = 0.045;
            headBox = {
              x: Math.max(0, (hMinX - hPadX) * vw),
              y: Math.max(0, (hMinY - hPadY) * vh),
              width: Math.min(vw, (hMaxX - hMinX + hPadX * 2) * vw),
              height: Math.min(vh, (hMaxY - hMinY + hPadY * 2) * vh)
            };
          }

          // 5. Posture & Arm / Hand Gestures (รองรับทั้งยืน นั่งหน้าจอ โบกมือ ยกแขน ไหว้)
          const isLeftHighRaise = leftWrist && leftShoulder && leftWrist.y < leftShoulder.y - 0.04;
          const isRightHighRaise = rightWrist && rightShoulder && rightWrist.y < rightShoulder.y - 0.04;

          const isLeftMidRaise = leftWrist && leftElbow && leftWrist.y < leftElbow.y - 0.03;
          const isRightMidRaise = rightWrist && rightElbow && rightWrist.y < rightElbow.y - 0.03;

          const isLeftArmRaised = Boolean(isLeftHighRaise || isLeftMidRaise);
          const isRightArmRaised = Boolean(isRightHighRaise || isRightMidRaise);

          // Thai Greeting / Wai (มือพนมเข้าหากันระดับอก/คาง)
          const isWai = Boolean(
            leftWrist && rightWrist &&
            Math.hypot(leftWrist.x - rightWrist.x, leftWrist.y - rightWrist.y) < 0.14 &&
            leftWrist.y < (leftShoulder?.y ?? 1) + 0.12
          );

          // Touching chin / head / thinking gesture
          const isLeftTouchingFace = Boolean(
            leftWrist && nose && Math.hypot(leftWrist.x - nose.x, leftWrist.y - nose.y) < 0.16
          );
          const isRightTouchingFace = Boolean(
            rightWrist && nose && Math.hypot(rightWrist.x - nose.x, rightWrist.y - nose.y) < 0.16
          );

          const isArmRaised = Boolean(isLeftArmRaised || isRightArmRaised || isWai);

          let posture = 'Upright & Centered';
          let posture_th = 'ลำตัวตรงมาตรฐาน';

          if (isWai) {
            posture = 'Wai / Thai Greeting';
            posture_th = '🙏 ไหว้ / ทักทาย';
          } else if (isLeftHighRaise && isRightHighRaise) {
            posture = 'Both Arms Raised High!';
            posture_th = '🙌 ยกแขนทั้งสองข้าง!';
          } else if (isLeftArmRaised && isRightArmRaised) {
            posture = 'Both Hands Raised';
            posture_th = '👐 ยกมือทั้งสองข้าง';
          } else if (isLeftTouchingFace || isRightTouchingFace) {
            posture = 'Hand to Face / Thinking';
            posture_th = '🤔 แตะคาง / ใบหน้า';
          } else if (isLeftHighRaise) {
            posture = 'Left Arm Raised High';
            posture_th = '🙋‍♀️ ชูแขนซ้าย';
          } else if (isRightHighRaise) {
            posture = 'Right Arm Raised High';
            posture_th = '🙋‍♂️ ชูแขนขวา';
          } else if (isLeftMidRaise) {
            posture = 'Left Hand Waving';
            posture_th = '👋 ยกมือซ้าย / โบกมือ';
          } else if (isRightMidRaise) {
            posture = 'Right Hand Waving';
            posture_th = '👋 ยกมือขวา / โบกมือ';
          } else if (isProfile) {
            if (orientation === 'PROFILE_LEFT') {
              posture = 'Facing Left (Profile)';
              posture_th = '🔄 หันข้างซ้าย (ตรวจจับแม่นยำ)';
            } else {
              posture = 'Facing Right (Profile)';
              posture_th = '🔄 หันข้างขวา (ตรวจจับแม่นยำ)';
            }
          } else if (leftShoulder && rightShoulder) {
            const tilt = leftShoulder.y - rightShoulder.y;
            if (tilt > 0.07) {
              posture = 'Leaning Left';
              posture_th = '👉 เอียงตัวไปทางซ้าย';
            } else if (tilt < -0.07) {
              posture = 'Leaning Right';
              posture_th = '👈 เอียงตัวไปทางขวา';
            }
          }

          const res: BodyPoseResult = {
            detected: true,
            landmarks: smoothedLms,
            box: smoothBox,
            posture,
            posture_th,
            isArmRaised,
            isProfile,
            orientation,
            headBox
          };

          latestPoseRef.current = res;
          setPoseData(res);
        } catch (err) {
          console.error('[Pose] onResults parse error:', err);
        } finally {
          isProcessingRef.current = false;
        }
      });

      poseRef.current = pose;
      } catch (err) {
        console.error('[Pose] Init error:', err);
      }
    };

    initPose();

    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (_) {}
      }
    };
  }, [videoRef]);

  // Frame processing loop (Anti-Deadlock 60FPS Watchdog)
  useEffect(() => {
    if (!enabled) return;

    let isRunning = true;

    const processFrame = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const pose = poseRef.current;
      const now = performance.now();

      // Watchdog: If processing lock is held > 600ms, unlock immediately
      if (isProcessingRef.current && now - lastSendTimeRef.current > 600) {
        isProcessingRef.current = false;
      }

      if (
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        pose &&
        !isProcessingRef.current
      ) {
        if (video.paused) {
          video.play().catch(() => {});
        }
        try {
          isProcessingRef.current = true;
          lastSendTimeRef.current = now;
          await pose.send({ image: video });
        } catch (err) {
          // ignore transient frame send errors
        } finally {
          isProcessingRef.current = false;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, videoRef]);

  return {
    poseData,
    latestPoseRef
  };
};
