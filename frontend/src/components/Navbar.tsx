import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  User,
  Shield,
  Camera,
  Cpu,
  LayoutDashboard,
  Settings as SettingsIcon,
  FileText,
  Trophy,
  Lock,
  MoreHorizontal,
  Menu,
  X,
  History,
  Users,
  Home,
  ChevronRight
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSeniorStore } from '../store/seniorStore';
import { VoiceAssistantWidget } from './VoiceAssistant/VoiceAssistantWidget';
import { OfflineIndicator } from './Offline/OfflineIndicator';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenPrivacy?: () => void;
  onOpenPrivacyCenter?: () => void;
  onOpenArchitecture?: () => void;
  onOpenCompetitionDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenPrivacy,
  onOpenPrivacyCenter,
  onOpenArchitecture,
  onOpenCompetitionDemo,
}) => {
  const { patients, selectedPatient, selectPatient, openFaceAuth } = usePatientStore();
  const { isSeniorMode, toggleSeniorMode } = useSeniorStore();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Full Primary Navigation Tabs (Desktop >= 1280px)
  const fullNavTabs = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'patients', label: 'ผู้ป่วย', icon: Users },
    { id: 'exercises', label: 'กายภาพ', icon: Activity },
    { id: 'history', label: 'ประวัติ', icon: History },
    { id: 'reports', label: 'รายงาน', icon: FileText },
  ];

  // Condensed Primary Tabs for Tablet (768px - 1279px)
  const tabletNavTabs = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'patients', label: 'ผู้ป่วย', icon: Users },
    { id: 'exercises', label: 'กายภาพ', icon: Activity },
  ];

  // Close More dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on ESC or route change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-emerald-100 shadow-sm w-full">
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* ========================================================================= */}
        {/* BRAND LOGO (Always visible on all viewports: 320px - 3840px) */}
        {/* ========================================================================= */}
        <div
          onClick={() => {
            setCurrentTab('home');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                Strong Care
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0">
                v1.0
              </span>
            </div>
            <p className="text-[9px] text-slate-500 hidden 2xl:block font-medium truncate max-w-[190px]">
              AI-assisted Rehabilitation
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP NAVIGATION (>= 1280px / xl) — Full 6 Tabs */}
        {/* ========================================================================= */}
        <nav className="hidden xl:flex items-center gap-1 flex-1 min-w-0 pl-3">
          {fullNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id || (tab.id === 'exercises' && currentTab === 'training');
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-sm'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ========================================================================= */}
        {/* TABLET NAVIGATION (768px - 1279px / md to lg) — 3 Core Tabs */}
        {/* ========================================================================= */}
        <nav className="hidden md:flex xl:hidden items-center gap-1 flex-1 min-w-0 pl-2">
          {tabletNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id || (tab.id === 'exercises' && currentTab === 'training');
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-sm'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ========================================================================= */}
        {/* ACTION AREA (Right Side) — Responsive tiering */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Online/Offline Status Indicator (Visible on Tablet & Desktop >= 768px) */}
          <div className="hidden md:block flex-shrink-0">
            <OfflineIndicator />
          </div>

          {/* Winning Competition Demo Mode Trigger (Visible on Tablet & Desktop >= 768px) */}
          {onOpenCompetitionDemo && (
            <button
              onClick={onOpenCompetitionDemo}
              title="🏆 COMPETITION DEMO — สาธิต 3-5 นาทีแบบครบวงจรสำหรับคณะกรรมการ"
              className="hidden md:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95 flex-shrink-0 whitespace-nowrap min-h-[36px]"
            >
              <Trophy className="w-3.5 h-3.5 fill-white flex-shrink-0" />
              <span>DEMO</span>
            </button>
          )}

          {/* Voice Assistant Mini Indicator (Visible on 2XL >= 1536px) */}
          <div className="hidden 2xl:block flex-shrink-0">
            <VoiceAssistantWidget />
          </div>

          {/* Face Login Trigger (Visible on Desktop >= 1280px) */}
          <button
            onClick={() => openFaceAuth('login')}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex-shrink-0 whitespace-nowrap min-h-[36px]"
            title="สแกนใบหน้าเข้าใช้งานสำหรับผู้สูงอายุ (128-D Biometric)"
          >
            <Camera className="w-3.5 h-3.5 flex-shrink-0" />
            <span>สแกนใบหน้า</span>
          </button>

          {/* ⋯ More Menu Dropdown (Visible on Desktop >= 1280px) */}
          <div className="relative hidden xl:block flex-shrink-0" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm active:scale-95 flex-shrink-0 whitespace-nowrap min-h-[36px] ${
                isMoreOpen
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-900'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="เมนูเพิ่มเติม (สถาปัตยกรรม, Privacy, โหมดผู้สูงอายุ, ตั้งค่า)"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <span>More</span>
            </button>

            {/* Dropdown Popover (Guaranteed to stay within viewport with right-0 and max-w) */}
            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs font-medium space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  ระบบและสถาปัตยกรรม
                </div>

                {onOpenArchitecture && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenArchitecture();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left"
                  >
                    <Cpu className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">สถาปัตยกรรม AI & Pipeline</div>
                      <div className="text-[10px] text-slate-400">Fail-Safe Matrix 10/10 & Models</div>
                    </div>
                  </button>
                )}

                {onOpenPrivacyCenter ? (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenPrivacyCenter();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left"
                  >
                    <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Privacy Center</div>
                      <div className="text-[10px] text-slate-400">คุ้มครองข้อมูลชีวมิติแบบ Edge AI</div>
                    </div>
                  </button>
                ) : onOpenPrivacy ? (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenPrivacy();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left"
                  >
                    <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>นโยบายความเป็นส่วนตัว</span>
                  </button>
                ) : null}

                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-t border-slate-100 mt-1">
                  การตั้งค่าและการใช้งาน
                </div>

                {/* Senior Mode Toggle */}
                <button
                  onClick={() => {
                    toggleSeniorMode();
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🧓</span>
                    <div>
                      <div className="font-bold text-slate-900">โหมดผู้สูงอายุ (Senior Mode)</div>
                      <div className="text-[10px] text-slate-400">ตัวอักษรใหญ่ คอนทราสต์สูง</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isSeniorMode ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isSeniorMode ? 'เปิด' : 'ปิด'}
                  </span>
                </button>

                {/* Patient Quick Selector */}
                <div className="px-3 py-2 bg-slate-50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-bold">ผู้ป่วยที่เลือก:</span>
                    <User className="w-3 h-3 text-emerald-600" />
                  </div>
                  <select
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      const p = patients.find((pat) => pat.id === Number(e.target.value));
                      if (p) selectPatient(p);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-semibold cursor-pointer outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patient_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Settings Tab Route */}
                <button
                  onClick={() => {
                    setCurrentTab('settings');
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left border-t border-slate-100 mt-1"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="font-bold">การตั้งค่าระบบ (Settings)</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* HAMBURGER BUTTON (Visible on Mobile & Tablet < 1280px) */}
          {/* ========================================================================= */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex-shrink-0 min-w-[44px] min-h-[44px]"
            title="เปิดเมนูนำทาง"
            aria-label="เปิดเมนูนำทาง"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE & TABLET COLLAPSIBLE DRAWER (< 1280px) */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-slate-200 p-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 text-xs max-h-[85vh] overflow-y-auto safe-area-bottom">
          
          {/* Top Quick Status Strip in Drawer */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <OfflineIndicator />
            {onOpenCompetitionDemo && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCompetitionDemo();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-bold text-xs shadow-sm"
              >
                <Trophy className="w-3.5 h-3.5 fill-white" />
                <span>DEMO 3-5 นาที</span>
              </button>
            )}
          </div>

          {/* Primary Navigation Grid */}
          <div className="space-y-1">
            <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              เมนูหลัก (Navigation)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {fullNavTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition text-left min-h-[44px] ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border border-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions in Mobile Drawer */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              การเข้าใช้งานและระบบ
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openFaceAuth('login');
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600 text-white font-bold min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>สแกนใบหน้าเข้าใช้งาน</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-80" />
              </button>

              <button
                onClick={() => {
                  toggleSeniorMode();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <span>🧓</span>
                  <span>โหมดผู้สูงอายุ</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  isSeniorMode ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isSeniorMode ? 'เปิด' : 'ปิด'}
                </span>
              </button>
            </div>
          </div>

          {/* Architecture & Privacy Links */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            {onOpenArchitecture && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenArchitecture();
                }}
                className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>AI Pipeline</span>
              </button>
            )}

            {onOpenPrivacyCenter && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenPrivacyCenter();
                }}
                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Privacy Center</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
