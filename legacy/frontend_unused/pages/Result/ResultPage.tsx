import React, { useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { usePatientStore } from '../../store/patientStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { AngleHistoryChart } from '../../components/Charts/AngleHistoryChart';
import { AccuracyChart } from '../../components/Charts/AccuracyChart';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { VoiceGuideButton } from '../../components/VoiceAssistant/VoiceGuideButton';
import {
  Award,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  History,
  Printer,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { ProgressComparisonCard } from '../../components/Progress/ProgressComparisonCard';
import { AdaptiveRehabEngine } from '../../services/adaptiveRehabService';
import { OfflineStorageService } from '../../services/offlineStorageService';

interface ResultPageProps {
  onNavigate: (tab: string) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ onNavigate }) => {
  const { lastSavedSession, repResults, durationSeconds, resetSession } = useSessionStore();
  const { selectedPatient } = usePatientStore();
  const { selectedExercise } = useExerciseStore();

  const session = lastSavedSession;
  const results = session?.results || repResults;

  const totalReps = session?.total_reps || results.length || 0;
  const correctReps = session?.correct_reps || results.filter((r) => r.is_correct).length || 0;
  const accuracy = session?.accuracy || (results.length > 0 ? Math.round(results.reduce((a, b) => a + b.accuracy, 0) / results.length) : 0);
  const maxAngle = session?.max_angle || (results.length > 0 ? Math.max(...results.map((r) => r.angle)) : 0);
  const avgAngle = session?.avg_angle || (results.length > 0 ? Math.round(results.reduce((a, b) => a + b.angle, 0) / results.length) : 0);

  // Level 3 Voice: Automatic Spoken Result Summary for Elderly
  useEffect(() => {
    if (totalReps > 0) {
      voiceAssistant.speakResult(
        `วันนี้คุณทำได้ ${totalReps} ครั้ง ความถูกต้อง ${accuracy} เปอร์เซ็นต์ครับ ยอดเยี่ยมมากครับ`,
        { key: 'result_voice_summary' }
      );
    }
  }, [totalReps, accuracy]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute adaptive progress against previous sessions
  const historicalSessions = OfflineStorageService.getLocalSessions().filter(
    (s) => s.patient_id === selectedPatient?.id && (!session?.id || s.id !== session.id)
  );

  const progress = AdaptiveRehabEngine.analyzeProgress(
    session || {
      id: 9999,
      total_reps: totalReps,
      accuracy,
      max_angle: maxAngle,
      avg_angle: avgAngle,
      started_at: new Date().toLocaleDateString('th-TH'),
    },
    historicalSessions
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Report Header Card */}
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-100 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-700 shadow-md shadow-emerald-500/10">
              <FileCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-emerald-700 tracking-wider uppercase">
                PHYSIOTHERAPY CLINICAL REPORT
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                รายงานผลการทำกายภาพบำบัด
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VoiceGuideButton
              pageId="result"
              context={{ reps: totalReps, accuracy }}
              label="ฟังผลลัพธ์ด้วยเสียง"
            />
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-slate-700 hover:bg-emerald-50 font-medium text-xs flex items-center gap-2 transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-emerald-600" /> พิมพ์รายงาน (Print)
            </button>
            <button
              onClick={() => {
                resetSession();
                onNavigate('training');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
            >
              <RotateCcw className="w-4 h-4" /> ฝึกรอบใหม่
            </button>
          </div>
        </div>

        {/* Patient & Program Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 text-xs border-b border-emerald-100">
          <div>
            <span className="text-slate-500 block mb-0.5">ผู้รับการบำบัด (Patient):</span>
            <strong className="text-slate-900 text-sm">{selectedPatient?.name}</strong>
            <span className="text-emerald-700 block font-mono text-[11px]">{selectedPatient?.patient_code}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">โปรแกรม (Exercise):</span>
            <strong className="text-emerald-800 text-sm">{selectedExercise?.name}</strong>
            <span className="text-slate-500 block text-[11px]">เป้าหมาย: {selectedExercise?.target_angle}°</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">วันที่บันทึก (Date):</span>
            <strong className="text-slate-900 text-sm">
              {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </strong>
            <span className="text-slate-500 block text-[11px]">{new Date().toLocaleTimeString('th-TH')}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">ระยะเวลาฝึก (Duration):</span>
            <strong className="text-teal-700 text-sm font-mono">{formatDuration(durationSeconds)}</strong>
            <span className="text-slate-500 block text-[11px]">สถานะ: สมบูรณ์ (Completed)</span>
          </div>
        </div>

        {/* Highlight Score Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-sans">
              <span>จำนวนครั้ง (Reps)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900">
              {correctReps} <span className="text-base text-slate-400 font-normal">/ {totalReps}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">ถูกต้อง {Math.round((correctReps / (totalReps || 1)) * 100)}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-sans">
              <span>ความแม่นยำ (Accuracy)</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-700">{accuracy}%</div>
            <div className="text-[11px] text-slate-500 mt-1">คะแนนเฉลี่ยระดับคลินิก</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-sans">
              <span>มุมสูงสุด (Max Angle)</span>
              <Target className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-teal-800">{Math.round(maxAngle)}°</div>
            <div className="text-[11px] text-slate-500 mt-1">มุมเฉลี่ย {Math.round(avgAngle)}°</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-sans">
              <span>ความเร็วเฉลี่ย (Speed)</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-800">
              {totalReps > 0 ? (durationSeconds / totalReps).toFixed(1) : 0}s
            </div>
            <div className="text-[11px] text-slate-500 mt-1">วินาทีต่อรอบ (สม่ำเสมอ)</div>
          </div>
        </div>
      </div>

      {/* Patient Progress & Adaptive Rehabilitation Recommendation Card */}
      <ProgressComparisonCard
        progress={progress}
        exerciseId={selectedExercise?.id}
      />

      {/* Progress Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> พัฒนาการของมุมข้อต่อ (Angle Progression)
            </h3>
            <span className="text-xs font-mono text-slate-500">เป้าหมาย {selectedExercise?.target_angle}°</span>
          </div>
          <AngleHistoryChart data={results} targetAngle={selectedExercise?.target_angle || 90} />
        </div>

        <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> ความแม่นยำรายครั้ง (Rep Accuracy %)
            </h3>
            <span className="text-xs font-mono text-slate-500">เกณฑ์ผ่าน &ge; 75%</span>
          </div>
          <AccuracyChart data={results} />
        </div>
      </div>

      {/* Rep-by-Rep Breakdown Table */}
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-4">
          ตารางรายละเอียดแต่ละครั้ง (Repetition Breakdown Log)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 font-mono">
            <thead className="bg-emerald-50 text-emerald-900 uppercase tracking-wider text-[11px] border-b border-emerald-200">
              <tr>
                <th className="py-3 px-4">ครั้งที่ (Rep)</th>
                <th className="py-3 px-4">มุมที่ทำได้ (Angle)</th>
                <th className="py-3 px-4">ความแม่นยำ (Accuracy)</th>
                <th className="py-3 px-4">เวลา (Duration)</th>
                <th className="py-3 px-4">ผลการประเมิน (Status)</th>
                <th className="py-3 px-4 font-sans">คำแนะนำทางคลินิก (Feedback)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {results.length > 0 ? (
                results.map((rep) => (
                  <tr key={rep.rep_number} className="hover:bg-emerald-50/50 transition">
                    <td className="py-3 px-4 font-bold text-emerald-700">#{rep.rep_number}</td>
                    <td className="py-3 px-4">{Math.round(rep.angle)}°</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          rep.accuracy >= 90
                            ? 'text-emerald-700'
                            : rep.accuracy >= 75
                            ? 'text-teal-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {rep.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{rep.duration}s</td>
                    <td className="py-3 px-4">
                      {rep.is_correct ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ผ่าน (Correct)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> ต้องปรับปรุง
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">{rep.feedback}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่มีข้อมูลบันทึกครั้ง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center justify-between">
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-slate-600 hover:text-emerald-700 font-medium transition flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-emerald-600" /> ดูประวัติการฟื้นฟูทั้งหมดของผู้ป่วย
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold shadow-sm transition"
          >
            กลับสู่หน้าหลัก (Dashboard)
          </button>
        </div>
      </div>
    </div>
  );
};
