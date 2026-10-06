import React from 'react';

interface StretchStickFigureProps {
  type: string;
  className?: string;
  activeSide?: 'left' | 'right' | 'both';
  isHighlighted?: boolean;
}

export const StretchStickFigure: React.FC<StretchStickFigureProps> = ({
  type,
  className = 'w-14 h-20 sm:w-16 sm:h-24',
  activeSide = 'both',
  isHighlighted = false,
}) => {
  // Common stroke & fill
  const color = '#000000';
  const strokeWidth = '4.5';
  const legStrokeWidth = '5.5';

  return (
    <svg
      viewBox="0 0 60 90"
      className={`${className} transition-all select-none ${
        isHighlighted ? 'filter drop-shadow-[0_2px_8px_rgba(30,138,76,0.35)]' : ''
      }`}
      aria-hidden="true"
    >
      {(() => {
        switch (type) {
          // 1. ยืดคอด้านข้าง (Neck Lateral)
          case 'neck_lateral':
            return (
              <g>
                {/* Tilted Head to left or right */}
                <circle cx={activeSide === 'right' ? 36 : 24} cy="15" r="8" fill={color} />
                {/* Torso */}
                <rect x="23" y="27" width="14" height="25" rx="3.5" fill={color} />
                {/* Arm gently touching head */}
                {activeSide === 'right' ? (
                  <>
                    <polyline points="23,29 12,42 22,50" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="37,29 48,22 36,15" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <>
                    <polyline points="23,29 12,22 24,15" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="37,29 48,42 38,50" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
                {/* Legs */}
                <line x1="26" y1="52" x2="26" y2="82" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="52" x2="34" y2="82" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 2. ยืดคอก้มหน้า (Neck Flexion)
          case 'neck_flexion':
            return (
              <g>
                {/* Head lowered towards chest */}
                <circle cx="30" cy="18" r="8" fill={color} />
                {/* Torso */}
                <rect x="23" y="27" width="14" height="25" rx="3.5" fill={color} />
                {/* Hands gently on knees or resting */}
                <polyline points="23,29 14,44 20,52" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="37,29 46,44 40,52" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                {/* Legs */}
                <line x1="26" y1="52" x2="26" y2="82" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="52" x2="34" y2="82" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 3. ยืดไหล่ข้ามอก (Shoulder Cross)
          case 'shoulder_cross':
            return (
              <g>
                <circle cx="30" cy="13" r="8.5" fill={color} />
                <rect x="23" y="25" width="14" height="26" rx="3.5" fill={color} />
                {/* One arm stretched horizontally across chest, other supporting */}
                <polyline points="23,28 38,34 46,34" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="37,28 38,36 32,32" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <line x1="26" y1="51" x2="26" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="51" x2="34" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 4. ยืดต้นแขนด้านหลัง (Triceps Overhead)
          case 'triceps_overhead':
            return (
              <g>
                <circle cx="30" cy="14" r="8" fill={color} />
                <rect x="23" y="26" width="14" height="25" rx="3.5" fill={color} />
                {/* One elbow up behind head, hand touching elbow */}
                <polyline points="23,28 18,12 28,14" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="37,28 26,10 18,12" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <line x1="26" y1="51" x2="26" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="51" x2="34" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 5. ยืดอก (Chest Open)
          case 'chest_open':
            return (
              <g>
                <circle cx="30" cy="13" r="8.5" fill={color} />
                {/* Torso arched slightly back */}
                <rect x="22" y="25" width="16" height="26" rx="4" fill={color} />
                {/* Hands clasped behind back */}
                <polyline points="22,28 15,42 30,48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="38,28 45,42 30,48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <line x1="26" y1="51" x2="24" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="51" x2="36" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 6. ยืดข้างลำตัว (Side Bend)
          case 'side_bend':
            return (
              <g>
                <circle cx="25" cy="13" r="8" fill={color} />
                {/* Curved torso */}
                <path d="M 20 25 Q 26 38 24 51 L 34 51 Q 38 38 32 25 Z" fill={color} />
                {/* Overhead curved arm */}
                <path d="M 33 26 Q 30 6 18 10" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                {/* Downward arm */}
                <line x1="20" y1="28" x2="16" y2="48" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                <line x1="24" y1="51" x2="22" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="51" x2="36" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 7. บิดลำตัวท่ายืน (Torso Twist)
          case 'torso_twist':
            return (
              <g>
                <circle cx="30" cy="13" r="8.5" fill={color} />
                <rect x="23" y="25" width="14" height="26" rx="3.5" fill={color} />
                {/* Crossed arms on chest with rotation cue */}
                <line x1="23" y1="30" x2="40" y2="38" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                <line x1="37" y1="30" x2="20" y2="38" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                <line x1="26" y1="51" x2="23" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="51" x2="37" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 8. ยืดต้นขาด้านหน้า (Quadriceps)
          case 'quadriceps':
            return (
              <g>
                <circle cx="28" cy="13" r="8" fill={color} />
                <rect x="22" y="25" width="14" height="25" rx="3.5" fill={color} />
                {/* One hand on chair/wall in front */}
                <line x1="22" y1="28" x2="10" y2="34" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                <line x1="10" y1="34" x2="10" y2="60" stroke="#888888" strokeWidth="2.5" strokeLinecap="round" /> {/* Wall/Support */}
                {/* Other hand holding bent ankle at rear */}
                <polyline points="36,28 42,42 38,54" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                {/* Standing leg */}
                <line x1="25" y1="50" x2="25" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                {/* Bent leg folded up */}
                <polyline points="32,50 36,66 38,54" fill="none" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );

          // 9. ยืดต้นขาด้านหลัง (Hamstrings)
          case 'hamstrings':
            return (
              <g>
                <circle cx="36" cy="18" r="8" fill={color} />
                {/* Torso hinged forward */}
                <path d="M 26 44 L 40 28 L 48 34 L 32 50 Z" fill={color} />
                {/* Hands reaching towards front extended knee */}
                <polyline points="42,32 32,46 22,54" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                {/* Elevated step / ground */}
                <line x1="10" y1="78" x2="28" y2="78" stroke="#888888" strokeWidth="3" strokeLinecap="round" />
                {/* Extended front leg */}
                <line x1="28" y1="48" x2="18" y2="76" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                {/* Back leg standing */}
                <polyline points="32,48 38,62 38,81" fill="none" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 10. ยืดน่อง (Calf / Wall Push)
          case 'calf':
            return (
              <g>
                {/* Wall on the left */}
                <line x1="10" y1="15" x2="10" y2="85" stroke="#777777" strokeWidth="3" strokeLinecap="round" />
                <circle cx="28" cy="18" r="8" fill={color} />
                {/* Leaning torso */}
                <path d="M 23 44 L 32 26 L 39 30 L 29 48 Z" fill={color} />
                {/* Arms pushing wall */}
                <line x1="30" y1="28" x2="10" y2="30" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                {/* Front bent leg */}
                <polyline points="25,46 20,62 22,81" fill="none" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                {/* Back straight leg with flat heel */}
                <line x1="28" y1="46" x2="44" y2="81" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );

          // 11. ยืดสะโพกและก้น นั่งไขว้ขา (Piriformis Seated)
          case 'piriformis_seated':
            return (
              <g>
                {/* Chair outline */}
                <polyline points="18,52 38,52 38,82" fill="none" stroke="#888888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="18" y1="35" x2="18" y2="82" stroke="#888888" strokeWidth="2.5" strokeLinecap="round" />
                {/* Head leaning slightly forward */}
                <circle cx="28" cy="18" r="8" fill={color} />
                {/* Torso seated leaning forward */}
                <path d="M 22 48 L 30 27 L 38 30 L 30 50 Z" fill={color} />
                {/* Hands gently holding knee */}
                <polyline points="32,32 28,45 32,54" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
                {/* Crossed leg ankle on knee */}
                <polyline points="28,50 36,52 28,54" fill="none" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                {/* Supporting foot on floor */}
                <polyline points="26,50 26,66 28,81" fill="none" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );

          // Alternating Knee Raise (ท่ายกเข่าสลับ)
          case 'alternating_knee_raise':
          case 'knee_raise':
            return (
              <g>
                <circle cx="30" cy="14" r="8.5" fill={color} />
                <rect x="23" y="26" width="14" height="26" rx="3.5" fill={color} />
                {/* Athletic arm positions */}
                <polyline points="23,30 12,42 20,38" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="37,30 48,40 40,50" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                {/* Supporting standing leg */}
                <line x1="26" y1="52" x2="26" y2="82" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                {/* High raised knee (thigh horizontal at 90 deg, shin down) */}
                <polyline points="34,52 46,52 46,70" fill="none" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );

          // Default fallback figure (Standing, hands on hips)
          default:
            return (
              <g>
                <circle cx="30" cy="14" r="8.5" fill={color} />
                <rect x="23" y="26" width="14" height="26" rx="3.5" fill={color} />
                <polyline points="23,28 10,42 22,50" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="37,28 50,42 38,50" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <line x1="26" y1="52" x2="26" y2="82" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
                <line x1="34" y1="52" x2="34" y2="82" stroke={color} strokeWidth={legStrokeWidth} strokeLinecap="round" />
              </g>
            );
        }
      })()}
    </svg>
  );
};
