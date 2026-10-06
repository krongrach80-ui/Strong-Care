import { create } from 'zustand';
import { LiveAnalysisFrame, RepResult } from '../types/exercise';
import { Session } from '../types/session';
import { api } from '../services/api';
import { poseService } from '../services/poseService';
import { OfflineStorageService } from '../services/offlineStorageService';

interface SessionState {
  isActive: boolean;
  isCalibrated: boolean;
  startTime: number;
  durationSeconds: number;
  liveFrame: LiveAnalysisFrame | null;
  repResults: RepResult[];
  lastSavedSession: Session | null;
  isSaving: boolean;

  setCalibrated: (val: boolean) => void;
  startSession: () => void;
  updateLiveFrame: (frame: LiveAnalysisFrame) => void;
  addRepResult: (result: RepResult) => void;
  tickDuration: () => void;
  finishSession: (patientId: number, exerciseId: number) => Promise<Session>;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isActive: false,
  isCalibrated: false,
  startTime: 0,
  durationSeconds: 0,
  liveFrame: null,
  repResults: [],
  lastSavedSession: null,
  isSaving: false,

  setCalibrated: (val) => set({ isCalibrated: val }),

  startSession: () =>
    set({
      isActive: true,
      startTime: Date.now(),
      durationSeconds: 0,
      repResults: [],
      liveFrame: null,
    }),

  updateLiveFrame: (frame) => set({ liveFrame: frame }),

  addRepResult: (result) =>
    set((state) => ({
      repResults: [...state.repResults, result],
    })),

  tickDuration: () =>
    set((state) => ({
      durationSeconds: state.durationSeconds + 1,
    })),

  finishSession: async (patientId: number, exerciseId: number) => {
    const { repResults, durationSeconds } = get();
    set({ isSaving: true, isActive: false });

    const totalReps = repResults.length;
    const correctReps = repResults.filter((r) => r.is_correct).length;
    const totalAccuracy = repResults.reduce((acc, r) => acc + r.accuracy, 0);
    const avgAccuracy = totalReps > 0 ? Math.round(totalAccuracy / totalReps) : 0;
    const maxAngle = totalReps > 0 ? Math.max(...repResults.map((r) => r.angle)) : 0;
    const avgAngle = totalReps > 0 ? Math.round(repResults.reduce((acc, r) => acc + r.angle, 0) / totalReps) : 0;
    const avgDuration = totalReps > 0 ? Math.round((durationSeconds / totalReps) * 10) / 10 : 0;

    const sessionPayload: Partial<Session> = {
      patient_id: patientId,
      exercise_id: exerciseId,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString().slice(0, 19).replace('T', ' '),
      ended_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      total_reps: totalReps,
      correct_reps: correctReps,
      accuracy: avgAccuracy,
      avg_duration_per_rep: avgDuration,
      max_angle: maxAngle,
      avg_angle: avgAngle,
      status: 'completed',
      results: repResults,
    };

    // ตรวจสอบว่ามาจากโหมดจำลอง (Mock Mode) หรือไม่ ถ้าใช่ห้ามบันทึกเซสชัน
    if (poseService.getIsMockMode()) {
      console.info('ℹ️ เซสชันมาจากโหมดจำลอง (Mock Mode) - ข้ามการบันทึกข้อมูล');
      set({ lastSavedSession: null, isSaving: false });
      return null as any;
    }

    let finalizedSession: Session;
    let serverSaveFailed = false;

    try {
      finalizedSession = await api.saveSession(sessionPayload);
    } catch (e) {
      serverSaveFailed = true;
      console.warn('Saving to backend failed, using local offline result:', e);
      finalizedSession = {
        id: Math.floor(Math.random() * 1000) + 10,
        patient_id: patientId,
        exercise_id: exerciseId,
        started_at: sessionPayload.started_at!,
        ended_at: sessionPayload.ended_at!,
        total_reps: totalReps,
        correct_reps: correctReps,
        accuracy: avgAccuracy,
        avg_duration_per_rep: avgDuration,
        max_angle: maxAngle,
        avg_angle: avgAngle,
        status: 'completed',
        results: repResults,
      };
    }

    // Always persist to local offline storage (Offline-first!)
    try {
      OfflineStorageService.saveLocalSession(finalizedSession);
      // เข้าคิวเฉพาะเมื่อบันทึกขึ้นเซิร์ฟเวอร์ล้มเหลว
      if (serverSaveFailed) {
        OfflineStorageService.addToSyncQueue(finalizedSession);
      }
    } catch (err) {
      console.warn('Failed to save to OfflineStorageService:', err);
    }

    set({ lastSavedSession: finalizedSession, isSaving: false });
    return finalizedSession;
  },

  resetSession: () =>
    set({
      isActive: false,
      isCalibrated: false,
      startTime: 0,
      durationSeconds: 0,
      liveFrame: null,
      repResults: [],
      isSaving: false,
    }),
}));
