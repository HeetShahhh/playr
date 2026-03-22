'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/types';

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'action') => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center lg:bottom-auto lg:top-6 lg:right-6 lg:left-auto lg:translate-x-0 lg:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-enter px-4 py-3 rounded-pill text-sm font-medium shadow-lg text-white whitespace-nowrap ${
            toast.type === 'success'
              ? 'bg-[#00A86B]'
              : toast.type === 'error'
              ? 'bg-red-500'
              : 'bg-navy'
          }`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
