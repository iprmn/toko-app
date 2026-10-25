import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface SuccessModalState {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
}

interface FeedbackModalProps {
  confirmState: ConfirmModalState | null;
  onCloseConfirm: () => void;
  successState: SuccessModalState | null;
  onCloseSuccess: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  confirmState,
  onCloseConfirm,
  successState,
  onCloseSuccess,
}) => {
  return (
    <>
      {/* 1. Popup Konfirmasi */}
      {confirmState && confirmState.isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            confirmState.onCancel?.();
            onCloseConfirm();
          }}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    confirmState.variant === 'danger'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {confirmState.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  confirmState.onCancel?.();
                  onCloseConfirm();
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmState.message}
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  confirmState.onCancel?.();
                  onCloseConfirm();
                }}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                {confirmState.cancelLabel || 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = confirmState.onConfirm;
                  onCloseConfirm();
                  fn();
                }}
                className={`flex-1 h-11 rounded-xl text-white font-bold text-xs cursor-pointer transition-all shadow-sm ${
                  confirmState.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                    : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-900/20'
                }`}
              >
                {confirmState.confirmLabel || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Popup Success */}
      {successState && successState.isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={onCloseSuccess}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                {successState.title}
              </h3>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {successState.message}
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseSuccess}
              className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors shadow-sm shadow-emerald-900/20"
            >
              OK, Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
