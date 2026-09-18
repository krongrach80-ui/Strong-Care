import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose as MpPose } from '@mediapipe/pose';

export interface BodyKeypoint {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  z?: number;
  visibility?: number;
}

export interface BodyPartsDetection {
  face: boolean;   // โครงหน้า
  torso: boolean;  // ลำตัว
  arms: boolean;   // แขน (ซ้าย/ขวา)
  legs: boolean;   // ขา (ซ้าย/ขวา)
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
  parts: BodyPartsDetection;
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

// 1. โครงหน้า (Face Contour & Features: 0..10)
export const POSE_FACE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], // Left eye to ear
  [0, 4], [4, 5], [5, 6], [6, 8], // Right eye to ear
  [9, 10],                        // Mouth
  [0, 9], [0, 10]                 // Nose to mouth corners
];

// 2. ลำตัว (Torso & Core: shoulders, hips, spine)
export const POSE_TORSO_CONNECTIONS = [
  [11, 12], // Shoulder span
  [23, 24], // Hip span
  [11, 23], // Left flank
  [12, 24], // Right flank
];

// 3. แขน (Arms & Hands: upper arm, forearm, fingers)
export const POSE_ARM_CONNECTIONS = [
  [11, 13], [13, 15], // Left arm
  [15, 17], [15, 19], [15, 21], [17, 19], // Left hand & fingers
  [12, 14], [14, 16], // Right arm
  [16, 18], [16, 20], [16, 22], [18, 20]  // Right hand & fingers
];

// 4. ขา (Legs & Feet: thighs, knees, shins, feet)
export const POSE_LEG_CONNECTIONS = [
  [23, 25], [25, 27], // Left leg
  [27, 29], [29, 31], [27, 31], // Left ankle, heel, toe
  [24, 26], [26, 28], // Right leg
  [28, 30], [30, 32], [28, 32]  // Right ankle, heel, toe
];

// All connections combined
export const POSE_CONNECTIONS_MAP = [
  ...POSE_FACE_CONNECTIONS,
  ...POSE_TORSO_CONNECTIONS,
  ...POSE_ARM_CONNECTIONS,
  ...POSE_LEG_CONNECTIONS,
  [0, 11], [0, 12] // Neck bridge
];

/**
 * Real-time 60FPS Cyber Holo Multi-Anatomical Skeleton Renderer:
 * Separately visualizes and highlights:
 *  1. โครงหน้า (Face Structure & Contour - Cyan)
 *  2. ลำตัว (Torso & Spine Core - Emerald)
 *  3. แขน (Arms & Hands - Amber/Cyan)
 *  4. ขา (Legs & Feet - Purple/Indigo)
 */
