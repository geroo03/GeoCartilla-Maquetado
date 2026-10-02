import React from 'react';
import { Icon } from './Icon.tsx';
import { ModalShell } from './ModalShell.tsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmación para acciones destructivas, antes de borrar o cancelar. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onClose,
}) => (
  <ModalShell
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    icon={tone === 'danger' ? 'warning' : 'help'}
    size="sm"
    footer={
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary"
          type="button"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 ${
            tone === 'danger'
              ? 'bg-error text-on-error hover:bg-on-error-container focus-visible:outline-error'
              : 'bg-primary text-on-primary hover:bg-primary-container focus-visible:outline-primary'
          }`}
          type="button"
        >
          <Icon name={tone === 'danger' ? 'delete' : 'check'} size={16} />
          {confirmLabel}
        </button>
      </div>
    }
  >
    <div className="px-6 py-5 text-sm text-on-surface-variant leading-relaxed">{message}</div>
  </ModalShell>
);
