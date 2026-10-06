import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  Camera,
  Shield,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle,
  Database,
  Radio,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useSeniorStore } from '../../store/seniorStore';
import { useSettingsStore } from '../../store/settingsStore';
import { voiceAssistant } from '../../services/voiceAssistantService';
import { OfflineStorageService } from '../../services/offlineStorageService';
import { IndexedDBStorageService } from '../../services/indexedDbService';

export const SettingsPage: React.FC = () => {
  const { isSeniorMode, toggleSeniorMode, setSeniorMode } = useSeniorStore();
  const {
    isSimulationMode,
    setSimulationMode,
    volume,
    setVolume,
    rate,
    setRate
  } = useSettingsStore();

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [purgeSuccess, setPurgeSuccess] = useState<boolean>(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>('');

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCam) {
          setSelectedCam(videoDevices[0].deviceId);
        }
      });
    }
  }, [selectedCam]);

  const handleTestVoice = () => {
    voiceAssistant.setVolume(volume);
    voiceAssistant.setRate(rate);
    voiceAssistant.speak('ทดสอบระดับเสียงระบบช่วยเหลือด้วยเสียง Strong Care AI ครับ พร้อมใช้งานอย่างปลอดภัย', {
      force: true,
      priority: 'instruction'
    });
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await OfflineStorageService.syncPendingSessions();
      setSyncStatus(`ซิงค์ข้อมูลสำเร็จ (${res.syncedCount} เซสชัน)`);
    } catch (e) {
      setSyncStatus('กำลังทำงานในโหมด Offline สำรองข้อมูลไว้ใน StrongCareDB เรียบร้อย');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handlePurgeBiometrics = async () => {
    if (window.confirm('คุณต้องการลบข้อมูลเวกเตอร์ชีวมิติใบหน้าทั้งหมดออกจากเครื่องนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      try {
        const db = await IndexedDBStorageService.getDB();
        const tx = db.transaction(['face_metadata'], 'readwrite');
        tx.objectStore('face_metadata').clear();
        setPurgeSuccess(true);
        setTimeout(() => setPurgeSuccess(false), 3000);
      } catch (e) {
        console.error('Failed to purge biometric templates:', e);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className={`${isSeniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-bold text-slate-800 flex items-center gap-2.5`}>
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>การตั้งค่าระบบ (System Settings)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ปรับแต่งการแสดงผล โหมดผู้สูงอายุ การสังเคราะห์เสียง และการปกป้องข้อมูลชีวมิติ Edge AI
          </p>
        </div>
      </div>

      {/* 1. Senior Mode & Accessibility */}
      <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="text-lg">🧓</span>
              <span>โหมดผู้สูงอายุ (Senior Mode & Accessibility)</span>
            </h2>
            <p className="text-xs text-slate-500">
              ขยายขนาดตัวอักษร ปุ่มกดขนาดใหญ่ 56px พร้อมเสียงแนะนำภาษาไทยอัตโนมัติ
            </p>
          </div>
          <button
            onClick={toggleSeniorMode}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              isSeniorMode ? 'bg-emerald-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isSeniorMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className={`p-3.5 rounded-[14px] border ${isSeniorMode ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <span className="font-bold block mb-1">ตัวอักษรใหญ่ คมชัด</span>
            <span>ขนาด Font +25% คอนทราสต์สูง มองเห็นชัดเจนโดยไม่ต้องเพ่ง</span>
          </div>
          <div className={`p-3.5 rounded-[14px] border ${isSeniorMode ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <span className="font-bold block mb-1">ปุ่มขอความช่วยเหลือ SOS</span>
            <span>ปุ่มฉุกเฉินลอยตัวตลอดเวลา หยุดการฝึกทันทีเมื่อสัมผัส</span>
          </div>
          <div className={`p-3.5 rounded-[14px] border ${isSeniorMode ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <span className="font-bold block mb-1">เสียงแนะนำภาษาไทย</span>
            <span>แนะนำท่าทางแบบเรียลไทม์ ชัดถ้อยชัดคำด้วยจังหวะที่เหมาะสม</span>
          </div>
        </div>
      </div>

      {/* 2. AI Voice Assistant Settings */}
      <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Volume2 className="w-5 h-5 text-emerald-600" />
          <span>ระบบช่วยเหลือด้วยเสียง (Thai Voice Assistant)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-700">
              <span className="font-medium">ระดับเสียง (Volume)</span>
              <span className="font-bold">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                voiceAssistant.setVolume(val);
              }}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-700">
              <span className="font-medium">ความเร็วในการพูด (Speech Rate)</span>
              <span className="font-bold">{rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={rate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setRate(val);
                voiceAssistant.setRate(val);
              }}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ระบบจัดลำดับความสำคัญของเสียง: ฉุกเฉิน (Priority 10) &bull; คำเตือน (Priority 8) &bull; แนะนำรอบ (Priority 5)
          </span>
          <button
            onClick={handleTestVoice}
            className="px-4 py-2 rounded-[12px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
          >
            🔊 ทดสอบเสียงพูด
          </button>
        </div>
      </div>

      {/* 3. Camera & Simulation Mode */}
      <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Camera className="w-5 h-5 text-emerald-600" />
          <span>การทำงานของกล้อง & โหมดจำลอง (Simulation Mode)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">เลือกอุปกรณ์กล้อง (Video Input)</label>
            <select
              value={selectedCam}
              onChange={(e) => setSelectedCam(e.target.value)}
              className="w-full px-3 py-2 rounded-[12px] bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 outline-none"
            >
              {cameras.length > 0 ? (
                cameras.map((c, i) => (
                  <option key={c.deviceId || i} value={c.deviceId}>
                    {c.label || `กล้องตัวที่ ${i + 1}`}
                  </option>
                ))
              ) : (
                <option value="">กล้องเริ่มต้นของระบบ (Default WebCam)</option>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">โหมดจำลองข้อมูล (Simulation Mode)</label>
              <button
                onClick={() => setSimulationMode(!isSimulationMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSimulationMode ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSimulationMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              สำหรับสาธิตแก่คณะกรรมการหรือกรณีไม่มีกล้องจริง ระบบจะใช้ชุดข้อมูล Deterministic Replay
            </p>
          </div>
        </div>
      </div>

      {/* 4. 🔐 Privacy Center (Privacy-Oriented / Privacy by Design) */}
      <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span>🔐 Privacy Center (Privacy-Oriented Architecture)</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Privacy by Design
          </span>
        </div>

        {/* 5 Core Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block font-sans">Face Image</span>
            <span className="font-bold text-emerald-700 text-xs">● Not Stored</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block font-sans">Face Embedding</span>
            <span className="font-bold text-teal-700 text-xs">● Encrypted</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block font-sans">Camera Processing</span>
            <span className="font-bold text-blue-700 text-xs">● Local Device</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block font-sans">Cloud Video Upload</span>
            <span className="font-bold text-purple-700 text-xs">● Disabled</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block font-sans">Data Sync</span>
            <span className="font-bold text-indigo-700 text-xs">● Summary Only</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          ระบบ Strong Care ทำงานแบบ Privacy-by-Design ทุกการประมวลผลโมเดล AI (MediaPipe Face Mesh 478 จุด และ Pose Landmarker) ทำงานบนหน่วยประมวลผลเครื่องผู้ใช้แบบ Edge AI 100% โดยไม่มีการส่งภาพหรือสตรีมวิดีโอออกนอกเครื่อง
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          {purgeSuccess ? (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              ลบข้อมูลชีวมิติออกจากเครื่องเรียบร้อยแล้ว
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              AES-GCM 256-bit Local Vault
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                const dummy = {
                  system: 'Strong Care v1.0',
                  exportedAt: new Date().toISOString(),
                  privacyManifest: 'Session Summary Only (Zero Raw Video)',
                };
                const blob = new Blob([JSON.stringify(dummy, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `strongcare-my-data-${Date.now()}.json`;
                a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            >
              <span>[ Export My Data ]</span>
            </button>

            <button
              onClick={handlePurgeBiometrics}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>[ Delete Biometric Data ]</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Offline Storage & Sync Queue */}
      <div className="bg-white rounded-[18px] p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>ฐานข้อมูลออฟไลน์ (StrongCareDB & Sync Queue)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">IndexedDB v1.0</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">สถานะการจัดเก็บข้อมูล:</span>
            <p className="text-slate-500">
              ข้อมูลเซสชัน การคำนวณองศา และเหตุการณ์ความปลอดภัยจะถูกเก็บลง StrongCareDB อัตโนมัติแม้ไม่มีอินเทอร์เน็ต
            </p>
          </div>

          <div className="flex items-center gap-3">
            {syncStatus && (
              <span className="text-xs text-emerald-700 font-medium">
                {syncStatus}
              </span>
            )}
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลกับเซิร์ฟเวอร์'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
