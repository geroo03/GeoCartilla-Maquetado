import React, { useEffect, useState } from 'react';
import type { EventActor, Order } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { formatARS, formatDateTimeShort, formatRelative } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { Drawer } from './ui/Drawer.tsx';
import { ConfirmDialog } from './ui/ConfirmDialog.tsx';
import { BookletCover } from './ui/CoverArt.tsx';
import { DeliveryChip, PaymentChip, PaymentMethodLabel } from './ui/StatusChip.tsx';
import { OrderReceipt } from './OrderReceipt.tsx';

const ACTOR_META: Record<EventActor, { icon: string; label: string; box: string }> = {
  docente: { icon: 'person', label: 'Docente', box: 'bg-primary-fixed text-on-primary-fixed' },
  alumno: { icon: 'school', label: 'Alumno', box: 'bg-secondary-container text-on-secondary-container' },
  sistema: { icon: 'bolt', label: 'Sistema', box: 'bg-surface-container-high text-on-surface-variant' },
};

/** Mensaje de WhatsApp según en qué punto está el pedido. */
function whatsappLink(order: Order): string {
  const phone = order.studentPhone.replace(/\D/g, '');
  const body =
    order.paymentStatus === 'Pendiente de pago'
      ? `Hola ${order.studentName}! Te escribimos de GeoCartillas: tu pedido ${order.code} de ${order.cartillaTitle} está reservado y queda pendiente el pago de ${formatARS(order.price)} al retirarlo en ${order.pickupLocation}.`
      : `Hola ${order.studentName}! Tu cartilla de ${order.cartillaTitle} ya está disponible para retirar en ${order.pickupLocation}. Acordate de llevar el DNI.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
}

interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ order, isOpen, onClose }) => {
  const { state, dispatch, dispatchUndoable, showToast } = useDemo();
  const [notesDraft, setNotesDraft] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // El borrador de la nota se recarga al cambiar de pedido.
  useEffect(() => {
    setNotesDraft(order?.notes ?? '');
  }, [order?.id, order?.notes]);

  if (!order) return null;

  const cartilla = state.cartillas.find((c) => c.id === order.cartillaId);
  const isClosed = order.deliveryStatus === 'Cancelado';
  const notesChanged = notesDraft !== (order.notes ?? '');

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Pedido ${order.code}`}
        subtitle={`${order.studentName} · ${order.division}`}
        footer={
          <div className="flex flex-col gap-2">
            {!isClosed && (
              <div className="flex items-center gap-2">
                {order.paymentStatus === 'Pendiente de pago' && (
                  <button
                    onClick={() =>
                      dispatchUndoable(
                        { type: 'MARK_PAID', orderId: order.id },
                        `Pago de ${formatARS(order.price)} registrado y conciliado.`,
                      )
                    }
                    className="flex-1 h-10 rounded-lg bg-tertiary-container text-on-tertiary text-xs font-bold hover:bg-tertiary transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    type="button"
                  >
                    <Icon name="payments" size={18} />
                    Registrar cobro
                  </button>
                )}

                {order.deliveryStatus !== 'Entregado' && (
                  <button
                    onClick={() =>
                      dispatchUndoable(
                        { type: 'DELIVER', orderId: order.id },
                        `Cartilla entregada a ${order.studentName}.`,
                      )
                    }
                    className="flex-1 h-10 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-on-secondary-container transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                    type="button"
                  >
                    <Icon name="inventory_2" size={18} />
                    Marcar entregado
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReceipt(true)}
                className="flex-1 h-9 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                type="button"
              >
                <Icon name="receipt" size={16} />
                Comprobante
              </button>

              <a
                href={whatsappLink(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-9 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon name="chat" size={16} />
                WhatsApp
              </a>

              {!isClosed && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="h-9 px-3 rounded-lg text-error text-xs font-semibold hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-error"
                  type="button"
                >
                  <Icon name="cancel" size={16} />
                  Cancelar
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="p-5 flex flex-col gap-5">
          {/* Cartilla y monto */}
          <section className="flex gap-3.5">
            <BookletCover
              coverUrl={order.cartillaCover}
              motif={cartilla?.coverMotif ?? 'topographic'}
              seed={order.cartillaId}
              label={order.year.replace(' Año', '')}
              className="w-20 h-28 rounded-lg shrink-0 shadow-md"
            />
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-on-surface leading-snug">{order.cartillaTitle}</h3>
              <p className="text-[11px] text-outline">
                {order.cartillaPages} páginas · {cartilla?.edition ?? 'Edición vigente'}
              </p>
              <div className="flex items-baseline gap-2 mt-auto">
                <span className="text-2xl font-extrabold text-primary font-mono">
                  {formatARS(order.price)}
                </span>
                <PaymentMethodLabel method={order.paymentMethod} />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-2 flex-wrap">
            <PaymentChip status={order.paymentStatus} />
            <DeliveryChip status={order.deliveryStatus} />
          </div>

          {/* Datos del alumno */}
          <section className="bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-2.5">
            <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Datos del alumno
            </h4>
            {[
              { icon: 'badge', label: 'DNI', value: order.studentDni, mono: true },
              { icon: 'mail', label: 'Email', value: order.studentEmail, href: `mailto:${order.studentEmail}` },
              {
                icon: 'call',
                label: 'Teléfono',
                value: order.studentPhone,
                href: `tel:${order.studentPhone.replace(/\D/g, '')}`,
                mono: true,
              },
              { icon: 'school', label: 'Colegio', value: order.school },
              { icon: 'groups', label: 'División', value: order.division },
              { icon: 'place', label: 'Retiro', value: order.pickupLocation },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-2.5 text-xs">
                <Icon name={row.icon} size={16} className="text-outline shrink-0 mt-0.5" />
                <span className="text-outline w-16 shrink-0">{row.label}</span>
                {row.href ? (
                  <a
                    href={row.href}
                    className={`text-primary font-semibold hover:underline min-w-0 break-words focus-visible:outline-2 focus-visible:outline-primary rounded ${row.mono ? 'font-mono' : ''}`}
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className={`text-on-surface font-semibold min-w-0 break-words ${row.mono ? 'font-mono' : ''}`}>
                    {row.value}
                  </span>
                )}
              </div>
            ))}
          </section>

          {/* Nota interna */}
          <section className="flex flex-col gap-2">
            <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Nota interna
            </h4>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              rows={2}
              placeholder="Ej.: pidió retirar el viernes a la tarde, la madre avisa antes."
              className="w-full rounded-lg bg-surface-container-low border border-outline-variant/30 p-2.5 text-xs text-on-surface placeholder:text-outline resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {notesChanged && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_ORDER_NOTES', orderId: order.id, notes: notesDraft });
                    showToast('Nota guardada en el pedido.', 'info');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold hover:bg-primary-container cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  type="button"
                >
                  Guardar nota
                </button>
                <button
                  onClick={() => setNotesDraft(order.notes ?? '')}
                  className="px-3 py-1.5 rounded-lg text-on-surface-variant text-[11px] font-semibold hover:bg-surface-container cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                  type="button"
                >
                  Descartar
                </button>
              </div>
            )}
          </section>

          {/* Historial */}
          <section className="flex flex-col gap-2">
            <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Historial del pedido
            </h4>
            <ol className="flex flex-col">
              {order.history.map((event, index) => {
                const meta = ACTOR_META[event.actor];
                const isLast = index === order.history.length - 1;

                return (
                  <li key={`${event.at}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${meta.box}`}>
                        <Icon name={meta.icon} size={15} />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-surface-container-high my-1" />}
                    </div>

                    <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-3'}`}>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-bold text-on-surface">{event.label}</span>
                        <span className="text-[10px] text-outline font-mono">
                          {formatDateTimeShort(event.at)}
                        </span>
                        <span className="text-[10px] text-outline">· {meta.label}</span>
                      </div>
                      {event.detail && (
                        <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5">
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="text-[10px] text-outline">
              Pedido creado {formatRelative(order.timestamp)}.
            </p>
          </section>
        </div>
      </Drawer>

      <OrderReceipt order={order} isOpen={showReceipt} onClose={() => setShowReceipt(false)} />

      <ConfirmDialog
        isOpen={confirmCancel}
        title="Cancelar el pedido"
        message={
          <>
            Vas a cancelar el pedido <strong>{order.code}</strong> de {order.studentName}. El ejemplar vuelve
            al stock
            {order.paymentStatus === 'Pagado' && (
              <> y se registra el reintegro de {formatARS(order.price)}</>
            )}
            .
          </>
        }
        confirmLabel="Cancelar pedido"
        cancelLabel="Volver"
        onConfirm={() => {
          dispatchUndoable(
            {
              type: 'CANCEL_ORDER',
              orderId: order.id,
              actor: 'docente',
              reason: 'Cancelado desde el panel docente',
            },
            `Pedido ${order.code} cancelado y ejemplar devuelto al stock.`,
            'info',
          );
          onClose();
        }}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  );
};
