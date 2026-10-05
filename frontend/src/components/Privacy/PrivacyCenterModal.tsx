import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  EyeOff,
  CloudOff,
  Database,
  FileText,
  FileCheck
} from 'lucide-react';
import { IndexedDBStorageService } from '../../services/indexedDbService';
import { usePatientStore } from '../../store/patientStore';

interface PrivacyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyCenterModal: React.FC<PrivacyCenterModalProps> = ({ isOpen, onClose }) => {
  const { selectedPatient } = usePatientStore();
  const [purgeSuccess, setPurgeSuccess] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDeleteBiometrics = async () => {
    if (
      window.confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลชีวมิติและเวกเตอร์ใบหน้าทั้งหมดออกจากเครื่องนี้? การกระทำนี้ไม่สามารถย้อนกลับได้'
      )
    ) {
      try {
        const db = await IndexedDBStorageService.getDB();
        const tx = db.transaction(['face_metadata'], 'readwrite');
        tx.objectStore('face_metadata').clear();
        setPurgeSuccess(true);
        setTimeout(() => setPurgeSuccess(false), 3500);
      } catch (err) {
        console.error('Failed to purge biometrics:', err);
      }
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      system: 'Strong Care v1.0',
      concept: 'Privacy-oriented / Privacy by Design',
      exportedAt: new Date().toISOString(),
      patient: {
        code: selectedPatient?.patient_code || 'SC-PT-001',
        name: selectedPatient?.name || 'คุณสมชาย มีสุข',
        age: selectedPatient?.age || 68,
      },
      privacyManifest: {
        faceImageStored: false,
        faceEmbeddingEncrypted: true,
        cameraProcessing: '100% Local Device (Edge AI)',
        cloudVideoUpload: 'Disabled',
        dataSync: 'Session Summary Only (Aggregated ROM/Accuracy/Reps)',
      },
      sampleSessions: [
        {
          sessionId: 'SES-001',
          date: '2026-10-01',
          exercise: 'Shoulder Raise',
          maxRomDeg: 98,
          accuracyPct: 88,
          safetyViolations: 0,
        },
        {
          sessionId: 'SES-002',
          date: '2026-10-03',
          exercise: 'Shoulder Raise',
          maxRomDeg: 104,
          accuracyPct: 91,
          safetyViolations: 0,
        },
        {
          sessionId: 'SES-003',
          date: '2026-10-05',
          exercise: 'Shoulder Raise',
          maxRomDeg: 108,
          accuracyPct: 94,
          safetyViolations: 0,
        },
      ],
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `strongcare-patient-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-8 max-w-[min(95vw,680px)] w-full shadow-2xl relative max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                PRIVACY-BY-DESIGN ARCHITECTURE
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">Zero Cloud Video</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span>🔐 Privacy Center</span>
            </h2>
          </div>
        </div>

        {/* Privacy by Design Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5 mb-6">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>หลักการออกแบบเชิงสถาปัตยกรรม (Privacy-Oriented / Privacy by Design)</span>
          </div>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
            ระบบออกแบบเพื่อปกป้องข้อมูลชีวมิติของผู้ป่วยตั้งแต่ระดับรากฐาน ทุกการตรวจจับใบหน้าและวิเคราะห์กระดูกข้อต่อทำงานบนหน่วยประมวลผลของเครื่องผู้ใช้ (Client-Side Edge AI) โดยไม่มีการบันทึกภาพถ่ายดิบหรืออัปโหลดวิดีโอขึ้นคลาวด์
          </p>
        </div>

        {/* 5 Core Privacy Badges Grid (Exact as requested) */}
        <div className="space-y-3 mb-6">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
            สถานะความปลอดภัยและการคุ้มครองข้อมูล (Privacy Status)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {/* 1. Face Image */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span className="font-sans font-bold text-slate-800 dark:text-slate-200">Face Image</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                ● Not Stored
              </span>
            </div>

            {/* 2. Face Embedding */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-teal-600" />
                <span className="font-sans font-bold text-slate-800 dark:text-slate-200">Face Embedding</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-100 text-teal-800 border border-teal-300">
                ● Encrypted
              </span>
            </div>

            {/* 3. Camera Processing */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="font-sans font-bold text-slate-800 dark:text-slate-200">Camera Processing</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                ● Local Device
              </span>
            </div>

            {/* 4. Cloud Video Upload */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CloudOff className="w-4 h-4 text-purple-600" />
                <span className="font-sans font-bold text-slate-800 dark:text-slate-200">Cloud Video Upload</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                ● Disabled
              </span>
            </div>

            {/* 5. Data Sync (Span 2) */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between sm:col-span-2">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="font-sans font-bold text-slate-800 dark:text-slate-200">Data Sync</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                ● Session Summary Only
              </span>
            </div>
          </div>
        </div>

        {/* Action Notifications */}
        {purgeSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ลบข้อมูลเวกเตอร์ชีวมิติใบหน้าออกจากอุปกรณ์เรียบร้อยแล้ว</span>
          </div>
        )}

        {exportSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-teal-100 border border-teal-300 text-teal-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <span>ส่งออกไฟล์ข้อมูลสรุป (JSON Data Export) เรียบร้อยแล้ว</span>
          </div>
        )}

        {/* Action Buttons: Delete Biometric Data & Export My Data */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDeleteBiometrics}
            className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs transition active:scale-95 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>[ Delete Biometric Data ]</span>
          </button>

          <button
            type="button"
            onClick={handleExportData}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>[ Export My Data ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
