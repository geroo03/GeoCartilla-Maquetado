import React from 'react';
import { Icon } from './Icon.tsx';
import { useFocusTrap } from './useFocusTrap.ts';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

/** Panel lateral derecho con foco atrapado y cierre por Esc. */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-lg',
}) => {
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print">
      <div
        className="absolute inset-0 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-in slide-in-from-right duration-200`}
      >
        <div className="px-5 py-4 border-b border-surface-container-high/60 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-primary truncate">{title}</h2>
            {subtitle && <p className="text-xs text-outline mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
            aria-label="Cerrar panel"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-surface-container-high/60 bg-surface-container-low/40 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
