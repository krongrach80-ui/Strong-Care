import { create } from 'zustand';

interface SeniorState {
  isSeniorMode: boolean;
  isEmergencyAlertOpen: boolean;
  toggleSeniorMode: () => void;
  setSeniorMode: (val: boolean) => void;
  triggerEmergencyAlert: () => void;
  dismissEmergencyAlert: () => void;
}

const STORAGE_KEY = 'physiovision_senior_mode';

export const useSeniorStore = create<SeniorState>((set) => ({
  isSeniorMode: localStorage.getItem(STORAGE_KEY) === 'true',
  isEmergencyAlertOpen: false,

  toggleSeniorMode: () =>
    set((state) => {
      const next = !state.isSeniorMode;
      localStorage.setItem(STORAGE_KEY, String(next));
      return { isSeniorMode: next };
    }),

  setSeniorMode: (val) => {
    localStorage.setItem(STORAGE_KEY, String(val));
    set({ isSeniorMode: val });
  },

  triggerEmergencyAlert: () => set({ isEmergencyAlertOpen: true }),
  dismissEmergencyAlert: () => set({ isEmergencyAlertOpen: false }),
}));
