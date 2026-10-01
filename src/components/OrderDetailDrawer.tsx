import React from 'react';
import { Order } from '../types/index.ts';

interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkPaid: (orderId: string) => void;
  onDeliver: (orderId: string) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onMarkPaid,
  onDeliver,
}) => {
  if (!isOpen || !order) return null;

  const isPaid = order.paymentStatus === 'Pagado';
  const isDelivered = order.deliveryStatus === 'Entregado';

  return (
    <>
      {/* Semi-Transparent Interactive Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-on-background/30 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Active Side-Over Drawer */}
      <aside
        aria-labelledby="drawer-title"
        aria-modal="true"
        className="fixed top-0 right-0 z-50 h-screen w-full max-w-[490px] bg-surface-container-lowest shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 border-l border-surface-container-high"
        role="dialog"
      >
        {/* Drawer Fixed Header */}
        <header className="px-6 pt-6 pb-4 bg-surface-container-lowest flex flex-col gap-2 shadow-xs relative border-b border-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-outline">
              <span className="material-symbols-outlined text-[20px] text-secondary">inventory_2</span>
              <span className="text-[11px] font-bold tracking-wider uppercase">Ficha de Entrega</span>
            </div>
            <button
              aria-label="Cerrar panel"
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-extrabold text-primary tracking-tight" id="drawer-title">
              Detalle de Pedido <span className="text-primary-container font-mono">{order.code}</span>
            </h2>
            <span className="text-xs text-on-surface-variant">
              Registrado el {order.date} • Ciclo Lectivo 2025
            </span>
          </div>

          {/* Quick Status Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px] text-primary">
                {order.paymentMethod === 'Mercado Pago' ? 'account_balance_wallet' : 'payments'}
              </span>
              {order.paymentMethod}
            </span>

            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Pagado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
                Pendiente de pago
              </span>
            )}

            {isDelivered && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
                <span className="material-symbols-outlined text-[14px] text-secondary">check</span>
                Entregado
              </span>
            )}
          </div>
        </header>

        {/* Scrollable Drawer Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 bg-surface">
          {/* Student Information Card */}
          <section className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
                <span>Datos del Alumno</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                DNI {order.studentDni}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {order.studentName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base text-on-surface font-bold truncate">
                  {order.studentName}
                </h3>
                <span className="text-xs text-outline">{order.division}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 pt-1 text-xs text-on-surface">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-low/60">
                <span className="material-symbols-outlined text-outline text-[18px]">mail</span>
                <span className="truncate text-on-surface-variant font-medium">
                  {order.studentEmail}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/60">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">chat</span>
                  <span className="text-on-surface font-medium">{order.studentPhone}</span>
                </div>
                <a
                  className="text-[11px] text-secondary bg-secondary-container px-2 py-1 rounded font-bold hover:opacity-85 transition-opacity"
                  href={`https://wa.me/${order.studentPhone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(order.studentName)}!%20Te%20escribimos%20de%20GeoCartillas.`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-container-low/60">
                <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">school</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">{order.school}</span>
                  <span className="text-on-surface-variant text-[11px]">{order.pickupLocation}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Cartilla Ordered Card */}
          <section className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-primary">auto_stories</span>
                <span>Material Bibliográfico</span>
              </div>
              <span className="text-xs text-secondary font-bold bg-secondary-container px-2 py-0.5 rounded-full">
                1 ejemplar
              </span>
            </div>

            <div className="flex gap-4 items-center pt-1">
              <div className="w-16 h-22 rounded-lg overflow-hidden bg-surface-container shrink-0 shadow-sm relative group border border-outline-variant/30">
                {order.cartillaCover ? (
                  <img
                    alt={order.cartillaTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    src={order.cartillaCover}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-primary-container text-white flex flex-col items-center justify-center p-1 text-center">
                    <span className="material-symbols-outlined text-[20px]">public</span>
                    <span className="text-[9px] font-bold mt-1">2° Año</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center gap-1 min-w-0">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                  Edición Oficial 2025
                </span>
                <h4 className="text-sm text-primary font-bold leading-tight">
                  {order.cartillaTitle}
                </h4>
                <p className="text-xs text-on-surface-variant line-clamp-2">
                  {order.cartillaPages} páginas, anillada doble wire-o con atlas a todo color e imágenes satelitales.
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xs text-outline">Importe:</span>
                  <span className="text-lg font-extrabold text-primary font-mono">
                    $ {order.price.toLocaleString('es-AR')}{' '}
                    <span className="text-xs text-on-surface-variant font-normal">ARS</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Status Timeline */}
          <section className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high/60 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px] text-outline">timeline</span>
              <span>Línea de Tiempo del Pedido</span>
            </div>

            <div className="relative pl-6 flex flex-col gap-4 pt-1">
              <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-surface-container-highest" />

              {/* Step 1: Pedido Realizado */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center ring-4 ring-surface-container-lowest">
                  <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                </div>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-on-surface">Pedido registrado en plataforma</span>
                  <span className="text-on-surface-variant">{order.date} • Vía Web Escolar</span>
                </div>
              </div>

              {/* Step 2: Pago */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface-container-lowest ${
                    isPaid ? 'bg-secondary text-white' : 'bg-on-tertiary-container text-white animate-pulse'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">
                    {isPaid ? 'check' : 'schedule'}
                  </span>
                </div>
                <div className="flex flex-col text-xs">
                  <span
                    className={`font-bold ${
                      isPaid ? 'text-secondary' : 'text-on-tertiary-container'
                    }`}
                  >
                    {isPaid ? 'Pago acreditado y conciliado' : 'Pago pendiente de cobro'}
                  </span>
                  <span className="text-on-surface-variant">
                    {isPaid
                      ? `${order.paymentMethod} • Conciliado con éxito`
                      : 'Efectivo en mano al retirar en mostrador'}
                  </span>
                </div>
              </div>

              {/* Step 3: Entrega */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface-container-lowest ${
                    isDelivered ? 'bg-secondary text-white' : 'bg-surface-container-high text-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {isDelivered ? 'check' : 'package_2'}
                  </span>
                </div>
                <div className="flex flex-col text-xs">
                  <span className={`font-bold ${isDelivered ? 'text-secondary' : 'text-outline'}`}>
                    {isDelivered ? 'Material entregado al alumno' : 'Entrega de material'}
                  </span>
                  <span className="text-outline">
                    {isDelivered
                      ? 'Retirado en Sala de Profesores con verificación de DNI'
                      : 'En espera de validación de código de retiro'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Action Panel: Payment Box (if not paid) */}
          {!isPaid && (
            <section className="bg-tertiary-fixed rounded-xl p-4 shadow-xs flex flex-col gap-3 border border-tertiary-container/20">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-on-tertiary-fixed text-[20px] mt-0.5">
                  payments
                </span>
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold text-on-tertiary-fixed uppercase tracking-wider">
                    Cobro en Mostrador
                  </h4>
                  <p className="text-xs text-on-tertiary-fixed-variant leading-relaxed mt-0.5">
                    El alumno eligió abonar{' '}
                    <strong className="text-on-tertiary-fixed">
                      $ {order.price.toLocaleString('es-AR')} ARS
                    </strong>{' '}
                    en efectivo al momento de retirar en el colegio.
                  </p>
                </div>
              </div>
              <button
                className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                onClick={() => onMarkPaid(order.id)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">price_check</span>
                <span>Marcar como pagado (${order.price.toLocaleString('es-AR')} ARS recibido)</span>
              </button>
            </section>
          )}

          {/* Action Panel: Delivery Box */}
          <section className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high/60 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
              <span>Validación y Despacho</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-on-surface-variant font-semibold" htmlFor="pickup-code-input">
                Código de retiro verificado
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary-container text-[18px]">
                  qr_code_scanner
                </span>
                <input
                  className="w-full pl-9 pr-24 py-2 bg-surface-container-low font-mono font-bold text-base text-primary tracking-wider rounded-lg border border-outline-variant/30 focus:outline-none"
                  id="pickup-code-input"
                  readOnly
                  type="text"
                  value={order.code}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary flex items-center gap-1 text-[11px] font-bold bg-secondary-container px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[13px]">verified</span> Válido
                </span>
              </div>
            </div>

            {!isDelivered ? (
              <button
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                onClick={() => onDeliver(order.id)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">front_hand</span>
                <span>Entregar cartilla al alumno</span>
              </button>
            ) : (
              <div className="p-3 bg-secondary-container/50 border border-secondary/30 rounded-lg text-xs text-secondary flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                <span>Este pedido ya fue entregado y registrado con éxito.</span>
              </div>
            )}
          </section>
        </div>

        {/* Fixed Drawer Bottom Action Bar */}
        <footer className="p-4 bg-surface-container-lowest shadow-[0_-2px_10px_rgba(0,0,0,0.04)] border-t border-surface-container-low flex flex-col sm:flex-row gap-2">
          <button
            className="flex-1 py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            onClick={() => window.print()}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">print</span>
            <span>Imprimir remito</span>
          </button>
          <a
            className="flex-1 py-2 px-3 rounded-lg bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-bold text-xs flex items-center justify-center gap-2 transition-colors text-center"
            href={`https://api.whatsapp.com/send?phone=${order.studentPhone.replace(/[^0-9]/g, '')}&text=Hola%20${encodeURIComponent(order.studentName)}!%20Te%20recordamos%20que%20tu%20cartilla%20de%20${encodeURIComponent(order.cartillaTitle)}%20te%20espera%20en%20el%20colegio%20para%20retirar.`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>Recordatorio WhatsApp</span>
          </a>
        </footer>
      </aside>
    </>
  );
};
