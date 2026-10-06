import React from 'react';
import { Camera, UserCheck, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useSeniorStore } from '../../store/seniorStore';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { openFaceAuth, patients, selectPatient } = usePatientStore();
  const { isSeniorMode } = useSeniorStore();

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>ระบบยืนยันตัวตนด้วยใบหน้าสำหรับผู้สูงอายุ</span>
        </div>
        <h1 className={`${isSeniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'} font-bold text-slate-800 tracking-tight`}>
          เข้าสู่ระบบด้วยใบหน้า (Face Login)
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          ไม่ต้องจำรหัสผ่าน เพียงมองกล้องและกระพริบตาเพื่อยืนยันว่าเป็นบุคคลจริง (Liveness Detection)
        </p>
      </div>

      <div className="bg-white rounded-[20px] p-8 border border-emerald-100 shadow-xl shadow-emerald-500/5 space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Camera className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-800">พร้อมสแกนใบหน้า</h2>
          <p className="text-xs text-slate-500">
            ระบบจะแปลงใบหน้าเป็น 128-D Vector ไม่มีการบันทึกภาพถ่ายดิบลงในเซิร์ฟเวอร์
          </p>
        </div>

        <button
          onClick={() => openFaceAuth('login')}
          className="w-full py-4 px-6 rounded-[14px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base shadow-md shadow-emerald-500/20 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          <span>เปิดกล้องสแกนใบหน้า</span>
        </button>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>ยังไม่ได้ลงทะเบียนใบหน้า?</span>
          <button
            onClick={() => openFaceAuth('enroll')}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
          >
            ลงทะเบียนใหม่ <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
