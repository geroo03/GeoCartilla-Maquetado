import React, { useEffect, useMemo, useState } from 'react';
import type { Order } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { useShell } from '../App.tsx';
import { computeOrderMetrics, isLive, weekOverWeekDelta } from '../lib/metrics.ts';
import { exportOrdersCsv } from '../lib/csv.ts';
import { formatARS, formatNumber, shortSchoolName } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { KpiCard } from './ui/KpiCard.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { SkeletonRows } from './ui/Skeleton.tsx';
import { Pagination } from './ui/Pagination.tsx';
import { BookletCover } from './ui/CoverArt.tsx';
import { DeliveryChip, PaymentChip, PaymentMethodLabel } from './ui/StatusChip.tsx';

const PAGE_SIZE = 10;

type StatusFilter = '' | 'pendiente' | 'listo' | 'preparado' | 'espera' | 'entregado' | 'cancelado';
type RangeFilter = 'todo' | '7' | '30';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente de pago' },
  { value: 'espera', label: 'En espera' },
  { value: 'preparado', label: 'Preparado' },
  { value: 'listo', label: 'Listo para retirar' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: 'todo', label: 'Todo el ciclo' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '7', label: 'Últimos 7 días' },
];

function matchesStatus(order: Order, filter: StatusFilter): boolean {
  switch (filter) {
    case '':
      return true;
    case 'pendiente':
      return order.paymentStatus === 'Pendiente de pago' && isLive(order);
    case 'listo':
      return order.deliveryStatus === 'Listo para retirar';
    case 'preparado':
      return order.deliveryStatus === 'Preparado';
    case 'espera':
      return order.deliveryStatus === 'En espera';
    case 'entregado':
      return order.deliveryStatus === 'Entregado';
    case 'cancelado':
      return order.deliveryStatus === 'Cancelado';
    default:
      return true;
  }
}

/** Un pedido entregado o cancelado ya no admite acciones en lote. */
const isActionable = (order: Order) =>
  order.deliveryStatus !== 'Entregado' && order.deliveryStatus !== 'Cancelado';

