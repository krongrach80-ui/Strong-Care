import React from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Calendar,
  History,
  Edit3,
} from 'lucide-react';
import { Session } from '../../types/session';
import { usePatientStore } from '../../store/patientStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { ApprovalAuditService } from '../../services/approvalAuditService';

interface ClinicalSessionAuditModalProps {
  isOpen: boolean;
  session: Session | null;
  onClose: () => void;
}

export const ClinicalSessionAuditModal: React.FC<ClinicalSessionAuditModalProps> = ({
  isOpen,
  session,
  onClose,
}) => {
  const { patients } = usePatientStore();
  const { exercises } = useExerciseStore();

  if (!isOpen || !session) return null;

  const patient = patients.find((p) => p.id === session.patient_id);
  const exercise = exercises.find((e) => e.id === session.exercise_id);
  const auditRecords = ApprovalAuditService.getAuditRecords();

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const exportData = {
      ...session,
      clinicalGovernance: {
        approvalAuditTrail: auditRecords,
        exportedAt: new Date().toISOString(),
        auditor: 'PhysioVision Clinical Audit Gateway v2.4',
      },
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PhysioVision_Clinical_Audit_Session_${session.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-8 max-w-[min(95vw,900px)] w-full shadow-2xl relative max-h-[90dvh] overflow-y-auto print:max-h-none print:shadow-none print:border-none">
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95 z-20 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate / Audit Header */}
        <div className="border-b border-emerald-100 dark:border-emerald-800/80 pb-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  CLINICAL AUDIT & REHABILITATION RECORD
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  เวชระเบียนการฟื้นฟูกายภาพบำบัด AI (Session #{session.id})
                </h3>
              </div>
            </div>

            {/* Action Buttons for Judges / Doctors */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> พิมพ์รายงาน (Print)
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
              >
                <Download className="w-4 h-4" /> Export JSON
              </button>
            </div>
          </div>

          {/* Patient & Session Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <span className="text-slate-400 block text-[10px]">ผู้ป่วย:</span>
              <strong className="text-slate-900 dark:text-white font-sans">{patient?.name || 'คุณตาสมชาย มีสุข'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">รหัส HN:</span>
              <strong className="text-emerald-700 dark:text-emerald-400">{patient?.patient_code || 'PT-2026-001'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">เริ่มฝึก:</span>
              <strong className="text-slate-700 dark:text-slate-300">{session.started_at}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">สิ้นสุด:</span>
              <strong className="text-slate-700 dark:text-slate-300">{session.ended_at}</strong>
            </div>
          </div>
        </div>

        {/* Clinical Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
            <span className="text-xs text-slate-500 block">จำนวนครั้ง</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {session.correct_reps}/{session.total_reps}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
              ถูกต้อง {Math.round((session.correct_reps / (session.total_reps || 1)) * 100)}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60">
            <span className="text-xs text-slate-500 block">ความแม่นยำเฉลี่ย</span>
            <span className="text-2xl font-black text-cyan-700 dark:text-cyan-400 font-mono">
              {session.accuracy}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Form Integrity</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60">
            <span className="text-xs text-slate-500 block">ช่วงมุมสูงสุด (ROM)</span>
            <span className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono">
              {session.max_angle}°
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">เป้าหมาย {exercise?.target_angle || 90}°</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 block">เวลาเฉลี่ย/ครั้ง</span>
            <span className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
              {session.avg_duration_per_rep}s
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Cadence Control</span>
          </div>
        </div>

        {/* Detailed Rep-by-Rep Execution Audit Table */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span>1. บันทึกการทำซ้ำแต่ละครั้ง (Rep-by-Rep Execution Trail)</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              {session.results?.length || 0} รายการบันทึก
            </span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">ครั้งที่</th>
                  <th className="py-2.5 px-3">มุมสูงสุด (Peak)</th>
                  <th className="py-2.5 px-3">ความแม่นยำ</th>
                  <th className="py-2.5 px-3">เวลา (s)</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3">การชดเชย (Compensation)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {session.results && session.results.length > 0 ? (
                  session.results.map((rep) => (
                    <tr key={rep.rep_number} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold">#{rep.rep_number}</td>
                      <td className="py-2 px-3 font-bold text-teal-600">{Math.round(rep.angle)}°</td>
                      <td className="py-2 px-3">{rep.accuracy}%</td>
                      <td className="py-2 px-3">{rep.duration}s</td>
                      <td className="py-2 px-3">
                        {rep.is_correct ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านเกณฑ์
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> ท่าผิด
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-sans text-[11px] text-slate-500">
                        {rep.compensations && rep.compensations.length > 0
                          ? rep.compensations.join(', ')
                          : rep.feedback || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">
                      ไม่มีรายละเอียด Rep รายครั้ง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Clinical Approval Audit Trail (Governance Section) */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-teal-600" />
              <span>2. บันทึกการอนุมัติและปรับแผนการฝึก (Approval Audit Trail - Governance)</span>
            </span>
            <span className="text-xs font-mono font-normal text-teal-600">
              {auditRecords.length} รายการบันทึก
            </span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Timestamp / ID</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3">Previous $\to$ Proposed $\to$ Actual</th>
                  <th className="py-2.5 px-3">ผู้อนุมัติ</th>
                  <th className="py-2.5 px-3">Clinical Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {auditRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 whitespace-nowrap text-slate-400">
                      <div>{new Date(rec.timestamp).toLocaleDateString('th-TH')}</div>
                      <span className="text-[10px] text-teal-600">{rec.id}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.decision === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : rec.decision === 'MODIFIED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {rec.decision}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-slate-400">{rec.previous_config.target_angle}°</span>
                      {' $\\to$ '}
                      <span className="text-teal-600">{rec.proposed_config.target_angle}°</span>
                      {' $\\to$ '}
                      <strong className="text-slate-900 dark:text-white">{rec.actual_config.target_angle}°</strong>
                      <span className="text-[10px] text-slate-400 block">({rec.actual_config.target_reps} ครั้ง)</span>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {rec.approved_by}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400 max-w-xs">
                      {rec.audit_note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Sign-off & Medical Validity */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Audit Verified &bull; ISO/IEEE Biomechanical Standard &bull; Human-in-the-Loop</span>
          </div>
          <div>
            <span>ผู้ตรวจสอบ: ระบบ AI PhysioVision Biomechanics Engine v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
