import React from 'react';
import { Check, X, Hand, Sparkles } from 'lucide-react';
import { MiniGameQuestion } from '../../data/miniGameQuestions';

interface MiniGameCardProps {
  question: MiniGameQuestion;
  holdSide: 'yes' | 'no' | null;
  holdProgress: number; // 0 to 1
  answerState: 'idle' | 'correct' | 'incorrect';
  userAnswer: 'yes' | 'no' | null;
  isTouchMode: boolean;
  onSelectAnswer: (answer: 'yes' | 'no') => void;
}

export const MiniGameCard: React.FC<MiniGameCardProps> = ({
  question,
  holdSide,
  holdProgress,
  answerState,
  userAnswer,
  isTouchMode,
  onSelectAnswer,
}) => {
  const isAnswered = answerState !== 'idle';
  const isYesSelected = userAnswer === 'yes' || (isAnswered && question.correctAnswer === 'yes');
  const isNoSelected = userAnswer === 'no' || (isAnswered && question.correctAnswer === 'no');

  // Render visual item(s)
  const renderVisual = () => {
    // If multiple items specified by secondaryEmojis or count
    const allEmojis = [question.emoji, ...(question.secondaryEmojis || [])];

    return (
      <div className="flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] p-2">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-[260px] select-none py-1">
          {allEmojis.map((em, idx) => (
            <span
              key={idx}
              className={`transform transition-transform hover:scale-110 drop-shadow-md ${
                allEmojis.length <= 1
                  ? 'text-6xl sm:text-7xl'
                  : allEmojis.length <= 2
                  ? 'text-5xl sm:text-6xl'
                  : 'text-4xl sm:text-5xl'
              }`}
              role="img"
              aria-label={question.subject}
            >
              {em}
            </span>
          ))}
        </div>

        {/* Badge Label (e.g., subject name or detail) */}
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold shadow-xs">
          <span>{question.badgeLabel || question.subject}</span>
          {question.count && question.count > 1 && (
            <span className="bg-emerald-600 text-white text-[11px] px-1.5 py-0.2 rounded-full font-extrabold">
              {question.count}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-emerald-100 flex flex-col items-center transition-all">
      {/* Upper Section: 3-column Layout (ใช่ | ภาพประกอบ | ไม่) */}
      <div className="w-full grid grid-cols-3 gap-2 sm:gap-4 items-stretch">
        
        {/* Left Column: "ใช่" (Green) */}
        <button
          type="button"
          onClick={() => !isAnswered && onSelectAnswer('yes')}
          disabled={isAnswered}
          aria-label="ตอบ ใช่ (ยกมือซ้าย)"
          className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-center transition-all select-none border-2 active:scale-95 ${
            isAnswered
              ? question.correctAnswer === 'yes'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg ring-4 ring-emerald-300/60 scale-[1.02]'
                : isYesSelected
                ? 'bg-rose-100 text-rose-800 border-rose-300 opacity-60'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-40'
              : holdSide === 'yes'
              ? 'bg-emerald-100 border-emerald-500 shadow-md ring-4 ring-emerald-400/50 scale-[1.02]'
              : 'bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 border-emerald-300/80 shadow-sm'
          } ${!isAnswered ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
        >
          {/* Progress fill during gesture hold */}
          {holdSide === 'yes' && !isAnswered && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-emerald-400/40 transition-all duration-75 ease-out pointer-events-none"
              style={{ height: `${Math.round(holdProgress * 100)}%` }}
            />
          )}

          <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2">
            <div
              className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black transition ${
                isAnswered && question.correctAnswer === 'yes'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'bg-emerald-500 text-white shadow-sm'
              }`}
            >
              {isAnswered && question.correctAnswer === 'yes' ? (
                <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
              ) : (
                <Hand className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>

            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ใช่
            </span>

            <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 text-emerald-900 border border-emerald-200 shadow-xs">
              ✋ ยกมือซ้าย
            </span>

            {/* Touch hint */}
            {isTouchMode && !isAnswered && (
              <span className="text-[10px] text-emerald-700 font-medium opacity-80">
                (แตะเพื่อตอบ)
              </span>
            )}
          </div>
        </button>

        {/* Center Column: Visual Illustration */}
        <div className="bg-[#F8FAF7] rounded-2xl sm:rounded-3xl border border-emerald-100 flex items-center justify-center shadow-inner relative overflow-hidden">
          {renderVisual()}
        </div>

        {/* Right Column: "ไม่" (Red / Neutral) */}
        <button
          type="button"
          onClick={() => !isAnswered && onSelectAnswer('no')}
          disabled={isAnswered}
          aria-label="ตอบ ไม่ (ยกมือขวา)"
          className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-center transition-all select-none border-2 active:scale-95 ${
            isAnswered
              ? question.correctAnswer === 'no'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg ring-4 ring-emerald-300/60 scale-[1.02]'
                : isNoSelected
                ? 'bg-rose-100 text-rose-800 border-rose-300 opacity-60'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-40'
              : holdSide === 'no'
              ? 'bg-rose-100 border-rose-500 shadow-md ring-4 ring-rose-400/50 scale-[1.02]'
              : 'bg-rose-50/60 hover:bg-rose-100/80 text-rose-800 border-rose-200/90 shadow-sm'
          } ${!isAnswered ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
        >
          {/* Progress fill during gesture hold */}
          {holdSide === 'no' && !isAnswered && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-rose-400/40 transition-all duration-75 ease-out pointer-events-none"
              style={{ height: `${Math.round(holdProgress * 100)}%` }}
            />
          )}

          <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2">
            <div
              className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black transition ${
                isAnswered && question.correctAnswer === 'no'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'bg-rose-500 text-white shadow-sm'
              }`}
            >
              {isAnswered && question.correctAnswer === 'no' ? (
                <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
              ) : (
                <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              )}
            </div>

            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ไม่
            </span>

            <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 text-rose-900 border border-rose-200 shadow-xs">
              ✋ ยกมือขวา
            </span>

            {/* Touch hint */}
            {isTouchMode && !isAnswered && (
              <span className="text-[10px] text-rose-700 font-medium opacity-80">
                (แตะเพื่อตอบ)
              </span>
            )}
          </div>
        </button>

      </div>

      {/* Bottom of Question Card: Full Question Text */}
      <div className="w-full mt-4 pt-3 border-t border-emerald-100/80 flex flex-col items-center text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2B2B] leading-snug">
          {question.question}
        </h2>

        {/* Feedback banner after answering */}
        {isAnswered && (
          <div
            className={`mt-3 px-4 py-2 rounded-2xl flex items-center gap-2 text-sm sm:text-base font-bold animate-fadeIn ${
              answerState === 'correct'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {answerState === 'correct' ? (
              <>
                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-bounce" />
                <span>ถูกต้องแล้วครับ! เก่งมาก</span>
              </>
            ) : (
              <>
                <span className="text-lg">💡</span>
                <span>
                  เฉลย: ตอบ &quot;{question.correctAnswer === 'yes' ? 'ใช่' : 'ไม่'}&quot; — {question.explanation}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
