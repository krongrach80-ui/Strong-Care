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
  ScanFace
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
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-[#F8FAFC] select-none overflow-hidden animate-fadeIn">
      {/* Background Soft Glows */}
      <div className="ambient-matcha-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
      <div className="ambient-purple-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />

      {/* Center Animated "เริ่มต้น" (Start) Button for User -> Forces Face Scan */}
      <div className="relative flex items-center justify-center z-10">
        {/* Concentric Expanding Ripple Waves */}
        <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full border-2 border-emerald-400/40 bg-emerald-500/10 animate-ripple-1 pointer-events-none" />
        <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full border-2 border-emerald-400/30 bg-emerald-500/5 animate-ripple-2 pointer-events-none" />

        {/* Glowing Backdrop Aura */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/35 blur-2xl scale-125 pointer-events-none" />

        {/* Main Interactive Animated Button */}
        <button
          onClick={handleUserStart}
          title="กดเพื่อสแกนใบหน้าลงเวลาทันที"
          className="relative group px-12 sm:px-16 py-5 sm:py-6 rounded-full bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] hover:from-[#059669] hover:to-[#047857] text-white font-black text-2xl sm:text-3xl tracking-wide shadow-[0_20px_50px_-10px_rgba(16,185,129,0.55),0_0_0_1px_rgba(255,255,255,0.3)_inset] transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer overflow-hidden animate-float-pulse flex items-center gap-4 z-20"
        >
          {/* Shimmer Light Reflection Sweep */}
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />

          <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-200 animate-pulse" />
          <span>เริ่มต้น</span>
          <ArrowRight className="w-7 h-7 sm:w-9 sm:h-9 group-hover:translate-x-2 transition-transform duration-200" />
        </button>
      </div>

      {/* Admin Button at Bottom-Right Corner (มุมขวาล่าง) */}
      <button
        onClick={() => setShowAdminModal(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200/90 shadow-lg shadow-slate-200/60 backdrop-blur-md text-xs sm:text-sm font-bold transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
      >
        <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
          <Shield className="w-4 h-4" />
        </div>
        <span>ผู้ดูแลระบบ (Admin)</span>
      </button>

      {/* Admin Modal Dialog - Login Only */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6 animate-scaleUp relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-['Outfit']">
                    เข้าสู่ระบบผู้ดูแลระบบ (Admin Login)
                  </h2>
                  <p className="text-xs text-slate-500">ลงชื่อเข้าใช้เพื่อจัดการและควบคุมระบบ AI</p>
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
                    <User className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password):
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>เข้าสู่ระบบ Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminLogin()}
                  className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200/60"
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