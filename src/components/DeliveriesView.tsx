import React, { useMemo, useState } from 'react';
import { useDemo } from '../store/demoStore.tsx';
import { useShell } from '../App.tsx';
import { isLive, pickupsBySchool } from '../lib/metrics.ts';
import { formatARS, formatDeliveryWindow, formatRelative } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { ConfirmDialog } from './ui/ConfirmDialog.tsx';
import { DeliveryChip, PaymentChip } from './ui/StatusChip.tsx';
import { exportOrdersCsv } from '../lib/csv.ts';
import { badgeInk, schoolColor, schoolInitials } from '../lib/schoolColors.ts';

/** Días que faltan para una fecha, en lenguaje natural. */
function countdown(timestamp: number): { label: string; urgent: boolean } {
  const days = Math.ceil((timestamp - Date.now()) / (24 * 3600_000));
  if (days < 0) return { label: 'Ventana pasada', urgent: false };
  if (days === 0) return { label: 'Es hoy', urgent: true };
  if (days === 1) return { label: 'Es mañana', urgent: true };
  return { label: `En ${days} días`, urgent: days <= 3 };
}

/**
 * Agenda de retiro por colegio. Cruza la ventana de entrega de cada colegio
 * con los pedidos que están esperando ahí, para organizar la jornada.
 */
