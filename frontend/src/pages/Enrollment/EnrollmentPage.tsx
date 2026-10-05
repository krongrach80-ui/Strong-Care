import React from 'react';
import { Camera, UserPlus, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useSeniorStore } from '../../store/seniorStore';

interface EnrollmentPageProps {
  onNavigate: (tab: string) => void;
}

export const EnrollmentPage: React.FC<EnrollmentPageProps> = ({ onNavigate }) => {
  const { openFaceAuth, patients, selectedPatient, selectPatient } = usePatientStore();
  const { isSeniorMode } = useSeniorStore();

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>การลงทะเบียนใบหน้าชีวมิติแบบกระจายศูนย์ (Edge AI)</span>
        </div>
        <h1 className={`${isSeniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'} font-bold text-slate-800 tracking-tight`}>
          ลงทะเบียนใบหน้าผู้ใช้งาน (Face Enrollment)
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          จัดเก็บเฉพาะ 128-D Vector เข้ารหัส AES-GCM 256-bit ปลอดภัยตามหลักความเป็นส่วนตัว
        </p>
      </div>

      <div className="bg-white rounded-[20px] p-8 border border-emerald-100 shadow-xl shadow-emerald-500/5 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">เลือกผู้ป่วยที่ต้องการลงทะเบียนใบหน้า:</label>
          <select
            value={selectedPatient?.id || ''}
            onChange={(e) => {
              const p = patients.find((pat) => pat.id === Number(e.target.value));
              if (p) selectPatient(p);
            }}
            className="w-full px-4 py-3 rounded-[12px] bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.patient_code}) - อายุ {p.age} ปี
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-[14px] bg-emerald-50/70 border border-emerald-200/80 text-xs text-slate-600 space-y-2">
          <span className="font-bold text-emerald-900 block">ขั้นตอนการบันทึกใบหน้า 3 มุม:</span>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
            <span>มองตรงมาที่กล้อง</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
            <span>หันหน้าไปทางซ้ายเล็กน้อย</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
            <span>หันหน้าไปทางขวาเล็กน้อย</span>
          </div>
        </div>

        <button
          onClick={() => openFaceAuth('enroll')}
          className="w-full py-4 px-6 rounded-[14px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base shadow-md shadow-emerald-500/20 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          <span>เริ่มเปิดกล้องลงทะเบียนใบหน้า</span>
        </button>
      </div>
    </div>
  );
};
