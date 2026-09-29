import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Shield, 
  UserPlus, 
  Lock, 
  User, 
  X, 
  Camera, 
  CheckCircle2,
  ScanFace,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSpeech } from '../hooks/useSpeech';

interface LoginProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onGoToRegister }) => {
  const { login, voiceGuide } = useAuth();
  const { speak } = useSpeech();

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // User "เริ่มต้น" -> Forces Face Scanning Mode directly
  const handleUserStart = () => {
    login('user', 'USER', 'ผู้ใช้งานทั่วไป (User)');
    if (voiceGuide) {
      speak('เข้าสู่ระบบสแกนใบหน้าอัตโนมัติ กรุณามองตรงมาที่กล้องนะคะ');
    }
    onSuccess();
  };

  // Admin Login Handler
  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    login(adminUsername || 'admin', 'ADMIN', 'ผู้ดูแลระบบ (Admin)');
    if (voiceGuide) {
      speak('เข้าสู่ระบบผู้ดูแลระบบเรียบร้อยแล้วค่ะ');
    }
    setShowAdminModal(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-between bg-[#F4F7FB] select-none overflow-hidden animate-fadeIn p-6">
      {/* Background Soft Ambient Glows */}
      <div className="ambient-matcha-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
      <div className="ambient-purple-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 pointer-events-none" />

      {/* Top Ramathibodi & Mahidol Identity Bar */}
      <div className="z-10 text-center pt-4 sm:pt-8 space-y-1">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#B2EBE6] shadow-xs">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#008783] to-[#00A39E] text-white flex items-center justify-center text-[10px] font-black font-serif border border-teal-200 shadow-xs">
            MU
          </div>
          <span className="font-black text-[#0F3D3E] text-xs">คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</span>
          <span className="text-[#00A39E] font-bold">•</span>
          <span className="text-slate-500 text-xs font-semibold">Ramathibodi Hospital</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#0F3D3E] tracking-tight font-['Outfit'] pt-1">
          ระบบกายภาพบำบัดอัจฉริยะ AI (StrongCare Smart Platform)
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          ระบบระบุตัวตนชีวมิติ e-KYC และเวชศาสตร์ฟื้นฟูกายภาพบำบัดเฉพาะบุคคล
        </p>
      </div>

      {/* Center Animated "เริ่มต้น" (Start) Button for User -> Forces Face Scan */}
      <div className="relative flex items-center justify-center z-10 my-auto">
        {/* Concentric Expanding Ripple Waves in Ramathibodi Teal */}
        <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full border-2 border-teal-300/40 bg-teal-400/5 animate-ripple-1 pointer-events-none" />
        <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full border-2 border-teal-200/30 bg-teal-500/5 animate-ripple-2 pointer-events-none" />

        {/* Glowing Backdrop Aura */}
        <div className="absolute inset-0 rounded-full bg-teal-600/15 blur-3xl scale-125 pointer-events-none" />

        {/* Main Interactive Animated Button in Ramathibodi Teal */}
        <button
          onClick={handleUserStart}
          title="กดเพื่อสแกนใบหน้าเข้าสู่ระบบทันที"
          className="relative group px-12 sm:px-16 py-6 sm:py-7 rounded-full bg-gradient-to-r from-[#008783] via-[#00A39E] to-[#00B4AE] hover:from-[#00706c] hover:to-[#008783] text-white font-black text-2xl sm:text-3xl tracking-wide shadow-[0_20px_50px_-10px_rgba(0,163,158,0.45)] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer overflow-hidden animate-float-pulse flex items-center gap-4 z-20 border-2 border-teal-200"
        >
          {/* Shimmer Light Reflection Sweep */}
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />

          <Stethoscope className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-pulse" />
          <div className="text-left">
            <span className="block leading-none">เริ่มต้นใช้งาน</span>
            <span className="block text-[11px] font-bold text-teal-100 tracking-wider uppercase mt-1">
              สแกนใบหน้าอัตโนมัติ AI
            </span>
          </div>
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:translate-x-2 transition-transform duration-200" />
        </button>
      </div>

      {/* Bottom Information & Admin Access */}
      <div className="z-10 w-full max-w-5xl flex items-center justify-between pb-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping" />
          <span className="font-semibold text-slate-600">ระบบพร้อมให้บริการ (Ramathibodi AI Engine Ready)</span>
        </div>

        {/* Admin Button at Bottom-Right Corner */}
        <button
          onClick={() => setShowAdminModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-slate-700 hover:text-[#008783] border border-slate-200/90 hover:border-[#00A39E] shadow-sm backdrop-blur-md text-xs sm:text-sm font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-xl bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6] flex items-center justify-center group-hover:bg-[#00A39E] group-hover:text-white transition-colors shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span>ผู้ดูแลระบบ (Admin)</span>
        </button>
      </div>

      {/* Admin Modal Dialog */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6 animate-scaleUp relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#008783] to-[#00A39E] text-white flex items-center justify-center border border-teal-200 shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#0F3D3E] font-['Outfit']">
                    เข้าสู่ระบบเจ้าหน้าที่ (Admin Login)
                  </h2>
                  <p className="text-xs text-slate-500">โรงพยาบาลรามาธิบดี • มหาวิทยาลัยมหิดล</p>
                </div>
              </div>

              <button
                onClick={() => setShowAdminModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4 animate-fadeIn">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้ดูแลระบบ (Username):
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#008783] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#00A39E] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password):
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#008783] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#00A39E]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#00A39E] hover:bg-[#008783] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-600"
                >
                  <span>เข้าสู่ระบบ Admin</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminLogin()}
                  className="w-full py-2.5 rounded-xl bg-[#E6F7F7] hover:bg-teal-100 text-[#008783] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#B2EBE6]"
                >
                  <span>⚡ เข้าสู่ระบบ Admin ทันที (1-Click)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};