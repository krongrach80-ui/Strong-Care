import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Volume2, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Play, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api, VoiceSettings as VoiceSettingsType } from '../services/api';
import { useSpeech } from '../hooks/useSpeech';

export const VoiceSettings: React.FC = () => {
  const { speak } = useSpeech();
  const [settings, setSettings] = useState<VoiceSettingsType>({
    temporal_confirmation_frames: 3,
    voice_cooldown_seconds: 6.0,
    similarity_threshold: 0.60,
    voice_name: 'th-TH',
    template_greeting: 'สวัสดีครับ {name} ยินดีต้อนรับครับ',
    template_welcome: 'ยินดีต้อนรับสู่ระบบสแกนใบหน้าครับ {name}',
    template_attendance: 'บันทึกเวลาสำเร็จแล้วครับ {name}'
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getVoiceSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateVoiceSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoice = (template: string) => {
    const text = template.replace('{name}', 'คุณสมชาย');
    speak(text);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Outfit']">ตั้งค่าระบบเสียงและ AI Engine</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ปรับแต่งข้อความทักทาย, การหน่วงเวลาเรียกชื่อซ้ำ (Cooldown), และเกณฑ์ความแม่นยำของโมเดล
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Anti-False AI Parameters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base font-['Outfit'] border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>พารามิเตอร์ Anti-False Recognition (ป้องกันการทักทายผิด)</span>
          </div>

          <div className="space-y-6 text-xs">
            {/* Temporal Confirmation Frames */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">
                  จำนวนเฟรมยืนยันตัวตนต่อเนื่อง (Temporal Confirmation Frames)
                </label>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {settings.temporal_confirmation_frames} เฟรม
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={settings.temporal_confirmation_frames}
                onChange={(e) => setSettings({ ...settings, temporal_confirmation_frames: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ต้องตรวจพบใบหน้าบุคคลเดิมต่อเนื่องตามจำนวนเฟรมนี้ จึงจะยืนยันตัวตนและเริ่มพูด (ค่ามาตรฐาน: 3 เฟรม)
              </p>
            </div>

            {/* Voice Cooldown */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">
                  ระยะเวลาหน่วงไม่พูดซ้ำ (Voice Cooldown Seconds)
                </label>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {settings.voice_cooldown_seconds} วินาที
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={settings.voice_cooldown_seconds}
                onChange={(e) => setSettings({ ...settings, voice_cooldown_seconds: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                หลังจากเรียกชื่อบุคคลนั้นแล้ว จะไม่พูดซ้ำอีกภายในกี่วินาที เพื่อไม่ให้เกิดเสียงรบกวนต่อเนื่อง
              </p>
            </div>

            {/* Similarity Threshold */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">
                  เกณฑ์ความคล้ายคลึงของเวกเตอร์ (Cosine Similarity Threshold)
                </label>
                <span className="font-mono font-bold text-indigo-600 text-sm">
                  {(settings.similarity_threshold * 100).toFixed(0)}% ({settings.similarity_threshold})
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.85"
                step="0.01"
                value={settings.similarity_threshold}
                onChange={(e) => setSettings({ ...settings, similarity_threshold: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                คะแนนความเหมือนขั้นต่ำในการตัดสินว่าตรงกับคนที่ลงทะเบียนไว้หรือไม่ (SFace แนะนำ 0.60 - 0.68)
              </p>
            </div>
          </div>
        </div>

        {/* Speech Templates */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base font-['Outfit'] border-b border-slate-100 pb-3">
            <Volume2 className="w-5 h-5 text-[#2563EB]" />
            <span>เทมเพลตข้อความเสียง AI (Voice Synthesis Templates)</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Greeting Template */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">
                  เทมเพลตทักทายทั่วไป (Greeting)
                </label>
                <button
                  type="button"
                  onClick={() => handleTestVoice(settings.template_greeting)}
                  className="text-[#2563EB] hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>ทดลองฟัง</span>
                </button>
              </div>
              <input
                type="text"
                value={settings.template_greeting}
                onChange={(e) => setSettings({ ...settings, template_greeting: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <p className="text-[11px] text-slate-400 mt-1">ใช้คำว่า <code>&#123;name&#125;</code> เป็นตัวแทนชื่อผู้ใช้งาน</p>
            </div>

            {/* Attendance Template */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">
                  เทมเพลตแจ้งบันทึกเวลาเข้างาน (Attendance Check-In)
                </label>
                <button
                  type="button"
                  onClick={() => handleTestVoice(settings.template_attendance)}
                  className="text-[#2563EB] hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>ทดลองฟัง</span>
                </button>
              </div>
              <input
                type="text"
                value={settings.template_attendance}
                onChange={(e) => setSettings({ ...settings, template_attendance: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm shadow-[0_10px_25px_-4px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
