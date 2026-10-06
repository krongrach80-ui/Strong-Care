import React from 'react';

export const MintBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Top-Right Ambient Blurred Circle */}
      <div
        className="absolute -top-[60px] -right-[60px] w-[clamp(220px,35vw,420px)] h-[clamp(220px,35vw,420px)] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(111, 214, 127, 0.42) 0%, rgba(30, 138, 76, 0.04) 70%)',
          filter: 'blur(35px)',
        }}
      />

      {/* Bottom-Left Ambient Blurred Circle */}
      <div
        className="absolute -bottom-[80px] -left-[80px] w-[clamp(260px,40vw,480px)] h-[clamp(260px,40vw,480px)] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(74, 227, 135, 0.38) 0%, rgba(189, 240, 198, 0.05) 75%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Center Subtle Light Glow */}
      <div
        className="absolute top-[35%] left-[15%] w-[clamp(200px,30vw,360px)] h-[clamp(200px,30vw,360px)] rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          filter: 'blur(50px)',
        }}
      />

      {/* Top-Right Subtle Dot Pattern */}
      <div
        className="absolute top-4 right-4 w-[clamp(90px,14vw,160px)] h-[clamp(90px,14vw,160px)]"
        style={{
          backgroundImage: 'radial-gradient(#1E8A4C 1.5px, transparent 1.5px)',
          backgroundSize: '14px 14px',
          opacity: 0.22,
        }}
      />

      {/* Bottom-Left Subtle Dot Pattern */}
      <div
        className="absolute bottom-4 left-4 w-[clamp(90px,14vw,160px)] h-[clamp(90px,14vw,160px)]"
        style={{
          backgroundImage: 'radial-gradient(#1E8A4C 1.5px, transparent 1.5px)',
          backgroundSize: '14px 14px',
          opacity: 0.22,
        }}
      />

      {/* Multi-layered Translucent Curved Waves (SVG vector) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-full opacity-65"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M-60 620C280 540 520 720 860 630C1160 550 1340 680 1500 640V960H-60V620Z"
          fill="rgba(255, 255, 255, 0.45)"
        />
        <path
          d="M-80 690C240 610 560 770 940 690C1220 630 1380 740 1520 720V960H-80V690Z"
          fill="rgba(111, 214, 127, 0.22)"
        />
        <path
          d="M-40 760C320 680 640 820 1020 750C1280 700 1400 790 1520 800V960H-40V760Z"
          fill="rgba(30, 138, 76, 0.12)"
        />
      </svg>
    </div>
  );
};
