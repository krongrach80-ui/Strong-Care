/**
 * Strong Care - Therapy Schedule & Exercise Settings Persistence Service
 * 
 * Manages configuration for:
 * 1. Time mode: 'now' (Start immediately) vs 'schedule' (Date & time booking)
 * 2. Exercise category: 'stretch' (ยืดเส้น), 'recovery' (ฟื้นฟู), 'therapy' (บำบัด), 'custom' (ส่วนอื่นๆ)
 * 3. Scheduled Date & Time with past-date validation
 * 4. Remembers last chosen settings in localStorage (easily swappable to Backend API)
 */

export type TherapyMode = 'physio' | 'minigame';
export type TimeSelectionMode = 'now' | 'schedule';
export type ExerciseCategoryType = 'stretch' | 'recovery' | 'therapy' | 'custom';

export interface TherapyScheduleConfig {
  mode: TherapyMode;
  timeMode: TimeSelectionMode;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  category: ExerciseCategoryType;
  categoryTitle: string; // e.g. 'กายภาพยืดเส้น', 'กายภาพฟื้นฟู', 'กายภาพบำบัด', 'ส่วนอื่นๆ: คอและบ่า'
  customArea?: string; // e.g. 'คอ', 'บ่า', 'ไหล่', 'หลัง'
  selectedStretchIds?: string[]; // IDs of selected 11 stretching exercises
  customHoldTimes?: Record<string, number>; // Custom duration per pose (seconds) e.g. { stretch_neck_lateral: 25 }
  savedAt?: string;
  notes?: string;
}

const STORAGE_KEY_PREFIX = 'strongcare_therapy_settings_';
const REMINDER_KEY = 'strongcare_scheduled_reminders';

/**
 * Get formatted today and tomorrow ISO strings (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * คำนวณวันและเวลาเริ่มต้นที่เหมาะสม:
 * - บวกเวลาล่วงหน้าอย่างน้อย 30 นาที
 * - ปัดเศษนาทีขึ้น (Round up) ไปที่รอบ 15 นาทีถัดไปเสมอ ไม่ให้ตกเป็นอดีต
 * - หากเวลาข้ามเที่ยงคืน จะเลื่อนวันที่ไปยังวันถัดไปให้อัตโนมัติ
 */
export function getDefaultScheduleDateTime(): { date: string; time: string } {
  const target = new Date();
  target.setMinutes(target.getMinutes() + 30);
  const remainder = target.getMinutes() % 15;
  if (remainder > 0) {
    target.setMinutes(target.getMinutes() + (15 - remainder));
  }
  target.setSeconds(0, 0);

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export function getDefaultDateString(): string {
  return getDefaultScheduleDateTime().date;
}

export function getDefaultTimeString(): string {
  return getDefaultScheduleDateTime().time;
}

/**
 * Format Thai Buddhist date string
 * e.g. "วันพุธที่ 7 ตุลาคม พ.ศ. 2569 เวลา 09:30 น."
 */
export function formatThaiDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const thaiDayNames = [
      'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
    ];
    const thaiMonthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const dayName = thaiDayNames[dateObj.getDay()] || '';
    const monthName = thaiMonthNames[month - 1] || '';
    const buddhistYear = year + 543;

    return `${dayName}ที่ ${day} ${monthName} พ.ศ. ${buddhistYear} เวลา ${timeStr || '09:00'} น.`;
  } catch (e) {
    return `${dateStr} ${timeStr}`;
  }
}

/**
 * Retrieve saved configuration with sensible defaults
 */
export function getSavedTherapyConfig(mode: TherapyMode = 'physio'): TherapyScheduleConfig {
  const key = `${STORAGE_KEY_PREFIX}${mode}`;
  const defaultSchedule = getDefaultScheduleDateTime();
  const defaultToday = defaultSchedule.date;
  const defaultTime = defaultSchedule.time;

  const defaultConfig: TherapyScheduleConfig = {
    mode,
    timeMode: 'now',
    scheduledDate: defaultToday,
    scheduledTime: defaultTime,
    category: 'stretch',
    categoryTitle: 'กายภาพยืดเส้น',
    customArea: '',
    selectedStretchIds: [
      'stretch_neck_lateral',
      'stretch_neck_flexion',
      'stretch_shoulder_cross',
      'stretch_triceps_overhead',
      'stretch_chest_open',
      'stretch_side_bend',
      'stretch_torso_twist',
      'stretch_quadriceps',
      'stretch_hamstrings',
      'stretch_calf',
      'stretch_piriformis_seated',
    ],
  };

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultConfig;
    const parsed: Partial<TherapyScheduleConfig> = JSON.parse(raw);
    return {
      ...defaultConfig,
      ...parsed,
      mode, // preserve current mode
      // If saved date is in the past, reset to today
      scheduledDate: parsed.scheduledDate && parsed.scheduledDate >= defaultToday
        ? parsed.scheduledDate
        : defaultToday,
    };
  } catch (e) {
    console.warn('[therapySettingsService] Failed to parse config, using defaults:', e);
    return defaultConfig;
  }
}

/**
 * Save configuration to localStorage and schedule reminder
 */
export function saveTherapyConfig(config: TherapyScheduleConfig): void {
  const key = `${STORAGE_KEY_PREFIX}${config.mode}`;
  const record: TherapyScheduleConfig = {
    ...config,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(record));

    if (config.timeMode === 'schedule') {
      // Register in reminders list
      const existingReminders: TherapyScheduleConfig[] = getSavedReminders();
      const filtered = existingReminders.filter(
        (r) => !(r.mode === config.mode && r.scheduledDate === config.scheduledDate)
      );
      filtered.push(record);
      localStorage.setItem(REMINDER_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('[therapySettingsService] Failed to save config:', e);
  }
}

/**
 * Get all scheduled reminders
 */
export function getSavedReminders(): TherapyScheduleConfig[] {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Check if any reminder is due right now
 */
export function checkDueReminder(): TherapyScheduleConfig | null {
  const reminders = getSavedReminders();
  if (!reminders.length) return null;

  const now = new Date();
  const todayStr = getTodayDateString();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  for (const rem of reminders) {
    if (rem.scheduledDate === todayStr && rem.scheduledTime) {
      const [h, m] = rem.scheduledTime.split(':').map(Number);
      // If within ± 5 minutes
      const diffMinutes = (h * 60 + m) - (currentHours * 60 + currentMinutes);
      if (diffMinutes >= -5 && diffMinutes <= 2) {
        return rem;
      }
    }
  }
  return null;
}
