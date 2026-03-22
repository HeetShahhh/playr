'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  /** Duration in ms before auto-dismiss */
  duration?: number;
  onDismiss: () => void;
  variant?: 'lime' | 'default';
}

/**
 * Bottom-center toast. Lime bg, navy text.
 * Auto-dismisses after `duration` ms.
 */
export function Toast({ message, duration = 2000, onDismiss, variant = 'lime' }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      className="fixed bottom-8 left-1/2 z-[100] toast-enter"
      style={{
        transform: 'translateX(-50%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div
        className="px-5 py-3 rounded-pill text-sm font-semibold shadow-lg whitespace-nowrap"
        style={{
          fontFamily: 'var(--font-display)',
          backgroundColor: variant === 'lime' ? 'var(--lime)' : 'var(--navy-3)',
          color: variant === 'lime' ? 'var(--navy)' : 'var(--text-primary)',
        }}
      >
        {message}
      </div>
    </div>
  );
}

/** Hook to imperatively show a toast */
import { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createElement } from 'react';

export function useToastV2() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; variant?: 'lime' | 'default' }>>([]);

  const show = useCallback((message: string, variant: 'lime' | 'default' = 'lime') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastPortal = () => {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} variant={t.variant} onDismiss={() => dismiss(t.id)} />
        ))}
      </>,
      document.body
    );
  };

  return { show, ToastPortal };
}
