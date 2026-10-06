import { create } from 'zustand';
import { ExerciseDefinition } from '../types/exercise';
import { api } from '../services/api';

const CUSTOM_EXERCISES_KEY = 'physiovision_custom_exercises';

interface ExerciseState {
  exercises: ExerciseDefinition[];
  selectedExercise: ExerciseDefinition | null;
  isLoading: boolean;
  fetchExercises: () => Promise<void>;
  selectExercise: (exercise: ExerciseDefinition) => void;
  addCustomExercise: (exercise: Omit<ExerciseDefinition, 'id'>) => ExerciseDefinition;
  updateExercise: (id: number, updates: Partial<ExerciseDefinition>) => void;
  deleteCustomExercise: (id: number) => void;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  selectedExercise: null,
  isLoading: false,

  fetchExercises: async () => {
    set({ isLoading: true });
    try {
      let data = await api.getExercises();

      // Read custom/configured exercises from localStorage
      const savedCustom = localStorage.getItem(CUSTOM_EXERCISES_KEY);
      if (savedCustom) {
        try {
          const parsed: ExerciseDefinition[] = JSON.parse(savedCustom);
          // Merge or replace defaults with customized versions
          parsed.forEach((customEx) => {
            const existingIdx = data.findIndex((d) => d.id === customEx.id);
            if (existingIdx !== -1) {
              data[existingIdx] = { ...data[existingIdx], ...customEx };
            } else {
              data.push(customEx);
            }
          });
        } catch (e) {
          console.error('Failed to parse custom exercises:', e);
        }
      }

      set({
        exercises: data,
        selectedExercise: get().selectedExercise || data[0] || null,
        isLoading: false,
      });
    } catch (e) {
      console.warn('fetchExercises failed, using offline fallback exercises:', e);
      const fallbackExercises: ExerciseDefinition[] = [
        {
          id: 1,
          name: 'Shoulder Lateral Raise (กางแขนยกหัวไหล่)',
          slug: 'shoulder_raise',
          category: 'Upper Body',
          description: 'ฝึกยกแขนออกด้านข้างลำตัวเพื่อฟื้นฟูกล้ามเนื้อ Deltoid',
          target_joint: 'shoulder',
          target_angle: 90,
          min_angle: 75,
          max_angle: 110,
          target_reps: 10,
          difficulty: 'beginner',
        },
        {
          id: 2,
          name: 'Bicep Curl (งอข้อศอกฟื้นฟูกล้ามเนื้อ)',
          slug: 'bicep_curl',
          category: 'Upper Body',
          description: 'บริหารข้อศอกและการเคลื่อนไหวแขนท่อนล่าง',
          target_joint: 'elbow',
          target_angle: 50,
          min_angle: 35,
          max_angle: 65,
          target_reps: 10,
          difficulty: 'beginner',
        },
      ];
      set({
        exercises: fallbackExercises,
        selectedExercise: get().selectedExercise ?? fallbackExercises[0],
        isLoading: false,
      });
    }
  },

  selectExercise: (exercise) => set({ selectedExercise: exercise }),

  addCustomExercise: (newExData) => {
    const { exercises } = get();
    const newId = Math.max(100, ...exercises.map((e) => e.id)) + 1;
    const newEx: ExerciseDefinition = {
      ...newExData,
      id: newId,
      is_custom: true,
      hold_seconds: newExData.hold_seconds ?? 2,
      tolerance_angle: newExData.tolerance_angle ?? 10,
      max_safe_angle: newExData.max_safe_angle ?? (newExData.max_angle ? newExData.max_angle + 15 : 120),
    };

    const updated = [...exercises, newEx];
    set({ exercises: updated, selectedExercise: newEx });

    // Persist custom exercises
    const customList = updated.filter((e) => e.is_custom);
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customList));

    return newEx;
  },

  updateExercise: (id, updates) => {
    const { exercises, selectedExercise } = get();
    const updated = exercises.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex));
    const newSelected = selectedExercise?.id === id ? { ...selectedExercise, ...updates } : selectedExercise;

    set({ exercises: updated, selectedExercise: newSelected });

    // Persist
    const customList = updated.filter((e) => e.is_custom || e.id === id);
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customList));
  },

  deleteCustomExercise: (id) => {
    const { exercises, selectedExercise } = get();
    const updated = exercises.filter((ex) => ex.id !== id);
    const newSelected = selectedExercise?.id === id ? updated[0] || null : selectedExercise;

    set({ exercises: updated, selectedExercise: newSelected });

    const customList = updated.filter((e) => e.is_custom);
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customList));
  },
}));
