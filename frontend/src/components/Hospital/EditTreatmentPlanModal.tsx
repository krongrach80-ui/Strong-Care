import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Stethoscope,
  Dumbbell,
  FileText,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Activity,
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import {
  TreatmentPlan,
  PrescribedExercise,
  UserAccount,
  PhysicalTherapist,
  HospitalExercise,
  UserRole,
} from '../../types/hospital';

interface EditTreatmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan | null; // null = create new plan
  patients: UserAccount[];
  therapists: PhysicalTherapist[];
  exercises: HospitalExercise[];
  currentRole: UserRole;
  currentUserId: number | string;
  currentUserName: string;
  onSavePlan: (plan: Omit<TreatmentPlan, 'id' | 'createdAt'> & { id?: number | string }) => void;
  onSuccessToast: (msg: string) => void;
}

export const EditTreatmentPlanModal: React.FC<EditTreatmentPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  patients,
  therapists,
  exercises,
  currentRole,
  currentUserId,
  currentUserName,
  onSavePlan,
  onSuccessToast,
}) => {
  // Only patient role accounts can be assigned
  const patientUsers = patients.filter((u) => u.role === 'patient');

  // Form states
  const [patientId, setPatientId] = useState<number | string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientCode, setPatientCode] = useState<string>('');
  const [therapistId, setTherapistId] = useState<number | string>('');
  const [therapistName, setTherapistName] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [targetJoint, setTargetJoint] = useState<string>('');
  const [assignedExercises, setAssignedExercises] = useState<PrescribedExercise[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'completed' | 'paused'>('active');

  // Timetable scheduling state (เหมือนตารางเรียน: วัน เวลา เดือน ปี)
  const [scheduleDays, setScheduleDays] = useState<string[]>(['จันทร์', 'พุธ', 'ศุกร์']);
  const [timeSlot, setTimeSlot] = useState<string>('09:30 - 10:30');
  const [startTime, setStartTime] = useState<string>('09:30');
  const [endTime, setEndTime] = useState<string>('10:30');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [roomStation, setRoomStation] = useState<string>('ตู้ Kiosk 1');

  // Exercise picker temporary state
  const [selectedExerciseSlug, setSelectedExerciseSlug] = useState<string>('');
  const [exerciseSets, setExerciseSets] = useState<number>(3);
  const [exerciseReps, setExerciseReps] = useState<number>(10);
  const [exerciseHold, setExerciseHold] = useState<number>(5);
  const [exerciseDifficulty, setExerciseDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  // Errors & loading
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize data on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (plan) {
        // Editing existing plan
        setPatientId(plan.patientId);
        setPatientName(plan.patientName);
        setPatientCode(plan.patientCode);
        setTherapistId(plan.therapistId);
        setTherapistName(plan.therapistName);
        setDiagnosis(plan.diagnosis);
        setTargetJoint(plan.targetJoint);
        setAssignedExercises(plan.assignedExercises || []);
        setClinicalNotes(plan.clinicalNotes || '');
        setStatus(plan.status || 'active');
        setScheduleDays(plan.scheduleDays || ['จันทร์', 'พุธ', 'ศุกร์']);
        setTimeSlot(plan.timeSlot || '09:30 - 10:30');
        setStartTime(plan.startTime || '09:30');
        setEndTime(plan.endTime || '10:30');
        setStartDate(plan.startDate || '2026-10-01');
        setEndDate(plan.endDate || '2026-10-31');
        setRoomStation(plan.roomStation || 'ตู้ Kiosk 1');
      } else {
        // Creating new plan
        const firstPt = patientUsers[0];
        setPatientId(firstPt ? firstPt.id : '');
        setPatientName(firstPt ? firstPt.name : '');
        setPatientCode(firstPt ? firstPt.code : '');

        // Match therapist
        const defaultTherapist =
          therapists.find((t) => t.id === currentUserId) ||
          therapists[0] || { id: 1, name: currentUserName || 'กภ. ธนากร วงศ์สวัสดิ์' };

        setTherapistId(defaultTherapist.id);
        setTherapistName(defaultTherapist.name);
        setDiagnosis(firstPt?.diagnosis || 'ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)');
        setTargetJoint('ข้อไหล่และกล้ามเนื้อสะบัก');
        setAssignedExercises([
          {
            exerciseSlug: 'shoulder_raise',
            exerciseName: 'กางแขนยกด้านข้าง',
            sets: 3,
            reps: 10,
            holdSeconds: 3,
            difficulty: 'beginner',
          },
        ]);
        setClinicalNotes('เน้นฝึกอย่างสม่ำเสมอ พักระหว่างเซ็ต 30 วินาที หากปวดเกินระดับ 3 ให้หยุดพัก');
        setStatus('active');
        setScheduleDays(['จันทร์', 'พุธ', 'ศุกร์']);
        setTimeSlot('09:30 - 10:30');
        setStartTime('09:30');
        setEndTime('10:30');
        setStartDate('2026-10-01');
        setEndDate('2026-10-31');
        setRoomStation('ตู้ Kiosk 1');
      }

      if (exercises.length > 0) {
        setSelectedExerciseSlug(exercises[0].svgType || exercises[0].name);
      }
    }
  }, [isOpen, plan]);

  if (!isOpen) return null;

  // Handle patient dropdown change
  const handleSelectPatient = (id: string | number) => {
    const selected = patientUsers.find((p) => String(p.id) === String(id));
    if (selected) {
      setPatientId(selected.id);
      setPatientName(selected.name);
      setPatientCode(selected.code);
      if (selected.diagnosis) {
        setDiagnosis(selected.diagnosis);
      }
      if (selected.assignedTherapistName) {
        setTherapistName(selected.assignedTherapistName);
      }
    }
  };

  // Add exercise to list
  const handleAddExercise = () => {
    if (!selectedExerciseSlug) return;
    const exObj = exercises.find(
      (e) => (e.svgType && e.svgType === selectedExerciseSlug) || e.name === selectedExerciseSlug
    ) || exercises[0];

    // Avoid duplicate slug
    const alreadyExists = assignedExercises.some(
      (item) => item.exerciseSlug === (exObj.svgType || exObj.name)
    );
    if (alreadyExists) {
      setError(`ท่า ${exObj.name} มีอยู่ในตารางกายภาพแล้ว`);
      return;
    }

    const newPrescription: PrescribedExercise = {
      exerciseSlug: exObj.svgType || exObj.name,
      exerciseName: exObj.name,
      sets: exerciseSets,
      reps: exerciseReps,
      holdSeconds: exerciseHold,
      difficulty: exerciseDifficulty,
    };

    setAssignedExercises([...assignedExercises, newPrescription]);
    setError(null);
  };

  // Remove exercise from list
  const handleRemoveExercise = (index: number) => {
    setAssignedExercises(assignedExercises.filter((_, i) => i !== index));
  };

  // Update exercise item in list
  const handleUpdateExerciseItem = (index: number, field: keyof PrescribedExercise, value: any) => {
    setAssignedExercises(
      assignedExercises.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientId || !patientName) {
      setError('กรุณาเลือกคนไข้');
      return;
    }
    if (!diagnosis.trim()) {
      setError('กรุณาระบุการวินิจฉัยหรืออาการหลัก');
      return;
    }
    if (assignedExercises.length === 0) {
      setError('กรุณาเลือกท่าทางกายภาพอย่างน้อย 1 ท่าสำหรับตารางฝึก');
      return;
    }

    setIsSubmitting(true);
    try {
      onSavePlan({
        ...(plan?.id ? { id: plan.id } : {}),
        patientId,
        patientName,
        patientCode: patientCode || 'P-0000',
        therapistId,
        therapistName: therapistName || 'กภ. ธนากร วงศ์สวัสดิ์',
        diagnosis: diagnosis.trim(),
        targetJoint: targetJoint.trim() || 'ข้อต่อและกล้ามเนื้อทั่วไป',
        assignedExercises,
        clinicalNotes: clinicalNotes.trim(),
        status,
        scheduleDays,
        timeSlot: timeSlot || `${startTime} - ${endTime}`,
        startTime,
        endTime,
        startDate,
        endDate,
        roomStation,
      });

      onSuccessToast(
        plan ? `อัปเดตตารางกายภาพของ ${patientName} สำเร็จ` : `สร้างตารางกายภาพใหม่ให้ ${patientName} สำเร็จ`
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกตารางกายภาพ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072420]/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-emerald-300 p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col text-left">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-emerald-100 pb-3.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{plan ? 'แก้ไขตารางฝึกกายภาพ' : 'มอบหมายตารางฝึกกายภาพใหม่'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0F2F2B] mt-1">
                {plan ? `ตารางกายภาพ: ${plan.patientName} (${plan.patientCode})` : 'จัดตารางโปรแกรมกายภาพบำบัดคนไข้'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Section 1: Patient & Therapist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            {/* Patient Select */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                คนไข้ <span className="text-rose-500">*</span>
              </label>
              {plan ? (
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 font-bold text-[#0F2F2B] flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>{patientName} ({patientCode})</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={patientId}
                    onChange={(e) => handleSelectPatient(e.target.value)}
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981] appearance-none"
                  >
                    {patientUsers.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Therapist */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                นักกายภาพผู้รับผิดชอบ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={therapistId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setTherapistId(tid);
                    const tObj = therapists.find((t) => String(t.id) === String(tid));
                    if (tObj) setTherapistName(tObj.name);
                  }}
                  disabled={currentRole === 'therapist'}
                  className={`w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981] appearance-none ${
                    currentRole === 'therapist' ? 'bg-slate-50 opacity-90 cursor-not-allowed' : ''
                  }`}
                >
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code || 'PT'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Diagnosis & Target Joint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                การวินิจฉัย / ภาวะทางคลินิก <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="เช่น ข้อไหล่ติดระยะฟื้นฟู (Frozen Shoulder)"
                className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-semibold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">บริเวณข้อต่อเป้าหมาย</label>
              <input
                type="text"
                value={targetJoint}
                onChange={(e) => setTargetJoint(e.target.value)}
                placeholder="เช่น ข้อไหล่, ข้อเข่า, สะบัก, บั้นเอว"
                className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-semibold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>
          </div>

          {/* Section 3: Assigned Exercises List */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800">
                รายการท่ากายภาพบำบัดในตารางฝึก ({assignedExercises.length} ท่า){' '}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                สามารถปรับจำนวนเซ็ตและครั้งได้
              </span>
            </div>

            {/* List of currently assigned exercises */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {assignedExercises.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-emerald-300 text-center text-slate-400 bg-emerald-50/30">
                  ยังไม่ได้เพิ่มท่ากายภาพในตารางฝึก (เลือกท่าด้านล่างเพื่อเพิ่ม)
                </div>
              ) : (
                assignedExercises.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs flex items-center justify-between gap-2.5 flex-wrap"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#0F2F2B] truncate">{item.exerciseName}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{item.exerciseSlug}</div>
                      </div>
                    </div>

                    {/* Exercise Parameters Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold">เซ็ต:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={item.sets}
                          onChange={(e) => handleUpdateExerciseItem(idx, 'sets', parseInt(e.target.value) || 1)}
                          className="w-10 text-center font-bold bg-transparent outline-none text-[#0F2F2B]"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold">ครั้ง:</span>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={item.reps}
                          onChange={(e) => handleUpdateExerciseItem(idx, 'reps', parseInt(e.target.value) || 1)}
                          className="w-10 text-center font-bold bg-transparent outline-none text-[#0F2F2B]"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold">ค้าง:</span>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={item.holdSeconds}
                          onChange={(e) => handleUpdateExerciseItem(idx, 'holdSeconds', parseInt(e.target.value) || 1)}
                          className="w-10 text-center font-bold bg-transparent outline-none text-[#0F2F2B]"
                        />
                        <span className="text-[10px] text-slate-400">วิ</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        title="ลบท่านี้ออกจากตาราง"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Exercise Adder Sub-box */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>เพิ่มท่าใหม่เข้าตารางฝึก</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2 relative">
                  <select
                    value={selectedExerciseSlug}
                    onChange={(e) => setSelectedExerciseSlug(e.target.value)}
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981] appearance-none"
                  >
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.svgType || ex.name}>
                        {ex.name} ({ex.category})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={exerciseSets}
                    onChange={(e) => setExerciseSets(parseInt(e.target.value) || 3)}
                    placeholder="เซ็ต"
                    title="จำนวนเซ็ต"
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-center text-xs font-bold text-[#0F2F2B]"
                  />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={exerciseReps}
                    onChange={(e) => setExerciseReps(parseInt(e.target.value) || 10)}
                    placeholder="ครั้ง"
                    title="จำนวนครั้งต่อเซ็ต"
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-center text-xs font-bold text-[#0F2F2B]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="w-full bg-[#10B981] text-white rounded-xl font-bold py-2 px-3 text-xs hover:bg-emerald-600 transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มท่า</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: จัดตารางเวลาฝึก (เหมือนตารางเรียน: วัน เวลา เดือน ปี) */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-sm text-[#0F2F2B] flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>กำหนดเวลาฝึกกายภาพ (เหมือนตารางเรียน)</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                วัน • เวลา • เดือน • ปี
              </span>
            </div>

            {/* วันในสัปดาห์ที่ลงเรียน/ฝึก */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">วันที่ลงฝึกในแต่ละสัปดาห์:</span>
                {/* Quick Presets */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setScheduleDays(['จันทร์', 'พุธ', 'ศุกร์'])}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                  >
                    จ-พ-ศ
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleDays(['อังคาร', 'พฤหัสบดี'])}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                  >
                    อ-พฤ
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleDays(['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'])}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                  >
                    จ-ศ (ทุกวันทำการ)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {[
                  { name: 'จันทร์', short: 'จ.', color: 'border-amber-300 hover:bg-amber-50' },
                  { name: 'อังคาร', short: 'อ.', color: 'border-pink-300 hover:bg-pink-50' },
                  { name: 'พุธ', short: 'พ.', color: 'border-emerald-300 hover:bg-emerald-50' },
                  { name: 'พฤหัสบดี', short: 'พฤ.', color: 'border-orange-300 hover:bg-orange-50' },
                  { name: 'ศุกร์', short: 'ศ.', color: 'border-blue-300 hover:bg-blue-50' },
                  { name: 'เสาร์', short: 'ส.', color: 'border-purple-300 hover:bg-purple-50' },
                  { name: 'อาทิตย์', short: 'อา.', color: 'border-rose-300 hover:bg-rose-50' },
                ].map((d) => {
                  const isSelected = scheduleDays.includes(d.name);
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setScheduleDays(scheduleDays.filter((x) => x !== d.name));
                        } else {
                          setScheduleDays([...scheduleDays, d.name]);
                        }
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer border ${
                        isSelected
                          ? 'bg-[#10B981] text-[#0F2F2B] border-emerald-400 shadow-sm font-extrabold ring-2 ring-emerald-300'
                          : `bg-white text-slate-600 ${d.color}`
                      }`}
                    >
                      <span className="text-[11px] leading-tight">{d.short}</span>
                      <span className="text-[9px] opacity-80">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ช่วงเวลา & ตู้ Kiosk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ช่วงเวลาที่ลงฝึก (Time Slot)
                </label>
                <div className="relative">
                  <select
                    value={timeSlot}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimeSlot(val);
                      const [s, end] = val.split(' - ');
                      if (s) setStartTime(s.trim());
                      if (end) setEndTime(end.trim());
                    }}
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981] appearance-none"
                  >
                    <option value="08:30 - 09:30">08:30 - 09:30 น. (คาบ 1 - เช้า)</option>
                    <option value="09:30 - 10:30">09:30 - 10:30 น. (คาบ 2 - เช้า)</option>
                    <option value="10:30 - 11:30">10:30 - 11:30 น. (คาบ 3 - เช้า)</option>
                    <option value="13:00 - 14:00">13:00 - 14:00 น. (คาบ 4 - บ่าย)</option>
                    <option value="14:00 - 15:00">14:00 - 15:00 น. (คาบ 5 - บ่าย)</option>
                    <option value="15:00 - 16:00">15:00 - 16:00 น. (คาบ 6 - บ่าย)</option>
                    <option value="16:00 - 17:00">16:00 - 17:00 น. (คาบ 7 - เย็น)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สถานที่ฝึก / ตู้ Kiosk
                </label>
                <div className="relative">
                  <select
                    value={roomStation}
                    onChange={(e) => setRoomStation(e.target.value)}
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981] appearance-none"
                  >
                    <option value="ตู้ Kiosk 1">🖥️ ตู้ Kiosk 1 (ห้องกายภาพรวม)</option>
                    <option value="ตู้ Kiosk 2">🖥️ ตู้ Kiosk 2 (โซนฟื้นฟูข้อเข่า)</option>
                    <option value="ตู้ Kiosk 3">🖥️ ตู้ Kiosk 3 (โซนออฟฟิศซินโดรม)</option>
                    <option value="เตียงฝึก 1">🛏️ เตียงฝึกกายภาพ 1</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* วันที่เริ่มต้น - วันที่สิ้นสุด (ระบุ วัน/เดือน/ปี) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📅 วันที่เริ่มต้นคอร์ส (วัน/เดือน/ปี)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📅 วันที่สิ้นสุดคอร์ส (วัน/เดือน/ปี)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Clinical Notes & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                คำแนะนำและข้อควรระวังสำหรับผู้ป่วย (Clinical Notes)
              </label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={2}
                placeholder="เช่น เน้นเพิ่มองศาการยกแขนด้านข้าง หลีกเลี่ยงการยกแขนกระตุกเร็ว สังเกตอาการปวดไม่ให้เกินระดับ 3/10..."
                className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-semibold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">สถานะตารางฝึก</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 font-bold text-[#0F2F2B] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <option value="active">🟢 ใช้งานอยู่ (Active)</option>
                <option value="paused">🟡 พักการฝึก (Paused)</option>
                <option value="completed">🔵 ฝึกครบโปรแกรม (Completed)</option>
              </select>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-emerald-100 flex items-center justify-end gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold hover:opacity-95 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : plan ? 'บันทึกการแก้ไข' : 'สร้างตารางกายภาพ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
