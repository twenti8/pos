import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed z-50 bottom-20 md:bottom-6 left-4 right-4 sm:right-auto sm:left-6 sm:w-96 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium border shadow-md transition-all ${
              isError
                ? 'bg-[#FFF5F5] border-[#F5C2C7] text-[#842029]'
                : isSuccess
                  ? 'bg-[#F3FAF5] border-[#B7E1C4] text-[#1D5B34]'
                  : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-ink)]'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#C92A2A]" aria-hidden="true" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#2B8A3E]" aria-hidden="true" />
            ) : (
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-[var(--theme-primary)]" aria-hidden="true" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="ปิดการแจ้งเตือน"
              className="p-1 -mr-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
