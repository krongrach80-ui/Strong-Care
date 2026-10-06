/**
 * Clinical Governance: Approval Audit Trail Service
 * 
 * Captures and persists clinician/caregiver approval decisions when modifying
 * exercise prescriptions following AI Biomechanics Recommendations.
 * 
 * Schema:
 * Approval
 * ├── recommendation_id
 * ├── previous_config
 * ├── proposed_config
 * ├── actual_config
 * ├── decision (APPROVED | MODIFIED | REJECTED)
 * ├── approved_by
 * ├── audit_note
 * ├── timestamp
 * └── model_version
 */

export type ApprovalDecision = 'APPROVED' | 'MODIFIED' | 'REJECTED';

export interface ExerciseConfigSnapshot {
  target_angle: number;
  target_reps: number;
  min_angle?: number;
  max_angle?: number;
}

export interface ApprovalAuditRecord {
  id: string;
  recommendation_id: string;
  patient_id?: number;
  patient_name?: string;
  exercise_id: number;
  exercise_name: string;
  previous_config: ExerciseConfigSnapshot;
  proposed_config: ExerciseConfigSnapshot;
  actual_config: ExerciseConfigSnapshot;
  decision: ApprovalDecision;
  approved_by: string;
  audit_note: string;
  timestamp: string;
  model_version: string;
}

const STORAGE_KEY = 'physiovision_approval_audit_trail';

const INITIAL_AUDIT_LOGS: ApprovalAuditRecord[] = [
  {
    id: 'AUD-2026-001',
    recommendation_id: 'REC-2026-SOMCHAI-01',
    patient_id: 1,
    patient_name: 'คุณสมชาย มีสุข',
    exercise_id: 1,
    exercise_name: 'Shoulder Raise (กางแขนยกด้านข้าง)',
    previous_config: { target_angle: 105, target_reps: 8, min_angle: 20, max_angle: 150 },
    proposed_config: { target_angle: 115, target_reps: 10, min_angle: 20, max_angle: 150 },
    actual_config: { target_angle: 115, target_reps: 10, min_angle: 20, max_angle: 150 },
    decision: 'APPROVED',
    approved_by: 'กภ. วริศรา (นักกายภาพบำบัดประจำตัว)',
    audit_note: 'ผู้ป่วยมีพัฒนาการช่วงการเคลื่อนไหวดีขึ้นต่อเนื่อง (ROM เฉลี่ย 118° แม่นยำ 92%) อนุมัติปรับเพิ่มตามคำแนะนำของ AI',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    model_version: 'PhysioVision-Biomechanics-v2.4',
  },
  {
    id: 'AUD-2026-002',
    recommendation_id: 'REC-2026-SOMCHAI-02',
    patient_id: 1,
    patient_name: 'คุณสมชาย มีสุข',
    exercise_id: 1,
    exercise_name: 'Shoulder Raise (กางแขนยกด้านข้าง)',
    previous_config: { target_angle: 90, target_reps: 8, min_angle: 20, max_angle: 150 },
    proposed_config: { target_angle: 110, target_reps: 10, min_angle: 20, max_angle: 150 },
    actual_config: { target_angle: 105, target_reps: 8, min_angle: 20, max_angle: 150 },
    decision: 'MODIFIED',
    approved_by: 'กภ. วริศรา (นักกายภาพบำบัดประจำตัว)',
    audit_note: 'AI เสนอ 110° 10 ครั้ง แต่นักกายภาพตรวจพบผู้ป่วยยังมีอาการตึงช่วงท้าย จึงปรับลดยอดลงเหลือ 105° 8 ครั้งเพื่อความปลอดภัย',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    model_version: 'PhysioVision-Biomechanics-v2.3',
  },
];

export class ApprovalAuditService {
  public static getAuditRecords(): ApprovalAuditRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load approval audit records:', e);
      return INITIAL_AUDIT_LOGS;
    }
  }

  public static saveAuditRecord(record: ApprovalAuditRecord): void {
    try {
      const existing = this.getAuditRecords();
      const updated = [record, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save approval audit record:', e);
    }
  }

  public static createRecord(params: {
    recommendation_id?: string;
    patient_id?: number;
    patient_name?: string;
    exercise_id: number;
    exercise_name: string;
    previous_config: ExerciseConfigSnapshot;
    proposed_config: ExerciseConfigSnapshot;
    actual_config: ExerciseConfigSnapshot;
    decision?: ApprovalDecision;
    approved_by: string;
    audit_note: string;
  }): ApprovalAuditRecord {
    // Detect decision automatically if not explicitly given
    let decision: ApprovalDecision = params.decision || 'APPROVED';
    if (!params.decision) {
      const isAngleSame = params.actual_config.target_angle === params.proposed_config.target_angle;
      const isRepsSame = params.actual_config.target_reps === params.proposed_config.target_reps;
      decision = isAngleSame && isRepsSame ? 'APPROVED' : 'MODIFIED';
    }

    const newRecord: ApprovalAuditRecord = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recommendation_id: params.recommendation_id || `REC-${Date.now()}`,
      patient_id: params.patient_id,
      patient_name: params.patient_name || 'คุณสมชาย มีสุข',
      exercise_id: params.exercise_id,
      exercise_name: params.exercise_name,
      previous_config: params.previous_config,
      proposed_config: params.proposed_config,
      actual_config: params.actual_config,
      decision,
      approved_by: params.approved_by || 'กภ. วริศรา (นักกายภาพบำบัดประจำตัว)',
      audit_note: params.audit_note || 'อนุมัติการปรับเปลี่ยนแผนตามการประเมินทางคลินิก',
      timestamp: new Date().toISOString(),
      model_version: 'PhysioVision-Biomechanics-v2.4',
    };

    this.saveAuditRecord(newRecord);
    return newRecord;
  }
}
