import React, { useState } from 'react';
import { ArrowLeft, User, Lock, LogIn, UserPlus, Camera, Sparkles } from 'lucide-react';
import { Patient } from '../../types/patient';

interface Screen2LoginProps {
  onBack: () => void;
  onLoginSuccess: (userName: string) => void;
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
  const [userName, setUserName] = useState<string>('คุณสมชาย ใจดี');
  const [password, setPassword] = useState<string>('••••••••');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onLoginSuccess(userName.trim() || 'คุณสมชาย ใจดี');
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

      {/* Main Login Card (Glassmorphism & Crisp borders) */}
      <div className="bg-white/85 backdrop-blur-xl border border-emerald-200/90 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-emerald-700/5 space-y-6">
        
        {/* Avatar Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-[#1E8A4C] flex items-center justify-center text-[#1E8A4C] shadow-md shadow-emerald-500/15 mb-3">
            <User className="w-10 h-10" />
          </div>
          
          <h2 className="heading-underline !mb-2">เข้าสู่ระบบ</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            ยินดีต้อนรับเข้าสู่ระบบ STRONG CARE
          </p>
        </div>

        {/* Inputs Stack */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="bg-white rounded-2xl border border-emerald-200 p-3 sm:p-3.5 flex items-center gap-3 shadow-sm focus-within:border-[#1E8A4C] focus-within:ring-2 focus-within:ring-emerald-200 transition">
            <User className="w-5 h-5 text-[#1E8A4C] flex-shrink-0" />
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้งาน หรือ เบอร์โทร"
              className="w-full bg-transparent text-sm font-medium text-[#0B2B2B] outline-none"
              aria-label="ชื่อผู้ใช้งาน"
            />
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200 p-3 sm:p-3.5 flex items-center gap-3 shadow-sm focus-within:border-[#1E8A4C] focus-within:ring-2 focus-within:ring-emerald-200 transition">
            <Lock className="w-5 h-5 text-[#1E8A4C] flex-shrink-0" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full bg-transparent text-sm font-medium text-[#0B2B2B] outline-none"
              aria-label="รหัสผ่าน"
            />
          </div>

          {/* Quick Pre-select Patient Profiles for convenience */}
          {patients.length > 0 && (
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                หรือเลือกโปรไฟล์ที่มีในระบบ:
              </label>
              <select
                onChange={(e) => {
                  const p = patients.find((x) => x.id === Number(e.target.value));
                  if (p) setUserName(p.name);
                }}
                className="w-full text-xs p-2 rounded-xl border border-emerald-100 bg-white/90 text-slate-700 outline-none"
              >
                <option value="">-- เลือกรายชื่อผู้ป่วย --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patient_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Face Login Fast-Action */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onOpenFaceLogin}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#1E8A4C] hover:text-[#156C3B] p-1.5 transition"
            >
              <Camera className="w-4 h-4 text-[#1E8A4C]" />
              <span>หรือ สแกนใบหน้าเข้าสู่ระบบ (Face Login)</span>
            </button>
          </div>

          {/* Buttons: Primary "เข้าสู่ระบบ", ~16px gap, Secondary "สมัครสมาชิก" */}
          <div className="flex flex-col gap-4 pt-3">
            <button
              type="submit"
              className="btn-primary-capsule !w-full"
              id="btnLoginSubmit"
            >
              <LogIn className="w-5 h-5" />
              <span>เข้าสู่ระบบ</span>
            </button>

            <button
              type="button"
              onClick={onRegister}
              className="btn-secondary-capsule !w-full"
              id="btnRegister"
            >
              <UserPlus className="w-5 h-5" />
              <span>สมัครสมาชิก</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
