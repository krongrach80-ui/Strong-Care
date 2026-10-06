import { create } from 'zustand';
import { SafetyTelemetry, SafetyViolation, ClinicalSafetyState } from '../types/safety';

interface SafetyStore {
  telemetry: SafetyTelemetry;
  violationsLog: SafetyViolation[];
  isUserSosTriggered: boolean;
  setTelemetry: (telemetry: SafetyTelemetry) => void;
  triggerManualSos: () => void;
  clearManualSos: () => void;
  resumeSafety: () => void;
  resetViolations: () => void;
}

const INITIAL_TELEMETRY: SafetyTelemetry = {
  state: 'READY',
  severity: 'NORMAL',
  isEmergencyStop: false,
  activeViolations: [],
  safetyScore: 100,
  canResume: true,
  confidenceScore: 100,
  isLowConfidenceFailSafe: false,
  statusMessage: 'ระบบพร้อมสำหรับการฝึกกายภาพอย่างปลอดภัย',
};

export const useSafetyStore = create<SafetyStore>((set) => ({
  telemetry: INITIAL_TELEMETRY,
  violationsLog: [],
  isUserSosTriggered: false,

  setTelemetry: (telemetry) =>
    set((state) => {
      const newViolations = telemetry.activeViolations.filter(
        (v) => !state.violationsLog.some((old) => old.code === v.code && Math.abs(old.timestamp - v.timestamp) < 2000)
      );

      return {
        telemetry,
        violationsLog: newViolations.length > 0 ? [...state.violationsLog, ...newViolations] : state.violationsLog,
      };
    }),

  triggerManualSos: () =>
    set((state) => ({
      isUserSosTriggered: true,
      telemetry: {
        ...state.telemetry,
        state: 'STOP',
        severity: 'CRITICAL_STOP',
        isEmergencyStop: true,
        statusMessage: '🚨 ผู้ใช้กดปุ่มขอความช่วยเหลือฉุกเฉิน (User SOS)',
      },
    })),

  clearManualSos: () =>
    set((state) => ({
      isUserSosTriggered: false,
      telemetry: {
        ...state.telemetry,
        state: 'READY',
        severity: 'NORMAL',
        isEmergencyStop: false,
        statusMessage: 'ยกเลิกการขอความช่วยเหลือ พร้อมดำเนินการต่อ',
      },
    })),

  resumeSafety: () =>
    set((state) => ({
      isUserSosTriggered: false,
      telemetry: {
        ...state.telemetry,
        state: 'READY',
        severity: 'NORMAL',
        isEmergencyStop: false,
        activeViolations: [],
        canResume: true,
        statusMessage: 'ฟื้นฟูระบบความปลอดภัยเรียบร้อย',
      },
    })),

  resetViolations: () => set({ violationsLog: [] }),
}));
