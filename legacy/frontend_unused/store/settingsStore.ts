import { create } from 'zustand';

interface SettingsStore {
  isSimulationMode: boolean;
  selectedCameraId: string | null;
  volume: number;
  rate: number;
  isPrivacyConsentAccepted: boolean;
  isSeniorMode: boolean;
  setSimulationMode: (val: boolean) => void;
  setSelectedCameraId: (id: string | null) => void;
  setVolume: (val: number) => void;
  setRate: (val: number) => void;
  setPrivacyConsentAccepted: (val: boolean) => void;
  setSeniorMode: (val: boolean) => void;
}

const STORAGE_SIM_KEY = 'strongcare_simulation_mode';
const STORAGE_CONSENT_KEY = 'strongcare_privacy_consent';

export const useSettingsStore = create<SettingsStore>((set) => ({
  isSimulationMode: localStorage.getItem(STORAGE_SIM_KEY) === 'true',
  selectedCameraId: null,
  volume: 1.0,
  rate: 0.95,
  isPrivacyConsentAccepted: localStorage.getItem(STORAGE_CONSENT_KEY) === 'true',
  isSeniorMode: localStorage.getItem('physiovision_senior_mode') === 'true',

  setSimulationMode: (val) => {
    localStorage.setItem(STORAGE_SIM_KEY, String(val));
    set({ isSimulationMode: val });
  },

  setSelectedCameraId: (id) => set({ selectedCameraId: id }),
  setVolume: (volume) => set({ volume }),
  setRate: (rate) => set({ rate }),

  setPrivacyConsentAccepted: (val) => {
    localStorage.setItem(STORAGE_CONSENT_KEY, String(val));
    set({ isPrivacyConsentAccepted: val });
  },

  setSeniorMode: (val) => {
    localStorage.setItem('physiovision_senior_mode', String(val));
    set({ isSeniorMode: val });
  },
}));
