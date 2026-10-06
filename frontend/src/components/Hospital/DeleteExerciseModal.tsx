import React, { useState } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  Dumbbell,
  Target,
  Clock,
  Layers,
} from 'lucide-react';
import { HospitalExercise } from '../../types/hospital';

interface DeleteExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: HospitalExercise | null;
  onConfirmDelete: (id: number) => void;
  onSuccessToast: (msg: string) => void;
}

export const DeleteExerciseModal: React.FC<DeleteExerciseModalProps> = ({
  isOpen,
  onClose,
  exercise,
  onConfirmDelete,
  onSuccessToast,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen || !exercise) return null;

  const handleConfirm = () => {
    setIsDeleting(true);
    onConfirmDelete(exercise.id);
    onSuccessToast('ลบท่าทางกายภาพเรียบร้อยแล้ว');
    setIsDeleting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F2F2B]/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-[28px] sm:rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-slideUp text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>ยืนยันการลบท่าทางกายภาพ</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-inner shadow-rose-200/50">
            <Trash2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-[#0F2F2B]">
              ยืนยันการลบท่าทางกายภาพ
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              คุณต้องการลบท่า <strong className="text-slate-900 font-bold">"{exercise.name}"</strong> ใช่หรือไม่?
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              ⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้ ท่านี้จะถูกลบออกจากคลังท่าทางกายภาพของระบบ
            </p>
          </div>

          {/* Exercise Summary Preview Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">ชื่อท่า (ไทย / อังกฤษ):</span>
              <div className="text-right">
                <span className="font-bold text-[#0F2F2B] block">{exercise.name}</span>
                <span className="text-[11px] text-slate-400">{exercise.englishName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">หมวดหมู่:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
                {exercise.category}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
              <span className="text-slate-500 font-medium">เป้าหมายชีวกลศาสตร์:</span>
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span>มุม {exercise.targetAngle}°</span>
                <span className="text-slate-300">•</span>
                <span>ค้าง {exercise.holdSeconds} วิ</span>
                {exercise.sets && exercise.repsPerSet && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{exercise.sets} เซ็ต x {exercise.repsPerSet} ครั้ง</span>
                  </>
                )}
              </div>
            </div>

            {exercise.targetJoint && (
              <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                <span className="text-slate-500 font-medium">ข้อต่อเป้าหมาย:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                  {exercise.targetJoint}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-full border border-stone-300 text-slate-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังลบ...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>ลบท่านี้</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
