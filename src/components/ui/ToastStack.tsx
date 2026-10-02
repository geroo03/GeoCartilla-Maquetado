import React from 'react';
import { Icon } from './Icon.tsx';
import { useDemo } from '../../store/demoStore.tsx';

const TONE_ICON = {
  success: 'check_circle',
  info: 'info',
  error: 'error',
} as const;

const TONE_ACCENT = {
  success: 'text-secondary-fixed-dim',
  info: 'text-primary-fixed-dim',
  error: 'text-error-container',
} as const;

/** Cola de notificaciones efímeras, apiladas abajo a la derecha. */
export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useDemo();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-[calc(var(--fab-bottom)_+_3.5rem)] right-4 sm:right-6 z-[60] flex flex-col gap-2 items-end no-print"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-secondary/40 text-xs font-semibold max-w-sm animate-in slide-in-from-bottom duration-200"
        >
          <Icon name={TONE_ICON[toast.tone]} size={20} className={`${TONE_ACCENT[toast.tone]} shrink-0`} />
          <span className="flex-1">{toast.message}</span>

          {toast.action && (
            <button
              onClick={() => {
                toast.action?.run();
                dismissToast(toast.id);
              }}
              className="shrink-0 px-2 py-1 rounded-lg bg-on-primary/15 hover:bg-on-primary/25 font-bold underline-offset-2 focus-visible:outline-2 focus-visible:outline-secondary-fixed-dim"
              type="button"
            >
              {toast.action.label}
            </button>
          )}

          <button
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-outline-variant hover:text-white focus-visible:outline-2 focus-visible:outline-secondary-fixed-dim rounded"
            type="button"
            aria-label="Cerrar notificación"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
