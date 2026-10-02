import React from 'react';
import { Icon } from './Icon.tsx';
import { useFocusTrap } from './useFocusTrap.ts';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  size?: keyof typeof SIZES;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Botones extra en la cabecera (p. ej. "Imprimir"). */
  headerActions?: React.ReactNode;
  /**
   * Marca el cuerpo como el único contenido que sale al imprimir. El resto de
   * la app lleva `no-print`, así que window.print() imprime sólo esto.
   */
  printableBody?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  children,
  footer,
  headerActions,
  printableBody = false,
}) => {
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200 print:static print:bg-transparent print:p-0 print:backdrop-blur-none"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${SIZES[size]} max-h-[90vh] bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-surface-container-high print:max-h-none print:max-w-none print:rounded-none print:border-0 print:shadow-none`}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-surface-container-low bg-surface-container-lowest shrink-0 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <Icon name={icon} size={24} className="text-primary shrink-0" />}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-primary truncate">{title}</h3>
              {subtitle && <p className="text-xs text-outline">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
              aria-label="Cerrar"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        <div
          className={`overflow-y-auto flex-1 ${printableBody ? 'print-root' : ''}`}
        >
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-surface-container-low bg-surface-container-lowest shrink-0 no-print">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
