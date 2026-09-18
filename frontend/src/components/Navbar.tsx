import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  UserPlus, 
  Users, 
  ClipboardList, 
  Sliders, 
  Activity,
  Volume2,
  VolumeX,
  Type,
  LogOut,
  Smile,
  Shield,
  ArrowLeftRight,
  BarChart3,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  wsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, wsConnected }) => {
  const { 
    user, 
    role, 
    largeFont, 
    voiceGuide, 
    toggleLargeFont, 
    toggleVoiceGuide, 
    switchRole, 
    logout 
  } = useAuth();

  const adminNavItems = [
    { id: 'dashboard', label: 'หน้าหลัก AI', icon: LayoutDashboard },
    { id: 'live', label: 'สแกนใบหน้าสด', icon: Video, highlight: true },
    { id: 'register', label: 'ลงทะเบียนสมาชิก', icon: UserPlus },
    { id: 'people', label: 'สมาชิกในระบบ', icon: Users },
    { id: 'attendance', label: 'บันทึกเวลา', icon: ClipboardList },
    { id: 'settings', label: 'ตั้งค่า AI', icon: Sliders },
  ];

  const seniorNavItems = [
    { id: 'kiosk', label: 'โหมดสแกนสมาชิกทั่วไป', icon: Smile, highlight: true },
    { id: 'dashboard', label: 'หน้าหลัก AI', icon: LayoutDashboard },
    { id: 'attendance', label: 'ดูประวัติของฉัน', icon: ClipboardList },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : seniorNavItems;

  return (
    <header className="sticky top-0 z-50 bg-white/90 border-b border-slate-200/80 px-4 md:px-8 py-3.5 backdrop-blur-md shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand (FaceVoice AI) */}
        <div 
          className="flex items-center gap-3 cursor-pointer shrink-0" 
          onClick={() => setCurrentTab('dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
                FaceVoice <span className="text-blue-600">AI</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{role === 'ADMIN' ? 'Admin' : 'Senior User'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Face Recognition & Voice Platform</p>
          </div>
        </div>

        {/* Navigation tabs (Clean Modern SaaS links) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side Quick Controls & Bright Green Button (Matching DataPulse Top Right) */}
        <div className="flex items-center gap-2.5">
          {/* Large Font Size Accessibility Toggle */}
          <button
            onClick={toggleLargeFont}
            title="ปรับขนาดตัวอักษรให้อ่านง่ายสำหรับผู้สูงอายุ"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              largeFont
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-extrabold shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>A+ ใหญ่</span>
          </button>

          {/* Voice Guide Toggle */}
          <button
            onClick={toggleVoiceGuide}
            title="เปิด/ปิด เสียง AI พูดแนะนำ"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              voiceGuide
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {voiceGuide ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden sm:inline">เสียงแนะนำ: เปิด</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">เสียง: ปิด</span>
              </>
            )}
          </button>


          {/* Top Right Live Face Recognition CTA Button */}
          <button
            onClick={() => setCurrentTab('live')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">สแกนใบหน้าสด</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="ออกจากระบบ"
            className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};