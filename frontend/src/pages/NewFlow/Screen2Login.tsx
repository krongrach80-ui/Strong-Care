import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  LogIn,
  Camera,
  AlertCircle,
  KeyRound,
  Shield,
  Phone,
  Sparkles,
} from 'lucide-react';
import { Patient } from '../../types/patient';
import { IS_STATIC_MODE } from '../../config/apiConfig';
import { useHospitalStore } from '../../store/hospitalStore';
import { api } from '../../services/api';
import { supabaseService } from '../../services/supabaseService';

interface Screen2LoginProps {
  onBack: () => void;
  onLoginSuccess: (patient: Patient) => void;
  onOpenFaceLogin: () => void;
  onRegister?: () => void;
  patients: Patient[];
}

export const Screen2Login: React.FC<Screen2LoginProps> = ({
  onBack,
  onLoginSuccess,
  onOpenFaceLogin,
  patients,
}) => {
  const [patientIdentifier, setPatientIdentifier] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { users } = useHospitalStore();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idOrPhone = patientIdentifier.trim();
    const enteredPin = pin.trim();

    if (!idOrPhone) {
      setSelectionError('กรุณากรอกรหัสประจำตัวผู้ป่วย (เช่น P-0012) หรือเบอร์โทรศัพท์');
      return;
    }

    if (!enteredPin) {
      setSelectionError('กรุณากรอกรหัส PIN ประจำตัว (เช่น 1234)');
      return;
    }

    setIsSubmitting(true);
    setSelectionError(null);

    try {
      const q = idOrPhone.toLowerCase();

      // 1. ตรวจสอบกับฐานข้อมูล Supabase ก่อนถ้ามีการตั้งค่า
      if (supabaseService.isConfigured()) {
        const sbAuth = await supabaseService.verifyPatientPin(idOrPhone, enteredPin);
        if (sbAuth.success && sbAuth.patient) {
          onLoginSuccess(sbAuth.patient);
          return;
        } else if (sbAuth.error === 'รหัส PIN ไม่ถูกต้อง') {
          setSelectionError(sbAuth.error);
          setIsSubmitting(false);
          return;
        }
        // หากไม่พบข้อมูลใน Supabase หรือฐานข้อมูลติด RLS / ออฟไลน์ ให้ตรวจสอบใน store สำรองต่อไป
      }

      // 2. ตรวจสอบในฐานข้อมูล hospitalStore
      const matchedUser = users.find((u) => {
        const codeMatch = u.code.toLowerCase() === q;
        const phoneMatch = u.phone && u.phone.replace(/[^0-9]/g, '') === idOrPhone.replace(/[^0-9]/g, '');
        const userMatch = u.username.toLowerCase() === q;
        const nameMatch = u.name.toLowerCase().includes(q);
        const idMatch = String(u.id) === q;
        return (codeMatch || phoneMatch || userMatch || nameMatch || idMatch) && u.role === 'patient';
      });

      // 3. ตรวจสอบในฐานข้อมูล patients (API / Local store)
      const matchedPatient = patients.find((p) => {
        return (
          p.patient_code.toLowerCase() === q ||
          p.name.toLowerCase().includes(q) ||
          String(p.id) === q
        );
      });

      // ตรวจสอบรหัส PIN: อนุญาตถ้าตรงกับ password ของผู้ใช้ หรือ PIN มาตรฐาน 1234
      const expectedPin = matchedUser?.password || '1234';
      if (enteredPin !== expectedPin && enteredPin !== '1234') {
        setSelectionError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setIsSubmitting(false);
        return;
      }

      if (!IS_STATIC_MODE) {
        try {
          const targetId = matchedPatient?.id || matchedUser?.id;
          const targetCode = matchedPatient?.patient_code || matchedUser?.code;
          const res = await api.login({
            patient_id: targetId,
            patient_code: targetCode,
            pin: enteredPin,
          });
          if (res.patient) {
            onLoginSuccess(res.patient);
            return;
          }
        } catch {
          // หากเชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ให้ fallback เข้าระบบออฟไลน์
        }
      }

      if (matchedPatient) {
        onLoginSuccess(matchedPatient);
      } else if (matchedUser) {
        const p: Patient = {
          id: matchedUser.id,
          patient_code: matchedUser.code,
          name: matchedUser.name,
          age: matchedUser.age || 65,
          gender: (matchedUser.gender as any) || 'male',
          notes: matchedUser.chiefComplaint || matchedUser.diagnosis || '',
        };
        onLoginSuccess(p);
      } else {
        // หากเป็นโหมดสาธิตและใส่รหัสคนไข้ขึ้นต้นด้วย P- หรือเบอร์โทร
        if (IS_STATIC_MODE) {
          const fallback: Patient = {
            id: 12,
            patient_code: idOrPhone.toUpperCase().startsWith('P-') ? idOrPhone.toUpperCase() : 'P-0012',
            name: 'นายสมชาย ใจดี',
            age: 68,
            gender: 'male',
            notes: 'เข้าสู่ระบบด้วยรหัสคนไข้',
          };
          onLoginSuccess(fallback);
        } else {
          setSelectionError('ไม่พบข้อมูลผู้ป่วยที่มีรหัสหรือเบอร์โทรนี้ในระบบ กรุณาตรวจสอบหรือติดต่อเคาน์เตอร์ต้อนรับ');
        }
      }
    } catch (err: any) {
      setSelectionError(err?.message || 'การเข้าสู่ระบบล้มเหลว กรุณาตรวจสอบข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickDemo = (code: string, demoPin: string = '1234') => {
    setPatientIdentifier(code);
    setPin(demoPin);
    setSelectionError(null);
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col animate-fadeIn relative z-10 py-4 sm:py-8">
      {/* Top Back Navigation Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200/80 text-sm font-semibold text-[#0B2B2B] hover:bg-white transition active:scale-95 shadow-sm cursor-pointer"
          aria-label="ย้อนกลับไปหน้าแรก"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับ</span>
        </button>
        <span className="text-xs font-semibold text-emerald-800">ขั้นตอนที่ 2 จาก 4</span>
      </div>

      {/* Main Login Card */}
      <div className="bg-white/90 backdrop-blur-xl border border-emerald-200/90 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-emerald-700/5 space-y-6">
        {/* Avatar Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-[#1E8A4C] flex items-center justify-center text-[#1E8A4C] shadow-md shadow-emerald-500/15 mb-3">
            <User className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            <span>ระบบเข้าสู่ระบบตู้กายภาพบำบัด</span>
          </div>

          <h2 className="heading-underline !mb-2">เข้าสู่ระบบผู้ป่วย</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            กรุณายืนยันตัวตนด้วยรหัสประจำตัว หรือสแกนใบหน้าเพื่อเริ่มการฝึก
          </p>
        </div>

        {/* 1. Fast Biometric Face Login Action */}
        <div className="text-center">
          <button
            type="button"
            onClick={onOpenFaceLogin}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-[#1E8A4C] hover:from-emerald-700 hover:to-[#156C3B] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-98 cursor-pointer"
            id="btnFaceLoginKiosk"
          >
            <Camera className="w-5 h-5 text-emerald-200" />
            <span>สแกนใบหน้าเข้าใช้งานตู้ (Kiosk Face Login)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
              ชีวมิติ AI
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-emerald-100" />
          <span className="text-xs font-bold text-slate-400">หรือเข้าใช้งานด้วยรหัส PIN</span>
          <div className="flex-1 h-px bg-emerald-100" />
        </div>

        {/* Form: รหัสคนไข้ และ PIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รหัสประจำตัวผู้ป่วย (HN / รหัสคนไข้) หรือเบอร์โทรศัพท์:
            </label>
            <div className={`bg-white rounded-2xl border p-2.5 sm:p-3 flex items-center gap-2.5 shadow-sm transition ${
              selectionError ? 'border-rose-400 ring-2 ring-rose-200' : 'border-emerald-200 focus-within:border-[#1E8A4C] focus-within:ring-2 focus-within:ring-emerald-200'
            }`}>
              <User className="w-5 h-5 text-[#1E8A4C] flex-shrink-0" />
              <input
                type="text"
                id="patientIdInput"
                value={patientIdentifier}
                onChange={(e) => {
                  setPatientIdentifier(e.target.value);
                  setSelectionError(null);
                }}
                placeholder="กรอกรหัส เช่น P-0012 หรือเบอร์โทรศัพท์"
                className="w-full bg-transparent text-sm font-semibold text-[#0B2B2B] outline-none"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รหัส PIN ประจำตัวผู้ป่วย (4 หลัก):
            </label>
            <div className={`bg-white rounded-2xl border p-2.5 sm:p-3 flex items-center gap-2.5 shadow-sm transition ${
              selectionError ? 'border-rose-400 ring-2 ring-rose-200' : 'border-emerald-200 focus-within:border-[#1E8A4C] focus-within:ring-2 focus-within:ring-emerald-200'
            }`}>
              <KeyRound className="w-5 h-5 text-[#1E8A4C] flex-shrink-0" />
              <input
                type="password"
                id="patientPinInput"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setSelectionError(null);
                }}
                placeholder="กรอกรหัส PIN (เช่น 1234)"
                maxLength={6}
                className="w-full bg-transparent text-sm font-semibold text-[#0B2B2B] outline-none"
              />
            </div>
          </div>

          {/* Quick Demo Helper Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-800">บัญชีตัวอย่าง:</span>
            <button
              type="button"
              onClick={() => fillQuickDemo('P-0012', '1234')}
              className="px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition cursor-pointer"
            >
              P-0012 (สมชาย)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('P-0013', '1234')}
              className="px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition cursor-pointer"
            >
              P-0013 (มาลี)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('P-0021', '1234')}
              className="px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition cursor-pointer"
            >
              P-0021 (วิชัย)
            </button>
          </div>

          {selectionError && (
            <p className="text-xs text-rose-600 font-semibold mt-1 pl-1 flex items-center gap-1 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{selectionError}</span>
            </p>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-capsule !w-full cursor-pointer"
              id="btnLoginSubmit"
            >
              <LogIn className="w-5 h-5" />
              <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย PIN'}</span>
            </button>
          </div>
        </form>

        {/* Notice for new patient registration */}
        <div className="text-[11px] text-slate-500 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 leading-relaxed text-center">
          💡 <strong>สำหรับผู้ป่วยใหม่:</strong> กรุณาติดต่อเคาน์เตอร์ต้อนรับหรือนักกายภาพบำบัดเพื่อลงทะเบียนและบันทึกใบหน้าก่อนใช้งานตู้
        </div>
      </div>
    </div>
  );
};
