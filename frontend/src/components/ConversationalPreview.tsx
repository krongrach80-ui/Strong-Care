import React, { useState, useEffect } from 'react';
import { Bot, User, Sparkles, Send, Play, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface PromptPreset {
  id: string;
  label: string;
  userPrompt: string;
  aiResponse: string;
}

const PRESETS: PromptPreset[] = [
  {
    id: 'verify',
    label: '✨ ตรวจจับใบหน้าล่าสุด',
    userPrompt: 'สวัสดี FaceVoice AI ช่วยรายงานผลการตรวจจับใบหน้าล่าสุดให้หน่อยครับ',
    aiResponse: '✨ ตรวจพบคุณยายสมศรี ใจดี (ความมั่นใจ 99.8%) ผ่านการยืนยัน Anti-False 3 เฟรมต่อเนื่อง บันทึกเวลาเข้างานเรียบร้อยแล้วค่ะ พร้อมส่งเสียงทักทายอัตโนมัติทันที!'
  },
  {
    id: 'quality',
    label: '🔍 วิเคราะห์คะแนนความคมชัด',
    userPrompt: 'ขอรายงานคะแนนคุณภาพใบหน้า (Face Quality Score) ของสมาชิกครับ',
    aiResponse: '📊 คะแนนความคมชัด Laplacian Variance: 624.3 (ระดับยอดเยี่ยม ไม่เบลอ) | ค่าความสว่าง: 127.3/255 (สมดุลเหมาะสม) | องศาใบหน้าตรงเกณฑ์ 100% พร้อมใช้งานค่ะ'
  },
  {
    id: 'antifalse',
    label: '🛡️ จำลอง Anti-False Verification',
    userPrompt: 'Anti-False Temporal Confirmation ป้องกันการเรียกชื่อผิดอย่างไร?',
    aiResponse: '🛡️ ระบบใช้หน้าต่างเวลาตรวจสอบการจับคู่ต่อเนื่อง 3 เฟรมติดกัน (Hits 3/3) หากเป็นเพียงแสงเงาชั่วขณะจะไม่ประกาศชื่อ พร้อม Cooldown 6 วินาทีป้องกันเสียงทับซ้อนค่ะ'
  }
];

export const ConversationalPreview: React.FC = () => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [streamedText, setStreamedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentPreset = PRESETS[activePresetIndex];

  // Streaming typewriter effect
  useEffect(() => {
    let index = 0;
    setStreamedText('');
    setIsTyping(true);

    const fullText = currentPreset.aiResponse;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setStreamedText(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [activePresetIndex]);

  return (
    <div className="w-full rounded-3xl bg-white p-5 md:p-6 border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.06),0_0_1px_1px_rgba(226,232,240,0.8)] relative overflow-hidden">
      {/* Top Header of Chat Widget */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
            <Bot className="w-4 h-4 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold text-slate-900 font-['Outfit']">
                FaceVoice AI Assistant
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Live AI Telemetry & Recognition Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
          <Zap className="w-3 h-3 text-emerald-600" />
          <span>Streaming 60 FPS</span>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4 text-xs md:text-sm min-h-[160px]">
        {/* User Message Bubble */}
        <div className="flex items-start justify-end gap-2.5 animate-fadeIn">
          <div className="bg-slate-100 text-slate-800 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-md border border-slate-200/60 shadow-sm leading-relaxed font-medium">
            {currentPreset.userPrompt}
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 text-[11px] font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* AI Assistant Streaming Message Bubble */}
        <div className="flex items-start gap-2.5 animate-fadeIn">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-indigo-100 text-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm max-w-lg shadow-sm leading-relaxed font-sans">
            <span className="text-slate-900 font-medium">{streamedText}</span>
            {isTyping && (
              <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-blink align-middle" />
            )}

            {/* Micro Badge inside AI Response */}
            {!isTyping && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Latency: 14.2ms</span>
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200">
                  Model: YuNet + SFace ONNX
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preset Prompt Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <div className="text-[10px] text-slate-500 mb-2 font-semibold">เลือกคำถามจำลองเพื่อทดสอบ Streaming Response:</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActivePresetIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activePresetIndex === idx
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};