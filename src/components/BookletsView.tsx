import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Cartilla, CoverMotif } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { LOW_STOCK_THRESHOLD, lowStockCartillas } from '../lib/metrics.ts';
import { CURRENT_TERM, formatARS } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { ConfirmDialog } from './ui/ConfirmDialog.tsx';
import { BookletCover, CoverArt } from './ui/CoverArt.tsx';

const MOTIFS: { value: CoverMotif; label: string }[] = [
  { value: 'topographic', label: 'Topográfica' },
  { value: 'satellite', label: 'Satelital' },
  { value: 'political', label: 'Política' },
  { value: 'climate', label: 'Climática' },
  { value: 'urban', label: 'Urbana' },
];

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary';

interface FormState {
  title: string;
  subtitle: string;
  schoolCode: string;
  year: string;
  price: string;
  stock: string;
  pages: string;
  coverMotif: CoverMotif;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: '',
  subtitle: '',
  schoolCode: '',
  year: '1° Año',
  price: '8000',
  stock: '50',
  pages: '110',
  coverMotif: 'topographic',
  isActive: true,
};

const YEARS = ['1° Año', '2° Año', '3° Año', '4° Año', '5° Año', '6° Año'];

export const BookletsView: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const { state, dispatch, dispatchUndoable, showToast } = useDemo();

  const [schoolFilter, setSchoolFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'year' | 'stock' | 'price'>('year');
  const [onlyActive, setOnlyActive] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<Cartilla | null>(null);
  const [restockTarget, setRestockTarget] = useState<Cartilla | null>(null);
  const [restockAmount, setRestockAmount] = useState('25');

  const formRef = useRef<HTMLDivElement>(null);
  const lowStock = lowStockCartillas(state.cartillas);

  // El formulario arranca apuntando al primer colegio disponible.
  useEffect(() => {
    if (!form.schoolCode && state.schools.length > 0) {
      setForm((prev) => ({ ...prev, schoolCode: state.schools[0].code }));
    }
  }, [state.schools, form.schoolCode]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return state.cartillas
      .filter((cartilla) => {
        const matchesSearch =
          needle === '' ||
          cartilla.title.toLowerCase().includes(needle) ||
          cartilla.code.toLowerCase().includes(needle) ||
          cartilla.school.toLowerCase().includes(needle) ||
          cartilla.year.toLowerCase().includes(needle);

        return (
          matchesSearch &&
          (schoolFilter === 'all' || cartilla.schoolCode === schoolFilter) &&
          (!onlyActive || cartilla.isActive)
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'stock') return a.stock - b.stock;
        if (sortOrder === 'price') return b.price - a.price;
        return a.year.localeCompare(b.year) || a.title.localeCompare(b.title);
      });
  }, [state.cartillas, searchQuery, schoolFilter, onlyActive, sortOrder]);

  /** Cuántos pedidos vivos referencian una cartilla. */
  const orderCount = (cartillaId: string) =>
    state.orders.filter((o) => o.cartillaId === cartillaId && o.deliveryStatus !== 'Cancelado').length;

  const startEdit = (cartilla: Cartilla) => {
    setEditingId(cartilla.id);
    setForm({
      title: cartilla.title,
      subtitle: cartilla.subtitle,
      schoolCode: cartilla.schoolCode,
      year: cartilla.year,
      price: String(cartilla.price),
      stock: String(cartilla.stock),
      pages: String(cartilla.pages),
      coverMotif: cartilla.coverMotif,
      isActive: cartilla.isActive,
    });
    setErrors({});
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schoolCode: state.schools[0]?.code ?? '' });
    setErrors({});
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (form.title.trim().length < 6) found.title = 'Poné un título descriptivo.';
    const price = Number(form.price.replace(/\D/g, ''));
    if (!price || price < 100) found.price = 'El precio tiene que ser un número mayor a 100.';
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) found.stock = 'El stock tiene que ser un entero.';
    const pages = Number(form.pages);
    if (!pages || pages < 10) found.pages = 'Indicá la cantidad de páginas.';

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    const school = state.schools.find((s) => s.code === form.schoolCode) ?? state.schools[0];
    const existing = editingId ? state.cartillas.find((c) => c.id === editingId) : undefined;

    const cartilla: Cartilla = {
      id: existing?.id ?? `cart-${Date.now().toString(36)}`,
      code: existing?.code ?? `CART-${String(state.cartillas.length + 1).padStart(2, '0')}`,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || 'Material de la cátedra de Geografía.',
      school: school.name,
      schoolCode: school.code,
      year: form.year,
      divisions: existing?.divisions ?? `${form.year} (todas las divisiones)`,
      price,
      stock,
      isActive: form.isActive,
      pages,
      features: existing?.features ?? [`${pages} págs.`, 'Material de la cátedra'],
      coverUrl: existing?.coverUrl ?? '',
      coverMotif: form.coverMotif,
      tag: existing?.tag ?? 'Novedad',
      edition: existing?.edition ?? `Edición ${CURRENT_TERM}`,
    };

    dispatch({ type: 'UPSERT_CARTILLA', cartilla });
    showToast(
      editingId
        ? `Cambios guardados en "${cartilla.title}".`
        : `Cartilla "${cartilla.title}" agregada al catálogo.`,
    );
    cancelEdit();
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="auto_stories" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Catálogo editorial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-0.5">
            Cartillas del ciclo {CURRENT_TERM}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Precio, tiraje y visibilidad de cada cuadernillo en el portal del alumno.
          </p>
        </div>

        <button
          onClick={() => {
            cancelEdit();
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-container text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
        >
          <Icon name="add" size={18} />
          <span>Nueva cartilla</span>
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-tertiary-fixed rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <Icon name="warning" size={20} className="text-on-tertiary-fixed-variant shrink-0" />
          <p className="text-[11px] text-on-tertiary-fixed flex-1">
            <strong>
              {lowStock.length} cartilla{lowStock.length > 1 ? 's' : ''} con menos de {LOW_STOCK_THRESHOLD}{' '}
              ejemplares
            </strong>
            : {lowStock.map((c) => `${c.code} (${c.stock})`).join(', ')}. Conviene pedir reposición a imprenta.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/60 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[180px] flex-1 sm:flex-initial">
          <label className="sr-only" htmlFor="cartillas-colegio">Colegio</label>
          <select
            id="cartillas-colegio"
            value={schoolFilter}
            onChange={(event) => setSchoolFilter(event.target.value)}
            className={`${inputClass} appearance-none pr-8 cursor-pointer font-medium`}
          >
            <option value="all">Todos los colegios</option>
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

        <div className="relative min-w-[150px] flex-1 sm:flex-initial">
          <label className="sr-only" htmlFor="cartillas-orden">Ordenar por</label>
          <select
            id="cartillas-orden"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
            className={`${inputClass} appearance-none pr-8 cursor-pointer font-medium`}
          >
            <option value="year">Ordenar por año</option>
            <option value="stock">Menor stock primero</option>
            <option value="price">Mayor precio primero</option>
          </select>
          <Icon
            name="swap_vert"
            size={18}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
          />
        </div>

        <label className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-medium cursor-pointer">
          <input
            checked={onlyActive}
            onChange={(event) => setOnlyActive(event.target.checked)}
            className="w-4 h-4 rounded accent-primary cursor-pointer"
            type="checkbox"
          />
          Sólo visibles en el portal
        </label>

        <span className="ml-auto text-[11px] text-outline">
          {filtered.length} de {state.cartillas.length} cartillas
        </span>
      </div>

      {/* Catálogo */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/60">
          <EmptyState
            icon="search_off"
            title="Ninguna cartilla coincide"
            message="Probá con otro colegio o limpiá la búsqueda del encabezado."
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cartilla) => {
            const orders = orderCount(cartilla.id);
            const isEditing = editingId === cartilla.id;
            const isLow = cartilla.isActive && cartilla.stock < LOW_STOCK_THRESHOLD;

            return (
              <article
                key={cartilla.id}
                className={`bg-surface-container-lowest rounded-xl shadow-xs border flex flex-col overflow-hidden transition-all ${
                  isEditing ? 'border-primary ring-2 ring-primary/30' : 'border-surface-container-high/60'
                } ${cartilla.isActive ? '' : 'opacity-75'}`}
              >
                <div className="p-4 flex gap-3.5">
                  <BookletCover
                    coverUrl={cartilla.coverUrl}
                    motif={cartilla.coverMotif}
                    seed={cartilla.id}
                    label={cartilla.year.replace(' Año', '')}
                    className="w-16 h-23 rounded-lg shrink-0 shadow-md"
                  />

                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-outline">{cartilla.code}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          cartilla.stock === 0
                            ? 'bg-error-container text-on-error-container'
                            : isLow
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                              : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        {cartilla.tag}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-on-surface leading-snug mt-0.5">
                      {cartilla.title}
                    </h3>
                    <p className="text-[11px] text-outline leading-snug mt-1 line-clamp-2">
                      {cartilla.subtitle}
                    </p>

                    <div className="flex items-baseline gap-2 mt-auto pt-2">
                      <span className="text-lg font-extrabold text-primary font-mono leading-none">
                        {formatARS(cartilla.price)}
                      </span>
                      <span className="text-[10px] text-outline">{cartilla.pages} págs.</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface-container-low rounded-lg py-1.5">
                    <span
                      className={`block text-sm font-extrabold font-mono leading-none ${
                        cartilla.stock === 0 ? 'text-error' : isLow ? 'text-on-tertiary-container' : 'text-on-surface'
                      }`}
                    >
                      {cartilla.stock}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-outline mt-0.5">
                      Stock
                    </span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg py-1.5">
                    <span className="block text-sm font-extrabold font-mono leading-none text-on-surface">
                      {orders}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-outline mt-0.5">
                      Pedidos
                    </span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg py-1.5">
                    <span className="block text-sm font-extrabold font-mono leading-none text-secondary">
                      {formatARS(orders * cartilla.price).replace('$', '')}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-outline mt-0.5">
                      Facturado
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-2 text-[11px] text-outline flex items-center gap-1.5">
                  <Icon name="school" size={14} />
                  <span className="truncate">{cartilla.school}</span>
                </div>

                <div className="mt-auto px-4 py-3 border-t border-surface-container-high/50 bg-surface-container-low/40 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center cursor-pointer" title="Visible en el portal del alumno">
                    <input
                      checked={cartilla.isActive}
                      onChange={() =>
                        dispatchUndoable(
                          { type: 'TOGGLE_CARTILLA', id: cartilla.id },
                          cartilla.isActive
                            ? `"${cartilla.title}" ya no se ofrece en el portal.`
                            : `"${cartilla.title}" vuelve a estar visible en el portal.`,
                          'info',
                        )
                      }
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:bg-secondary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                    <span className="ml-2 text-[11px] font-bold text-on-surface-variant">
                      {cartilla.isActive ? 'Visible' : 'Oculta'}
                    </span>
                  </label>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        setRestockTarget(cartilla);
                        setRestockAmount('25');
                      }}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                      title="Reponer stock de imprenta"
                      type="button"
                    >
                      <Icon name="add_box" size={18} />
                    </button>

                    <button
                      onClick={() => startEdit(cartilla)}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                      title="Editar la cartilla"
                      type="button"
                    >
                      <Icon name="edit" size={18} />
                    </button>

                    <button
                      onClick={() => {
                        const copy: Cartilla = {
                          ...cartilla,
                          id: `cart-${Date.now().toString(36)}`,
                          code: `CART-${String(state.cartillas.length + 1).padStart(2, '0')}`,
                          title: `${cartilla.title} (copia)`,
                          stock: 0,
                          isActive: false,
                          tag: 'Borrador',
                        };
                        dispatchUndoable(
                          { type: 'UPSERT_CARTILLA', cartilla: copy },
                          `Copia creada como borrador, oculta y sin stock.`,
                          'info',
                        );
                      }}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                      title="Duplicar para otro curso"
                      type="button"
                    >
                      <Icon name="content_copy" size={18} />
                    </button>

                    <button
                      onClick={() => setConfirmDelete(cartilla)}
                      className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-error"
                      title="Quitar del catálogo"
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

      {/* Formulario de alta / edición */}
      <div
        ref={formRef}
        className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/60 overflow-hidden scroll-mt-28"
      >
        <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Icon name={editingId ? 'edit' : 'add_circle'} size={22} className="text-primary" />
            <div>
              <h2 className="text-sm font-bold text-primary">
                {editingId ? 'Editar cartilla' : 'Agregar cartilla al catálogo'}
              </h2>
              <p className="text-[11px] text-outline">
                {editingId
                  ? 'Los cambios se aplican sobre la cartilla existente.'
                  : 'Queda disponible en el portal del alumno si la dejás visible.'}
              </p>
            </div>
          </div>

          {editingId && (
            <button
              onClick={cancelEdit}
              className="text-[11px] font-bold text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 grid lg:grid-cols-[1fr_auto] gap-5">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-primary">Título</span>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Geografía 1° Año: Introducción al Espacio Geográfico"
                className={inputClass}
                aria-invalid={!!errors.title}
              />
              {errors.title && <span className="text-[10px] font-semibold text-error">{errors.title}</span>}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-primary">Descripción breve</span>
              <input
                value={form.subtitle}
                onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
                placeholder="Nociones de territorio, escalas y lectura de mapas."
                className={inputClass}
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-primary">Colegio</span>
                <select
                  value={form.schoolCode}
                  onChange={(event) => setForm({ ...form, schoolCode: event.target.value })}
                  className={`${inputClass} cursor-pointer`}
                >
                  {state.schools.map((school) => (
                    <option key={school.code} value={school.code}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-primary">Año</span>
                <select
                  value={form.year}
                  onChange={(event) => setForm({ ...form, year: event.target.value })}
                  className={`${inputClass} cursor-pointer`}
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-primary">Precio ARS</span>
                <input
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  inputMode="numeric"
                  className={`${inputClass} font-mono`}
                  aria-invalid={!!errors.price}
                />
                {errors.price && <span className="text-[10px] font-semibold text-error">{errors.price}</span>}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-primary">Stock</span>
                <input
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  inputMode="numeric"
                  className={`${inputClass} font-mono`}
                  aria-invalid={!!errors.stock}
                />
                {errors.stock && <span className="text-[10px] font-semibold text-error">{errors.stock}</span>}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-primary">Páginas</span>
                <input
                  value={form.pages}
                  onChange={(event) => setForm({ ...form, pages: event.target.value })}
                  inputMode="numeric"
                  className={`${inputClass} font-mono`}
                  aria-invalid={!!errors.pages}
                />
                {errors.pages && <span className="text-[10px] font-semibold text-error">{errors.pages}</span>}
              </label>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-semibold text-primary mb-1">Tapa</legend>
              <div className="flex items-center gap-2 flex-wrap">
                {MOTIFS.map((motif) => (
                  <label
                    key={motif.value}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                      form.coverMotif === motif.value
                        ? 'border-primary bg-primary-fixed text-on-primary-fixed'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <input
                      checked={form.coverMotif === motif.value}
                      onChange={() => setForm({ ...form, coverMotif: motif.value })}
                      className="sr-only"
                      type="radio"
                      name="cover-motif"
                    />
                    {motif.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
              <input
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
                type="checkbox"
              />
              Visible en el portal del alumno
            </label>

            <div className="flex items-center gap-2 pt-1">
              <button
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="submit"
              >
                <Icon name={editingId ? 'save' : 'add'} size={16} />
                {editingId ? 'Guardar cambios' : 'Agregar al catálogo'}
              </button>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                  type="button"
                >
                  Descartar
                </button>
              )}
            </div>
          </div>

          {/* Vista previa en vivo */}
          <div className="flex flex-col items-center gap-2 lg:w-44">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Vista previa
            </span>
            <CoverArt
              motif={form.coverMotif}
              seed={editingId ?? form.title ?? 'preview'}
              label={form.year.replace(' Año', '')}
              className="w-32 h-48 rounded-lg shadow-lg"
            />
            <p className="text-[11px] text-outline text-center leading-snug">
              {form.title || 'Título de la cartilla'}
            </p>
            <span className="text-sm font-extrabold text-primary font-mono">
              {formatARS(Number(form.price.replace(/\D/g, '')) || 0)}
            </span>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Quitar del catálogo"
        message={
          confirmDelete ? (
            <>
              Vas a quitar <strong>{confirmDelete.title}</strong> del catálogo.
              {orderCount(confirmDelete.id) > 0 && (
                <>
                  {' '}
                  Tiene <strong>{orderCount(confirmDelete.id)} pedidos</strong> asociados, que se conservan
                  pero quedan sin cartilla en el catálogo. Si sólo querés dejar de ofrecerla, conviene
                  ocultarla con el interruptor.
                </>
              )}
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Quitar"
        onConfirm={() => {
          if (!confirmDelete) return;
          dispatchUndoable(
            { type: 'DELETE_CARTILLA', id: confirmDelete.id },
            `"${confirmDelete.title}" se quitó del catálogo.`,
            'info',
          );
        }}
        onClose={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        isOpen={!!restockTarget}
        title="Reponer stock"
        tone="primary"
        message={
          restockTarget ? (
            <div className="flex flex-col gap-3">
              <span>
                Ingreso de remesa de imprenta para <strong>{restockTarget.title}</strong>. Stock actual:{' '}
                <strong className="font-mono">{restockTarget.stock}</strong>.
              </span>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-primary">Ejemplares a sumar</span>
                <input
                  value={restockAmount}
                  onChange={(event) => setRestockAmount(event.target.value)}
                  inputMode="numeric"
                  className={`${inputClass} font-mono`}
                />
              </label>
            </div>
          ) : (
            ''
          )
        }
        confirmLabel="Sumar al stock"
        onConfirm={() => {
          if (!restockTarget) return;
          const delta = Number(restockAmount.replace(/\D/g, ''));
          if (!delta) {
            showToast('Indicá cuántos ejemplares entraron.', 'error');
            return;
          }
          dispatchUndoable(
            {
              type: 'ADJUST_STOCK',
              id: restockTarget.id,
              delta,
              reason: 'reposicion',
              note: 'Ingreso de remesa de imprenta',
            },
            `+${delta} ejemplares de ${restockTarget.code}. Stock: ${restockTarget.stock + delta}.`,
          );
        }}
        onClose={() => setRestockTarget(null)}
      />
    </div>
  );
};
