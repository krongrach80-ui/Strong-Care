import React from 'react';
import { Target } from 'lucide-react';

interface AngleGaugeProps {
  currentAngle: number;
  targetAngle: number;
  minAngle: number;
  maxAngle: number;
  jointName?: string;
  isCorrect?: boolean;
}

export const AngleGauge: React.FC<AngleGaugeProps> = ({
  currentAngle,
  targetAngle,
  minAngle,
  maxAngle,
  jointName = 'Joint Angle',
  isCorrect = true,
}) => {
  // Clamp angle for gauge rendering 0 to 180 degrees
  const clampedAngle = Math.max(0, Math.min(180, currentAngle));

  // Determine if inside target range
  const isInTargetZone = currentAngle >= minAngle && currentAngle <= maxAngle;

  // SVG Gauge calculations (Radius = 75, Center = 100, 100)
  const radius = 70;
  const cx = 95;
  const cy = 95;

  // Convert degree to SVG arc coordinates (180 deg span: from 180° to 360° / -180° to 0°)
  const angleToCoords = (deg: number) => {
    const rad = (Math.PI / 180) * (180 + deg);
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const startPt = angleToCoords(0);
  const endPt = angleToCoords(180);

  // Target Arc
  const targetStartPt = angleToCoords(minAngle);
  const targetEndPt = angleToCoords(maxAngle);

  // Value Arc
  const valuePt = angleToCoords(clampedAngle);
  const isLargeArc = clampedAngle > 180 ? 1 : 0;

  // Needle angle in degrees
  const needleRotation = clampedAngle - 90;

  return (
    <div className="bg-white/95 border border-emerald-100 rounded-2xl p-5 shadow-sm backdrop-blur-xl flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 font-sans">
          <Target className="w-3.5 h-3.5 text-emerald-600" /> {jointName}
        </span>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
            isInTargetZone
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          Target: {targetAngle}° (±{Math.round((maxAngle - minAngle) / 2)}°)
        </span>
      </div>

      {/* SVG Radial Gauge */}
      <div className="relative w-48 h-28 flex items-end justify-center">
        <svg viewBox="0 0 190 110" className="w-full h-full overflow-visible">
          {/* Background Track */}
          <path
            d={`M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 0 1 ${endPt.x} ${endPt.y}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Target Zone Arc */}
          <path
            d={`M ${targetStartPt.x} ${targetStartPt.y} A ${radius} ${radius} 0 0 1 ${targetEndPt.x} ${targetEndPt.y}`}
            fill="none"
            stroke="rgba(16, 185, 129, 0.35)"
            strokeWidth="14"
            strokeLinecap="butt"
          />

          {/* Active Value Arc */}
          <path
            d={`M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${isLargeArc} 1 ${valuePt.x} ${valuePt.y}`}
            fill="none"
            stroke={isInTargetZone ? '#059669' : '#10b981'}
            strokeWidth="12"
            strokeLinecap="round"
            className="transition-all duration-150"
          />

          {/* Pivot Center */}
          <circle cx={cx} cy={cy} r="6" fill="#ffffff" stroke="#10b981" strokeWidth="3" />

          {/* Needle Indicator */}
          <g
            style={{
              transform: `rotate(${needleRotation}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 120ms ease-out',
            }}
          >
            <line x1={cx} y1={cy} x2={cx} y2={cy - radius + 8} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy - radius + 8} r="3" fill="#10b981" />
          </g>
        </svg>

        {/* Big Digital Readout in Center */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <span
            className={`text-4xl font-extrabold font-mono tracking-tight transition-colors ${
              isInTargetZone ? 'text-emerald-700' : 'text-slate-900'
            }`}
          >
            {Math.round(currentAngle)}
            <span className="text-xl text-slate-400 font-normal">°</span>
          </span>
        </div>
      </div>

      {/* Target Range Footer */}
      <div className="flex items-center justify-between w-full mt-3 pt-3 border-t border-emerald-100 text-xs text-slate-500 font-mono">
        <span>0°</span>
        <span className="text-emerald-700 font-semibold">{minAngle}° — {maxAngle}°</span>
        <span>180°</span>
      </div>
    </div>
  );
};
