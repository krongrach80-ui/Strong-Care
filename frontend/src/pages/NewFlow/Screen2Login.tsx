import React, { useState } from 'react';
import { ArrowLeft, User, LogIn, UserPlus, Camera, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { Patient } from '../../types/patient';
import { IS_STATIC_MODE } from '../../config/apiConfig';
import { api } from '../../services/api';

interface Screen2LoginProps {
  onBack: () => void;
  onLoginSuccess: (patient: Patient) => void;
  onOpenFaceLogin: () => void;
  onRegister: () => void;
  patients: Patient[];
}

export const Screen2Login: React.FC<Screen2LoginProps> = ({
  onBack,
  onLoginSuccess,
  onOpenFaceLogin,
  onRegister,
  patients,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [pin, setPin] = useState<string>('');
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // สแกนใบหน้าถูกซ่อนไว้เป็นค่าเริ่มต้นเพื่อความปลอดภัยของข้อมูลจริง
  // เปิดใช้งานเมื่อตั้งค่า VITE_ENABLE_FACE_LOGIN=true หรือเพิ่ม ?face_login=1 ใน URL
  const isFaceLoginEnabled =
    import.meta.env.VITE_ENABLE_FACE_LOGIN === 'true' ||
    (typeof window !== 'undefined' && window.location.search.includes('face_login=1'));

  const selectedPatient = patients.find((p) => p.id === Number(selectedPatientId));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPatientId || !selectedPatient) {
      setSelectionError('กรุณาเลือกโปรไฟล์ผู้ป่วยก่อนเข้าสู่ระบบ');
      return;
    }

    if (!IS_STATIC_MODE) {
      if (!pin || pin.trim().length === 0) {
        setSelectionError('กรุณากรอกรหัส PIN ประจำตัวผู้ป่วย');
        return;
      }
      setIsSubmitting(true);
      setSelectionError(null);
      try {
        const res = await api.login({
          patient_id: Number(selectedPatientId),
          pin: pin.trim(),
        });
        if (res.patient) {
          onLoginSuccess(res.patient);
        } else {
          onLoginSuccess(selectedPatient);
        }
      } catch (err: any) {
        setSelectionError(err?.message || 'การเข้าสู่ระบบล้มเหลว กรุณาตรวจสอบรหัส PIN');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setSelectionError(null);
      onLoginSuccess(selectedPatient);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col animate-fadeIn relative z-10 py-4 sm:py-8">
      {/* Top Back Navigation Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200/80 text-sm font-semibold text-[#0B2B2B] hover:bg-white transition active:scale-95 shadow-sm"
          aria-label="ย้อนกลับไปหน้าแรก"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับ</span>
        </button>
        <span className="text-xs font-semibold text-emerald-800">ขั้นตอนที่ 2 จาก 4</span>
      </div>

      {/* Main Login Card */}
      <div className="bg-white/85 backdrop-blur-xl border border-emerald-200/90 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-emerald-700/5 space-y-6">
        {/* Avatar Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-[#1E8A4C] flex items-center justify-center text-[#1E8A4C] shadow-md shadow-emerald-500/15 mb-3">
            <User className="w-10 h-10" />
          </div>

          {IS_STATIC_MODE ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold mb-2">
              <span>โหมดสาธิต (Demo Mode)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold mb-2">
              <span>ระบบเข้าสู่ระบบปลอดภัย (Secure Clinic Auth)</span>
            </div>
          )}

          <h2 className="heading-underline !mb-2">เข้าสู่ระบบผู้ป่วย</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            กรุณาเลือกโปรไฟล์ผู้ป่วยเพื่อเข้าใช้งานระบบ
          </p>
        </div>

        {/* Notice Banner */}
        {IS_STATIC_MODE ? (
          <div className="text-[12px] text-amber-900 bg-amber-50/90 border border-amber-200 rounded-2xl p-3 leading-relaxed">
            <span className="font-bold">⚠️ โหมดสาธิต (Demo Mode):</span> เลือกโปรไฟล์ผู้ป่วยที่ลงทะเบียนไว้โดยตรงเพื่อทดลองฟังก์ชันการฝึกและคำนวณชีวกลศาสตร์
          </div>
        ) : (
          <div className="text-[12px] text-emerald-900 bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3 leading-relaxed">
            <span className="font-bold">🔒 ความปลอดภัยทางการแพทย์:</span> ยืนยันตัวตนผ่านเซิร์ฟเวอร์ด้วยรหัส PIN ประจำตัวผู้ป่วย (หรือสแกนใบหน้าชีวมิติ)
          </div>
        )}

        {/* Selection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              เลือกรายชื่อผู้ป่วยในระบบ:
            </label>
            <div className={`bg-white rounded-2xl border p-2.5 sm:p-3 flex items-center gap-2.5 shadow-sm transition ${
              selectionError ? 'border-rose-400 ring-2 ring-rose-200' : 'border-emerald-200 focus-within:border-[#1E8A4C] focus-within:ring-2 focus-within:ring-emerald-200'
            }`}>
              <User className="w-5 h-5 text-[#1E8A4C] flex-shrink-0" />
              <select
                id="patientSelectDropdown"
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value ? Number(e.target.value) : '');
                  setSelectionError(null);
                }}
                className="w-full bg-transparent text-sm font-semibold text-[#0B2B2B] outline-none cursor-pointer"
              >
                <option value="">-- กรุณาเลือกโปรไฟล์ผู้ป่วย --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patient_code})
                  </option>
                ))}
              </select>
            </div>
            {selectionError && (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{selectionError}</span>
              </p>
            )}
          </div>

          {!IS_STATIC_MODE && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัส PIN ประจำตัวผู้ป่วย:
              </label>
              <div className="bg-white rounded-2xl border border-emerald-200 focus-within:border-[#1E8A4C] focus-within:ring-2 focus-within:ring-emerald-200 p-2.5 sm:p-3 flex items-center gap-2.5 shadow-sm transition">
                <KeyRound className="w-5 h-5 text-[#1E8A4C] flex-shrink-0" />
                <input
                  type="password"
                  id="patientPinInput"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setSelectionError(null);
                  }}
                  placeholder="กรอก PIN ประจำตัว (เช่น 1234 หรือเลขท้าย 4 ตัว)"
                  maxLength={10}
                  className="w-full bg-transparent text-sm font-semibold text-[#0B2B2B] outline-none"
                />
              </div>
            </div>
          )}

          {/* Patient Details Preview if selected */}
          {selectedPatient && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">{selectedPatient.name}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 font-bold">
                  {selectedPatient.patient_code}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex gap-3">
                <span>อายุ: {selectedPatient.age} ปี</span>
                <span>เพศ: {selectedPatient.gender === 'male' ? 'ชาย' : selectedPatient.gender === 'female' ? 'หญิง' : 'อื่นๆ'}</span>
              </div>
              {selectedPatient.notes && (
                <p className="text-[11px] text-slate-600 border-t border-emerald-100 pt-1 mt-1">
                  อาการ/บันทึก: {selectedPatient.notes}
                </p>
              )}
            </div>
          )}

          {/* Face Login Fast-Action: แสดงเฉพาะเมื่อเปิด VITE_ENABLE_FACE_LOGIN=true หรือ ?face_login=1 */}
          {isFaceLoginEnabled && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onOpenFaceLogin}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#1E8A4C] hover:text-[#156C3B] p-1.5 transition"
              >
                <Camera className="w-4 h-4 text-[#1E8A4C]" />
                <span>หรือ สแกนใบหน้าเข้าสู่ระบบ (Face Login)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  ทดลอง (Beta)
                </span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-capsule !w-full"
              id="btnLoginSubmit"
            >
              <LogIn className="w-5 h-5" />
              <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
            </button>

            <button
              type="button"
              onClick={onRegister}
              className="btn-secondary-capsule !w-full"
              id="btnRegister"
            >
              <UserPlus className="w-5 h-5" />
              <span>สมัครสมาชิกผู้ป่วยใหม่</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
