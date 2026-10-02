import React, { useState } from 'react';
import type { Cartilla, Order, PaymentMethod, Student } from '../../types/index.ts';
import { useDemo } from '../../store/demoStore.tsx';
import { PICKUP_LOCATION } from '../../data/mockData.ts';
import { formatARS, formatDateTimeShort } from '../../lib/format.ts';
import { Icon } from '../ui/Icon.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { BookletCover } from '../ui/CoverArt.tsx';

interface CheckoutTabProps {
  student: Student;
  cartilla: Cartilla | null;
  onBackToCatalog: () => void;
  onConfirmed: (order: Order) => void;
}

const METHODS: { value: PaymentMethod; title: string; detail: string; icon: string }[] = [
  {
    value: 'Mercado Pago',
    title: 'Mercado Pago',
    detail: 'Pagás ahora y retirás sin hacer fila en la mesa.',
    icon: 'credit_card',
  },
  {
    value: 'Efectivo retiro',
    title: 'Efectivo al retirar',
    detail: 'Pagás en la Mesa de Geografía cuando retirás el ejemplar.',
    icon: 'payments',
  },
];

export const CheckoutTab: React.FC<CheckoutTabProps> = ({
  student,
  cartilla,
  onBackToCatalog,
  onConfirmed,
}) => {
  const { state, dispatch } = useDemo();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mercado Pago');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!cartilla) {
    return (
      <div className="rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container-high/60">
        <EmptyState
          icon="shopping_bag"
          title="Todavía no elegiste una cartilla"
          message="Entrá al catálogo y elegí el material de tu curso para armar el pedido."
          action={{ label: 'Ver catálogo', onClick: onBackToCatalog, icon: 'menu_book' }}
        />
      </div>
    );
  }

  // El stock se puede haber agotado mientras el alumno miraba el checkout.
  const live = state.cartillas.find((c) => c.id === cartilla.id) ?? cartilla;
  const soldOut = live.stock === 0 || !live.isActive;

  const handleConfirm = () => {
    if (soldOut) return;
    setIsProcessing(true);

    setTimeout(() => {
      const now = Date.now();
      const code = `GEO-${4900 + state.orders.length + 1}`;
      const paid = paymentMethod === 'Mercado Pago';

      const order: Order = {
        id: `${code.toLowerCase()}-${now.toString(36)}`,
        code,
        studentName: student.name,
        studentDni: student.dni,
        studentEmail: student.email,
        studentPhone: student.phone,
        school: live.school,
        schoolCode: live.schoolCode,
        year: live.year,
        division: student.division,
        cartillaId: live.id,
        cartillaTitle: live.title,
        cartillaCover: live.coverUrl,
        cartillaPages: live.pages,
        paymentMethod,
        paymentStatus: paid ? 'Pagado' : 'Pendiente de pago',
        deliveryStatus: paid ? 'Listo para retirar' : 'Preparado',
        date: formatDateTimeShort(now),
        timestamp: now,
        price: live.price,
        pickupLocation: PICKUP_LOCATION,
        history: [
          {
            at: now,
            actor: 'alumno',
            label: 'Pedido registrado',
            detail: `Solicitud generada desde el portal del alumno (${paymentMethod}).`,
          },
          ...(paid
            ? [
                {
                  at: now + 1,
                  actor: 'sistema' as const,
                  label: 'Pago acreditado',
                  detail: `Mercado Pago confirmó la acreditación de ${formatARS(live.price)}.`,
                },
                {
                  at: now + 2,
                  actor: 'sistema' as const,
                  label: 'Listo para retirar',
                  detail: `Disponible en ${PICKUP_LOCATION}.`,
                },
              ]
            : []),
        ],
      };

      dispatch({ type: 'ADD_ORDER', order, actor: 'alumno' });
      setIsProcessing(false);
      onConfirmed(order);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <button
        onClick={onBackToCatalog}
        className="self-start inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
        type="button"
      >
        <Icon name="arrow_back" size={16} />
        Volver al catálogo
      </button>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex gap-3.5">
        <BookletCover
          coverUrl={live.coverUrl}
          motif={live.coverMotif}
          seed={live.id}
          label={live.year.replace(' Año', '')}
          className="w-20 h-28 rounded-lg shrink-0 shadow-md"
        />
        <div className="min-w-0 flex-1 flex flex-col">
          <h2 className="text-sm font-bold text-on-surface leading-snug">{live.title}</h2>
          <p className="text-[11px] text-outline mt-1">
            {live.pages} páginas · {live.edition}
          </p>
          <span className="text-2xl font-extrabold text-primary font-mono mt-auto leading-none">
            {formatARS(live.price)}
          </span>
        </div>
      </section>

      {soldOut && (
        <p className="text-[11px] font-semibold text-on-error-container bg-error-container rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Icon name="warning" size={18} />
          Se agotó el stock de esta cartilla mientras armabas el pedido. Probá más tarde o consultá con tu
          profesor.
        </p>
      )}

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Tus datos</h3>
        {[
          { icon: 'person', label: 'Alumno', value: student.name },
          { icon: 'badge', label: 'DNI', value: student.dni, mono: true },
          { icon: 'school', label: 'Curso', value: student.division },
          { icon: 'account_balance', label: 'Colegio', value: student.school },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2.5 text-xs">
            <Icon name={row.icon} size={16} className="text-outline shrink-0" />
            <span className="text-outline w-14 shrink-0">{row.label}</span>
            <span className={`text-on-surface font-semibold min-w-0 truncate ${row.mono ? 'font-mono' : ''}`}>
              {row.value}
            </span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">¿Cómo querés pagar?</h3>
        {METHODS.map((method) => (
          <label
            key={method.value}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === method.value
                ? 'border-primary bg-primary-fixed/30 shadow-xs'
                : 'border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low'
            }`}
          >
            <input
              checked={paymentMethod === method.value}
              onChange={() => setPaymentMethod(method.value)}
              className="sr-only"
              type="radio"
              name="payment-method"
            />
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                paymentMethod === method.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              <Icon name={method.icon} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-on-surface">{method.title}</span>
              <span className="block text-[11px] text-on-surface-variant leading-snug mt-0.5">
                {method.detail}
              </span>
            </span>
            <span
              className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${
                paymentMethod === method.value
                  ? 'border-primary bg-primary ring-2 ring-inset ring-surface-container-lowest'
                  : 'border-outline-variant'
              }`}
            />
          </label>
        ))}
      </section>

      <section className="bg-surface-container rounded-xl p-3.5 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Cartilla</span>
          <span className="font-semibold text-on-surface font-mono">{formatARS(live.price)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Retiro en el colegio</span>
          <span className="font-semibold text-secondary">Sin costo</span>
        </div>
        <div className="h-px bg-outline-variant/40 my-1" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary">Total</span>
          <span className="text-lg font-extrabold text-primary font-mono leading-none">
            {formatARS(live.price)}
          </span>
        </div>
      </section>

      <p className="text-[10px] text-outline leading-relaxed flex items-start gap-1.5">
        <Icon name="place" size={14} className="shrink-0 mt-px" />
        Retirás en {PICKUP_LOCATION}, presentando tu DNI o el comprobante digital.
      </p>

      <button
        onClick={handleConfirm}
        disabled={isProcessing || soldOut}
        className="h-12 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
      >
        {isProcessing ? (
          <>
            <Icon name="progress_activity" size={20} className="animate-spin" />
            Procesando el pago...
          </>
        ) : (
          <>
            <Icon name="lock" size={18} />
            {paymentMethod === 'Mercado Pago'
              ? `Pagar ${formatARS(live.price)}`
              : 'Reservar y pagar al retirar'}
          </>
        )}
      </button>
    </div>
  );
};
