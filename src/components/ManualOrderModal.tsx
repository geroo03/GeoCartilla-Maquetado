import React, { useMemo, useState } from 'react';
import type { Cartilla, DeliveryStatus, Order, PaymentMethod, PaymentStatus } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { PICKUP_LOCATION } from '../data/mockData.ts';
import { formatARS, formatDateTimeShort } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { ModalShell } from './ui/ModalShell.tsx';
import { BookletCover } from './ui/CoverArt.tsx';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary';

/** Carga de un pedido tomado en mano, en la sala de profesores. */
export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch, showToast } = useDemo();

  // Sólo se puede cargar un pedido de una cartilla activa y con stock.
  const available = useMemo(
    () => state.cartillas.filter((c) => c.isActive && c.stock > 0),
    [state.cartillas],
  );

  const [studentName, setStudentName] = useState('');
  const [studentDni, setStudentDni] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('+54 9 11 ');
  const [cartillaId, setCartillaId] = useState('');
  const [division, setDivision] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo retiro');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pendiente de pago');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected: Cartilla | undefined =
    available.find((c) => c.id === cartillaId) ?? available[0];
  const school = state.schools.find((s) => s.code === selected?.schoolCode);

  const reset = () => {
    setStudentName('');
    setStudentDni('');
    setStudentEmail('');
    setStudentPhone('+54 9 11 ');
    setCartillaId('');
    setDivision('');
    setPaymentMethod('Efectivo retiro');
    setPaymentStatus('Pendiente de pago');
    setErrors({});
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;

    const found: Record<string, string> = {};
    if (studentName.trim().length < 3) found.name = 'Escribí el nombre y el apellido.';
    const dniDigits = studentDni.replace(/\D/g, '');
    if (dniDigits.length < 7 || dniDigits.length > 8) found.dni = 'El DNI tiene que tener 7 u 8 dígitos.';
    if (state.orders.some((o) => o.studentDni.replace(/\D/g, '') === dniDigits && o.cartillaId === selected.id && o.deliveryStatus !== 'Cancelado')) {
      found.dni = 'Ese DNI ya tiene un pedido de esta misma cartilla.';
    }
    if (studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      found.email = 'Revisá el correo.';
    }

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    const now = Date.now();
    const code = `GEO-${4900 + state.orders.length + 1}`;
    const deliveryStatus: DeliveryStatus =
      paymentStatus === 'Pagado' ? 'Listo para retirar' : 'Preparado';

    const order: Order = {
      id: `${code.toLowerCase()}-${now.toString(36)}`,
      code,
      studentName: studentName.trim(),
      studentDni: dniDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      studentEmail: studentEmail.trim() || `${dniDigits}@sin-correo.local`,
      studentPhone: studentPhone.trim(),
      school: selected.school,
      schoolCode: selected.schoolCode,
      year: selected.year,
      division: division || school?.divisions[0] || selected.divisions,
      cartillaId: selected.id,
      cartillaTitle: selected.title,
      cartillaCover: selected.coverUrl,
      cartillaPages: selected.pages,
      paymentMethod,
      paymentStatus,
      deliveryStatus,
      date: formatDateTimeShort(now),
      timestamp: now,
      price: selected.price,
      pickupLocation: PICKUP_LOCATION,
      history: [
        {
          at: now,
          actor: 'docente',
          label: 'Pedido cargado a mano',
          detail: `Tomado en ${PICKUP_LOCATION} por el docente (${paymentMethod}).`,
        },
        ...(paymentStatus === 'Pagado'
          ? [
              {
                at: now + 1,
                actor: 'docente' as const,
                label: 'Pago acreditado',
                detail: `Cobro de ${formatARS(selected.price)} registrado al cargar el pedido.`,
              },
            ]
          : []),
      ],
    };

    dispatch({ type: 'ADD_ORDER', order, actor: 'docente' });
    showToast(`Pedido ${code} cargado para ${order.studentName}.`);
    reset();
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Cargar pedido manual"
      subtitle="Para los pedidos que llegan en mano, en la sala de profesores"
      icon="edit_note"
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-outline">
            {selected ? (
              <>
                Importe: <strong className="text-on-surface font-mono">{formatARS(selected.price)}</strong>
              </>
            ) : (
              'No hay cartillas con stock disponible.'
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
            >
              Cancelar
            </button>
            <button
              form="manual-order-form"
              disabled={!selected}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="submit"
            >
              <Icon name="add" size={16} />
              Registrar pedido
            </button>
          </div>
        </div>
      }
    >
      <form id="manual-order-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
        {available.length === 0 ? (
          <p className="text-xs text-on-error-container bg-error-container rounded-lg px-3 py-2.5 flex items-center gap-2">
            <Icon name="warning" size={18} />
            Todas las cartillas están sin stock o desactivadas. Reponé stock antes de cargar un pedido.
          </p>
        ) : (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Alumno
              </legend>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary">Nombre y apellido</span>
                  <input
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Camila Díaz"
                    className={inputClass}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <span className="text-[10px] font-semibold text-error">{errors.name}</span>}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary">DNI</span>
                  <input
                    value={studentDni}
                    onChange={(event) => setStudentDni(event.target.value)}
                    placeholder="47.901.344"
                    inputMode="numeric"
                    className={`${inputClass} font-mono`}
                    aria-invalid={!!errors.dni}
                  />
                  {errors.dni && <span className="text-[10px] font-semibold text-error">{errors.dni}</span>}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary">
                    Email <span className="text-outline font-normal">(opcional)</span>
                  </span>
                  <input
                    value={studentEmail}
                    onChange={(event) => setStudentEmail(event.target.value)}
                    placeholder="camila.diaz@gmail.com"
                    type="email"
                    className={inputClass}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <span className="text-[10px] font-semibold text-error">{errors.email}</span>
                  )}
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary">
                    Teléfono <span className="text-outline font-normal">(opcional)</span>
                  </span>
                  <input
                    value={studentPhone}
                    onChange={(event) => setStudentPhone(event.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Cartilla
              </legend>

              <div className="flex gap-3">
                {selected && (
                  <BookletCover
                    coverUrl={selected.coverUrl}
                    motif={selected.coverMotif}
                    seed={selected.id}
                    label={selected.year.replace(' Año', '')}
                    className="w-14 h-20 rounded-lg shrink-0 shadow-md"
                  />
                )}

                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-primary">Cartilla solicitada</span>
                    <select
                      value={selected?.id ?? ''}
                      onChange={(event) => setCartillaId(event.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      {available.map((cartilla) => (
                        <option key={cartilla.id} value={cartilla.id}>
                          {cartilla.code} · {cartilla.title} ({cartilla.stock} en stock)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-primary">División</span>
                    <select
                      value={division}
                      onChange={(event) => setDivision(event.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">{school?.divisions[0] ?? selected?.divisions}</option>
                      {school?.divisions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {selected && (
                <p className="text-[11px] text-outline flex items-center gap-1.5">
                  <Icon name="school" size={14} />
                  {selected.school}
                </p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Cobro
              </legend>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary">Método</span>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="Efectivo retiro">Efectivo retiro</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary">Estado</span>
                  <select
                    value={paymentStatus}
                    onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="Pendiente de pago">Pendiente de pago</option>
                    <option value="Pagado">Ya cobrado</option>
                  </select>
                </label>
              </div>

              <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                {paymentStatus === 'Pagado'
                  ? 'El pedido queda listo para retirar y se descuenta un ejemplar del stock.'
                  : 'El pedido queda preparado, con el cobro pendiente para el momento del retiro.'}
              </p>
            </fieldset>
          </>
        )}
      </form>
    </ModalShell>
  );
};
