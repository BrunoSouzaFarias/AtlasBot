'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ToastContext = createContext<{
  toast: (type: ToastType, message: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

const toastStyles: Record<ToastType, { border: string; icon: React.ReactNode }> = {
  success: {
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />,
  },
  error: {
    border: 'border-rose-500/30',
    icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />,
  },
  info: {
    border: 'border-cyan-500/30',
    icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-2.5 bg-slate-900 border ${toastStyles[t.type].border} rounded-xl px-4 py-3 shadow-xl shadow-black/40 text-sm text-slate-200`}
          >
            {toastStyles[t.type].icon}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fechar notificação"
              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
