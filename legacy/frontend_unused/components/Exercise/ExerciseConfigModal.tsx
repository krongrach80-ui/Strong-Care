import React, { useState, useEffect } from 'react';
import { X, Sliders, Plus, Check, Trash2, RotateCcw } from 'lucide-react';
import { ExerciseDefinition } from '../../types/exercise';
import { useExerciseStore } from '../../store/exerciseStore';

interface ExerciseConfigModalProps {
  isOpen: boolean;
  exercise: ExerciseDefinition | null;
  mode: 'edit' | 'create';
  onClose: () => void;
}

export const ExerciseConfigModal: React.FC<ExerciseConfigModalProps> = ({
  isOpen,
  exercise,
  mode,
  onClose,
}) => {
  const { addCustomExercise, updateExercise, deleteCustomExercise } = useExerciseStore();

  const [formData, setFormData] = useState({
    name: '',
    slug: 'custom_raise',
    category: 'Upper Body',
    target_joint: 'shoulder',
    target_angle: 90,
    min_angle: 20,
    max_angle: 110,
    max_safe_angle: 135,
    target_reps: 10,
    hold_seconds: 2,
    tolerance_angle: 10,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    description: '',
    instructions: '',
  });

  useEffect(() => {
    if (exercise && mode === 'edit') {
      setFormData({
        name: exercise.name,
        slug: exercise.slug,
        category: exercise.category,
        target_joint: exercise.target_joint,
        target_angle: exercise.target_angle,
        min_angle: exercise.min_angle,
        max_angle: exercise.max_angle,
        max_safe_angle: exercise.max_safe_angle || exercise.max_angle + 15,
        target_reps: exercise.target_reps,
        hold_seconds: exercise.hold_seconds || 2,
        tolerance_angle: exercise.tolerance_angle || 10,
        difficulty: exercise.difficulty,
        description: exercise.description || '',
        instructions: exercise.instructions || '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: 'ท่ายกแขนด้านหน้า (Front Arm Raise)',
        slug: 'front_raise',
        category: 'Upper Body',
        target_joint: 'shoulder',
        target_angle: 90,
        min_angle: 15,
        max_angle: 105,
        max_safe_angle: 130,
        target_reps: 10,
        hold_seconds: 2,
        tolerance_angle: 10,
        difficulty: 'beginner',
        description: 'การยกแขนไปข้างหน้าเพื่อฟื้นฟูกล้ามเนื้อหัวไหล่ส่วนหน้า',
        instructions: 'ยกแขนตรงไปข้างหน้าจนขนานกับพื้น ค้างไว้ 2 วินาทีแล้วค่อยๆ ลดระดับลง',
      });
    }
  }, [exercise, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      addCustomExercise(formData);
    } else if (exercise) {
      updateExercise(exercise.id, formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (exercise && exercise.is_custom) {
      if (confirm(`ยืนยันการลบท่า "${exercise.name}" หรือไม่?`)) {
        deleteCustomExercise(exercise.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-8 max-w-[min(95vw,600px)] w-full shadow-2xl relative max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition active:scale-95 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'create' ? 'เพิ่มท่ากายภาพใหม่ (Custom Exercise)' : 'ปรับแต่งการตั้งค่าท่าฝึก (Config)'}
            </h3>
            <p className="text-xs text-slate-500">
              กำหนดเป้าหมายองศา (ROM), มุมจำกัดความปลอดภัย, จำนวนครั้ง และเวลาค้างท่า
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Exercise Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อท่ากายภาพบำบัด
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ข้อต่อเป้าหมาย (Target Joint)
              </label>
              <select
                value={formData.target_joint}
                onChange={(e) => setFormData({ ...formData, target_joint: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="shoulder">หัวไหล่ (Shoulder)</option>
                <option value="elbow">ข้อศอก (Elbow)</option>
                <option value="knee">ข้อเข่า (Knee)</option>
                <option value="hip">ข้อสะโพก (Hip)</option>
                <option value="spine">กระดูกสันหลัง (Spine)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ระดับความยาก (Difficulty)
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="beginner">ระดับเริ่มต้น (Beginner)</option>
                <option value="intermediate">ปานกลาง (Intermediate)</option>
                <option value="advanced">ขั้นสูง (Advanced)</option>
              </select>
            </div>
          </div>

          {/* Clinical Angle Envelope */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <span>📐 ช่วงองศาการเคลื่อนไหว (Biomechanical ROM Envelope)</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                  Min Angle (จุดเริ่ม)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formData.min_angle}
                    onChange={(e) => setFormData({ ...formData, min_angle: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <span className="text-slate-500 font-mono">°</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                  Target Angle (เป้าหมาย)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formData.target_angle}
                    onChange={(e) => setFormData({ ...formData, target_angle: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 border-emerald-500 font-mono font-bold text-emerald-700"
                  />
                  <span className="text-emerald-600 font-mono">°</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                  Max Angle (จุดสูงสุด)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formData.max_angle}
                    onChange={(e) => setFormData({ ...formData, max_angle: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <span className="text-slate-500 font-mono">°</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-mono text-rose-700 dark:text-rose-400 font-semibold mb-1">
                  🛡️ Max Safe Cutoff (ตัดความปลอดภัย)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={formData.max_angle}
                    max={180}
                    value={formData.max_safe_angle}
                    onChange={(e) => setFormData({ ...formData, max_safe_angle: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 font-mono font-bold text-rose-700"
                  />
                  <span className="text-rose-600 font-mono">°</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                  Tolerance (ค่าความคลาดเคลื่อน)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.tolerance_angle}
                    onChange={(e) => setFormData({ ...formData, tolerance_angle: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                  <span className="text-slate-500 font-mono">±°</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reps and Hold Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                จำนวนครั้งเป้าหมาย (Target Reps)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={formData.target_reps}
                onChange={(e) => setFormData({ ...formData, target_reps: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                เวลาค้างท่า (Hold Seconds)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.hold_seconds}
                  onChange={(e) => setFormData({ ...formData, hold_seconds: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                />
                <span className="text-slate-500 font-mono">วินาที</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              คำแนะนำวิธีปฏิบัติ (Instructions)
            </label>
            <textarea
              rows={2}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {exercise?.is_custom ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" /> ลบท่านี้
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                {mode === 'create' ? 'บันทึกท่าใหม่' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
