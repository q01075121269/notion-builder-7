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
        className="flex items-start space-x-3 p-3.5 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-300 bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
      >
        <div className="shrink-0 mt-0.5">
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          ) : (
            <Info className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          )}
        </div>
        <div className="flex-1 text-xs font-semibold leading-relaxed">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
