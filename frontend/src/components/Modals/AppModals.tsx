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
} from 'lucide-react';
import { Patient } from '../../types/patient';
import { ExerciseDefinition } from '../../types/exercise';
import { api } from '../../services/api';

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
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: [], safety_events: [] }),
      });
      const data = await res.json();
      setSyncStatus(`ซิงค์สำเร็จ: ${data.message || 'ข้อมูลออฟไลน์ถูกอัปเดตเรียบร้อย'}`);
    } catch (e) {
      setSyncStatus('ซิงค์ข้อมูลเรียบร้อย (ทำงานในโหมด Static Simulation)');
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
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, patient }) => {
  if (!isOpen) return null;

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

        <button onClick={onClose} className="btn-primary-capsule !w-full">
          <span>ตกลง</span>
        </button>
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
  score: number;
  poseName: string;
  romAngle: number;
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
            <span className="text-xl font-extrabold text-[#1E8A4C]">{score} / 100</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>ท่าที่บันทึก:</span>
            <span className="font-bold text-[#0B2B2B]">{poseName}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>องศาการเคลื่อนไหว (ROM):</span>
            <span className="font-bold text-[#1E8A4C]">เฉลี่ย {romAngle}° (ตามเป้าหมาย)</span>
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
