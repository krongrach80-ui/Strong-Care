import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  User,
  Stethoscope,
  FolderKanban,
  Dumbbell,
  FileSpreadsheet,
  History,
  Monitor,
  Sliders,
  LogOut,
  Search,
  Plus,
  Pencil,
  KeyRound,
  Shield,
  Ban,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  Play,
  Activity,
  Send,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Phone,
  FileText,
  HeartPulse,
  X,
  Check,
} from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { UserAccount, UserRole, TreatmentPlan, PrescribedExercise } from '../../types/hospital';
import { ReceptionOnboardingModal } from '../../components/Reception/ReceptionOnboardingModal';

interface HospitalPortalProps {
  onClose: () => void;
  onLaunchKioskExercise?: (exerciseId?: number) => void;
  onSelectPatientForKiosk?: (patientData: any) => void;
}

export const HospitalPortal: React.FC<HospitalPortalProps> = ({
  onClose,
  onLaunchKioskExercise,
  onSelectPatientForKiosk,
}) => {
  const {
    currentRole,
    setCurrentRole,
    currentUserId,
    setCurrentUserId,
    users,
    therapists,
    treatmentPlans,
    activityLogs,
    symptomReports,
    aiSettings,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    changeUserRole,
    assignTherapist,
    addTherapist,
    updateTherapist,
    saveTreatmentPlan,
    reportSymptom,
    reviewSymptom,
    updateAiSettings,
  } = useHospitalStore();

  // Active Sidebar Tab
  // 1=Overview, 2=Users (Reference mockup), 3=Patients, 4=Therapists, 5=Cases/Plans,
  // 6=Poses/Programs, 7=Results/Reports, 8=Logs, 9=Devices, 10=AI Settings
  const [activeTab, setActiveTab] = useState<number>(2);

  // Tab 2 (Users) state matching mockup
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'patient' | 'therapist'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Modals inside Hospital Portal
  const [isReceptionOpen, setIsReceptionOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [assigningPatient, setAssigningPatient] = useState<UserAccount | null>(null);
  const [resettingPinUser, setResettingPinUser] = useState<UserAccount | null>(null);
  const [generatedNewPin, setGeneratedNewPin] = useState<string | null>(null);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [isReportSymptomOpen, setIsReportSymptomOpen] = useState<boolean>(false);
  const [reviewingReportId, setReviewingReportId] = useState<number | null>(null);
  const [therapistReplyText, setTherapistReplyText] = useState<string>('');

  // Toast notification inside portal
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Filtered users for Tab 2
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchQuery =
        !userSearch.trim() ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.code.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.assignedTherapistName && u.assignedTherapistName.toLowerCase().includes(userSearch.toLowerCase()));
      return matchRole && matchQuery;
    });
  }, [users, userRoleFilter, userSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Counts for Metric Cards
  const totalUsersCount = users.length;
  const totalPatientsCount = users.filter((u) => u.role === 'patient').length;
  const totalTherapistsCount = users.filter((u) => u.role === 'therapist').length;
  const totalSuspendedCount = users.filter((u) => u.status === 'suspended').length;

  // Current active user info
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  // Staff Authentication Barrier
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);
  const [staffPinInput, setStaffPinInput] = useState<string>('');
  const [staffAuthError, setStaffAuthError] = useState<string | null>(null);

  const handleStaffLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!staffPinInput.trim()) {
      setStaffAuthError('กรุณากรอกรหัส PIN ประจำตัวเจ้าหน้าที่ (หรือใช้ 1234)');
      return;
    }
    if (staffPinInput === '1234' || staffPinInput === '0000' || staffPinInput.length >= 4) {
      setIsStaffAuthenticated(true);
      setStaffAuthError(null);
      showToast('ยืนยันตัวตนบุคลากรสำเร็จ ยินดีต้อนรับสู่ระบบบริหารโรงพยาบาล');
    } else {
      setStaffAuthError('รหัส PIN ไม่ถูกต้อง (สำหรับโหมดสาธิตให้ใช้ 1234)');
    }
  };

  const handleQuickDemoPass = () => {
    setIsStaffAuthenticated(true);
    setStaffAuthError(null);
    showToast('เข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ (โหมดสาธิตการแข่งขัน)');
  };

  // If not authenticated, render Staff Security Barrier
  if (!isStaffAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2B2B]/90 backdrop-blur-md p-4 animate-fadeIn">
        <div className="bg-white rounded-[32px] border-2 border-emerald-400 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-[#10B981] mx-auto flex items-center justify-center text-[#0F2F2B] shadow-md">
            <Shield className="w-8 h-8 text-[#10B981]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold mb-2">
              <span>โหมดสาธิตระบบโรงพยาบาล (Hospital Demo)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F2F2B]">
              ระบบบุคลากร & โรงพยาบาล
            </h2>
            <p className="text-xs text-stone-600 font-medium mt-1">
              เฉพาะแพทย์ นักกายภาพบำบัด และผู้บริหารโรงพยาบาลเท่านั้น
            </p>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                รหัส PIN บุคลากรทางการแพทย์ (Staff PIN):
              </label>
              <div className="bg-stone-50 rounded-2xl border border-emerald-200 p-3 flex items-center gap-2.5 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-emerald-200 transition">
                <KeyRound className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <input
                  type="password"
                  value={staffPinInput}
                  onChange={(e) => {
                    setStaffPinInput(e.target.value);
                    setStaffAuthError(null);
                  }}
                  placeholder="กรอกรหัส PIN (เช่น 1234)"
                  maxLength={6}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  autoFocus
                />
              </div>
              {staffAuthError && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{staffAuthError}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold text-sm shadow-md hover:brightness-105 transition active:scale-95 cursor-pointer"
              >
                ยืนยันเข้าสู่ระบบบุคลากร
              </button>

              <button
                type="button"
                onClick={handleQuickDemoPass}
                className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#0F2F2B] font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>⚡ ปลดล็อกโหมดสาธิตทันที (Demo PIN: 1234)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs transition cursor-pointer"
              >
                ย้อนกลับไปหน้าตู้คนไข้
              </button>
            </div>
          </form>

          <div className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-center leading-relaxed">
            💡 ในระบบงานจริงจะเชื่อมต่อ SSO/LDAP ของโรงพยาบาล ข้อมูลทั้งหมดในหน้านี้เป็นข้อมูลจำลองเพื่อการสาธิต (Offline Mock DB)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-[#F4FBF7] text-[#0F2F2B] font-sans overflow-hidden animate-fadeIn">
      {/* ==================================================================== */}
      {/* 1. LEFT SIDEBAR (Dark Green: #0F2F2B)                                 */}
      {/* ==================================================================== */}
      <aside className="w-64 sm:w-72 bg-[#0F2F2B] text-white flex flex-col justify-between p-4 sm:p-5 flex-shrink-0 select-none shadow-2xl">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-[#4AE387] flex items-center justify-center shadow-lg">
              <HeartPulse className="w-6 h-6 text-[#4AE387]" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight leading-tight text-white">
                ระบบกายภาพบำบัด
              </div>
              <div className="text-[11px] text-emerald-300/80 font-medium mt-0.5">
                {currentRole === 'admin'
                  ? 'ผู้อำนวยการ / Admin'
                  : currentRole === 'therapist'
                  ? 'นักกายภาพบำบัด (PT Portal)'
                  : 'คนไข้ (Patient Portal)'}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="เมนูระบบบริหารจัดการ">
            {[
              { id: 1, label: 'ภาพรวมระบบ', icon: LayoutDashboard },
              { id: 2, label: 'จัดการผู้ใช้งาน', icon: Users },
              { id: 3, label: 'ข้อมูลคนไข้', icon: User },
              { id: 4, label: 'ข้อมูลนักกายภาพ', icon: Stethoscope },
              { id: 5, label: 'เคสและแผนการรักษา', icon: FolderKanban },
              { id: 6, label: 'ท่าและโปรแกรม', icon: Dumbbell },
              { id: 7, label: 'ผลและรายงาน', icon: FileSpreadsheet },
              { id: 8, label: 'ประวัติการใช้งาน', icon: History },
              { id: 9, label: 'อุปกรณ์', icon: Monitor },
              { id: 10, label: 'ตั้งค่าระบบและ AI', icon: Sliders },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all text-left ${
                    isActive
                      ? 'bg-[#10B981] text-[#0F2F2B] font-extrabold shadow-md shadow-emerald-500/30'
                      : 'text-emerald-100/75 hover:bg-emerald-950/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0F2F2B]' : 'text-emerald-300'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Button matching reference */}
        <div className="pt-4 border-t border-emerald-900/60">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-emerald-700/50 text-emerald-200/90 text-xs sm:text-sm font-semibold hover:bg-emerald-900/50 hover:text-white transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 2. MAIN CONTENT AREA                                                 */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4FBF7]">
        {/* Top Header Bar */}
        <header className="h-20 px-6 sm:px-8 border-b border-emerald-100 bg-white/70 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          {/* Title with decorative green underline bar */}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F2F2B] tracking-tight">
              {activeTab === 1 && 'ภาพรวมระบบโรงพยาบาล'}
              {activeTab === 2 && 'จัดการผู้ใช้งาน'}
              {activeTab === 3 && 'ข้อมูลคนไข้ทั้งหมด'}
              {activeTab === 4 && 'ข้อมูลนักกายภาพบำบัด'}
              {activeTab === 5 && 'เคสและแผนการรักษา (Prescriptions)'}
              {activeTab === 6 && 'คลังท่าและโปรแกรมกายภาพบำบัด'}
              {activeTab === 7 && 'ผลการรักษา & AI วิเคราะห์การเคลื่อนไหว'}
              {activeTab === 8 && 'ประวัติการใช้งานระบบ (Activity Audit Log)'}
              {activeTab === 9 && 'สถานะอุปกรณ์ตู้กายภาพบำบัด (Smart Mirror Kiosks)'}
              {activeTab === 10 && 'ตั้งค่าระบบและการทำงานของ AI'}
            </h1>
            <div className="w-20 sm:w-28 h-1 rounded-full bg-[#10B981] mt-1" />
          </div>

          {/* Right Header: Role switcher + Quick Action button */}
          <div className="flex items-center gap-3">
            {/* Demo Watermark Badge */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>โหมดสาธิต (Simulated HIS & RBAC)</span>
            </div>

            {/* Quick Reception Onboarding button */}
            <button
              onClick={() => setIsReceptionOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:opacity-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ ต้อนรับ & สแกนหน้าคนไข้</span>
            </button>

            {/* Role Switcher Pill Capsule */}
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-800 pl-2 hidden sm:inline">สลับสิทธิ์ทดสอบ:</span>
              {(['admin', 'therapist', 'patient'] as UserRole[]).map((r) => {
                const isSelected = currentRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setCurrentRole(r);
                      if (r === 'admin') setCurrentUserId(1);
                      if (r === 'therapist') setCurrentUserId(2);
                      if (r === 'patient') setCurrentUserId(12);
                      showToast(
                        `สลับเข้าสู่โหมด: ${
                          r === 'admin' ? 'ผู้อำนวยการ รพ.' : r === 'therapist' ? 'นักกายภาพบำบัด' : 'คนไข้'
                        }`
                      );
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
                      isSelected
                        ? 'bg-[#10B981] text-white shadow-sm'
                        : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-100/50'
                    }`}
                  >
                    {r === 'admin' ? 'ผอรพ / Admin' : r === 'therapist' ? 'นักกายภาพ' : 'คนไข้'}
                  </button>
                );
              })}
            </div>

            {/* Profile Avatar Capsule matching reference */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-emerald-200">
              <div className="w-9 h-9 rounded-full bg-[#10B981] text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                {currentRole === 'admin' ? 'ผ' : currentRole === 'therapist' ? 'ธ' : 'ส'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-[#0F2F2B] leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{currentUser.code}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Toast inside portal */}
        {toast && (
          <div className="mx-8 mt-3 p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* ================================================================== */}
          {/* TAB 1: SYSTEM OVERVIEW                                             */}
          {/* ================================================================== */}
          {activeTab === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Executive stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-[#0F2F2B]">142 ครั้ง</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">เซสชันกายภาพวันนี้</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-emerald-600">94.2%</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">ความสม่ำเสมอของคนไข้ (Adherence)</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-[#0F2F2B]">+14.8°</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">องศาข้อต่อเฉลี่ยดีขึ้น (ROM Delta)</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-emerald-700">0 เหตุการณ์</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">เหตุการณ์ด้านความปลอดภัย (Safety)</div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Active Conditions and Quick Cases */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-[#0F2F2B]">สัดส่วนกลุ่มอาการคนไข้ที่รับการฟื้นฟู</h3>
                  <div className="space-y-3 text-xs font-semibold">
                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>ข้อไหล่ติด / อาการปวดไหล่ (Frozen Shoulder)</span>
                        <span className="font-bold text-emerald-700">42%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#10B981] rounded-full" style={{ width: '42%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>ข้อเข่าเสื่อม / ปัญหาเข่า (Knee OA)</span>
                        <span className="font-bold text-emerald-700">35%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#10B981] rounded-full" style={{ width: '35%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>โรคหลอดเลือดสมองระยะฟื้นตัว (Stroke Rehab)</span>
                        <span className="font-bold text-emerald-700">15%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#10B981] rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>ออฟฟิศซินโดรม / คอบ่า (Office Syndrome)</span>
                        <span className="font-bold text-emerald-700">8%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#10B981] rounded-full" style={{ width: '8%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#0F2F2B]">รายงานอาการจากคนไข้ล่าสุด</h3>
                    <span className="text-xs font-bold text-emerald-700">
                      {symptomReports.filter((r) => r.status === 'pending').length} รายการรอการตอบ
                    </span>
                  </div>
                  <div className="space-y-3">
                    {symptomReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950">{report.patientName}</span>
                          <span className="text-[11px] font-mono text-slate-500">{report.reportedAt}</span>
                        </div>
                        <div className="text-slate-700">
                          อาการ: <span className="font-bold">{report.symptomType}</span> (ระดับความปวด {report.severity}/5) — {report.affectedArea}
                        </div>
                        <div className="text-slate-600 text-[11px]">{report.description}</div>
                        {report.therapistReply ? (
                          <div className="mt-1 text-emerald-800 bg-white p-2 rounded-xl border border-emerald-200">
                            <strong>คำแนะนำนักกายภาพ:</strong> {report.therapistReply}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewingReportId(report.id);
                              setTherapistReplyText('');
                            }}
                            className="mt-1 text-xs font-bold text-emerald-700 hover:underline"
                          >
                            + ให้คำแนะนำคนไข้
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 2: USER MANAGEMENT (EXACT REPLICA OF THE REFERENCE SCREENSHOT)  */}
          {/* ================================================================== */}
          {activeTab === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* 4 Metric Cards matching the uploaded screenshot */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. All Users */}
                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2F2B] leading-none">
                      {totalUsersCount}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">ผู้ใช้งานทั้งหมด</div>
                  </div>
                </div>

                {/* 2. Patients */}
                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2F2B] leading-none">
                      {totalPatientsCount}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">คนไข้</div>
                  </div>
                </div>

                {/* 3. Physical Therapists */}
                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2F2B] leading-none">
                      {totalTherapistsCount}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">นักกายภาพบำบัด</div>
                  </div>
                </div>

                {/* 4. Suspended Accounts */}
                <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                    <Ban className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2F2B] leading-none">
                      {totalSuspendedCount}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">บัญชีที่ถูกระงับ</div>
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search input with search icon */}
                <div className="w-full sm:w-80 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="ค้นหาชื่อ หรือรหัสผู้ใช้งาน"
                    className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-emerald-200/90 text-xs sm:text-sm font-semibold text-[#0F2F2B] placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                {/* Filter Pills and Add User Button */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 p-1 rounded-full bg-emerald-50 border border-emerald-200/80">
                    <button
                      onClick={() => {
                        setUserRoleFilter('all');
                        setCurrentPage(1);
                      }}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition ${
                        userRoleFilter === 'all' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => {
                        setUserRoleFilter('patient');
                        setCurrentPage(1);
                      }}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition ${
                        userRoleFilter === 'patient' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      คนไข้
                    </button>
                    <button
                      onClick={() => {
                        setUserRoleFilter('therapist');
                        setCurrentPage(1);
                      }}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition ${
                        userRoleFilter === 'therapist' ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      นักกายภาพบำบัด
                    </button>
                  </div>

                  {/* + เพิ่มผู้ใช้งาน button */}
                  <button
                    onClick={() => setIsReceptionOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#10B981] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มผู้ใช้งาน</span>
                  </button>
                </div>
              </div>

              {/* User Table matching reference */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-emerald-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">ผู้ใช้งาน</th>
                        <th className="py-4 px-6">บทบาท</th>
                        <th className="py-4 px-6">นักกายภาพผู้รับผิดชอบ</th>
                        <th className="py-4 px-6">สถานะ</th>
                        <th className="py-4 px-6 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400">
                            ไม่พบข้อมูลผู้ใช้งานที่ค้นหา
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => {
                          const initial = user.name.replace(/^(นาย|นางสาว|นาง|กภ\.|นพ\.)\s*/, '').charAt(0) || 'ผ';
                          return (
                            <tr key={user.id} className="hover:bg-emerald-50/40 transition">
                              {/* 1. ผู้ใช้งาน (Avatar, Name, Code) */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm shadow-sm ${
                                      user.role === 'patient'
                                        ? 'bg-[#10B981] text-white'
                                        : user.role === 'therapist'
                                        ? 'bg-[#0F2F2B] text-emerald-200'
                                        : 'bg-emerald-700 text-white'
                                    }`}
                                  >
                                    {initial}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#0F2F2B] leading-tight">{user.name}</div>
                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                      รหัส {user.code}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. บทบาท (Role pill) */}
                              <td className="py-4 px-6">
                                {user.role === 'patient' && (
                                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                                    คนไข้
                                  </span>
                                )}
                                {user.role === 'therapist' && (
                                  <span className="px-3 py-1 rounded-full bg-[#0F2F2B] text-white font-bold text-xs">
                                    นักกายภาพบำบัด
                                  </span>
                                )}
                                {user.role === 'admin' && (
                                  <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-bold text-xs">
                                    ผู้อำนวยการ / Admin
                                  </span>
                                )}
                              </td>

                              {/* 3. นักกายภาพผู้รับผิดชอบ */}
                              <td className="py-4 px-6">
                                <span
                                  className={`text-xs font-semibold ${
                                    user.assignedTherapistName ? 'text-[#0F2F2B]' : 'text-slate-400'
                                  }`}
                                >
                                  {user.assignedTherapistName || (user.role === 'patient' ? 'ยังไม่ได้กำหนด' : '—')}
                                </span>
                              </td>

                              {/* 4. สถานะ (Active / Suspended) */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      user.status === 'active' ? 'bg-[#10B981]' : 'bg-rose-500'
                                    }`}
                                  />
                                  <span
                                    className={`text-xs font-bold ${
                                      user.status === 'active' ? 'text-emerald-700' : 'text-rose-600'
                                    }`}
                                  >
                                    {user.status === 'active' ? 'ใช้งานอยู่' : 'ระงับบัญชี'}
                                  </span>
                                </div>
                              </td>

                              {/* 5. จัดการ (Action icons matching reference) */}
                              <td className="py-4 px-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {/* Edit button */}
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    title="แก้ไขข้อมูลผู้ใช้งาน"
                                    className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Reset Password / PIN button */}
                                  <button
                                    onClick={() => {
                                      const pin = resetUserPassword(user.id);
                                      setResettingPinUser(user);
                                      setGeneratedNewPin(pin);
                                      showToast(`รีเซ็ตรหัสผ่านของ ${user.name} สำเร็จ`);
                                    }}
                                    title="รีเซ็ตรหัสผ่าน / PIN"
                                    className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Role & Permissions / Assign PT button */}
                                  <button
                                    onClick={() => {
                                      if (user.role === 'patient') {
                                        setAssigningPatient(user);
                                      } else {
                                        const nextRole: UserRole = user.role === 'therapist' ? 'admin' : 'therapist';
                                        changeUserRole(user.id, nextRole);
                                        showToast(`เปลี่ยนสิทธิ์ ${user.name} เป็น ${nextRole}`);
                                      }
                                    }}
                                    title="กำหนดและเปลี่ยนสิทธิ์ / มอบหมายนักกายภาพ"
                                    className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition"
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Suspend / Delete button */}
                                  <button
                                    onClick={() => {
                                      toggleUserStatus(user.id);
                                      showToast(`เปลี่ยนสถานะบัญชี ${user.name}`);
                                    }}
                                    title={user.status === 'active' ? 'ระงับบัญชี' : 'ปลดระงับบัญชี'}
                                    className={`p-1.5 rounded-full border transition ${
                                      user.status === 'active'
                                        ? 'border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                        : 'border-rose-300 bg-rose-50 text-rose-600'
                                    }`}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination matching reference */}
                <div className="py-4 px-6 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <div>
                    แสดง {Math.min(filteredUsers.length, (currentPage - 1) * pageSize + 1)}-
                    {Math.min(filteredUsers.length, currentPage * pageSize)} จาก {filteredUsers.length} รายการ
                  </div>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-full font-bold flex items-center justify-center transition ${
                            isActive
                              ? 'bg-[#10B981] text-white shadow-sm'
                              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 3: PATIENT RECORDS (ข้อมูลคนไข้ทั้งหมด)                         */}
          {/* ================================================================== */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">เวชระเบียนคนไข้และประวัติการรักษา</h3>
                  <p className="text-xs text-slate-500">จัดการข้อมูลผู้ป่วย การวินิจฉัยโรค และนักกายภาพบำบัดผู้รับผิดชอบ</p>
                </div>
                <button
                  onClick={() => setIsReceptionOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-[#10B981] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ลงทะเบียนคนไข้ใหม่ & สแกนหน้า</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users
                  .filter((u) => u.role === 'patient')
                  .map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-[#10B981] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#0F2F2B]">{patient.name}</div>
                            <div className="text-[11px] font-mono text-emerald-700">{patient.code}</div>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            patient.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {patient.status === 'active' ? 'กำลังรักษา' : 'ระงับ'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/70">
                        <div>
                          <strong>การวินิจฉัย:</strong> {patient.diagnosis || 'ยังไม่มีข้อมูลระบุ'}
                        </div>
                        <div>
                          <strong>นักกายภาพผู้ดูแล:</strong>{' '}
                          <span className="text-emerald-800 font-bold">
                            {patient.assignedTherapistName || 'ยังไม่ได้กำหนด'}
                          </span>
                        </div>
                        <div>
                          <strong>โทรศัพท์:</strong> {patient.phone || '08x-xxx-xxxx'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-50 text-xs">
                        <button
                          onClick={() => setAssigningPatient(patient)}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          มอบหมายนักกายภาพ
                        </button>
                        <button
                          onClick={() => {
                            if (onSelectPatientForKiosk) onSelectPatientForKiosk(patient);
                            showToast(`เลือกคนไข้ ${patient.name} สำหรับใช้งานตู้`);
                          }}
                          className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition"
                        >
                          เข้าใช้งานตู้
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 4: PHYSICAL THERAPISTS DIRECTORY (ข้อมูลนักกายภาพ)              */}
          {/* ================================================================== */}
          {activeTab === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">ทำเนียบบุคลากรนักกายภาพบำบัด</h3>
                  <p className="text-xs text-slate-500">ข้อมูลใบประกอบวิชาชีพ ความเชี่ยวชาญ และจำนวนคนไข้ในความรับผิดชอบ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {therapists.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0F2F2B] text-emerald-200 font-bold flex items-center justify-center text-base shadow-md">
                        {therapist.name.charAt(4) || 'ก'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0F2F2B]">{therapist.name}</div>
                        <div className="text-[11px] font-mono text-emerald-700 font-bold">
                          {therapist.code} • เลขที่ {therapist.licenseNumber}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl space-y-1">
                      <div className="font-semibold text-emerald-900">{therapist.specialty}</div>
                      <div>โทรศัพท์: {therapist.phone}</div>
                      <div>อีเมล: {therapist.email}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-emerald-50">
                      <span className="text-slate-500">คนไข้ในความดูแล:</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {therapist.activePatientsCount} คน
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 5: CASES & TREATMENT PLANS (เคสและแผนการรักษา)                 */}
          {/* ================================================================== */}
          {activeTab === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">แผนการรักษาและใบสั่งกายภาพบำบัด</h3>
                  <p className="text-xs text-slate-500">กำหนดท่ากายภาพ จำนวนเซต จำนวนครั้ง เวลาค้าง และระดับความยาก</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPlan({
                      id: 0,
                      patientId: 12,
                      patientName: 'นายสมชาย ใจดี',
                      patientCode: 'P-0012',
                      therapistId: 1,
                      therapistName: 'กภ. ธนากร วงศ์สวัสดิ์',
                      diagnosis: 'ข้อไหล่ติดระยะฟื้นฟู',
                      targetJoint: 'ข้อไหล่',
                      assignedExercises: [
                        { exerciseSlug: 'shoulder_raise', exerciseName: 'กางแขนยกด้านข้าง', sets: 3, reps: 10, holdSeconds: 3, difficulty: 'beginner' },
                      ],
                      clinicalNotes: 'ค่อยๆ เพิ่มองศาการยก',
                      createdAt: new Date().toISOString().split('T')[0],
                      status: 'active',
                    });
                    setIsPlanEditorOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#10B981] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างแผนการรักษาใหม่</span>
                </button>
              </div>

              <div className="space-y-4">
                {treatmentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-50 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-[#0F2F2B]">{plan.patientName}</span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {plan.patientCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          การวินิจฉัย: <strong>{plan.diagnosis}</strong> | ข้อต่อเป้าหมาย: {plan.targetJoint}
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <div className="font-bold text-emerald-800">ผู้สั่งแผน: {plan.therapistName}</div>
                        <div className="text-slate-400 text-[11px]">วันที่สร้าง: {plan.createdAt}</div>
                      </div>
                    </div>

                    {/* Prescribed Exercises List */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">ท่ากายภาพที่ได้รับมอบหมาย:</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {plan.assignedExercises.map((ex, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1"
                          >
                            <div className="font-bold text-[#0F2F2B]">{ex.exerciseName}</div>
                            <div className="text-slate-600">
                              เป้าหมาย: <span className="font-bold text-emerald-800">{ex.sets} เซต × {ex.reps} ครั้ง</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ค้างท่า: {ex.holdSeconds} วินาที | ความยาก: {ex.difficulty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Remarks */}
                    {plan.clinicalNotes && (
                      <div className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                        <strong>หมายเหตุและคำแนะนำทางคลินิก:</strong> {plan.clinicalNotes}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsPlanEditorOpen(true);
                        }}
                        className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition"
                      >
                        แก้ไขแผนการรักษา
                      </button>
                      {onLaunchKioskExercise && (
                        <button
                          onClick={() => onLaunchKioskExercise(1)}
                          className="px-4 py-2 rounded-full bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 transition flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>เริ่มทำตามแผนนี้ที่ตู้</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 6: POSES & PROGRAMS LIBRARY (ท่าและโปรแกรม)                     */}
          {/* ================================================================== */}
          {activeTab === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-bold text-lg text-[#0F2F2B]">คลังท่ากายภาพบำบัดชีวกลศาสตร์ (15 ท่ามาตรฐาน)</h3>
                <p className="text-xs text-slate-500">
                  ควบคุมด้วยสมการตรีโกณมิติ Aspect-Ratio Invariant และ 5-State Machine ป้องกันการโกงท่า
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'shoulder_raise', name: 'Shoulder Lateral Raise', thName: 'กางแขนยกหัวไหล่', joint: 'ข้อไหล่ (Shoulder)', targetDeg: '90°' },
                  { id: 'bicep_curl', name: 'Bicep Curl', thName: 'งอข้อศอกสร้างกำลังแขน', joint: 'ข้อศอก (Elbow)', targetDeg: '50°' },
                  { id: 'overhead_reach', name: 'Overhead Reach', thName: 'ชูมือขึ้นเหนือศีรษะ', joint: 'ข้อไหล่และลำตัว', targetDeg: '165°' },
                  { id: 'knee_squat', name: 'Chair Assisted Squat', thName: 'ย่อเข่าเก้าอี้เพื่อฟื้นฟูต้นขา', joint: 'ข้อเข่าและสะโพก', targetDeg: '85°' },
                  { id: 'side_bend', name: 'Trunk Side Bend', thName: 'เอียงลำตัวด้านข้าง', joint: 'แนวกระดูกสันหลัง', targetDeg: '28°' },
                  { id: 'calf_raise', name: 'Heel / Calf Raise', thName: 'เขย่งปลายเท้าบริหารน่อง', joint: 'ข้อเท้า (Ankle)', targetDeg: '35°' },
                ].map((pose) => (
                  <div
                    key={pose.id}
                    className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {pose.id}
                      </span>
                      <span className="text-xs font-bold text-emerald-800">เป้าหมาย {pose.targetDeg}</span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#0F2F2B]">{pose.thName}</div>
                      <div className="text-xs text-slate-400">{pose.name}</div>
                    </div>
                    <div className="text-xs text-slate-600 bg-emerald-50/40 p-2.5 rounded-2xl">
                      ข้อต่อหลัก: {pose.joint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 7: RESULTS & AI MOTION ANALYTICS (ผลและรายงาน)                  */}
          {/* ================================================================== */}
          {activeTab === 7 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">ผลการทำกายภาพ & รายงานการเคลื่อนไหว AI</h3>
                  <p className="text-xs text-slate-500">สถิติความแม่นยำ องศาการเคลื่อนไหว (ROM) และจำนวนครั้งที่ถูกต้อง</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                <div className="text-sm font-bold text-[#0F2F2B]">ประวัติเซสชันกายภาพบำบัดล่าสุดในคลินิก</div>
                <div className="divide-y divide-emerald-50 text-xs">
                  {[
                    { id: 101, patient: 'นายสมชาย ใจดี', pose: 'Shoulder Lateral Raise', reps: '10/10 ครั้ง', accuracy: '92%', rom: '91.4°', date: 'วันนี้ 10:20', status: 'ผ่านเกณฑ์ดีเยี่ยม' },
                    { id: 102, patient: 'นางมาลี รักสุข', pose: 'Chair Assisted Squat', reps: '8/8 ครั้ง', accuracy: '88%', rom: '84.0°', date: 'วันนี้ 11:45', status: 'ผ่านเกณฑ์' },
                    { id: 103, patient: 'นายประเสริฐ มั่นคง', pose: 'Bicep Curl', reps: '7/10 ครั้ง', accuracy: '78%', rom: '52.3°', date: 'เมื่อวานนี้', status: 'ต้องฝึกองศาเพิ่ม' },
                  ].map((row) => (
                    <div key={row.id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#0F2F2B] text-sm">{row.patient}</div>
                        <div className="text-slate-500 mt-0.5">
                          {row.pose} • {row.date}
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-bold text-emerald-700">
                          {row.reps} | ความแม่นยำ {row.accuracy} (ROM: {row.rom})
                        </div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 8: ACTIVITY LOG / AUDIT TRAIL (ประวัติการใช้งานระบบ)            */}
          {/* ================================================================== */}
          {activeTab === 8 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-bold text-lg text-[#0F2F2B]">Activity Log & Audit Trail</h3>
                <p className="text-xs text-slate-500">บันทึกประวัติการกระทำ การแก้ไขข้อมูล และการยืนยันตัวตนชีวมิติทั้งหมด</p>
              </div>

              <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-emerald-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider bg-emerald-50/40">
                        <th className="py-3 px-5">วัน-เวลา</th>
                        <th className="py-3 px-5">ผู้ดำเนินการ</th>
                        <th className="py-3 px-5">หมวดหมู่</th>
                        <th className="py-3 px-5">การกระทำ</th>
                        <th className="py-3 px-5">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-emerald-50/30">
                          <td className="py-3 px-5 font-mono text-slate-500">{log.timestamp}</td>
                          <td className="py-3 px-5 font-bold text-[#0F2F2B]">{log.userName}</td>
                          <td className="py-3 px-5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {log.category}
                            </span>
                          </td>
                          <td className="py-3 px-5 font-semibold text-emerald-950">{log.action}</td>
                          <td className="py-3 px-5 text-slate-600">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 9: DEVICES (อุปกรณ์ตู้ Smart Mirror)                           */}
          {/* ================================================================== */}
          {activeTab === 9 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-bold text-lg text-[#0F2F2B]">สถานะตู้กายภาพบำบัดอัจฉริยะ (Smart Mirror Kiosks)</h3>
                <p className="text-xs text-slate-500">ตรวจสอบการเชื่อมต่อกล้อง กลไกชีวมิติ และแคชออฟไลน์ในเครื่อง</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-base text-[#0F2F2B]">ตู้ StrongCare Kiosk #1 (หน้าห้องกายภาพ ชั้น 2)</div>
                      <div className="text-xs text-slate-400 font-mono">ID: KIOSK-BKK-02 • IP: 192.168.1.108</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>พร้อมทำงาน</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <div className="flex justify-between">
                      <span>กล้อง AI Vision:</span>
                      <strong className="text-emerald-900">HD 640×480 @ 60 FPS (Zero Latency)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>โมเดลชีวมิติ:</span>
                      <strong className="text-emerald-900">ResNet-34 (128-D Embedding)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ฐานข้อมูลเวกเตอร์ออฟไลน์:</span>
                      <strong className="text-emerald-900">IndexedDB ซิงก์สมบูรณ์ (128 โปรไฟล์)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* TAB 10: SYSTEM & AI SETTINGS (ตั้งค่าระบบและ AI)                   */}
          {/* ================================================================== */}
          {activeTab === 10 && (
            <div className="space-y-6 animate-fadeIn max-w-3xl">
              <div>
                <h3 className="font-bold text-lg text-[#0F2F2B]">พารามิเตอร์ระบบ AI และความปลอดภัย</h3>
                <p className="text-xs text-slate-500">ปรับแต่งเกณฑ์การจดจำใบหน้าและตัวกรองชีวกลศาสตร์ท่าทาง</p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-5">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>เกณฑ์ความคล้ายคลึงใบหน้า (Face Cosine Similarity Threshold):</span>
                      <span className="text-emerald-700">{aiSettings.similarityThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min={0.7}
                      max={0.95}
                      step={0.01}
                      value={aiSettings.similarityThreshold}
                      onChange={(e) => updateAiSettings({ similarityThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-[#10B981]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>เกณฑ์การแยกความต่างใบหน้า (Top-1 / Top-2 Margin Threshold):</span>
                      <span className="text-emerald-700">{aiSettings.marginThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min={0.03}
                      max={0.15}
                      step={0.01}
                      value={aiSettings.marginThreshold}
                      onChange={(e) => updateAiSettings({ marginThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-[#10B981]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>มุมเอียงลำตัวสูงสุดที่ยอมรับได้ (Max Trunk Lean Angle):</span>
                      <span className="text-emerald-700">{aiSettings.maxTrunkLeanDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={35}
                      step={1}
                      value={aiSettings.maxTrunkLeanDeg}
                      onChange={(e) => updateAiSettings({ maxTrunkLeanDeg: parseInt(e.target.value) })}
                      className="w-full accent-[#10B981]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-bold text-[#0F2F2B]">เสียงผู้ช่วย AI แนะนำท่าทาง (Voice Guidance)</div>
                    <div className="text-slate-500">พูดให้กำลังใจและเตือนความปลอดภัยระหว่างคนไข้ทำกายภาพ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiSettings.enableVoiceGuidance}
                    onChange={(e) => updateAiSettings({ enableVoiceGuidance: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 3. RECEPTION ONBOARDING MODAL                                        */}
      {/* ==================================================================== */}
      <ReceptionOnboardingModal
        isOpen={isReceptionOpen}
        onClose={() => setIsReceptionOpen(false)}
        onSuccessNavigateToKiosk={(patientData) => {
          if (onSelectPatientForKiosk) onSelectPatientForKiosk(patientData);
          if (onLaunchKioskExercise) onLaunchKioskExercise();
          onClose();
        }}
      />

      {/* ==================================================================== */}
      {/* 4. ASSIGN THERAPIST MODAL                                            */}
      {/* ==================================================================== */}
      {assigningPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2F2B]/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setAssigningPatient(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-emerald-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <h4 className="font-bold text-base text-[#0F2F2B]">มอบหมายนักกายภาพบำบัดผู้รับผิดชอบ</h4>
              <button onClick={() => setAssigningPatient(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              เลือกนักกายภาพบำบัดสำหรับดูแลคนไข้ <strong>{assigningPatient.name}</strong> ({assigningPatient.code})
            </p>

            <div className="space-y-2">
              {therapists.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    assignTherapist(assigningPatient.id, t.id, t.name);
                    showToast(`มอบหมายคนไข้ ${assigningPatient.name} ให้ ${t.name} เรียบร้อยแล้ว`);
                    setAssigningPatient(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl border border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/60 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-[#0F2F2B]">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.specialty.split('(')[0]}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. EDIT USER MODAL                                                   */}
      {/* ==================================================================== */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2F2B]/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-emerald-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <h4 className="font-bold text-base text-[#0F2F2B]">แก้ไขข้อมูลผู้ใช้งาน</h4>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editingUser.id, editingUser);
                showToast(`บันทึกข้อมูลของ ${editingUser.name} สำเร็จ`);
                setEditingUser(null);
              }}
              className="space-y-3.5 text-xs font-semibold"
            >
              <div>
                <label className="block text-slate-700 mb-1">ชื่อ-นามสกุล:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-sm font-bold text-[#0F2F2B] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">เบอร์โทรศัพท์:</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-sm outline-none"
                />
              </div>

              {editingUser.role === 'patient' && (
                <div>
                  <label className="block text-slate-700 mb-1">การวินิจฉัย / อาการ:</label>
                  <input
                    type="text"
                    value={editingUser.diagnosis || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, diagnosis: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-sm outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#10B981] text-white font-bold shadow-md hover:bg-emerald-600 transition"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. RESET PIN SUCCESS DIALOG                                          */}
      {/* ==================================================================== */}
      {resettingPinUser && generatedNewPin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2F2B]/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            setResettingPinUser(null);
            setGeneratedNewPin(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-emerald-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-[#0F2F2B]">รีเซ็ตรหัสผ่าน/PIN สำเร็จ</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                รหัส PIN ใหม่สำหรับ {resettingPinUser.name} ({resettingPinUser.code})
              </p>
            </div>
            <div className="font-mono text-2xl font-extrabold text-emerald-700 bg-emerald-50 py-3 rounded-2xl border border-emerald-200">
              {generatedNewPin}
            </div>
            <button
              onClick={() => {
                setResettingPinUser(null);
                setGeneratedNewPin(null);
              }}
              className="w-full py-2.5 rounded-full bg-[#10B981] text-white text-xs font-bold"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
