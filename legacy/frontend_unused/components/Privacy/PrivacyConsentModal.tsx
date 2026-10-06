import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, ServerOff, Trash2, CheckCircle2, X, Download, ArrowRight, KeyRound } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { IndexedDBStorageService } from '../../services/indexedDbService';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ isOpen, onClose }) => {
  const { selectedPatient, fetchPatients } = usePatientStore();
  const [purged, setPurged] = useState(false);

  if (!isOpen) return null;

  const handlePurgeData = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลใบหน้าและประวัติการฝึกของผู้ป่วยรายนี้ทั้งหมดออกจากเครื่อง (Purge All Data)?')) {
      if (selectedPatient?.id) {
        await IndexedDBStorageService.purgePatientData(selectedPatient.id);
      }
      localStorage.removeItem(`physiovision_face_${selectedPatient?.id}`);
      localStorage.removeItem('physiovision_offline_sessions');
      setPurged(true);
      fetchPatients();
    }
  };

  const handleExportBiometricAudit = () => {
    const cert = {
      title: 'PhysioVision Biometric Protection & Consent Audit',
      patientId: selectedPatient?.id,
      patientCode: selectedPatient?.patient_code,
      modelVersion: 'Google MediaPipe FaceLandmarker v0.10.14 (478 Keypoints)',
      vectorDimension: 128,
      storageMethod: 'Client-Side WebAssembly (Edge AI) & Protected IndexedDB',
      rawFaceImageSaved: false,
      privacyPrinciple: 'ระบบไม่จัดเก็บภาพใบหน้าดิบ และจำกัดการจัดเก็บข้อมูลชีวมิติเท่าที่จำเป็นต่อการยืนยันตัวตน (Data Minimization)',
      encryptionAlgorithm: 'AES-GCM 256-bit (Ciphertext + 96-bit Random IV for Local Storage)',
      integrityVerification: 'SHA-256 Cryptographic Hash Fingerprint (Template Integrity Check)',
      transmittedOverInternet: false,
      timestamp: new Date().toISOString(),
      privacyDesignPrinciples: [
        'Privacy-oriented design (ออกแบบโดยคำนึงถึงหลักการคุ้มครองข้อมูลส่วนบุคคล)',
        'Client-Side Edge AI (ประมวลผลบนเครื่องผู้ใช้ 100% ไม่ส่งภาพออกภายนอก)',
        'Data Minimization (จัดเก็บเฉพาะเวกเตอร์ตัวเลข 128 มิติเท่าที่จำเป็นต่อการยืนยันตัวตน)',
        'User Consent & Right to Purge (ขอความยินยอมและให้สิทธิลบทำลายข้อมูลทันที)',
        'Access Control (ควบคุมการเข้าถึงเฉพาะเจ้าของข้อมูลและผู้ดูแล)',
      ],
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cert, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Biometric_Protection_Audit_${selectedPatient?.patient_code || 'User'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-8 max-w-[min(95vw,680px)] w-full shadow-2xl relative max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
              PRIVACY & BIOMETRIC PROTECTION
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              ความโปร่งใสและการคุ้มครองข้อมูลชีวมิติ
            </h3>
          </div>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 mb-5">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-2">
            BIOMETRIC PRIVACY ARCHITECTURE (SEPARATED ENCRYPTION & INTEGRITY)
          </span>
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono font-bold gap-1 text-slate-700 dark:text-slate-300">
            <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xs">Camera Frame</span>
            <ArrowRight className="w-3 h-3 text-emerald-500" />
            <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xs">WASM Mesh</span>
            <ArrowRight className="w-3 h-3 text-emerald-500" />
            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-lg border border-emerald-300">128-D Vector</span>
            <ArrowRight className="w-3 h-3 text-emerald-500" />
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 rounded-lg border border-indigo-200">AES-GCM Encrypt</span>
            <ArrowRight className="w-3 h-3 text-emerald-500" />
            <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xs">IndexedDB</span>
          </div>
          <div className="mt-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>หลักการจำกัดข้อมูลชีวมิติ (Data Minimization):</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-5">
              “ระบบไม่จัดเก็บภาพใบหน้าดิบ (No Raw Face Image Saved) และจำกัดการจัดเก็บข้อมูลชีวมิติเท่าที่จำเป็นต่อการยืนยันตัวตนเท่านั้น”
            </p>
          </div>
        </div>

        {/* Biometric Technical Details */}
        <div className="space-y-3 mb-6 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 space-y-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">AI Model Version:</span>
              <strong className="text-slate-800 dark:text-white">MediaPipe FaceMesh v0.10.14 (478 pts)</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Biometric Template:</span>
              <strong className="text-emerald-700 dark:text-emerald-400">128-D Normalized Vector Projection</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Confidentiality Encryption:</span>
              <strong className="text-indigo-700 dark:text-indigo-400">AES-GCM 256-bit (IV + Ciphertext)</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Integrity Verification:</span>
              <strong className="text-teal-700 dark:text-teal-400">SHA-256 Template Hash Fingerprint</strong>
            </div>
          </div>
        </div>

        {/* Export Biometric Audit & Delete/Purge Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleExportBiometricAudit}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" /> ดาวน์โหลดใบรับรอง (Audit JSON)
          </button>

          <button
            onClick={handlePurgeData}
            disabled={purged}
            className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              purged
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 shadow-xs active:scale-95'
            }`}
          >
            {purged ? <CheckCircle2 className="w-4 h-4" /> : <Trash2 className="w-4 h-4 text-rose-600" />}
            {purged ? 'ลบข้อมูลชีวมิติแล้ว' : 'ลบข้อมูลของฉัน (Right to Purge)'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition active:scale-95"
        >
          เข้าใจและยอมรับ (Accept & Close)
        </button>
      </div>
    </div>
  );
};
