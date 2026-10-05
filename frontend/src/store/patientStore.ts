import { create } from 'zustand';
import { Patient } from '../types/patient';
import { api } from '../services/api';

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;
  isFaceAuthOpen: boolean;
  faceAuthMode: 'login' | 'enroll';
  fetchPatients: () => Promise<void>;
  selectPatient: (patient: Patient) => void;
  addPatient: (patient: Partial<Patient>) => Promise<Patient>;
  openFaceAuth: (mode?: 'login' | 'enroll') => void;
  closeFaceAuth: () => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  selectedPatient: null,
  isLoading: false,
  isFaceAuthOpen: false,
  faceAuthMode: 'login',

  fetchPatients: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getPatients();
      const currentSelected = get().selectedPatient;
      const updatedSelected = currentSelected
        ? data.find((p) => p.id === currentSelected.id) || data[0] || null
        : data[0] || null;
      set({
        patients: data,
        selectedPatient: updatedSelected,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  selectPatient: (patient) => set({ selectedPatient: patient }),

  openFaceAuth: (mode = 'login') => set({ isFaceAuthOpen: true, faceAuthMode: mode }),
  closeFaceAuth: () => set({ isFaceAuthOpen: false }),

  addPatient: async (patientData) => {
    set({ isLoading: true });
    try {
      const newPatient = await api.createPatient(patientData);
      set((state) => ({
        patients: [newPatient, ...state.patients],
        selectedPatient: newPatient,
        isLoading: false,
      }));
      return newPatient;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },
}));
