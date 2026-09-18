import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  VideoOff, 
  RefreshCw, 
  Volume2, 
  Bug, 
  CheckCircle, 
  AlertCircle,
  Radio,
  Sliders,
  Sparkles,
  User,
  Activity,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  ZoomIn
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useSpeech } from '../hooks/useSpeech';
import { DebugOverlay } from '../components/DebugOverlay';
import { ConfirmationBadge } from '../components/ConfirmationBadge';
import { api } from '../services/api';
import { useBodyPose, POSE_CONNECTIONS_MAP, BodyPoseResult } from '../hooks/useBodyPose';
import { useFaceDetection, ClientFaceResult } from '../hooks/useFaceDetection';

export const LiveRecognition: React.FC = () => {
  const {
    videoRef,
    isActive,
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    startCamera,
    stopCamera,
    captureFrame,
    error: cameraError
  } = useCamera();

  const { speak, playChime, isSpeaking } = useSpeech();

  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [enableBodyTracking, setEnableBodyTracking] = useState(true);

  // Client-Side 60FPS MediaPipe Face & Pose Tracking (เสถียรภาพสูงระดับโปรดักชัน)
  const { faceResult: clientFaceResult, latestFaceRef } = useFaceDetection(videoRef, isActive);
  const { poseData, latestPoseRef } = useBodyPose(videoRef, enableBodyTracking);
  const lastResultRef = useRef<any>(null);

  const [currentResult, setCurrentResult] = useState<any>(null);
  const [recentDetections, setRecentDetections] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('facevoice_recent_detections');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Keep localStorage updated with recent detections
  useEffect(() => {
    try {
      localStorage.setItem('facevoice_recent_detections', JSON.stringify(recentDetections));
    } catch (e) {}
  }, [recentDetections]);

  // Camera viewport sizing & display controls (ขยายหน้าจอแบบเต็มตา)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // 60FPS LERP Smoothing and Profile Persistence (สมูท ไร้รอยต่อตอนหันข้าง)
  const smoothFaceBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const smoothLandmarksRef = useRef<number[][] | null>(null);
  const lastSeenFaceTimeRef = useRef<number>(0);
  const lastFaceMetaRef = useRef<any>(null);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const connectWs = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname || 'localhost';
    const wsUrl = protocol + '//' + wsHost + ':8000/api/v1/ws/live';

    console.log('[Live] Connecting to WebSocket:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[Live] WebSocket connected!');
      setWsConnected(true);
    };

    socket.onclose = () => {
      console.log('[Live] WebSocket closed. Reconnecting in 3s...');
      setWsConnected(false);
      setTimeout(connectWs, 3000);
    };

    socket.onerror = (err) => {
      console.error('[Live] WebSocket error:', err);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'recognition_result') {
          handleRecognitionResult(data);
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    setWs(socket);
    return socket;
  }, []);

  const handleRecognitionResult = (data: any) => {
    lastResultRef.current = data;
    setCurrentResult(data);

    if (data.voice_triggered && data.voice_text) {
      playChime('success');
      speak(data.voice_text);
    }

    if (data.status === 'recognized' && data.confirmed) {
      setRecentDetections((prev) => {
        const item = {
          id: Date.now(),
          name: data.name,
          confidence: data.confidence,
          time: new Date().toLocaleTimeString('th-TH')
        };
        return [item, ...prev.slice(0, 7)];
      });
    }
  };

  // Synchronize Edge AI confirmations with voice & attendance feed
  const lastEdgeConfirmedRef = useRef<boolean>(false);
  const lastEdgeSpeechTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!wsConnected && clientFaceResult.confirmed && clientFaceResult.status === 'recognized') {
      const now = Date.now();
      if (!lastEdgeConfirmedRef.current && (now - lastEdgeSpeechTimeRef.current > 7000)) {
        lastEdgeConfirmedRef.current = true;
        lastEdgeSpeechTimeRef.current = now;
        playChime('success');
        speak(`ยินดีต้อนรับ ${clientFaceResult.name || 'คุณยายสมศรี'} ค่ะ`);

        const item = {
          id: now,
          name: clientFaceResult.name || 'คุณยายสมศรี',
          confidence: clientFaceResult.confidence,
          time: new Date().toLocaleTimeString('th-TH')
        };
        setRecentDetections((prev) => [item, ...prev.slice(0, 7)]);
      }
    } else if (!clientFaceResult.confirmed) {
      lastEdgeConfirmedRef.current = false;
    }
  }, [clientFaceResult.confirmed, clientFaceResult.status, clientFaceResult.name, wsConnected, playChime, speak]);

  const activeResult = (wsConnected && currentResult && currentResult.status !== 'no_face')
    ? currentResult
    : clientFaceResult;

  // Continuous 60FPS Render Loop (ขยับตามร่างกาย 100% เรียลไทม์)
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      renderUnifiedOverlay();
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [enableBodyTracking]);

  const renderUnifiedOverlay = () => {
    const canvas = canvasOverlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.videoWidth === 0) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const serverFaceData = lastResultRef.current;
    const clientFace = latestFaceRef.current;
    const currentPose = latestPoseRef.current;
    const now = performance.now();

    // 1. Live Dynamic MediaPipe Pose Skeleton (60FPS EMA Smoothed)
    if (enableBodyTracking) {
      if (currentPose && currentPose.detected && currentPose.landmarks && currentPose.landmarks.length > 0) {
        drawLiveMediaPipePose(ctx, currentPose, canvas.width, canvas.height, serverFaceData || clientFace);
      } else if (serverFaceData?.body?.detected) {
        drawFallbackKinematicBody(ctx, serverFaceData.body, serverFaceData.confirmed);
      }
    }

    // 2. Select active face data (prefer server if connected & valid, else rock-solid client face)
    const activeFaceData = (wsConnected && serverFaceData && serverFaceData.box && serverFaceData.status !== 'no_face')
      ? serverFaceData
      : (clientFace?.detected && clientFace.box ? clientFace : null);

    let activeTargetBox: any = null;
    let isProfileActive = false;

    if (activeFaceData && activeFaceData.box) {
      activeTargetBox = activeFaceData.box;
      lastSeenFaceTimeRef.current = now;
      lastFaceMetaRef.current = activeFaceData;
      isProfileActive = Boolean(activeFaceData.is_profile);
    } else if (currentPose?.headBox && (now - lastSeenFaceTimeRef.current < 900)) {
      // Graceful fallback during rapid profile turn: track head via MediaPipe Pose
      activeTargetBox = currentPose.headBox;
      isProfileActive = true;
    }

    if (activeTargetBox) {
      // 60FPS LERP interpolation
      if (!smoothFaceBoxRef.current) {
        smoothFaceBoxRef.current = {
          x: activeTargetBox.x,
          y: activeTargetBox.y,
          width: activeTargetBox.width,
          height: activeTargetBox.height
        };
      } else {
        const cur = smoothFaceBoxRef.current;
        const lerpFactor = 0.32;
        cur.x += (activeTargetBox.x - cur.x) * lerpFactor;
        cur.y += (activeTargetBox.y - cur.y) * lerpFactor;
        cur.width += (activeTargetBox.width - cur.width) * lerpFactor;
        cur.height += (activeTargetBox.height - cur.height) * lerpFactor;
      }

      // Smooth landmarks
      if (activeTargetBox.landmarks && activeTargetBox.landmarks.length > 0) {
        if (!smoothLandmarksRef.current) {
          smoothLandmarksRef.current = activeTargetBox.landmarks.map((pt: number[]) => [...pt]);
        } else {
          smoothLandmarksRef.current = smoothLandmarksRef.current.map((curPt, idx) => {
            const tgtPt = activeTargetBox.landmarks[idx];
            if (!tgtPt) return curPt;
            return [
              curPt[0] + (tgtPt[0] - curPt[0]) * 0.32,
              curPt[1] + (tgtPt[1] - curPt[1]) * 0.32
            ];
          });
        }
      }

      const meta = lastFaceMetaRef.current || activeFaceData || {};
      const orientationLabel = isProfileActive
        ? (currentPose?.posture_th || meta.orientation_th || 'หันข้าง')
        : (meta.orientation_th || 'หน้าตรง');

      const renderFaceData = {
        ...meta,
        is_profile: isProfileActive || meta.is_profile,
        orientation_th: orientationLabel,
        box: {
          ...smoothFaceBoxRef.current,
          landmarks: smoothLandmarksRef.current || meta.box?.landmarks
        }
      };

      drawFaceBoxOverlay(ctx, renderFaceData);
    } else {
      // Decay smoothly when no face is seen after 900ms
      if (smoothFaceBoxRef.current && (now - lastSeenFaceTimeRef.current > 900)) {
        smoothFaceBoxRef.current = null;
        smoothLandmarksRef.current = null;
      }
    }
  };

  const drawLiveMediaPipePose = (
    ctx: CanvasRenderingContext2D,
    pose: BodyPoseResult,
    vw: number,
    vh: number,
    faceData: any
  ) => {
    const lms = pose.landmarks;
    const isConfirmed = faceData?.confirmed;
    const strokeColor = isConfirmed ? '#10B981' : '#06B6D4';
    const glowColor = isConfirmed ? 'rgba(16, 185, 129, 0.6)' : 'rgba(6, 182, 212, 0.6)';

    // Dynamic Body Bounding Box that expands/contracts with arms
    const { x: bx, y: by, width: bw, height: bh } = pose.box;
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;

    const bLen = Math.min(45, bw * 0.15);
    // 4 Cyber Corners
    ctx.beginPath();
    ctx.moveTo(bx, by + bLen); ctx.lineTo(bx, by); ctx.lineTo(bx + bLen, by);
    ctx.moveTo(bx + bw - bLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bLen);
    ctx.moveTo(bx, by + bh - bLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bLen, by + bh);
    ctx.moveTo(bx + bw - bLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - bLen);
    ctx.stroke();

    ctx.globalAlpha = 0.15;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();

    // Cyber Header Banner with real-time gesture tracking
    const gestureText = pose.isArmRaised
      ? `⚡ ${pose.posture_th} (DETECTED)`
      : `👤 LIVE POSE: ${pose.posture_th}`;

    ctx.save();
    ctx.font = 'bold 12px Outfit, sans-serif';
    const bTextW = ctx.measureText(gestureText).width;
    const bBannerH = 24;
    const bBannerY = Math.max(8, by - bBannerH - 6);

    ctx.fillStyle = pose.isArmRaised ? 'rgba(234, 88, 12, 0.94)' : 'rgba(9, 14, 26, 0.92)';
    ctx.beginPath();
    ctx.roundRect(bx, bBannerY, bTextW + 22, bBannerH, 4);
    ctx.fill();

    ctx.strokeStyle = pose.isArmRaised ? '#F97316' : strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = pose.isArmRaised ? '#FFF7ED' : '#22D3EE';
    ctx.fillText(gestureText, bx + 11, bBannerY + 16);
    ctx.restore();

    // Real-time Glowing Skeletal Bones (ขยับตามแขน/ข้อต่อจริง 100%)
    ctx.save();
    ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.92)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    POSE_CONNECTIONS_MAP.forEach(([idxA, idxB]) => {
      const ptA = lms[idxA];
      const ptB = lms[idxB];
      if (
        ptA && ptB &&
        (ptA.visibility ?? 1) > 0.35 &&
        (ptB.visibility ?? 1) > 0.35
      ) {
        ctx.beginPath();
        ctx.moveTo(ptA.x * vw, ptA.y * vh);
        ctx.lineTo(ptB.x * vw, ptB.y * vh);
        ctx.stroke();
      }
    });
    ctx.restore();

    // Real-time Joint Nodes
    ctx.save();
    lms.forEach((pt, idx) => {
      if (idx >= 11 && idx <= 32 && (pt.visibility ?? 1) > 0.35) {
        const px = pt.x * vw;
        const py = pt.y * vh;

        const isWrist = idx === 15 || idx === 16;
        const nodeColor = isWrist ? '#F59E0B' : '#10B981';

        ctx.shadowColor = isWrist ? 'rgba(245, 158, 11, 0.95)' : 'rgba(16, 185, 129, 0.95)';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(px, py, isWrist ? 7 : 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    });

    // Biometric Core at Chest
    if (lms[11] && lms[12]) {
      const chestX = ((lms[11].x + lms[12].x) / 2) * vw;
      const chestY = (((lms[11].y + lms[12].y) / 2) + 0.04) * vh;
      ctx.beginPath();
      ctx.arc(chestX, chestY, 13, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawFallbackKinematicBody = (
    ctx: CanvasRenderingContext2D,
    body: any,
    isConfirmed: boolean
  ) => {
    const { x: bx, y: by, width: bw, height: bh } = body.box;
    const strokeColor = isConfirmed ? '#10B981' : '#06B6D4';

    ctx.save();
    ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;

    const bLen = Math.min(40, bw * 0.15);
    ctx.beginPath();
    ctx.moveTo(bx, by + bLen); ctx.lineTo(bx, by); ctx.lineTo(bx + bLen, by);
    ctx.moveTo(bx + bw - bLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bLen);
    ctx.moveTo(bx, by + bh - bLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bLen, by + bh);
    ctx.moveTo(bx + bw - bLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - bLen);
    ctx.stroke();

    ctx.globalAlpha = 0.15;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
  };

  const drawFaceBoxOverlay = (ctx: CanvasRenderingContext2D, data: any) => {
    const { x, y, width: w, height: h, landmarks } = data.box;
    const isConfirmed = Boolean(data.confirmed);
    const isRecognized = data.status === 'recognized';
    const isUnknown = data.status === 'unknown';
    const isProfile = Boolean(data.is_profile);

    let strokeColor = '#06B6D4';
    let glowColor = 'rgba(6, 182, 212, 0.45)';
    if (isConfirmed) {
      strokeColor = '#10B981';
      glowColor = 'rgba(16, 185, 129, 0.6)';
    } else if (isUnknown) {
      strokeColor = '#F59E0B';
      glowColor = 'rgba(245, 158, 11, 0.45)';
    }

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.8;

    // 1. High-Tech Precision Corner Brackets
    const lineLen = Math.min(32, w * 0.22);
    ctx.beginPath();
    ctx.moveTo(x, y + lineLen); ctx.lineTo(x, y); ctx.lineTo(x + lineLen, y);
    ctx.moveTo(x + w - lineLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + lineLen);
    ctx.moveTo(x, y + h - lineLen); ctx.lineTo(x, y + h); ctx.lineTo(x + lineLen, y + h);
    ctx.moveTo(x + w - lineLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - lineLen);
    ctx.stroke();

    // Subtle inner bounding box outline
    ctx.globalAlpha = 0.18;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    // 2. Cyber Laser Scanning Sweep (Smooth 60FPS)
    ctx.save();
    const now = performance.now();
    const scanPeriod = 2200; // ms per sweep
    const scanProg = (now % scanPeriod) / scanPeriod;
    const scanY = y + h * scanProg;

    const scanGrad = ctx.createLinearGradient(x, scanY, x + w, scanY);
    scanGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
    scanGrad.addColorStop(0.5, isConfirmed ? 'rgba(16, 185, 129, 0.85)' : 'rgba(6, 182, 212, 0.85)');
    scanGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(x, scanY - 1.5, w, 3);
    ctx.restore();

    // 3. Precision Face Center Reticle
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
    ctx.stroke();
    ctx.restore();

    // 4. Biometric Landmark Nodes with Glow
    if (landmarks && landmarks.length >= 5) {
      ctx.save();
      landmarks.forEach((pt: number[], idx: number) => {
        let nodeColor = '#38BDF8';
        let glowNode = 'rgba(56, 189, 248, 0.8)';
        if (idx === 2) {
          // Nose tip
          nodeColor = '#F59E0B';
          glowNode = 'rgba(245, 158, 11, 0.8)';
        } else if (idx === 3) {
          // Mouth center
          nodeColor = '#10B981';
          glowNode = 'rgba(16, 185, 129, 0.8)';
        } else if (idx >= 4) {
          // Ears
          nodeColor = '#EC4899';
          glowNode = 'rgba(236, 72, 153, 0.8)';
        }

        ctx.shadowColor = glowNode;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });
      ctx.restore();
    }

    // 5. High-Tech Identification Banner
    const confPercent = Math.round((data.confidence || 0.95) * 100);
    const orientationLabel = data.orientation_th || 'หน้าตรง';
    
    let label = '';
    if (isConfirmed) {
      label = `✓ ${data.name || 'ยืนยันตัวตนสำเร็จ'} (${confPercent}%)`;
    } else if (isRecognized) {
      label = `Verifying... ${confPercent}% • ${orientationLabel}`;
    } else if (isProfile) {
      label = `⚡ ${orientationLabel} (Tracking 60FPS)`;
    } else if (isUnknown) {
      label = `Unknown Person • ${orientationLabel}`;
    } else {
      label = `Face Locked (60 FPS) • ${orientationLabel}`;
    }

    ctx.save();
    ctx.font = 'bold 12.5px Outfit, sans-serif';
    const textWidth = ctx.measureText(label).width;
    const bannerH = 26;
    const bannerY = Math.max(10, y - bannerH - 6);

    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.beginPath();
    ctx.roundRect(x, bannerY, textWidth + 24, bannerH, 4);
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = strokeColor;
    ctx.fillText(label, x + 12, bannerY + 18);
    ctx.restore();
  };

  useEffect(() => {
    let frameTimer: any;

    const sendFrame = () => {
      if (ws && ws.readyState === WebSocket.OPEN && isActive) {
        const frameB64 = captureFrame();
        if (frameB64) {
          ws.send(JSON.stringify({
            type: 'frame',
            image: frameB64,
            camera_id: selectedCameraId || 'webcam_0'
          }));
        }
      }
      frameTimer = setTimeout(sendFrame, 120);
    };

    if (isActive && wsConnected) {
      sendFrame();
    }

    return () => {
      if (frameTimer) clearTimeout(frameTimer);
    };
  }, [isActive, wsConnected, ws, captureFrame, selectedCameraId]);

  useEffect(() => {
    startCamera();
    const socket = connectWs();

    return () => {
      stopCamera();
      if (socket) socket.close();
    };
  }, []);

  const handleResetTracker = async () => {
    await api.resetTracker();
    setCurrentResult(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">Live Face Recognition</h1>
            {wsConnected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Backend Synced
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                ⚡ Edge AI 60 FPS (สถียรภาพสูง)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            การตรวจจับใบหน้าแบบสดผ่านกล้องพร้อมระบบ Anti-False Recognition & เสียง AI ตอบรับ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSpeaking && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-pulse">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>AI Speaking...</span>
            </div>
          )}

          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startCamera(e.target.value);
              }}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 shadow-sm font-medium"
            >
              {cameras.map((c, i) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || 'Camera ' + (i + 1)}
                </option>
              ))}
            </select>
          )}

          {/* Zoom Selector in Header */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-1.5">ซูม:</span>
            {[1.0, 1.25, 1.5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setZoomLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  zoomLevel === lvl
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {lvl}x
              </button>
            ))}
          </div>

          {/* Theater Mode Toggle */}
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              isTheaterMode
                ? 'bg-purple-600 text-white border-purple-500 font-bold shadow-purple-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isTheaterMode ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            <span>โหมดจอใหญ่: {isTheaterMode ? 'เปิด' : 'ปิด'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-sm"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-600" /> : <Maximize className="w-3.5 h-3.5 text-cyan-600" />}
            <span>{isFullscreen ? 'ย่อหน้าจอ' : 'เต็มจอ'}</span>
          </button>

          <button
            onClick={() => setEnableBodyTracking(!enableBodyTracking)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              enableBodyTracking
                ? 'bg-cyan-500 text-white border-cyan-400 font-bold shadow-cyan-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>ตรวจจับทั้งร่างกาย: {enableBodyTracking ? 'เปิด' : 'ปิด'}</span>
          </button>

          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              showDebug
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>AI Debug HUD</span>
          </button>

          <button
            onClick={handleResetTracker}
            title="Reset Temporal Multi-frame Counter"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset State</span>
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      {isTheaterMode ? (
        /* Theater Mode: Full-width massive camera viewport */
        <div className="space-y-6">
          {/* Massive Cinema Viewport */}
          <div
            ref={containerRef}
            className={`relative rounded-3xl overflow-hidden glass-panel border border-white/10 bg-black shadow-2xl flex items-center justify-center transition-all duration-300 ${
              isFullscreen
                ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
                : 'w-full h-[78vh] min-h-[640px] max-h-[880px]'
            }`}
          >
            {/* Zoomable Inner Container */}
            <div
              className="relative w-full h-full flex items-center justify-center overflow-hidden transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              <canvas
                ref={canvasOverlayRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />
            </div>

            {/* Quick Floating Overlays on Video Top Right */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 shadow-2xl">
              {/* Zoom Buttons inside camera */}
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-xl text-slate-300">
                <span className="text-[10px] text-slate-400 font-mono">ซูม:</span>
                {[1.0, 1.25, 1.5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setZoomLevel(lvl)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      zoomLevel === lvl
                        ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {lvl}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsTheaterMode(false)}
                title="ย่อเป็นโหมดแบ่งข้าง"
                className="p-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white border border-purple-400/40 transition-all cursor-pointer shadow-purple-600/30 flex items-center gap-1"
              >
                <Shrink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">ย่อข้าง</span>
              </button>

              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'ย่อหน้าจอ' : 'เต็มหน้าจอ'}
                className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/40 transition-all cursor-pointer shadow-cyan-600/30 flex items-center gap-1"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[11px]">{isFullscreen ? 'ปกติ' : 'เต็มจอ'}</span>
              </button>
            </div>

            <DebugOverlay
              visible={showDebug}
              telemetry={activeResult?.telemetry}
              status={activeResult?.status || 'no_face'}
              confidence={activeResult?.confidence || 0}
              body={enableBodyTracking ? (poseData || activeResult?.body) : null}
            />

            <div className="absolute bottom-5 inset-x-0 flex justify-center z-20 pointer-events-none">
              <ConfirmationBadge
                status={activeResult?.status || 'no_face'}
                name={activeResult?.name}
                confidence={activeResult?.confidence || 0}
                confirmed={activeResult?.confirmed || false}
                count={activeResult?.confirmation_count || 0}
                target={activeResult?.confirmation_target || 3}
              />
            </div>

            {!isActive && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 mb-4">
                  <VideoOff className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">Camera Not Started</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  {cameraError || 'โปรดอนุญาตให้เข้าถึงเว็บแคม เพื่อเริ่มต้นระบบตรวจจับใบหน้าแบบเรียลไทม์'}
                </p>
                <button
                  onClick={() => startCamera()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปิดการทำงานกล้อง</span>
                </button>
              </div>
            )}
          </div>

          {/* Under-Camera Dashboard Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Detections Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm font-['Outfit']">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>ประวัติการตรวจจับล่าสุด (Recent Detections)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  LIVE FEED
                </span>
              </div>

              {recentDetections.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-indigo-400 animate-pulse" />
                  <span>ยังไม่มีรายการตรวจจับ — เมื่อยืนยันตัวตนสำเร็จ รายชื่อจะปรากฏตรงนี้</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recentDetections.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs animate-fadeIn"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-emerald-600 font-mono">
                            {Math.round(item.confidence * 100)}% Confidence
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono text-right">
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Testing Tips Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="font-bold text-slate-900 text-sm font-['Outfit'] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span>คำแนะนำ & สถานะกล้อง</span>
                </div>
                <div className="mt-3 text-xs text-slate-600 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>หน้าจอใหญ่พิเศษ:</strong> ภาพคมชัดเต็มพื้นที่ เห็นการเคลื่อนไหวทั้งใบหน้าและร่างกาย</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">✓</span>
                    <span><strong>ซูมใบหน้า:</strong> คลิกปุ่ม 1x, 1.25x หรือ 1.5x เพื่อขยายให้เห็นใบหน้าชัดเจนขึ้น</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">✓</span>
                    <span><strong>ตรวจจับแม่นยำ:</strong> ระบบ Anti-False ตรวจซ้ำ 3 เฟรมพร้อมเสียงพูดตอบรับ</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-100 text-[11px] text-cyan-800">
                💡 <strong>เคล็ดลับ:</strong> กดปุ่ม <strong>[เต็มจอ]</strong> บนกล้อง เพื่อขยายเป็นแบบ Fullscreen ขอบจรดขอบจอ
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Split Mode: 3-column video + 1-column sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div
            ref={containerRef}
            className={`lg:col-span-3 relative rounded-3xl overflow-hidden glass-panel border border-white/10 bg-black shadow-2xl flex items-center justify-center transition-all duration-300 ${
              isFullscreen
                ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
                : 'h-[72vh] min-h-[580px]'
            }`}
          >
            <div
              className="relative w-full h-full flex items-center justify-center overflow-hidden transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              <canvas
                ref={canvasOverlayRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />
            </div>

            {/* Quick Floating Overlays */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 shadow-2xl">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-xl text-slate-300">
                <span className="text-[10px] text-slate-400 font-mono">ซูม:</span>
                {[1.0, 1.25, 1.5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setZoomLevel(lvl)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      zoomLevel === lvl
                        ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {lvl}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsTheaterMode(true)}
                title="ขยายเป็นโหมดจอใหญ่"
                className="p-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white border border-purple-400/40 transition-all cursor-pointer shadow-purple-600/30 flex items-center gap-1"
              >
                <Expand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">จอใหญ่</span>
              </button>

              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'ย่อหน้าจอ' : 'เต็มหน้าจอ'}
                className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/40 transition-all cursor-pointer shadow-cyan-600/30 flex items-center gap-1"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[11px]">{isFullscreen ? 'ปกติ' : 'เต็มจอ'}</span>
              </button>
            </div>

            <DebugOverlay
              visible={showDebug}
              telemetry={activeResult?.telemetry}
              status={activeResult?.status || 'no_face'}
              confidence={activeResult?.confidence || 0}
              body={enableBodyTracking ? (poseData || activeResult?.body) : null}
            />

            <div className="absolute bottom-5 inset-x-0 flex justify-center z-20 pointer-events-none">
              <ConfirmationBadge
                status={activeResult?.status || 'no_face'}
                name={activeResult?.name}
                confidence={activeResult?.confidence || 0}
                confirmed={activeResult?.confirmed || false}
                count={activeResult?.confirmation_count || 0}
                target={activeResult?.confirmation_target || 3}
              />
            </div>

            {!isActive && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 mb-4">
                  <VideoOff className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit']">Camera Not Started</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  {cameraError || 'โปรดอนุญาตให้เข้าถึงเว็บแคม เพื่อเริ่มต้นระบบตรวจจับใบหน้าแบบเรียลไทม์'}
                </p>
                <button
                  onClick={() => startCamera()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปิดการทำงานกล้อง</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm font-['Outfit']">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>ประวัติการตรวจจับล่าสุด</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                LIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[460px]">
              {recentDetections.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-indigo-400 animate-pulse" />
                  <span>ยืนยันตัวตนสำเร็จแล้ว รายชื่อจะปรากฏตรงนี้</span>
                </div>
              ) : (
                recentDetections.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs animate-fadeIn"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-emerald-600 font-mono">
                          {Math.round(item.confidence * 100)}% Confidence
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      {item.time}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
              <div className="font-semibold text-slate-700">คำแนะนำการทดสอบ:</div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>ระบบต้องการตรวจพบคนเดิมต่อเนื่อง 3 เฟรม เพื่อป้องกันการเรียกชื่อผิด</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>มี Cooldown 6 วินาที ไม่ส่งเสียงซ้ำเมื่อยังยืนอยู่หน้ากล้อง</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};