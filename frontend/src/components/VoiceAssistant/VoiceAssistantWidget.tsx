import React, { useEffect, useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Play,
  Square,
  Bot,
  Check,
  X,
  Radio,
  Gauge,
} from 'lucide-react';
import { voiceAssistant } from '../../services/voiceAssistantService';

export const VoiceAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState(voiceAssistant.getState());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return voiceAssistant.subscribe(setVoiceState);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleToggleMute = () => {
    voiceAssistant.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    voiceAssistant.setVolume(parseFloat(e.target.value));
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    voiceAssistant.setRate(parseFloat(e.target.value));
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Navbar / Header Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
          voiceState.isSpeaking
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25 animate-pulse'
            : voiceState.isMuted
            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            : 'bg-white text-emerald-800 border-emerald-200/90 hover:bg-emerald-50'
        }`}
        title="ตั้งค่าระบบเสียงภาษาไทย AI ประจำเว็บ"
      >
        {voiceState.isSpeaking ? (
          <div className="flex items-center gap-0.5 px-0.5">
            <span className="w-1 h-3 bg-white animate-pulse rounded-full" />
            <span className="w-1 h-4 bg-white animate-pulse delay-75 rounded-full" />
            <span className="w-1 h-2 bg-white animate-pulse delay-150 rounded-full" />
          </div>
        ) : voiceState.isMuted ? (
          <VolumeX className="w-3.5 h-3.5 text-rose-600" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
        )}
        <span className="hidden sm:inline">
          {voiceState.isSpeaking ? 'AI กำลังพูด...' : voiceState.isMuted ? 'ปิดเสียง AI' : 'เสียง AI'}
        </span>
      </button>

      {/* Floating Settings Popover Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-emerald-100 rounded-3xl p-5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">ผู้ช่วยเสียง AI (Thai Voice)</h4>
                <p className="text-[11px] text-slate-500 font-medium">ออกแบบเพื่อผู้สูงอายุ • ภาษาไทย 100% Offline</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Real-time Spoken Transcript Bubble */}
          {voiceState.isSpeaking && voiceState.currentText && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-start gap-2 shadow-inner">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">กำลังพูด:</span>
                <p className="font-semibold">{voiceState.currentText}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4">
            {/* Toggle Mute / Unmute */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center gap-2.5">
                {voiceState.isMuted ? (
                  <VolumeX className="w-5 h-5 text-rose-500" />
                ) : (
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 block">เปิดการพูดเสียงภาษาไทย</span>
                  <span className="text-[10px] text-slate-500">แนะนำท่าทางและผลลัพธ์อัตโนมัติ</span>
                </div>
              </div>

              <button
                onClick={handleToggleMute}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !voiceState.isMuted ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    !voiceState.isMuted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Volume Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>ระดับความดัง (Volume)</span>
                <span className="font-mono text-emerald-700">{Math.round(voiceState.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                disabled={voiceState.isMuted}
                value={voiceState.volume}
                onChange={handleVolumeChange}
                className="w-full accent-emerald-600 h-2 bg-emerald-100 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Speech Rate Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" /> ความเร็วเสียง (Speech Speed)
                </span>
                <span className="font-mono text-emerald-700">{voiceState.rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.2"
                step="0.05"
                disabled={voiceState.isMuted}
                value={voiceState.rate}
                onChange={handleRateChange}
                className="w-full accent-emerald-600 h-2 bg-emerald-100 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0.7x (ช้า ชัดเจน สำหรับผู้สูงอายุ)</span>
                <span>1.0x (ปกติ)</span>
                <span>1.2x (เร็ว)</span>
              </div>
            </div>

            {/* 3-Level Spoken System Info Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block text-xs">3 ระดับเสียงอัจฉริยะ (Smart Cooldown):</span>
              <p>• <strong>System:</strong> แนะนำการสแกนหน้าและเข้าใช้งาน</p>
              <p>• <strong>Exercise:</strong> ตรวจมุมองศาและแนะนำท่าทางสด (ไม่พูดซ้ำถี่)</p>
              <p>• <strong>Result:</strong> สรุปคะแนนและความถูกต้องเมื่อจบรอบ</p>
            </div>

            {/* Action Buttons: Test Voice & Stop */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => voiceAssistant.testVoice()}
                disabled={voiceState.isMuted}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ทดสอบเสียง AI</span>
              </button>

              {voiceState.isSpeaking && (
                <button
                  onClick={() => voiceAssistant.stop()}
                  className="py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>หยุด</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
