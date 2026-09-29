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
  ShieldCheck,
  ArrowLeftRight,
  BarChart3,
  Check,
  Smartphone,
  HeartPulse,
  Stethoscope
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
    { id: 'moti-physio', label: '🧍 Moti Physio สแกน 3D', icon: Activity, highlight: true },
    { id: 'mobile-pt', label: '📱 One-Stop บนมือถือ', icon: Smartphone, highlight: true },
    { id: 'pt-kiosk', label: '🏥 ตู้เครื่องกายภาพ', icon: HeartPulse, highlight: true },
    { id: 'dashboard', label: 'หน้าหลัก AI', icon: LayoutDashboard },
    { id: 'live', label: 'สแกนใบหน้าสด', icon: Video },
    { id: 'register', label: 'ลงทะเบียนสมาชิก', icon: UserPlus },
    { id: 'people', label: 'สมาชิกในระบบ', icon: Users },
    { id: 'attendance', label: 'บันทึกเวลา', icon: ClipboardList },
    { id: 'settings', label: 'ตั้งค่า AI', icon: Sliders },
  ];

  const seniorNavItems = [
    { id: 'moti-physio', label: '🧍 Moti Physio สแกน 3D', icon: Activity, highlight: true },
    { id: 'mobile-pt', label: '📱 One-Stop บนมือถือ', icon: Smartphone, highlight: true },
    { id: 'pt-kiosk', label: '🏥 ตู้เครื่องกายภาพ', icon: HeartPulse, highlight: true },
    { id: 'kiosk', label: 'โหมดสแกนสมาชิกทั่วไป', icon: Smile },
    { id: 'dashboard', label: 'หน้าหลัก AI', icon: LayoutDashboard },
    { id: 'attendance', label: 'ดูประวัติของฉัน', icon: ClipboardList },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : seniorNavItems;

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200/90 px-4 md:px-8 py-3 backdrop-blur-md shadow-[0_2px_10px_0_rgba(0,163,158,0.06)]">
      <div className="max-w-[1760px] mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand (Ramathibodi Hospital / Mahidol University / Strong Care) */}
        <div 
          className="flex items-center gap-3 cursor-pointer shrink-0" 
          onClick={() => setCurrentTab('dashboard')}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#008783] to-[#00A39E] flex items-center justify-center shadow-md shadow-teal-900/15 text-white border-2 border-teal-200">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-[#0F3D3E] font-['Outfit']">
                Strong<span className="text-[#00A39E]">Care</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#008783] border border-[#B2EBE6] font-mono flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A39E]" />
                <span>รพ.รามาธิบดี • ม.มหิดล</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono hidden sm:inline">
                {role === 'ADMIN' ? 'Admin' : 'Senior User'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</p>
          </div>
        </div>

        {/* Navigation tabs (Ramathibodi Medical Teal & Mint Aesthetic) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 overflow-x-auto scrollbar-none max-w-[60vw]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#00A39E] text-white shadow-md font-black scale-[1.02]'
                    : 'text-slate-600 hover:text-[#008783] hover:bg-white/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side Quick Controls & Rama Teal Button */}
        <div className="flex items-center gap-2">
          {/* Large Font Size Accessibility Toggle */}
          <button
            onClick={toggleLargeFont}
            title="ปรับขนาดตัวอักษรให้อ่านง่ายสำหรับผู้สูงอายุ"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              largeFont
                ? 'bg-[#E6F7F7] text-[#008783] border-[#B2EBE6] font-extrabold shadow-sm'
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
                ? 'bg-[#E6F7F7] text-[#008783] border-[#B2EBE6] shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {voiceGuide ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#008783] animate-pulse" />
                <span className="hidden sm:inline">เสียง: เปิด</span>
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00A39E] to-[#008783] hover:from-[#008783] hover:to-[#00706c] text-white font-bold text-xs shadow-md shadow-teal-700/20 border border-teal-600 transition-all transform hover:scale-[1.02] cursor-pointer"
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