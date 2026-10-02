import React from 'react';
import type { Order } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { CURRENT_TERM, formatARS, formatLongDate } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { ModalShell } from './ui/ModalShell.tsx';
import { downloadCsv } from '../lib/csv.ts';

/**
 * Comprobante de retiro de un pedido. Es el documento que el alumno presenta
 * en la Mesa de Geografía. Se imprime solo, sin el resto del panel, gracias
 * al contenedor .print-root.
 */

/** Código visual de verificación, derivado del pedido (no es un QR real). */
function VerificationBlock({ order }: { order: Order }) {
  // Matriz 7x7 determinista a partir del código y el DNI.
  const source = `${order.code}${order.studentDni}`;
  const cells: boolean[] = [];
  for (let i = 0; i < 49; i += 1) {
    const charCode = source.charCodeAt(i % source.length);
    cells.push(((charCode * (i + 7)) % 5) < 2);
  }

  return (
    <svg viewBox="0 0 70 70" className="w-20 h-20" role="img" aria-label="Código de verificación del pedido">
      <rect width="70" height="70" fill="#ffffff" />
      {cells.map((filled, index) =>
        filled ? (
          <rect
            key={index}
            x={(index % 7) * 10}
            y={Math.floor(index / 7) * 10}
            width="10"
            height="10"
            fill="#131b2e"
          />
        ) : null,
      )}
      {/* Marcas de esquina, como en un código real */}
      {[
        [0, 0],
        [50, 0],
        [0, 50],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="20" height="20" fill="#131b2e" />
          <rect x={x + 5} y={y + 5} width="10" height="10" fill="#ffffff" />
        </g>
      ))}
    </svg>
  );
}

interface OrderReceiptProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, isOpen, onClose }) => {
  const { state } = useDemo();

  if (!order) return null;

  const school = state.schools.find((s) => s.code === order.schoolCode);

  const handleDownload = () => {
    downloadCsv(
      `GeoCartillas_Comprobante_${order.code}.csv`,
      ['Campo', 'Valor'],
      [
        ['Código', order.code],
        ['Alumno', order.studentName],
        ['DNI', order.studentDni],
        ['Colegio', order.school],
        ['División', order.division],
        ['Cartilla', order.cartillaTitle],
        ['Páginas', order.cartillaPages],
        ['Importe ARS', order.price],
        ['Método de pago', order.paymentMethod],
        ['Estado de pago', order.paymentStatus],
        ['Estado de entrega', order.deliveryStatus],
        ['Punto de retiro', order.pickupLocation],
        ['Fecha del pedido', order.date],
      ],
    );
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprobante ${order.code}`}
      subtitle="Presentalo junto al DNI para retirar la cartilla"
      icon="receipt"
      size="md"
      printableBody
      headerActions={
        <>
          <button
            onClick={handleDownload}
            className="px-3 py-2 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="download" size={16} />
            <span className="hidden sm:inline">Descargar</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="print" size={16} />
            <span>Imprimir</span>
          </button>
        </>
      }
    >
      <div className="p-6 bg-white text-black">
        <div className="border border-black/15 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-black flex items-start justify-between gap-4">
            <div>
              <h1 className="text-base font-extrabold uppercase tracking-tight">GeoCartillas Editorial</h1>
              <p className="text-[11px] font-semibold text-gray-700">
                Comprobante de retiro · Ciclo Lectivo {CURRENT_TERM}
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">{order.pickupLocation}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Código
              </span>
              <span className="block text-xl font-extrabold font-mono">{order.code}</span>
            </div>
          </div>

          <div className="px-5 py-4 flex gap-5">
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Alumno
                </span>
                <span className="block text-sm font-bold">{order.studentName}</span>
                <span className="block text-[11px] text-gray-600 font-mono">DNI {order.studentDni}</span>
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Colegio y curso
                </span>
                <span className="block text-xs font-semibold">{order.school}</span>
                <span className="block text-[11px] text-gray-600">{order.division}</span>
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Cartilla
                </span>
                <span className="block text-xs font-semibold leading-snug">{order.cartillaTitle}</span>
                <span className="block text-[11px] text-gray-600">{order.cartillaPages} páginas</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <VerificationBlock order={order} />
              <span className="text-[9px] text-gray-500 font-mono text-center leading-tight">
                Verificación
                <br />
                {order.code}
              </span>
            </div>
          </div>

          {/* Troquel: el estilo .ticket-perforated ya existia en el CSS */}
          <div className="relative border-t border-dashed border-black/30" />

          <div className="px-5 py-4 flex items-end justify-between gap-4 bg-gray-50">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Importe
              </span>
              <span className="text-2xl font-extrabold font-mono leading-none">
                {formatARS(order.price)}
              </span>
              <span className="text-[11px] text-gray-700 font-semibold">
                {order.paymentMethod} · {order.paymentStatus}
              </span>
            </div>

            <div className="text-right text-[11px] text-gray-700">
              <p className="font-bold">{order.deliveryStatus}</p>
              <p>Pedido del {order.date}</p>
              <p>Emitido el {formatLongDate(Date.now())}</p>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-black/15 text-[10px] text-gray-600 flex items-end justify-between gap-4">
            <div>
              <p className="mb-3">Firma del alumno: _______________________________</p>
              <p>Aclaración: ___________________________________</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold">{school?.coordinator ?? 'Coordinación de Geografía'}</p>
              <p className="font-mono">{school?.phone ?? ''}</p>
            </div>
          </div>
        </div>

        {order.paymentStatus === 'Pendiente de pago' && (
          <p className="mt-4 text-[11px] font-bold text-black bg-yellow-100 border border-yellow-400 rounded-lg px-3 py-2">
            Atención: este pedido tiene el pago pendiente. Hay que abonar {formatARS(order.price)} en efectivo
            al momento del retiro.
          </p>
        )}
      </div>
    </ModalShell>
  );
};
