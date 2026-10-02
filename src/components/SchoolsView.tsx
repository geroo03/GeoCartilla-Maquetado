import React, { useMemo, useState } from 'react';
import type { School } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { useShell } from '../App.tsx';
import { computeOrderMetrics, isLive } from '../lib/metrics.ts';
import { formatARS, formatDeliveryWindow } from '../lib/format.ts';
import { autoSchoolColor, badgeInk, normalizeHex, schoolColor, schoolInitials } from '../lib/schoolColors.ts';
import { SchoolBrandField } from './ui/SchoolBrandField.tsx';
import { isSafeLogoDataUrl } from '../lib/image.ts';
import { Icon } from './ui/Icon.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { ModalShell } from './ui/ModalShell.tsx';
import { Drawer } from './ui/Drawer.tsx';
import { ConfirmDialog } from './ui/ConfirmDialog.tsx';
import { DeliveryChip, PaymentChip } from './ui/StatusChip.tsx';

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface SchoolForm {
  name: string;
  address: string;
  coordinator: string;
  phone: string;
  weekday: string;
  time: string;
  divisions: string;
  brandColor?: string;
  logoUrl?: string;
}

const EMPTY_FORM: SchoolForm = {
  name: '',
  address: '',
  coordinator: '',
  phone: '+54 9 11 ',
  weekday: '5',
  time: '09:00',
  divisions: '1° Año, 2° Año, 3° Año',
  brandColor: undefined,
  logoUrl: undefined,
};

/** Próxima ocurrencia de un día de semana a una hora dada. */
function nextWindow(weekday: number, time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 9, minutes || 0, 0, 0);
  const delta = (weekday - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + delta);
  return date.getTime();
}

