import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short pointer-events-auto">
      <div
        className={`flex items-start space-x-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
          isSuccess
            ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100 shadow-emerald-950/40'
            : isError
            ? 'bg-rose-950/90 border-rose-700/60 text-rose-100 shadow-rose-950/40'
            : isWarning
            ? 'bg-amber-950/90 border-amber-600/70 text-amber-100 shadow-amber-950/40'
            : 'bg-neutral-900/90 border-neutral-700/60 text-white shadow-black/40'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : (
            <Info className="w-5 h-5 text-blue-400" />
          )}
        </div>
        <div className="flex-1 text-xs font-medium leading-relaxed">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

