import React, { useEffect, useState } from 'react';
import { usePatientStore } from '../../store/patientStore';
import { api } from '../../services/api';
import { Session } from '../../types/session';
import { Calendar, Award, CheckCircle2, Clock, Dumbbell, ChevronRight, TrendingUp, FileText } from 'lucide-react';
import { VoiceGuideButton } from '../../components/VoiceAssistant/VoiceGuideButton';
import { OfflineStorageService } from '../../services/offlineStorageService';
import { IndexedDBStorageService } from '../../services/indexedDbService';
import { ProgressComparisonCard } from '../../components/Progress/ProgressComparisonCard';
import { AdaptiveRehabEngine } from '../../services/adaptiveRehabService';
import { ClinicalSessionAuditModal } from '../../components/Audit/ClinicalSessionAuditModal';

interface HistoryPageProps {
  onNavigate: (tab: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { selectedPatient } = usePatientStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAuditSession, setSelectedAuditSession] = useState<Session | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedPatient) return;
    (async () => {
      setIsLoading(true);
      try {
        let remoteSessions: Session[] = [];
        try {
          const data = await api.getPatientHistory(selectedPatient.id);
          remoteSessions = data.sessions || [];
        } catch (err) {
          console.warn('Backend history fetch error, falling back to offline:', err);
        }

        // Merge with IndexedDB and local offline storage
        let idbSessions: Session[] = [];
        try {
          idbSessions = await IndexedDBStorageService.getSessionsForPatient(selectedPatient.id);
        } catch (e) {
          console.warn('IndexedDB sessions fetch error:', e);
        }

        const localSessions = OfflineStorageService.getLocalSessions().filter(
          (s) => s.patient_id === selectedPatient.id
        );

        const mergedMap = new Map<number, Session>();
        [...idbSessions, ...localSessions, ...remoteSessions].forEach((s) => {
          mergedMap.set(s.id, s);
        });

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );

        setSessions(merged);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedPatient]);

  const handleOpenAudit = (sess: Session) => {
    setSelectedAuditSession(sess);
    setIsAuditModalOpen(true);
  };

  const latestSession = sessions[0] || null;
  const progress = latestSession
    ? AdaptiveRehabEngine.analyzeProgress(latestSession, sessions.slice(1))
    : null;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            ประวัติการทำกายภาพบำบัด (Rehabilitation History)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ผู้ป่วย: <strong className="text-emerald-800 font-semibold">{selectedPatient?.name}</strong> ({selectedPatient?.patient_code})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <VoiceGuideButton pageId="history" label="ฟังคำอธิบายประวัติ" />
          <button
            onClick={() => onNavigate('training')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            เริ่มกายภาพรอบใหม่ (New Session)
          </button>
        </div>
      </div>

      {/* Patient Progress & Adaptive Rehabilitation Recommendation Card */}
      {progress && progress.hasPreviousSession && (
        <ProgressComparisonCard progress={progress} />
      )}

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 font-mono text-xs">กำลังโหลดประวัติการฟื้นฟู...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-emerald-100 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <Calendar className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-slate-800 font-bold text-base">ยังไม่มีประวัติการบันทึกกายภาพ</h3>
          <p className="text-xs text-slate-500">เมื่อทำกายภาพเสร็จ ระบบจะบันทึกผลและแสดงความคืบหน้าที่นี่</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="bg-white border border-emerald-100 rounded-2xl p-5 hover:border-emerald-300 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{sess.exercise_name || 'Physical Therapy Session'}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {sess.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {sess.started_at}
                    </span>
                    {sess.notes && <span className="text-slate-600 truncate max-w-xs">{sess.notes}</span>}
                  </div>
                </div>
              </div>

              {/* Stats badges & Audit Button (Responsive flex-wrap on narrow screens) */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 text-xs font-mono w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-emerald-50">
                <div className="text-left sm:text-right">
                  <div className="text-slate-400 text-[10px] font-sans">จำนวนครั้ง (Reps)</div>
                  <div className="text-sm font-bold text-slate-800">
                    {sess.correct_reps} / {sess.total_reps}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-slate-400 text-[10px] font-sans">ความแม่นยำ</div>
                  <div className="text-sm font-bold text-emerald-700">{sess.accuracy}%</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-slate-400 text-[10px] font-sans">มุมสูงสุด</div>
                  <div className="text-sm font-bold text-teal-700">{sess.max_angle ? `${Math.round(sess.max_angle)}°` : '-'}</div>
                </div>

                <button
                  onClick={() => handleOpenAudit(sess)}
                  title="เปิดดูรายงานเวชระเบียนคลินิกและ Audit Trail รายละเอียดแต่ละ Rep"
                  className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 min-h-[40px] w-full sm:w-auto justify-center"
                >
                  <FileText className="w-3.5 h-3.5" /> เวชระเบียน (Audit)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clinical Session Audit Modal */}
      <ClinicalSessionAuditModal
        isOpen={isAuditModalOpen}
        session={selectedAuditSession}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};
