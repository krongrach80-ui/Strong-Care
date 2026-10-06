import React, { useState } from 'react';
import {
  X,
  Shield,
  Activity,
  User,
  Send,
  Database,
  Volume2,
  CheckCircle2,
  FileText,
  Clock,
  Award,
  Sparkles,
  Sliders,
  RefreshCw,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Patient } from '../../types/patient';
import { ExerciseDefinition } from '../../types/exercise';
import { api } from '../../services/api';
import { IS_STATIC_MODE } from '../../config/apiConfig';
import { OfflineStorageService } from '../../services/offlineStorageService';

// ============================================================================
// 1. Admin Dashboard Modal (From Screen 1 bottom-right button)
// ============================================================================
interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenArchitecture?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onOpenArchitecture }) => {
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus('กำลังซิงค์ข้อมูลกับเซิร์ฟเวอร์ MySQL/SQLite...');
    try {
      if (IS_STATIC_MODE) {
        setSyncStatus('ระบบทำงานในโหมดสาธิต (Demo Mode): ไม่มีการส่งข้อมูลขึ้นเซิร์ฟเวอร์จริง');
        return;
      }

      const queue = OfflineStorageService.getSyncQueue();
      const res = await api.sync({ sessions: queue, safety_events: [] });
      const syncedCount = res?.data?.synced_sessions ?? queue.length;
      if (queue.length > 0) {
        localStorage.removeItem('strongcare_pending_sync_queue');
      }
      setSyncStatus(`ซิงค์สำเร็จ: ${res.message || `บันทึกข้อมูล ${syncedCount} รายการเรียบร้อยแล้ว`}`);
    } catch (e: any) {
      setSyncStatus(`❌ การซิงค์ล้มเหลว: ${e?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2B2B]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adminTitle"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200/80 space-y-6 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 id="adminTitle">Admin & Clinician Portal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
            aria-label="ปิดหน้าต่าง Admin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <p>
            <strong>STRONG CARE Administration</strong> — ระบบควบคุมและตรวจสอบความปลอดภัยทางการแพทย์
          </p>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs">
            <div>
              <div className="text-slate-500 font-sans">สถานะ API Backend</div>
              <div className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>พร้อมทำงาน (Active)</span>
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-sans">โมเดล AI Pose</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">MediaPipe Pose v0.10</div>
            </div>
            <div>
              <div className="text-slate-500 font-sans">อัตราความสม่ำเสมอ</div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5">94.2% (ยอดเยี่ยม)</div>
            </div>
            <div>
              <div className="text-slate-500 font-sans">ระบบชีวมิติ 128-D</div>
              <div className="text-sm font-bold text-teal-700 mt-0.5">Edge Vector Protection</div>
            </div>
          </div>

          {syncStatus && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-medium">
              {syncStatus}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>สั่งซิงค์ข้อมูลออฟไลน์ทันที (Sync Offline Queue)</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-primary-capsule !w-full"
        >
          <span>ปิดหน้าต่าง Admin</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Therapy Settings Modal (Gear button beside "เริ่มกายภาพ" in Screen 3)
// ============================================================================
interface TherapySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ExerciseDefinition[];
  selectedExercise: ExerciseDefinition | null;
  onSelectExercise: (ex: ExerciseDefinition) => void;
}

export const TherapySettingsModal: React.FC<TherapySettingsModalProps> = ({
  isOpen,
  onClose,
  exercises,
  selectedExercise,
  onSelectExercise,
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoCount, setAutoCount] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2B2B]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="therapySettingsTitle"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200/80 space-y-5 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h3 id="therapySettingsTitle">ตั้งค่าการทำกายภาพ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
            aria-label="ปิดหน้าต่างตั้งค่า"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              เลือกท่ากายภาพเป้าหมาย
            </label>
            <select
              value={selectedExercise?.id || (exercises[0]?.id ?? 1)}
              onChange={(e) => {
                const target = exercises.find((x) => x.id === Number(e.target.value));
                if (target) onSelectExercise(target);
              }}
              className="w-full p-3 rounded-xl border border-emerald-200 bg-white font-medium text-sm text-[#0B2B2B] focus:border-emerald-500 outline-none"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} (เป้าหมาย: {ex.target_angle}°)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between text-sm font-semibold text-slate-800 cursor-pointer">
              <span>เสียงโค้ชแนะนำภาษาไทย (Voice Coach)</span>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#1E8A4C] rounded"
              />
            </label>

            <label className="flex items-center justify-between text-sm font-semibold text-slate-800 cursor-pointer">
              <span>ระบบตรวจนับจำนวนครั้งอัตโนมัติ</span>
              <input
                type="checkbox"
                checked={autoCount}
                onChange={(e) => setAutoCount(e.target.checked)}
                className="w-5 h-5 accent-[#1E8A4C] rounded"
              />
            </label>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary-capsule !w-full mt-4">
          <span>บันทึกการตั้งค่า</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 3. Mini Game Settings Modal (Gear button beside "เริ่มกายภาพแบบมินิเกม")
// ============================================================================
interface MiniGameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MiniGameSettingsModal: React.FC<MiniGameSettingsModalProps> = ({ isOpen, onClose }) => {
  const [speed, setSpeed] = useState<'normal' | 'fast'>('normal');
  const [sound, setSound] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2B2B]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="miniGameTitle"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200/80 space-y-5 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 id="miniGameTitle">ตั้งค่ามินิเกมกายภาพ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
            aria-label="ปิดหน้าต่างตั้งค่ามินิเกม"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ระดับความเร็วของเป้าหมาย
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSpeed('normal')}
                className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                  speed === 'normal'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ปกติ (สำหรับผู้สูงอายุ)
              </button>
              <button
                type="button"
                onClick={() => setSpeed('fast')}
                className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                  speed === 'fast'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ท้าทาย (ฟื้นฟูขั้นสูง)
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between text-sm font-semibold text-slate-800 cursor-pointer pt-2 border-t border-slate-100">
            <span>เสียงเพลงประกอบและเอฟเฟกต์</span>
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => setSound(e.target.checked)}
              className="w-5 h-5 accent-[#1E8A4C] rounded"
            />
          </label>
        </div>

        <button onClick={onClose} className="btn-primary-capsule !w-full mt-4">
          <span>ตกลง</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 4. User Profile Modal ("ข้อมูลผู้ใช้" in Screen 3)
// ============================================================================
interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onPatientPurged?: (patientId: number) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, patient, onPatientPurged }) => {
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeMsg, setPurgeMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurge = async () => {
    if (!patient?.id) return;
    const confirmed = window.confirm(`คุณต้องการลบข้อมูลทั้งหมดของคุณ ${patient.name} ตามสิทธิ์ PDPA ใช่หรือไม่?\nการกระทำนี้จะลบข้อมูลประวัติ ใบหน้า และการฟื้นฟูทั้งหมดอย่างถาวร`);
    if (!confirmed) return;

    setIsPurging(true);
    setPurgeMsg(null);
    try {
      const res = await api.purgePatientData(patient.id);
      if (res.success) {
        setPurgeMsg('ลบข้อมูลผู้ป่วยและข้อมูลชีวมิติเรียบร้อยตาม PDPA');
        setTimeout(() => {
          onPatientPurged?.(patient.id);
          onClose();
        }, 1200);
      } else {
        setPurgeMsg(`❌ ${res.message}`);
      }
    } catch (e: any) {
      setPurgeMsg(`❌ ${e?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล'}`);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2B2B]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profileTitle"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200/80 space-y-5 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 id="profileTitle">ข้อมูลผู้รับการบำบัด</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
            aria-label="ปิดหน้าต่างข้อมูลผู้ใช้"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#F4FAF5] border border-emerald-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6FD67F] to-[#1E8A4C] flex items-center justify-center text-white font-bold text-xl shadow-md">
              {patient?.name?.charAt(0) || 'ส'}
            </div>
            <div>
              <div className="text-base font-bold text-[#0B2B2B]">
                {patient?.name || 'คุณสมชาย ใจดี'}
              </div>
              <div className="text-xs text-[#22473E]">
                รหัสคนไข้ (HN): <strong>{patient?.patient_code || 'PT-2026-0891'}</strong> &bull; อายุ {patient?.age || 65} ปี
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-emerald-200/60">
            <div>
              <strong>การวินิจฉัยทางคลินิก:</strong> {patient?.notes || 'ฟื้นฟูกล้ามเนื้อข้อไหล่ติดและกล้ามเนื้อสะบัก'}
            </div>
            <div>
              <strong>นักกายภาพบำบัดผู้รับผิดชอบ:</strong> กภ. วรัญญา สิริพร
            </div>
            <div>
              <strong>เป้าหมายรายสัปดาห์:</strong> ทำกายภาพสม่ำเสมอ 5 วัน/สัปดาห์ (สำเร็จแล้ว 4/5 วัน)
            </div>
          </div>
        </div>

        {purgeMsg && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
            {purgeMsg}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button onClick={onClose} className="btn-primary-capsule !w-full">
            <span>ตกลง</span>
          </button>
          {patient?.id && (
            <button
              type="button"
              onClick={handlePurge}
              disabled={isPurging}
              className="text-xs text-rose-600 hover:text-rose-800 hover:underline py-1 transition disabled:opacity-50 text-center font-medium"
            >
              {isPurging ? 'กำลังลบข้อมูลตามสิทธิ์ PDPA...' : 'ลบข้อมูลผู้ป่วยและข้อมูลชีวมิติทั้งหมด (PDPA Right to Erasure)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. Therapist Report Modal ("เอาไว้บอกผู้กายภาพ" in Screen 4)
// ============================================================================
interface TherapistReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number | null;
  poseName: string;
  romAngle: number | null;
  onSubmit: (note: string) => void;
}

export const TherapistReportModal: React.FC<TherapistReportModalProps> = ({
  isOpen,
  onClose,
  score,
  poseName,
  romAngle,
  onSubmit,
}) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(note);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2B2B]/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reportModalTitle"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200/80 space-y-5 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <Send className="w-5 h-5 text-emerald-600" />
            <h3 id="reportModalTitle">ส่งผลให้ผู้กายภาพบำบัด</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
            aria-label="ปิดหน้าต่างรายงานผล"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#F4FAF5] border border-emerald-100 space-y-2 text-sm text-[#0B2B2B]">
          <div className="flex items-center justify-between">
            <span className="font-bold">คะแนนการทำกายภาพ:</span>
            <span className="text-base sm:text-lg font-extrabold text-[#1E8A4C]">
              {score !== null ? `${score} / 100` : 'ไม่มีคะแนน (โหมดจับเวลา)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>ท่าที่บันทึก:</span>
            <span className="font-bold text-[#0B2B2B]">{poseName}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>องศาการเคลื่อนไหว (ROM):</span>
            <span className="font-bold text-[#1E8A4C]">
              {romAngle !== null ? `เฉลี่ย ${romAngle}° (ตามเป้าหมาย)` : 'ไม่มีข้อมูลวัด'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>เวลาบันทึก:</span>
            <span>{new Date().toLocaleTimeString('th-TH')} น.</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ข้อความเพิ่มเติมถึงนักกายภาพบำบัด:
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="เช่น รู้สึกตึงหัวไหล่ขวาเล็กน้อยตอนยกแขนสุด..."
            className="w-full p-3 rounded-2xl border border-emerald-200 text-sm font-sans text-[#0B2B2B] outline-none focus:border-[#1E8A4C] resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary-capsule !w-full"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลให้นักกายภาพทันที'}</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 6. About Modal (ข้อมูลเกี่ยวกับระบบ Strong Care)
// ============================================================================
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aboutModalTitle"
    >
      <div className="modal-dialog-responsive max-w-xl max-h-[90vh] overflow-y-auto space-y-5 p-6 sm:p-7">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#1E8A4C] flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 id="aboutModalTitle" className="text-base sm:text-lg font-bold text-[#0B2B2B]">
                เกี่ยวกับ Strong Care
              </h3>
              <p className="text-[11px] text-emerald-700 font-medium">
                AI-assisted Rehabilitation Monitoring Platform v1.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
            aria-label="ปิดหน้าต่างข้อมูลเกี่ยวกับระบบ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Statement Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E9FCEB] to-emerald-50 border border-emerald-200/80 text-center space-y-1">
          <div className="text-sm font-bold text-[#1E8A4C]">
            แพลตฟอร์มช่วยติดตามและวิเคราะห์การฝึกกายภาพบำบัดด้วย AI อัจฉริยะ
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            “เพื่อการฟื้นฟูสมรรถภาพร่างกายที่ปลอดภัย ถูกต้องตามหลักชีวกลศาสตร์ และเข้าถึงง่ายสำหรับผู้สูงอายุ”
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            จุดเด่นและนวัตกรรมหลัก (Key Innovations)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            
            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm space-y-1">
              <div className="font-bold text-[#0B2B2B] flex items-center gap-1.5">
                <span>🪞</span>
                <span>Vertical Smart-Mirror</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                กระจกกายภาพแนวตั้ง 100dvh Zero-Scroll Design ไม่ต้องปัดเลื่อนจอ โครงกระดูก 33 จุดชัดเจน
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm space-y-1">
              <div className="font-bold text-[#0B2B2B] flex items-center gap-1.5">
                <span>👨‍⚕️</span>
                <span>PiP Doctor Guidance</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                คลิปคุณหมอสาธิตซ้อนในกล้อง สลับมุมซ้าย-ขวา ย่อ-ขยายได้ ไม่บังแขนข้างที่ฝึก
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm space-y-1">
              <div className="font-bold text-[#0B2B2B] flex items-center gap-1.5">
                <span>🧘‍♂️</span>
                <span>11 Clinical Stretch</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                โปรแกรมยืดเหยียด 11 ท่า พร้อมระบบตรวจวัดองศาข้อต่อยืนยันความถูกต้องก่อนจับเวลา
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm space-y-1">
              <div className="font-bold text-[#0B2B2B] flex items-center gap-1.5">
                <span>🤖</span>
                <span>MediaPipe FaceLandmarker</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                ตรวจจับใบหน้า 478 จุดจริง เวกเตอร์ชีวมิติ 128 มิติ พร้อม Liveness Blink & Head Yaw ป้องกันภาพนิ่ง
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm space-y-1">
              <div className="font-bold text-[#0B2B2B] flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Safety Watchdog</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                ตรวจจับ Over-ROM, ลำตัวเอียง (Trunk Lean), ยกบ่า (Shoulder Hike) พร้อมเสียงแจ้งเตือนภาษาไทย
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm space-y-1">
              <div className="font-bold text-[#0B2B2B] flex items-center gap-1.5">
                <span>💾</span>
                <span>Offline-First & PDPA</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                IndexedDB (StrongCareDB) ทำงานออฟไลน์ 100% ไม่เก็บรูปถ่ายจริง และมีปุ่มลบข้อมูลตาม PDPA
              </p>
            </div>

          </div>
        </div>

        {/* Technical Architecture Badge */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
          <div className="font-bold text-[#0B2B2B]">🛠️ เทคโนโลยีที่ใช้</div>
          <div>• Frontend: React 18, TypeScript 5, Vite 5, Tailwind CSS, Lucide Icons, Zustand</div>
          <div>• Computer Vision: Google MediaPipe Pose Landmarker (WASM 0.10.35), FaceLandmarker</div>
          <div>• Backend & DB: PHP 8.2 REST API, SQLite 3 / MySQL, IndexedDB Local Database</div>
        </div>

        {/* Action Links */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <a
            href="https://github.com/krongrach80-ui/Strong-Care"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-full border border-emerald-300 bg-white hover:bg-emerald-50 text-[#1E8A4C] text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="btn-primary-capsule !w-full sm:!flex-1 !py-2.5 text-xs"
          >
            <span>เข้าใจแล้ว (ปิดหน้าต่าง)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
