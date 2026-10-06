import React from 'react';
import { PhoneCall, HeartPulse, X, ShieldCheck, AlertOctagon, UserX, PauseCircle } from 'lucide-react';
import { useSeniorStore } from '../../store/seniorStore';
import { usePatientStore } from '../../store/patientStore';
import { useSessionStore } from '../../store/sessionStore';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { audioFeedback } from '../../services/audioService';

export const SeniorEmergencyButton: React.FC = () => {
  const { isSeniorMode, isEmergencyAlertOpen, triggerEmergencyAlert, dismissEmergencyAlert } = useSeniorStore();
  const { selectedPatient } = usePatientStore();
  const { isActive } = useSessionStore();

  const handleTrigger = () => {
    triggerEmergencyAlert();
    audioFeedback.playWarningBeep();

    // Immediate Voice Preemption
    voiceAssistant.speakAlert(
      'ระบบหยุดการฝึกชั่วคราวตามคำสั่งฉุกเฉินของผู้ใช้ และส่งสัญญาณขอความช่วยเหลือถึงผู้ดูแลแล้วครับ กรุณานั่งพักสักครู่นะครับ ไม่ต้องกังวลนะครับ',
      {
        priority: 'critical',
        force: true,
        chime: true,
      }
    );
  };

  return (
    <>
      {/* Floating Red SOS Button: Always visible on every page (Human Override) */}
      {isSeniorMode ? (
        // Senior Mode: Extra Large Floating SOS Button
        <button
          onClick={handleTrigger}
          title="กดเพื่อขอความช่วยเหลือจากผู้ดูแล (User SOS Human Override)"
          style={{
            position: 'fixed',
            bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            right: 'max(16px, env(safe-area-inset-right, 16px))',
            zIndex: 9999,
          }}
          className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-base sm:text-lg shadow-2xl shadow-rose-950/60 border-2 border-white/40 transition-all hover:scale-105 active:scale-95 animate-pulse min-h-[48px]"
        >
          <PhoneCall className="w-5 h-5 sm:w-7 sm:h-7 animate-bounce flex-shrink-0" />
          <span className="hidden xs:inline">ขอความช่วยเหลือ (SOS)</span>
          <span className="xs:hidden">SOS</span>
        </button>
      ) : (
        // Standard Mode: Floating Accessible SOS Button
        <button
          onClick={handleTrigger}
          title="กดเพื่อหยุดฉุกเฉินด้วยตนเอง (User SOS / Human Override)"
          style={{
            position: 'fixed',
            bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            right: 'max(16px, env(safe-area-inset-right, 16px))',
            zIndex: 9999,
          }}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-xl shadow-red-950/40 border border-white/30 transition-all hover:scale-105 active:scale-95 group min-h-[44px]"
        >
          <AlertOctagon className="w-4 h-4 text-white group-hover:animate-spin flex-shrink-0" />
          <span className="hidden sm:inline">SOS หยุดฉุกเฉิน (Human Override)</span>
          <span className="sm:hidden">SOS ฉุกเฉิน</span>
        </button>
      )}

      {/* Emergency Alert Modal */}
      {isEmergencyAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-lg animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90dvh] overflow-y-auto shadow-2xl border-4 border-rose-500 text-center relative">
            <button
              onClick={dismissEmergencyAlert}
              aria-label="Close"
              className="absolute top-3 sm:top-4 right-3 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/60 border-4 border-rose-300 dark:border-rose-700 flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-xl shadow-rose-500/20 animate-pulse">
              <HeartPulse className="w-10 h-10" />
            </div>

            {/* Semantic Distinction Badge */}
            <div className="flex flex-col items-center gap-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 uppercase">
                SAFETY ENGINE &bull; USER SOS (HUMAN OVERRIDE)
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                (แยกขาดจาก Automatic Emergency Stop ของ AI)
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              ส่งสัญญาณขอความช่วยเหลือแล้ว
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              ผู้ใช้ได้กดหยุดการฝึกด้วยตนเอง (Human Override) ระบบหยุดการฝึกทันทีโดยไม่ต้องรอให้ AI ตรวจพบเหตุการณ์ และส่งสัญญาณแจ้งเตือนไปยังผู้ดูแลของ{' '}
              <strong className="text-rose-700 dark:text-rose-400 font-bold">{selectedPatient?.name || 'คุณสมชาย มีสุข'}</strong> เรียบร้อยแล้ว
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-left text-xs space-y-2 font-mono text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span>กลไกความปลอดภัย:</span>
                <strong className="text-rose-700 dark:text-rose-400">Manual Human Override</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>ผู้ดูแลเวรประจำ:</span>
                <strong className="text-slate-900 dark:text-white">คุณพยาบาลเวร / กภ. วริศรา</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>สายด่วนฉุกเฉิน:</span>
                <strong className="text-rose-700 dark:text-rose-400 font-bold">089-123-4567 (กด 1)</strong>
              </div>
              <div className="flex justify-between items-center border-t border-rose-200 dark:border-rose-800 pt-2">
                <span>สถานะระบบ:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> เซสชันหยุดชั่วคราว ปลอดภัย
                </strong>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={dismissEmergencyAlert}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition active:scale-95"
              >
                เข้าใจแล้ว / ปลอดภัยดี (ปิดหน้าต่างและกลับสู่หน้าจอ)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
