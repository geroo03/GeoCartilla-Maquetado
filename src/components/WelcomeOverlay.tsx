import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './ui/Icon.tsx';
import { BrandMark } from './SidebarTeacher.tsx';
import { CURRENT_TERM } from '../lib/format.ts';
import { firstName, greeting } from '../lib/greeting.ts';

interface WelcomeOverlayProps {
  name: string;
  /** Cartillas listas para entregar hoy. */
  readyCount: number;
  /** Pedidos esperando cobro. */
  pendingCount: number;
  onDone: () => void;
}

/**
 * Cortina de bienvenida que se ve una sola vez, al iniciar sesion. Arranca
 * con el mismo degrade del login para que la transicion sea continua y se
 * disuelve sobre el panel. Se puede saltear con un clic o una tecla.
 */
export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  name,
  readyCount,
  pendingCount,
  onDone,
}) => {
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback(() => {
    // Evita que el temporizador original dispare un segundo onDone si la
    // persona se adelanta y la saltea.
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLeaving(true);
    timers.current.push(window.setTimeout(onDone, 420));
  }, [onDone]);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const hold = reduced ? 1100 : 1900;
    const leave = reduced ? 200 : 420;

    timers.current.push(window.setTimeout(() => setLeaving(true), hold));
    timers.current.push(window.setTimeout(onDone, hold + leave));

    const skip = () => dismiss();
    window.addEventListener('keydown', skip);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      window.removeEventListener('keydown', skip);
    };
  }, [onDone, dismiss]);

  const first = firstName(name);
  const hello = greeting(new Date().getHours());

  const stats = [
    { icon: 'inventory_2', value: readyCount, label: readyCount === 1 ? 'cartilla lista' : 'cartillas listas' },
    { icon: 'payments', value: pendingCount, label: pendingCount === 1 ? 'pedido por cobrar' : 'pedidos por cobrar' },
  ];

  return (
    <div
      className="welcome-veil fixed inset-0 z-[80] flex items-center justify-center p-6 bg-background bg-gradient-to-br from-surface-container-low via-background to-primary-fixed/40 cursor-pointer no-print"
      data-leaving={leaving}
      onClick={dismiss}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
        <div className="welcome-mark w-14 h-14 rounded-2xl bg-primary flex items-center justify-center p-2.5 shadow-lg">
          <BrandMark />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="welcome-eyebrow text-sm font-semibold text-on-surface-variant">
            {hello},
          </span>
          <h1 className="welcome-name text-4xl font-extrabold text-primary tracking-tight leading-none">
            {first}
          </h1>
        </div>

        <div className="welcome-rule w-full h-px bg-outline-variant/60" />

        <div className="welcome-stats flex flex-col items-center gap-2 w-full">
          <p className="text-xs text-on-surface-variant">
            Ciclo lectivo {CURRENT_TERM}. Esto te espera hoy:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {stats.map((stat) => (
              <span
                key={stat.icon}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest border border-surface-container-high text-xs text-on-surface-variant shadow-xs"
              >
                <Icon name={stat.icon} size={16} className="text-secondary" />
                <strong className="text-primary font-extrabold">{stat.value}</strong>
                {stat.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-outline">
        Tocá para continuar
      </span>
    </div>
  );
};