export const DeliveriesView: React.FC = () => {
  const { state, dispatchUndoable } = useDemo();
  const { openOrder, openPrintSheet, confirmDelivery } = useShell();
  const [confirmBatch, setConfirmBatch] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const groups = useMemo(() => pickupsBySchool(state.orders, state.schools), [state.orders, state.schools]);

  const batchTarget = groups.find((group) => group.school.code === confirmBatch);

  const totalReady = groups.reduce((sum, group) => sum + group.ready.length, 0);

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="local_shipping" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Logística de retiro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-0.5">
            Agenda de entregas
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Cada colegio con su ventana de retiro y los ejemplares que lo esperan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[11px] font-bold px-3 py-2 rounded-lg bg-primary-fixed text-on-primary-fixed">
            {totalReady} listos para retirar
          </span>
          <button
            onClick={() => openPrintSheet()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest border border-surface-container-high text-on-surface-variant rounded-lg shadow-xs hover:bg-surface-container hover:text-on-surface text-xs font-semibold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="print" size={18} />
            <span>Planilla general</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {groups.map((group) => {
          const { school, ready, prepared, waiting, pendingPayment } = group;
          const timing = countdown(school.nextDeliveryAt);
          const isExpanded = expanded === school.code;
          const pendingAmount = pendingPayment.reduce((sum, order) => sum + order.price, 0);
          const color = schoolColor(state.schools, school.code);

          return (
            <section
              key={school.code}
              // El filete lateral y la insignia llevan el color del colegio:
              // antes las cinco tarjetas eran identicas y no habia donde
              // apoyar la vista para volver a la correcta.
              className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/60 border-l-4 flex flex-col overflow-hidden"
              style={{ borderLeftColor: color }}
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold tracking-tight"
                    style={{ backgroundColor: color, color: badgeInk(color) }}
                    aria-hidden="true"
                  >
                    {schoolInitials(school.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-primary leading-snug">{school.name}</h2>
                    <p className="text-[11px] text-outline mt-0.5 flex items-center gap-1">
                      <Icon name="person" size={13} />
                      {school.coordinator}
                    </p>
                  </div>
                </div>

                {/* Fecha y cuenta regresiva juntas: eran dos renglones diciendo
                    lo mismo con distinto formato. */}
                <div className="bg-surface-container-low rounded-lg pl-3 pr-2 py-2 flex items-center gap-2">
                  <Icon name="event" size={16} className="text-primary shrink-0" />
                  <span className="text-[11px] font-semibold text-on-surface min-w-0 truncate">
                    {formatDeliveryWindow(school.nextDeliveryAt)}
                  </span>
                  <span
                    className={`ml-auto shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      timing.urgent
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {timing.label}
                  </span>
                </div>

                {/* Las cifras van sobre superficie neutra. Antes cada tarjeta
                    aportaba cuatro bloques de color y, repetidos cinco veces,
                    tapaban lo unico que distingue a un colegio de otro. */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Listos', value: ready.length, accent: color },
                    { label: 'Preparados', value: prepared.length },
                    { label: 'En espera', value: waiting.length },
                    { label: 'Por cobrar', value: pendingPayment.length, warn: true },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg py-1.5 bg-surface-container-low">
                      <span
                        className={`block text-lg font-extrabold font-mono leading-none ${
                          stat.value === 0
                            ? 'text-outline'
                            : stat.warn
                              ? 'text-on-tertiary-fixed-variant'
                              : 'text-on-surface'
                        }`}
                        // Un cero no tiene por que gritar: solo se pinta la
                        // cifra que pide accion.
                        style={stat.accent && stat.value > 0 ? { color: stat.accent } : undefined}
                      >
                        {stat.value}
                      </span>
                      <span className="block text-[9px] font-bold uppercase tracking-wider mt-0.5 text-on-surface-variant">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>

                {pendingPayment.length > 0 && (
                  <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                    <Icon name="payments" size={14} className="text-on-tertiary-fixed-variant" />
                    Hay <strong className="text-on-tertiary-fixed-variant">{formatARS(pendingAmount)}</strong> por
                    cobrar en esta jornada.
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setConfirmBatch(school.code)}
                    disabled={ready.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-bold shadow-xs hover:bg-on-secondary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                    type="button"
                  >
                    <Icon name="done_all" size={16} />
                    Cerrar remesa ({ready.length})
                  </button>

                  <button
                    onClick={() => openPrintSheet(school.code)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-on-surface-variant text-xs font-semibold hover:bg-surface-container hover:text-primary transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                    type="button"
                  >
                    <Icon name="print" size={16} />
                    Planilla
                  </button>

                  <button
                    onClick={() =>
                      exportOrdersCsv(
                        state.orders.filter((o) => isLive(o) && o.schoolCode === school.code),
                        school.code,
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-on-surface-variant text-xs font-semibold hover:bg-surface-container hover:text-primary transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                    type="button"
                  >
                    <Icon name="download" size={16} />
                    CSV
                  </button>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : school.code)}
                    className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
                    type="button"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? 'Ocultar' : 'Ver pedidos'}
                    <Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={16} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-surface-container-high/60 max-h-72 overflow-y-auto">
                  {[...ready, ...prepared, ...waiting].length === 0 ? (
                    <EmptyState
                      compact
                      icon="inbox"
                      title="Nada pendiente"
                      message="Todos los pedidos de este colegio ya fueron entregados."
                    />
                  ) : (
                    <ul className="divide-y divide-surface-container-low">
                      {[...ready, ...prepared, ...waiting].map((order) => (
                        <li key={order.id} className="px-4 py-2.5 flex items-center gap-3">
                          <button
                            onClick={() => openOrder(order)}
                            className="min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
                            type="button"
                          >
                            <span className="block text-xs font-bold text-on-surface truncate">
                              {order.studentName}
                            </span>
                            <span className="block text-[11px] text-outline truncate font-mono">
                              {order.code} · {order.division}
                            </span>
                          </button>

                          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                            <DeliveryChip status={order.deliveryStatus} />
                            {order.paymentStatus !== 'Pagado' && <PaymentChip status={order.paymentStatus} />}
                          </div>

                          {order.deliveryStatus === 'Listo para retirar' ? (
                            <button
                              onClick={() => confirmDelivery(order)}
                              className="shrink-0 px-2.5 py-1 rounded bg-secondary text-on-secondary text-[11px] font-bold hover:bg-on-secondary-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-secondary"
                              type="button"
                            >
                              Entregar
                            </button>
                          ) : (
                            <span className="shrink-0 text-[10px] text-outline font-mono">
                              {formatRelative(order.timestamp)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!batchTarget}
        title="Cerrar la remesa"
        message={
          batchTarget ? (
            <>
              Vas a marcar <strong>{batchTarget.ready.length} ejemplares</strong> como entregados en{' '}
              <strong>{batchTarget.school.name}</strong>. Los que tengan el pago pendiente quedan cobrados en
              el acto.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Marcar entregados"
        tone="primary"
        onConfirm={() => {
          if (!batchTarget) return;
          dispatchUndoable(
            { type: 'BULK_DELIVER', orderIds: batchTarget.ready.map((o) => o.id) },
            `${batchTarget.ready.length} ejemplares entregados en ${batchTarget.school.name}.`,
          );
        }}
        onClose={() => setConfirmBatch(null)}
      />
    </div>
  );
};
