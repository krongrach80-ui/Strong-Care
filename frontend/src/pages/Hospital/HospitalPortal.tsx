import React, { useState, useMemo, useEffect } from 'react';
import {
  LogIn,
  ArrowLeft,
  Users,
  User,
  Stethoscope,
  Dumbbell,
  History,
  Sliders,
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Shield,
  Ban,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Play,
  Activity,
  ChevronRight,
  ChevronLeft,
  Menu,
  Phone,
  FileText,
  HeartPulse,
  X,
  Check,
  Laptop,
  Globe,
  RefreshCw,
  Lock,
  Unlock,
  Settings,
  UserCheck,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { UserAccount, UserRole, PhysicalTherapist, HospitalExercise, ActivityLog } from '../../types/hospital';
import { ReceptionOnboardingModal } from '../../components/Reception/ReceptionOnboardingModal';
import { AddUserModal } from '../../components/Hospital/AddUserModal';
import { EditUserModal } from '../../components/Hospital/EditUserModal';
import { ChangePasswordModal } from '../../components/Hospital/ChangePasswordModal';
import { DeleteUserModal } from '../../components/Hospital/DeleteUserModal';
import { AddExerciseModal } from '../../components/Hospital/AddExerciseModal';
import { EditExerciseModal } from '../../components/Hospital/EditExerciseModal';
import { DeleteExerciseModal } from '../../components/Hospital/DeleteExerciseModal';
import { EditPatientModal } from '../../components/Hospital/EditPatientModal';
import { EditTherapistModal } from '../../components/Hospital/EditTherapistModal';
import { ConfirmActionModal } from '../../components/Hospital/ConfirmActionModal';
import { BannedManagementModal } from '../../components/Hospital/BannedManagementModal';

interface HospitalPortalProps {
  onClose: () => void;
  onLaunchKioskExercise?: (exerciseId?: number | string) => void;
  onSelectPatientForKiosk?: (patientData: any) => void;
}

type TabKey = 'users' | 'patients' | 'therapists' | 'exercises' | 'logs' | 'settings';

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
    exercises,
    activityLogs,
    bannedDevices,
    bannedIps,
    aiSettings,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    addTherapist,
    updateTherapist,
    addExercise,
    updateExercise,
    deleteExercise,
    kickSession,
    banDevice,
    unbanDevice,
    banIp,
    unbanIp,
    updateAiSettings,
    addActivityLog,
    loginStaff,
    logoutStaff,
    isSupabaseConnected,
    isLoadingFromDb,
    initializeFromSupabase,
  } = useHospitalStore();

  // Load from Supabase on mount
  useEffect(() => {
    initializeFromSupabase();
  }, [initializeFromSupabase]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  // Staff Authentication Barrier
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [staffUsernameInput, setStaffUsernameInput] = useState<string>('');
  const [staffPasswordInput, setStaffPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [staffAuthError, setStaffAuthError] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Staff Logout Handler
  const handleStaffLogout = () => {
    logoutStaff();
    setIsStaffAuthenticated(false);
    setStaffUsernameInput('');
    setStaffPasswordInput('');
    setStaffAuthError(null);
    showToast('ออกจากระบบบุคลากรเรียบร้อยแล้ว');
  };

  // Staff Login Submission (Checks real username + password)
  const handleStaffLogin = async (e?: React.FormEvent, overrideUsername?: string, overridePassword?: string) => {
    if (e) e.preventDefault();
    const u = (overrideUsername !== undefined ? overrideUsername : staffUsernameInput).trim();
    const p = (overridePassword !== undefined ? overridePassword : staffPasswordInput).trim();

    if (!u) {
      setStaffAuthError('กรุณากรอก Username ประจำตัวบุคลากร');
      return;
    }
    if (!p) {
      setStaffAuthError('กรุณากรอก Password รหัสผ่าน');
      return;
    }

    setIsLoggingIn(true);
    setStaffAuthError(null);

    try {
      const result = await loginStaff(u, p);
      if (result.success && result.user) {
        setIsStaffAuthenticated(true);
        setStaffAuthError(null);
        setStaffUsernameInput('');
        setStaffPasswordInput('');
        if (result.user.role === 'therapist' && (activeTab === 'logs' || activeTab === 'settings')) {
          setActiveTab('users');
        }
        showToast(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${result.user.name} (${result.user.role === 'admin' ? 'แอดมินใหญ่' : 'นักกายภาพบำบัด'})`);
      } else {
        setStaffAuthError(result.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Helper to pre-fill credentials into form
  const handleFillDemoAccount = (username: string, pass: string) => {
    setStaffUsernameInput(username);
    setStaffPasswordInput(pass);
    setStaffAuthError(null);
  };

  // Guard against forbidden tab navigation for Physiotherapist
  useEffect(() => {
    if (currentRole === 'therapist' && (activeTab === 'logs' || activeTab === 'settings')) {
      setActiveTab('users');
      showToast('ไม่มีสิทธิ์เข้าถึง: หน้านี้สงวนสิทธิ์เฉพาะผู้อำนวยการ / แอดมินใหญ่ (Admin)');
    }
  }, [currentRole, activeTab]);

  // Current active staff info
  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  // Current Therapist profile if in therapist mode
  const currentTherapist = useMemo(() => {
    const cur = users.find((u) => u.id === currentUserId);
    if (!cur) return therapists[0];
    return (
      therapists.find((t) => t.code === cur.code || t.name === cur.name || t.id === cur.id) ||
      therapists[0]
    );
  }, [therapists, users, currentUserId]);

  // Reception Onboarding Modal
  const [isReceptionOpen, setIsReceptionOpen] = useState<boolean>(false);

  // Responsive Collapsible Sidebar state (optimizes screen space on portrait/vertical kiosks)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // =========================================================================
  // 1. STATE FOR USER MANAGEMENT (Tab 1: users)
  // =========================================================================
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'patient' | 'therapist'>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string | number, boolean>>({});
  const [userPage, setUserPage] = useState<number>(1);
  const userPageSize = 8;

  const togglePasswordVisibility = (userId: string | number) => {
    setRevealedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const q = userSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.assignedTherapistName && u.assignedTherapistName.toLowerCase().includes(q));
      return matchRole && matchQuery;
    });
  }, [users, userRoleFilter, userSearch]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);

  const handleAddUser = (
    userData: Omit<UserAccount, 'id' | 'created_at'>,
    therapistExtra?: Omit<PhysicalTherapist, 'id'>
  ) => {
    addUser(userData);
    if (therapistExtra) {
      addTherapist(therapistExtra);
    }
  };

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const handleEditUser = (
    userId: number | string,
    updatedData: Partial<UserAccount>,
    therapistExtra?: Partial<PhysicalTherapist>
  ) => {
    updateUser(userId, updatedData);
    if (therapistExtra) {
      const existingTherapist = therapists.find((t) => t.id === userId);
      if (existingTherapist) {
        updateTherapist(userId, therapistExtra);
      } else {
        addTherapist({
          code: updatedData.code || `T-${Math.floor(100 + Math.random() * 900)}`,
          name: updatedData.name || 'นักกายภาพ',
          specialty:
            therapistExtra.specialty ||
            'กายภาพบำบัดระบบกระดูกและกล้ามเนื้อ (Orthopedic PT)',
          phone: updatedData.phone || '08x-xxx-xxxx',
          email: updatedData.email || 'pt@strongcare.hospital',
          licenseNumber: therapistExtra.licenseNumber || 'กภ. 8920',
          activePatientsCount: 0,
          assignedCases: [],
          bio: therapistExtra.bio || '',
          status: 'active',
        });
      }
    }
  };

  // Check if current user can edit target user
  const canEditUser = (targetUser: UserAccount): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'therapist') {
      // Physiotherapist can ONLY edit patients under their care
      if (targetUser.role !== 'patient') return false;
      const isAssigned =
        targetUser.assignedTherapistId === currentUserId ||
        (targetUser.assignedTherapistName &&
          targetUser.assignedTherapistName.includes(currentTherapist?.name || 'ธนากร'));
      return !!isAssigned;
    }
    return false;
  };

  // Edit Password / PIN Modal State
  const [editingPasswordUser, setEditingPasswordUser] = useState<UserAccount | null>(null);

  // Delete User Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // Check if current user can delete target user
  const canDeleteUser = (targetUser: UserAccount): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'therapist') {
      // Physiotherapist can ONLY delete patients under their care
      if (targetUser.role !== 'patient') return false;
      const isAssigned =
        targetUser.assignedTherapistId === currentUserId ||
        (targetUser.assignedTherapistName &&
          targetUser.assignedTherapistName.includes(currentTherapist?.name || 'ธนากร'));
      return !!isAssigned;
    }
    return false;
  };

  // =========================================================================
  // 2. STATE FOR PATIENT DATA (Tab 2: patients)
  // =========================================================================
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [patientCareFilter, setPatientCareFilter] = useState<'all' | 'assigned'>('all');
  const [patientDetailModal, setPatientDetailModal] = useState<UserAccount | null>(null);

  const filteredPatients = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== 'patient') return false;
      if (currentRole === 'therapist' && patientCareFilter === 'assigned') {
        const isAssigned = canEditUser(u);
        if (!isAssigned) return false;
      }
      const q = patientSearch.toLowerCase().trim();
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.diagnosis && u.diagnosis.toLowerCase().includes(q)) ||
        (u.assignedTherapistName && u.assignedTherapistName.toLowerCase().includes(q)) ||
        (u.chiefComplaint && u.chiefComplaint.toLowerCase().includes(q))
      );
    });
  }, [users, patientSearch, currentRole, patientCareFilter, canEditUser]);

  // =========================================================================
  // 3. STATE FOR PHYSIOTHERAPIST DATA (Tab 3: therapists)
  // =========================================================================
  const [therapistSearch, setTherapistSearch] = useState<string>('');
  const [editingTherapist, setEditingTherapist] = useState<PhysicalTherapist | null>(null);
  const [isAddTherapistOpen, setIsAddTherapistOpen] = useState<boolean>(false);
  const [newTherapistForm, setNewTherapistForm] = useState<{
    name: string;
    specialty: string;
    phone: string;
    email: string;
    licenseNumber: string;
    bio: string;
    status: 'active' | 'on_leave';
  }>({
    name: '',
    specialty: 'กายภาพบำบัดระบบกระดูกและกล้ามเนื้อ (Orthopedics)',
    phone: '',
    email: '',
    licenseNumber: 'กภ. 8920',
    bio: '',
    status: 'active',
  });

  const filteredTherapists = useMemo(() => {
    return therapists.filter((t) => {
      const q = therapistSearch.toLowerCase().trim();
      return (
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.specialty.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.bio && t.bio.toLowerCase().includes(q))
      );
    });
  }, [therapists, therapistSearch]);

  // Check if current user can edit target therapist
  const canEditTherapist = (t: PhysicalTherapist): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'therapist') {
      // PT can edit ONLY their own account data
      const currentNameClean = (currentUser?.name || currentTherapist?.name || '')
        .replace(/^(กภ\.|นาย|นางสาว|ดร\.)\s*/, '')
        .trim();
      const therapistNameClean = (t.name || '')
        .replace(/^(กภ\.|นาย|นางสาว|ดร\.)\s*/, '')
        .trim();
      return (
        t.id === currentUserId ||
        (Boolean(currentTherapist) && t.id === currentTherapist.id) ||
        (Boolean(currentNameClean) &&
          Boolean(therapistNameClean) &&
          (therapistNameClean.includes(currentNameClean) || currentNameClean.includes(therapistNameClean)))
      );
    }
    return false;
  };

  const handleAddTherapistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTherapistForm.name.trim()) {
      showToast('กรุณากรอกชื่อนักกายภาพบำบัด');
      return;
    }
    const randCode = `T-00${therapists.length + 1}`;
    addTherapist({
      code: randCode,
      name: newTherapistForm.name.trim(),
      specialty: newTherapistForm.specialty,
      phone: newTherapistForm.phone || '08x-xxx-xxxx',
      email: newTherapistForm.email || 'therapist@strongcare.com',
      licenseNumber: newTherapistForm.licenseNumber || 'กภ. 9999',
      activePatientsCount: 0,
      assignedCases: [],
      bio: newTherapistForm.bio || 'นักกายภาพบำบัดวิชาชีพ โรงพยาบาล StrongCare',
      status: newTherapistForm.status,
    });
    setIsAddTherapistOpen(false);
    showToast(`เพิ่มนักกายภาพบำบัดใหม่สำเร็จ: ${newTherapistForm.name}`);
    setNewTherapistForm({
      name: '',
      specialty: 'กายภาพบำบัดระบบกระดูกและกล้ามเนื้อ (Orthopedics)',
      phone: '',
      email: '',
      licenseNumber: 'กภ. 8920',
      bio: '',
      status: 'active',
    });
  };

  // =========================================================================
  // 4. STATE FOR EXERCISE LIBRARY (Tab 4: exercises)
  // =========================================================================
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState<string>('all');
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState<boolean>(false);
  const [editingExercise, setEditingExercise] = useState<HospitalExercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<HospitalExercise | null>(null);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchCat = exerciseCategoryFilter === 'all' || ex.category === exerciseCategoryFilter;
      const q = exerciseSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.englishName.toLowerCase().includes(q) ||
        ex.targetJoint.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [exercises, exerciseCategoryFilter, exerciseSearch]);

  // =========================================================================
  // 5. STATE FOR USAGE / ACTIVITY LOG (Tab 5: logs - Admin only)
  // =========================================================================
  const [logSearch, setLogSearch] = useState<string>('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [isBannedManagementOpen, setIsBannedManagementOpen] = useState<boolean>(false);
  const [kickedLogIds, setKickedLogIds] = useState<(number | string)[]>([]);
  const [confirmKickLog, setConfirmKickLog] = useState<ActivityLog | null>(null);
  const [confirmBanDevice, setConfirmBanDevice] = useState<string | null>(null);
  const [confirmBanIp, setConfirmBanIp] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchCat = logCategoryFilter === 'all' || log.category === logCategoryFilter;
      const q = logSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.device && log.device.toLowerCase().includes(q)) ||
        (log.ipAddress && log.ipAddress.includes(q));
      return matchCat && matchQ;
    });
  }, [activityLogs, logCategoryFilter, logSearch]);

  // =========================================================================
  // 6. STATE FOR SYSTEM SETTINGS (Tab 6: settings - Admin only)
  // =========================================================================
  const [localAiSettings, setLocalAiSettings] = useState(aiSettings);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [isResetSettingsOpen, setIsResetSettingsOpen] = useState<boolean>(false);

  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    setTimeout(() => {
      updateAiSettings(localAiSettings);
      setIsSavingSettings(false);
      showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    }, 450);
  };

  const handleResetSettingsConfirm = () => {
    const defaults = {
      similarityThreshold: 0.80,
      marginThreshold: 0.08,
      minVisibilityThreshold: 0.55,
      poseConfidenceThreshold: 0.65,
      toleranceDeg: 10,
      maxTrunkLeanDeg: 22,
      maxVelocityDegPerSec: 220,
      modelVersion: 'face-resnet34-v2',
      enableVoiceGuidance: true,
      enableAutoSync: true,
      strictLivenessChallenge: true,
    };
    setLocalAiSettings(defaults);
    updateAiSettings(defaults);
    showToast('รีเซ็ตเป็นค่ามาตรฐานที่แนะนำเรียบร้อยแล้ว');
  };

  // If not authenticated, render New Staff Login Screen (Username + Password)
  if (!isStaffAuthenticated) {
    const demoAccounts = [
      {
        username: 'admin',
        password: '1234',
        role: 'admin' as const,
        roleTitle: 'แอดมินใหญ่ (Admin)',
        name: 'นพ. วรชัย อมรเวช',
        code: 'ADM-01',
        description: 'ผู้อำนวยการ รพ. • สิทธิ์ 6 เมนู',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      },
      {
        username: 'pt_thanakorn',
        password: '1234',
        role: 'therapist' as const,
        roleTitle: 'นักกายภาพ (PT)',
        name: 'กภ. ธนากร วงศ์สวัสดิ์',
        code: 'T-003',
        description: 'นักกายภาพวิชาชีพ • สิทธิ์ 4 เมนู',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      },
      {
        username: 'pt_pimchanok',
        password: '1234',
        role: 'therapist' as const,
        roleTitle: 'นักกายภาพ (PT)',
        name: 'กภ. พิมพ์ชนก สุขเกษม',
        code: 'T-007',
        description: 'นักกายภาพวิชาชีพ • สิทธิ์ 4 เมนู',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072420]/90 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
        <div className="bg-white rounded-[32px] sm:rounded-[36px] border-2 border-emerald-300 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center my-auto">
          {/* Header Banner */}
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>STRONG CARE • Hospital Staff Portal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F2F2B]">
                เข้าสู่ระบบบุคลากร STRONG CARE
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                สำหรับผู้อำนวยการ รพ., แอดมินใหญ่ และนักกายภาพบำบัด
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleStaffLogin} className="space-y-4 text-left">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username (ชื่อผู้ใช้) <span className="text-rose-500">*</span>
              </label>
              <div className="bg-slate-50 rounded-2xl border border-emerald-200 p-3 flex items-center gap-2.5 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-emerald-200 transition">
                <User className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <input
                  type="text"
                  value={staffUsernameInput}
                  onChange={(e) => {
                    setStaffUsernameInput(e.target.value);
                    setStaffAuthError(null);
                  }}
                  placeholder="เช่น admin หรือ pt_thanakorn"
                  className="w-full bg-transparent text-sm font-semibold text-[#0F2F2B] outline-none"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password (รหัสผ่าน) <span className="text-rose-500">*</span>
              </label>
              <div className="bg-slate-50 rounded-2xl border border-emerald-200 p-3 flex items-center gap-2.5 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-emerald-200 transition">
                <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={staffPasswordInput}
                  onChange={(e) => {
                    setStaffPasswordInput(e.target.value);
                    setStaffAuthError(null);
                  }}
                  placeholder="กรอกรหัสผ่าน (เช่น 1234)"
                  className="w-full bg-transparent text-sm font-semibold text-[#0F2F2B] outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Auto-detect role hint */}
            <div className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>ระบบจะตรวจสอบสิทธิ์อัตโนมัติ: Admin (6 เมนู) หรือ นักกายภาพ (4 เมนู)</span>
            </div>

            {/* Error Message Alert */}
            {staffAuthError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{staffAuthError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 hover:brightness-105 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                id="btnStaffLoginSubmit"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ Supabase...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบบุคลากร</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับหน้าหลักตู้คนไข้</span>
              </button>
            </div>
          </form>

          {/* Demo Accounts Quick-Select Table */}
          <div className="pt-4 border-t border-slate-100 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>บัญชีตัวอย่างสำหรับทดสอบ (Demo Accounts):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Password: 1234</span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <div
                  key={acc.username}
                  className="p-3 rounded-2xl border border-emerald-100 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0F2F2B] truncate">{acc.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${acc.badgeColor}`}>
                        {acc.roleTitle}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      user: <strong className="text-emerald-800">{acc.username}</strong> • pass: <strong className="text-slate-700">{acc.password}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFillDemoAccount(acc.username, acc.password)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-800 font-bold text-[11px] transition cursor-pointer shadow-2xs"
                      title="กรอกชื่อผู้ใช้ลงในฟอร์ม"
                    >
                      ใช้ชื่อนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar Menu Items based on Role
  // Admin: 6 items | Physiotherapist: 4 items
  const sidebarItems: { id: TabKey; label: string; icon: React.FC<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'users', label: '1. จัดการผู้ใช้งาน', icon: Users },
    { id: 'patients', label: '2. ข้อมูลคนไข้', icon: User },
    { id: 'therapists', label: '3. ข้อมูลนักกายภาพ', icon: Stethoscope },
    { id: 'exercises', label: '4. ท่าทางกายภาพ', icon: Dumbbell },
    { id: 'logs', label: '5. ประวัติการใช้งาน', icon: History, adminOnly: true },
    { id: 'settings', label: '6. ตั้งค่าระบบ', icon: Sliders, adminOnly: true },
  ];

  const visibleSidebarItems = sidebarItems.filter((item) => {
    if (item.adminOnly && currentRole !== 'admin') return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex bg-[#F4FBF7] text-[#0F2F2B] font-sans overflow-hidden animate-fadeIn select-none">
      {/* ==================================================================== */}
      {/* 1. LEFT SIDEBAR (Medical Emerald Theme)                              */}
      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 1. LEFT SIDEBAR (Medical Emerald Theme)                              */}
      {/* ==================================================================== */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-16 sm:w-18 p-2.5 items-center' : 'w-56 sm:w-60 p-3.5 sm:p-4'
        } bg-[#0F2F2B] text-white flex flex-col justify-between flex-shrink-0 shadow-2xl transition-all duration-200 z-30 select-none`}
      >
        <div className="w-full">
          {/* Brand Logo & Collapse Toggle */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} py-1.5 mb-3 border-b border-emerald-900/60`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-[#4AE387] flex items-center justify-center shadow-md flex-shrink-0">
                <HeartPulse className="w-4 h-4 text-[#4AE387]" />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <div className="font-extrabold text-sm tracking-tight leading-tight text-white truncate">
                    STRONG CARE
                  </div>
                  <div className="text-[10px] text-emerald-300/90 font-medium truncate">
                    {currentRole === 'admin' ? 'แอดมิน (Admin)' : 'นักกายภาพ (PT)'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition cursor-pointer flex-shrink-0"
              title={isSidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนูเพื่อเพิ่มพื้นที่'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1" aria-label="เมนูระบบบริหารจัดการ">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
                  } rounded-xl font-semibold text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#10B981] text-[#0F2F2B] font-extrabold shadow-md shadow-emerald-500/30'
                      : 'text-emerald-100/75 hover:bg-emerald-950/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0F2F2B]' : 'text-emerald-300'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Info & Logout */}
        <div className="pt-3 border-t border-emerald-900/60 space-y-1.5 w-full">
          {!isSidebarCollapsed && (
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[10px] text-emerald-300/80">
              <div className="truncate">ฐานข้อมูล: <span className={isSupabaseConnected ? "text-[#4AE387] font-bold" : "text-amber-400 font-bold"}>{isSupabaseConnected ? "Cloud 🟢" : "Local 🟡"}</span></div>
              <div className="text-[10px] text-emerald-400/80 truncate">ผู้ใช้: {currentUser?.name?.split(' ')[0] || currentUser?.username}</div>
            </div>
          )}

          <button
            onClick={handleStaffLogout}
            title="ออกจากระบบบุคลากร"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'
            } rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs font-semibold hover:bg-rose-900/60 hover:text-white transition active:scale-95 cursor-pointer`}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            {!isSidebarCollapsed && <span>ออกจากระบบ</span>}
          </button>

          <button
            onClick={onClose}
            title="กลับหน้าหลักตู้คนไข้"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-1.5'
            } rounded-xl border border-emerald-800/60 text-emerald-300/80 text-[11px] font-medium hover:bg-emerald-900/50 hover:text-white transition active:scale-95 cursor-pointer`}
          >
            <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>กลับหน้าตู้ Kiosk</span>}
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 2. MAIN CONTENT AREA                                                 */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4FBF7]">
        {/* Top Header Bar */}
        <header className="h-16 px-3.5 sm:px-6 border-b border-emerald-100 bg-white/90 backdrop-blur-md flex items-center justify-between flex-shrink-0 gap-2">
          {/* Header Title with Mobile Collapse Toggle */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 transition cursor-pointer flex-shrink-0"
              title={isSidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-[#0F2F2B] tracking-tight truncate flex items-center gap-1.5">
                <span>
                  {activeTab === 'users' && 'จัดการผู้ใช้งาน'}
                  {activeTab === 'patients' && 'ข้อมูลคนไข้'}
                  {activeTab === 'therapists' && 'ข้อมูลนักกายภาพ'}
                  {activeTab === 'exercises' && 'ท่าทางกายภาพ'}
                  {activeTab === 'logs' && 'ประวัติการใช้งาน'}
                  {activeTab === 'settings' && 'ตั้งค่าระบบ'}
                </span>
                <span className="hidden xl:inline text-xs font-semibold text-slate-400">
                  {activeTab === 'users' && '(User Management)'}
                  {activeTab === 'patients' && '(Patient Data)'}
                  {activeTab === 'therapists' && '(Physiotherapist Data)'}
                  {activeTab === 'exercises' && '(Exercise Library)'}
                  {activeTab === 'logs' && '(Audit Log)'}
                  {activeTab === 'settings' && '(Settings)'}
                </span>
              </h1>
              <div className="w-10 sm:w-16 h-1 rounded-full bg-[#10B981] mt-0.5" />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Supabase Connection Status Indicator */}
            <div className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isSupabaseConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isSupabaseConnected ? 'Supabase 🟢' : 'Offline 🟡'}</span>
            </div>

            {/* Quick Reception Action button */}
            <button
              onClick={() => setIsReceptionOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ ต้อนรับ & สแกนหน้า</span>
            </button>

            {/* User Profile Badge (Real user + role) */}
            <div className="flex items-center gap-2 pl-2 border-l border-emerald-200">
              <div
                className={`w-8 h-8 rounded-full font-extrabold flex items-center justify-center text-xs shadow-xs flex-shrink-0 ${
                  currentRole === 'admin' ? 'bg-[#0F2F2B] text-amber-300' : 'bg-[#10B981] text-white'
                }`}
              >
                {currentUser?.name?.charAt(0) || (currentRole === 'admin' ? 'ผ' : 'ธ')}
              </div>
              <div className="hidden sm:block text-left max-w-[110px] lg:max-w-[160px]">
                <div className="text-xs font-bold text-[#0F2F2B] leading-tight truncate">
                  {currentUser?.name || (currentRole === 'admin' ? 'นพ. วรชัย' : 'กภ. ธนากร')}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUser?.code || (currentRole === 'admin' ? 'ADM-01' : 'T-003')}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleStaffLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
              title="ออกจากระบบบุคลากร"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออก</span>
            </button>
          </div>
        </header>

        {/* In-app Toast Banner */}
        {toast && (
          <div className="mx-3.5 sm:mx-6 mt-2.5 p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
          {/* ================================================================== */}
          {/* PAGE 1: จัดการผู้ใช้งาน (User Management)                            */}
          {/* ================================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              {/* Permission Banner */}
              <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs flex items-center justify-between text-xs gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="leading-snug">
                    สิทธิ์ปัจจุบัน ({currentRole === 'admin' ? 'แอดมินใหญ่' : 'นักกายภาพ'}):{' '}
                    <strong>
                      {currentRole === 'admin'
                        ? 'สามารถ เพิ่มบัญชี, แก้ไขชื่อ, แก้ไขรหัสผ่าน, และลบบัญชีผู้ใช้งานทั้งหมดได้'
                        : 'สามารถ เพิ่มบัญชีคนไข้ใหม่ได้ และลบบัญชีได้เฉพาะคนไข้ที่ตนเองดูแลเท่านั้น'}
                    </strong>
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex-shrink-0 border border-emerald-200">
                  {users.length} บัญชี
                </span>
              </div>

              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-100 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-black text-[#0F2F2B] leading-none">
                      {users.length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-1 truncate">ผู้ใช้งานทั้งหมด</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-100 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-black text-[#0F2F2B] leading-none">
                      {users.filter((u) => u.role === 'patient').length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-1 truncate">คนไข้</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-100 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-black text-[#0F2F2B] leading-none">
                      {users.filter((u) => u.role === 'therapist').length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-1 truncate">นักกายภาพ</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-100 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-black text-[#0F2F2B] leading-none">
                      {users.filter((u) => u.role === 'admin').length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-1 truncate">แอดมิน (Admin)</div>
                  </div>
                </div>
              </div>

              {/* Search, Filter & Add Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="w-full sm:w-64 lg:w-72 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="ค้นหาชื่อ, username, รหัส..."
                    className="w-full pl-9 pr-3.5 py-1.5 sm:py-2 rounded-full bg-white border border-emerald-200/90 text-xs font-semibold text-[#0F2F2B] placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                  <div className="flex items-center gap-1 p-1 rounded-full bg-emerald-50/80 border border-emerald-200/80">
                    <button
                      onClick={() => {
                        setUserRoleFilter('all');
                        setUserPage(1);
                      }}
                      className={`text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full transition cursor-pointer ${
                        userRoleFilter === 'all' ? 'bg-[#10B981] text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => {
                        setUserRoleFilter('patient');
                        setUserPage(1);
                      }}
                      className={`text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full transition cursor-pointer ${
                        userRoleFilter === 'patient' ? 'bg-[#10B981] text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      คนไข้
                    </button>
                    <button
                      onClick={() => {
                        setUserRoleFilter('therapist');
                        setUserPage(1);
                      }}
                      className={`text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full transition cursor-pointer ${
                        userRoleFilter === 'therapist' ? 'bg-[#10B981] text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      นักกายภาพ
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-[#10B981] text-white text-xs font-bold shadow-xs hover:bg-emerald-600 transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{currentRole === 'admin' ? 'เพิ่มบัญชีใหม่' : 'เพิ่มคนไข้'}</span>
                  </button>
                </div>
              </div>

              {/* Table of Users */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider bg-emerald-50/70">
                        <th className="py-2.5 px-3 sm:px-4 sticky left-0 bg-emerald-50 z-20 shadow-xs border-r border-emerald-100/70 min-w-[160px] sm:min-w-[190px]">
                          บัญชี / ชื่อผู้ใช้งาน
                        </th>
                        <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap min-w-[125px]">รหัสผ่าน (Password)</th>
                        <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap min-w-[105px]">สถานะ / บทบาท</th>
                        <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap min-w-[130px]">หมอที่รับผิดชอบ</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap min-w-[95px]">การจัดการ (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                <Search className="w-5 h-5" />
                              </div>
                              <div className="font-bold text-xs sm:text-sm text-slate-600">
                                ไม่พบข้อมูลผู้ใช้งานที่ตรงตามเงื่อนไข
                              </div>
                              <div className="text-[11px] text-slate-400">
                                ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูรายชื่อทั้งหมด
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => {
                          const isPwRevealed = revealedPasswords[user.id];
                          const canEdit = canEditUser(user);
                          const canDelete = canDeleteUser(user);
                          return (
                            <tr key={user.id} className="hover:bg-emerald-50/40 transition group">
                              {/* 1. Account name & username (STICKY FIRST COLUMN) */}
                              <td className="py-2.5 px-3 sm:px-4 sticky left-0 bg-white group-hover:bg-emerald-50/60 z-10 shadow-xs border-r border-emerald-100/60 min-w-[160px] sm:min-w-[190px]">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0 ${
                                      user.role === 'patient'
                                        ? 'bg-[#10B981] text-white'
                                        : user.role === 'therapist'
                                        ? 'bg-[#0F2F2B] text-emerald-200'
                                        : 'bg-amber-600 text-white'
                                    }`}
                                  >
                                    {user.name.charAt(user.name.startsWith('นาย') || user.name.startsWith('นาง') ? 3 : 0) || 'ผ'}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-[#0F2F2B] leading-tight text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[170px]">{user.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px] sm:max-w-[170px] mt-0.5">
                                      <strong className="text-emerald-800">{user.username}</strong> ({user.code})
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Password with eye toggle & edit PIN */}
                              <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
                                  <span className="font-mono font-bold text-xs text-slate-700 tracking-wider">
                                    {isPwRevealed ? user.password || '1234' : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordVisibility(user.id)}
                                    title={isPwRevealed ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                                    className="text-slate-400 hover:text-emerald-700 transition cursor-pointer p-0.5"
                                  >
                                    {isPwRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => setEditingPasswordUser(user)}
                                    title="เปลี่ยนรหัสผ่าน / PIN"
                                    className="text-[11px] font-bold text-emerald-700 hover:underline pl-0.5 cursor-pointer"
                                  >
                                    เปลี่ยน
                                  </button>
                                </div>
                              </td>

                              {/* 3. Role & Status */}
                              <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {user.role === 'patient' && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs whitespace-nowrap">
                                      คนไข้
                                    </span>
                                  )}
                                  {user.role === 'therapist' && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#0F2F2B] text-white font-bold text-xs whitespace-nowrap">
                                      นักกายภาพ
                                    </span>
                                  )}
                                  {user.role === 'admin' && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs whitespace-nowrap">
                                      แอดมินใหญ่
                                    </span>
                                  )}
                                  <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0" />
                                </div>
                              </td>

                              {/* 4. Responsible Therapist */}
                              <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                                <span className="text-xs font-semibold text-slate-700 block truncate max-w-[140px] whitespace-nowrap">
                                  {user.assignedTherapistName || (user.role === 'patient' ? 'กภ. ธนากร วงศ์สวัสดิ์' : '—')}
                                </span>
                              </td>

                              {/* 5. Actions: Edit Name, Edit Password, Delete Account */}
                              <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  <button
                                    onClick={() => {
                                      if (canEdit) {
                                        setEditingUser(user);
                                      } else {
                                        showToast('สิทธิ์ไม่เพียงพอ: นักกายภาพสามารถแก้ไขได้เฉพาะคนไข้ที่ตนเองดูแลเท่านั้น');
                                      }
                                    }}
                                    disabled={!canEdit}
                                    title={canEdit ? 'แก้ไขบัญชี' : 'แก้ไขได้เฉพาะคนไข้ที่ตนเองดูแลเท่านั้น'}
                                    className={`p-1.5 rounded-lg border transition ${
                                      canEdit
                                        ? 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer'
                                        : 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                                    }`}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (canEdit) {
                                        setEditingPasswordUser(user);
                                      } else {
                                        showToast('สิทธิ์ไม่เพียงพอ: นักกายภาพสามารถเปลี่ยนรหัสผ่านได้เฉพาะคนไข้ที่ตนเองดูแลเท่านั้น');
                                      }
                                    }}
                                    disabled={!canEdit}
                                    title={canEdit ? 'เปลี่ยนรหัสผ่าน' : 'เปลี่ยนรหัสผ่านได้เฉพาะคนไข้ที่ตนเองดูแลเท่านั้น'}
                                    className={`p-1.5 rounded-lg border transition ${
                                      canEdit
                                        ? 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer'
                                        : 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                                    }`}
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (canDelete) {
                                        setDeletingUser(user);
                                      } else {
                                        showToast(
                                          user.role === 'admin'
                                            ? 'ไม่สามารถลบบัญชีแอดมินใหญ่ได้'
                                            : 'คุณสามารถลบได้เฉพาะคนไข้ที่ตนเองดูแล'
                                        );
                                      }
                                    }}
                                    disabled={!canDelete}
                                    title={canDelete ? 'ลบบัญชีผู้ใช้งาน' : 'ลบได้เฉพาะคนไข้ที่ตนเองดูแลเท่านั้น'}
                                    className={`p-1.5 rounded-lg border transition ${
                                      canDelete
                                        ? 'border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 cursor-pointer'
                                        : 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                                    }`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

                {/* Pagination */}
                <div className="py-4 px-6 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <div>
                    แสดง {Math.min(filteredUsers.length, (userPage - 1) * userPageSize + 1)}-
                    {Math.min(filteredUsers.length, userPage * userPageSize)} จาก {filteredUsers.length} รายการ
                  </div>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalUserPages }).map((_, idx) => {
                      const p = idx + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => setUserPage(p)}
                          className={`w-7 h-7 rounded-full font-bold flex items-center justify-center transition cursor-pointer ${
                            userPage === p
                              ? 'bg-[#10B981] text-white shadow-sm'
                              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* PAGE 2: ข้อมูลคนไข้ (Patient Data)                                    */}
          {/* ================================================================== */}
          {activeTab === 'patients' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">
                    {currentRole === 'therapist'
                      ? 'ข้อมูลเวชระเบียนคนไข้ (นักกายภาพบำบัด)'
                      : 'ข้อมูลเวชระเบียนคนไข้ทั้งหมด'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentRole === 'therapist'
                      ? 'คุณสามารถดูและแก้ไขเวชระเบียนเฉพาะคนไข้ที่ตนเองดูแลได้ (คนไข้ท่านอื่นดูข้อมูลได้เท่านั้น)'
                      : 'สิทธิ์แอดมินใหญ่: สามารถดูและแก้ไขเวชระเบียนคนไข้ทั้งหมดในระบบได้'}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* PT Filter Toggle */}
                  {currentRole === 'therapist' && (
                    <div className="flex items-center gap-1 p-1 bg-white border border-emerald-200 rounded-full shadow-2xs">
                      <button
                        onClick={() => setPatientCareFilter('assigned')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          patientCareFilter === 'assigned'
                            ? 'bg-[#10B981] text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-800'
                        }`}
                      >
                        เฉพาะที่ฉันดูแล
                      </button>
                      <button
                        onClick={() => setPatientCareFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          patientCareFilter === 'all'
                            ? 'bg-[#0F2F2B] text-emerald-300 shadow-xs'
                            : 'text-slate-600 hover:text-emerald-800'
                        }`}
                      >
                        คนไข้ทั้งหมด
                      </button>
                    </div>
                  )}

                  <div className="w-64 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="ค้นหาชื่อ, รหัส, อาการ..."
                      className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-emerald-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                  </div>

                  <button
                    onClick={() => setIsReceptionOpen(true)}
                    className="px-4 py-2 rounded-full bg-[#10B981] text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ ลงทะเบียนคนไข้ใหม่</span>
                  </button>
                </div>
              </div>

              {/* Patient List Cards */}
              <div className="space-y-4">
                {filteredPatients.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center text-slate-400 border border-emerald-100">
                    ไม่พบข้อมูลคนไข้ที่ค้นหา
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4 hover:border-emerald-300 transition"
                    >
                      {/* Patient Main Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-50 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-black text-lg flex items-center justify-center shadow-md">
                            {patient.name.charAt(patient.name.startsWith('นาย') || patient.name.startsWith('นาง') ? 3 : 0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-base text-[#0F2F2B]">{patient.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-xs font-bold text-emerald-800">
                                {patient.code}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                อายุ {patient.age || 65} ปี • {patient.gender === 'female' ? 'หญิง' : 'ชาย'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                              <span>โทร: <strong className="text-slate-700">{patient.phone || '08x-xxx-xxxx'}</strong></span>
                              <span>•</span>
                              <span>วันที่เริ่มเข้าระบบ: <strong className="text-emerald-800">{patient.created_at || '2026-02-01'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPatientDetailModal({ ...patient })}
                            className={`px-4 py-2 rounded-full border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              canEditUser(patient)
                                ? 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            title={
                              canEditUser(patient)
                                ? 'ดูและแก้ไขข้อมูลเวชระเบียนคนไข้'
                                : 'ดูข้อมูลเวชระเบียน (โหมดดูอย่างเดียว)'
                            }
                          >
                            {canEditUser(patient) ? (
                              <>
                                <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ดูและแก้ไขข้อมูล</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>ดูข้อมูลคนไข้</span>
                              </>
                            )}
                          </button>

                          {onSelectPatientForKiosk && (
                            <button
                              onClick={() => {
                                onSelectPatientForKiosk(patient);
                                if (onLaunchKioskExercise) onLaunchKioskExercise();
                                showToast(`เลือกคนไข้ ${patient.name} เข้าสู่การฝึกกายภาพที่ตู้`);
                                onClose();
                              }}
                              className="px-4 py-2 rounded-full bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>เข้าทำกายภาพที่ตู้</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Clinical Grid Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* 1. ประวัติการซักประวัติ */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ประวัติการซักประวัติ (Chief Complaint)</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[11px]">
                            {patient.chiefComplaint || patient.diagnosis || 'มีอาการปวดตึงข้อไหล่และกล้ามเนื้อเรื้อรัง'}
                          </p>
                        </div>

                        {/* 2. หมอที่รับผิดชอบ & ประวัติคนไข้ */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                            <span>หมอที่รับผิดชอบ & ประวัติโรค</span>
                          </div>
                          <div className="text-[11px] text-slate-700">
                            <strong>แพทย์/กภ.:</strong> {patient.assignedTherapistName || 'กภ. ธนากร วงศ์สวัสดิ์'}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>ประวัติคนไข้:</strong> {patient.patientBackground || 'ความดันโลหิตปกติ ไม่มีประวัติผ่าตัด'}
                          </div>
                        </div>

                        {/* 3. ผลการรักษา */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ผลการรักษา (Outcome / ROM)</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[11px]">
                            {patient.treatmentOutcome || 'ROM องศาเพิ่มขึ้น 12°, อาการปวดลดลง ความสม่ำเสมอ 92%'}
                          </p>
                        </div>

                        {/* 4. โน้ต/คำแนะนำจากนักกายภาพ */}
                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                          <div className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>โน้ตคำแนะนำจากนักกายภาพ</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed text-[11px]">
                            {patient.therapistNotes || 'เน้นฝึกยืดเหยียดเบาๆ สม่ำเสมอ ไม่ฝืนยกของหนักเกิน 3 กก.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* PAGE 3: ข้อมูลนักกายภาพ (Physiotherapist Data)                        */}
          {/* ================================================================== */}
          {activeTab === 'therapists' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">ข้อมูลนักกายภาพบำบัดประจำโรงพยาบาล</h3>
                  <p className="text-xs text-slate-500">
                    แสดง: ชื่อ, เคสที่รับผิดชอบ, เบอร์โทร, ประวัติส่วนตัว
                    {currentRole === 'therapist' && ' (คุณสามารถแก้ไขได้เฉพาะข้อมูลบัญชีของตนเอง)'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-64 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={therapistSearch}
                      onChange={(e) => setTherapistSearch(e.target.value)}
                      placeholder="ค้นหานักกายภาพ..."
                      className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-emerald-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                  </div>

                  {currentRole === 'admin' && (
                    <button
                      onClick={() => setIsAddTherapistOpen(true)}
                      className="px-4 py-2 rounded-full bg-[#10B981] text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ เพิ่มนักกายภาพ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Therapist Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTherapists.map((therapist) => {
                  const canEdit = canEditTherapist(therapist);
                  const isCurrentLoggedTherapist =
                    currentRole === 'therapist' &&
                    (therapist.id === currentUserId || therapist.name.includes('ธนากร'));

                  return (
                    <div
                      key={therapist.id}
                      className={`bg-white rounded-3xl p-6 border shadow-sm space-y-4 transition ${
                        isCurrentLoggedTherapist ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-emerald-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#0F2F2B] text-emerald-200 font-bold flex items-center justify-center text-base shadow-md">
                            {therapist.name.charAt(therapist.name.startsWith('กภ.') ? 4 : 0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#0F2F2B] flex items-center gap-1.5">
                              <span>{therapist.name}</span>
                              {isCurrentLoggedTherapist && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  บัญชีของคุณ
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-emerald-700 font-bold">
                              {therapist.code} • ใบอนุญาต {therapist.licenseNumber}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            therapist.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {therapist.status === 'active' ? 'ปฏิบัติงาน' : 'ลาพัก'}
                        </span>
                      </div>

                      {/* Contact & Specialty */}
                      <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl space-y-1.5 border border-slate-100">
                        <div className="font-semibold text-emerald-900">{therapist.specialty}</div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>โทรศัพท์: <strong>{therapist.phone}</strong></span>
                        </div>
                        <div className="text-slate-500 text-[11px]">อีเมล: {therapist.email}</div>
                      </div>

                      {/* Bio & Background */}
                      <div className="text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                        <div className="font-bold text-emerald-950 mb-1">ประวัติส่วนตัว & การศึกษา:</div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {therapist.bio || 'สำเร็จการศึกษากายภาพบำบัดบัณฑิต มีประสบการณ์ฟื้นฟูกระดูกและข้อ 6 ปี'}
                        </p>
                      </div>

                      {/* Responsible Cases */}
                      <div className="text-xs space-y-1.5 pt-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-700">เคสที่รับผิดชอบ ({therapist.activePatientsCount} เคส):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(therapist.assignedCases && therapist.assignedCases.length > 0
                            ? therapist.assignedCases
                            : ['นายสมชาย ใจดี', 'นางมาลี รักสุข']
                          ).map((pName, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 font-semibold text-[11px] border border-emerald-100"
                            >
                              {pName}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Edit Button with Permission check */}
                      <div className="pt-2 border-t border-emerald-50 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {canEdit ? 'สิทธิ์: สามารถแก้ไขได้' : 'แก้ไขได้เฉพาะบัญชีของตนเอง'}
                        </span>
                        <button
                          onClick={() => {
                            if (canEdit) {
                              setEditingTherapist(therapist);
                            } else {
                              showToast('คุณสามารถแก้ไขได้เฉพาะข้อมูลของตนเอง');
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            canEdit
                              ? 'bg-[#10B981] text-white hover:bg-emerald-600 shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title={canEdit ? 'แก้ไขข้อมูลนักกายภาพ' : 'คุณสามารถแก้ไขได้เฉพาะข้อมูลของตนเอง'}
                        >
                          {canEdit ? <Pencil className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>แก้ไขข้อมูล</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* PAGE 4: ท่าทางกายภาพ (Exercise Library)                              */}
          {/* ================================================================== */}
          {activeTab === 'exercises' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">คลังท่าทางกายภาพบำบัดชีวกลศาสตร์</h3>
                  <p className="text-xs text-slate-500">
                    แสดงท่าทางกายภาพทั้งหมด • แอดมินและนักกายภาพสามารถ เพิ่มท่าใหม่ และ ลบท่า ได้
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-56 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      placeholder="ค้นหาชื่อท่า, ข้อต่อ..."
                      className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-emerald-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                  </div>

                  <button
                    onClick={() => setIsAddExerciseOpen(true)}
                    className="px-4 py-2 rounded-full bg-[#10B981] text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ เพิ่มท่าทางใหม่</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {['all', 'ฟื้นฟูข้อไหล่และแขน', 'ฟื้นฟูข้อเข่าและขา', 'ฟื้นฟูข้อสะโพกและหลัง', 'ฟื้นฟูข้อเท้าและขา'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setExerciseCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
                        exerciseCategoryFilter === cat
                          ? 'bg-[#10B981] text-white shadow-sm'
                          : 'bg-white border border-emerald-200 text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      {cat === 'all' ? 'ทุกหมวดหมู่' : cat}
                    </button>
                  )
                )}
              </div>

              {/* Exercises Grid */}
              {filteredExercises.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <Dumbbell className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#0F2F2B]">ไม่พบท่าทางกายภาพที่ตรงกับเงื่อนไข</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น หรือกดปุ่มเพิ่มท่าทางกายภาพใหม่ลงในคลัง
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {(exerciseSearch || exerciseCategoryFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setExerciseSearch('');
                          setExerciseCategoryFilter('all');
                        }}
                        className="px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    )}
                    <button
                      onClick={() => setIsAddExerciseOpen(true)}
                      className="px-4 py-2 rounded-full bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ เพิ่มท่าทางใหม่</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4 hover:border-emerald-300 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                              {exercise.category}
                            </span>
                            {exercise.difficulty && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  exercise.difficulty === 'easy'
                                    ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                                    : exercise.difficulty === 'medium'
                                    ? 'bg-amber-100/70 text-amber-800 border-amber-200'
                                    : 'bg-rose-100/70 text-rose-800 border-rose-200'
                                }`}
                              >
                                {exercise.difficulty === 'easy'
                                  ? 'ง่าย'
                                  : exercise.difficulty === 'medium'
                                  ? 'ปานกลาง'
                                  : 'ยาก'}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-emerald-700">
                              เป้าหมาย {exercise.targetAngle}°
                            </span>
                            <span className="text-[11px] text-slate-400 block font-medium">
                              ค้าง {exercise.holdSeconds} วิ
                              {exercise.sets && exercise.repsPerSet
                                ? ` • ${exercise.sets}×${exercise.repsPerSet}`
                                : ''}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="font-extrabold text-base text-[#0F2F2B]">{exercise.name}</div>
                          <div className="text-xs text-slate-400 font-medium">{exercise.englishName}</div>
                        </div>

                        <div className="text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 space-y-1">
                          <div>
                            <strong>ข้อต่อเป้าหมาย:</strong>{' '}
                            <span className="text-emerald-900 font-bold">{exercise.targetJoint}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            {exercise.description}
                          </p>
                        </div>

                        {exercise.cautions && (
                          <div className="text-xs text-rose-700 bg-rose-50/60 p-2.5 rounded-2xl border border-rose-100 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-500" />
                            <span className="text-[11px] leading-tight">
                              <strong>ข้อควรระวัง:</strong> {exercise.cautions}
                            </span>
                          </div>
                        )}

                        {exercise.contraindications && (
                          <div className="text-xs text-amber-800 bg-amber-50/70 p-2.5 rounded-2xl border border-amber-200/80 flex items-start gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                            <span className="text-[11px] leading-tight">
                              <strong>ข้อห้าม:</strong> {exercise.contraindications}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-emerald-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingExercise(exercise)}
                            className="px-2.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-emerald-200"
                            title="แก้ไขข้อมูลท่าทางกายภาพนี้"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                            <span>แก้ไข</span>
                          </button>

                          <button
                            onClick={() => setDeletingExercise(exercise)}
                            className="px-2.5 py-1.5 rounded-full hover:bg-rose-50 text-rose-600 hover:text-rose-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-200"
                            title="ลบท่านี้ออกจากคลัง"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบท่านี้</span>
                          </button>
                        </div>

                        {onLaunchKioskExercise && (
                          <button
                            onClick={() => {
                              onLaunchKioskExercise(exercise.id);
                              showToast(`เริ่มท่าฝึก ${exercise.name} บนหน้าจอจำลอง`);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                            title="เปิดทดสอบเซสชันฝึกบนตู้จำลอง Kiosk"
                          >
                            <Play className="w-3 h-3" />
                            <span>ทดสอบที่ตู้</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* PAGE 5: ประวัติการใช้งาน (Usage / Activity Log) — Admin only!        */}
          {/* ================================================================== */}
          {activeTab === 'logs' && currentRole === 'admin' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">ประวัติการใช้งานระบบ (System Activity & Security Audit Log)</h3>
                  <p className="text-xs text-slate-500">
                    แสดง: ใครเข้าสู่ระบบล่าสุด, ใครแก้ไขข้อมูลตรงไหน, ใช้งานจากอุปกรณ์/IP ใด • สิทธิ์แอดมิน: เตะเครื่อง, แบนเครื่อง, แบน IP
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsBannedManagementOpen(true)}
                    className="px-4 py-2 rounded-full border border-rose-300 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>จัดการรายการแบน ({bannedDevices.length + bannedIps.length})</span>
                  </button>
                </div>
              </div>

              {/* Filters for Activity Log */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-80 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="ค้นหาผู้กระทำ, การกระทำ, อุปกรณ์..."
                    className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-emerald-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  {['all', 'AUTH', 'PATIENT', 'THERAPIST', 'TREATMENT', 'SYSTEM', 'AI'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLogCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                        logCategoryFilter === cat
                          ? 'bg-[#10B981] text-white shadow-sm'
                          : 'bg-white border border-emerald-200 text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Log Table */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider bg-emerald-50/70">
                        <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap">วัน-เวลา</th>
                        <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap">ผู้ดำเนินการ</th>
                        <th className="py-2.5 px-3 sm:px-4 min-w-[200px]">การกระทำ & รายละเอียด</th>
                        <th className="py-2.5 px-3 sm:px-4 whitespace-nowrap">อุปกรณ์ & IP Address</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">สิทธิ์แอดมินจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {filteredLogs.map((log) => {
                        const isKicked = kickedLogIds.includes(log.id);
                        const isDeviceBanned = Boolean(log.device && bannedDevices.includes(log.device));
                        const isIpBanned = Boolean(log.ipAddress && bannedIps.includes(log.ipAddress));

                        return (
                          <tr key={log.id} className="hover:bg-emerald-50/30 transition">
                            <td className="py-2.5 px-3 sm:px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                              {log.timestamp}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                              <div className="font-bold text-[#0F2F2B] flex items-center gap-1.5">
                                <span>{log.userName}</span>
                                {isKicked && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                    เตะออก
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                {log.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 sm:px-4">
                              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                                  {log.category}
                                </span>
                                <span>{log.action}</span>
                              </div>
                              <div className="text-slate-600 text-[11px] mt-0.5">{log.details}</div>
                            </td>
                            <td className="py-3 px-5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium text-[11px]">{log.device || 'Windows 11 / Chrome'}</span>
                                {isDeviceBanned && (
                                  <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[9px] border border-rose-200">
                                    [แบนเครื่อง]
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] mt-0.5">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span>{log.ipAddress || '192.168.1.100'}</span>
                                {isIpBanned && (
                                  <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[9px] border border-rose-200">
                                    [แบน IP]
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {/* 1. Kick Session Button */}
                                {isKicked ? (
                                  <button
                                    disabled
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 font-bold text-[10px] cursor-not-allowed"
                                  >
                                    ถูกเตะออก
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setConfirmKickLog(log)}
                                    title="เตะผู้ใช้ออกจากระบบ"
                                    className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-bold text-[10px] hover:bg-amber-100 transition cursor-pointer"
                                  >
                                    เตะออก
                                  </button>
                                )}

                                {/* 2. Ban Device Button */}
                                {isDeviceBanned ? (
                                  <button
                                    onClick={() => {
                                      if (log.device) {
                                        unbanDevice(log.device);
                                        showToast('ยกเลิกแบนเครื่องเรียบร้อยแล้ว');
                                      }
                                    }}
                                    title="ยกเลิกแบนคอมพิวเตอร์ / เบราว์เซอร์เครื่องนี้"
                                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-100 text-slate-600 font-bold text-[10px] hover:bg-slate-200 transition cursor-pointer"
                                  >
                                    ยกเลิกแบน
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setConfirmBanDevice(log.device || 'Windows 11 / Chrome 124')}
                                    title="แบนคอมพิวเตอร์ / เบราว์เซอร์เครื่องนี้"
                                    className="px-2.5 py-1 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 font-bold text-[10px] hover:bg-rose-100 transition cursor-pointer"
                                  >
                                    แบนเครื่อง
                                  </button>
                                )}

                                {/* 3. Ban IP Button */}
                                {isIpBanned ? (
                                  <button
                                    onClick={() => {
                                      if (log.ipAddress) {
                                        unbanIp(log.ipAddress);
                                        showToast('ยกเลิกแบน IP เรียบร้อยแล้ว');
                                      }
                                    }}
                                    title="ยกเลิกแบนที่อยู่ IP นี้"
                                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-100 text-slate-600 font-bold text-[10px] hover:bg-slate-200 transition cursor-pointer"
                                  >
                                    ยกเลิกแบน
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setConfirmBanIp(log.ipAddress || '192.168.1.100')}
                                    title="แบน IP Address นี้"
                                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold text-[10px] hover:bg-slate-200 transition cursor-pointer"
                                  >
                                    แบน IP
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* PAGE 6: ตั้งค่าระบบ (System Settings) — Admin only!                  */}
          {/* ================================================================== */}
          {activeTab === 'settings' && currentRole === 'admin' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#0F2F2B]">ตั้งค่าระบบและ AI ชีวมิติ (System Settings)</h3>
                  <p className="text-xs text-slate-500">
                    ควบคุมการตั้งค่าระบบ AI สแกนใบหน้า, AI กายภาพบำบัดชีวกลศาสตร์, เสียงแนะนำ และการเชื่อมต่อ
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsResetSettingsOpen(true)}
                    className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    รีเซ็ตเป็นค่าเริ่มต้น
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="px-5 py-2 rounded-full bg-[#10B981] text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition cursor-pointer flex items-center gap-1.5 disabled:bg-emerald-300"
                  >
                    {isSavingSettings ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <span>บันทึกการตั้งค่า</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Settings Card Sections */}
              <div className="space-y-5">
                {/* 1. AI Face Recognition & Liveness */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-50 pb-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm text-[#0F2F2B]">1. ระบบ AI สแกนใบหน้าและชีวมิติ (Face Recognition & Liveness)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>เกณฑ์ความคล้ายคลึงใบหน้า (Cosine Similarity):</span>
                        <span className="text-emerald-700 font-bold">{localAiSettings.similarityThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min={0.7}
                        max={0.95}
                        step={0.01}
                        value={localAiSettings.similarityThreshold}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, similarityThreshold: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[#10B981]"
                      />
                      <span className="text-[11px] text-slate-400">เกณฑ์แนะนำ: 0.80 (ช่วงปลอดภัย 0.78–0.85 ป้องกันคนหน้าคล้าย)</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>เกณฑ์แยกความต่าง (Top-1 / Top-2 Margin):</span>
                        <span className="text-emerald-700 font-bold">{localAiSettings.marginThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min={0.03}
                        max={0.15}
                        step={0.01}
                        value={localAiSettings.marginThreshold}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, marginThreshold: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[#10B981]"
                      />
                      <span className="text-[11px] text-slate-400">ป้องกันความสับสนระหว่างคนไข้ที่มีโครงหน้าคล้ายกัน</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">โหมดตรวจจับการมีชีวิต (Liveness Verification)</div>
                      <div className="text-slate-500 text-[11px]">บังคับตรวจจับการมีชีวิต (กระพริบตา, หันศีรษะ, หรืออ้าปาก) ป้องกันรูปถ่าย</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localAiSettings.strictLivenessChallenge}
                      onChange={(e) =>
                        setLocalAiSettings({ ...localAiSettings, strictLivenessChallenge: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. AI Physiotherapy Biomechanics */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-50 pb-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm text-[#0F2F2B]">2. ระบบ AI ตรวจจับท่ากายภาพและชีวกลศาสตร์ (Pose Biomechanics Engine)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>เกณฑ์ความเชื่อมั่นโมเดลท่าทาง (Pose Confidence):</span>
                        <span className="text-emerald-700 font-bold">{localAiSettings.poseConfidenceThreshold ?? 0.65}</span>
                      </div>
                      <input
                        type="range"
                        min={0.50}
                        max={0.90}
                        step={0.05}
                        value={localAiSettings.poseConfidenceThreshold ?? 0.65}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, poseConfidenceThreshold: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[#10B981]"
                      />
                      <span className="text-[11px] text-slate-400">เกณฑ์มาตรฐานที่แนะนำ: 0.65 (pose_landmarker_full)</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>เกณฑ์ความชัดเจนข้อต่อ (Landmark Visibility):</span>
                        <span className="text-emerald-700 font-bold">{localAiSettings.minVisibilityThreshold ?? 0.55}</span>
                      </div>
                      <input
                        type="range"
                        min={0.35}
                        max={0.80}
                        step={0.05}
                        value={localAiSettings.minVisibilityThreshold ?? 0.55}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, minVisibilityThreshold: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[#10B981]"
                      />
                      <span className="text-[11px] text-slate-400">เกณฑ์มาตรฐานที่แนะนำ: 0.55 (ไม่นับมุมถ้ามองไม่เห็นชัดเจน)</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>ความคลาดเคลื่อนมุมเป้าหมาย (ROM Tolerance):</span>
                        <span className="text-emerald-700 font-bold">{localAiSettings.toleranceDeg ?? 10}°</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={15}
                        step={1}
                        value={localAiSettings.toleranceDeg ?? 10}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, toleranceDeg: parseInt(e.target.value) })
                        }
                        className="w-full accent-[#10B981]"
                      />
                      <span className="text-[11px] text-slate-400">เกณฑ์มาตรฐานที่แนะนำ: 8–10° เพื่อความแม่นยำทางกายภาพ</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>มุมเอียงชดเชยลำตัวสูงสุด (Max Trunk Lean Angle):</span>
                        <span className="text-emerald-700 font-bold">{localAiSettings.maxTrunkLeanDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={35}
                        step={1}
                        value={localAiSettings.maxTrunkLeanDeg}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, maxTrunkLeanDeg: parseInt(e.target.value) })
                        }
                        className="w-full accent-[#10B981]"
                      />
                      <span className="text-[11px] text-slate-400">หากเอียงลำตัวเกินนี้ ระบบจะแจ้งเตือนว่าโกงท่า</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>ความเร็วการเคลื่อนไหวสูงสุด (Max Velocity):</span>
                        <span className="text-emerald-700 font-bold">{localAiSettings.maxVelocityDegPerSec}°/วินาที</span>
                      </div>
                      <input
                        type="range"
                        min={120}
                        max={360}
                        step={10}
                        value={localAiSettings.maxVelocityDegPerSec}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, maxVelocityDegPerSec: parseInt(e.target.value) })
                        }
                        className="w-full accent-[#10B981]"
                      />
                      <span className="text-[11px] text-slate-400">ป้องกันการสะบัดแขนหรือกระตุกข้อต่อเร็วเกินไปจนบาดเจ็บ</span>
                    </div>
                  </div>
                </div>

                {/* 3. Audio & Voice Guidance & Cloud Sync */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center gap-2 border-b border-emerald-50 pb-2">
                    <Sliders className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm text-[#0F2F2B]">3. ระบบเสียงและการซิงค์ข้อมูลแม่ข่าย (Voice & Server Sync)</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">เสียงผู้ช่วย AI แนะนำท่าทางภาษาไทย (Voice Guidance)</div>
                        <div className="text-slate-500 text-[11px]">ออกเสียงนับจำนวนครั้งและเตือนความปลอดภัยระหว่างคนไข้ทำท่า</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localAiSettings.enableVoiceGuidance}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, enableVoiceGuidance: e.target.checked })
                        }
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-50">
                      <div>
                        <div className="font-bold text-slate-800">ซิงค์เวชระเบียนโรงพยาบาลอัตโนมัติ (HIS Cloud Sync)</div>
                        <div className="text-slate-500 text-[11px]">อัปเดตสถิติผลการรักษาขึ้นระบบแม่ข่ายส่วนกลาง</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localAiSettings.enableAutoSync}
                        onChange={(e) =>
                          setLocalAiSettings({ ...localAiSettings, enableAutoSync: e.target.checked })
                        }
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
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
      {/* 4. ADD USER MODAL (Tab 1: users)                                     */}
      {/* ==================================================================== */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        currentRole={currentRole}
        currentUserId={currentUserId}
        currentUserName={currentUser?.name || 'กภ. ธนากร วงศ์สวัสดิ์'}
        therapists={therapists}
        existingUsers={users}
        onSubmitUser={handleAddUser}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 5. EDIT USER MODAL (Tab 1: users)                                    */}
      {/* ==================================================================== */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        currentRole={currentRole}
        currentUserId={currentUserId}
        currentUserName={currentUser?.name || 'กภ. ธนากร วงศ์สวัสดิ์'}
        therapists={therapists}
        existingUsers={users}
        onSubmitUser={handleEditUser}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 6. CHANGE PASSWORD MODAL (Tab 1: users)                              */}
      {/* ==================================================================== */}
      <ChangePasswordModal
        isOpen={!!editingPasswordUser}
        onClose={() => setEditingPasswordUser(null)}
        user={editingPasswordUser}
        onSavePassword={(userId, newPassword) => {
          resetUserPassword(userId, newPassword);
        }}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 7. DELETE USER CONFIRMATION MODAL (Tab 1: users)                     */}
      {/* ==================================================================== */}
      <DeleteUserModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        user={deletingUser}
        currentRole={currentRole}
        currentUserId={currentUserId}
        onConfirmDelete={(userId) => {
          deleteUser(userId);
        }}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 8. VIEW & EDIT PATIENT CLINICAL DATA MODAL (Tab 2: patients)         */}
      {/* ==================================================================== */}
      <EditPatientModal
        isOpen={!!patientDetailModal}
        onClose={() => setPatientDetailModal(null)}
        patient={patientDetailModal}
        therapists={therapists}
        currentRole={currentRole}
        currentUserId={currentUserId}
        currentUserName={currentUser?.name || 'เจ้าหน้าที่'}
        canEdit={patientDetailModal ? canEditUser(patientDetailModal) : false}
        onSavePatient={(patientId, data) => {
          updateUser(patientId, data);
        }}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 9. EDIT THERAPIST MODAL (Tab 3: therapists)                          */}
      {/* ==================================================================== */}
      <EditTherapistModal
        isOpen={!!editingTherapist}
        onClose={() => setEditingTherapist(null)}
        therapist={editingTherapist}
        allPatients={users}
        currentRole={currentRole}
        currentUserId={currentUserId}
        currentUserName={currentUser?.name || 'เจ้าหน้าที่'}
        canEdit={editingTherapist ? canEditTherapist(editingTherapist) : false}
        onSaveTherapist={(therapistId, data) => {
          updateTherapist(therapistId, data);
        }}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 10. ADD THERAPIST MODAL (Admin only)                                 */}
      {/* ==================================================================== */}
      {isAddTherapistOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2F2B]/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsAddTherapistOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-emerald-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <h4 className="font-bold text-base text-[#0F2F2B]">เพิ่มนักกายภาพบำบัดใหม่</h4>
              <button
                onClick={() => setIsAddTherapistOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTherapistSubmit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">ชื่อ-นามสกุล (เช่น กภ. สุภาพร มั่งคั่ง):</label>
                <input
                  type="text"
                  value={newTherapistForm.name}
                  onChange={(e) => setNewTherapistForm({ ...newTherapistForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-sm font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ความเชี่ยวชาญ:</label>
                <input
                  type="text"
                  value={newTherapistForm.specialty}
                  onChange={(e) => setNewTherapistForm({ ...newTherapistForm, specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">เบอร์โทรศัพท์:</label>
                  <input
                    type="text"
                    value={newTherapistForm.phone}
                    onChange={(e) => setNewTherapistForm({ ...newTherapistForm, phone: e.target.value })}
                    placeholder="08x-xxx-xxxx"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">เลขที่ใบประกอบวิชาชีพ:</label>
                  <input
                    type="text"
                    value={newTherapistForm.licenseNumber}
                    onChange={(e) => setNewTherapistForm({ ...newTherapistForm, licenseNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ประวัติส่วนตัว & การศึกษา:</label>
                <textarea
                  rows={2}
                  value={newTherapistForm.bio}
                  onChange={(e) => setNewTherapistForm({ ...newTherapistForm, bio: e.target.value })}
                  placeholder="ประวัติการศึกษาและการทำงาน..."
                  className="w-full p-3 rounded-2xl border border-emerald-200 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsAddTherapistOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#10B981] text-white font-bold shadow-md hover:bg-emerald-600 transition cursor-pointer"
                >
                  ยืนยันเพิ่ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 11. ADD EXERCISE MODAL (Tab 4: exercises)                            */}
      {/* ==================================================================== */}
      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSubmitExercise={addExercise}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 12. EDIT EXERCISE MODAL (Tab 4: exercises)                           */}
      {/* ==================================================================== */}
      <EditExerciseModal
        isOpen={!!editingExercise}
        onClose={() => setEditingExercise(null)}
        exercise={editingExercise}
        onUpdateExercise={updateExercise}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 13. DELETE EXERCISE CONFIRMATION MODAL (Tab 4: exercises)            */}
      {/* ==================================================================== */}
      <DeleteExerciseModal
        isOpen={!!deletingExercise}
        onClose={() => setDeletingExercise(null)}
        exercise={deletingExercise}
        onConfirmDelete={deleteExercise}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 14. BANNED MANAGEMENT MODAL (Tab 5: logs)                            */}
      {/* ==================================================================== */}
      <BannedManagementModal
        isOpen={isBannedManagementOpen}
        onClose={() => setIsBannedManagementOpen(false)}
        bannedDevices={bannedDevices}
        bannedIps={bannedIps}
        onUnbanDevice={unbanDevice}
        onBanDevice={banDevice}
        onUnbanIp={unbanIp}
        onBanIp={banIp}
        onSuccessToast={showToast}
      />

      {/* ==================================================================== */}
      {/* 15. CONFIRM KICK SESSION MODAL (Tab 5: logs)                         */}
      {/* ==================================================================== */}
      <ConfirmActionModal
        isOpen={Boolean(confirmKickLog)}
        onClose={() => setConfirmKickLog(null)}
        title="เตะผู้ใช้ออกจากระบบ"
        message="ต้องการเตะผู้ใช้ออกจากระบบใช่หรือไม่?"
        detail={
          confirmKickLog ? (
            <div className="space-y-1">
              <div><strong className="text-slate-800">ผู้ใช้:</strong> {confirmKickLog.userName} ({confirmKickLog.role})</div>
              <div><strong className="text-slate-800">การกระทำ:</strong> {confirmKickLog.action}</div>
              <div><strong className="text-slate-800">อุปกรณ์/IP:</strong> {confirmKickLog.device || 'Windows 11'} ({confirmKickLog.ipAddress || '192.168.1.100'})</div>
              <div><strong className="text-slate-800">เวลา:</strong> {confirmKickLog.timestamp}</div>
            </div>
          ) : undefined
        }
        confirmLabel="ยืนยันการเตะออก"
        variant="warning"
        iconType="kick"
        onConfirm={() => {
          if (confirmKickLog) {
            kickSession(confirmKickLog.id);
            setKickedLogIds((prev) => [...prev, confirmKickLog.id]);
            showToast('เตะออกเรียบร้อยแล้ว');
          }
        }}
      />

      {/* ==================================================================== */}
      {/* 16. CONFIRM BAN DEVICE MODAL (Tab 5: logs)                           */}
      {/* ==================================================================== */}
      <ConfirmActionModal
        isOpen={Boolean(confirmBanDevice)}
        onClose={() => setConfirmBanDevice(null)}
        title="ยืนยันการแบนอุปกรณ์"
        message="ต้องการแบนเครื่องอุปกรณ์นี้ใช่หรือไม่?"
        detail={
          confirmBanDevice ? (
            <div>
              <strong className="text-slate-800">ข้อมูลอุปกรณ์ที่จะแบน:</strong>
              <div className="font-mono text-rose-700 font-bold mt-0.5">{confirmBanDevice}</div>
            </div>
          ) : undefined
        }
        confirmLabel="ยืนยันการแบนเครื่อง"
        variant="danger"
        iconType="ban"
        onConfirm={() => {
          if (confirmBanDevice) {
            banDevice(confirmBanDevice);
            showToast('แบนเครื่องเรียบร้อยแล้ว');
          }
        }}
      />

      {/* ==================================================================== */}
      {/* 17. CONFIRM BAN IP MODAL (Tab 5: logs)                               */}
      {/* ==================================================================== */}
      <ConfirmActionModal
        isOpen={Boolean(confirmBanIp)}
        onClose={() => setConfirmBanIp(null)}
        title="ยืนยันการแบน IP Address"
        message="ต้องการแบนที่อยู่ IP นี้ใช่หรือไม่?"
        detail={
          confirmBanIp ? (
            <div>
              <strong className="text-slate-800">IP Address ที่จะแบน:</strong>
              <div className="font-mono text-rose-700 font-bold mt-0.5">{confirmBanIp}</div>
            </div>
          ) : undefined
        }
        confirmLabel="ยืนยันการแบน IP"
        variant="danger"
        iconType="ban"
        onConfirm={() => {
          if (confirmBanIp) {
            banIp(confirmBanIp);
            showToast('แบน IP เรียบร้อยแล้ว');
          }
        }}
      />

      {/* ==================================================================== */}
      {/* 18. CONFIRM RESET SETTINGS MODAL (Tab 6: settings)                   */}
      {/* ==================================================================== */}
      <ConfirmActionModal
        isOpen={isResetSettingsOpen}
        onClose={() => setIsResetSettingsOpen(false)}
        title="รีเซ็ตการตั้งค่าระบบ"
        message="ต้องการรีเซ็ตการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?"
        detail="การตั้งค่าระบบ AI ชีวมิติ ค่าเกณฑ์ความปลอดภัยของท่าทาง และเสียงแนะนำทั้งหมดจะถูกปรับกลับเป็นมาตรฐานเริ่มต้นทางการแพทย์"
        confirmLabel="ยืนยันการรีเซ็ต"
        variant="warning"
        iconType="reset"
        onConfirm={handleResetSettingsConfirm}
      />
    </div>
  );
};