export const drawFullAnatomySkeleton = (
  ctx: CanvasRenderingContext2D,
  pose: BodyPoseResult,
  vw: number,
  vh: number,
  options?: {
    showLabels?: boolean;
    isConfirmed?: boolean;
  }
) => {
  if (!pose || !pose.landmarks || pose.landmarks.length === 0) return;
  const lms = pose.landmarks;
  const showLabels = options?.showLabels !== false;
  const isArmUp = Boolean(pose.isArmRaised);

  // Helper to draw connection lines
  const drawLines = (
    connections: number[][],
    strokeStyle: string,
    shadowColor: string,
    lineWidth: number
  ) => {
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(([iA, iB]) => {
      const pA = lms[iA];
      const pB = lms[iB];
      if (
        pA && pB &&
        (pA.visibility ?? 1) > 0.18 &&
        (pB.visibility ?? 1) > 0.18
      ) {
        ctx.beginPath();
        ctx.moveTo(pA.x * vw, pA.y * vh);
        ctx.lineTo(pB.x * vw, pB.y * vh);
        ctx.stroke();
      }
    });
    ctx.restore();
  };

  // Helper to draw cyber HUD badge on body parts
  const drawPartBadge = (text: string, x: number, y: number, color: string, bg: string) => {
    if (!showLabels) return;
    ctx.save();
    ctx.font = 'bold 10px Outfit, sans-serif';
    const tw = ctx.measureText(text).width;
    const pad = 6;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x - pad, y - 11, tw + pad * 2, 16, 4);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  // 1. โครงหน้า (Face Contour & Facial Mesh: 0..10 - Cyan Holo)
  drawLines(POSE_FACE_CONNECTIONS, '#38BDF8', 'rgba(56, 189, 248, 0.9)', 2.2);

  // Draw face landmarks (eyes, nose, mouth)
  for (let i = 0; i <= 10; i++) {
    const pt = lms[i];
    if (pt && (pt.visibility ?? 1) > 0.18) {
      ctx.beginPath();
      ctx.arc(pt.x * vw, pt.y * vh, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#BAE6FD';
      ctx.fill();
    }
  }

  // Draw face contour tag
  if (lms[0] && (lms[0].visibility ?? 1) > 0.25) {
    drawPartBadge('🧠 โครงหน้า', lms[0].x * vw - 24, Math.max(16, (lms[0].y * vh) - 30), '#38BDF8', 'rgba(12, 74, 110, 0.85)');
  }

  // 2. ลำตัว (Torso & Spine: 11, 12, 23, 24 - Emerald Matrix)
  drawLines(POSE_TORSO_CONNECTIONS, '#10B981', 'rgba(16, 185, 129, 0.85)', 3.8);

  // Soft translucent fill inside Torso polygon
  const p11 = lms[11], p12 = lms[12], p23 = lms[23], p24 = lms[24];
  if (
    p11 && p12 && p23 && p24 &&
    (p11.visibility ?? 1) > 0.2 && (p12.visibility ?? 1) > 0.2 &&
    (p23.visibility ?? 1) > 0.2 && (p24.visibility ?? 1) > 0.2
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p11.x * vw, p11.y * vh);
    ctx.lineTo(p12.x * vw, p12.y * vh);
    ctx.lineTo(p24.x * vw, p24.y * vh);
    ctx.lineTo(p23.x * vw, p23.y * vh);
    ctx.closePath();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fill();

    // Glowing Spine (เส้นกระดูกสันหลังแกนกลาง)
    const midShoulderX = ((p11.x + p12.x) / 2) * vw;
    const midShoulderY = ((p11.y + p12.y) / 2) * vh;
    const midHipX = ((p23.x + p24.x) / 2) * vw;
    const midHipY = ((p23.y + p24.y) / 2) * vh;

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(midShoulderX, midShoulderY);
    ctx.lineTo(midHipX, midHipY);
    ctx.stroke();

    // Chest Biometric Core Circle
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(midShoulderX, midShoulderY + 22, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    drawPartBadge('🎽 ลำตัว', midShoulderX - 16, midShoulderY + 42, '#34D399', 'rgba(6, 78, 59, 0.85)');
    ctx.restore();
  }

  // 3. แขน (Arms & Hands: 11..22 - Amber Gold when active / Cyan when rest)
  const armColor = isArmUp ? '#F59E0B' : '#06B6D4';
  const armGlow = isArmUp ? 'rgba(245, 158, 11, 0.95)' : 'rgba(6, 182, 212, 0.85)';
  drawLines(POSE_ARM_CONNECTIONS, armColor, armGlow, 3.5);

  // Glowing Joint Nodes on Arms (Elbows & Wrists)
  [13, 14, 15, 16].forEach((idx) => {
    const pt = lms[idx];
    if (pt && (pt.visibility ?? 1) > 0.18) {
      const isWrist = idx === 15 || idx === 16;
      ctx.beginPath();
      ctx.arc(pt.x * vw, pt.y * vh, isWrist ? 5.5 : 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = isArmUp ? '#FEF08A' : '#67E8F9';
      ctx.fill();
      ctx.strokeStyle = '#022C22';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isWrist && showLabels && (pt.visibility ?? 1) > 0.35) {
        drawPartBadge('💪 แขน', (pt.x * vw) - 14, (pt.y * vh) - 14, armColor, 'rgba(15, 23, 42, 0.85)');
      }
    }
  });

  // Hand / Finger Nodes (17..22)
  for (let i = 17; i <= 22; i++) {
    const pt = lms[i];
    if (pt && (pt.visibility ?? 1) > 0.18) {
      ctx.beginPath();
      ctx.arc(pt.x * vw, pt.y * vh, 2.8, 0, 2 * Math.PI);
      ctx.fillStyle = isArmUp ? '#FCD34D' : '#A5F3FC';
      ctx.fill();
    }
  }

  // 4. ขา (Legs & Feet: 23..32 - Cyber Purple)
  drawLines(POSE_LEG_CONNECTIONS, '#A855F7', 'rgba(168, 85, 247, 0.85)', 3.5);

  // Glowing Joint Nodes on Legs (Knees & Ankles)
  [25, 26, 27, 28].forEach((idx) => {
    const pt = lms[idx];
    if (pt && (pt.visibility ?? 1) > 0.18) {
      const isKnee = idx === 25 || idx === 26;
      ctx.beginPath();
      ctx.arc(pt.x * vw, pt.y * vh, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#E9D5FF';
      ctx.fill();
      ctx.strokeStyle = '#3B0764';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isKnee && showLabels && (pt.visibility ?? 1) > 0.35) {
        drawPartBadge('🦵 ขา', (pt.x * vw) - 12, (pt.y * vh) - 14, '#C084FC', 'rgba(59, 7, 100, 0.85)');
      }
    }
  });

  // Feet / Toes Nodes (29..32)
  for (let i = 29; i <= 32; i++) {
    const pt = lms[i];
    if (pt && (pt.visibility ?? 1) > 0.18) {
      ctx.beginPath();
      ctx.arc(pt.x * vw, pt.y * vh, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#F3E8FF';
      ctx.fill();
    }
  }
};

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

          // Compute detection status for 4 major anatomical regions:
          // 1. โครงหน้า (Face): points 0..10
          const hasFace = smoothedLms.slice(0, 11).some((p) => (p.visibility ?? 1) > 0.18);
          // 2. ลำตัว (Torso): shoulders (11,12) and hips (23,24)
          const hasTorso = [11, 12, 23, 24].some((i) => (smoothedLms[i]?.visibility ?? 1) > 0.18);
          // 3. แขน (Arms): elbows (13,14) or wrists (15,16)
          const hasArms = [13, 14, 15, 16].some((i) => (smoothedLms[i]?.visibility ?? 1) > 0.18);
          // 4. ขา (Legs): knees (25,26) or ankles (27,28)
          const hasLegs = [25, 26, 27, 28].some((i) => (smoothedLms[i]?.visibility ?? 1) > 0.18);

          const parts: BodyPartsDetection = {
            face: hasFace,
            torso: hasTorso,
            arms: hasArms,
            legs: hasLegs
          };

          const res: BodyPoseResult = {
            detected: true,
            landmarks: smoothedLms,
            box: smoothBox,
            parts,
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
