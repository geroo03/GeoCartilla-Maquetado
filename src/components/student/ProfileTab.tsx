import React, { useEffect, useState } from 'react';
import type { Student } from '../../types/index.ts';
import { useDemo } from '../../store/demoStore.tsx';
import { computeOrderMetrics, notificationsFor, ordersForStudent } from '../../lib/metrics.ts';
import { formatARS, formatRelative, initials } from '../../lib/format.ts';
import { Icon } from '../ui/Icon.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary';

interface ProfileTabProps {
  student: Student;
  onSave: (student: Student) => void;
  onLogout: () => void;
}

/** Perfil del alumno: ahora guarda de verdad, y muestra sus notificaciones. */
export const ProfileTab: React.FC<ProfileTabProps> = ({ student, onSave, onLogout }) => {
  const { state, dispatch, showToast } = useDemo();
  const [draft, setDraft] = useState(student);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => setDraft(student), [student]);

  const school = state.schools.find((s) => s.code === draft.schoolCode);
  const myOrders = ordersForStudent(state.orders, student.dni);
  const metrics = computeOrderMetrics(myOrders);
  const myNotifications = notificationsFor(state.notifications, 'alumno', student.dni).slice(0, 6);

  const changed = JSON.stringify(draft) !== JSON.stringify(student);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-base font-extrabold shrink-0">
          {initials(student.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-extrabold text-primary leading-tight">{student.name}</h1>
          <p className="text-[11px] text-outline font-mono">DNI {student.dni}</p>
          <p className="text-[11px] text-on-surface-variant truncate">{student.division}</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pedidos', value: metrics.total },
          { label: 'Entregados', value: metrics.deliveredCount },
          { label: 'Invertido', value: formatARS(metrics.revenue) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-xl px-2 py-2.5 border border-surface-container-high/60 text-center"
          >
            <span className="block text-sm font-extrabold font-mono leading-none text-primary">
              {stat.value}
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-outline mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {myNotifications.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden">
          <h2 className="px-4 py-3 text-xs font-bold text-primary uppercase tracking-wider border-b border-surface-container-low">
            Novedades
          </h2>
          <ul className="divide-y divide-surface-container-low max-h-56 overflow-y-auto">
            {myNotifications.map((notification) => (
              <li key={notification.id}>
                <button
                  onClick={() => dispatch({ type: 'READ_NOTIFICATION', id: notification.id })}
                  className={`w-full text-left px-4 py-2.5 flex gap-2.5 transition-colors hover:bg-surface-container-low cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
                    notification.read ? '' : 'bg-primary-fixed/15'
                  }`}
                  type="button"
                >
                  <Icon
                    name={notification.kind === 'pago' ? 'payments' : 'inventory_2'}
                    size={16}
                    className="text-primary shrink-0 mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-on-surface truncate">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant leading-snug">
                      {notification.body}
                    </span>
                    <span className="block text-[10px] text-outline font-mono">
                      {formatRelative(notification.at)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Mis datos</h2>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-on-surface-variant">Nombre y apellido</span>
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-on-surface-variant">Email</span>
          <input
            value={draft.email}
            onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            type="email"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-on-surface-variant">Teléfono</span>
          <input
            value={draft.phone}
            onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
            className={`${inputClass} font-mono`}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-on-surface-variant">Colegio</span>
          <select
            value={draft.schoolCode}
            onChange={(event) => {
              const next = state.schools.find((s) => s.code === event.target.value);
              if (!next) return;
              setDraft({
                ...draft,
                school: next.name,
                schoolCode: next.code,
                division: next.divisions[0],
              });
            }}
            className={`${inputClass} cursor-pointer`}
          >
            {state.schools.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-on-surface-variant">Año y división</span>
          <select
            value={draft.division}
            onChange={(event) => setDraft({ ...draft, division: event.target.value })}
            className={`${inputClass} cursor-pointer`}
          >
            {school?.divisions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {changed && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSave(draft);
                showToast('Datos actualizados.', 'info');
              }}
              className="flex-1 h-10 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="button"
            >
              <Icon name="save" size={16} />
              Guardar cambios
            </button>
            <button
              onClick={() => setDraft(student)}
              className="h-10 px-3 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
            >
              Descartar
            </button>
          </div>
        )}
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-2.5">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Retiro</h2>
        <div className="flex items-start gap-2.5 text-xs">
          <Icon name="place" size={16} className="text-outline shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="block font-semibold text-on-surface">{school?.name}</span>
            <span className="block text-[11px] text-outline">{school?.address}</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs">
          <Icon name="event" size={16} className="text-outline shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="block font-semibold text-on-surface">Próxima ventana</span>
            <span className="block text-[11px] text-outline">{school?.nextDelivery}</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs">
          <Icon name="person" size={16} className="text-outline shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="block font-semibold text-on-surface">{school?.coordinator}</span>
            <a
              href={`tel:${(school?.phone ?? '').replace(/\D/g, '')}`}
              className="block text-[11px] text-primary font-mono hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded"
            >
              {school?.phone}
            </a>
          </div>
        </div>
      </section>

      <button
        onClick={() => setConfirmLogout(true)}
        className="h-10 rounded-xl text-error text-xs font-bold hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
        type="button"
      >
        <Icon name="logout" size={18} />
        Cerrar sesión
      </button>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Cerrar sesión"
        message="Vas a volver a la pantalla de acceso. Tus pedidos se conservan y los recuperás ingresando con el mismo correo."
        confirmLabel="Cerrar sesión"
        tone="primary"
        onConfirm={onLogout}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  );
};
