export const SAFETY_CONFIG = {
  // Voice Priorities
  PRIORITY: {
    EMERGENCY_STOP: 10,
    SAFETY_WARNING: 8,
    EXERCISE_FEEDBACK: 5,
    NORMAL_VOICE: 2,
  },

  // Posture and Biomechanical Limits
  LIMITS: {
    MAX_TRUNK_LEAN_DEG: 22,
    MAX_SHOULDER_HIKE_DEG: 18,
    MAX_ANGULAR_VELOCITY_DEG_PER_SEC: 220,
    MIN_LANDMARK_VISIBILITY: 0.35,
    MIN_POSE_CONFIDENCE_PERCENT: 45,
    MIN_FRAMES_DANGER_TRIGGER_STOP: 8,
    MIN_FRAMES_SAFE_TRIGGER_RESUME: 25,
  },

  // Pre-Exercise 5-Point Calibration Requirements
  CALIBRATION: {
    MIN_FACE_QUALITY: 65,
    MIN_AMBIENT_LIGHT_LUMEN: 40,
    IDEAL_DISTANCE_METERS_MIN: 1.2,
    IDEAL_DISTANCE_METERS_MAX: 2.8,
    STABILITY_FRAMES_REQUIRED: 15,
    COUNTDOWN_SECONDS: 3,
  },

  // Fail-Safe Messages
  MESSAGES_TH: {
    EMERGENCY_STOP: 'หยุดการฝึกฉุกเฉิน กรุณาพักและจัดท่าทางใหม่เพื่อความปลอดภัยครับ',
    OUT_OF_FRAME: 'อยู่นอกกรอบกล้อง กรุณาขยับเข้ามาให้อยู่ในกรอบภาพครับ',
    OVER_ROM: 'ยกเกินระยะปลอดภัย กรุณาลดระดับลงเพื่อป้องกันการบาดเจ็บครับ',
    TRUNK_LEAN: 'ลำตัวเอียงเกินไป กรุณาทรงตัวหลังตรงครับ',
    SHOULDER_HIKE: 'ไหล่เกร็งยกขึ้น กรุณาผ่อนคลายสะบักครับ',
    TOO_FAST: 'ขยับเร็วเกินไป ค่อยๆ ยกอย่างช้าๆ ควบคุมกล้ามเนื้อครับ',
    LOW_CONFIDENCE: 'ภาพไม่ชัดเจน ระบบหยุดชั่วคราวเพื่อความปลอดภัยครับ',
  },
};