export const SchoolsView: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const { state, dispatch, dispatchUndoable, showToast } = useDemo();
  const { openOrder, openPrintSheet } = useShell();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchoolForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<School | null>(null);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return state.schools;
    return state.schools.filter(
      (school) =>
        school.name.toLowerCase().includes(needle) ||
        school.address.toLowerCase().includes(needle) ||
        school.coordinator.toLowerCase().includes(needle) ||
        school.divisions.some((division) => division.toLowerCase().includes(needle)),
    );
  }, [state.schools, searchQuery]);

  /** Datos reales del colegio, derivados de los pedidos. */
  const statsFor = (code: string) => {
    const orders = state.orders.filter((order) => order.schoolCode === code);
    const metrics = computeOrderMetrics(orders);
    const students = new Set(orders.filter(isLive).map((order) => order.studentDni)).size;
    return { orders, metrics, students };
  };

  const detail = state.schools.find((school) => school.code === detailCode);
  const detailStats = detail ? statsFor(detail.code) : null;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (school: School) => {
    const date = new Date(school.nextDeliveryAt);
    setEditingId(school.id);
    setForm({
      name: school.name,
      address: school.address,
      coordinator: school.coordinator,
      phone: school.phone,
      weekday: String(date.getDay()),
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      divisions: school.divisions.join(', '),
      brandColor: school.brandColor,
      logoUrl: school.logoUrl,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (form.name.trim().length < 4) found.name = 'Escribí el nombre del colegio.';
    if (form.address.trim().length < 6) found.address = 'Indicá la dirección.';
    if (form.coordinator.trim().length < 4) found.coordinator = 'Indicá quién coordina.';
    const divisions = form.divisions
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (divisions.length === 0) found.divisions = 'Cargá al menos una división.';

    const duplicated = state.schools.some(
      (school) =>
        school.id !== editingId && school.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
    );
    if (duplicated) found.name = 'Ya hay un colegio con ese nombre.';

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    const existing = editingId ? state.schools.find((school) => school.id === editingId) : undefined;
    const deliveryAt = nextWindow(Number(form.weekday), form.time);

    const school: School = {
      id: existing?.id ?? form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24),
      code: existing?.code ?? form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24),
      name: form.name.trim(),
      address: form.address.trim(),
      divisions,
      coordinator: form.coordinator.trim(),
      studentsCount: existing?.studentsCount ?? divisions.length * 28,
      nextDelivery: formatDeliveryWindow(deliveryAt),
      nextDeliveryAt: deliveryAt,
      phone: form.phone.trim(),
      // Lo que entra al estado se valida: el color puede venir escrito a mano
      // y el logo tiene que ser una imagen embebida, no una URL remota.
      brandColor: normalizeHex(form.brandColor) ?? undefined,
      logoUrl: isSafeLogoDataUrl(form.logoUrl) ? form.logoUrl : undefined,
    };

    dispatch({ type: 'UPSERT_SCHOOL', school });
    showToast(
      editingId ? `Datos de "${school.name}" actualizados.` : `Colegio "${school.name}" adscripto.`,
    );
    setFormOpen(false);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="school" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Red institucional</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-0.5">
            Colegios adscriptos
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Coordinación, divisiones y ventana de retiro de cada institución.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-container text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
        >
          <Icon name="add" size={18} />
          <span>Adscribir colegio</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/60">
          <EmptyState
            icon="search_off"
            title="Ningún colegio coincide"
            message="Probá con otro nombre, dirección o coordinador."
            action={{ label: 'Adscribir colegio', onClick: openCreate, icon: 'add' }}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((school) => {
            const { metrics, students } = statsFor(school.code);
            // Misma insignia que en la agenda: el color se edita aca, asi que
            // tiene que verse aca.
            const color = schoolColor(state.schools, school.code);

            return (
              <article
                key={school.id}
                className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/60 border-l-4 flex flex-col overflow-hidden"
                style={{ borderLeftColor: color }}
              >
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden text-xs font-extrabold shrink-0"
                      style={{
                        backgroundColor: school.logoUrl ? 'transparent' : color,
                        color: badgeInk(color),
                      }}
                    >
                      {school.logoUrl ? (
                        <img src={school.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        schoolInitials(school.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-bold text-primary leading-snug">{school.name}</h2>
                      <p className="text-[11px] text-outline mt-0.5 flex items-center gap-1">
                        <Icon name="place" size={13} />
                        <span className="truncate">{school.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-lg px-3 py-2 flex items-center gap-2">
                    <Icon name="event" size={16} className="text-primary shrink-0" />
                    <span className="text-[11px] font-semibold text-on-surface truncate">
                      {school.nextDelivery}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Pedidos', value: metrics.total },
                      { label: 'Alumnos', value: students },
                      { label: 'Divisiones', value: school.divisions.length },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-surface-container-low rounded-lg py-1.5">
                        <span className="block text-sm font-extrabold font-mono leading-none text-on-surface">
                          {stat.value}
                        </span>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-outline mt-0.5">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-outline flex items-center gap-1 min-w-0">
                      <Icon name="person" size={13} />
                      <span className="truncate">{school.coordinator}</span>
                    </span>
                    <span className="font-extrabold text-secondary font-mono shrink-0">
                      {formatARS(metrics.revenue)}
                    </span>
                  </div>

                  {metrics.pendingCount > 0 && (
                    <p className="text-[11px] text-on-tertiary-container flex items-center gap-1.5">
                      <Icon name="payments" size={14} />
                      {metrics.pendingCount} por cobrar ({formatARS(metrics.pendingAmount)})
                    </p>
                  )}
                </div>

                <div className="mt-auto px-4 py-3 border-t border-surface-container-high/50 bg-surface-container-low/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailCode(school.code)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
                    type="button"
                  >
                    Ver detalle
                  </button>

                  <div className="flex items-center gap-0.5">
                    <a
                      href={`tel:${school.phone.replace(/\D/g, '')}`}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                      title={`Llamar a ${school.coordinator}`}
                    >
                      <Icon name="call" size={18} />
                    </a>
                    <button
                      onClick={() => openPrintSheet(school.code)}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                      title="Planilla de retiro"
                      type="button"
                    >
                      <Icon name="print" size={18} />
                    </button>
                    <button
                      onClick={() => openEdit(school)}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                      title="Editar el colegio"
                      type="button"
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(school)}
                      className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-error"
                      title="Dar de baja"
                      type="button"
                    >
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Alta / edición */}
      <ModalShell
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar colegio' : 'Adscribir colegio'}
        subtitle="Los datos se usan en la agenda de entregas y en las planillas"
        icon={editingId ? 'edit' : 'add_business'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
            >
              Cancelar
            </button>
            <button
              form="school-form"
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="submit"
            >
              <Icon name={editingId ? 'save' : 'add'} size={16} />
              {editingId ? 'Guardar cambios' : 'Adscribir'}
            </button>
          </div>
        }
      >
        <form id="school-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary">Nombre del colegio</span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Col. Nacional San Martín"
              className={inputClass}
              aria-invalid={!!errors.name}
            />
            {errors.name && <span className="text-[10px] font-semibold text-error">{errors.name}</span>}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary">Dirección</span>
            <input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Av. Corrientes 2040, CABA"
              className={inputClass}
              aria-invalid={!!errors.address}
            />
            {errors.address && <span className="text-[10px] font-semibold text-error">{errors.address}</span>}
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-primary">Coordinador</span>
              <input
                value={form.coordinator}
                onChange={(event) => setForm({ ...form, coordinator: event.target.value })}
                placeholder="Prof. Martín Gómez"
                className={inputClass}
                aria-invalid={!!errors.coordinator}
              />
              {errors.coordinator && (
                <span className="text-[10px] font-semibold text-error">{errors.coordinator}</span>
              )}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-primary">Teléfono</span>
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className={`${inputClass} font-mono`}
              />
            </label>
          </div>

          <fieldset className="grid sm:grid-cols-2 gap-3">
            <legend className="text-xs font-semibold text-primary mb-1">Ventana de retiro</legend>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-outline">Día</span>
              <select
                value={form.weekday}
                onChange={(event) => setForm({ ...form, weekday: event.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                {WEEKDAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-outline">Hora</span>
              <input
                value={form.time}
                onChange={(event) => setForm({ ...form, time: event.target.value })}
                type="time"
                className={`${inputClass} font-mono`}
              />
            </label>
          </fieldset>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary">Divisiones</span>
            <input
              value={form.divisions}
              onChange={(event) => setForm({ ...form, divisions: event.target.value })}
              placeholder="1° Año (1-4), 2° Año (1-4), 3° Año (A, B, C)"
              className={inputClass}
              aria-invalid={!!errors.divisions}
            />
            <span className="text-[10px] text-outline">Separadas por coma.</span>
            {errors.divisions && (
              <span className="text-[10px] font-semibold text-error">{errors.divisions}</span>
            )}
          </label>

          <SchoolBrandField
            value={{ brandColor: form.brandColor, logoUrl: form.logoUrl }}
            onChange={(next) => setForm({ ...form, ...next })}
            autoColor={autoSchoolColor(
              state.schools,
              editingId ? state.schools.find((school) => school.id === editingId)?.code : undefined,
            )}
            initials={schoolInitials(form.name)}
          />
        </form>
      </ModalShell>

      {/* Detalle */}
      <Drawer
        isOpen={!!detail}
        onClose={() => setDetailCode(null)}
        title={detail?.name ?? ''}
        subtitle={detail?.address}
      >
        {detail && detailStats && (
          <div className="p-5 flex flex-col gap-5">
            <section className="bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-2.5">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Coordinación
              </h4>
              {[
                { icon: 'person', label: 'Coordina', value: detail.coordinator },
                {
                  icon: 'call',
                  label: 'Teléfono',
                  value: detail.phone,
                  href: `tel:${detail.phone.replace(/\D/g, '')}`,
                },
                { icon: 'event', label: 'Retiro', value: detail.nextDelivery },
                { icon: 'place', label: 'Dirección', value: detail.address },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-2.5 text-xs">
                  <Icon name={row.icon} size={16} className="text-outline shrink-0 mt-0.5" />
                  <span className="text-outline w-16 shrink-0">{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      className="text-primary font-semibold font-mono hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="text-on-surface font-semibold min-w-0 break-words">{row.value}</span>
                  )}
                </div>
              ))}
            </section>

            <section className="grid grid-cols-2 gap-2">
              {[
                { label: 'Pedidos', value: detailStats.metrics.total, tone: 'text-on-surface' },
                { label: 'Alumnos', value: detailStats.students, tone: 'text-on-surface' },
                {
                  label: 'Recaudado',
                  value: formatARS(detailStats.metrics.revenue),
                  tone: 'text-secondary',
                },
                {
                  label: 'Por cobrar',
                  value: formatARS(detailStats.metrics.pendingAmount),
                  tone: 'text-on-tertiary-container',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface-container-low rounded-xl px-3 py-2.5 flex flex-col"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    {stat.label}
                  </span>
                  <span className={`text-base font-extrabold font-mono ${stat.tone}`}>{stat.value}</span>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-2">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Divisiones ({detail.divisions.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {detail.divisions.map((division) => (
                  <span
                    key={division}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-surface-container text-on-surface-variant"
                  >
                    {division}
                  </span>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Cartillas del colegio
                </h4>
              </div>
              <ul className="flex flex-col gap-1.5">
                {state.cartillas
                  .filter((cartilla) => cartilla.schoolCode === detail.code)
                  .map((cartilla) => (
                    <li
                      key={cartilla.id}
                      className="flex items-center justify-between gap-2 text-xs bg-surface-container-low rounded-lg px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-on-surface">{cartilla.title}</span>
                      <span className="shrink-0 font-mono text-outline">{cartilla.stock} en stock</span>
                    </li>
                  ))}
                {state.cartillas.filter((cartilla) => cartilla.schoolCode === detail.code).length === 0 && (
                  <li className="text-[11px] text-outline">Todavía no hay cartillas para este colegio.</li>
                )}
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Últimos pedidos
              </h4>
              {detailStats.orders.length === 0 ? (
                <p className="text-[11px] text-outline">Sin pedidos registrados.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-surface-container-low">
                  {detailStats.orders.slice(0, 10).map((order) => (
                    <li key={order.id}>
                      <button
                        onClick={() => {
                          setDetailCode(null);
                          openOrder(order);
                        }}
                        className="w-full text-left py-2.5 flex items-center gap-2 hover:bg-surface-container-low rounded transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                        type="button"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-on-surface truncate">
                            {order.studentName}
                          </span>
                          <span className="block text-[11px] text-outline font-mono truncate">
                            {order.code} · {order.division}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <DeliveryChip status={order.deliveryStatus} />
                          {order.paymentStatus !== 'Pagado' && <PaymentChip status={order.paymentStatus} />}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Dar de baja el colegio"
        message={
          confirmDelete ? (
            <>
              Vas a dar de baja <strong>{confirmDelete.name}</strong>. Los{' '}
              {statsFor(confirmDelete.code).metrics.total} pedidos y sus cartillas se conservan, pero el
              colegio sale de la agenda de entregas y de los filtros.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Dar de baja"
        onConfirm={() => {
          if (!confirmDelete) return;
          dispatchUndoable(
            { type: 'DELETE_SCHOOL', id: confirmDelete.id },
            `"${confirmDelete.name}" se dio de baja.`,
            'info',
          );
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
};
