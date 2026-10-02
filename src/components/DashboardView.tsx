import React, { useMemo } from 'react';
import { useDemo } from '../store/demoStore.tsx';
import { useShell } from '../App.tsx';
import {
  computeOrderMetrics,
  deliveryFunnel,
  isLive,
  lowStockCartillas,
  revenueBySchool,
  topCartillas,
  weekOverWeekDelta,
  weeklySeries,
} from '../lib/metrics.ts';
import {
  CURRENT_TERM,
  formatARS,
  formatAxisDate,
  formatCompactARS,
  formatNumber,
} from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { KpiCard } from './ui/KpiCard.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { ChartCard } from './charts/ChartCard.tsx';
import { StackedColumns, type ColumnDatum } from './charts/StackedColumns.tsx';
import { HorizontalBars, type BarDatum } from './charts/HorizontalBars.tsx';
import { FUNNEL_RAMP, SERIES } from './charts/chartTheme.ts';

/** Tabla equivalente a un gráfico, para no dejar ningún dato sólo en el color. */
function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left text-outline border-b border-surface-container-high">
            {head.map((cell) => (
              <th key={cell} className="py-1.5 pr-3 font-bold uppercase tracking-wider">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-low">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`py-1.5 pr-3 ${
                    cellIndex === 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant font-mono'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DashboardView: React.FC = () => {
  const { state } = useDemo();
  const { openOrder, goToTab } = useShell();

  const metrics = useMemo(() => computeOrderMetrics(state.orders), [state.orders]);
  const series = useMemo(() => weeklySeries(state.orders, 10), [state.orders]);
  const delta = useMemo(() => weekOverWeekDelta(state.orders), [state.orders]);
  const bySchool = useMemo(() => revenueBySchool(state.orders, state.schools), [state.orders, state.schools]);
  const funnel = useMemo(() => deliveryFunnel(state.orders), [state.orders]);
  const top = useMemo(() => topCartillas(state.orders, 5), [state.orders]);
  const lowStock = useMemo(() => lowStockCartillas(state.cartillas), [state.cartillas]);

  const pendingOrders = useMemo(
    () =>
      state.orders
        .filter((o) => isLive(o) && o.paymentStatus === 'Pendiente de pago')
        .sort((a, b) => a.timestamp - b.timestamp),
    [state.orders],
  );

  // Columnas apiladas: pagado y pendiente comparten la escala de "pedidos".
  // La recaudación, que es otra escala, va en el tooltip y no en un segundo eje.
  const columns: ColumnDatum[] = useMemo(
    () =>
      series.map((point) => {
        const weekOrders = state.orders.filter(
          (o) => isLive(o) && o.timestamp >= point.weekStart && o.timestamp < point.weekStart + 7 * 24 * 3600_000,
        );
        const paid = weekOrders.filter((o) => o.paymentStatus === 'Pagado').length;
        return {
          label: formatAxisDate(point.weekStart),
          segments: [
            { key: 'Pagado', value: paid, color: SERIES.paid },
            { key: 'Pendiente', value: weekOrders.length - paid, color: SERIES.pending },
          ],
          note: `Recaudado: ${formatARS(point.revenue)}`,
        };
      }),
    [series, state.orders],
  );

  const schoolBars: BarDatum[] = bySchool.map((row) => ({
    label: row.name.replace(/^(Col\.|Inst\.|Esc\.|Comercial) /, ''),
    value: row.revenue,
    display: formatCompactARS(row.revenue),
    note: `${row.orders} pedidos · ${row.pending} por cobrar · ${row.readyToPickup} listos para retirar`,
  }));

  const funnelBars: BarDatum[] = funnel.map((stage, index) => ({
    label: stage.label,
    value: stage.count,
    display: String(stage.count),
    color: FUNNEL_RAMP[index],
    note: `${stage.count} de ${metrics.total} pedidos (${Math.round((stage.count / Math.max(1, metrics.total)) * 100)}%)`,
  }));

  const topBars: BarDatum[] = top.map((row) => ({
    label: row.title.replace(/^Geografía /, '').replace(' Año:', ':'),
    value: row.orders,
    display: String(row.orders),
    note: `${formatARS(row.revenue)} recaudados`,
  }));

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="insights" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Ciclo Lectivo {CURRENT_TERM}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-0.5">
            Resumen de la cátedra
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Todos los números se recalculan con cada cobro, entrega o pedido nuevo.
          </p>
        </div>

        {/* Figura protagonista: una sola por vista */}
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 border border-surface-container-high/60 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Recaudado en el ciclo
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-extrabold text-primary leading-none">
              {formatARS(metrics.revenue)}
            </span>
          </div>
          <span className="text-[11px] text-outline">
            {formatNumber(metrics.deliveredCount)} cartillas entregadas de {formatNumber(metrics.total)} pedidos
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pedidos del ciclo"
          value={metrics.total}
          icon="receipt_long"
          accent="primary"
          badge={delta !== null ? `${delta >= 0 ? '+' : ''}${Math.round(delta)}% sem.` : undefined}
          footerLabel="Cobranza"
          footerValue={`${Math.round(metrics.collectionRate * 100)}%`}
          progress={metrics.collectionRate}
          onClick={() => goToTab('pedidos')}
        />
        <KpiCard
          label="Por cobrar"
          value={metrics.pendingCount}
          icon="payments"
          accent="amber"
          footerLabel="Monto pendiente"
          footerValue={formatARS(metrics.pendingAmount)}
          progress={metrics.pendingCount / Math.max(1, metrics.total)}
          onClick={() => goToTab('pedidos')}
        />
        <KpiCard
          label="Listos para retirar"
          value={metrics.readyCount}
          icon="mark_email_read"
          accent="primary"
          footerLabel="Preparándose"
          footerValue={formatNumber(metrics.preparedCount + metrics.waitingCount)}
          progress={metrics.readyCount / Math.max(1, metrics.total)}
          onClick={() => goToTab('entregas')}
        />
        <KpiCard
          label="Entregados"
          value={metrics.deliveredCount}
          icon="task_alt"
          accent="green"
          footerLabel="Del total"
          footerValue={`${Math.round(metrics.deliveryRate * 100)}%`}
          progress={metrics.deliveryRate}
          onClick={() => goToTab('entregas')}
        />
      </div>

      <ChartCard
        title="Pedidos por semana"
        subtitle="Últimas 10 semanas. Pasá el mouse para ver lo recaudado en cada una."
        legend={[
          { label: 'Pagado', color: SERIES.paid },
          { label: 'Pendiente de pago', color: SERIES.pending },
        ]}
        table={
          <DataTable
            head={['Semana', 'Pedidos', 'Recaudado']}
            rows={series.map((point, index) => [
              formatAxisDate(point.weekStart),
              columns[index].segments.reduce((sum, s) => sum + s.value, 0),
              formatARS(point.revenue),
            ])}
          />
        }
      >
        <StackedColumns data={columns} height={210} />
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Recaudación por colegio"
          subtitle="Sólo pedidos cobrados."
          table={
            <DataTable
              head={['Colegio', 'Pedidos', 'Recaudado', 'Por cobrar']}
              rows={bySchool.map((row) => [row.name, row.orders, formatARS(row.revenue), row.pending])}
            />
          }
        >
          <HorizontalBars data={schoolBars} labelWidth={132} />
        </ChartCard>

        <ChartCard
          title="Embudo de entrega"
          subtitle="De la solicitud al retiro en la Mesa de Geografía."
          table={
            <DataTable
              head={['Etapa', 'Pedidos', 'Del total']}
              rows={funnel.map((stage) => [
                stage.label,
                stage.count,
                `${Math.round((stage.count / Math.max(1, metrics.total)) * 100)}%`,
              ])}
            />
          }
        >
          <HorizontalBars data={funnelBars} labelWidth={118} barHeight={22} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Cartillas más pedidas"
          subtitle="Ranking por cantidad de pedidos."
          table={
            <DataTable
              head={['Cartilla', 'Pedidos', 'Recaudado']}
              rows={top.map((row) => [row.title, row.orders, formatARS(row.revenue)])}
            />
          }
        >
          <HorizontalBars data={topBars} labelWidth={150} />
        </ChartCard>

        <section className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high/60 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Pendientes de cobro</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Los más antiguos primero. Tocá uno para cobrarlo.
              </p>
            </div>
            {metrics.pendingCount > 0 && (
              <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
                {formatARS(metrics.pendingAmount)}
              </span>
            )}
          </div>

          {pendingOrders.length === 0 ? (
            <EmptyState
              compact
              icon="task_alt"
              title="Todo cobrado"
              message="No queda ningún pedido con el pago pendiente."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-surface-container-low -mx-1 max-h-[17rem] overflow-y-auto">
              {pendingOrders.slice(0, 8).map((order) => (
                <li key={order.id}>
                  <button
                    onClick={() => openOrder(order)}
                    className="w-full text-left px-1 py-2.5 flex items-center gap-3 hover:bg-surface-container-low rounded transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-on-surface truncate">
                        {order.studentName}
                      </span>
                      <span className="block text-[11px] text-outline truncate">
                        {order.code} · {order.division} · {order.paymentMethod}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-extrabold text-on-tertiary-container font-mono">
                      {formatARS(order.price)}
                    </span>
                    <Icon name="chevron_right" size={16} className="text-outline shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {lowStock.length > 0 && (
            <div className="mt-3 pt-3 border-t border-surface-container-high/60">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Icon name="warning" size={14} className="text-error" />
                Stock bajo
              </h4>
              <ul className="flex flex-col gap-1">
                {lowStock.map((cartilla) => (
                  <li key={cartilla.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-on-surface-variant truncate">{cartilla.code} · {cartilla.year}</span>
                    <button
                      onClick={() => goToTab('cartillas')}
                      className="shrink-0 font-bold text-error hover:underline focus-visible:outline-2 focus-visible:outline-error rounded"
                      type="button"
                    >
                      {cartilla.stock} ejemplares
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
