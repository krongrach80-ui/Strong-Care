export const ENV = {
  APP_NAME: 'Strong Care',
  APP_VERSION: '1.0.0',
  TAGLINE_TH: 'ระบบช่วยติดตามและวิเคราะห์การฝึกกายภาพด้วย AI',
  TAGLINE_EN: 'AI-assisted Rehabilitation Monitoring Platform',
  PITCH_TH: 'เพื่อการฝึกที่ปลอดภัย เหมาะสมกับผู้ใช้แต่ละราย และคำนึงถึงความเป็นส่วนตัว',
  API_BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  DB_NAME: 'StrongCareDB',
  MODEL_VERSION: 'MediaPipe-Pose-Landmarker-WASM-v0.10.14',
  FACE_MODEL_VERSION: 'StrongCare-FaceMesh-128D-v1.0',
};
