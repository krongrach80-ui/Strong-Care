import React, { useState } from 'react';
import { useExerciseStore } from '../../store/exerciseStore';
import { Target, Play, Shield, Dumbbell, Sparkles, CheckCircle2, Plus, Sliders } from 'lucide-react';
import { ExerciseDefinition } from '../../types/exercise';
import { VoiceGuideButton } from '../../components/VoiceAssistant/VoiceGuideButton';
import { ExerciseConfigModal } from '../../components/Exercise/ExerciseConfigModal';

interface ExercisePageProps {
  onNavigate: (tab: string) => void;
}

export const ExercisePage: React.FC<ExercisePageProps> = ({ onNavigate }) => {
  const { exercises, selectedExercise, selectExercise } = useExerciseStore();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configTarget, setConfigTarget] = useState<ExerciseDefinition | null>(null);
  const [configMode, setConfigMode] = useState<'create' | 'edit'>('create');

  const handleSelectAndStart = (exercise: ExerciseDefinition) => {
    selectExercise(exercise);
    onNavigate('training');
  };

  const handleOpenCreate = () => {
    setConfigTarget(null);
    setConfigMode('create');
    setIsConfigOpen(true);
  };

  const handleOpenEdit = (exercise: ExerciseDefinition) => {
    setConfigTarget(exercise);
    setConfigMode('edit');
    setIsConfigOpen(true);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            โปรแกรมกายภาพบำบัด (Exercise Catalog)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เลือกท่ากายภาพที่ต้องการฝึก พร้อมตั้งค่าเป้าหมายองศาและเกณฑ์การประเมิน
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> เพิ่มท่ากายภาพใหม่
          </button>
          <VoiceGuideButton pageId="exercises" label="ฟังคำแนะนำโปรแกรมกายภาพ" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exercises.map((exercise) => {
          const isSelected = selectedExercise?.id === exercise.id;

          return (
            <div
              key={exercise.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-white/90 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-md transition'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {exercise.category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                      exercise.difficulty === 'beginner'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {exercise.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{exercise.name}</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">{exercise.description}</p>

                {/* Metrics Badges */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100/90 mb-4 font-mono text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans">เป้าหมาย (Target)</div>
                    <div className="text-base font-bold text-emerald-700">{exercise.target_angle}°</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans">ช่วงองศา (Range)</div>
                    <div className="text-base font-bold text-teal-700">
                      {exercise.min_angle}°-{exercise.max_angle}°
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans">รอบ (Target Reps)</div>
                    <div className="text-base font-bold text-slate-800">{exercise.target_reps} ครั้ง</div>
                  </div>
                </div>

                {/* Instructions */}
                {exercise.instructions && (
                  <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-emerald-100 mb-4 leading-relaxed">
                    <strong className="text-emerald-900 block mb-1">คำแนะนำการทำท่า:</strong>
                    {exercise.instructions}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-emerald-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectExercise(exercise)}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border transition min-h-[40px] ${
                      isSelected
                        ? 'border-emerald-400 text-emerald-800 bg-emerald-100'
                        : 'border-emerald-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    {isSelected ? '✓ เลือกอยู่' : 'เลือกโปรแกรมนี้'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(exercise)}
                    title="ปรับแต่งการตั้งค่าองศา, จำนวนครั้ง, เวลาค้างท่า"
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleSelectAndStart(exercise)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95 min-h-[44px]"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> เริ่มการฝึกท่านี้ (Start)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exercise Configuration / Custom Creator Modal */}
      <ExerciseConfigModal
        isOpen={isConfigOpen}
        exercise={configTarget}
        mode={configMode}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
};
