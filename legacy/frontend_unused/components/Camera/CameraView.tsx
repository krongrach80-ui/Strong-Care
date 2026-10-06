import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Sparkles, RefreshCw, Eye, EyeOff, Maximize2, Minimize2, Smile, Hand, Activity, ShieldCheck } from 'lucide-react';
import { PoseCanvas } from '../PoseCanvas/PoseCanvas';
import { PoseLandmarks } from '../../types/pose';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraReady: boolean;
  isCameraLoading?: boolean;
  cameraError: string | null;
  landmarks: PoseLandmarks | null;
  handLandmarks?: PoseLandmarks[] | null;
  faceLandmarks?: PoseLandmarks | null;
  startCamera: () => void;
  stopCamera: () => void;
  isMockMode: boolean;
  setMockMode: (val: boolean) => void;
  isCorrect?: boolean;
  activeJointPoint?: { x: number; y: number } | null;
  currentAngle?: number;
  fps?: number;
  isFrontCamera?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  isCameraReady,
  isCameraLoading = false,
  cameraError,
  landmarks,
  handLandmarks = null,
  faceLandmarks = null,
  startCamera,
  stopCamera,
  isMockMode,
  setMockMode,
  isCorrect = true,
  activeJointPoint,
  currentAngle,
  fps = 0,
  isFrontCamera = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Canvas Resolution Synchronization:
  // Dynamically tracks the exact hardware pixel dimensions of the camera stream
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number }>({
    width: 640,
    height: 480,
  });

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showFaceProportions, setShowFaceProportions] = useState(true);
  const [showHandFingers, setShowHandFingers] = useState(true);
  const [showArmBorders, setShowArmBorders] = useState(true);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // 3. Mirror / Transform Handling:
  // When front camera is active, video is flipped with CSS transform -scale-x-100,
  // and canvas landmarks are mirrored on the X-axis via (1 - x) * width.
  const isMirrored = isCameraReady ? isFrontCamera : false;

  // Synchronization callback to capture true videoWidth / videoHeight
  const syncResolution = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      setVideoResolution((prev) => {
        if (prev.width !== video.videoWidth || prev.height !== video.videoHeight) {
          return { width: video.videoWidth, height: video.videoHeight };
        }
        return prev;
      });
    }
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => syncResolution();
    const handleResize = () => syncResolution();
    const handlePlaying = () => syncResolution();

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('resize', handleResize);
    video.addEventListener('playing', handlePlaying);

    // Initial check
    syncResolution();
    const timer = setTimeout(syncResolution, 300);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('resize', handleResize);
      video.removeEventListener('playing', handlePlaying);
      clearTimeout(timer);
    };
  }, [videoRef, syncResolution, isCameraReady]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/11] sm:aspect-video max-h-[min(38vh,260px)] sm:max-h-[min(70vh,560px)] bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 shadow-xl shadow-cyan-950/20 group"
      style={{ position: 'relative' }}
    >
      {/* Real Video Stream: Positioned absolutely inside the relative container */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        onLoadedMetadata={() => {
          syncResolution();
          videoRef.current?.play().catch(() => {});
        }}
        onPlaying={syncResolution}
        className={`absolute inset-0 w-full h-full ${
          fitMode === 'contain' ? 'object-contain' : 'object-cover'
        } ${isMirrored ? 'transform -scale-x-100' : ''} transition-opacity duration-300 ${
          isCameraReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Simulated Rehab Canvas Background ONLY when camera is truly NOT ready */}
      {!isCameraReady && !cameraError && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-[#090d16] text-slate-400 p-6 relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25" />

          {isCameraLoading ? (
            <div className="z-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-pulse">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-white">กำลังเชื่อมต่อกล้องเว็บแคม...</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                กรุณารอสักครู่ หรือคลิก <span className="text-emerald-400 font-semibold">"Allow (อนุญาต)"</span> หากเบราว์เซอร์มีหน้าต่างขอสิทธิ์ใช้งานกล้อง
              </p>
            </div>
          ) : isMockMode ? (
            <div className="z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-emerald-300">โหมดจำลอง AI Vision สำหรับสาธิต</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
                ระบบกำลังจำลองการเคลื่อนไหว 33 จุด เพื่อทดสอบมุมและ State Machine
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition inline-flex items-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" /> เปิดกล้องจริง (Open Camera)
                </button>
              </div>
            </div>
          ) : (
            <div className="z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">กล้องยังไม่ได้เปิด</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                กดปุ่มด้านล่างเพื่อเปิดกล้องเว็บแคมสำหรับตรวจจับท่าทางกายภาพ
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition inline-flex items-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" /> เปิดกล้องทันที
                </button>
                <button
                  onClick={() => setMockMode(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> โหมดจำลอง
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Error Message */}
      {cameraError && !isCameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/92 p-3 sm:p-6 text-center z-20 overflow-y-auto">
          <CameraOff className="w-8 h-8 sm:w-12 sm:h-12 text-amber-500 mb-2 flex-shrink-0" />
          <h4 className="text-white font-semibold text-xs sm:text-sm mb-1">ไม่สามารถเข้าถึงกล้องเว็บแคมได้</h4>
          <p className="text-[11px] sm:text-xs text-slate-300 max-w-sm mb-3 leading-relaxed">{cameraError}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={startCamera}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg font-medium text-xs hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 min-h-[36px]"
            >
              <Camera className="w-3.5 h-3.5" /> ลองเปิดใหม่อีกครั้ง
            </button>
            {typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
              <a
                href={`https://${window.location.host}${window.location.pathname}${window.location.search}`}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-cyan-600 text-white rounded-lg font-medium text-xs hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 min-h-[36px]"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> สลับไปใช้ HTTPS
              </a>
            )}
            <button
              onClick={() => setMockMode(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-medium text-xs hover:bg-slate-700 transition flex items-center gap-1.5 min-h-[36px]"
            >
              <Sparkles className="w-3.5 h-3.5" /> โหมดจำลอง
            </button>
          </div>
        </div>
      )}

      {/* Real-time Pose Skeleton Overlay: Canvas synchronized with video resolution and alignment */}
      {showSkeleton && (
        <PoseCanvas
          landmarks={landmarks}
          handLandmarks={handLandmarks}
          faceLandmarks={faceLandmarks}
          width={videoResolution.width}
          height={videoResolution.height}
          isCorrect={isCorrect}
          activeJointPoint={activeJointPoint}
          currentAngle={currentAngle}
          isMirrored={isMirrored}
          fitMode={fitMode}
          showFaceProportions={showFaceProportions}
          showHandFingers={showHandFingers}
          showArmBorders={showArmBorders}
        />
      )}

      {/* Posture Frame Guide Silhouette */}
      <div className="absolute inset-4 border-2 border-dashed border-cyan-500/20 rounded-xl pointer-events-none" />

      {/* Status Bar Overlay (Top) */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between pointer-events-none z-30 gap-2">
        {/* Left Status Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-md whitespace-nowrap ${
              isCorrect
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-ping flex-shrink-0 ${
                isCorrect ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span>{isCorrect ? 'FORM OK' : 'CHECK FORM'}</span>
          </span>

          {fps > 0 && (
            <span className="hidden xs:inline-flex px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-mono bg-slate-900/80 border border-slate-800 text-cyan-400 backdrop-blur-md whitespace-nowrap">
              {fps} FPS
            </span>
          )}
        </div>

        {/* Action Controls (Top Right — Horizontally scrollable on small screens to never overflow) */}
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto overflow-x-auto no-scrollbar max-w-[65vw] sm:max-w-none py-0.5 justify-end">
          {/* Fit Mode Toggle (Cover vs Contain) */}
          <button
            onClick={() => setFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
            title={fitMode === 'cover' ? 'สลับเป็นโหมดเต็มตัว (Contain - ไม่ครอปภาพ)' : 'สลับเป็นโหมดเต็มกรอบ (Cover)'}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition backdrop-blur-md flex-shrink-0"
          >
            {fitMode === 'cover' ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />}
          </button>

          {/* Face Proportions Toggle */}
          <button
            onClick={() => setShowFaceProportions(!showFaceProportions)}
            title={showFaceProportions ? 'ซ่อนเส้นแบ่งสัดส่วนใบหน้า' : 'แสดงเส้นแบ่งสัดส่วนใบหน้า (Face Grid)'}
            className={`p-1.5 sm:p-2 rounded-lg border transition backdrop-blur-md flex-shrink-0 ${
              showFaceProportions
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Hand Fingers Toggle */}
          <button
            onClick={() => setShowHandFingers(!showHandFingers)}
            title={showHandFingers ? 'ซ่อนกระดูกนิ้วมือ 5 นิ้ว' : 'แสดงกระดูกนิ้วมือ 5 นิ้ว'}
            className={`p-1.5 sm:p-2 rounded-lg border transition backdrop-blur-md flex-shrink-0 ${
              showHandFingers
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Dual Arm Borders Toggle */}
          <button
            onClick={() => setShowArmBorders(!showArmBorders)}
            title={showArmBorders ? 'สลับเป็นเส้นเดี่ยว / ขอบแขน 2 เส้น' : 'แสดงเส้นขอบแขน 2 เส้น'}
            className={`p-1.5 sm:p-2 rounded-lg border transition backdrop-blur-md flex-shrink-0 ${
              showArmBorders
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Skeleton Toggle */}
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            title="ซ่อน/แสดงโครงกระดูก Skeleton"
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition backdrop-blur-md flex-shrink-0"
          >
            {showSkeleton ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Simulation Toggle */}
          <button
            onClick={() => setMockMode(!isMockMode)}
            title="สลับระหว่างกล้องจริงและโมเดลจำลอง"
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border flex items-center gap-1 transition backdrop-blur-md flex-shrink-0 whitespace-nowrap ${
              isMockMode
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 flex-shrink-0" />
            <span>{isMockMode ? 'Sim' : 'Live'}</span>
          </button>

          {!isCameraReady ? (
            <button
              onClick={startCamera}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-lg shadow-emerald-600/30 flex-shrink-0 whitespace-nowrap min-h-[32px]"
            >
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span>เปิดกล้อง</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 flex-shrink-0 whitespace-nowrap min-h-[32px]"
            >
              <CameraOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span>ปิดกล้อง</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
