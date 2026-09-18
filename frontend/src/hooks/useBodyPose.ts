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
  [16, 20]  // Right Wrist to Right Index
];

export const useBodyPose = (
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true
) => {
  const poseRef = useRef<any>(null);
  const [poseData, setPoseData] = useState<BodyPoseResult | null>(null);
  const latestPoseRef = useRef<BodyPoseResult | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const initPose = async () => {
      try {
        const PoseConstructor = (window as any).Pose || MpPose;
        if (!PoseConstructor) {
          console.warn('[Pose] Waiting for MediaPipe Pose to load...');
          return;
        }

        const pose = new PoseConstructor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results: any) => {
          if (isCancelled) return;
          isProcessingRef.current = false;

          if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
            latestPoseRef.current = null;
            setPoseData(null);
            return;
          }

          const lms: BodyKeypoint[] = results.poseLandmarks;
          const video = videoRef.current;
          const vw = video?.videoWidth || 640;
          const vh = video?.videoHeight || 480;

          // Compute tight bounding box covering visible body parts
          // Exclude points with very low visibility
          const validPoints = lms.filter((p) => (p.visibility ?? 1) > 0.35);
          const pts = validPoints.length > 4 ? validPoints : lms.slice(0, 25);

          const minX = Math.max(0, Math.min(...pts.map((p) => p.x)));
          const maxX = Math.min(1, Math.max(...pts.map((p) => p.x)));
          const minY = Math.max(0, Math.min(...pts.map((p) => p.y)));
          const maxY = Math.min(1, Math.max(...pts.map((p) => p.y)));

          const padX = 0.04;
          const padY = 0.04;

          const boxX = Math.max(0, (minX - padX) * vw);
          const boxY = Math.max(0, (minY - padY) * vh);
          const boxW = Math.min(vw - boxX, (maxX - minX + padX * 2) * vw);
          const boxH = Math.min(vh - boxY, (maxY - minY + padY * 2) * vh);

          // Posture & Arm Gestures
          const leftShoulder = lms[11];
          const rightShoulder = lms[12];
          const leftWrist = lms[15];
          const rightWrist = lms[16];

          const isLeftArmRaised = leftWrist && leftShoulder && leftWrist.y < leftShoulder.y - 0.05;
          const isRightArmRaised = rightWrist && rightShoulder && rightWrist.y < rightShoulder.y - 0.05;
          const isArmRaised = isLeftArmRaised || isRightArmRaised;

          let posture = 'Upright & Centered';
          let posture_th = 'ลำตัวตรงมาตรฐาน';

          if (isLeftArmRaised && isRightArmRaised) {
            posture = 'Both Arms Raised!';
            posture_th = 'ยกแขนทั้งสองข้าง!';
          } else if (isLeftArmRaised) {
            posture = 'Left Arm Raised';
            posture_th = 'ยกแขนซ้าย';
          } else if (isRightArmRaised) {
            posture = 'Right Arm Raised';
            posture_th = 'ยกแขนขวา';
          } else if (leftShoulder && rightShoulder) {
            const tilt = leftShoulder.y - rightShoulder.y;
            if (tilt > 0.08) {
              posture = 'Leaning Left';
              posture_th = 'เอียงซ้าย';
            } else if (tilt < -0.08) {
              posture = 'Leaning Right';
              posture_th = 'เอียงขวา';
            }
          }

          const res: BodyPoseResult = {
            detected: true,
            landmarks: lms,
            box: {
              x: Math.round(boxX),
              y: Math.round(boxY),
              width: Math.round(boxW),
              height: Math.round(boxH)
            },
            posture,
            posture_th,
            isArmRaised
          };

          latestPoseRef.current = res;
          setPoseData(res);
        });

        poseRef.current = pose;
      } catch (err) {
        console.error('[Pose] Init error:', err);
      }
    };

    initPose();

    return () => {
      isCancelled = true;
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (_) {}
      }
    };
  }, [videoRef]);

  // Frame processing loop
  useEffect(() => {
    if (!enabled) return;

    let isRunning = true;

    const processFrame = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const pose = poseRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        !video.paused &&
        pose &&
        !isProcessingRef.current
      ) {
        try {
          isProcessingRef.current = true;
          await pose.send({ image: video });
        } catch (err) {
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
