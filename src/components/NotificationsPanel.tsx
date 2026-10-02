import React, { useEffect, useRef } from 'react';
import type { Notification, NotificationKind } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { formatRelative } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { EmptyState } from './ui/EmptyState.tsx';

const KIND_META: Record<NotificationKind, { icon: string; box: string }> = {
  pedido: { icon: 'receipt_long', box: 'bg-primary-fixed text-on-primary-fixed' },
  pago: { icon: 'payments', box: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  entrega: { icon: 'inventory_2', box: 'bg-secondary-container text-on-secondary-container' },
  stock: { icon: 'warning', box: 'bg-error-container text-on-error-container' },
  remesa: { icon: 'local_shipping', box: 'bg-surface-container-high text-primary' },
};

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onOpenOrder?: (orderId: string) => void;
}

/**
 * Panel con el historial real de notificaciones. El maquetado original sólo
 * disparaba un toast con un texto fijo al tocar la campanita.
 */
export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onClose,
  onOpenOrder,
}) => {
  const { dispatch } = useDemo();
  const panelRef = useRef<HTMLDivElement>(null);

  // Cierra al clickear afuera o con Esc.
  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high z-50 overflow-hidden"
      role="dialog"
      aria-label="Notificaciones"
    >
      <div className="px-4 py-3 border-b border-surface-container-low flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary">Notificaciones</h3>
        {hasUnread && (
          <button
            onClick={() => dispatch({ type: 'READ_ALL_NOTIFICATIONS', audience: 'docente' })}
            className="text-[11px] font-bold text-secondary hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded"
            type="button"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="max-h-[22rem] overflow-y-auto divide-y divide-surface-container-low">
        {notifications.length === 0 ? (
          <EmptyState
            compact
            icon="notifications_off"
            title="Sin novedades"
            message="Cuando entren pedidos, pagos o avisos de stock vas a verlos acá."
          />
        ) : (
          notifications.map((notification) => {
            const meta = KIND_META[notification.kind];
            const isClickable = !!notification.orderId && !!onOpenOrder;

            return (
              <button
                key={notification.id}
                onClick={() => {
                  dispatch({ type: 'READ_NOTIFICATION', id: notification.id });
                  if (notification.orderId && onOpenOrder) {
                    onOpenOrder(notification.orderId);
                    onClose();
                  }
                }}
                className={`w-full text-left px-4 py-3 flex gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                  isClickable ? 'hover:bg-surface-container-low cursor-pointer' : 'cursor-default'
                } ${notification.read ? '' : 'bg-primary-fixed/15'}`}
                type="button"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.box}`}
                >
                  <Icon name={meta.icon} size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface truncate">
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-label="No leída" />
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5">
                    {notification.body}
                  </p>
                  <span className="text-[10px] text-outline font-mono">
                    {formatRelative(notification.at)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
