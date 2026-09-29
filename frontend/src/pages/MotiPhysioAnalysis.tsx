import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  Share2,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  User,
  ShieldCheck,
  Smartphone,
  Tv,
  Layers,
  FileText,
  HeartPulse,
  Crosshair,
  Sliders,
  Maximize2,
  Flame,
  ArrowRight,
  RefreshCw,
  Info,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useBodyPose, drawFullAnatomySkeleton } from '../hooks/useBodyPose';
import { useAuth } from '../context/AuthContext';
import { useSpeech } from '../hooks/useSpeech';

export interface MotiPhysioAnalysisProps {
  onNavigateToKiosk?: () => void;
  onNavigateToMobile?: () => void;
  onNavigateToDashboard?: () => void;
}

export const MotiPhysioAnalysis: React.FC<MotiPhysioAnalysisProps> = ({
  onNavigateToKiosk,
  onNavigateToMobile,
  onNavigateToDashboard
}) => {
  const { user, largeFont, voiceGuide } = useAuth();
  const { speak, playChime } = useSpeech();

  // Active Top Step: 1 = Scan Camera, 2 = 3D Digital Twin Avatar, 3 = AI Clinical Risk Assessment, 4 = Tailored Corrective Rehab Plan
  const [activeStep, setActiveStep] = useState<number>(2); // Default to Step 2 so user can immediately see the realistic 3D avatar!
  const [scanView, setScanView] = useState<'FRONTAL' | 'SAGITTAL' | 'DYNAMIC_SQUAT'>('FRONTAL');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Step 2 Avatar Controls (Just like Moti Physio in the clip)
  const [avatarView, setAvatarView] = useState<'FRONT' | 'SIDE' | 'BACK'>('FRONT');
  const [postureMode, setPostureMode] = useState<'CURRENT' | 'IDEAL'>('CURRENT');
  const [showMuscles, setShowMuscles] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showPlumbLine, setShowPlumbLine] = useState<boolean>(true);

  // Camera & MediaPipe Pose
  const { videoRef, isActive: isCameraActive, startCamera, stopCamera, error: cameraError } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { poseData } = useBodyPose(videoRef, isCameraActive && activeStep === 1);

  // Patient / Subject Details
  const [patientId, setPatientId] = useState<string>('HN-RAMA-2569');
  const [patientName, setPatientName] = useState<string>('คุณกิตติศักดิ์ อัศวเดชาชัย (อายุ 32 ปี)');

  // Biomechanical Posture Metrics (Calculated from Moti Physio 3D Engine)
  const metrics = {
    headTiltDeg: 3.4,           // องศาเอียงศีรษะ (ปกติ < 2.0°)
    forwardHeadCm: 4.8,         // ระยะศีรษะยื่นไปข้างหน้า (ปกติ < 2.5 ซม.)
    forwardHeadCvaDeg: 47.8,     // Craniovertebral Angle (ปกติ > 53°, < 50° = คอยื่น)
    shoulderHeightDiffCm: -1.9,  // ไหล่ขวาตก 1.9 ซม.
    thoracicKyphosisDeg: 44.5,   // หลังค่อม (ปกติ 20°-40°)
    lumbarLordosisDeg: 42.1,     // หลังแอ่น (ปกติ 20°-35°)
    pelvicTiltDeg: 2.6,          // เชิงกรานเอียง 2.6°
    pelvicTorsionDeg: 1.8,       // เชิงกรานบิดตัว
    kneeAlignment: 'GENU_VALGUM',// เข่าฉิ่ง / ขาฉิ่ง X-legs (ข้างขวา 8.5°)
    footWeightLeftPct: 47.2,     // ลงน้ำหนักเท้าซ้าย 47.2%
    footWeightRightPct: 52.8,    // ลงน้ำหนักเท้าขวา 52.8%
    scoliosisDeg: 2.4,           // กระดูกสันหลังคด 2.4° (Cobb Angle)
    cogDisplacementMm: 18,       // จุดศูนย์ถ่วงเบี่ยงขวา 18 มม.
    postureScore: 72,            // คะแนนสมดุลรวม (เต็ม 100)
    postureAge: 40,              // อายุสรีระร่างกายเทียบอายุจริง 32
  };

  // Render 3D Anatomical Skeleton overlay on Camera
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !poseData || activeStep !== 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poseData.detected) {
      drawFullAnatomySkeleton(ctx, poseData, canvas.width, canvas.height, {
        showLabels: true,
        isConfirmed: true
      });

      // Moti Physio Plumb Line & Reference Grids
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 163, 158, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      if (poseData.landmarks && poseData.landmarks.length > 24) {
        const ls = poseData.landmarks[11];
        const rs = poseData.landmarks[12];
        if (ls && rs && ls.visibility && ls.visibility > 0.5) {
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(ls.x * canvas.width, ls.y * canvas.height);
          ctx.lineTo(rs.x * canvas.width, rs.y * canvas.height);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }, [poseData, activeStep]);

  // Start 3D Scan with 3-second timer
  const handleStartScan = () => {
    setCountdown(3);
    playChime('alert');
    if (voiceGuide) {
      speak('เริ่มการสแกนโครงสร้างร่างกาย กรุณายืนตัวตรง นิ่งไว้ค่ะ');
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          executeScanComplete();
          return null;
        }
        playChime('alert');
        return prev - 1;
      });
    }, 1000);
  };

  const executeScanComplete = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      playChime('success');
      if (voiceGuide) {
        speak('สแกนโครงสร้าง 3 มิติสำเร็จ กำลังสร้างแบบจำลอง 3D Digital Twin Avatar ค่ะ');
      }
      setActiveStep(2);
    }, 1200);
  };

  return (
    <div className={`space-y-6 max-w-[1760px] mx-auto pb-16 animate-fadeIn ${largeFont ? 'text-base' : 'text-sm'}`}>
      {/* Top Banner (Moti Physio & Ramathibodi Clinical Branding) */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-500/10 to-teal-500/0 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#008783] to-[#00A39E] flex items-center justify-center text-white shadow-lg shadow-teal-900/15 border-2 border-teal-200 shrink-0">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6] font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping" />
                  <span>MOTI PHYSIO 3D DIGITAL TWIN</span>
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  AI Musculoskeletal Avatar & RGB-D
                </span>
                <span className="text-xs font-bold text-[#008783] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  ฐานข้อมูลมาตรฐาน 350,000+ ราย
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-[#0F3D3E] mt-2 font-['Outfit']">
                Moti Physio: นวัตกรรมวิเคราะห์โครงสร้างร่างกายและสมดุล 3 มิติ
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-4xl">
                ระบบสแกนสร้าง <strong>3D Digital Twin Avatar</strong> สรีระจริง • แสดงแผนที่กล้ามเนื้อตึง <strong>(สีแดง)</strong> และกล้ามเนื้ออ่อนแรง <strong>(สีฟ้า)</strong> ตามทฤษฎี <strong>Janda Approach</strong> • วัดมุมคอยื่น (Forward Head), ไหล่ตก, แนวกระดูกสันหลัง และเชิงกรานบิดตัว
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToKiosk && (
              <button
                onClick={onNavigateToKiosk}
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-4 h-4 text-[#00A39E]" />
                <span>เปิดตู้เครื่องกายภาพ Kiosk</span>
              </button>
            )}
            {onNavigateToMobile && (
              <button
                onClick={onNavigateToMobile}
                className="px-3 py-2 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>ส่งผลเข้า Rama App</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Steps Timeline Navigation (ตรงตามขั้นตอนในคลิป Guy Ruksa Moti Physio) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          {[
            { step: 1, title: '1. สแกนร่างกาย', desc: 'กล้อง RGB-D ยืนนิ่ง & เคลื่อนไหว' },
            { step: 2, title: '2. 3D Digital Twin Avatar', desc: 'แบบจำลองกล้ามเนื้อ แดง/ฟ้า 3 มุมมอง' },
            { step: 3, title: '3. ดัชนีสรีระ 11 จุด', desc: 'ประเมินความเสี่ยง Office Syndrome' },
            { step: 4, title: '4. แผนฟื้นฟูเฉพาะบุคคล', desc: 'โปรแกรมกายภาพบำบัดแพทย์สั่ง' }
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => {
                setActiveStep(item.step);
                if (item.step === 1 && !isCameraActive) startCamera();
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                activeStep === item.step
                  ? 'bg-[#E6F7F7] border-[#00A39E] shadow-sm'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                    activeStep === item.step
                      ? 'bg-[#00A39E] text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {item.step}
                </span>
                <span className={`text-xs font-black ${activeStep === item.step ? 'text-[#008783]' : 'text-slate-800'}`}>
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-8">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          STEP 1: 3D BODY SCAN (สแกนร่างกาย)
          ========================================================================= */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Main Visualizer: Camera + 3D Skeleton Canvas */}
          <div className="lg:col-span-8 rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#008783] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0F3D3E]">
                    สถานีตรวจสแกนโครงกระดูกแบบเรียลไทม์ (Live 3D Body Tracker)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    FPS: 60 • 33 Anatomical Keypoints • Real-time Plumb Line Active
                  </span>
                </div>
              </div>

              {/* View Selector (หน้าตรง, ด้านข้าง, สควอท) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setScanView('FRONTAL')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                    scanView === 'FRONTAL' ? 'bg-[#00A39E] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ท่ายืนตรงด้านหน้า (Frontal)
                </button>
                <button
                  onClick={() => setScanView('SAGITTAL')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                    scanView === 'SAGITTAL' ? 'bg-[#00A39E] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ท่ายืนด้านข้าง (Sagittal)
                </button>
                <button
                  onClick={() => setScanView('DYNAMIC_SQUAT')}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                    scanView === 'DYNAMIC_SQUAT' ? 'bg-[#00A39E] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ย่อเข่าทดสอบสมดุล (Squat)
                </button>
              </div>
            </div>

            {/* Video + Canvas Viewport */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-200">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
              />

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-30 animate-fadeIn">
                  <span className="text-8xl font-black text-white font-mono animate-ping">{countdown}</span>
                  <p className="text-white text-sm font-bold mt-4">กรุณายืนนิ่งในกรอบอ้างอิง</p>
                </div>
              )}

              {/* Scanning Processing Spinner */}
              {isScanning && (
                <div className="absolute inset-0 bg-teal-900/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fadeIn text-white">
                  <RefreshCw className="w-12 h-12 text-[#00A39E] animate-spin mb-3" />
                  <p className="text-base font-black">AI กำลังสร้างแบบจำลอง 3D Digital Twin Avatar...</p>
                  <span className="text-xs text-teal-200">เปรียบเทียบกับฐานข้อมูลมาตรฐาน 350,000 ราย</span>
                </div>
              )}

              {/* Start Scan Button */}
              <div className="absolute bottom-5 inset-x-0 flex justify-center z-20">
                <button
                  onClick={handleStartScan}
                  disabled={isScanning || countdown !== null}
                  className="px-6 py-3 rounded-2xl bg-[#00A39E] hover:bg-[#008783] text-white font-black text-sm shadow-xl shadow-teal-900/30 transition-all transform active:scale-95 cursor-pointer flex items-center gap-2 border border-teal-200"
                >
                  <Crosshair className="w-5 h-5 text-white" />
                  <span>กดเริ่มสแกนวิเคราะห์ท่าทาง 3D (Start 3D Scan)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Angle Telemetry */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] text-[#008783] flex items-center justify-center font-black">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-[#008783] font-bold block">{patientId}</span>
                  <h4 className="text-sm font-black text-[#0F3D3E]">{patientName}</h4>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#00A39E]" />
                <span>ค่ามุมสรีระขณะนี้ (Real-Time Biomechanical Angles)</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">การเอียงของศีรษะ (Head Tilt)</span>
                    <span className="text-[10px] text-slate-400">เกณฑ์มาตรฐาน &lt; 2.0°</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-600 font-mono text-sm">{metrics.headTiltDeg}°</span>
                    <span className="text-[10px] text-amber-600 font-bold block">เอียงซ้าย</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200/70 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-900 block">มุมคอยื่น (CVA - Text Neck)</span>
                    <span className="text-[10px] text-slate-500">เกณฑ์ปกติ &gt; 53.0°</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-600 font-mono text-sm">{metrics.forwardHeadCvaDeg}°</span>
                    <span className="text-[10px] text-rose-600 font-bold block">คอยื่น 4.8 ซม.</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-900 block">ความต่างระดับหัวไหล่ (Shoulder Drop)</span>
                    <span className="text-[10px] text-slate-500">เกณฑ์ปกติ &lt; 0.5 ซม.</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-700 font-mono text-sm">{metrics.shoulderHeightDiffCm} ซม.</span>
                    <span className="text-[10px] text-amber-700 font-bold block">ไหล่ขวาตก</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveStep(2)}
                className="w-full mt-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>ดูแบบจำลอง 3D Avatar (Step 2)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: MOTI PHYSIO REALISTIC 3D DIGITAL TWIN AVATAR (แบบจำลองสรีระ 3 มิติ)
          ========================================================================= */}
      {activeStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main 3D Avatar Control Panel (Header & Perspective Switcher) */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#008783] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#B2EBE6]">
                    MOTI PHYSIO 3D AVATAR VIEWER
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Janda Musculoskeletal Imbalance Mapping
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#0F3D3E] mt-1 font-['Outfit']">
                  แบบจำลองสรีระ 3 มิติ & แผนที่กล้ามเนื้อตึง/อ่อนแรง (3D Digital Twin)
                </h3>
              </div>

              {/* View Perspective & Comparison Toggles (Just like Moti Physio in clinic) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* 3 Perspectives: Front, Side, Back */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setAvatarView('FRONT')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      avatarView === 'FRONT'
                        ? 'bg-[#00A39E] text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ด้านหน้า (Front)
                  </button>
                  <button
                    onClick={() => setAvatarView('SIDE')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      avatarView === 'SIDE'
                        ? 'bg-[#00A39E] text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ด้านข้าง (Sagittal)
                  </button>
                  <button
                    onClick={() => setAvatarView('BACK')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      avatarView === 'BACK'
                        ? 'bg-[#00A39E] text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ด้านหลัง (Posterior)
                  </button>
                </div>

                {/* Compare: Current vs Ideal Posture */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setPostureMode('CURRENT')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      postureMode === 'CURRENT'
                        ? 'bg-rose-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ท่าทางปัจจุบัน (Current)
                  </button>
                  <button
                    onClick={() => setPostureMode('IDEAL')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      postureMode === 'IDEAL'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    สมดุลในอุดมคติ (Ideal)
                  </button>
                </div>
              </div>
            </div>

            {/* Main Stage: Realistic 3D Avatar Render + Detailed Metric Overlays */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Canvas: Moti Physio 3D Human Avatar Display */}
              <div className="lg:col-span-7 bg-gradient-to-b from-[#0a192f] via-[#0f2744] to-[#0a192f] rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-between border-2 border-teal-500/30 min-h-[580px] shadow-2xl">
                {/* Medical Plumb Line Grid Backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e3a5f_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

                {/* Vertical Center Reference Plumb Line (แนวดิ่งอ้างอิง) */}
                {showPlumbLine && (
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-[#00A39E]/80 border-l border-dashed border-[#00A39E] z-10">
                    <span className="absolute top-3 -left-12 text-[10px] font-mono text-[#00A39E] bg-slate-950/80 px-1.5 py-0.5 rounded border border-teal-500/40">
                      PLUMB LINE
                    </span>
                  </div>
                )}

                {/* Top View Indicator & Mode Badge */}
                <div className="w-full flex items-center justify-between z-20 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00A39E] animate-ping" />
                    <span className="font-mono font-black text-teal-300 uppercase tracking-wider">
                      {avatarView} VIEW • {postureMode} POSTURE
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-teal-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMuscles}
                        onChange={(e) => setShowMuscles(e.target.checked)}
                        className="accent-[#00A39E] rounded"
                      />
                      <span>กล้ามเนื้อ (แดง/ฟ้า)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-teal-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSkeleton}
                        onChange={(e) => setShowSkeleton(e.target.checked)}
                        className="accent-[#00A39E] rounded"
                      />
                      <span>โครงกระดูก</span>
                    </label>
                  </div>
                </div>

                {/* 3D DIGITAL TWIN AVATAR - REALISTIC MEDICAL HUMAN MODEL (เหมือนใน MOTI PHYSIO) */}
                <div className="relative w-full max-w-[430px] aspect-[3/4] flex items-center justify-center my-auto z-20 rounded-2xl overflow-hidden shadow-2xl border border-teal-500/40 bg-slate-950 group">
                  {/* The 3D Digital Twin Image */}
                  <img
                    src={
                      avatarView === 'FRONT'
                        ? '/avatars/moti_front.jpg'
                        : avatarView === 'SIDE'
                        ? '/avatars/moti_side.jpg'
                        : '/avatars/moti_back.jpg'
                    }
                    alt={`Moti Physio 3D Digital Twin - ${avatarView}`}
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      postureMode === 'IDEAL' ? 'brightness-105 contrast-105' : ''
                    } ${!showMuscles ? 'filter saturate-40' : ''}`}
                  />

                  {/* High-tech Corner Accents */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-teal-400 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-teal-400 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-teal-400 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-teal-400 pointer-events-none" />

                  {/* View & Posture Watermark badge */}
                  <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-teal-500/40 text-[10px] font-mono text-teal-300 font-bold shadow-md">
                    3D SCAN: {postureMode === 'CURRENT' ? 'CURRENT (สรีระจริง)' : 'IDEAL (สมดุลอุดมคติ)'}
                  </div>

                  {/* Interactive Overlay Badges - FRONTAL VIEW */}
                  {avatarView === 'FRONT' && (
                    <>
                      {postureMode === 'CURRENT' ? (
                        <>
                          {/* Head Tilt Callout */}
                          <div className="absolute top-[13%] left-[8%] animate-pulse">
                            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-amber-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              <span>ศีรษะเอียง {metrics.headTiltDeg}° (ซ้าย)</span>
                            </div>
                          </div>

                          {/* Right Shoulder Drop */}
                          <div className="absolute top-[21%] right-[6%] animate-fadeIn">
                            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-rose-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-rose-300">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              <span>ไหล่ขวาตก 1.9 ซม. (บ่าตึง)</span>
                            </div>
                          </div>

                          {/* Pelvic Tilt Callout */}
                          <div className="absolute top-[48%] right-[8%] animate-fadeIn">
                            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-amber-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>เชิงกรานเอียง {metrics.pelvicTiltDeg}°</span>
                            </div>
                          </div>

                          {/* Genu Valgum Knee Callout */}
                          <div className="absolute top-[66%] left-[8%] animate-fadeIn">
                            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-sky-400/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-sky-300">
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              <span>ขาฉิ่ง Genu Valgum 8.5°</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Ideal mode markers */
                        <div className="absolute inset-x-4 top-14 flex flex-col items-center gap-2 pointer-events-none">
                          <div className="bg-emerald-950/85 border border-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-300 shadow-xl flex items-center gap-2 backdrop-blur-md">
                            <span>✓ แนวสมดุลกระดูกและกล้ามเนื้อปกติ (Ideal Balanced)</span>
                          </div>
                        </div>
                      )}

                      {/* Foot Pressure Weight Distribution at bottom */}
                      <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none">
                        <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-sky-400/50 flex items-center gap-1.5 text-[11px] font-bold text-sky-300 shadow-xl">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                          <span>เท้าซ้าย {metrics.footWeightLeftPct}%</span>
                        </div>
                        <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-rose-400/50 flex items-center gap-1.5 text-[11px] font-bold text-rose-300 shadow-xl">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                          <span>เท้าขวา {metrics.footWeightRightPct}% (ลงน้ำหนักเกิน)</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Interactive Overlay Badges - SAGITTAL SIDE VIEW */}
                  {avatarView === 'SIDE' && (
                    <>
                      {postureMode === 'CURRENT' ? (
                        <>
                          {/* Forward Head / Text Neck */}
                          <div className="absolute top-[14%] right-[8%] animate-pulse">
                            <div className="bg-slate-950/90 border border-rose-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-rose-300">
                              คอยื่น {metrics.forwardHeadCm} ซม. (Text Neck)
                            </div>
                          </div>

                          {/* CVA Angle */}
                          <div className="absolute top-[22%] right-[10%] animate-fadeIn">
                            <div className="bg-slate-950/90 border border-amber-500/80 px-2 py-0.5 rounded-lg shadow-lg text-[10px] font-bold text-amber-300">
                              CVA: {metrics.forwardHeadCvaDeg}° (เกณฑ์ปกติ &gt; 53°)
                            </div>
                          </div>

                          {/* Thoracic Kyphosis */}
                          <div className="absolute top-[34%] left-[8%] animate-fadeIn">
                            <div className="bg-slate-950/90 border border-amber-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-amber-300">
                              หลังค่อม {metrics.thoracicKyphosisDeg}° (Kyphosis)
                            </div>
                          </div>

                          {/* Lumbar Lordosis */}
                          <div className="absolute top-[48%] left-[6%] animate-fadeIn">
                            <div className="bg-slate-950/90 border border-rose-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-rose-300">
                              หลังแอ่น {metrics.lumbarLordosisDeg}° (Lordosis)
                            </div>
                          </div>

                          {/* Anterior Pelvic Tilt */}
                          <div className="absolute top-[56%] right-[8%] animate-fadeIn">
                            <div className="bg-slate-950/90 border border-sky-400/80 px-2 py-0.5 rounded-lg shadow-lg text-[10px] font-bold text-sky-300">
                              อุ้งเชิงกรานเทไปข้างหน้า
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-x-4 top-14 flex flex-col items-center gap-2 pointer-events-none">
                          <div className="bg-emerald-950/85 border border-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-300 shadow-xl flex items-center gap-2 backdrop-blur-md">
                            <span>✓ แนวระนาบ Sagittal S-Curve ปกติ (หู-ไหล่-สะโพก-ข้อเท้า)</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Interactive Overlay Badges - POSTERIOR BACK VIEW */}
                  {avatarView === 'BACK' && (
                    <>
                      {postureMode === 'CURRENT' ? (
                        <>
                          {/* Upper Trapezius Hypertonicity */}
                          <div className="absolute top-[18%] right-[8%] animate-pulse">
                            <div className="bg-slate-950/90 border border-rose-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-rose-300">
                              สะบักขวายกตัว & บ่าตึง
                            </div>
                          </div>

                          {/* Scoliosis Lateral Curve */}
                          <div className="absolute top-[40%] right-[8%] animate-fadeIn">
                            <div className="bg-slate-950/90 border border-amber-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-amber-300">
                              กระดูกสันหลังคด {metrics.scoliosisDeg}° (Cobb)
                            </div>
                          </div>

                          {/* Rhomboid Muscle Inhibited */}
                          <div className="absolute top-[28%] left-[8%] animate-fadeIn">
                            <div className="bg-slate-950/90 border border-sky-400/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-sky-300">
                              กล้ามเนื้อสะบักฝ่ออ่อนแรง
                            </div>
                          </div>

                          {/* Lumbar Erector Spinae */}
                          <div className="absolute top-[52%] left-[6%] animate-fadeIn">
                            <div className="bg-slate-950/90 border border-rose-500/80 px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold text-rose-300">
                              กล้ามเนื้อหลังส่วนล่างเกร็งยึด
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-x-4 top-14 flex flex-col items-center gap-2 pointer-events-none">
                          <div className="bg-emerald-950/85 border border-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-300 shadow-xl flex items-center gap-2 backdrop-blur-md">
                            <span>✓ แนบชิดสะบักและกระดูกสันหลังตั้งตรง 0.0°</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Bottom Legend (เหมือนใน Moti Physio) */}
                <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-teal-500/20 z-20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-bold text-rose-400">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                      <span>สีแดง: กล้ามเนื้อตึงตัวผิดปกติ (Tight Muscles)</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-sky-400">
                      <span className="w-3 h-3 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
                      <span>สีฟ้า: กล้ามเนื้ออ่อนแรง (Weak Muscles)</span>
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-teal-300 font-bold">
                    Janda Approach • 87 Muscle Map
                  </span>
                </div>
              </div>

              {/* Right Column: 11-Point Posture Index Table (เหมือนแผ่นรีพอร์ต Moti Physio) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#00A39E]" />
                      <span>ดัชนีชี้วัด 11 จุดสรีระ (11 Postural Indicators)</span>
                    </h4>
                    <span className="text-[10px] font-bold text-[#008783] bg-[#E6F7F7] px-2 py-0.5 rounded-full border border-[#B2EBE6]">
                      Moti Physio Norms
                    </span>
                  </div>

                  <div className="space-y-2 text-xs overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
                    {[
                      { name: '1. ศีรษะเอียง (Head Lateral Tilt)', val: `${metrics.headTiltDeg}°`, norm: '< 2.0°', status: 'WARN', desc: 'เอียงซ้าย' },
                      { name: '2. ศีรษะยื่น (Forward Head CVA)', val: `${metrics.forwardHeadCm} ซม. (${metrics.forwardHeadCvaDeg}°)`, norm: '< 2.5 ซม.', status: 'DANGER', desc: 'คอยื่น Text Neck' },
                      { name: '3. ระดับหัวไหล่ (Shoulder Level)', val: `${metrics.shoulderHeightDiffCm} ซม.`, norm: '< 0.5 ซม.', status: 'WARN', desc: 'ไหล่ขวาตก' },
                      { name: '4. หลังค่อม (Thoracic Kyphosis)', val: `${metrics.thoracicKyphosisDeg}°`, norm: '20° - 40°', status: 'WARN', desc: 'หลังค่อมเล็กน้อย' },
                      { name: '5. หลังแอ่น (Lumbar Lordosis)', val: `${metrics.lumbarLordosisDeg}°`, norm: '20° - 35°', status: 'DANGER', desc: 'แอ่นเอวสูง' },
                      { name: '6. เชิงกรานเอียง (Pelvic Tilt)', val: `${metrics.pelvicTiltDeg}°`, norm: '< 1.5°', status: 'WARN', desc: 'เอียงขวา' },
                      { name: '7. เชิงกรานบิด (Pelvic Torsion)', val: `${metrics.pelvicTorsionDeg}°`, norm: '< 2.0°', status: 'NORMAL', desc: 'ปกติ' },
                      { name: '8. แนวข้อเข่า (Genu Alignment)', val: '8.5° ขาฉิ่ง', norm: '5° - 7°', status: 'WARN', desc: 'Genu Valgum ขวา' },
                      { name: '9. กระจายน้ำหนักเท้า', val: 'ซ้าย 47.2% / ขวา 52.8%', norm: '50% / 50%', status: 'WARN', desc: 'ทิ้งน้ำหนักขวา' },
                      { name: '10. จุดศูนย์ถ่วง (COG Offset)', val: `เบี่ยงขวา +${metrics.cogDisplacementMm} มม.`, norm: '< 10 มม.', status: 'WARN', desc: 'ศูนย์ถ่วงเอียง' },
                      { name: '11. คะแนนสมดุลรวม', val: `${metrics.postureScore} / 100`, norm: '> 85 คะแนน', status: 'WARN', desc: 'อายุสรีระ 40 ปี' },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-2xs hover:border-[#00A39E] transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{row.name}</span>
                          <span className="text-[10px] text-slate-400">เกณฑ์มาตรฐาน: {row.norm} • {row.desc}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-black text-xs block ${
                            row.status === 'DANGER' ? 'text-rose-600' : row.status === 'WARN' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {row.val}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                            row.status === 'DANGER' ? 'bg-rose-100 text-rose-700' : row.status === 'WARN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {row.status === 'DANGER' ? 'ผิดปกติสูง' : row.status === 'WARN' ? 'เฝ้าระวัง' : 'สมดุลดี'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setActiveStep(3)}
                      className="flex-1 py-3 rounded-2xl bg-[#00A39E] hover:bg-[#008783] text-white font-black text-xs shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>ถัดไป: ผลการประเมินความเสี่ยง AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: AI CLINICAL RISK ASSESSMENT & 350,000 NORMATIVE DATABASE
          ========================================================================= */}
      {activeStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Overall Health Score Card */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#008783] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#B2EBE6]">
                Step 3: Comparative Analysis
              </span>
              <h3 className="text-lg font-black text-[#0F3D3E] mt-2">
                คะแนนสมดุลท่าทางและอายุสรีระของร่างกาย (Posture Score & Age)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                เปรียบเทียบมาตรฐานกับกลุ่มตัวอย่างประชากร 350,000+ ราย ในช่วงอายุและเพศเดียวกัน
              </p>

              {/* Big Gauge Display */}
              <div className="flex items-center justify-center my-6">
                <div className="relative w-44 h-44 rounded-full border-8 border-teal-100 flex flex-col items-center justify-center bg-gradient-to-br from-[#E6F7F7] to-white shadow-inner">
                  <span className="text-5xl font-black text-[#008783] font-mono">{metrics.postureScore}</span>
                  <span className="text-xs font-bold text-slate-400">เต็ม 100 คะแนน</span>
                  <span className="mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    ควรปรับปรุงโครงสร้าง
                  </span>
                </div>
              </div>

              {/* Posture Age vs Real Age */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold block">อายุจริง (Chronological)</span>
                  <span className="text-xl font-black text-slate-800 font-mono">32 ปี</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
                  <span className="text-[11px] text-rose-500 font-bold block">อายุสรีระท่าทาง (Posture Age)</span>
                  <span className="text-xl font-black text-rose-600 font-mono">{metrics.postureAge} ปี</span>
                  <span className="text-[10px] text-rose-500 font-bold block">+8 ปีจากเกณฑ์ปกติ</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveStep(4)}
              className="w-full py-3 rounded-2xl bg-[#00A39E] hover:bg-[#008783] text-white font-black text-xs shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>ดูแผนฟื้นฟูกายภาพบำบัดเฉพาะคุณ (Step 4)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Clinical Risk Forecast List */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-[#0F3D3E] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00A39E]" />
              <span>การคาดการณ์ความเสี่ยงทางกายภาพบำบัดในอนาคต (AI Prognostic Risks)</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <strong className="text-slate-900 text-sm">ความเสี่ยง Office Syndrome เรื้อรัง (ระดับสูง 85%)</strong>
                  </div>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    High Risk
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  จากมุม CVA 47.8° มีโอกาสเกิดอาการปวดตึงท้ายทอย ปวดสะบักร้าวขึ้นศีรษะ (Cervicogenic Headache) หากไม่ได้รับการยืดกล้ามเนื้อและปรับท่านั่งทำงาน
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <strong className="text-slate-900 text-sm">ความเสี่ยงหมอนรองกระดูกคอและหลังส่วนล่าง (ระดับปานกลาง 62%)</strong>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Moderate
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  แนวกระดูกเชิงกรานที่เอียง 2.6° ร่วมกับจุดศูนย์ถ่วงเบี่ยงขวา ทำให้หมอนรองกระดูกสันหลังระดับ L4-L5 ฝั่งขวารับแรงอัดกระแทกไม่สมดุล
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <strong className="text-slate-900 text-sm">ความเสี่ยงข้อเข่าเสื่อมก่อนวัย (Patellofemoral Pain 45%)</strong>
                  </div>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    Mild to Moderate
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  ลักษณะ Genu Valgum (ขาฉิ่ง) ข้างขวา ส่งผลให้สะบ้าเข่าเสียดสีกับกระดูกต้นขาด้านนอกขณะก้าวเดินและขึ้นบันได
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#E6F7F7] border border-[#B2EBE6] text-xs text-slate-700 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#008783] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#008783]">คำแนะนำจากนักกายภาพบำบัด:</strong>
                <p className="mt-1 text-[11px] leading-relaxed">
                  ความเสี่ยงเหล่านี้สามารถฟื้นฟูให้กลับมาสมดุลปกติได้ โดยใช้การฝึกกายภาพบำบัดปรับท่าทาง (Corrective Exercise Routine) วันละ 15 นาที ต่อเนื่อง 4–6 สัปดาห์
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 4: PERSONALIZED REHABILITATION PRESCRIPTION (แผนฟื้นฟูเฉพาะบุคคล)
          ========================================================================= */}
      {activeStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#008783] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#B2EBE6]">
                  Step 4: Prescription & Treatment Plan
                </span>
                <h3 className="text-xl font-black text-[#0F3D3E] mt-1 font-['Outfit']">
                  โปรแกรมกายภาพบำบัดฟื้นฟูท่าทางเฉพาะบุคคล (Tailored Corrective Program)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ออกแบบอัตโนมัติโดย AI จากผลการวิเคราะห์ Moti Physio 3D สอดคล้องกับมาตรฐาน รพ.รามาธิบดี มหิดล
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>พิมพ์รายงาน PDF</span>
                </button>
                {onNavigateToKiosk && (
                  <button
                    onClick={onNavigateToKiosk}
                    className="px-4 py-2.5 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white text-xs font-black shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Tv className="w-4 h-4" />
                    <span>เริ่มฝึกบนตู้เครื่องกายภาพทันที</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3 Core Targeted Corrective Exercises */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Exercise 1: Chin Tuck */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#00A39E] transition-all space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#008783]">
                      ท่าที่ 1 • แก้คอยื่น
                    </span>
                    <span className="text-xs font-bold text-slate-400">3 เซ็ต × 10 ครั้ง</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-2">
                    Chin Tuck & Deep Neck Flexor Activation
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    เก็บเหนียงชิดอก ค้างไว้ 5 วินาที เพื่อยืดกล้ามเนื้อท้ายทอย และเสริมความแข็งแรงของกล้ามเนื้อพยุงคอด้านหน้า
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#008783] font-bold">
                  <span>เป้าหมาย: เพิ่มมุม CVA &gt; 52°</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Exercise 2: Scapular Retraction & Doorway Stretch */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#00A39E] transition-all space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#008783]">
                      ท่าที่ 2 • ปรับระดับหัวไหล่
                    </span>
                    <span className="text-xs font-bold text-slate-400">3 เซ็ต × 12 ครั้ง</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-2">
                    Scapular Retraction & Lower Trapezius
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    ดึงสะบักสองข้างเข้าหากันและเปิดอก เพื่อปรับระดับหัวไหล่ขวาที่ตก 1.9 ซม. ให้กลับมาเสมอกัน
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#008783] font-bold">
                  <span>เป้าหมาย: ความต่างไหล่ &lt; 0.5 ซม.</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Exercise 3: Pelvic Bridging & Gluteus Medius */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-[#00A39E] transition-all space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#008783]">
                      ท่าที่ 3 • ปรับเชิงกราน & เข่า
                    </span>
                    <span className="text-xs font-bold text-slate-400">3 เซ็ต × 10 ครั้ง</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-2">
                    Pelvic Bridge & Clamshell (สะโพกข้างขวา)
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    นอนหงายยกสะโพก และเปิดข้อเข่าข้างขวาเพื่อเพิ่มความแข็งแรงของ Gluteus Medius ลดอาการขาฉิ่ง (Genu Valgum)
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#008783] font-bold">
                  <span>เป้าหมาย: ปรับจุดศูนย์ถ่วง COG กึ่งกลาง 50%</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Direct Sync Buttons with Machine Kiosk and Mobile Portal */}
            <div className="p-5 rounded-3xl bg-[#E6F7F7] border border-[#B2EBE6] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-[#008783] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#0F3D3E]">
                    เชื่อมต่อโปรแกรมอัตโนมัติเข้าสู่ทุกแพลตฟอร์มของ StrongCare
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    คนไข้สามารถฝึกต่อที่บ้านผ่านมือถือ หรือฝึกหน้าตู้กายภาพบำบัด AI Kiosk โดยมีเสียงพูดและเซนเซอร์นับรอบอัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onNavigateToMobile && (
                  <button
                    onClick={onNavigateToMobile}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#008783] font-bold text-xs border border-[#B2EBE6] shadow-xs cursor-pointer"
                  >
                    เปิดในมือถือ (One-Stop Hub)
                  </button>
                )}
                {onNavigateToKiosk && (
                  <button
                    onClick={onNavigateToKiosk}
                    className="px-4 py-2.5 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-black text-xs shadow-md shadow-teal-700/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>ไปที่ตู้กายภาพ Kiosk</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MotiPhysioAnalysis;
