export const VOICE_CONFIG = {
  DEFAULT_LANGUAGE: 'th-TH',
  DEFAULT_VOLUME: 1.0,
  DEFAULT_RATE: 0.95, // slightly slower for senior clarity

  PRIORITIES: {
    EMERGENCY: 'emergency',
    CRITICAL: 'critical',
    WARNING: 'warning',
    SUCCESS: 'success',
    INSTRUCTION: 'instruction',
    INFO: 'info',
  } as const,

  COOLDOWNS_MS: {
    EMERGENCY: 500,
    WARNING: 3500,
    INSTRUCTION: 2500,
    SUCCESS: 1200,
    INFO: 3000,
  },

  PAGES_GUIDE_TH: {
    home: 'ยินดีต้อนรับสู่ Strong Care แพลตฟอร์ม AI ช่วยติดตามและวิเคราะห์การฝึกกายภาพเพื่อความปลอดภัยของผู้สูงอายุครับ',
    patients: 'หน้ารายชื่อผู้ป่วย สามารถเลือกประวัติ หรือลงทะเบียนสแกนใบหน้าเข้าระบบได้ที่นี่ครับ',
    exercises: 'หน้าโปรแกรมกายภาพบำบัด เลือกท่าที่แพทย์หรือนักกายภาพแนะนำเพื่อเริ่มต้นฝึกครับ',
    training: 'หน้าเริ่มต้นฝึกกายภาพ กล้องจะตรวจจับท่าทางและนับจำนวนครั้ง พร้อมระบบความปลอดภัยหยุดฉุกเฉินอัตโนมัติครับ',
    history: 'หน้าประวัติและรายงานการฟื้นฟู ติดตามการพัฒนาการและตรวจสอบการอนุมัติแผนการฝึกได้ครับ',
    reports: 'หน้ารายงานสรุปทางการแพทย์ แสดงผลการฝึกรายรอบและบันทึกความปลอดภัยอย่างละเอียดครับ',
    settings: 'หน้าการตั้งค่า ปรับขนาดตัวอักษร เสียง และเปิดโหมดจำลองได้ครับ',
    dashboard: 'หน้าแดชบอร์ดภาพรวม สรุปสถิติความก้าวหน้าและการดูแลผู้ป่วยครับ',
  },
};
