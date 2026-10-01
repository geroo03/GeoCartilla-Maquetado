import React, { useState } from 'react';
import { Cartilla, School } from '../types/index.ts';

interface BookletsViewProps {
  cartillas: Cartilla[];
  schools: School[];
  onToggleActive: (id: string) => void;
  onAddCartilla: (newCartilla: Cartilla) => void;
  onEditCartilla?: (cartilla: Cartilla) => void;
}

export const BookletsView: React.FC<BookletsViewProps> = ({
  cartillas,
  schools,
  onToggleActive,
  onAddCartilla,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state
  const [formTitle, setFormTitle] = useState('Geografía 1° Año: Introducción al Espacio Geográfico');
  const [formSchool, setFormSchool] = useState('san-martin');
  const [formYear, setFormYear] = useState('1° Año');
  const [formPrice, setFormPrice] = useState('8.500');
  const [formStock, setFormStock] = useState('50');
  const [formPages, setFormPages] = useState('116');
  const [formIsImmediate, setFormIsImmediate] = useState(true);
  const [selectedCoverPreset, setSelectedCoverPreset] = useState<string>('topographic');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Filtered Cartillas
  const filteredCartillas = cartillas
    .filter((c) => {
      const matchesSearch =
        searchFilter === '' ||
        c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.subtitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.code.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesSchool =
        schoolFilter === 'all' ||
        c.schoolCode === schoolFilter ||
        c.school.toLowerCase().includes(schoolFilter.toLowerCase());

      return matchesSearch && matchesSchool;
    })
    .sort((a, b) => {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  // Stock summary
  const totalStock = cartillas.reduce((acc, c) => acc + c.stock, 0);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const cleanPrice = parseInt(formPrice.replace(/\D/g, ''), 10) || 8500;
    const cleanStock = parseInt(formStock, 10) || 0;
    const cleanPages = parseInt(formPages, 10) || 120;

    const targetSchool = schools.find((s) => s.code === formSchool) || schools[0];
    const newId = `cart-0${cartillas.length + 1}`;
    const newCode = `CART-0${cartillas.length + 1}`;

    const newCartilla: Cartilla = {
      id: newId,
      code: newCode,
      title: formTitle.trim(),
      subtitle: `Cuadernillo curricular de ${formYear} para ${targetSchool.name}.`,
      school: targetSchool.name,
      schoolCode: targetSchool.code,
      year: formYear,
      divisions: `${formYear} (Divisiones A y B)`,
      price: cleanPrice,
      stock: cleanStock,
      isActive: formIsImmediate && cleanStock > 0,
      pages: cleanPages,
      features: [`${cleanPages} págs. • Anillado doble wire-o`, 'Cartografía física y mapas temáticos'],
      coverUrl:
        selectedCoverPreset === 'custom'
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgtPQaKSw7B92FnQXyzXxAltSy1UOCch6Dbkk9wsku-EWBNuFchhKG251lcGVRyCdcH5x0fgIi590SFM1iV_1nB_SV_rvL5xlc4YnB2SFutFBEHigE6Muapc7yd6bM-7vARYz5u7UEjabrWrmnkWH6dBo3bHjDLmHWeyxxLFVLoxN943Gxr19y_0_bue18g6_tQkg5QodsiAkZzoUi15Z9DbVKSAlFGMJJjkFDA2pFT24tb1Zk28-ifg'
          : '',
      tag: 'Oficial 2025',
      edition: 'Edición 2025 • Cátedra de Geografía',
    };

    onAddCartilla(newCartilla);
    setFormSuccessMessage(`¡Cartilla "${formTitle}" cargada con éxito!`);
    setTimeout(() => setFormSuccessMessage(null), 3000);

    // Reset some fields
    setFormTitle('');
  };

  const handleScrollToForm = () => {
    const el = document.getElementById('form-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const input = el.querySelector('input');
      input?.focus();
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-secondary mb-1">
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span className="text-[11px] uppercase tracking-wider font-bold">
              Catálogo Académico • Ciclo 2025
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Catálogo de Cartillas Escolares
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-0.5">
            Administrá los cuadernillos de estudio, precios, stock y visibilidad por colegio y curso para retiro ágil de alumnos.
          </p>
        </div>

        {/* Screen Stats Summary & New Button Trigger */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="hidden xl:flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-xl shadow-xs border border-surface-container-high/60">
            <div className="flex flex-col text-left">
              <span className="text-[11px] text-on-surface-variant">Total Títulos</span>
              <span className="text-lg font-bold text-primary font-mono leading-none">
                {cartillas.length}
              </span>
            </div>
            <div className="w-px h-6 bg-surface-container-high" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] text-on-surface-variant">En Stock Físico</span>
              <span className="text-lg font-bold text-secondary font-mono leading-none">
                {totalStock} u.
              </span>
            </div>
          </div>

          <button
            onClick={handleScrollToForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Nueva Cartilla</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Table Showcase (Left) + Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Booklet Management Table & Filters */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Filter Toolbar */}
          <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-surface-container-high/60 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface placeholder:text-outline text-xs rounded-lg border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                placeholder="Buscar cartilla, autor o tema..."
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] text-on-surface-variant font-medium hidden md:inline">
                Filtrar por:
              </span>
              <select
                className="w-full sm:w-auto bg-surface-container-low text-on-surface text-xs font-semibold px-3 py-2 rounded-lg border border-outline-variant/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container"
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
              >
                <option value="all">Todos los colegios</option>
                {schools.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant/30"
                title={`Ordenar por precio (${sortOrder === 'asc' ? 'Menor a mayor' : 'Mayor a menor'})`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
              </button>
            </div>
          </div>

          {/* Booklet List Cards / Dense Table Wrapper */}
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/60 overflow-hidden">
            {/* Table Column Header */}
            <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider font-bold border-b border-surface-container-high/40">
              <div className="col-span-5">Cartilla y Contenido</div>
              <div className="col-span-3">Colegio & Curso</div>
              <div className="col-span-2 text-right">Precio & Stock</div>
              <div className="col-span-2 text-center">Visibilidad</div>
            </div>

            {/* Rows Container */}
            <div className="flex flex-col divide-y divide-surface-container-high/40">
              {filteredCartillas.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-xs">
                  No se encontraron cartillas para el filtro seleccionado.
                </div>
              ) : (
                filteredCartillas.map((cartilla) => {
                  const isOutOfStock = cartilla.stock <= 0;

                  return (
                    <div
                      key={cartilla.id}
                      className={`group p-4 md:px-6 md:py-4 hover:bg-surface-container-low/50 transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 items-center bg-surface-container-lowest ${
                        isOutOfStock ? 'opacity-85' : ''
                      }`}
                    >
                      {/* Cover Thumbnail & Title */}
                      <div className="w-full col-span-5 flex items-start gap-3.5 min-w-0">
                        <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden shadow-xs bg-surface-container border border-outline-variant/30">
                          {cartilla.coverUrl ? (
                            <img
                              alt={cartilla.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              src={cartilla.coverUrl}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary flex flex-col items-center justify-center text-white p-1 text-center">
                              <span className="material-symbols-outlined text-[20px] text-primary-fixed">
                                public
                              </span>
                              <span className="text-[8px] font-bold mt-1 uppercase">
                                {cartilla.year}
                              </span>
                            </div>
                          )}
                          <span className="absolute bottom-0 inset-x-0 bg-primary/80 backdrop-blur-xs text-[9px] text-center font-bold text-on-primary py-0.5">
                            {cartilla.year}
                          </span>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOutOfStock
                                  ? 'bg-error-container text-error'
                                  : cartilla.tag === 'Reimpresión'
                                  ? 'bg-surface-container text-on-surface-variant'
                                  : 'bg-secondary-container text-secondary'
                              }`}
                            >
                              {cartilla.tag}
                            </span>
                            <span className="text-[10px] text-outline font-mono font-semibold">
                              #{cartilla.code}
                            </span>
                          </div>

                          <h2
                            className={`text-sm font-bold leading-tight mt-1 truncate ${
                              isOutOfStock ? 'text-on-surface-variant line-through decoration-outline' : 'text-primary'
                            }`}
                          >
                            {cartilla.title}
                          </h2>

                          <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                            {cartilla.subtitle}
                          </p>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-outline">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">auto_stories</span>
                              {cartilla.pages} pág.
                            </span>
                            {isOutOfStock ? (
                              <span className="text-error flex items-center gap-1 font-bold">
                                <span className="material-symbols-outlined text-[13px]">warning</span>
                                Pedir reimpresión
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">map</span>
                                {cartilla.features[1] || 'Anexo cartográfico'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Colegio & Año */}
                      <div className="w-full md:col-span-3 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-outline text-[16px]">school</span>
                          <span className="text-xs font-semibold text-on-surface truncate">
                            {cartilla.school}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-on-surface-variant">{cartilla.divisions}</span>
                        </div>
                      </div>

                      {/* Precio & Stock */}
                      <div className="w-full md:col-span-2 flex md:flex-col justify-between md:items-end">
                        <div className="text-base font-extrabold text-primary font-mono leading-none">
                          ${cartilla.price.toLocaleString('es-AR')}{' '}
                          <span className="text-[10px] text-outline font-normal">ARS</span>
                        </div>

                        {isOutOfStock ? (
                          <div className="inline-flex items-center gap-1 bg-error-container text-error px-2 py-0.5 rounded-full mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-error" />
                            <span className="text-[10px] font-bold">0 u. (Agotada)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-secondary-container/70 text-secondary px-2 py-0.5 rounded-full mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            <span className="text-[10px] font-bold">{cartilla.stock} u. disponibles</span>
                          </div>
                        )}
                      </div>

                      {/* Toggle & Actions */}
                      <div className="w-full md:col-span-2 flex items-center justify-between md:justify-center gap-2 pt-1 md:pt-0">
                        {/* Switch toggle Activa */}
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          title="Habilitar/deshabilitar compra a estudiantes"
                        >
                          <input
                            checked={cartilla.isActive}
                            onChange={() => onToggleActive(cartilla.id)}
                            className="sr-only peer"
                            type="checkbox"
                          />
                          <div className="w-10 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                          <span className="ml-2 text-xs font-bold text-secondary md:hidden">
                            {cartilla.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </label>

                        {/* Edit / Duplicate Buttons */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => {
                              setFormTitle(cartilla.title);
                              setFormSchool(cartilla.schoolCode);
                              setFormYear(cartilla.year);
                              setFormPrice(cartilla.price.toLocaleString('es-AR'));
                              setFormStock(String(cartilla.stock));
                              handleScrollToForm();
                            }}
                            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                            title="Editar datos de la cartilla"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              onAddCartilla({
                                ...cartilla,
                                id: `cart-${Date.now()}`,
                                code: `CART-0${cartillas.length + 1}`,
                                title: `${cartilla.title} (Copia)`,
                              });
                            }}
                            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                            title="Duplicar cartilla para otro curso"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Table Footer / Quick batch bar */}
            <div className="px-6 py-3 bg-surface-container-low border-t border-surface-container-high/40 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                <span>
                  Los alumnos solo pueden solicitar cartillas marcadas en <strong className="text-secondary">verde</strong> y con stock &gt; 0.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Exportar planilla PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Delivery & Print Status Notification Banner */}
          <div className="bg-gradient-to-r from-surface-container to-surface-variant p-4 rounded-xl flex items-center justify-between gap-4 shadow-xs border border-surface-container-high/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[24px]">local_printshop</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">
                  Imprenta del Centro • Lote #41 en camino
                </span>
                <span className="text-xs text-on-surface-variant">
                  Se esperan 60 ejemplares adicionales de 'Geografía 5° Año' el jueves a las 09:30 hs.
                </span>
              </div>
            </div>
            <button
              onClick={() => alert('Seguimiento de despacho:\nRemesa #41 en encuadernación doble espiral.\nEntrega estimada: Jueves 09:30 hs en Sala de Profesores.')}
              className="shrink-0 bg-surface-container-lowest text-primary hover:bg-surface font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
              type="button"
            >
              Ver seguimiento
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: Nueva Cartilla Form Panel */}
        <aside className="lg:col-span-5 xl:col-span-4 flex flex-col" id="form-container">
          <div className="bg-surface-container-lowest rounded-xl shadow-md border border-surface-container-high/60 p-6 sticky top-24">
            {/* Form Header */}
            <div className="flex items-start justify-between pb-3 mb-4 bg-surface-container-low -mx-6 -mt-6 px-6 pt-6 rounded-t-xl border-b border-surface-container-high/40">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-[22px]">post_add</span>
                  <h2 className="text-base font-bold">Cargar Nueva Cartilla</h2>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Ingresá los datos del cuadernillo para publicarlo a los cursos.
                </p>
              </div>
              <span className="bg-surface-container-highest text-on-primary-fixed-variant text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                Paso 1 de 1
              </span>
            </div>

            {formSuccessMessage && (
              <div className="mb-4 p-3 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 text-xs">
              {/* Campo 1: Título */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface flex items-center justify-between">
                  <span>
                    Título de la cartilla <span className="text-error">*</span>
                  </span>
                  <span className="text-outline text-[11px] font-normal">Máx. 65 caract.</span>
                </label>
                <input
                  required
                  maxLength={65}
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-xs placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                  placeholder="ej. Geografía 1° Año: Introducción al Espacio Geográfico"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Grid: Colegio y Año */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Campo 2: Colegio */}
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">
                    Colegio <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-10 pl-3 pr-7 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer"
                      value={formSchool}
                      onChange={(e) => setFormSchool(e.target.value)}
                    >
                      {schools.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Campo 3: Año de cursada */}
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">
                    Año de cursada <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-10 pl-3 pr-7 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none cursor-pointer"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                    >
                      <option value="1° Año">1° Año</option>
                      <option value="2° Año">2° Año</option>
                      <option value="3° Año">3° Año</option>
                      <option value="4° Año">4° Año</option>
                      <option value="5° Año">5° Año</option>
                      <option value="6° Año">6° Año</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid: Precio y Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Campo 4: Precio */}
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">
                    Precio unitario ($ ARS) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-outline">
                      $
                    </span>
                    <input
                      required
                      className="w-full h-10 pl-7 pr-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                      type="text"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
                  </div>
                  <span className="text-[10px] text-outline">Incluye anillado e IVA</span>
                </div>

                {/* Campo 5: Stock Inicial */}
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">
                    Stock inicial retiro <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      min={0}
                      className="w-full h-10 pl-3 pr-16 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-outline font-semibold">
                      unidades
                    </span>
                  </div>
                  <span className="text-[10px] text-secondary font-bold">En Mesa de Profesores</span>
                </div>
              </div>

              {/* Páginas */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Cantidad de páginas</label>
                <input
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary-container"
                  type="number"
                  value={formPages}
                  onChange={(e) => setFormPages(e.target.value)}
                />
              </div>

              {/* Campo 6: Portada (Drag & Drop or Select Template) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-on-surface">Diseño de Portada</label>
                  <button
                    onClick={() =>
                      setSelectedCoverPreset(
                        selectedCoverPreset === 'custom' ? 'topographic' : 'custom'
                      )
                    }
                    className="text-[11px] text-secondary hover:underline font-semibold cursor-pointer"
                    type="button"
                  >
                    {selectedCoverPreset === 'custom'
                      ? 'Cambiar a diseño topográfico'
                      : 'Usar imagen con mapa de Argentina'}
                  </button>
                </div>

                <div
                  onClick={() =>
                    setSelectedCoverPreset(
                      selectedCoverPreset === 'custom' ? 'topographic' : 'custom'
                    )
                  }
                  className="relative group rounded-xl p-4 bg-surface-container-low hover:bg-surface-container transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px] border border-dashed border-outline-variant/60"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-on-primary transition-all shadow-xs mb-1.5">
                    <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  </div>
                  <span className="font-bold text-xs text-primary">
                    {selectedCoverPreset === 'custom'
                      ? 'Portada con mapa de Argentina seleccionada'
                      : 'Hacé clic para elegir o subir la portada'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5">
                    Formatos JPG o PNG (proporción sugerida 3:4, máx 5MB)
                  </span>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-outline bg-surface-container-lowest px-2 py-0.5 rounded-full border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[12px]">palette</span>
                    {selectedCoverPreset === 'custom'
                      ? 'Tapa ilustrada oficial'
                      : 'Relieve topográfico automático'}
                  </div>
                </div>
              </div>

              {/* Campo 7: Switch toggle Habilitar pedidos inmediatos */}
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-3 border border-surface-container-high/40">
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-on-surface">
                    Habilitar para pedidos inmediatos
                  </span>
                  <span className="text-[10px] text-on-surface-variant leading-tight">
                    Los alumnos podrán encargar y transferir apenas guardes.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    checked={formIsImmediate}
                    onChange={(e) => setFormIsImmediate(e.target.checked)}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-10 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  className="flex-1 h-11 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Guardar cartilla</span>
                </button>
                <button
                  onClick={() => {
                    setFormTitle('');
                    setFormPrice('8.000');
                    setFormStock('40');
                  }}
                  className="h-11 px-4 bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container transition-colors rounded-lg font-semibold text-xs cursor-pointer flex items-center justify-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Descartar</span>
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};
