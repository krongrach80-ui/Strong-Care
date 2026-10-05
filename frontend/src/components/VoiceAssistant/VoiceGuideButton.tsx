import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Square, Radio, Sparkles } from 'lucide-react';
import { voiceAssistant } from '../../services/voiceAssistantService';

interface VoiceGuideButtonProps {
  pageId: string;
  context?: any;
  label?: string;
  variant?: 'pill' | 'banner' | 'large';
  className?: string;
}

export const VoiceGuideButton: React.FC<VoiceGuideButtonProps> = ({
  pageId,
  context,
  label = 'ฟังคำแนะนำหน้านี้',
  variant = 'pill',
  className = '',
}) => {
  const [voiceState, setVoiceState] = useState(voiceAssistant.getState());

  useEffect(() => {
    return voiceAssistant.subscribe(setVoiceState);
  }, []);

  const handleClick = () => {
    if (voiceState.isSpeaking) {
      voiceAssistant.stop();
    } else {
      voiceAssistant.speakPageGuide(pageId, context);
    }
  };

  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            {voiceState.isSpeaking ? (
              <Radio className="w-5 h-5 animate-pulse text-emerald-200" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>ผู้ช่วยเสียง AI (Thai Voice Assistant)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                OFFLINE
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {voiceState.isSpeaking ? 'กำลังอ่านคำแนะนำ...' : 'กดเพื่อฟังเสียงอธิบายการใช้งานหน้านี้'}
            </p>
          </div>
        </div>

        <button
          onClick={handleClick}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition transform active:scale-95 ${
            voiceState.isSpeaking
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
          }`}
        >
          {voiceState.isSpeaking ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>หยุดเสียงพูด</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>{label}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <button
        onClick={handleClick}
        className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-lg transition transform active:scale-98 ${
          voiceState.isSpeaking
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-600/25'
        } ${className}`}
      >
        {voiceState.isSpeaking ? (
          <>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4 bg-white animate-pulse rounded-full" />
              <span className="w-1.5 h-6 bg-white animate-pulse delay-75 rounded-full" />
              <span className="w-1.5 h-3 bg-white animate-pulse delay-150 rounded-full" />
            </div>
            <span>หยุดอ่านคำแนะนำ</span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 text-emerald-100" />
            <span>🔊 {label}</span>
          </>
        )}
      </button>
    );
  }

  // Default 'pill' variant
  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm border ${
        voiceState.isSpeaking
          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/80'
      } ${className}`}
      title="กดเพื่อฟังคำแนะนำด้วยเสียงภาษาไทย"
    >
      {voiceState.isSpeaking ? (
        <>
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>หยุดเสียง</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
