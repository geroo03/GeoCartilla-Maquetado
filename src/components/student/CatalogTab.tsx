import React, { useMemo, useState } from 'react';
import type { Cartilla, Student } from '../../types/index.ts';
import { useDemo } from '../../store/demoStore.tsx';
import { ordersForStudent } from '../../lib/metrics.ts';
import { CURRENT_TERM, formatARS } from '../../lib/format.ts';
import { Icon } from '../ui/Icon.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { BookletCover } from '../ui/CoverArt.tsx';

interface CatalogTabProps {
  student: Student;
  onChooseCartilla: (cartilla: Cartilla) => void;
  onUpdateStudent: (student: Student) => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  student,
  onChooseCartilla,
  onUpdateStudent,
}) => {
  const { state } = useDemo();
  const [editingFilters, setEditingFilters] = useState(false);

  const school = state.schools.find((s) => s.code === student.schoolCode);
  const myOrders = useMemo(
    () => ordersForStudent(state.orders, student.dni),
    [state.orders, student.dni],
  );

  /**
   * El alumno ve las cartillas visibles de su colegio. Las que ya pidió
   * aparecen marcadas para que no las pida dos veces.
   */
  const available = useMemo(
    () =>
      state.cartillas
        .filter((cartilla) => cartilla.isActive && cartilla.schoolCode === student.schoolCode)
        .sort((a, b) => a.year.localeCompare(b.year)),
    [state.cartillas, student.schoolCode],
  );

  /** Coincide con el año del alumno según su división ("3° Año (Div. A)"). */
  const matchesMyYear = (cartilla: Cartilla) =>
    student.division.startsWith(cartilla.year.charAt(0));

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-secondary">
            ¡Hola, {student.name.split(' ')[0]}!
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold shrink-0">
            Ciclo {CURRENT_TERM}
          </span>
        </div>
        <h1 className="text-xl font-extrabold text-primary tracking-tight">
          Elegí tu cartilla escolar
        </h1>
        <p className="text-xs text-on-surface-variant">
          Tu material bibliográfico y mapas para el ciclo lectivo {CURRENT_TERM}.
        </p>
      </div>

      {/* Filtros: en el maquetado eran divs decorativos, ahora son selects reales */}
      <div className="p-3 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2 shadow-xs">
        {editingFilters ? (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Colegio
              </span>
              <select
                value={student.schoolCode}
                onChange={(event) => {
                  const next = state.schools.find((s) => s.code === event.target.value);
                  if (!next) return;
                  onUpdateStudent({
                    ...student,
                    school: next.name,
                    schoolCode: next.code,
                    division: next.divisions[0],
                  });
                }}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-bold text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {state.schools.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Año y división
              </span>
              <select
                value={student.division}
                onChange={(event) => onUpdateStudent({ ...student, division: event.target.value })}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-bold text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {school?.divisions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => setEditingFilters(false)}
              className="h-9 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="button"
            >
              Listo
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingFilters(true)}
            className="flex flex-col gap-2 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
            type="button"
          >
            <span className="h-10 px-3 bg-surface-container-lowest rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/30">
              <span className="flex items-center gap-2 min-w-0">
                <Icon name="account_balance" size={18} className="text-primary shrink-0" />
                <span className="flex flex-col min-w-0">
                  <span className="text-[9px] text-on-surface-variant leading-none">Colegio</span>
                  <span className="text-xs font-bold text-on-surface truncate">{student.school}</span>
                </span>
              </span>
              <Icon name="unfold_more" size={16} className="text-outline shrink-0" />
            </span>

            <span className="h-10 px-3 bg-surface-container-lowest rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/30">
              <span className="flex items-center gap-2 min-w-0">
                <Icon name="school" size={18} className="text-primary shrink-0" />
                <span className="flex flex-col min-w-0">
                  <span className="text-[9px] text-on-surface-variant leading-none">Año y división</span>
                  <span className="text-xs font-bold text-on-surface truncate">{student.division}</span>
                </span>
              </span>
              <Icon name="unfold_more" size={16} className="text-outline shrink-0" />
            </span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-high rounded-md text-[11px] text-on-surface-variant">
          <Icon name="verified" size={15} className="text-secondary shrink-0" />
          <span>Mostrando las cartillas aprobadas para tu colegio.</span>
        </div>
      </div>

      {available.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container-high/60">
          <EmptyState
            icon="explore_off"
            title="No hay cartillas para tu colegio todavía"
            message="Consultale a tu profesor de Geografía o cambiá de colegio en los filtros de arriba."
            action={{ label: 'Cambiar filtros', onClick: () => setEditingFilters(true), icon: 'tune' }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {available.map((cartilla) => {
            const already = myOrders.find(
              (order) => order.cartillaId === cartilla.id && order.deliveryStatus !== 'Cancelado',
            );
            const soldOut = cartilla.stock === 0;
            const forMyYear = matchesMyYear(cartilla);

            return (
              <article
                key={cartilla.id}
                className={`relative bg-surface-container-lowest rounded-xl p-4 shadow-sm border flex flex-col gap-3 overflow-hidden ${
                  forMyYear ? 'border-secondary/40' : 'border-surface-container-high/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {forMyYear ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      Para tu curso actual
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                      {cartilla.year}
                    </span>
                  )}

                  <span className="text-[10px] font-mono text-outline shrink-0">{cartilla.code}</span>
                </div>

                <div className="flex gap-3.5">
                  <BookletCover
                    coverUrl={cartilla.coverUrl}
                    motif={cartilla.coverMotif}
                    seed={cartilla.id}
                    label={cartilla.year.replace(' Año', '')}
                    className="w-20 h-28 rounded-lg shrink-0 shadow-md"
                  />

                  <div className="min-w-0 flex-1 flex flex-col">
                    <h3 className="text-sm font-bold text-on-surface leading-snug">{cartilla.title}</h3>
                    <p className="text-[11px] text-on-surface-variant leading-snug mt-1">
                      {cartilla.subtitle}
                    </p>

                    <ul className="mt-2 flex flex-col gap-0.5">
                      {cartilla.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-[10px] text-outline flex items-center gap-1"
                        >
                          <Icon name="check_small" size={14} className="text-secondary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-surface-container-high/50">
                  <div className="flex flex-col pt-2">
                    <span className="text-lg font-extrabold text-primary font-mono leading-none">
                      {formatARS(cartilla.price)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        soldOut ? 'text-error' : cartilla.stock < 10 ? 'text-on-tertiary-container' : 'text-outline'
                      }`}
                    >
                      {soldOut
                        ? 'Sin stock por ahora'
                        : cartilla.stock < 10
                          ? `¡Últimos ${cartilla.stock} ejemplares!`
                          : `${cartilla.stock} ejemplares disponibles`}
                    </span>
                  </div>

                  {already ? (
                    <span className="mt-2 px-3 py-2 rounded-xl bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                      <Icon name="check_circle" size={16} />
                      Ya la pediste
                    </span>
                  ) : (
                    <button
                      onClick={() => onChooseCartilla(cartilla)}
                      disabled={soldOut}
                      className="mt-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm active:scale-95 transition-transform flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      type="button"
                    >
                      <Icon name="shopping_bag" size={16} />
                      {soldOut ? 'Sin stock' : 'Pedir cartilla'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-outline text-center leading-relaxed px-4">
        Retirás en {school?.name ?? 'tu colegio'}, Mesa de Geografía.
        {school && <> Próxima ventana: {school.nextDelivery}.</>}
      </p>
    </div>
  );
};
