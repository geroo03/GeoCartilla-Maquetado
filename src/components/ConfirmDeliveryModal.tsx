import React from 'react';
import type { Order } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { formatARS } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { ModalShell } from './ui/ModalShell.tsx';
import { BookletCover } from './ui/CoverArt.tsx';

interface ConfirmDeliveryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Último paso antes de dar la cartilla en mano. */
export const ConfirmDeliveryModal: React.FC<ConfirmDeliveryModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { state, dispatchUndoable } = useDemo();

  if (!order) return null;

  const cartilla = state.cartillas.find((c) => c.id === order.cartillaId);
  const needsPayment = order.paymentStatus === 'Pendiente de pago';

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar entrega"
      subtitle={`${order.code} · ${order.pickupLocation}`}
      icon="inventory_2"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
          >
            Volver
          </button>
          <button
            onClick={() => {
              dispatchUndoable(
                { type: 'DELIVER', orderId: order.id },
                needsPayment
                  ? `Cartilla entregada y ${formatARS(order.price)} cobrados a ${order.studentName}.`
                  : `Cartilla entregada a ${order.studentName}.`,
              );
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-bold shadow-sm hover:bg-on-secondary-container flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            type="button"
          >
            <Icon name="check" size={16} />
            {needsPayment ? 'Cobrar y entregar' : 'Confirmar entrega'}
          </button>
        </div>
      }
    >
      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex gap-3.5">
          <BookletCover
            coverUrl={order.cartillaCover}
            motif={cartilla?.coverMotif ?? 'topographic'}
            seed={order.cartillaId}
            label={order.year.replace(' Año', '')}
            className="w-16 h-22 rounded-lg shrink-0 shadow-md"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-on-surface leading-snug">{order.cartillaTitle}</h3>
            <p className="text-[11px] text-outline mt-0.5">{order.cartillaPages} páginas</p>
            <p className="text-xs font-bold text-on-surface mt-2">{order.studentName}</p>
            <p className="text-[11px] text-outline font-mono">DNI {order.studentDni}</p>
            <p className="text-[11px] text-outline">{order.division}</p>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-3 flex items-start gap-2.5">
          <Icon name="badge" size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Verificá el DNI <strong className="font-mono text-on-surface">{order.studentDni}</strong> o el
            comprobante digital antes de entregar el ejemplar.
          </p>
        </div>

        {needsPayment ? (
          <div className="bg-tertiary-fixed rounded-xl p-3 flex items-start gap-2.5">
            <Icon name="payments" size={18} className="text-on-tertiary-fixed-variant shrink-0 mt-0.5" />
            <p className="text-[11px] text-on-tertiary-fixed leading-relaxed">
              Este pedido eligió <strong>{order.paymentMethod}</strong>. Al confirmar se registran{' '}
              <strong>{formatARS(order.price)}</strong> cobrados en el acto.
            </p>
          </div>
        ) : (
          <div className="bg-secondary-container rounded-xl p-3 flex items-start gap-2.5">
            <Icon name="check_circle" size={18} className="text-on-secondary-container shrink-0 mt-0.5" />
            <p className="text-[11px] text-on-secondary-container leading-relaxed">
              El pago de <strong>{formatARS(order.price)}</strong> ya está acreditado vía{' '}
              {order.paymentMethod}. Sólo resta entregar el ejemplar.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
