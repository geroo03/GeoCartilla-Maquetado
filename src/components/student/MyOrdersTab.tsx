import React, { useMemo, useState } from 'react';
import type { Order, Student } from '../../types/index.ts';
import { useDemo } from '../../store/demoStore.tsx';
import { ordersForStudent } from '../../lib/metrics.ts';
import { formatARS, formatRelative } from '../../lib/format.ts';
import { Icon } from '../ui/Icon.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { BookletCover } from '../ui/CoverArt.tsx';
import { DeliveryChip, PaymentChip } from '../ui/StatusChip.tsx';
import { OrderReceipt } from '../OrderReceipt.tsx';

/** Pasos del seguimiento que ve el alumno. */
const STEPS = ['Pedido registrado', 'Preparado', 'Listo para retirar', 'Entregado'];

function stepIndex(order: Order): number {
  switch (order.deliveryStatus) {
    case 'Entregado':
      return 3;
    case 'Listo para retirar':
      return 2;
    case 'Preparado':
      return 1;
    default:
      return 0;
  }
}

interface MyOrdersTabProps {
  student: Student;
  onBackToCatalog: () => void;
}

export const MyOrdersTab: React.FC<MyOrdersTabProps> = ({ student, onBackToCatalog }) => {
  const { state, dispatchUndoable } = useDemo();
  const [receiptFor, setReceiptFor] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  /**
   * Sólo los pedidos de este alumno. En el maquetado original esta pestaña
   * hacía orders.map() sobre todos los pedidos, así que cada alumno veía el
   * nombre, el DNI y el teléfono de sus compañeros.
   */
  const myOrders = useMemo(
    () => ordersForStudent(state.orders, student.dni).sort((a, b) => b.timestamp - a.timestamp),
    [state.orders, student.dni],
  );

  if (myOrders.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container-high/60 animate-in fade-in duration-200">
        <EmptyState
          icon="receipt_long"
          title="Todavía no tenés pedidos"
          message="Cuando pidas una cartilla vas a poder seguir acá su estado y descargar el comprobante."
          action={{ label: 'Ver catálogo', onClick: onBackToCatalog, icon: 'menu_book' }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-extrabold text-primary tracking-tight">Mis pedidos</h1>
        <p className="text-xs text-on-surface-variant">
          {myOrders.length} pedido{myOrders.length > 1 ? 's' : ''} a nombre de {student.name}.
        </p>
      </div>

      {myOrders.map((order) => {
        const current = stepIndex(order);
        const canceled = order.deliveryStatus === 'Cancelado';
        const canCancel = !canceled && order.deliveryStatus !== 'Entregado';

        return (
          <article
            key={order.id}
            className={`bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden ${
              canceled ? 'opacity-70' : ''
            }`}
          >
            <div className="p-4 flex gap-3.5">
              <BookletCover
                coverUrl={order.cartillaCover}
                motif={
                  state.cartillas.find((c) => c.id === order.cartillaId)?.coverMotif ?? 'topographic'
                }
                seed={order.cartillaId}
                label={order.year.replace(' Año', '')}
                className="w-16 h-22 rounded-lg shrink-0 shadow-md"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-outline">{order.code}</span>
                  <span className="text-[10px] text-outline shrink-0">
                    {formatRelative(order.timestamp)}
                  </span>
                </div>
                <h2 className="text-xs font-bold text-on-surface leading-snug mt-0.5">
                  {order.cartillaTitle}
                </h2>
                <span className="block text-base font-extrabold text-primary font-mono mt-1.5 leading-none">
                  {formatARS(order.price)}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <PaymentChip status={order.paymentStatus} />
                  <DeliveryChip status={order.deliveryStatus} />
                </div>
              </div>
            </div>

            {/* Seguimiento */}
            {!canceled && (
              <div className="px-4 pb-3">
                <div className="flex items-center">
                  {STEPS.map((step, index) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            index <= current
                              ? 'bg-secondary text-on-secondary'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          <Icon name={index < current ? 'check' : 'circle'} size={index < current ? 13 : 8} />
                        </div>
                        <span
                          className={`text-[8px] text-center leading-tight w-14 ${
                            index <= current ? 'font-bold text-on-surface' : 'text-outline'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 -mt-4 ${
                            index < current ? 'bg-secondary' : 'bg-surface-container'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {order.deliveryStatus === 'Listo para retirar' && (
              <div className="mx-4 mb-3 bg-primary-fixed rounded-lg px-3 py-2 flex items-start gap-2">
                <Icon name="place" size={16} className="text-on-primary-fixed shrink-0 mt-0.5" />
                <p className="text-[11px] text-on-primary-fixed leading-snug">
                  Te espera en <strong>{order.pickupLocation}</strong>. Llevá tu DNI o mostrá el
                  comprobante.
                </p>
              </div>
            )}

            {order.paymentStatus === 'Pendiente de pago' && !canceled && (
              <div className="mx-4 mb-3 bg-tertiary-fixed rounded-lg px-3 py-2 flex items-start gap-2">
                <Icon name="payments" size={16} className="text-on-tertiary-fixed-variant shrink-0 mt-0.5" />
                <p className="text-[11px] text-on-tertiary-fixed leading-snug">
                  Tenés que abonar <strong>{formatARS(order.price)}</strong> en efectivo al retirarla.
                </p>
              </div>
            )}

            <div className="px-4 py-3 border-t border-surface-container-high/50 bg-surface-container-low/40 flex items-center gap-2">
              <button
                onClick={() => setReceiptFor(order)}
                className="flex-1 h-9 rounded-lg bg-surface-container text-primary text-[11px] font-bold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                type="button"
              >
                <Icon name="receipt" size={16} />
                Comprobante
              </button>

              {canCancel && (
                <button
                  onClick={() => setCancelTarget(order)}
                  className="h-9 px-3 rounded-lg text-error text-[11px] font-bold hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-error"
                  type="button"
                >
                  <Icon name="cancel" size={16} />
                  Cancelar
                </button>
              )}
            </div>
          </article>
        );
      })}

      <OrderReceipt order={receiptFor} isOpen={!!receiptFor} onClose={() => setReceiptFor(null)} />

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancelar el pedido"
        message={
          cancelTarget ? (
            <>
              Vas a cancelar tu pedido <strong>{cancelTarget.code}</strong> de{' '}
              {cancelTarget.cartillaTitle}.
              {cancelTarget.paymentStatus === 'Pagado' && (
                <> Se te reintegran {formatARS(cancelTarget.price)}.</>
              )}{' '}
              Vas a poder volver a pedirla si queda stock.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Cancelar pedido"
        cancelLabel="Volver"
        onConfirm={() => {
          if (!cancelTarget) return;
          dispatchUndoable(
            {
              type: 'CANCEL_ORDER',
              orderId: cancelTarget.id,
              actor: 'alumno',
              reason: 'Cancelado por el alumno desde el portal',
            },
            `Pedido ${cancelTarget.code} cancelado.`,
            'info',
          );
        }}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
};
