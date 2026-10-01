import React, { useState, useMemo } from 'react';
import { Order } from '../types/index.ts';

interface OrdersViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onOpenConfirmDelivery: (order: Order) => void;
  onOpenManualOrder: () => void;
  onOpenPrintSheet: () => void;
  onBulkDeliver: (ids: string[]) => void;
  searchQuery: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onSelectOrder,
  onOpenConfirmDelivery,
  onOpenManualOrder,
  onOpenPrintSheet,
  onBulkDeliver,
  searchQuery,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['geo-4821', 'geo-4819', 'geo-4815']);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        searchQuery === '' ||
        o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.studentDni.includes(searchQuery) ||
        o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.cartillaTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSchool =
        selectedSchool === '' ||
        o.schoolCode === selectedSchool ||
        o.school.toLowerCase().includes(selectedSchool.toLowerCase());

      const matchesYear = selectedYear === '' || o.year.includes(selectedYear);

      const matchesStatus =
        selectedStatus === '' ||
        (selectedStatus === 'pendiente' && o.paymentStatus === 'Pendiente de pago') ||
        (selectedStatus === 'listo' && o.deliveryStatus === 'Listo para retirar') ||
        (selectedStatus === 'entregado' && o.deliveryStatus === 'Entregado');

      return matchesSearch && matchesSchool && matchesYear && matchesStatus;
    });
  }, [orders, searchQuery, selectedSchool, selectedYear, selectedStatus]);

  // Bulk selection handling
  const allSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Código',
      'Alumno',
      'DNI',
      'Colegio',
      'Año',
      'Cartilla',
      'Método Pago',
      'Estado Pago',
      'Estado Entrega',
      'Monto ARS',
      'Fecha',
    ];
    const rows = filteredOrders.map((o) => [
      o.code,
      `"${o.studentName}"`,
      o.studentDni,
      `"${o.school}"`,
      o.year,
      `"${o.cartillaTitle}"`,
      o.paymentMethod,
      o.paymentStatus,
      o.deliveryStatus,
      o.price,
      o.date,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeoCartillas_Pedidos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Microinteraction: simulate reload
  const handleSimulateReload = () => {
    setIsReloading(true);
    setTimeout(() => {
      setIsReloading(false);
    }, 700);
  };

  // Calculations for KPI Cards
  const totalOrdersCount = 148;
  const totalAmountCalc = '+$1.184.000 ARS';
  const pendingCount = 19;
  const readyCount = 34;
  const deliveredCount = 95;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Sub-header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <span className="text-xs font-bold uppercase tracking-wider">Control Logístico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-0.5">
            Gestión de Pedidos de Cartillas
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Supervisá la cobranza, el tiraje impreso y la entrega de cuadernillos escolares en sede institucional.
          </p>
        </div>

        {/* Quick Tool Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenPrintSheet}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest border border-surface-container-high text-on-surface-variant rounded-lg shadow-xs hover:bg-surface-container hover:text-on-surface text-xs font-semibold transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Imprimir Planilla Retiro</span>
          </button>

          <button
            onClick={onOpenManualOrder}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-container text-xs font-bold transition-all cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Cargar Pedido Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pedidos Totales */}
        <div className="relative bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary-fixed/30 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Pedidos Totales
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-primary font-mono">{totalOrdersCount}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                  +12% mes
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">auto_stories</span>
            </div>
          </div>
          <div className="mt-4 pt-1 flex items-center justify-between text-xs">
            <span className="text-outline">Recaudación acumulada</span>
            <span className="text-xs font-extrabold text-primary">{totalAmountCalc}</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Card 2: Pendientes de Pago (Amber) */}
        <div className="relative bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-tertiary-fixed/30 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-on-tertiary-container uppercase tracking-wider">
                Pendientes de Pago
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-on-tertiary-fixed font-mono">{pendingCount}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold">
                  Efectivo
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
          </div>
          <div className="mt-4 pt-1 flex items-center justify-between text-xs">
            <span className="text-outline">Por cobrar en sala</span>
            <span className="text-xs font-extrabold text-on-tertiary-container">$152.000 ARS</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-on-tertiary-container h-full rounded-full" style={{ width: '25%' }} />
          </div>
        </div>

        {/* Card 3: Listos para Retirar (Ocean Blue) */}
        <div className="relative bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary-fixed/40 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-primary-container uppercase tracking-wider">
                Listos para Retirar
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-primary font-mono">{readyCount}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-bold">
                  En mesa
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">mark_email_read</span>
            </div>
          </div>
          <div className="mt-4 pt-1 flex items-center justify-between text-xs">
            <span className="text-outline">Ubicación</span>
            <span className="text-xs font-semibold text-on-surface-variant">Sala de Profesores</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-surface-tint h-full rounded-full" style={{ width: '45%' }} />
          </div>
        </div>

        {/* Card 4: Entregados (Green) */}
        <div className="relative bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-secondary-fixed/40 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                Entregados
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-secondary font-mono">{deliveredCount}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                  64.2%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div className="mt-4 pt-1 flex items-center justify-between text-xs">
            <span className="text-outline">Cierre de período</span>
            <span className="text-xs font-extrabold text-secondary">1° Trimestre</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: '64%' }} />
          </div>
        </div>
      </div>

      {/* Filter Bar & Search Container */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Quick Select Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            {/* Colegio */}
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <select
                className="w-full appearance-none h-10 pl-3 pr-8 bg-surface-container-low text-on-surface text-xs rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <option value="">Todos los colegios</option>
                <option value="san-martin">Col. Nacional San Martín</option>
                <option value="belgrano">Inst. Belgrano</option>
                <option value="normal-1">Esc. Normal N°1</option>
                <option value="comercial-3">Comercial N°3</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            {/* Año */}
            <div className="relative min-w-[130px] flex-1 sm:flex-initial">
              <select
                className="w-full appearance-none h-10 pl-3 pr-8 bg-surface-container-low text-on-surface text-xs rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Todos los años</option>
                <option value="2">2° Año</option>
                <option value="3">3° Año</option>
                <option value="4">4° Año</option>
                <option value="5">5° Año</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            {/* Estado */}
            <div className="relative min-w-[160px] flex-1 sm:flex-initial">
              <select
                className="w-full appearance-none h-10 pl-3 pr-8 bg-surface-container-low text-on-surface text-xs rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente de pago</option>
                <option value="listo">Listo para retirar</option>
                <option value="entregado">Entregado</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            {/* Date Range indicator */}
            <button
              className="inline-flex items-center gap-1.5 h-10 px-3 bg-surface-container-low text-on-surface text-xs rounded-lg border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer"
              type="button"
              title="Período lectivo activo"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
              <span>01 Mar 2025 - 15 Mar 2025</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-surface-container-high text-primary font-bold text-xs rounded-lg hover:bg-primary hover:text-on-primary transition-colors cursor-pointer shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-primary text-on-primary px-5 py-3 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">
                {selectedIds.length} pedidos seleccionados
              </span>
              <span className="text-[11px] text-on-primary-container">
                Podés procesar el retiro colectivo de estas cartillas preparadas.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkDeliver(selectedIds)}
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-all text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>Marcar seleccionados como entregados</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-on-primary hover:bg-primary-container transition-colors text-xs font-medium cursor-pointer"
              type="button"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/60 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1020px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] tracking-wider uppercase font-bold border-b border-surface-container-high/50">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                    type="checkbox"
                  />
                </th>
                <th className="py-3.5 px-3">Código</th>
                <th className="py-3.5 px-3">Alumno</th>
                <th className="py-3.5 px-3">Colegio</th>
                <th className="py-3.5 px-3">Año</th>
                <th className="py-3.5 px-3">Cartilla Pedida</th>
                <th className="py-3.5 px-3">Método Pago</th>
                <th className="py-3.5 px-3">Estado Pago</th>
                <th className="py-3.5 px-3">Estado Entrega</th>
                <th className="py-3.5 px-3">Fecha</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-xs text-on-surface divide-y divide-surface-container-high/40">
              {isReloading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-[32px] animate-spin">sync</span>
                      <span className="font-semibold text-xs">Actualizando listado de cartillas...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[32px] text-outline">search_off</span>
                      <p className="font-bold text-sm text-primary">No se encontraron pedidos con estos filtros</p>
                      <p className="text-xs text-outline">Probá cambiando el colegio o limpiando el texto de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isChecked = selectedIds.includes(order.id);
                  const isPaid = order.paymentStatus === 'Pagado';
                  const isDelivered = order.deliveryStatus === 'Entregado';
                  const isReady = order.deliveryStatus === 'Listo para retirar';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-surface-container-low/70 transition-colors ${
                        isChecked ? 'bg-primary-fixed/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          checked={isChecked}
                          onChange={() => toggleSelectItem(order.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                          type="checkbox"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            isReady
                              ? 'bg-primary-fixed text-primary'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {order.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">{order.studentName}</span>
                          <span className="text-[11px] text-outline">DNI {order.studentDni}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-on-surface font-medium truncate max-w-[150px] inline-block">
                          {order.school}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-bold">
                          {order.year}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            menu_book
                          </span>
                          <span className="truncate max-w-[200px] font-medium" title={order.cartillaTitle}>
                            {order.cartillaTitle}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-medium whitespace-nowrap">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              order.paymentMethod === 'Mercado Pago' ? 'bg-primary' : 'bg-tertiary-container'
                            }`}
                          />
                          {order.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
                            Pendiente de pago
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Listo para retirar
                          </span>
                        ) : isDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            Entregado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-outline text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                            {order.deliveryStatus}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-outline whitespace-nowrap text-[11px] font-mono">
                        {order.date}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectOrder(order)}
                            className="p-1 rounded text-on-surface-variant hover:bg-surface-container cursor-pointer"
                            title="Ver detalle del pedido"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>

                          {isReady ? (
                            <button
                              onClick={() => onOpenConfirmDelivery(order)}
                              className="px-2.5 py-1 rounded bg-secondary text-on-secondary text-[11px] font-bold hover:bg-secondary/90 transition-colors shadow-xs cursor-pointer active:scale-95"
                              type="button"
                            >
                              Marcar como entregado
                            </button>
                          ) : !isPaid ? (
                            <button
                              onClick={() => onSelectOrder(order)}
                              className="px-2.5 py-1 rounded bg-tertiary-container text-on-tertiary text-[11px] font-bold hover:bg-tertiary transition-colors shadow-xs cursor-pointer active:scale-95"
                              type="button"
                            >
                              Cobrar y entregar
                            </button>
                          ) : (
                            <button
                              onClick={() => onSelectOrder(order)}
                              className="px-2.5 py-1 rounded bg-surface-container text-primary text-[11px] font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                              type="button"
                            >
                              Comprobante
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Overview Bar */}
        <div className="px-6 py-3.5 bg-surface-container-low border-t border-surface-container-high/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-on-surface-variant">
              Mostrando <strong className="text-on-surface font-semibold">1 a {filteredOrders.length}</strong> de{' '}
              <strong className="text-on-surface font-semibold">{totalOrdersCount}</strong> pedidos
            </span>
            <span className="hidden md:inline text-outline">•</span>
            <button
              onClick={handleSimulateReload}
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-outline hover:text-primary transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
              <span>Simular recarga</span>
            </button>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-outline bg-surface-container-lowest opacity-50 cursor-not-allowed"
              disabled
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                currentPage === 1
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              1
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                currentPage === 2
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              2
            </button>
            <button
              onClick={() => setCurrentPage(3)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                currentPage === 3
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              3
            </button>
            <span className="px-1 text-outline">...</span>
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-on-surface bg-surface-container-lowest hover:bg-surface-container"
              type="button"
            >
              25
            </button>
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface bg-surface-container-lowest hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Educational Context Notice (Footer callout) */}
      <div className="p-4 bg-surface-container-low rounded-xl border border-surface-container-high/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-on-surface">Coordinación de Cartillas de Geografía</span>
            <span className="text-on-surface-variant">
              Próxima remesa de imprenta: Viernes 21 de Marzo, 08:30 hs. Disponibles en sala docente.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-outline">Soporte docente directo:</span>
          <a
            href="tel:+5491158209411"
            className="font-bold text-primary font-mono hover:underline"
          >
            +54 9 11 5820-9411
          </a>
        </div>
      </div>
    </div>
  );
};
