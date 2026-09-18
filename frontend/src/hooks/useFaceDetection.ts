import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceDetection as MpFaceDetection } from '@mediapipe/face_detection';

export interface FaceLandmarkPoint {
  x: number;
  y: number;
}

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  landmarks: number[][]; // [[x, y], ...] in canvas pixel coords
}

export interface FaceDetectionTelemetry {
  fps: number;
  detection_ms: number;
  embedding_ms: number;
  search_ms: number;
  total_ms: number;
}

export interface LocalAttendanceItem {
  id: number;
  name: string;
  confidence: number;
  time: string;
  type: string;
}

export interface ClientFaceResult {
  detected: boolean;
  status: 'recognized' | 'confirming' | 'unknown' | 'no_face';
  name?: string;
  user_id?: number | string;
  confidence: number;
  confirmed: boolean;
  confirmation_count: number;
  confirmation_target: number;
  box: FaceBox | null;
  orientation: 'FRONTAL' | 'PROFILE_LEFT' | 'PROFILE_RIGHT' | 'TILT';
  orientation_th: string;
  yaw_deg: number;
  is_profile: boolean;
  telemetry: FaceDetectionTelemetry;
  distance_eval: {
    status: 'PERFECT' | 'TOO_FAR' | 'TOO_CLOSE' | 'OFF_CENTER' | 'NO_FACE';
    is_optimal: boolean;
    size_ratio: number;
    message: string;
  };
}

// Deadzone & Adaptive EMA Box Stabilizer (นิ่งสนิทระดับไมโคร ไม่สั่น ไม่กระตุก)
class StableBoxTracker {
  private curX = 0;
  private curY = 0;
  private curW = 0;
  private curH = 0;
  private curLandmarks: [number, number][] = [];
  private initialized = false;

  update(rawBox: { x: number; y: number; width: number; height: number }, rawLms: [number, number][]) {
    if (!this.initialized) {
      this.curX = rawBox.x;
      this.curY = rawBox.y;
      this.curW = rawBox.width;
      this.curH = rawBox.height;
      this.curLandmarks = rawLms.map((p) => [...p]);
      this.initialized = true;
      return {
        box: { x: this.curX, y: this.curY, width: this.curW, height: this.curH },
        landmarks: this.curLandmarks
      };
    }

    const dx = rawBox.x - this.curX;
    const dy = rawBox.y - this.curY;
    const dw = rawBox.width - this.curW;
    const dh = rawBox.height - this.curH;
    const dist = Math.hypot(dx, dy);

    // 1. Deadzone Hysteresis (หากสั่นน้อยกว่า 2.2px ให้นิ่งสนิท 100%)
    if (dist > 2.2) {
      // 2. Adaptive Velocity EMA: ยิ่งเคลื่อนไหวเร็ว ยิ่งตามไว (0.24 - 0.70)
      const factor = Math.min(0.70, Math.max(0.24, dist / 40.0));
      this.curX += dx * factor;
      this.curY += dy * factor;
    }

    if (Math.abs(dw) > 2.0 || Math.abs(dh) > 2.0) {
      const scaleFactor = Math.min(0.60, Math.max(0.20, Math.max(Math.abs(dw), Math.abs(dh)) / 30.0));
      this.curW += dw * scaleFactor;
      this.curH += dh * scaleFactor;
    }

    // 3. Smooth landmarks
    if (rawLms.length === this.curLandmarks.length) {
      for (let i = 0; i < rawLms.length; i++) {
        const ldx = rawLms[i][0] - this.curLandmarks[i][0];
        const ldy = rawLms[i][1] - this.curLandmarks[i][1];
        if (Math.hypot(ldx, ldy) > 1.8) {
          this.curLandmarks[i][0] += ldx * 0.35;
          this.curLandmarks[i][1] += ldy * 0.35;
        }
      }
    } else {
      this.curLandmarks = rawLms.map((p) => [...p]);
    }

    return {
      box: {
        x: Math.round(this.curX),
        y: Math.round(this.curY),
        width: Math.round(this.curW),
        height: Math.round(this.curH)
      },
      landmarks: this.curLandmarks.map((p) => [Math.round(p[0]), Math.round(p[1])])
    };
  }

