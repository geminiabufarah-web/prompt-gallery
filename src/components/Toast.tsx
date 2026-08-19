import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        let borderClass = 'border-emerald-500/30 bg-emerald-950/80 text-emerald-100';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderClass = 'border-rose-500/30 bg-rose-950/80 text-rose-100';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
          borderClass = 'border-cyan-500/30 bg-cyan-950/80 text-cyan-100';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl shadow-black/50 transition-all duration-300 animate-in slide-in-from-bottom-5 ${borderClass}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
