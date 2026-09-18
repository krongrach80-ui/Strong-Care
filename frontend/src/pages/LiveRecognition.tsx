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
  Activity
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useSpeech } from '../hooks/useSpeech';
import { DebugOverlay } from '../components/DebugOverlay';
import { ConfirmationBadge } from '../components/ConfirmationBadge';
import { api } from '../services/api';

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

  const [currentResult, setCurrentResult] = useState<any>(null);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);

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

    drawFaceOverlay(data);
  };

  const drawFaceOverlay = (data: any) => {
    const canvas = canvasOverlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!data.box || data.status === 'no_face') return;

    const { x, y, width: w, height: h, landmarks } = data.box;
    const isConfirmed = data.confirmed;
    const isRecognized = data.status === 'recognized';
    const isUnknown = data.status === 'unknown';

    let strokeColor = '#06B6D4';
    let glowColor = 'rgba(6, 182, 212, 0.4)';
    if (isConfirmed) {
      strokeColor = '#10B981';
      glowColor = 'rgba(16, 185, 129, 0.5)';
    } else if (isUnknown) {
      strokeColor = '#F59E0B';
      glowColor = 'rgba(245, 158, 11, 0.4)';
    }

    // 1. FULL BODY & KINEMATIC POSE SKELETON (ตรวจจับทั้งร่างกาย)
    if (enableBodyTracking && data.body && data.body.detected) {
      const { x: bx, y: by, width: bw, height: bh } = data.body.box;

      // 1.1 Full Body Cyber Corners & Boundary
      ctx.save();
      ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 3;

      const bLen = Math.min(45, bw * 0.15);
      // Top-Left Corner
      ctx.beginPath();
      ctx.moveTo(bx, by + bLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + bLen, by);
      ctx.stroke();

      // Top-Right Corner
      ctx.beginPath();
      ctx.moveTo(bx + bw - bLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + bLen);
      ctx.stroke();

      // Bottom-Left Corner
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - bLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + bLen, by + bh);
      ctx.stroke();

      // Bottom-Right Corner
      ctx.beginPath();
      ctx.moveTo(bx + bw - bLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - bLen);
      ctx.stroke();

      // Faint cyber boundary
      ctx.globalAlpha = 0.18;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();

      // 1.2 Full Body Cyber Header Banner
      const postureLabel = data.body.posture_th || data.body.posture || 'Upright';
      const bodyHeader = `👤 HUMAN BODY DETECTED • ${postureLabel} (${data.body.coverage_percent || 0}% VIEW)`;
      ctx.save();
      ctx.font = 'bold 12px Outfit, sans-serif';
      const bTextW = ctx.measureText(bodyHeader).width;
      const bBannerH = 24;
      const bBannerY = Math.max(8, by - bBannerH - 6);

      ctx.fillStyle = 'rgba(9, 14, 26, 0.92)';
      ctx.beginPath();
      ctx.roundRect(bx, bBannerY, bTextW + 20, bBannerH, 4);
      ctx.fill();

      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#22D3EE';
      ctx.fillText(bodyHeader, bx + 10, bBannerY + 16);
      ctx.restore();

      // 1.3 Glowing Cyber Pose Skeleton (เส้นกระดูกและข้อต่อเรืองแสง)
      if (data.body.keypoints && data.body.keypoints.length > 0) {
        const kpMap: Record<string, { x: number; y: number; conf: number }> = {};
        data.body.keypoints.forEach((kp: any) => {
          kpMap[kp.id] = kp;
        });

        const bones = [
          ['head', 'neck'],
          ['neck', 'chest'],
          ['neck', 'l_shoulder'],
          ['neck', 'r_shoulder'],
          ['l_shoulder', 'r_shoulder'],
          ['l_shoulder', 'l_elbow'],
          ['l_elbow', 'l_wrist'],
          ['r_shoulder', 'r_elbow'],
          ['r_elbow', 'r_wrist'],
          ['chest', 'spine'],
          ['spine', 'l_hip'],
          ['spine', 'r_hip'],
          ['l_hip', 'r_hip'],
          ['l_shoulder', 'l_hip'],
          ['r_shoulder', 'r_hip']
        ];

        // Draw Skeletal Lines
        ctx.save();
        ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'; // Neon Sky Blue
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        bones.forEach(([idA, idB]) => {
          const pA = kpMap[idA];
          const pB = kpMap[idB];
          if (pA && pB) {
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        });
        ctx.restore();

        // Draw Joint Nodes (วงแหวนข้อต่อชีวมิติ)
        ctx.save();
        data.body.keypoints.forEach((kp: any) => {
          if (kp.id === 'head' || kp.id === 'nose') return;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.95)';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 5.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#10B981'; // Emerald glow
          ctx.fill();

          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        });

        // Biometric Core Pulse at Chest
        const chest = kpMap['chest'];
        if (chest) {
          ctx.beginPath();
          ctx.arc(chest.x, chest.y, 12, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 2. INNER FACE BOX & FACIAL LANDMARKS
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;

    const lineLen = Math.min(25, w * 0.2);
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + lineLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + lineLen, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - lineLen, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + lineLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - lineLen);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + lineLen, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - lineLen, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - lineLen);
    ctx.stroke();

    ctx.globalAlpha = 0.4;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    if (landmarks && landmarks.length >= 5) {
      landmarks.forEach((pt: number[]) => {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 3, 0, 2 * Math.PI);
        ctx.fillStyle = strokeColor;
        ctx.fill();
      });
    }

    const confPercent = Math.round((data.confidence || 0) * 100);
    const label = isConfirmed
      ? '✓ ' + data.name + ' (' + confPercent + '%)'
      : isRecognized
      ? 'Verifying... ' + confPercent + '%'
      : isUnknown
      ? 'Unknown Person'
      : 'Analyzing...';

    ctx.font = 'bold 14px Outfit, sans-serif';
    const textWidth = ctx.measureText(label).width;
    const bannerH = 26;
    const bannerY = Math.max(10, y - bannerH - 8);

    ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, bannerY, textWidth + 24, bannerH, 6);
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = strokeColor;
    ctx.fillText(label, x + 12, bannerY + 18);
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

      {/* Main Grid: Video Stream & Activity Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative rounded-3xl overflow-hidden glass-panel border border-white/10 bg-black min-h-[480px] flex items-center justify-center shadow-2xl">
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

          <DebugOverlay
            visible={showDebug}
            telemetry={currentResult?.telemetry}
            status={currentResult?.status || 'no_face'}
            confidence={currentResult?.confidence || 0}
            body={enableBodyTracking ? currentResult?.body : null}
          />

          <div className="absolute bottom-5 inset-x-0 flex justify-center z-20 pointer-events-none">
            <ConfirmationBadge
              status={currentResult?.status || 'no_face'}
              name={currentResult?.name}
              confidence={currentResult?.confidence || 0}
              confirmed={currentResult?.confirmed || false}
              count={currentResult?.confirmation_count || 0}
              target={currentResult?.confirmation_target || 3}
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
    </div>
  );
};