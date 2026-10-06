import { create } from 'zustand';
import { RepState } from '../types/exercise';

interface TrainingStore {
  isActive: boolean;
  isCalibrated: boolean;
  currentRep: number;
  targetReps: number;
  currentAngle: number;
  targetAngle: number;
  phase: RepState;
  holdTimeRemaining: number;
  accuracy: number;
  maxRom: number;
  startedAt: number | null;
  setIsActive: (val: boolean) => void;
  setIsCalibrated: (val: boolean) => void;
  updateTelemetry: (data: {
    currentRep?: number;
    currentAngle?: number;
    phase?: RepState;
    holdTimeRemaining?: number;
    accuracy?: number;
    maxRom?: number;
  }) => void;
  resetTraining: () => void;
}

export const useTrainingStore = create<TrainingStore>((set) => ({
  isActive: false,
  isCalibrated: false,
  currentRep: 0,
  targetReps: 10,
  currentAngle: 0,
  targetAngle: 90,
  phase: 'START',
  holdTimeRemaining: 0,
  accuracy: 100,
  maxRom: 0,
  startedAt: null,

  setIsActive: (val) => set({ isActive: val, startedAt: val ? Date.now() : null }),
  setIsCalibrated: (val) => set({ isCalibrated: val }),

  updateTelemetry: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  resetTraining: () =>
    set({
      isActive: false,
      isCalibrated: false,
      currentRep: 0,
      currentAngle: 0,
      phase: 'START',
      holdTimeRemaining: 0,
      accuracy: 100,
      maxRom: 0,
      startedAt: null,
    }),
}));
