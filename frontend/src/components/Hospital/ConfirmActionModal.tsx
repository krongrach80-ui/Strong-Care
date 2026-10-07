import React from 'react';
import { X, AlertTriangle, ShieldAlert, LogOut, RotateCcw, CheckCircle2 } from 'lucide-react';

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  detail?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  iconType?: 'kick' | 'ban' | 'reset' | 'warning';
  onConfirm: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  detail,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'warning',
  iconType = 'warning',
  onConfirm,
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (iconType) {
      case 'kick':
        return <LogOut className="w-6 h-6 text-amber-600" />;
      case 'ban':
        return <ShieldAlert className="w-6 h-6 text-rose-600" />;
      case 'reset':
        return <RotateCcw className="w-6 h-6 text-amber-600" />;
      default:
        return variant === 'danger' ? (
          <ShieldAlert className="w-6 h-6 text-rose-600" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        );
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 border-rose-200',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 border-amber-200',
          confirmBtn:
            'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 focus:ring-amber-500',
        };
      default:
        return {
          iconBg: 'bg-emerald-100 border-emerald-200',
          confirmBtn:
            'bg-[#10B981] hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2F2B]/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-100 space-y-4 animate-slideUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-sm ${styles.iconBg}`}
          >
            {renderIcon()}
          </div>

          <div className="flex-1 pt-0.5 space-y-1">
            <h3 className="font-extrabold text-base sm:text-lg text-[#0F2F2B] leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        {detail && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-semibold space-y-1">
            {typeof detail === 'string' ? (
              <p className="leading-relaxed">{detail}</p>
            ) : (
              detail
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition cursor-pointer ${styles.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
