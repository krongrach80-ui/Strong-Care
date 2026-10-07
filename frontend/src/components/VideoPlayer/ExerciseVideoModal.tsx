import React from 'react';
import { X, ExternalLink, Play, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StretchExerciseItem, STRETCH_PROGRAM_METADATA, getStretchVideoEmbedUrl, getStretchVideoWatchUrl } from '../../data/stretchExercises';

interface ExerciseVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: StretchExerciseItem | null;
  initialStartSeconds?: number;
}

export const ExerciseVideoModal: React.FC<ExerciseVideoModalProps> = ({
  isOpen,
  onClose,
  exercise,
  initialStartSeconds,
}) => {
  if (!isOpen) return null;

  const startSec = initialStartSeconds !== undefined 
    ? initialStartSeconds 
    : (exercise ? exercise.videoStartSeconds : 0);

  const embedUrl = getStretchVideoEmbedUrl(startSec, true);
  const watchUrl = getStretchVideoWatchUrl(startSec);

  const minutes = Math.floor(startSec / 60);
  const seconds = startSec % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-300 flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-50 to-[#E9FCEB] border-b border-emerald-200">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-[#1E8A4C] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {exercise && (
                  <span className="text-xs font-black text-[#1E8A4C] bg-white border border-emerald-300 px-2 py-0.5 rounded-full">
                    ท่าที่ {exercise.number}
                  </span>
                )}
                <h3 id="video-modal-title" className="text-base sm:text-lg font-extrabold text-[#0B2B2B] truncate">
                  {exercise ? exercise.name : STRETCH_PROGRAM_METADATA.title}
                </h3>
              </div>
              <p className="text-xs text-stone-600 font-medium truncate mt-0.5">
                {STRETCH_PROGRAM_METADATA.channel} ({STRETCH_PROGRAM_METADATA.instructor}) • เริ่มนาทีที่ {timeFormatted}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center transition active:scale-90 flex-shrink-0 cursor-pointer shadow-xs"
            aria-label="ปิดหน้าต่างวิดีโอ"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Video Iframe Frame (16:9 responsive aspect ratio) */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <iframe
            key={`${exercise?.id || 'all'}-${startSec}`}
            src={embedUrl}
            title={exercise ? `วิดีโอสาธิตท่า ${exercise.name}` : STRETCH_PROGRAM_METADATA.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Exercise Details & Action Footer */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 bg-stone-50/60">
          {exercise && (
            <div className="bg-white rounded-2xl p-3.5 border border-emerald-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                <span className="font-extrabold text-emerald-900">
                  วิธีฝึกท่านี้ ({exercise.bodyArea}):
                </span>
                <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  ⏱ ค้าง {exercise.holdSeconds} วิ {exercise.sides === 'both_sides' ? '× 2 ข้าง' : ''}
                </span>
              </div>
              <ul className="text-xs sm:text-sm text-[#0B2B2B] space-y-1 list-disc list-inside">
                {exercise.steps.map((st, i) => (
                  <li key={i} className="leading-snug">
                    {st}
                  </li>
                ))}
              </ul>
              <div className="pt-1.5 border-t border-emerald-100 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50/80 p-2 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-tight">
                  ข้อควรระวัง: {exercise.caution}
                </span>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-1">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-2xs transition active:scale-95"
            >
              <span>เปิดดูบนแอป YouTube</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            </a>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1E8A4C] to-[#2ecc71] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-sm active:scale-95 transition cursor-pointer"
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
