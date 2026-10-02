import React, { useMemo, useState } from 'react';
import { useDemo } from '../store/demoStore.tsx';
import { isLive } from '../lib/metrics.ts';
import { CURRENT_TERM, formatARS, formatLongDate } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { ModalShell } from './ui/ModalShell.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { exportOrdersCsv } from '../lib/csv.ts';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Si viene, la planilla se limita a ese colegio. */
  schoolCode?: string | null;
}

type Scope = 'pendientes' | 'todos';

/**
 * Planilla de firmas para la jornada de retiro. Sale sola al imprimir: el
 * cuerpo va marcado como print-root y el resto de la app lleva no-print.
 */
export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({ isOpen, onClose, schoolCode }) => {
  const { state } = useDemo();
  const [scope, setScope] = useState<Scope>('pendientes');

  const school = state.schools.find((s) => s.code === schoolCode);

  const orders = useMemo(() => {
    return state.orders
      .filter((order) => {
        if (!isLive(order)) return false;
        if (schoolCode && order.schoolCode !== schoolCode) return false;
        if (scope === 'pendientes' && order.deliveryStatus === 'Entregado') return false;
        return true;
      })
      .sort(
        (a, b) =>
          a.school.localeCompare(b.school) ||
          a.division.localeCompare(b.division) ||
          a.studentName.localeCompare(b.studentName),
      );
  }, [state.orders, schoolCode, scope]);

  const pendingAmount = orders
    .filter((order) => order.paymentStatus === 'Pendiente de pago')
    .reduce((sum, order) => sum + order.price, 0);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Planilla de retiro institucional"
      subtitle={
        school
          ? `${school.name} · ${school.nextDelivery}`
          : 'Control de firmas y entregas para la Mesa de Geografía'
      }
      icon="print"
      size="xl"
      printableBody
      headerActions={
        <>
          <div className="hidden sm:flex items-center rounded-lg bg-surface-container p-0.5">
            {(
              [
                { value: 'pendientes' as Scope, label: 'Por entregar' },
                { value: 'todos' as Scope, label: 'Todos' },
              ]
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => setScope(option.value)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                  scope === option.value
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
                aria-pressed={scope === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportOrdersCsv(orders, schoolCode ?? 'planilla')}
            disabled={orders.length === 0}
            className="px-3 py-2 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="download" size={16} />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={orders.length === 0}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary-container disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="print" size={16} />
            <span>Imprimir</span>
          </button>
        </>
      }
    >
      {orders.length === 0 ? (
        <EmptyState
          icon="task_alt"
          title="No queda nada por entregar"
          message={
            scope === 'pendientes'
              ? 'Todos los pedidos de este alcance ya fueron retirados. Cambiá a "Todos" para ver el historial completo.'
              : 'No hay pedidos para este colegio.'
          }
        />
      ) : (
        <div className="p-8 bg-white text-black">
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start gap-6">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">GeoCartillas Editorial</h1>
              <h2 className="text-sm font-semibold text-gray-700">
                Planilla de retiro de cartillas · Ciclo Lectivo {CURRENT_TERM}
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {school ? `${school.name} · ${school.address}` : 'Todos los colegios adscriptos'}
              </p>
              <p className="text-xs text-gray-600">
                Punto de entrega: {orders[0].pickupLocation} · {state.teacher?.name ?? 'Cátedra de Geografía'}
              </p>
              {school && (
                <p className="text-xs text-gray-600">
                  Ventana de retiro: {school.nextDelivery} · Coordina {school.coordinator}
                </p>
              )}
            </div>
            <div className="text-right text-xs text-gray-600 shrink-0">
              <p>Emitida el {formatLongDate(Date.now())}</p>
              <p>
                Registros: <strong>{orders.length}</strong>
              </p>
              <p>
                Alcance: {scope === 'pendientes' ? 'pendientes de entrega' : 'todos los pedidos'}
              </p>
              {pendingAmount > 0 && (
                <p className="font-bold text-black mt-1">A cobrar: {formatARS(pendingAmount)}</p>
              )}
            </div>
          </div>

          <table className="w-full text-left text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                <th className="p-2 border-r border-gray-300 w-20">Código</th>
                <th className="p-2 border-r border-gray-300">Alumno / DNI</th>
                <th className="p-2 border-r border-gray-300">Colegio / División</th>
                <th className="p-2 border-r border-gray-300">Cartilla solicitada</th>
                <th className="p-2 border-r border-gray-300 w-28">Estado / Cobro</th>
                <th className="p-2 w-36">Firma de retiro</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="p-2 border-r border-gray-300 font-mono font-bold align-top">
                    {order.code}
                  </td>
                  <td className="p-2 border-r border-gray-300 align-top">
                    <div className="font-bold">{order.studentName}</div>
                    <div className="text-[11px] text-gray-600 font-mono">DNI {order.studentDni}</div>
                  </td>
                  <td className="p-2 border-r border-gray-300 align-top">
                    <div>{order.school}</div>
                    <div className="text-[11px] text-gray-600">{order.division}</div>
                  </td>
                  <td className="p-2 border-r border-gray-300 font-medium align-top">
                    {order.cartillaTitle}
                  </td>
                  <td className="p-2 border-r border-gray-300 align-top">
                    <div className="font-semibold">{order.deliveryStatus}</div>
                    <div className="text-[11px] text-gray-600">
                      {order.paymentStatus === 'Pagado'
                        ? `Pagado (${order.paymentMethod})`
                        : `Cobrar ${formatARS(order.price)}`}
                    </div>
                  </td>
                  <td className="p-2 h-11" />
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between gap-6 text-xs text-gray-600">
            <div>
              <p className="mb-2">Firma y aclaración del docente receptor:</p>
              <p>_______________________________________________</p>
            </div>
            <div className="text-right shrink-0">
              <p>Soporte de imprenta:</p>
              <p className="font-mono font-semibold">
                {school?.phone ?? state.schools[0]?.phone ?? ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
};
