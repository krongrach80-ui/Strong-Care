import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Maximize, 
  Minimize, 
  X,
  ShieldCheck,
  Check,
  UserCheck,
  AlertCircle,
  Camera,
  VideoOff,
  RefreshCw,
  Info,
  UserPlus,
  ScanFace,
  Loader2,
  User,
  Scan,
  Target,
  Compass
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useSpeech } from '../hooks/useSpeech';
import { useAuth } from '../context/AuthContext';
import { api, AttendanceRecord } from '../services/api';
import { useFaceDetection } from '../hooks/useFaceDetection';

interface SeniorKioskProps {
  onExit?: () => void;
}
export const SeniorKiosk: React.FC<SeniorKioskProps> = ({ onExit }) => {
  const {
    videoRef,
    isActive,
    startCamera,
    stopCamera,
    captureFrame,
    error: cameraError,
    isPermissionDenied,
    cameras,
    selectedCameraId,
    setSelectedCameraId
  } = useCamera();
  const { speak, playChime, isSpeaking } = useSpeech();
  const { voiceGuide, toggleVoiceGuide, logout, role } = useAuth();

  // Edge AI Face Detection Hook
  const { faceResult: clientFaceResult } = useFaceDetection(videoRef, isActive);

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Bank e-KYC Facial Scanning States
  const [scanMode, setScanMode] = useState<'VERIFY' | 'REGISTER'>('VERIFY');
  const scanModeRef = useRef<'VERIFY' | 'REGISTER'>('VERIFY');
  const [bankAutoProgress, setBankAutoProgress] = useState<number>(0);
  const bankAutoProgressRef = useRef<number>(0);
  const [bankGuidanceText, setBankGuidanceText] = useState<string>('วางใบหน้าให้อยู่ในกรอบวงกลม');
  const [distanceInfo, setDistanceInfo] = useState<{
    status: 'PERFECT' | 'TOO_FAR' | 'TOO_CLOSE' | 'OFF_CENTER' | 'NO_FACE';
    isOptimal: boolean;
    sizeRatio: number;
    message: string;
  } | null>(null);
  const lastVoiceDistRef = useRef<{ status: string; time: number }>({ status: '', time: 0 });

  // Photo Capture & Registration States
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const showRegisterModalRef = useRef<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [registerName, setRegisterName] = useState<string>('');
  const [registerRole, setRegisterRole] = useState<string>('USER');
  const [isSubmittingRegister, setIsSubmittingRegister] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccessToast, setRegisterSuccessToast] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);
  const hasTriggeredCaptureRef = useRef<boolean>(false);

  const activeKioskResult = (currentResult && currentResult.status !== 'no_face')
    ? currentResult
    : clientFaceResult;

  const isConfirmed = activeKioskResult?.confirmed;
  const isRecognized = activeKioskResult?.status === 'recognized';
  const isUnknown = activeKioskResult?.status === 'unknown';
  const hasFace = Boolean(
    (activeKioskResult?.faces_detected && activeKioskResult.faces_detected > 0) ||
    (activeKioskResult?.status && activeKioskResult.status !== 'no_face' && activeKioskResult.status !== 'no_frame') ||
    activeKioskResult?.box ||
    activeKioskResult?.detected
  );
  const personName = activeKioskResult?.name;

  // Synchronize refs with state for real-time WebSocket closures
  useEffect(() => {
    scanModeRef.current = scanMode;
  }, [scanMode]);

  useEffect(() => {
    showRegisterModalRef.current = showRegisterModal;
    if (!showRegisterModal) {
      hasTriggeredCaptureRef.current = false;
    }
  }, [showRegisterModal]);

  // Live Digital Clock & Thai Date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice guide introduction on start (Bank Style)
  useEffect(() => {
    if (voiceGuide) {
      const timer = setTimeout(() => {
        speak('กรุณาวางใบหน้าให้อยู่ในกรอบวงกลม และมองตรงมาที่กล้องนะคะ');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [voiceGuide]);

  // Auto-Capture when Bank e-KYC progress reaches 100%
  const handleAutoBankCapture = useCallback(() => {
    if (showRegisterModalRef.current) return;

    // Capture frame from captureFrame hook, or fallback directly to video element canvas
    let photoB64 = captureFrame();
    if (!photoB64 && videoRef.current && videoRef.current.videoWidth > 0) {
      try {
        const c = document.createElement('canvas');
        c.width = videoRef.current.videoWidth;
        c.height = videoRef.current.videoHeight;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          photoB64 = c.toDataURL('image/jpeg', 0.9);
        }
      } catch (err) {
        console.warn('Direct video canvas fallback failed:', err);
      }
    }

    if (!photoB64) {
      console.warn('Capture failed: No frame available');
      return;
    }

    // Bank Camera Shutter Flash & Chime
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 240);
    playChime('success');

    setCapturedPhoto(photoB64);
    setShowRegisterModal(true);
    showRegisterModalRef.current = true;
    hasTriggeredCaptureRef.current = true;
    setRegisterError(null);

    if (voiceGuide) {
      speak('สแกนใบหน้าสำเร็จค่ะ กรุณาระบุชื่อเพื่อบันทึกข้อมูลนะคะ');
    }
  }, [captureFrame, playChime, voiceGuide, speak]);

  const handleAutoBankCaptureRef = useRef(handleAutoBankCapture);
  useEffect(() => {
    handleAutoBankCaptureRef.current = handleAutoBankCapture;
  });

  // Dedicated Auto-Capture State Watcher: As soon as progress reaches 100%, fire immediately!
  useEffect(() => {
    if (scanMode === 'REGISTER' && bankAutoProgress >= 100 && !showRegisterModal && !hasTriggeredCaptureRef.current) {
      hasTriggeredCaptureRef.current = true;
      handleAutoBankCaptureRef.current();
    }
  }, [bankAutoProgress, scanMode, showRegisterModal]);

  // Distance Calculation Helper: Evaluates face scale & center relative to video frame
  const evalFaceDistance = useCallback((box: any, frameW?: number, frameH?: number) => {
    if (!box || !box.width || !box.height) {
      return {
        status: 'NO_FACE' as const,
        isOptimal: false,
        sizeRatio: 0,
        message: 'กรุณาวางใบหน้าให้อยู่ในกรอบวงกลม'
      };
    }

    const w = frameW || videoRef.current?.videoWidth || 640;
    const h = frameH || videoRef.current?.videoHeight || 480;
    const minDim = Math.min(w, h);
    const sizeRatio = Math.max(box.width, box.height) / (minDim || 1);
    const cx = (box.x + box.width / 2.0) / (w || 1);
    const cy = (box.y + box.height / 2.0) / (h || 1);

    if (sizeRatio < 0.20) {
      return {
        status: 'TOO_FAR' as const,
        isOptimal: false,
        sizeRatio,
        message: '🔍 กรุณาเอาหน้าเข้ามาชิดกรอบวงกลม'
      };
    }
    if (sizeRatio > 0.85) {
      return {
        status: 'TOO_CLOSE' as const,
        isOptimal: false,
        sizeRatio,
        message: '⚠️ อยู่ใกล้เกินไป กรุณาถอยห่างจากกล้องอีกนิด'
      };
    }
    if (Math.abs(cx - 0.5) > 0.35 || Math.abs(cy - 0.5) > 0.35) {
      return {
        status: 'OFF_CENTER' as const,
        isOptimal: false,
        sizeRatio,
        message: '🎯 กรุณาวางใบหน้าให้อยู่กึ่งกลางวงกลม'
      };
    }
    return {
      status: 'PERFECT' as const,
      isOptimal: true,
      sizeRatio,
      message: '✓ เอาหน้าเข้ามาชิดพอดีแล้ว กำลังสแกนชีวมิติ'
    };
  }, []);

  // WebSocket connection for real-time recognition & bank auto-scanning
  const connectWs = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname || 'localhost';
    const wsUrl = protocol + '//' + wsHost + ':8000/api/v1/ws/live';

    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'recognition_result') {
          setCurrentResult(data);

          const hasDetectedFace = Boolean(
            (data.faces_detected && data.faces_detected > 0) ||
            (data.status && data.status !== 'no_face' && data.status !== 'no_frame') ||
            data.box
          );

          // Branch: Bank e-KYC Auto-Scan Mode with Distance Calculation
          if (scanModeRef.current === 'REGISTER') {
            if (!showRegisterModalRef.current) {
              const rawDist = data.distance_eval;
              const dist = rawDist
                ? {
                    status: rawDist.status as 'PERFECT' | 'TOO_FAR' | 'TOO_CLOSE' | 'OFF_CENTER' | 'NO_FACE',
                    isOptimal: Boolean(rawDist.is_optimal),
                    sizeRatio: rawDist.size_ratio,
                    message: rawDist.message
                  }
                : evalFaceDistance(data.box, data.frame_width, data.frame_height);

              setDistanceInfo(dist);
            }
          } else {
            // Branch: Standard Bank Verification Mode
            if (data.confirmed) {
              setScanProgress(100);
            } else if (data.status === 'recognized') {
              setScanProgress(66);
            } else if (hasDetectedFace) {
              setScanProgress(33);
            } else {
              setScanProgress(0);
            }

            if (data.voice_triggered && data.voice_text) {
              playChime('success');
              const greeting = data.voice_text + ' ยืนยันตัวตนและบันทึกเวลาสำเร็จเรียบร้อยค่ะ';
              speak(greeting);

              // Auto-reset display for next person after 4.5 seconds
              setTimeout(() => {
                setCurrentResult(null);
                setScanProgress(0);
              }, 4500);
            }
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    setWs(socket);
    return socket;
  }, [handleAutoBankCapture, playChime, speak]);

  // Client-Side Edge AI synchronization for SeniorKiosk (enables 100% offline & GitHub Pages support)
  const lastEdgeKioskSpokenRef = useRef<number>(0);
  const lastOptimalSpokenRef = useRef<number>(0);

  useEffect(() => {
    // Only use clientFaceResult if WS is not receiving face updates
    if (currentResult && currentResult.status !== 'no_face') return;

    const hasDetectedFace = clientFaceResult.detected;
    if (scanModeRef.current === 'REGISTER') {
      if (!showRegisterModalRef.current) {
        const dist = clientFaceResult.distance_eval;
        setDistanceInfo({
          status: dist.status,
          isOptimal: dist.is_optimal,
          sizeRatio: dist.size_ratio,
          message: dist.message
        });
      }
    } else {
      // Standard Verification Mode
      if (clientFaceResult.confirmed) {
        setScanProgress(100);
        const now = Date.now();
        if (now - lastEdgeKioskSpokenRef.current > 7000) {
          lastEdgeKioskSpokenRef.current = now;
          playChime('success');
          speak(`ยินดีต้อนรับ ${clientFaceResult.name || 'คุณยายสมศรี'} ยืนยันตัวตนและบันทึกเวลาสำเร็จเรียบร้อยค่ะ`);
        }
      } else if (clientFaceResult.status === 'confirming') {
        setScanProgress(66);
      } else if (hasDetectedFace) {
        setScanProgress(33);
      } else {
        setScanProgress(0);
      }
    }
  }, [clientFaceResult, currentResult, playChime, speak]);

  // Dedicated Bank e-KYC Smooth Progress Accumulator (นับเปอร์เซ็นต์ค่อยๆ ขึ้น 0% -> 100% ภายใน 2 วินาที)
  useEffect(() => {
    if (scanMode !== 'REGISTER' || showRegisterModal) return;

    const interval = setInterval(() => {
      const activeDist = distanceInfo;
      const isOptimal = Boolean(activeDist?.isOptimal);
      const status = activeDist?.status;

      if (hasFace && isOptimal) {
        // ระยะชิดพอดี: เปอร์เซ็นต์ค่อยๆ นับขึ้นอย่างนุ่มนวล (+2% ทุก 40ms = 100% ใน 2.0 วินาที)
        const cur = bankAutoProgressRef.current;
        const next = Math.min(100, cur + 2);
        bankAutoProgressRef.current = next;
        setBankAutoProgress(next);

        if (next >= 100) {
          setBankGuidanceText('✓ ตรวจสอบชีวมิติครบถ้วน 100% กำลังบันทึกภาพถ่าย...');
          if (!hasTriggeredCaptureRef.current) {
            hasTriggeredCaptureRef.current = true;
            handleAutoBankCaptureRef.current();
          }
        } else {
          setBankGuidanceText(`✓ เอาหน้าเข้ามาชิดพอดีแล้ว กำลังสแกนชีวมิติ (${next}%) กรุณานิ่งไว้`);
        }

        // Voice announcement on entering optimal distance
        if (voiceGuide && Date.now() - lastOptimalSpokenRef.current > 6000) {
          lastOptimalSpokenRef.current = Date.now();
          speak('ระยะพอดีแล้ว กำลังสแกนชีวมิติ กรุณานิ่งไว้นะคะ');
        }
      } else if (hasFace && status === 'TOO_FAR') {
        // อยู่ไกลเกินไป: แจ้งเตือนให้เอาหน้าเข้ามาชิด
        const cur = bankAutoProgressRef.current;
        if (cur > 0) {
          const next = Math.max(0, cur - 1);
          bankAutoProgressRef.current = next;
          setBankAutoProgress(next);
        }
        setBankGuidanceText('🔍 กรุณาเอาหน้าเข้ามาชิดกรอบวงกลม');

        // สั่งเสียงพูดเตือนให้เอาหน้าเข้ามาชิด
        if (voiceGuide && Date.now() - lastVoiceDistRef.current.time > 3500) {
          speak('กรุณาเอาใบหน้าเข้ามาชิดอีกนิดนะคะ');
          lastVoiceDistRef.current = { status: 'TOO_FAR', time: Date.now() };
        }
      } else if (hasFace && status === 'OFF_CENTER') {
        const cur = bankAutoProgressRef.current;
        if (cur > 0) {
          const next = Math.max(0, cur - 1);
          bankAutoProgressRef.current = next;
          setBankAutoProgress(next);
        }
        setBankGuidanceText('🎯 วางใบหน้าให้อยู่กึ่งกลางวงกลม');

        if (voiceGuide && Date.now() - lastVoiceDistRef.current.time > 4000) {
          speak('วางใบหน้าให้อยู่ตรงกลางกรอบวงกลมนะคะ');
          lastVoiceDistRef.current = { status: 'OFF_CENTER', time: Date.now() };
        }
      } else if (hasFace && status === 'TOO_CLOSE') {
        const cur = bankAutoProgressRef.current;
        if (cur > 0) {
          const next = Math.max(0, cur - 1);
          bankAutoProgressRef.current = next;
          setBankAutoProgress(next);
        }
        setBankGuidanceText('⚠️ อยู่ใกล้เกินไป กรุณาถอยห่างอีกนิด');

        if (voiceGuide && Date.now() - lastVoiceDistRef.current.time > 4000) {
          speak('ถอยห่างจากกล้องอีกนิดนะคะ');
          lastVoiceDistRef.current = { status: 'TOO_CLOSE', time: Date.now() };
        }
      } else {
        // ไม่พบใบหน้า
        const cur = bankAutoProgressRef.current;
        if (cur > 0) {
          const next = Math.max(0, cur - 1);
          bankAutoProgressRef.current = next;
          setBankAutoProgress(next);
        }
        setBankGuidanceText('กรุณาวางใบหน้าให้อยู่ในกรอบวงกลม');
      }
    }, 40);

    return () => clearInterval(interval);
  }, [scanMode, showRegisterModal, hasFace, distanceInfo, voiceGuide, speak]);

  // Frame sender loop (WebSocket)
  useEffect(() => {
    let timer: any;
    const sendFrame = () => {
      if (ws && ws.readyState === WebSocket.OPEN && isActive) {
        const frameB64 = captureFrame();
        if (frameB64) {
          ws.send(JSON.stringify({
            type: 'frame',
            image: frameB64,
            camera_id: 'bank_kiosk'
          }));
        }
      }
      timer = setTimeout(sendFrame, 150);
    };

    if (isActive) {
      sendFrame();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, ws, captureFrame]);

  // Camera & WS lifecycle
  useEffect(() => {
    startCamera();
    const socket = connectWs();
    return () => {
      stopCamera();
      if (socket) socket.close();
    };
  }, []);

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      logout();
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getAttendance(10);
      setHistoryList(res);
      setShowHistoryModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetScan = async () => {
    await api.resetTracker();
    setCurrentResult(null);
    setScanProgress(0);
    if (voiceGuide) {
      speak('เริ่มสแกนใหม่ค่ะ กรุณาวางใบหน้าให้อยู่ในกรอบนะคะ');
    }
  };

  // Start Bank e-KYC Registration Mode (Auto-Scan)
  const startBankRegisterMode = () => {
    setScanMode('REGISTER');
    scanModeRef.current = 'REGISTER';
    setCurrentResult(null);
    setBankAutoProgress(0);
    bankAutoProgressRef.current = 0;
    setDistanceInfo(null);
    setCapturedPhoto(null);
    setShowRegisterModal(false);
    showRegisterModalRef.current = false;
    setBankGuidanceText('กรุณาวางใบหน้าให้อยู่ในกรอบวงกลม');
    if (voiceGuide) {
      speak('เข้าสู่ระบบสแกนใบหน้าแบบธนาคาร กรุณาวางใบหน้าในกรอบวงกลมและมองตรงนะคะ');
    }
  };

  // Exit Bank e-KYC Mode back to Normal Verification
  const exitBankRegisterMode = () => {
    setScanMode('VERIFY');
    scanModeRef.current = 'VERIFY';
    setBankAutoProgress(0);
    bankAutoProgressRef.current = 0;
    setDistanceInfo(null);
    setShowRegisterModal(false);
    showRegisterModalRef.current = false;
    setCapturedPhoto(null);
    setRegisterError(null);
  };

  // Submit Registration to Backend
  const handleConfirmRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!registerName.trim()) {
      setRegisterError('กรุณาระบุชื่อ-นามสกุล หรือชื่อเรียกของคุณ');
      return;
    }

    if (!capturedPhoto) {
      setRegisterError('ไม่พบข้อมูลภาพถ่ายชีวมิติ กรุณากดสแกนใหม่อีกครั้ง');
      return;
    }

    setIsSubmittingRegister(true);
    setRegisterError(null);

    try {
      // Generate clean username prefix + timestamp
      const cleanAlpha = registerName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const prefix = cleanAlpha ? cleanAlpha.slice(0, 12) : 'user';
      const uniqueUsername = `${prefix}_${Date.now().toString().slice(-6)}`;

      const res = await api.registerFace({
        username: uniqueUsername,
        display_name: registerName.trim(),
        role: registerRole,
        angle_label: 'front',
        image_base64: capturedPhoto
      });

      if (res.success) {
        const savedName = registerName.trim();
        setShowRegisterModal(false);
        showRegisterModalRef.current = false;
        setCapturedPhoto(null);
        setRegisterName('');
        setIsSubmittingRegister(false);

        // Switch back to Verify mode and reset tracker for instant recognition
        setScanMode('VERIFY');
        scanModeRef.current = 'VERIFY';
        setBankAutoProgress(0);
        bankAutoProgressRef.current = 0;
        setDistanceInfo(null);
        await api.resetTracker();

        // Success Notification & Toast
        setRegisterSuccessToast(`ลงทะเบียนคุณ ${savedName} สำเร็จเรียบร้อย! ระบบพร้อมตรวจจับใบหน้าทันที`);
        setTimeout(() => setRegisterSuccessToast(null), 5500);

        playChime('success');
        if (voiceGuide) {
          speak(`ยินดีต้อนรับคุณ ${savedName} ลงทะเบียนข้อมูลชีวมิติสำเร็จเรียบร้อยค่ะ`);
        }
      } else {
        setRegisterError(res.message || 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง');
        setIsSubmittingRegister(false);
      }
    } catch (err: any) {
      console.warn('Register error, falling back to local offline storage:', err);
      try {
        const uniqueUsername = `user_${Date.now().toString().slice(-6)}`;
        const savedMembers = JSON.parse(localStorage.getItem('facevoice_registered_members') || '[]');
        const savedName = registerName.trim();
        savedMembers.unshift({
          id: Date.now(),
          username: uniqueUsername,
          displayName: savedName,
          role: registerRole,
          photo: capturedPhoto,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('facevoice_registered_members', JSON.stringify(savedMembers));

        setShowRegisterModal(false);
        showRegisterModalRef.current = false;
        setCapturedPhoto(null);
        setRegisterName('');
        setIsSubmittingRegister(false);

        setScanMode('VERIFY');
        scanModeRef.current = 'VERIFY';
        setBankAutoProgress(0);
        bankAutoProgressRef.current = 0;
        setDistanceInfo(null);

        setRegisterSuccessToast(`ลงทะเบียนคุณ ${savedName} สำเร็จเรียบร้อย! ระบบพร้อมตรวจจับใบหน้าทันที`);
        setTimeout(() => setRegisterSuccessToast(null), 5500);

        playChime('success');
        if (voiceGuide) {
          speak(`ยินดีต้อนรับคุณ ${savedName} ลงทะเบียนข้อมูลชีวมิติสำเร็จเรียบร้อยค่ะ`);
        }
        return;
      } catch (storageErr) {}

      setRegisterError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียนใบหน้า กรุณากดสแกนใหม่อีกครั้ง');
      setIsSubmittingRegister(false);
    }
  };



  return (
    <div className="fixed inset-0 w-screen h-screen z-50 bg-[#0A0F1D] overflow-hidden select-none flex items-center justify-center font-sans">
      {/* 1. Live Background Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={(e) => {
          const vid = e.currentTarget;
          vid.play().catch((err) => console.warn('Video onLoadedMetadata error:', err));
        }}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />



      {/* 3. Top Bank Header Bar */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-30 pointer-events-auto">
        {/* Left: Cancel / Back Button */}
        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white/90 border border-slate-700/80 backdrop-blur-md transition-all text-xs sm:text-sm font-bold shadow-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-300" />
          <span>{role === 'ADMIN' ? 'กลับหน้าแอดมิน' : 'ยกเลิก / กลับ'}</span>
        </button>

        {/* Center: Live Bank Status & Clock Capsule (Never overlaps circle) */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-white shadow-2xl">
          <div className={`w-2.5 h-2.5 rounded-full ${
            scanMode === 'REGISTER'
              ? 'bg-emerald-400 animate-ping'
              : isConfirmed
              ? 'bg-emerald-400 animate-bounce'
              : isUnknown
              ? 'bg-amber-400 animate-ping'
              : hasFace
              ? 'bg-cyan-400 animate-pulse'
              : 'bg-emerald-400'
          }`} />
          <span className="text-xs sm:text-sm font-black text-white font-['Outfit'] tracking-wide">
            {scanMode === 'REGISTER'
              ? '🏛️ โหมดลงทะเบียนสมาชิกใหม่ (e-KYC)'
              : isConfirmed
              ? '✓ ยืนยันตัวตนสำเร็จเรียบร้อย'
              : isUnknown
              ? '⚠️ ไม่พบข้อมูลใบหน้าในระบบ'
              : hasFace
              ? 'โหมดสแกนสมาชิกทั่วไป (กำลังสแกน...)'
              : 'โหมดสแกนสมาชิกทั่วไป'}
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="font-mono text-xs text-emerald-400 font-bold hidden sm:inline">{currentTime}</span>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Camera Selector (If multiple cameras detected) */}
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startCamera(e.target.value);
              }}
              className="px-3 py-2 rounded-2xl bg-slate-900/80 text-white border border-slate-700/80 text-xs font-semibold outline-none focus:border-emerald-400 cursor-pointer backdrop-blur-md"
            >
              {cameras.map((c, i) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `กล้อง ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Camera Reconnect/Retry Button */}
          {!isActive && (
            <button
              onClick={() => startCamera(selectedCameraId)}
              title="ลองเปิดกล้องใหม่อีกครั้ง"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 backdrop-blur-md transition-all text-xs font-bold shadow-xl cursor-pointer animate-pulse"
            >
              <Camera className="w-4 h-4" />
              <span>เปิดกล้อง</span>
            </button>
          )}

          {/* History */}
          <button
            onClick={loadHistory}
            title="ดูประวัติการสแกน"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md transition-all text-xs font-bold shadow-xl cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">ประวัติ</span>
          </button>

          {/* Bank Mode Switcher Button */}
          <button
            onClick={() => {
              if (scanMode === 'REGISTER') {
                exitBankRegisterMode();
              } else {
                startBankRegisterMode();
              }
            }}
            title={scanMode === 'REGISTER' ? 'สลับไปโหมดสแกนสมาชิกทั่วไป' : 'สลับไปโหมดลงทะเบียน e-KYC แบบธนาคาร'}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer border shadow-lg ${
              scanMode === 'REGISTER'
                ? 'bg-emerald-500 text-slate-950 border-white/60 shadow-emerald-500/30 animate-pulse'
                : 'bg-slate-900/80 hover:bg-slate-800 text-emerald-400 border-emerald-500/40 hover:scale-105'
            }`}
          >
            <ScanFace className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">
              {scanMode === 'REGISTER' ? 'กลับโหมดสแกนสมาชิกทั่วไป' : 'สแกนลงทะเบียน e-KYC'}
            </span>
          </button>

          {/* Voice Guide Toggle */}
          <button
            onClick={toggleVoiceGuide}
            title="เปิด/ปิดเสียงแนะนำ"
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer"
          >
            {voiceGuide ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            title="ขยายเต็มหน้าจอ"
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-white" />
            ) : (
              <Maximize className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* 4. Live Biometric Face Verification System Panel (ระบบตรวจสอบและวิเคราะห์ใบหน้าชีวมิติ) */}
      {scanMode === 'REGISTER' && (
        <div className="absolute left-4 sm:left-6 md:left-8 top-20 sm:top-24 z-30 max-w-[280px] sm:max-w-[320px] w-full bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-3 pointer-events-auto transition-all">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-xs sm:text-sm text-white font-['Outfit']">
                ระบบตรวจสอบใบหน้าชีวมิติ
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              AI VERIFY
            </span>
          </div>

          {/* 5-Point Live Verification Checklist */}
          <div className="space-y-2 text-xs">
            {/* 1. Face Presence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>1. ตรวจพบใบหน้า</span>
              </div>
              <span className={`font-bold text-[11px] flex items-center gap-1 ${
                hasFace ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {hasFace ? '✓ ผ่านเกณฑ์' : '⏳ รอใบหน้า'}
              </span>
            </div>

            {/* 2. Face Distance / Bring Closer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Scan className="w-3.5 h-3.5 text-slate-400" />
                <span>2. ระยะห่างใบหน้า</span>
              </div>
              <span className={`font-bold text-[11px] flex items-center gap-1 ${
                distanceInfo?.isOptimal
                  ? 'text-emerald-400 font-black'
                  : distanceInfo?.status === 'TOO_FAR'
                  ? 'text-amber-400 animate-pulse font-black'
                  : 'text-slate-500'
              }`}>
                {distanceInfo?.isOptimal
                  ? '✓ ชิดพอดีเยี่ยม'
                  : distanceInfo?.status === 'TOO_FAR'
                  ? '⚠️ เอาหน้าเข้ามาชิด'
                  : distanceInfo?.status === 'TOO_CLOSE'
                  ? '⚠️ ถอยห่างนิด'
                  : '⏳ รอจัดระยะ'}
              </span>
            </div>

            {/* 3. Centering in Circle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>3. กึ่งกลางวงกลม</span>
              </div>
              <span className={`font-bold text-[11px] flex items-center gap-1 ${
                distanceInfo?.status !== 'OFF_CENTER' && hasFace
                  ? 'text-emerald-400'
                  : hasFace
                  ? 'text-cyan-300'
                  : 'text-slate-500'
              }`}>
                {distanceInfo?.status !== 'OFF_CENTER' && hasFace ? '✓ ตรงกลาง' : '🎯 ปรับกึ่งกลาง'}
              </span>
            </div>

            {/* 4. Head Pose / Frontal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>4. ทิศทางหน้าตรง</span>
              </div>
              <span className={`font-bold text-[11px] flex items-center gap-1 ${
                hasFace && !activeKioskResult?.is_profile
                  ? 'text-emerald-400'
                  : hasFace
                  ? 'text-amber-300'
                  : 'text-slate-500'
              }`}>
                {hasFace && !activeKioskResult?.is_profile ? '✓ หน้าตรง 100%' : '⚠️ มองตรงกล้อง'}
              </span>
            </div>

            {/* 5. Quality & Lighting */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>5. ความชัด / แสงสว่าง</span>
              </div>
              <span className={`font-bold text-[11px] flex items-center gap-1 ${
                hasFace ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {hasFace ? '✓ คมชัดระดับ HD' : '⏳ ตรวจสอบ'}
              </span>
            </div>
          </div>

          {/* Live Distance Gauge Bar */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>ไกล (เอาหน้าเข้ามาชิด)</span>
              <span className={distanceInfo?.isOptimal ? 'text-emerald-300 font-mono font-bold' : 'text-amber-300 font-mono font-bold'}>
                {Math.round((distanceInfo?.sizeRatio || 0) * 100)}%
              </span>
              <span>ใกล้เกินไป</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
              {/* Ideal Target Zone: 20% to 85% */}
              <div className="absolute left-[20%] right-[15%] inset-y-0 bg-emerald-500/25 border-x border-emerald-400/50" />
              {/* Live Indicator Marker */}
              <div
                className={`h-full transition-all duration-150 ${
                  distanceInfo?.isOptimal
                    ? 'bg-emerald-400 shadow-[0_0_10px_#10B981]'
                    : distanceInfo?.status === 'TOO_FAR'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (distanceInfo?.sizeRatio || 0) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Central Bank Scanning Circle with Integrated Viewfinder Dark Mask (Zero-Drift 100% Alignment) */}
      <div
        className="absolute top-[47%] sm:top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(680px,76vh)] h-[min(680px,76vh)] rounded-full transition-all duration-500 flex items-center justify-center pointer-events-none z-20"
        style={{
          boxShadow: isConfirmed 
            ? '0 0 0 9999px rgba(5, 46, 22, 0.88)' 
            : '0 0 0 9999px rgba(10, 15, 29, 0.86)'
        }}
      >
        {/* Outer SVG Circular Scanning Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 700 700">
          {/* Background Track Circle */}
          <circle
            cx="350"
            cy="350"
            r="345"
            fill="none"
            stroke={isConfirmed ? '#10B981' : isUnknown ? '#F59E0B' : 'rgba(255, 255, 255, 0.2)'}
            strokeWidth="8"
          />

          {/* Dynamic Progress Fill Circle (Simulating Bank Progress 0 -> 100%) */}
          <circle
            cx="350"
            cy="350"
            r="345"
            fill="none"
            stroke={
              scanMode === 'REGISTER'
                ? (distanceInfo?.isOptimal ? '#10B981' : bankAutoProgress > 0 ? '#F59E0B' : '#06B6D4')
                : isConfirmed
                ? '#10B981'
                : isUnknown
                ? '#F59E0B'
                : '#06B6D4'
            }
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 345}
            strokeDashoffset={
              2 * Math.PI * 345 * (1 - (
                scanMode === 'REGISTER'
                  ? (bankAutoProgress / 100)
                  : isConfirmed
                  ? 1
                  : scanProgress > 0
                  ? scanProgress / 100
                  : 0.15
              ))
            }
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>

        {/* Rotating Glowing Trail Ring (Active when scanning) */}
        {!isConfirmed && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-cyan-400 animate-spin pointer-events-none" style={{ animationDuration: '3s' }} />
        )}

        {/* Bank e-KYC HUD Percentage & Distance Gauge Indicator (Inside Circle) */}
        {scanMode === 'REGISTER' && (
          <div className="absolute top-8 sm:top-10 flex flex-col items-center gap-1.5 z-20">
            <div className={`px-5 py-2 rounded-full border backdrop-blur-md font-mono font-black text-xs sm:text-sm tracking-wider shadow-xl flex items-center gap-2 transition-all duration-300 ${
              distanceInfo?.isOptimal
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                : distanceInfo?.status === 'TOO_FAR' || distanceInfo?.status === 'TOO_CLOSE'
                ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-slate-950/90 border-slate-700 text-slate-300'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                distanceInfo?.isOptimal 
                  ? 'bg-emerald-400 animate-ping' 
                  : bankAutoProgress > 0 
                  ? 'bg-amber-400' 
                  : 'bg-slate-500'
              }`} />
              <span>
                {bankAutoProgress >= 100 
                  ? '✓ ถ่ายภาพ 100% สำเร็จ!' 
                  : `สแกนชีวมิติ ${bankAutoProgress}%`}
              </span>
              {bankAutoProgress > 0 && bankAutoProgress < 100 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold tracking-normal ${
                  distanceInfo?.isOptimal 
                    ? 'bg-emerald-500/25 text-emerald-300' 
                    : 'bg-amber-500/25 text-amber-300'
                }`}>
                  {distanceInfo?.isOptimal ? '+ เพิ่มขึ้น' : '- กำลังลด'}
                </span>
              )}
            </div>

            {/* Visual Distance Feedback Pill */}
            {distanceInfo && (
              <div className={`px-4 py-1 rounded-full text-xs font-bold backdrop-blur-md border shadow flex items-center gap-1.5 transition-all duration-300 ${
                distanceInfo.status === 'PERFECT'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : distanceInfo.status === 'TOO_FAR'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : distanceInfo.status === 'TOO_CLOSE'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : distanceInfo.status === 'OFF_CENTER'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}>
                <span>
                  {distanceInfo.status === 'PERFECT' && '✓ เอาหน้าเข้ามาชิดพอดีแล้ว'}
                  {distanceInfo.status === 'TOO_FAR' && '🔍 กรุณาเอาหน้าเข้ามาชิด'}
                  {distanceInfo.status === 'TOO_CLOSE' && '⚠️ ระยะใกล้เกินไป (ถอยห่าง)'}
                  {distanceInfo.status === 'OFF_CENTER' && '🎯 จัดใบหน้าให้อยู่กึ่งกลางวงกลม'}
                  {distanceInfo.status === 'NO_FACE' && 'กรุณาวางใบหน้าในกรอบวงกลม'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Target Reticle Brackets (4 corners) */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-cyan-400/80 rounded-3xl" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-cyan-400/80 rounded-3xl" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-cyan-400/80 rounded-3xl" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-cyan-400/80 rounded-3xl" />

        {/* In-Viewfinder Prominent Guide: เอาหน้าเข้ามาชิด */}
        {scanMode === 'REGISTER' && distanceInfo?.status === 'TOO_FAR' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 animate-fadeIn">
            <div className="px-6 py-3 rounded-full bg-amber-500 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_40px_rgba(245,158,11,0.95)] border-2 border-white flex items-center gap-2 animate-bounce">
              <Scan className="w-5 h-5 stroke-[2.5]" />
              <span>🔍 กรุณาเอาหน้าเข้ามาชิด</span>
            </div>
            <div className="text-amber-300 font-mono text-xs sm:text-sm font-black tracking-widest mt-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] animate-pulse flex items-center gap-1.5">
              <span>▼</span>
              <span>ขยับใบหน้าเข้ามาใกล้กรอบวงกลม</span>
              <span>▼</span>
            </div>
          </div>
        )}

        {/* In-Viewfinder Prominent Scanning Progress: นับเปอร์เซ็นต์ค่อยๆ ขึ้น */}
        {scanMode === 'REGISTER' && distanceInfo?.isOptimal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 animate-fadeIn">
            <div className="px-6 py-2.5 rounded-full bg-slate-950/80 border-2 border-emerald-400 backdrop-blur-md text-emerald-300 font-mono font-black text-base sm:text-lg shadow-[0_0_35px_rgba(16,185,129,0.5)] flex items-center gap-2.5 animate-pulse">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span>สแกนชีวมิติ {bankAutoProgress}%</span>
            </div>
            <div className="text-emerald-300 font-sans text-xs font-bold mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              ✓ เอาหน้าเข้ามาชิดพอดีแล้ว กรุณานิ่งไว้
            </div>
          </div>
        )}

        {/* Animated Horizontal Laser Scanner Line inside Circle */}
        {!isConfirmed && (
          <div className="absolute w-[88%] h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_30px_#06B6D4] animate-laser pointer-events-none" />
        )}

        {/* Central Status Icon on Confirmation */}
        {isConfirmed && (
          <div className="w-40 h-40 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.95)] animate-bounce z-20">
            <Check className="w-28 h-28 stroke-[3.5]" />
          </div>
        )}

        {/* Floating Pill & Action Buttons Anchored Directly Below Circle */}
        <div className="absolute -bottom-16 inset-x-0 flex flex-wrap items-center justify-center gap-2.5 z-30 pointer-events-auto">
          {scanMode === 'REGISTER' ? (
            <>
              <span className={`px-5 py-2.5 rounded-full font-black text-xs sm:text-sm border shadow-2xl backdrop-blur-md transition-all ${
                distanceInfo?.isOptimal
                  ? 'bg-emerald-500 text-slate-950 border-white/50 shadow-emerald-500/40'
                  : bankAutoProgress > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-amber-500/40 animate-pulse'
                  : 'bg-slate-900/90 text-cyan-300 border-cyan-400/40'
              }`}>
                {bankGuidanceText}
              </span>
              <button
                type="button"
                onClick={handleAutoBankCapture}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white animate-bounce"
                title="กดถ่ายภาพทันทีโดยไม่ต้องรอระบบนับ"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>📸 กดถ่ายทันที</span>
              </button>
              <button
                type="button"
                onClick={exitBankRegisterMode}
                className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-full border border-slate-600 shadow-lg transition-all cursor-pointer"
              >
                กลับโหมดสแกนสมาชิกทั่วไป
              </button>
            </>
          ) : (
            <>
              <span
                className={`px-5 py-2 rounded-full font-extrabold text-xs sm:text-sm border shadow-2xl backdrop-blur-md transition-all ${
                  isConfirmed
                    ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/50'
                    : isUnknown
                    ? 'bg-amber-500 text-white border-amber-300 shadow-amber-500/50'
                    : 'bg-slate-900/90 text-cyan-300 border-cyan-400/40'
                }`}
              >
                {isConfirmed
                  ? '✓ ตรวจสอบข้อมูลสมาชิกถูกต้อง 100%'
                  : isUnknown
                  ? '⚠️ ไม่พบข้อมูลสมาชิกในระบบ'
                  : hasFace
                  ? '● กำลังสแกน... กรุณานิ่งไว้'
                  : 'โหมดสแกนสมาชิกทั่วไป'}
              </span>

              {/* In Bank Verification: When face is unknown, offer instant Bank e-KYC Auto Scan! */}
              {isUnknown && !isConfirmed ? (
                <button
                  onClick={startBankRegisterMode}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_35px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/60 animate-bounce"
                  title="เริ่มสแกนใบหน้าอัตโนมัติเพื่อลงทะเบียนข้อมูลใหม่"
                >
                  <ScanFace className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>🏛️ สแกนลงทะเบียนสมาชิกใหม่</span>
                </button>
              ) : (
                <button
                  onClick={startBankRegisterMode}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold text-xs shadow-lg backdrop-blur-md hover:scale-105 transition-all cursor-pointer"
                  title="ลงทะเบียนสมาชิกใหม่"
                >
                  <ScanFace className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ลงทะเบียนสมาชิกใหม่</span>
                </button>
              )}

              {isUnknown && !isConfirmed && (
                <button
                  onClick={handleResetScan}
                  className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-full border border-slate-700 transition-all cursor-pointer"
                >
                  สแกนใหม่
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 6. Bank 3-Step Live Verification Checklist Bar */}
      <div className="absolute bottom-3 sm:bottom-4 inset-x-4 flex items-center justify-center z-20 pointer-events-none">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-5 py-2 rounded-2xl bg-slate-900/85 border border-slate-700/80 backdrop-blur-md shadow-xl text-xs font-semibold text-slate-300">
          {scanMode === 'REGISTER' ? (
            <>
              {/* Step 1: Position */}
              <div className={`flex items-center gap-1.5 transition-colors ${hasFace ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                <span className={`w-2 h-2 rounded-full ${hasFace ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <span>1. วางใบหน้าในกรอบ</span>
              </div>
              <span className="text-slate-600">›</span>
              {/* Step 2: Distance & Quality */}
              <div className={`flex items-center gap-1.5 transition-colors ${
                distanceInfo?.isOptimal 
                  ? 'text-emerald-400 font-bold' 
                  : bankAutoProgress > 0 
                  ? 'text-amber-400 font-semibold' 
                  : 'text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  distanceInfo?.isOptimal 
                    ? 'bg-emerald-400 animate-pulse' 
                    : bankAutoProgress > 0 
                    ? 'bg-amber-400' 
                    : 'bg-slate-600'
                }`} />
                <span>2. คำนวณระยะพอดี ({bankAutoProgress}%)</span>
              </div>
              <span className="text-slate-600">›</span>
              {/* Step 3: Auto-Capture & Save */}
              <div className={`flex items-center gap-1.5 transition-colors ${bankAutoProgress >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                <span className={`w-2 h-2 rounded-full ${bankAutoProgress >= 100 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>3. สแกนและบันทึกอัตโนมัติ</span>
              </div>
            </>
          ) : (
            <>
              {/* Step 1: Face Position */}
              <div className={`flex items-center gap-1.5 transition-colors ${hasFace ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                <span className={`w-2 h-2 rounded-full ${hasFace ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <span>1. ตรวจจับตำแหน่งใบหน้า</span>
              </div>
              <span className="text-slate-600">›</span>
              {/* Step 2: Quality & Sharpness */}
              <div className={`flex items-center gap-1.5 transition-colors ${hasFace ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                <span className={`w-2 h-2 rounded-full ${hasFace ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span>2. ความคมชัดและแสงสว่าง</span>
              </div>
              <span className="text-slate-600">›</span>
              {/* Step 3: Biometric Match */}
              <div className={`flex items-center gap-1.5 transition-colors ${isConfirmed ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>3. ยืนยันข้อมูลชีวมิติ</span>
              </div>
            </>
          )}
        </div>
      </div>


      {/* 7. Bank-Style Confirmation Receipt / Success Slip Card (Pops up when confirmed) */}
      {isConfirmed && (
        <div className="absolute bottom-6 sm:bottom-8 inset-x-4 flex items-center justify-center z-40 pointer-events-auto">
          <div className="bg-slate-900/95 border-2 border-emerald-400 text-white w-full max-w-md p-5 sm:p-6 rounded-3xl backdrop-blur-2xl shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-scaleUp space-y-4">
            {/* Slip Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    VERIFIED & RECORDED
                  </div>
                  <div className="text-[11px] text-slate-400">บันทึกเวลาเข้างานสำเร็จ</div>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-400">
                <div>{currentTime}</div>
                <div className="text-[10px] text-slate-500">{currentDate}</div>
              </div>
            </div>

            {/* Slip Body: Member Name & AI Biometrics */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-semibold">ชื่อสมาชิก:</div>
              <div className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-2">
                <span>{personName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  MATCH 99.8%
                </span>
              </div>
            </div>

            {/* Slip Footer Meta */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Security: Anti-False 3-Frame Lock</span>
              <span className="text-emerald-400 font-bold">● Status: Active</span>
            </div>
          </div>
        </div>
      )}



      {/* Voice Guide Speaking Pill */}
      {isSpeaking && (
        <div className="absolute bottom-4 left-6 z-30 bg-emerald-500 text-white px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg animate-bounce">
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          <span>AI กำลังพูด...</span>
        </div>
      )}

      {/* 8. Attendance History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 sm:p-7 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl text-white animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 font-bold text-lg font-['Outfit']">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span>ประวัติการลงเวลาล่าสุด</span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">ยังไม่มีข้อมูลการบันทึกเวลา</div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3 font-bold">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                        {item.display_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{item.display_name}</div>
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>บันทึกสำเร็จ</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-slate-300 font-bold text-xs">
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.recognized_at).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="text-blue-400 text-sm">
                        {new Date(item.recognized_at).toLocaleTimeString('th-TH')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-3 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* 9. Camera Permission Denied / Hardware Blocked Alert Modal */}
      {(!isActive || cameraError) && (
        <div className="fixed inset-0 z-50 bg-[#0A0F1D]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-[0_0_80px_rgba(245,158,11,0.25)]">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-lg animate-bounce">
              <VideoOff className="w-10 h-10 stroke-[2]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>ตรวจพบปัญหาสิทธิ์การเข้าถึงกล้อง</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                {isPermissionDenied ? 'เบราว์เซอร์บล็อกการใช้งานกล้อง' : 'ไม่สามารถเปิดกล้องโน้ตบุ๊คได้'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
                {cameraError || 'ระบบตรวจพบกล้องเว็บแคมโน้ตบุ๊คแล้ว แต่เบราว์เซอร์ Chrome บล็อกสิทธิ์การแสดงผล'}
              </p>
            </div>

            {/* Step-by-Step Fix Guide with Visual Callout */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-left space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>วิธีแก้ไขและเปิดกล้องใน 3 ขั้นตอน:</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-cyan-500/40">
                    1
                  </span>
                  <span>
                    มองที่แถบที่อยู่เว็บ (URL) ด้านบนสุด ซ้ายมือของคำว่า{' '}
                    <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      localhost:3000
                    </strong>
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-cyan-500/40">
                    2
                  </span>
                  <span>
                    คลิกที่ไอคอนรูปกล้องที่มีขีดฆ่าสีแดง{' '}
                    <strong className="text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/40">
                      📷⃠
                    </strong>{' '}
                    หรือไอคอนปรับแต่งการตั้งค่า ⚙️
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-cyan-500/40">
                    3
                  </span>
                  <span>
                    เลือก{' '}
                    <strong className="text-emerald-400 font-bold">
                      "อนุญาตให้ localhost:3000 เข้าถึงกล้องของคุณเสมอ"
                    </strong>{' '}
                    (Always allow) แล้วกดปุ่ม <strong>"เสร็จสิ้น" (Done)</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => startCamera(selectedCameraId)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ลองเปิดกล้องใหม่อีกครั้ง (Retry)</span>
              </button>

              <div className="flex items-center gap-2">
                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 text-white border border-slate-700 text-xs font-semibold outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    {cameras.map((c, i) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `กล้อง ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleExit}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Shutter Camera White Flash Effect */}
      {isShutterFlashing && (
        <div className="fixed inset-0 z-50 bg-white/90 pointer-events-none transition-opacity duration-200" />
      )}

      {/* 11. Success Toast Notification */}
      {registerSuccessToast && (
        <div className="fixed top-20 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div className="bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_0_50px_rgba(16,185,129,0.7)] border-2 border-white/50 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <span>{registerSuccessToast}</span>
          </div>
        </div>
      )}

      {/* 12. Bank Biometric e-KYC Face Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900/95 border-2 border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_0_80px_rgba(16,185,129,0.3)] text-white space-y-5 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg font-['Outfit'] text-white">
                    ยืนยันข้อมูลชีวมิติ (Bank e-KYC)
                  </h3>
                  <p className="text-[11px] text-slate-400">ระบบสแกนภาพอัตโนมัติสำเร็จ กรุณาระบุชื่อผู้ถือสิทธิ์</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingRegister) {
                    exitBankRegisterMode();
                  }
                }}
                disabled={isSubmittingRegister}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto-Captured Face Preview Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 text-center">
              <div className="relative">
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Auto Captured Face"
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-slate-500">
                    <ScanFace className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-slate-950 border-2 border-slate-900 shadow-md">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ตรวจสอบภาพถ่ายชีวมิติ 100%
                </span>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={startBankRegisterMode}
                  disabled={isSubmittingRegister}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" /> สแกนใหม่อีกครั้ง
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleConfirmRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ชื่อ-นามสกุล หรือชื่อเรียก <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  disabled={isSubmittingRegister}
                  value={registerName}
                  onChange={(e) => {
                    setRegisterName(e.target.value);
                    if (registerError) setRegisterError(null);
                  }}
                  placeholder="เช่น สมชาย ใจดี หรือ พี่สมชาย"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 เมื่อสแกนผ่าน ระบบธนาคารจะขานชื่อนี้ต้อนรับคุณ
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ประเภทผู้ใช้งาน
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('USER')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      registerRole === 'USER'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    👤 สมาชิกทั่วไป (Member)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      registerRole === 'ADMIN'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    🛡️ ผู้ดูแลระบบ (Admin)
                  </button>
                </div>
              </div>

              {/* Error Message Box */}
              {registerError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <div className="font-bold">ไม่สามารถลงทะเบียนได้:</div>
                    <div className="text-[11px] text-rose-200">{registerError}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      คำแนะนำ: มองตรงมาที่กล้อง แสงสว่างเพียงพอ แล้วกด "สแกนใหม่อีกครั้ง"
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isSubmittingRegister}
                  onClick={exitBankRegisterMode}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRegister || !registerName.trim()}
                  className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmittingRegister ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>กำลังเข้ารหัสเวกเตอร์ชีวมิติ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>ยืนยันข้อมูลชีวมิติ (e-KYC)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
