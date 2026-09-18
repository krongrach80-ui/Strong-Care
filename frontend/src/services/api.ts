const API_BASE = '/api/v1';

export interface UserItem {
  id: number;
  username: string;
  display_name: string;
  role: string;
  status: string;
  created_at: string;
  face_profiles: {
    id: number;
    angle_label: string;
    quality_score: number;
    image_path: string;
    created_at: string;
  }[];
}

export interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  registered_users_count: number;
  registered_faces_count: number;
  today_attendance_count: number;
  ai_engine_status: string;
  detector_model: string;
  recognizer_model: string;
  fps_estimate: number;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  display_name: string;
  type: string;
  confidence: number;
  status: string;
  recognized_at: string;
}

export interface VoiceSettings {
  template_greeting: string;
  template_welcome: string;
  template_attendance: string;
  similarity_threshold: number;
  temporal_confirmation_frames: number;
  voice_cooldown_seconds: number;
  voice_name: string;
}

export const api = {
  async getSystemStats(): Promise<SystemStats> {
    const res = await fetch(API_BASE + '/system/stats');
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  async getUsers(): Promise<UserItem[]> {
    const res = await fetch(API_BASE + '/users/');
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  async deleteUser(userId: number): Promise<{ success: boolean }> {
    const res = await fetch(API_BASE + '/users/' + userId, { method: 'DELETE' });
    return res.json();
  },

  async registerFace(data: {
    username: string;
    display_name: string;
    role: string;
    angle_label: string;
    image_base64: string;
  }) {
    const res = await fetch(API_BASE + '/faces/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'Registration failed');
    }
    return json;
  },

  async selfRegister(data: {
    username: string;
    display_name: string;
    role?: string;
    image_base64: string;
  }) {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || 'การสมัครสมาชิกล้มเหลว');
    }
    return json;
  },

  async getAttendance(limit: number = 50): Promise<AttendanceRecord[]> {
    const res = await fetch(API_BASE + '/attendance/?limit=' + limit);
    return res.json();
  },

  async getTodayAttendance(): Promise<{ count: number; records: AttendanceRecord[] }> {
    const res = await fetch(API_BASE + '/attendance/today');
    return res.json();
  },

  async getVoiceSettings(): Promise<VoiceSettings> {
    const res = await fetch(API_BASE + '/voice/settings');
    return res.json();
  },

  async updateVoiceSettings(settings: Partial<VoiceSettings>) {
    const res = await fetch(API_BASE + '/voice/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async speak(text: string, voice?: string) {
    const res = await fetch(API_BASE + '/voice/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice })
    });
    return res.json();
  },

  async resetTracker() {
    const res = await fetch(API_BASE + '/recognition/reset-tracker', { method: 'POST' });
    return res.json();
  }
};