export const OrdersView: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const { state, dispatchUndoable } = useDemo();
  const { openOrder, confirmDelivery, openManualOrder, openPrintSheet } = useShell();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('todo');
  const [isReloading, setIsReloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const metrics = useMemo(() => computeOrderMetrics(state.orders), [state.orders]);
  const delta = useMemo(() => weekOverWeekDelta(state.orders), [state.orders]);

  // Las opciones salen de los datos, no de una lista escrita a mano.
  const years = useMemo(
    () => [...new Set(state.orders.map((o) => o.year))].sort(),
    [state.orders],
  );

  const filteredOrders = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');
    const cutoff =
      rangeFilter === 'todo' ? 0 : Date.now() - Number(rangeFilter) * 24 * 3600_000;

    return state.orders.filter((order) => {
      const matchesSearch =
        needle === '' ||
        order.studentName.toLowerCase().includes(needle) ||
        order.code.toLowerCase().includes(needle) ||
        order.cartillaTitle.toLowerCase().includes(needle) ||
        order.studentEmail.toLowerCase().includes(needle) ||
        order.division.toLowerCase().includes(needle) ||
        (digits.length >= 3 && order.studentDni.replace(/\D/g, '').includes(digits));

      return (
        matchesSearch &&
        (schoolFilter === '' || order.schoolCode === schoolFilter) &&
        (yearFilter === '' || order.year === yearFilter) &&
        matchesStatus(order, statusFilter) &&
        order.timestamp >= cutoff
      );
    });
  }, [state.orders, searchQuery, schoolFilter, yearFilter, statusFilter, rangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  // Cualquier cambio de filtro vuelve a la primera página, y si la página
  // actual se queda sin resultados se retrocede en lugar de mostrar vacío.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, schoolFilter, yearFilter, statusFilter, rangeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageOrders = filteredOrders.slice(pageStart, pageStart + PAGE_SIZE);

  // La selección masiva opera sobre lo filtrado y accionable, no sobre la página.
  const selectableIds = useMemo(
    () => filteredOrders.filter(isActionable).map((o) => o.id),
    [filteredOrders],
  );
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const activeFilters =
    (schoolFilter ? 1 : 0) + (yearFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (rangeFilter !== 'todo' ? 1 : 0);

  const clearFilters = () => {
    setSchoolFilter('');
    setYearFilter('');
    setStatusFilter('');
    setRangeFilter('todo');
  };

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => setIsReloading(false), 700);
  };

  const selectClass =
    'w-full appearance-none h-10 pl-3 pr-8 bg-surface-container-low text-on-surface text-xs rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-medium';

  /** Acción primaria de la fila según el estado del pedido. */
  const renderRowAction = (order: Order) => {
    if (order.deliveryStatus === 'Cancelado') {
      return <span className="text-[11px] text-outline font-semibold px-2.5">Cancelado</span>;
    }
    if (order.deliveryStatus === 'Listo para retirar') {
      return (
        <button
          onClick={() => confirmDelivery(order)}
          className="px-2.5 py-1 rounded bg-secondary text-on-secondary text-[11px] font-bold hover:bg-on-secondary-container transition-colors shadow-xs cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary"
          type="button"
        >
          Marcar como entregado
        </button>
      );
    }
    if (order.paymentStatus === 'Pendiente de pago') {
      return (
        <button
          onClick={() =>
            dispatchUndoable(
              { type: 'MARK_PAID', orderId: order.id },
              `Pago de ${formatARS(order.price)} registrado para ${order.studentName}.`,
            )
          }
          className="px-2.5 py-1 rounded bg-tertiary-container text-on-tertiary text-[11px] font-bold hover:bg-tertiary transition-colors shadow-xs cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          type="button"
        >
          Registrar cobro
        </button>
      );
    }
    return (
      <button
        onClick={() => openOrder(order)}
        className="px-2.5 py-1 rounded bg-surface-container text-primary text-[11px] font-medium hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
        type="button"
      >
        Comprobante
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="inventory_2" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Control logístico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-0.5">
            Gestión de pedidos de cartillas
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Supervisá la cobranza, el tiraje impreso y la entrega de cuadernillos en sede institucional.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => openPrintSheet(schoolFilter || undefined)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest border border-surface-container-high text-on-surface-variant rounded-lg shadow-xs hover:bg-surface-container hover:text-on-surface text-xs font-semibold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="print" size={18} />
            <span>Imprimir planilla</span>
          </button>

          <button
            onClick={openManualOrder}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-container text-xs font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="add" size={18} />
            <span>Cargar pedido manual</span>
          </button>
        </div>
      </div>

      {/* KPIs calculados sobre los pedidos reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pedidos totales"
          value={metrics.total}
          icon="auto_stories"
          accent="primary"
          badge={delta !== null ? `${delta >= 0 ? '+' : ''}${Math.round(delta)}% sem.` : undefined}
          footerLabel="Recaudación acumulada"
          footerValue={formatARS(metrics.revenue)}
          progress={metrics.collectionRate}
        />
        <KpiCard
          label="Pendientes de pago"
          value={metrics.pendingCount}
          icon="payments"
          accent="amber"
          footerLabel="Por cobrar en sala"
          footerValue={formatARS(metrics.pendingAmount)}
          progress={metrics.pendingCount / Math.max(1, metrics.total)}
          onClick={() => setStatusFilter(statusFilter === 'pendiente' ? '' : 'pendiente')}
          isActive={statusFilter === 'pendiente'}
        />
        <KpiCard
          label="Listos para retirar"
          value={metrics.readyCount}
          icon="mark_email_read"
          accent="primary"
          footerLabel="En preparación"
          footerValue={formatNumber(metrics.preparedCount + metrics.waitingCount)}
          progress={metrics.readyCount / Math.max(1, metrics.total)}
          onClick={() => setStatusFilter(statusFilter === 'listo' ? '' : 'listo')}
          isActive={statusFilter === 'listo'}
        />
        <KpiCard
          label="Entregados"
          value={metrics.deliveredCount}
          icon="task_alt"
          accent="green"
          footerLabel="Del total del ciclo"
          footerValue={`${Math.round(metrics.deliveryRate * 100)}%`}
          progress={metrics.deliveryRate}
          onClick={() => setStatusFilter(statusFilter === 'entregado' ? '' : 'entregado')}
          isActive={statusFilter === 'entregado'}
        />
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <label className="sr-only" htmlFor="filtro-colegio">Colegio</label>
              <select
                id="filtro-colegio"
                className={selectClass}
                value={schoolFilter}
                onChange={(event) => setSchoolFilter(event.target.value)}
              >
                <option value="">Todos los colegios</option>
                {state.schools.map((school) => (
                  <option key={school.code} value={school.code}>
                    {school.name}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size={18}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
              />
            </div>

            <div className="relative min-w-[130px] flex-1 sm:flex-initial">
              <label className="sr-only" htmlFor="filtro-anio">Año</label>
              <select
                id="filtro-anio"
                className={selectClass}
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
              >
                <option value="">Todos los años</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size={18}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
              />
            </div>

            <div className="relative min-w-[160px] flex-1 sm:flex-initial">
              <label className="sr-only" htmlFor="filtro-estado">Estado</label>
              <select
                id="filtro-estado"
                className={selectClass}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size={18}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
              />
            </div>

            <div className="relative min-w-[150px] flex-1 sm:flex-initial">
              <label className="sr-only" htmlFor="filtro-rango">Período</label>
              <select
                id="filtro-rango"
                className={selectClass}
                value={rangeFilter}
                onChange={(event) => setRangeFilter(event.target.value as RangeFilter)}
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon
                name="calendar_today"
                size={16}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
              />
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-10 px-3 text-xs font-semibold text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                type="button"
              >
                <Icon name="filter_alt_off" size={16} />
                Limpiar {activeFilters} filtro{activeFilters > 1 ? 's' : ''}
              </button>
            )}
          </div>

          <button
            onClick={() => exportOrdersCsv(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-surface-container-high text-primary font-bold text-xs rounded-lg hover:bg-primary hover:text-on-primary transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="download" size={18} />
            <span>Exportar CSV ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Acciones en lote */}
      {selectedIds.length > 0 && (
        <div className="bg-primary text-on-primary px-5 py-3 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs shrink-0">
              {selectedIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">
                {selectedIds.length} pedido{selectedIds.length > 1 ? 's' : ''} seleccionado
                {selectedIds.length > 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-on-primary-container">
                Los que tengan el pago pendiente quedan cobrados al entregarlos.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const ids = [...selectedIds];
                dispatchUndoable(
                  { type: 'BULK_DELIVER', orderIds: ids },
                  `${ids.length} cartillas marcadas como entregadas.`,
                );
                setSelectedIds([]);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-all text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-fixed-dim"
              type="button"
            >
              <Icon name="done_all" size={16} />
              <span>Marcar como entregados</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-on-primary hover:bg-primary-container transition-colors text-xs font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-secondary-fixed-dim"
              type="button"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Tabla (escritorio) y tarjetas (mobile) */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/60 overflow-hidden flex flex-col">
        {isReloading ? (
          <SkeletonRows rows={PAGE_SIZE} columns={6} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No se encontraron pedidos con estos filtros"
            message="Probá cambiando el colegio, el estado o limpiando el texto de búsqueda del encabezado."
            action={
              activeFilters > 0 || searchQuery
                ? { label: 'Limpiar filtros', onClick: clearFilters, icon: 'filter_alt_off' }
                : { label: 'Cargar pedido manual', onClick: openManualOrder, icon: 'add' }
            }
          />
        ) : (
          <>
            {/* Tabla para pantallas grandes */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[11px] tracking-wider uppercase font-bold border-b border-surface-container-high/50">
                    <th className="py-3.5 px-4 w-12 text-center">
                      <input
                        checked={allSelected}
                        onChange={() => setSelectedIds(allSelected ? [] : selectableIds)}
                        className="w-4 h-4 rounded cursor-pointer accent-primary"
                        type="checkbox"
                        aria-label="Seleccionar todos los pedidos filtrados"
                      />
                    </th>
                    <th className="py-3.5 px-3">Código</th>
                    <th className="py-3.5 px-3">Alumno</th>
                    <th className="py-3.5 px-3">Colegio</th>
                    <th className="py-3.5 px-3">Cartilla pedida</th>
                    <th className="py-3.5 px-3">Método pago</th>
                    <th className="py-3.5 px-3">Estado pago</th>
                    <th className="py-3.5 px-3">Estado entrega</th>
                    <th className="py-3.5 px-3">Fecha</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-on-surface divide-y divide-surface-container-high/40">
                  {pageOrders.map((order) => {
                    const isChecked = selectedIds.includes(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors ${
                          isChecked ? 'bg-primary-fixed/10' : 'hover:bg-surface-container-low/70'
                        } ${order.deliveryStatus === 'Cancelado' ? 'opacity-60' : ''}`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            checked={isChecked}
                            disabled={!isActionable(order)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(order.id)
                                  ? prev.filter((id) => id !== order.id)
                                  : [...prev, order.id],
                              )
                            }
                            className="w-4 h-4 rounded cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            type="checkbox"
                            aria-label={`Seleccionar pedido ${order.code}`}
                          />
                        </td>

                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => openOrder(order)}
                            className="font-mono font-bold text-primary hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
                            type="button"
                          >
                            {order.code}
                          </button>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface">{order.studentName}</span>
                            <span className="text-[11px] text-outline font-mono">DNI {order.studentDni}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 max-w-[11rem]">
                          <div className="flex flex-col" title={order.school}>
                            <span className="text-on-surface-variant truncate">
                              {shortSchoolName(order.school)}
                            </span>
                            <span className="text-[11px] text-outline truncate">{order.division}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <BookletCover
                              coverUrl={order.cartillaCover}
                              motif={
                                state.cartillas.find((c) => c.id === order.cartillaId)?.coverMotif ??
                                'topographic'
                              }
                              seed={order.cartillaId}
                              className="w-7 h-10 rounded shrink-0 shadow-xs"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate max-w-[13rem]" title={order.cartillaTitle}>
                                {order.cartillaTitle}
                              </span>
                              <span className="text-[11px] text-outline">
                                {order.cartillaPages} págs. · {formatARS(order.price)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <PaymentMethodLabel method={order.paymentMethod} />
                        </td>

                        <td className="py-3.5 px-3">
                          <PaymentChip status={order.paymentStatus} />
                        </td>

                        <td className="py-3.5 px-3">
                          <DeliveryChip status={order.deliveryStatus} />
                        </td>

                        <td className="py-3.5 px-3 text-outline whitespace-nowrap text-[11px] font-mono">
                          {order.date}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openOrder(order)}
                              className="p-1 rounded text-on-surface-variant hover:bg-surface-container cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                              title={`Ver detalle de ${order.code}`}
                              type="button"
                            >
                              <Icon name="visibility" size={18} />
                            </button>
                            {renderRowAction(order)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tarjetas para mobile */}
            <ul className="lg:hidden divide-y divide-surface-container-high/40">
              {pageOrders.map((order) => (
                <li key={order.id} className={`p-4 flex flex-col gap-2.5 ${order.deliveryStatus === 'Cancelado' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input
                      checked={selectedIds.includes(order.id)}
                      disabled={!isActionable(order)}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(order.id)
                            ? prev.filter((id) => id !== order.id)
                            : [...prev, order.id],
                        )
                      }
                      className="w-4 h-4 rounded cursor-pointer accent-primary mt-0.5 shrink-0 disabled:opacity-30"
                      type="checkbox"
                      aria-label={`Seleccionar pedido ${order.code}`}
                    />
                    <BookletCover
                      coverUrl={order.cartillaCover}
                      motif={
                        state.cartillas.find((c) => c.id === order.cartillaId)?.coverMotif ?? 'topographic'
                      }
                      seed={order.cartillaId}
                      className="w-10 h-14 rounded shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-xs">{order.code}</span>
                        <span className="text-[10px] text-outline font-mono">{order.date}</span>
                      </div>
                      <span className="block text-sm font-bold text-on-surface truncate">
                        {order.studentName}
                      </span>
                      <span className="block text-[11px] text-outline truncate">
                        {order.division} · {order.school}
                      </span>
                      <span className="block text-[11px] text-on-surface-variant truncate mt-0.5">
                        {order.cartillaTitle}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-primary font-mono shrink-0">
                      {formatARS(order.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pl-7">
                    <PaymentChip status={order.paymentStatus} />
                    <DeliveryChip status={order.deliveryStatus} />
                  </div>

                  <div className="flex items-center gap-2 pl-7">
                    <button
                      onClick={() => openOrder(order)}
                      className="px-2.5 py-1.5 rounded bg-surface-container text-primary text-[11px] font-semibold hover:bg-surface-container-high cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                      type="button"
                    >
                      Ver detalle
                    </button>
                    {renderRowAction(order)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Pie con paginación real */}
        {filteredOrders.length > 0 && !isReloading && (
          <div className="px-4 py-3 border-t border-surface-container-high/50 bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-on-surface-variant">
                Mostrando{' '}
                <strong className="text-on-surface font-semibold">
                  {pageStart + 1} a {Math.min(pageStart + PAGE_SIZE, filteredOrders.length)}
                </strong>{' '}
                de <strong className="text-on-surface font-semibold">{filteredOrders.length}</strong> pedidos
                {filteredOrders.length !== state.orders.length && (
                  <span className="text-outline"> (filtrados de {state.orders.length})</span>
                )}
              </span>

              <button
                onClick={handleReload}
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
                type="button"
              >
                <Icon name="refresh" size={16} />
                <span>Simular recarga</span>
              </button>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Pie institucional */}
      <div className="p-4 bg-surface-container-low rounded-xl border border-surface-container-high/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Icon name="school" size={22} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-on-surface">Coordinación de Cartillas de Geografía</span>
            <span className="text-on-surface-variant">
              Próxima remesa: {state.schools[0]?.nextDelivery ?? 'a confirmar'}. Disponibles en sala docente.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-outline">Soporte docente directo:</span>
          <a
            href={`tel:${(state.schools[0]?.phone ?? '').replace(/\D/g, '')}`}
            className="font-bold text-primary font-mono hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded"
          >
            {state.schools[0]?.phone}
          </a>
        </div>
      </div>
    </div>
  );
};
