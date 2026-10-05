import React, { useState } from 'react';
import { usePatientStore } from '../../store/patientStore';
import { User, UserPlus, CheckCircle, Calendar, FileText, ChevronRight, X } from 'lucide-react';
import { Patient } from '../../types/patient';
import { VoiceGuideButton } from '../../components/VoiceAssistant/VoiceGuideButton';

interface PatientPageProps {
  onNavigate: (tab: string) => void;
}

export const PatientPage: React.FC<PatientPageProps> = ({ onNavigate }) => {
  const { patients, selectedPatient, selectPatient, addPatient } = usePatientStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: 45,
    gender: 'male' as 'male' | 'female' | 'other',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await addPatient(formData);
    setShowAddModal(false);
    setFormData({ name: '', age: 45, gender: 'male', notes: '' });
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            รายชื่อผู้รับการบำบัด (Patients Management)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เลือกผู้ป่วยเพื่อเริ่มเซสชันกายภาพ หรือลงทะเบียนผู้ป่วยใหม่ในระบบ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <VoiceGuideButton pageId="patients" label="ฟังคำแนะนำหน้านี้" />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> ลงทะเบียนผู้ป่วยใหม่
          </button>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patients.map((patient) => {
          const isSelected = selectedPatient?.id === patient.id;

          return (
            <div
              key={patient.id}
              className={`p-6 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-white/90 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-md transition'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}
                  >
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{patient.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {patient.patient_code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      อายุ {patient.age} ปี • เพศ {patient.gender === 'male' ? 'ชาย' : 'หญิง'}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ใช้งานอยู่
                  </span>
                )}
              </div>

              {/* Patient Notes */}
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/90 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> ข้อมูลอาการและการฟื้นฟู:
                </div>
                <p>{patient.notes || 'ไม่มีบันทึกอาการเฉพาะ'}</p>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-emerald-100/80">
                <button
                  onClick={() => {
                    selectPatient(patient);
                    onNavigate('history');
                  }}
                  className="text-xs text-slate-600 hover:text-emerald-700 font-medium transition flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> ดูประวัติและกราฟพัฒนาการ
                </button>

                <button
                  onClick={() => {
                    selectPatient(patient);
                    onNavigate('training');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  เลือกและเริ่มฝึก <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white border border-emerald-200 rounded-3xl p-5 sm:p-8 max-w-[min(95vw,480px)] w-full max-h-[90dvh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              aria-label="Close"
              className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition active:scale-95 z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-4">ลงทะเบียนผู้ป่วยใหม่</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อายุ</label>
                  <input
                    type="number"
                    min="5"
                    max="110"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">บันทึกอาการและเป้าหมาย</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ระบุอาการบาดเจ็บ หรือข้อต่อที่ต้องการฟื้นฟู..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
