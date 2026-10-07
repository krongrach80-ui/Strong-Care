import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, AlertCircle, Sparkles, Video, User, Loader2 } from 'lucide-react';
import { StretchStickFigure } from '../StickFigure/StretchStickFigure';

interface ExercisePosePreviewProps {
  demoVideoUrl?: string;
  videoStartSeconds?: number;
  thumbnailUrl?: string;
  svgType?: string;
  name?: string;
  englishName?: string;
  activeSide?: 'left' | 'right' | 'both';
  isHighlighted?: boolean;
  showVideoPlayer?: boolean;
  onToggleVideo?: () => void;
  className?: string;
}

/**
 * แปลง URL วิดีโอ (YouTube share / embed / watch) ให้กลายเป็น Embed URL ที่ถูกต้อง
 * รองรับ: https://youtu.be/3vOTTj_X3kQ?si=0AAkbLa7UUncb2Qs
 */
function resolveYouTubeEmbedUrl(
  rawUrl: string = '',
  startSeconds?: number,
  autoplay: boolean = false,
  muted: boolean = true
): string {
  let videoId = '3vOTTj_X3kQ'; // Default Dr. Fame stretch video

  try {
    if (rawUrl.includes('embed/')) {
      const parts = rawUrl.split('embed/')[1];
      videoId = parts.split('?')[0];
    } else if (rawUrl.includes('youtu.be/')) {
      const parts = rawUrl.split('youtu.be/')[1];
      videoId = parts.split('?')[0];
    } else if (rawUrl.includes('v=')) {
      const urlObj = new URL(rawUrl);
      videoId = urlObj.searchParams.get('v') || '3vOTTj_X3kQ';
    }
  } catch (_) {
    videoId = '3vOTTj_X3kQ';
  }

  // Parse start time if in URL
  let start = startSeconds;
  if (start === undefined) {
    const matchStart = rawUrl.match(/[?&]start=(\d+)/);
    if (matchStart) {
      start = parseInt(matchStart[1], 10);
    } else {
      const matchT = rawUrl.match(/[?&]t=(\d+)/);
      if (matchT) start = parseInt(matchT[1], 10);
    }
  }

  const startParam = start !== undefined && start > 0 ? `&start=${start}` : '';
  const autoParam = autoplay ? '&autoplay=1' : '&autoplay=0';
  const muteParam = muted ? '&mute=1' : '&mute=0';

  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1&controls=1${startParam}${autoParam}${muteParam}`;
}

export const ExercisePosePreview: React.FC<ExercisePosePreviewProps> = ({
  demoVideoUrl = 'https://youtu.be/3vOTTj_X3kQ',
  videoStartSeconds,
  thumbnailUrl,
  svgType = 'neck_lateral',
  name = 'ท่าออกกำลังกาย',
  englishName = 'Exercise Pose',
  activeSide = 'both',
  isHighlighted = true,
  showVideoPlayer = true, // Default to true: แสดงคลิปวิดีโอในช่องนี้ตามความต้องการของผู้ใช้
  onToggleVideo,
  className,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(true); // ปลอดภัย: ไม่ autoplay พร้อมเสียง
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'video' | 'stick'>('video');
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [replayKey, setReplayKey] = useState<number>(0);

  // Reset video error and show loading when URL or start time changes
  useEffect(() => {
    setHasVideoError(false);
    setIsIframeLoading(true);
  }, [demoVideoUrl, videoStartSeconds, replayKey]);

  const embedUrl = resolveYouTubeEmbedUrl(demoVideoUrl, videoStartSeconds, true, isMuted);

  const handleReplay = () => {
    setIsIframeLoading(true);
    setReplayKey((prev) => prev + 1);
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center relative ${className || ''}`}>
      {/* Priority: Video > Animation > Skeleton fallback */}
      {showVideoPlayer && demoVideoUrl && !hasVideoError && displayMode === 'video' ? (
        <div className="w-full bg-black rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/80 relative aspect-video flex flex-col items-center justify-center group animate-fadeIn">
          {/* YouTube Video Embed Player */}
          <iframe
            key={`yt-preview-${replayKey}-${embedUrl}`}
            src={embedUrl}
            title={`คลิปวิดีโอสาธิต ${name} (${englishName})`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsIframeLoading(false)}
            onError={() => {
              setIsIframeLoading(false);
              setHasVideoError(true);
              setDisplayMode('stick');
            }}
          />

          {/* Loading Skeleton / Placeholder to prevent black box flicker */}
          {isIframeLoading && (
            <div className="absolute inset-0 bg-[#0B2B2B] flex flex-col items-center justify-center gap-2 text-emerald-300 text-xs font-semibold z-5 pointer-events-none">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>กำลังเตรียมคลิปสาธิต...</span>
            </div>
          )}

          {/* Left Mode Switcher Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            <button
              type="button"
              onClick={() => setDisplayMode('stick')}
              className="bg-black/80 hover:bg-black backdrop-blur-md text-emerald-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer border border-emerald-400/50"
              title="สลับไปดูแอนิเมชันท่าฝึก"
            >
              <span>🏃 แอนิเมชัน</span>
            </button>
          </div>

          {/* Quick Overlay Control Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleReplay}
              className="bg-black/75 hover:bg-black/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
              title="เริ่มคลิปใหม่ตั้งแต่ต้นท่านี้"
            >
              <RotateCcw className="w-3 h-3" />
              <span>เริ่มใหม่</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="bg-black/75 hover:bg-black/90 backdrop-blur-md text-white p-1.5 rounded-lg text-xs shadow-sm transition cursor-pointer"
              title={isMuted ? 'เปิดเสียงคลิป' : 'ปิดเสียงคลิป'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>
      ) : (
        /* Dynamic Animated Stick Figure Mode (Zero failure rate, clear demonstration) */
        <div className="w-full bg-[#0B2B2B] border-2 border-emerald-400/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center space-y-2 aspect-video relative animate-fadeIn shadow-md">
          {/* Top Switcher Button to switch back to video */}
          {demoVideoUrl && !hasVideoError && (
            <div className="absolute top-2 left-2 z-10">
              <button
                type="button"
                onClick={() => setDisplayMode('video')}
                className="bg-black/80 hover:bg-black backdrop-blur-md text-emerald-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer border border-emerald-400/50"
                title="สลับไปดูคลิปหมอสาธิต"
              >
                <span>🎬 คลิปหมอ</span>
              </button>
            </div>
          )}

          {hasVideoError && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>แสดงภาพแอนิเมชันท่าทางจำลอง</span>
            </div>
          )}

          <div className="p-2 bg-black/40 rounded-2xl flex items-center justify-center">
            <StretchStickFigure
              type={svgType}
              className="w-16 h-20 sm:w-20 sm:h-24 animate-pulse"
              activeSide={activeSide}
              isHighlighted={isHighlighted}
            />
          </div>

          <div className="text-[11px] font-bold text-emerald-300 truncate max-w-xs">
            {name} ({englishName})
          </div>
        </div>
      )}
    </div>
  );
};
