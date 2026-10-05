import { create } from 'zustand';
import { User, UserRole } from '../types/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  loginAs: (role: UserRole, patientId?: number, name?: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const DEFAULT_USER: User = {
  id: 1,
  name: 'คุณสมชาย มีสุข',
  role: 'patient',
  status: 'active',
  patient_id: 1,
  created_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: DEFAULT_USER,
  token: 'mock-jwt-token',
  isAuthenticated: true,
  isLoading: false,
  activeRole: 'patient',

  loginAs: (role: UserRole, patientId?: number, name?: string) => {
    const user: User = {
      id: patientId || (role === 'therapist' ? 99 : 1),
      name: name || (role === 'therapist' ? 'กภ. วริศรา (นักกายภาพบำบัด)' : role === 'caregiver' ? 'คุณวิภา (ผู้ดูแล)' : 'คุณสมชาย มีสุข'),
      role,
      status: 'active',
      patient_id: patientId || 1,
      created_at: new Date().toISOString(),
    };
    set({ user, activeRole: role, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, activeRole: 'patient' });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user, activeRole: user?.role || 'patient' }),
}));
