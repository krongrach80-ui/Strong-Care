import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  RotateCcw, 
  CheckCircle2, 
  ArrowLeft, 
  Smile, 
  Sparkles, 
  Heart, 
  User, 
  AlertCircle,
  Volume2,
  ScanFace,
  Check
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useSpeech } from '../hooks/useSpeech';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface SelfRegisterProps {
  onBackToLogin: () => void;
  onRegisteredSuccess: () => void;
}

export const SelfRegister: React.FC<SelfRegisterProps> = ({ onBackToLogin, onRegisteredSuccess }) => {
  const { videoRef, isActive, startCamera, stopCamera, captureFrame } = useCamera();
  const { speak, playChime } = useSpeech();
  const { login, largeFont, voiceGuide } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phoneOrId, setPhoneOrId] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  // Bank e-KYC Live Distance Auto-Scan States
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const autoProgressRef = useRef<number>(0);
  const [distanceInfo, setDistanceInfo] = useState<{
    status: 'PERFECT' | 'TOO_FAR' | 'TOO_CLOSE' | 'OFF_CENTER' | 'NO_FACE';
    isOptimal: boolean;
    sizeRatio: number;
    message: string;
  } | null>(null);
  const lastVoiceDistRef = useRef<{ status: string; time: number }>({ status: '', time: 0 });
  const hasCapturedRef = useRef<boolean>(false);

  // Distance Calculation Helper
  const evalFaceDistance = useCallback((box: any, frameW?: number, frameH?: number) => {
    if (!box || !box.width || !box.height) {
      return {
        status: 'NO_FACE' as const,
        isOptimal: false,
        sizeRatio: 0,
        message: 'กรุณาวางใบหน้าให้อยู่ในกรอบ'
      };
    }

    const w = frameW || videoRef.current?.videoWidth || 640;
    const h = frameH || videoRef.current?.videoHeight || 480;
    const minDim = Math.min(w, h);
    const sizeRatio = Math.max(box.width, box.height) / (minDim || 1);
    const cx = (box.x + box.width / 2.0) / (w || 1);
    const cy = (box.y + box.height / 2.0) / (h || 1);

    if (sizeRatio < 0.22) {
      return {
        status: 'TOO_FAR' as const,
        isOptimal: false,
        sizeRatio,
        message: '🔍 อยู่ไกลเกินไป กรุณาขยับเข้าใกล้กล้องอีกนิด'
      };
    }
    if (sizeRatio > 0.62) {
      return {
        status: 'TOO_CLOSE' as const,
        isOptimal: false,
        sizeRatio,
        message: '⚠️ อยู่ใกล้เกินไป กรุณาถอยห่างจากกล้องอีกนิด'
      };
    }
    if (Math.abs(cx - 0.5) > 0.22 || Math.abs(cy - 0.5) > 0.22) {
      return {
        status: 'OFF_CENTER' as const,
        isOptimal: false,
        sizeRatio,
        message: '🎯 กรุณาวางใบหน้าให้อยู่กึ่งกลางกรอบ'
      };
    }
    return {
      status: 'PERFECT' as const,
      isOptimal: true,
      sizeRatio,
      message: '✓ ระยะพอดีแล้ว กรุณานิ่งไว้'
    };
  }, []);

  // Snap Photo handler
  const handleSnapPhoto = useCallback(() => {
    const frame = captureFrame();
    if (!frame) {
      setErrorMessage('ไม่สามารถถ่ายภาพจากกล้องได้ กรุณาลองใหม่อีกครั้ง');
      return;
    }
    setCapturedImage(frame);
    hasCapturedRef.current = true;
    setAutoProgress(100);
    autoProgressRef.current = 100;
    setErrorMessage(null);
    playChime('success');
    if (voiceGuide) {
      speak('ถ่ายภาพเรียบร้อยแล้วค่ะ หากรูปชัดเจนแล้ว กดปุ่มบันทึกข้อมูลได้เลยค่ะ');
    }
  }, [captureFrame, playChime, voiceGuide, speak]);

  const handleRetake = () => {
    setCapturedImage(null);
    hasCapturedRef.current = false;
    setAutoProgress(0);
    autoProgressRef.current = 0;
    setDistanceInfo(null);
    setErrorMessage(null);
    if (voiceGuide) {
      speak('พร้อมถ่ายภาพใหม่แล้วค่ะ ยิ้มมองกล้องนะคะ');
    }
  };

  // Voice guide introduction
  useEffect(() => {
    startCamera();
    if (voiceGuide) {
      const timer = setTimeout(() => {
        speak('ยินดีต้อนรับสู่การสมัครสมาชิกค่ะ กรุณากรอกชื่อและยิ้มให้กล้องเพื่อถ่ายภาพนะคะ');
      }, 1000);
      return () => clearTimeout(timer);
    }
    return () => {
      stopCamera();
    };
  }, [voiceGuide]);

  // Connect WebSocket for live distance calculation & auto capture
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname || 'localhost';
    const wsUrl = protocol + '//' + wsHost + ':8000/api/v1/ws/live';

    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      if (hasCapturedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'recognition_result') {
          const hasDetectedFace = Boolean(
            (data.faces_detected && data.faces_detected > 0) ||
            (data.status && data.status !== 'no_face' && data.status !== 'no_frame') ||
            data.box
          );

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

          if (hasDetectedFace && dist.isOptimal) {
            // พอดีให้เพิ่มเปอร์เซ็น (Increment percentage when distance is optimal!)
            const cur = autoProgressRef.current;
            const next = Math.min(100, cur + 12);
            autoProgressRef.current = next;
            setAutoProgress(next);

            if (next >= 100 && !hasCapturedRef.current) {
              handleSnapPhoto();
            }
          } else {
            // ไม่พอดีให้ลดเปอร์เซ็น (Decrement percentage when distance is NOT optimal!)
            const cur = autoProgressRef.current;
            const next = Math.max(0, cur - 10);
            autoProgressRef.current = next;
            setAutoProgress(next);

            // Voice hint throttled with 4s cooldown
            if (voiceGuide && Date.now() - lastVoiceDistRef.current.time > 4000) {
              if (dist.status === 'TOO_FAR') {
                speak('ขยับเข้ามาใกล้กล้องอีกนิดนะคะ');
                lastVoiceDistRef.current = { status: 'TOO_FAR', time: Date.now() };
              } else if (dist.status === 'TOO_CLOSE') {
                speak('ถอยห่างจากกล้องอีกนิดนะคะ');
                lastVoiceDistRef.current = { status: 'TOO_CLOSE', time: Date.now() };
              } else if (dist.status === 'OFF_CENTER') {
                speak('วางใบหน้าให้อยู่ตรงกลางกรอบนะคะ');
                lastVoiceDistRef.current = { status: 'OFF_CENTER', time: Date.now() };
              }
            }
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    setWs(socket);
    return () => {
      socket.close();
    };
  }, [handleSnapPhoto, voiceGuide, speak, evalFaceDistance]);

  // Frame sender loop (WebSocket)
  useEffect(() => {
    let timer: any;
    const sendFrame = () => {
      if (ws && ws.readyState === WebSocket.OPEN && isActive && !hasCapturedRef.current) {
        const frameB64 = captureFrame();
        if (frameB64) {
          ws.send(JSON.stringify({
            type: 'frame',
            image: frameB64,
            camera_id: 'self_register'
          }));
        }
      }
      timer = setTimeout(sendFrame, 150);
    };

    if (isActive && !capturedImage) {
      sendFrame();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, ws, captureFrame, capturedImage]);

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('กรุณากรอกชื่อ-นามสกุลของคุณตาคุณยายค่ะ');
      return;
    }
    if (!capturedImage) {
      setErrorMessage('กรุณากดปุ่มถ่ายภาพใบหน้าก่อนบันทึกข้อมูลนะคะ');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const safeUsername = (phoneOrId.trim() || 'user_' + Date.now()).toLowerCase().replace(/[^a-z0-9_]/g, '_');

    try {
      const res = await api.selfRegister({
        username: safeUsername,
        display_name: displayName.trim(),
        role: 'USER',
        image_base64: capturedImage
      });

      setSuccessInfo(res);
      playChime('success');

      if (voiceGuide) {
        speak('สมัครสมาชิกสำเร็จแล้วค่ะ ยินดีต้อนรับนะคะ คุณ ' + displayName.trim());
      }

      setTimeout(() => {
        login(safeUsername, 'USER', displayName.trim());
        onRegisteredSuccess();
      }, 2500);

    } catch (err: any) {
      setErrorMessage(err.message || 'การสมัครสมาชิกล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto py-6 space-y-6 animate-fadeIn ${largeFont ? 'text-lg' : ''}`}>
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Smile className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              สมัครสมาชิกใหม่ (ถ่ายภาพลงทะเบียน)
            </h1>
            <p className="text-xs md:text-sm text-slate-600">
              สำหรับผู้สูงอายุและสมาชิกทั่วไป กรอกชื่อง่าย ๆ แล้วถ่ายภาพใบหน้าค่ะ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToLogin}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-semibold transition-colors cursor-pointer border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าแรก</span>
        </button>
      </div>

      {successInfo ? (
        /* Success Screen */
        <div className="bg-white p-10 rounded-3xl border-2 border-emerald-500 text-center space-y-6 shadow-2xl shadow-emerald-500/10">
          <div className="w-20 h-20 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/40 animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-['Outfit']">สมัครสมาชิกสำเร็จเรียบร้อย!</h2>
            <p className="text-base text-emerald-700 font-bold">
              ยินดีต้อนรับ <strong>{displayName}</strong> สู่ระบบ FaceVoice AI
            </p>
            <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono inline-block">
              📁 ภาพถ่ายถูกจัดเก็บใน: <span className="text-emerald-600 font-bold">{successInfo.folder_location}</span>
            </div>
          </div>

          <p className="text-sm text-slate-500 animate-pulse">
            กำลังนำคุณตาคุณยายเข้าสู่หน้าสแกนใบหน้าลงเวลาอัตโนมัติสักครู่นะคะ...
          </p>
        </div>
      ) : (
        /* Registration Form */
        <form onSubmit={handleSubmitRegistration} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Camera Viewport */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#2563EB]" />
                  <span>ภาพถ่ายใบหน้าของคุณตาคุณยาย</span>
                </span>
                {capturedImage && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    ถ่ายภาพแล้ว ✓
                  </span>
                )}
              </div>

              {/* Viewport Box with Distance-Aware Auto-Capture */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center border-2 border-slate-200 shadow-md">
                {capturedImage ? (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    
                    {/* Top Progress Bar */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-slate-800/80 z-20">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          distanceInfo?.isOptimal 
                            ? 'bg-emerald-400 shadow-[0_0_12px_#10B981]' 
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${autoProgress}%` }}
                      />
                    </div>

                    {/* Friendly Guide Oval with Distance Feedback */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className={`w-48 h-60 rounded-[48%] border-4 transition-all duration-300 flex items-center justify-center relative ${
                        distanceInfo?.isOptimal 
                          ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                          : autoProgress > 0 
                          ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                          : 'border-dashed border-emerald-500/80 animate-pulse'
                      }`}>
                        {/* Top HUD Percentage Capsule */}
                        <div className="absolute -top-3.5 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all duration-300 bg-slate-950/90 border border-slate-700 text-white">
                          <span className={`w-2 h-2 rounded-full ${distanceInfo?.isOptimal ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                          <span>สแกนชีวมิติ {autoProgress}%</span>
                          {autoProgress > 0 && autoProgress < 100 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-bold ${
                              distanceInfo?.isOptimal ? 'bg-emerald-500/25 text-emerald-300' : 'bg-amber-500/25 text-amber-300'
                            }`}>
                              {distanceInfo?.isOptimal ? '+ เพิ่มขึ้น' : '- กำลังลด'}
                            </span>
                          )}
                        </div>

                        {/* Bottom Distance Message Capsule */}
                        <div className={`absolute -bottom-3.5 px-3.5 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition-all duration-300 border ${
                          distanceInfo?.isOptimal 
                            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' 
                            : distanceInfo?.status === 'TOO_FAR' || distanceInfo?.status === 'TOO_CLOSE'
                            ? 'bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse'
                            : 'bg-slate-950/90 border-slate-700 text-slate-300'
                        }`}>
                          {distanceInfo?.message || 'ยิ้มมองตรงนี้นะคะ'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Camera Trigger Buttons */}
              <div className="flex gap-2">
                {!capturedImage ? (
                  <button
                    type="button"
                    onClick={handleSnapPhoto}
                    className={`w-full py-3.5 rounded-2xl font-extrabold text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      distanceInfo?.isOptimal
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                        : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)]'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                    <span>
                      {autoProgress > 0 && autoProgress < 100 
                        ? `📸 กำลังสแกน (${autoProgress}%) หรือกดถ่ายทันที` 
                        : '📸 กดปุ่มนี้เพื่อถ่ายภาพ'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-amber-700 font-bold text-sm border border-amber-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ถ่ายใหม่อีกครั้ง</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Information Inputs */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-5 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    ชื่อ-นามสกุลของคุณตาคุณยาย: *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-indigo-600 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="เช่น คุณยายสมศรี ใจดี"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">ชื่อนี้จะถูกนำไปให้ AI เรียกทักทายด้วยเสียงภาษาไทยค่ะ</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    เบอร์โทรศัพท์ หรือ ชื่อเล่น:
                  </label>
                  <input
                    type="text"
                    value={phoneOrId}
                    onChange={(e) => setPhoneOrId(e.target.value)}
                    placeholder="เช่น 0812345678 หรือ som_sri"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">ใช้สำหรับเป็นรหัสประจำตัวสมาชิกในการจัดเก็บโฟลเดอร์</p>
                </div>

                {/* Info Callout */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-600" />
                    <span>ข้อมูลภาพถ่ายจะถูกจัดเก็บปลอดภัย</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    ระบบจะสร้างโฟลเดอร์ระบุชื่อของท่าน พร้อมจัดเก็บภาพถ่ายไว้ในโฟลเดอร์ <code className="text-emerald-700 font-mono font-bold">storage/faces/users/</code> เพื่อใช้ในการจดจำใบหน้าลงเวลาอัตโนมัติ
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-lg shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                <span>{loading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการสมัครสมาชิก'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};