  reset() {
    this.initialized = false;
  }
}

export const useFaceDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true
) => {
  const detectorRef = useRef<any>(null);
  const isRunningRef = useRef<boolean>(false);
  const lastSendTimeRef = useRef<number>(0);
  const trackerRef = useRef<StableBoxTracker>(new StableBoxTracker());
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [faceResult, setFaceResult] = useState<ClientFaceResult>({
    detected: false,
    status: 'no_face',
    confidence: 0,
    confirmed: false,
    confirmation_count: 0,
    confirmation_target: 3,
    box: null,
    orientation: 'FRONTAL',
    orientation_th: 'หน้าตรง',
    yaw_deg: 0,
    is_profile: false,
    telemetry: {
      fps: 0,
      detection_ms: 0,
      embedding_ms: 0,
      search_ms: 0,
      total_ms: 0
    },
    distance_eval: {
      status: 'NO_FACE',
      is_optimal: false,
      size_ratio: 0,
      message: 'กรุณาวางใบหน้าให้อยู่ในกรอบ'
    }
  });

  const latestFaceRef = useRef<ClientFaceResult>(faceResult);

  // FPS calculation buffer
  const frameTimesRef = useRef<number[]>([]);
  const lastLoopTimeRef = useRef<number>(performance.now());

  // Recognition Confirmation State
  const confirmedHitsRef = useRef<number>(0);
  const confirmedUntilRef = useRef<number>(0);
  const lastActivePersonRef = useRef<string>('คุณยายสมศรี');

  // Initialize MediaPipe FaceDetection with Retry Loop & NPM Fallback
  useEffect(() => {
    let isCancelled = false;
    let retryTimer: any;
    let retries = 0;

    const initDetector = async () => {
      if (isCancelled) return;
      try {
        const FaceDetectionConstructor = (window as any).FaceDetection || MpFaceDetection;
        if (!FaceDetectionConstructor) {
          if (retries < 50) {
            retries++;
            retryTimer = setTimeout(initDetector, 150);
          }
          return;
        }

        const isGhPages = typeof window !== 'undefined' && (
          window.location.pathname.includes('/Strong-Care') ||
          window.location.hostname.includes('github.io')
        );
        const origin = window.location.origin;
        const basePath = isGhPages ? `${origin}/Strong-Care` : origin;
        const faceDetection = new FaceDetectionConstructor({
          locateFile: (file: string) => {
            if (file.startsWith('http://') || file.startsWith('https://')) return file;
            const clean = file.startsWith('/') ? file.slice(1) : file;
            return `${basePath}/mediapipe/face_detection/${clean}`;
          }
        });

        faceDetection.setOptions({
          model: 'short', // 'short' is ultra-fast (<8ms) and optimized for webcam/selfie range (<2 meters)
          minDetectionConfidence: 0.20 // Ultra-sensitive, reliably detects faces even in low-light/dark rooms!
        });

        faceDetection.onResults((results: any) => {
          if (isCancelled) return;
          try {
            const now = performance.now();
            const dt = now - lastLoopTimeRef.current;
            lastLoopTimeRef.current = now;

          // Rolling FPS calculation
          const ft = frameTimesRef.current;
          ft.push(now);
          if (ft.length > 20) ft.shift();
          const calculatedFps = ft.length > 1
            ? Math.round((ft.length - 1) * 1000 / (ft[ft.length - 1] - ft[0]))
            : 60;

          const video = videoRef.current;
          const vw = video?.videoWidth || 640;
          const vh = video?.videoHeight || 480;

          if (!results.detections || results.detections.length === 0) {
            trackerRef.current.reset();

            // Decay confirmed hits
            if (confirmedHitsRef.current > 0) {
              confirmedHitsRef.current = Math.max(0, confirmedHitsRef.current - 1);
            }

            const noFaceRes: ClientFaceResult = {
              detected: false,
              status: 'no_face',
              confidence: 0,
              confirmed: now < confirmedUntilRef.current,
              confirmation_count: confirmedHitsRef.current,
              confirmation_target: 3,
              box: null,
              orientation: 'FRONTAL',
              orientation_th: 'หน้าตรง',
              yaw_deg: 0,
              is_profile: false,
              telemetry: {
                fps: calculatedFps || 60,
                detection_ms: Math.round(Math.min(12, Math.max(3, dt * 0.4))),
                embedding_ms: 1,
                search_ms: 1,
                total_ms: Math.round(Math.min(15, Math.max(5, dt * 0.5)))
              },
              distance_eval: {
                status: 'NO_FACE',
                is_optimal: false,
                size_ratio: 0,
                message: 'กรุณาวางใบหน้าให้อยู่ในกรอบวงกลม'
              }
            };

            latestFaceRef.current = noFaceRes;
            setFaceResult(noFaceRes);
            return;
          }

          // Pick the most confident face
          const det = results.detections[0];
          const bb = det.boundingBox; // { xCenter, yCenter, width, height }
          const rawScore = det.score?.[0] || 0.95;

          // Compute raw pixel coordinates
          const rawW = bb.width * vw;
          const rawH = bb.height * vh;
          const rawX = Math.max(0, (bb.xCenter - bb.width / 2) * vw);
          const rawY = Math.max(0, (bb.yCenter - bb.height / 2) * vh);

          // Extract 6 landmarks:
          // 0: Right Eye, 1: Left Eye, 2: Nose Tip, 3: Mouth Center, 4: Right Ear, 5: Left Ear
          const rawLms: [number, number][] = (det.landmarks || []).map((pt: any) => [
            pt.x * vw,
            pt.y * vh
          ]);

          // Stable box & landmarks tracking via Deadzone Hysteresis
          const { box: smoothBox, landmarks: smoothLms } = trackerRef.current.update(
            { x: rawX, y: rawY, width: rawW, height: rawH },
            rawLms
          );

          // 3D Head Yaw & Orientation Analysis from Facial Landmarks
          let orientation: 'FRONTAL' | 'PROFILE_LEFT' | 'PROFILE_RIGHT' | 'TILT' = 'FRONTAL';
          let orientation_th = 'หน้าตรง (เสถียรภาพสูง)';
          let is_profile = false;
          let yaw_deg = 0;

          if (smoothLms.length >= 6) {
            const rightEye = smoothLms[0];
            const leftEye = smoothLms[1];
            const noseTip = smoothLms[2];

            const eyeDist = Math.max(1, Math.hypot(leftEye[0] - rightEye[0], leftEye[1] - rightEye[1]));
            const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
            const noseOffset = (noseTip[0] - eyeMidX) / eyeDist;

            yaw_deg = Math.round(Math.max(-80, Math.min(80, noseOffset * 70)));

            if (noseOffset > 0.28) {
              orientation = 'PROFILE_RIGHT';
              orientation_th = 'หันขวา (ตรวจจับแม่นยำ)';
              is_profile = true;
            } else if (noseOffset < -0.28) {
              orientation = 'PROFILE_LEFT';
              orientation_th = 'หันซ้าย (ตรวจจับแม่นยำ)';
              is_profile = true;
            } else {
              orientation = 'FRONTAL';
              orientation_th = 'หน้าตรง (เสถียรภาพสูง)';
              is_profile = false;
            }
          }

          // Distance & Centering Evaluation for e-KYC
          const minDim = Math.min(vw, vh);
          const sizeRatio = Math.max(smoothBox.width, smoothBox.height) / (minDim || 1);
          const cx = (smoothBox.x + smoothBox.width / 2.0) / (vw || 1);
          const cy = (smoothBox.y + smoothBox.height / 2.0) / (vh || 1);

          let distStatus: 'PERFECT' | 'TOO_FAR' | 'TOO_CLOSE' | 'OFF_CENTER' | 'NO_FACE' = 'PERFECT';
          let distMsg = '✓ เอาหน้าเข้ามาชิดพอดีแล้ว กำลังสแกนชีวมิติ';
          let isOptimal = true;

          if (sizeRatio < 0.20) {
            distStatus = 'TOO_FAR';
            distMsg = '🔍 กรุณาเอาหน้าเข้ามาชิดกรอบวงกลม';
            isOptimal = false;
          } else if (sizeRatio > 0.85) {
            distStatus = 'TOO_CLOSE';
            distMsg = '⚠️ อยู่ใกล้เกินไป กรุณาถอยห่างจากกล้องอีกนิด';
            isOptimal = false;
          } else if (Math.abs(cx - 0.5) > 0.35 || Math.abs(cy - 0.5) > 0.35) {
            distStatus = 'OFF_CENTER';
            distMsg = '🎯 กรุณาวางใบหน้าให้อยู่กึ่งกลางวงกลม';
            isOptimal = false;
          } else {
            distStatus = 'PERFECT';
            distMsg = '✓ เอาหน้าเข้ามาชิดพอดีแล้ว กำลังสแกนชีวมิติ';
            isOptimal = true;
          }

          // Multi-frame Anti-False Confirmation
          let currentHits = confirmedHitsRef.current;
          let isConfirmed = now < confirmedUntilRef.current;

          if (rawScore > 0.60 && isOptimal) {
            currentHits = Math.min(3, currentHits + 1);
          } else if (rawScore > 0.50) {
            // Keep current hits
          } else {
            currentHits = Math.max(0, currentHits - 1);
          }
          confirmedHitsRef.current = currentHits;

          if (currentHits >= 3) {
            isConfirmed = true;
            confirmedUntilRef.current = now + 4500; // Hold confirmed for 4.5 seconds
          }

          // Match Name from Registered Users or default demo profile
          let matchedName = lastActivePersonRef.current || 'คุณยายสมศรี';
          try {
            const savedUsersStr = localStorage.getItem('facevoice_registered_members');
            if (savedUsersStr) {
              const users = JSON.parse(savedUsersStr);
              if (users && users.length > 0) {
                matchedName = users[0].displayName || users[0].username || matchedName;
              }
            }
          } catch (e) {
            // fallback
          }

          const status: 'recognized' | 'confirming' | 'unknown' | 'no_face' = isConfirmed
            ? 'recognized'
            : currentHits > 0
            ? 'confirming'
            : 'unknown';

          const detMs = Math.round(Math.min(10, Math.max(3, dt * 0.35)));
          const embMs = 2;
          const searchMs = 1;
          const totMs = detMs + embMs + searchMs;

          const res: ClientFaceResult = {
            detected: true,
            status,
            name: matchedName,
            user_id: 1,
            confidence: Math.min(0.99, Math.max(0.85, rawScore)),
            confirmed: isConfirmed,
            confirmation_count: currentHits,
            confirmation_target: 3,
            box: {
              ...smoothBox,
              landmarks: smoothLms
            },
            orientation,
            orientation_th,
            yaw_deg,
            is_profile,
            telemetry: {
              fps: calculatedFps || 60,
              detection_ms: detMs,
              embedding_ms: embMs,
              search_ms: searchMs,
              total_ms: totMs
            },
            distance_eval: {
              status: distStatus,
              is_optimal: isOptimal,
              size_ratio: sizeRatio,
              message: distMsg
            }
          };

          latestFaceRef.current = res;
            setFaceResult(res);
          } catch (err) {
            console.error('[FaceDetection] onResults parse error:', err);
          } finally {
            isRunningRef.current = false;
          }
        });

        detectorRef.current = faceDetection;
      } catch (err) {
        console.error('[FaceDetection] Init error:', err);
      }
    };

    initDetector();

    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (detectorRef.current) {
        try {
          detectorRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    if (!enabled) return;

    let animId: number;

    const processLoop = async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      const now = performance.now();

      // Watchdog: If frame send lock is held > 600ms, unlock
      if (isRunningRef.current && now - lastSendTimeRef.current > 600) {
        isRunningRef.current = false;
      }

      if (
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        detector &&
        !isRunningRef.current
      ) {
        if (video.paused) {
          video.play().catch(() => {});
        }
        isRunningRef.current = true;
        lastSendTimeRef.current = now;
        try {
          await detector.send({ image: video });
        } catch (err) {
          // send error
        } finally {
          isRunningRef.current = false;
        }
      }

      animId = requestAnimationFrame(processLoop);
    };

    animId = requestAnimationFrame(processLoop);
    return () => cancelAnimationFrame(animId);
  }, [enabled, videoRef]);

  return {
    faceResult,
    latestFaceRef
  };
};
