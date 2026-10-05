import { Patient } from '../types/patient';
import { ExerciseDefinition, RepResult } from '../types/exercise';
import { Session } from '../types/session';
import { usePatientStore } from '../store/patientStore';
import { useExerciseStore } from '../store/exerciseStore';
import { useSessionStore } from '../store/sessionStore';
import { IndexedDBStorageService } from './indexedDbService';
import { AdaptiveRehabEngine } from './adaptiveRehabService';

export interface SimulationState {
  isSimulationActive: boolean;
  simulationPatient: Patient;
  simulationExercise: ExerciseDefinition;
  previousSession: Session;
  currentSession: Session;
}

export const SOMCHAI_PATIENT: Patient = {
  id: 9991,
  patient_code: 'HN-1001',
  name: 'คุณสมชาย เจริญสุข (Demo Session)',
  age: 68,
  gender: 'male',
  notes: 'ฟื้นฟูกล้ามเนื้อข้อไหล่ติดระยะฟื้นตัว (Frozen Shoulder Post-Subacute)',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const SHOULDER_RAISE_DEMO_EXERCISE: ExerciseDefinition = {
  id: 1,
  name: 'ยกแขนขึ้นด้านหน้า (Shoulder Raise)',
  slug: 'shoulder_raise',
  category: 'Shoulder',
  description: 'ยกแขนตรงขึ้นด้านหน้าเพื่อฟื้นฟูพิสัยการเคลื่อนไหวและเพิ่มความแข็งแรงของหัวไหล่',
  target_joint: 'Shoulder (Glenohumeral)',
  target_angle: 105,
  min_angle: 90,
  max_angle: 130,
  target_reps: 8,
  difficulty: 'intermediate',
  hold_seconds: 2,
};

export class SimulationDataService {
  private static isSimActive = false;

  public static isSimulationMode(): boolean {
    return this.isSimActive;
  }

  public static setSimulationMode(active: boolean): void {
    this.isSimActive = active;
  }

  /**
   * Load the Somchai Frozen Shoulder Demo Session
   * Previous: Reps 8, Accuracy 84%, ROM 105°
   * Current: Reps 10, Accuracy 92%, ROM 118°
   */
  public static async loadSomchaiDemoSession(): Promise<{
    patient: Patient;
    exercise: ExerciseDefinition;
    prevSession: Session;
    currSession: Session;
  }> {
    this.isSimActive = true;

    // Previous Session (3 days ago)
    const prevReps: RepResult[] = Array.from({ length: 8 }, (_, i) => ({
      rep_number: i + 1,
      angle: 102 + (i % 3) * 2,
      accuracy: 82 + (i % 4) * 2,
      duration: 3.4,
      is_correct: true,
      feedback: 'ฟอร์มดี สันหลังตรง',
      timestamp: Date.now() - 3 * 86400000 + i * 4000,
      activeRomDeg: 105,
      romAchievementPct: 98,
      formIntegrityScore: 84,
      compensations: [],
    }));

    const prevSession: Session = {
      id: 999101,
      patient_id: SOMCHAI_PATIENT.id,
      exercise_id: SHOULDER_RAISE_DEMO_EXERCISE.id,
      patient_name: SOMCHAI_PATIENT.name,
      patient_code: SOMCHAI_PATIENT.patient_code,
      exercise_name: SHOULDER_RAISE_DEMO_EXERCISE.name,
      exercise_slug: SHOULDER_RAISE_DEMO_EXERCISE.slug,
      total_reps: 8,
      correct_reps: 7,
      accuracy: 84,
      max_angle: 105,
      avg_angle: 102,
      started_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      status: 'completed',
      results: prevReps,
    };

    // Current Session (Just completed today with progress!)
    const currReps: RepResult[] = Array.from({ length: 10 }, (_, i) => ({
      rep_number: i + 1,
      angle: 116 + (i % 3) * 2,
      accuracy: 90 + (i % 3),
      duration: 3.2,
      is_correct: true,
      feedback: 'เคลื่อนไหวราบรื่นมาก ควบคุมได้ดี',
      timestamp: Date.now() - 300000 + i * 4000,
      activeRomDeg: 118,
      romAchievementPct: 112,
      formIntegrityScore: 92,
      compensations: [],
    }));

    const currSession: Session = {
      id: 999102,
      patient_id: SOMCHAI_PATIENT.id,
      exercise_id: SHOULDER_RAISE_DEMO_EXERCISE.id,
      patient_name: SOMCHAI_PATIENT.name,
      patient_code: SOMCHAI_PATIENT.patient_code,
      exercise_name: SHOULDER_RAISE_DEMO_EXERCISE.name,
      exercise_slug: SHOULDER_RAISE_DEMO_EXERCISE.slug,
      total_reps: 10,
      correct_reps: 10,
      accuracy: 92,
      max_angle: 118,
      avg_angle: 115,
      started_at: new Date().toISOString(),
      status: 'completed',
      results: currReps,
    };

    // Save to IndexedDB demo stores
    await IndexedDBStorageService.saveSessionWithDetails(prevSession);
    await IndexedDBStorageService.saveSessionWithDetails(currSession);

    // Update patient and exercise stores
    const patientStore = usePatientStore.getState();
    const existingPatient = patientStore.patients.find(p => p.id === SOMCHAI_PATIENT.id);
    if (!existingPatient) {
      patientStore.patients.unshift(SOMCHAI_PATIENT);
    }
    patientStore.selectPatient(SOMCHAI_PATIENT);

    const exerciseStore = useExerciseStore.getState();
    exerciseStore.selectExercise(SHOULDER_RAISE_DEMO_EXERCISE);

    // Save current session as latest in sessionStore
    const sessionStore = useSessionStore.getState();
    sessionStore.lastSavedSession = currSession;

    // Cache the demo recommendation in adaptive service
    AdaptiveRehabEngine.analyzeProgress(currSession, [prevSession]);

    return {
      patient: SOMCHAI_PATIENT,
      exercise: SHOULDER_RAISE_DEMO_EXERCISE,
      prevSession,
      currSession,
    };
  }
}
