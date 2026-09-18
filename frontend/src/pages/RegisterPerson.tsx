import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Camera, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw,
  FolderCheck,
  Shield
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { api } from '../services/api';

const ANGLES = [
  { id: 'front', label: 'หน้าตรง (Front View)', desc: 'มองตรงมาที่กล้อง ใบหน้าชัดเจน' },
  { id: 'left', label: 'หันซ้ายเล็กน้อย (Left 15°)', desc: 'เอียงใบหน้าไปทางซ้ายประมาณ 15 องศา' },
  { id: 'right', label: 'หันขวาเล็กน้อย (Right 15°)', desc: 'เอียงใบหน้าไปทางขวาประมาณ 15 องศา' },
  { id: 'up', label: 'เงยหน้าเล็กน้อย (Tilt Up)', desc: 'เงยหน้าขึ้นเล็กน้อยเพื่อให้เห็นแนวกราม' },
  { id: 'down', label: 'ก้มหน้าเล็กน้อย (Tilt Down)', desc: 'ก้มหน้าลงเล็กน้อย' }
];

interface RegisterPersonProps {
  onSuccessNavigate?: () => void;
}

export const RegisterPerson: React.FC<RegisterPersonProps> = ({ onSuccessNavigate }) => {
  const { videoRef, isActive, startCamera, stopCamera, captureFrame } = useCamera();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('USER');

  const [step, setStep] = useState<number>(1);
  const [currentAngleIndex, setCurrentAngleIndex] = useState<number>(0);
  const [capturedAngles, setCapturedAngles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [savedFolderLocation, setSavedFolderLocation] = useState<string>('');

  useEffect(() => {
    if (step === 2) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step]);

  const handleStartCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอกชื่อผู้ใช้และชื่อที่ต้องการแสดง' });
      return;
    }
    setStatusMessage(null);
    setStep(2);
  };

  const handleCaptureCurrentAngle = async () => {
    const frameB64 = captureFrame();
    if (!frameB64) {
      setStatusMessage({ type: 'error', text: 'ไม่สามารถบันทึกภาพจากกล้องได้' });
      return;
    }

    const currentAngle = ANGLES[currentAngleIndex];
    setLoading(true);
    setStatusMessage({ type: 'info', text: 'กำลังตรวจสอบคุณภาพและลงทะเบียนมุม ' + currentAngle.label + '...' });

    try {
      const res = await api.registerFace({
        username: username.trim(),
        display_name: displayName.trim(),
        role,
        angle_label: currentAngle.id,
        image_base64: frameB64
      });

      if (res.folder_location) {
        setSavedFolderLocation(res.folder_location);
      }

      setCapturedAngles((prev) => ({
        ...prev,
        [currentAngle.id]: frameB64
      }));

      setStatusMessage({
        type: 'success',
        text: 'สำเร็จ! บันทึกมุม ' + currentAngle.label + ' เรียบร้อยและจัดเก็บลงโฟลเดอร์'
      });

      if (currentAngleIndex < ANGLES.length - 1) {
        setTimeout(() => {
          setCurrentAngleIndex((prev) => prev + 1);
          setStatusMessage(null);
        }, 1200);
      } else {
        setTimeout(() => {
          setStep(3);
        }, 1500);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'บันทึกใบหน้าล้มเหลว' });
    } finally {
      setLoading(false);
    }
  };

  const targetFolderPreview = role === 'ADMIN' ? 'storage/faces/admins/' : 'storage/faces/users/';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Outfit']">ลงทะเบียนสมาชิกใหม่ (Admin Panel)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดเก็บภาพถ่ายใบหน้าและสกัด Vector แยกตามบทบาท (Admin / User) เข้าโฟลเดอร์อย่างเป็นระบบ
            </p>
          </div>
        </div>

        {/* Wizard Steps indicator */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-[#10B981] text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              1
            </div>
            <span className={`text-xs font-semibold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              กำหนดบทบาท & ข้อมูล
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-[#10B981] text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              2
            </div>
            <span className={`text-xs font-semibold ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              ถ่ายภาพ 5 มุมมอง
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 3 ? 'bg-[#10B981] text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              3
            </div>
            <span className={`text-xs font-semibold ${step === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              เสร็จสิ้น
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: User Information Form */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">กำหนดบทบาทและข้อมูลสมาชิก</h2>
          <form onSubmit={handleStartCapture} className="space-y-5">
            {/* Role Radio Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                บทบาทในระบบ (Role Selection) *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setRole('USER')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    role === 'USER'
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    USER
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">สมาชิกทั่วไป / ผู้สูงอายุ</div>
                    <div className="text-[11px] text-slate-500">เก็บในโฟลเดอร์ <code>storage/faces/users/</code></div>
                  </div>
                </div>

                <div
                  onClick={() => setRole('ADMIN')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    role === 'ADMIN'
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">ผู้ดูแลระบบ (Administrator)</div>
                    <div className="text-[11px] text-slate-500">เก็บในโฟลเดอร์ <code>storage/faces/admins/</code></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                รหัสประจำตัว หรือ Username (ภาษาอังกฤษ/ตัวเลข ไม่มีเว้นวรรค) *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="เช่น somchai_01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                ชื่อ-นามสกุล ที่ต้องการแสดงและให้ AI อ่านออกเสียง *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Target Folder Callout */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ตำแหน่งโฟลเดอร์จัดเก็บ: <strong className="text-emerald-700 font-mono">{targetFolderPreview}{username || '{username}'}_{displayName || '{ชื่อ}'}/</strong>
              </span>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl text-xs bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
              >
                <span>ถัดไป: ถ่ายภาพใบหน้า</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Multi-Angle Camera Capture */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                มุมมองที่ {currentAngleIndex + 1} จาก {ANGLES.length} ({role})
              </span>
              <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
                {ANGLES[currentAngleIndex].label}
              </h2>
              <p className="text-xs text-slate-500">{ANGLES[currentAngleIndex].desc}</p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>แก้ไขข้อมูล</span>
            </button>
          </div>

          <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video max-h-[420px] flex items-center justify-center border-4 border-white shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-72 border-2 border-dashed border-[#10B981] rounded-[45%] flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                <span className="text-[11px] font-semibold text-slate-900 bg-white/90 px-2.5 py-1 rounded-full shadow-sm">
                  วางใบหน้าให้อยู่ในกรอบนี้
                </span>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {statusMessage.type === 'error' ? (
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              ) : statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 animate-spin" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-5 gap-3">
            {ANGLES.map((ang, idx) => {
              const isCaptured = !!capturedAngles[ang.id];
              const isCurrent = idx === currentAngleIndex;
              return (
                <div
                  key={ang.id}
                  onClick={() => setCurrentAngleIndex(idx)}
                  className={`p-2 rounded-xl text-center cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                      : isCaptured
                      ? 'bg-slate-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">{ang.id.toUpperCase()}</div>
                  <div className="mt-1 text-[10px]">
                    {isCaptured ? (
                      <span className="text-emerald-600 font-bold flex items-center justify-center gap-0.5">
                        <Check className="w-3 h-3" /> เก็บแล้ว
                      </span>
                    ) : isCurrent ? (
                      <span className="text-blue-600 font-semibold">กำลังถ่าย</span>
                    ) : (
                      <span>รอถ่าย</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                if (currentAngleIndex < ANGLES.length - 1) {
                  setCurrentAngleIndex(currentAngleIndex + 1);
                } else {
                  setStep(3);
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              ข้ามมุมนี้ &gt;
            </button>

            <button
              disabled={loading}
              onClick={handleCaptureCurrentAngle}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)] transition-all transform hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              <span>{loading ? 'กำลังประมวลผล AI...' : 'บันทึกมุม ' + ANGLES[currentAngleIndex].id.toUpperCase()}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Registration Complete */}
      {step === 3 && (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-500 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">ลงทะเบียนสมาชิกสำเร็จ!</h2>
            <p className="text-sm text-slate-600">
              บันทึกข้อมูลสำหรับ <strong>{displayName}</strong> ({username}) ในฐานะ <strong>{role}</strong> เรียบร้อยแล้ว
            </p>
            {savedFolderLocation && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                📁 จัดเก็บภาพถ่ายใน: <span className="text-emerald-700 font-bold">{savedFolderLocation}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setUsername('');
                setDisplayName('');
                setCapturedAngles({});
                setCurrentAngleIndex(0);
                setSavedFolderLocation('');
                setStep(1);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ลงทะเบียนบุคคลถัดไป</span>
            </button>

            <button
              onClick={onSuccessNavigate}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <span>ไปที่หน้า Live Recognition</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};