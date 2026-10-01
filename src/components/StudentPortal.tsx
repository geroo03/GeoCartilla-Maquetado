import React, { useState } from 'react';
import { Cartilla, Order, PaymentMethod } from '../types/index.ts';

interface StudentPortalProps {
  cartillas: Cartilla[];
  orders: Order[];
  onPlaceOrder: (order: Order) => void;
  onSwitchToTeacher: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  cartillas,
  orders,
  onPlaceOrder,
  onSwitchToTeacher,
}) => {
  // Navigation tabs: 'auth' | 'catalogo' | 'mi-pedido' | 'mis-pedidos' | 'mi-perfil'
  const [activeTab, setActiveTab] = useState<'auth' | 'catalogo' | 'mi-pedido' | 'mis-pedidos' | 'mi-perfil'>('catalogo');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [showPassword, setShowPassword] = useState(false);

  // Student profile state
  const [studentName, setStudentName] = useState('Sofía Martínez');
  const [studentDni, setStudentDni] = useState('47.382.115');
  const [studentEmail, setStudentEmail] = useState('sofia.martinez23@gmail.com');
  const [studentPhone, setStudentPhone] = useState('+54 9 11 5849-2041');
  const [studentSchool, setStudentSchool] = useState('Col. Nacional San Martín');
  const [studentYear, setStudentYear] = useState('3° Año ESB (Div. A)');

  // Ordering state
  const [selectedCartilla, setSelectedCartilla] = useState<Cartilla>(cartillas[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mercado Pago');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // School and division filters inside student catalog
  const [filterSchool, setFilterSchool] = useState('san-martin');
  const [filterYear, setFilterYear] = useState('3');
  const [showEmptyStatePreview, setShowEmptyStatePreview] = useState(false);

  // Filter student cartillas
  const availableCartillas = cartillas.filter((c) => {
    if (showEmptyStatePreview) return false;
    return c.isActive && c.stock > 0;
  });

  const handleStartOrder = (cartilla: Cartilla) => {
    setSelectedCartilla(cartilla);
    setActiveTab('mi-pedido');
  };

  const handleConfirmOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const randomCode = `GEO-${Math.floor(4825 + Math.random() * 50)}`;
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newOrder: Order = {
        id: randomCode.toLowerCase(),
        code: randomCode,
        studentName,
        studentDni,
        studentEmail,
        studentPhone,
        school: selectedCartilla.school,
        schoolCode: selectedCartilla.schoolCode,
        year: selectedCartilla.year,
        division: studentYear,
        cartillaId: selectedCartilla.id,
        cartillaTitle: selectedCartilla.title,
        cartillaCover: selectedCartilla.coverUrl,
        cartillaPages: selectedCartilla.pages,
        paymentMethod,
        paymentStatus: paymentMethod === 'Mercado Pago' ? 'Pagado' : 'Pendiente de pago',
        deliveryStatus: paymentMethod === 'Mercado Pago' ? 'Listo para retirar' : 'Preparado',
        date: formattedDate,
        timestamp: Date.now(),
        price: selectedCartilla.price,
        pickupLocation: 'Mesa de Geografía - Sala de Profesores',
      };

      onPlaceOrder(newOrder);
      setConfirmedOrder(newOrder);
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface min-h-screen flex flex-col relative pb-20 shadow-2xl border-x border-surface-container-high/60">
      {/* Top Header */}
      <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-surface-container-high/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 p-1">
            <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-white">
              <rect x="4" y="8" width="14" height="24" rx="2" fill="#2563eb" />
              <rect x="22" y="8" width="14" height="24" rx="2" fill="#10b981" />
              <path d="M7 16H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 22H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="29" cy="20" r="5" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider leading-none">
              GeoCartillas
            </span>
            <span className="text-base font-extrabold text-primary leading-tight">
              {activeTab === 'auth'
                ? 'Acceso Escolar'
                : activeTab === 'catalogo'
                ? 'Catálogo'
                : activeTab === 'mi-pedido'
                ? 'Mi Pedido'
                : activeTab === 'mis-pedidos'
                ? 'Mis Pedidos'
                : 'Mi Perfil'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick link to teacher panel */}
          <button
            onClick={onSwitchToTeacher}
            className="text-[11px] font-semibold text-primary bg-surface-container-high hover:bg-surface-container px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
            title="Cambiar al Panel Docente"
          >
            <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
            <span>Docente</span>
          </button>

          <button
            onClick={() => setActiveTab('mi-perfil')}
            className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer shadow-xs"
            title="Ver mi perfil"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="flex-1 flex flex-col p-4">
        {/* TAB 1: AUTHENTICATION / ALTA DE ALUMNO */}
        {activeTab === 'auth' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Header Brand */}
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white mb-2 shadow-sm">
                <span className="material-symbols-outlined text-[28px]">menu_book</span>
              </div>
              <h1 className="text-xl font-extrabold text-primary tracking-tight max-w-[300px]">
                Pedí tu cartilla de Geografía y retirala sin filas
              </h1>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-surface-container-high rounded-full">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-xs text-on-surface-variant font-medium">
                  Material oficial 2025 para colegios secundarios
                </span>
              </div>
            </div>

            {/* Segmented Tabs */}
            <div className="bg-surface-container p-1 rounded-xl flex items-center shadow-xs">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant'
                }`}
                type="button"
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant'
                }`}
                type="button"
              >
                Registrarme
              </button>
            </div>

            {/* Registration Form */}
            {authMode === 'register' ? (
              <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-3.5">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-base font-bold text-primary">Alta de Alumno</h2>
                    <p className="text-xs text-on-surface-variant">
                      Completá tus datos para acceder a tu material escolar
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setActiveTab('catalogo');
                  }}
                  className="flex flex-col gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-primary">Nombre y apellido del alumno</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                        person
                      </span>
                      <input
                        required
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Sofía Martínez"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-primary">Email del alumno o tutor</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                        alternate_email
                      </span>
                      <input
                        required
                        type="email"
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="sofia.martinez@colegio.edu.ar"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant">
                      Acá recibirás tu comprobante y código digital de retiro.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-primary">Contraseña</label>
                      <span className="text-[10px] text-outline">Mínimo 6 caracteres</span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                        lock
                      </span>
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        className="w-full h-10 pl-9 pr-10 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        defaultValue="123456"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-outline hover:text-primary cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-primary">Colegio secundario</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                        account_balance
                      </span>
                      <select
                        className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs appearance-none cursor-pointer"
                        value={studentSchool}
                        onChange={(e) => setStudentSchool(e.target.value)}
                      >
                        <option value="Col. Nacional San Martín">Col. Nacional San Martín</option>
                        <option value="Inst. Manuel Belgrano">Inst. Manuel Belgrano</option>
                        <option value="Esc. Normal N°1">Esc. Normal N°1</option>
                        <option value="Comercial N°3">Comercial N°3 Hipólito Yrigoyen</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-primary">Año de cursada (2025)</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                        auto_stories
                      </span>
                      <select
                        className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs appearance-none cursor-pointer"
                        value={studentYear}
                        onChange={(e) => setStudentYear(e.target.value)}
                      >
                        <option value="3° Año ESB (Div. A)">3° Año (Ciclo Básico)</option>
                        <option value="4° Año B (Turno Mañana)">4° Año (Bachiller)</option>
                        <option value="5° Año (Naturales)">5° Año (Naturales)</option>
                        <option value="2° Año (Divisiones 1 a 4)">2° Año</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 mt-1 cursor-pointer select-none">
                    <input
                      defaultChecked
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                    />
                    <span className="text-[11px] text-on-surface-variant leading-tight">
                      Acepto recibir notificaciones sobre el estado de entrega en sala de profesores.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full h-11 mt-1 bg-primary text-on-primary rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-primary-container transition-all active:scale-98 cursor-pointer"
                  >
                    <span>Crear cuenta y elegir cartilla</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>
              </section>
            ) : (
              /* Login Form */
              <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-3.5">
                <div>
                  <h2 className="text-base font-bold text-primary">Ingresar a tu cuenta</h2>
                  <p className="text-xs text-on-surface-variant">
                    Accedé a tus cartillas pedidas y comprobantes
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setActiveTab('catalogo');
                  }}
                  className="flex flex-col gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-primary">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none"
                      placeholder="alumno@colegio.edu.ar"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-primary">Contraseña</label>
                    <input
                      required
                      type="password"
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none"
                      defaultValue="123456"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 bg-primary text-on-primary rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-primary-container transition-all active:scale-98 cursor-pointer"
                  >
                    <span>Ingresar a mi cuenta</span>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                  </button>
                </form>
              </section>
            )}

            {/* Trust note */}
            <footer className="mt-4 flex flex-col items-center text-center gap-1.5 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                <span>Prof. Martín Gómez • Cátedra de Geografía</span>
              </div>
              <p className="text-[11px] text-on-surface-variant max-w-[280px]">
                Las entregas se retiran en Sala de Profesores mostrando el código digital o DNI.
              </p>
            </footer>
          </div>
        )}

        {/* TAB 2: CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Saludo & Encabezado */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary flex items-center gap-1">
                  ¡Hola, {studentName.split(' ')[0]}! <span className="animate-bounce">👋</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                  Ciclo 2025
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-primary tracking-tight">
                Elegí tu cartilla escolar
              </h1>
              <p className="text-xs text-on-surface-variant">
                Tu material bibliográfico y mapas para el ciclo lectivo 2025.
              </p>
            </div>

            {/* Filtros Precargados */}
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2 shadow-xs">
              <div className="grid grid-cols-1 gap-2">
                {/* Selector Escuela */}
                <div className="h-10 px-3 bg-surface-container-lowest rounded-lg flex items-center justify-between text-left shadow-xs border border-outline-variant/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                      account_balance
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-on-surface-variant leading-none">Colegio</span>
                      <span className="text-xs font-bold text-on-surface truncate">
                        {studentSchool}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline">unfold_more</span>
                </div>

                {/* Selector Curso */}
                <div className="h-10 px-3 bg-surface-container-lowest rounded-lg flex items-center justify-between text-left shadow-xs border border-outline-variant/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                      school
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-on-surface-variant leading-none">Año y división</span>
                      <span className="text-xs font-bold text-on-surface truncate">
                        {studentYear}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline">unfold_more</span>
                </div>
              </div>

              {/* Indicador informativo */}
              <div className="flex items-center justify-between px-2 py-1 bg-surface-container-high rounded-md text-[11px]">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
                  <span>Mostrando cartillas aprobadas para tu división.</span>
                </div>
                <button
                  onClick={() => setShowEmptyStatePreview(!showEmptyStatePreview)}
                  className="text-[10px] text-secondary font-bold underline cursor-pointer"
                  type="button"
                >
                  {showEmptyStatePreview ? 'Ver cartillas' : 'Simular sin stock'}
                </button>
              </div>
            </div>

            {/* List of Cartillas */}
            {showEmptyStatePreview ? (
              /* SECCIÓN DEMOSTRATIVA DE ESTADO VACÍO (Image 14) */
              <div className="rounded-xl bg-surface-container-lowest p-6 flex flex-col items-center text-center shadow-xs border border-surface-container-high/60 my-2">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-2 text-primary">
                  <span className="material-symbols-outlined text-[28px] text-surface-tint">
                    explore_off
                  </span>
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant mb-2">
                  Vista previa sin resultados
                </span>
                <h3 className="text-base font-bold text-primary mb-1">
                  No hay cartillas para este colegio y año todavía
                </h3>
                <p className="text-xs text-on-surface-variant max-w-xs mb-4">
                  Consultale a tu profesor de Geografía o seleccioná otro curso en los filtros superiores para ver el material disponible.
                </p>
                <button
                  onClick={() => {
                    alert('¡Notificación enviada al Depto. de Geografía! Te avisaremos cuando se cargue el cuadernillo.');
                    setShowEmptyStatePreview(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">forum</span>
                  <span>Avisarle al Depto. de Geografía</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {availableCartillas.map((cartilla, index) => {
                  const isCurrentCourse = index === 0;

                  return (
                    <div
                      key={cartilla.id}
                      className="relative bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-3 overflow-hidden"
                    >
                      {/* Badge top */}
                      <div className="flex items-center justify-between">
                        {isCurrentCourse ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                            Para tu curso actual
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                            Ciclo Orientado
                          </span>
                        )}

                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[13px]">
                            {isCurrentCourse ? 'auto_stories' : 'public'}
                          </span>
                          {isCurrentCourse ? 'Geografía Argentina' : 'Geografía Mundial'}
                        </span>
                      </div>

                      {/* Layout Portada + Datos */}
                      <div className="flex gap-3.5 items-start">
                        <div className="relative w-24 shrink-0 rounded-lg overflow-hidden shadow-xs aspect-[3/4] bg-surface-container border border-outline-variant/30">
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
                            <div className="w-full h-full bg-primary-container text-white flex flex-col items-center justify-center p-2 text-center">
                              <span className="material-symbols-outlined text-[24px]">public</span>
                              <span className="text-[9px] font-bold mt-1 uppercase">
                                {cartilla.year}
                              </span>
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 bg-primary/85 text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {cartilla.year}
                          </span>
                        </div>

                        <div className="flex flex-col min-w-0 flex-1 justify-between self-stretch">
                          <div>
                            <h2 className="text-sm font-bold text-primary leading-tight line-clamp-2">
                              {cartilla.title}
                            </h2>
                            <p className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-outline">
                                domain
                              </span>
                              <span className="truncate">{cartilla.school}</span>
                            </p>
                          </div>

                          <div className="flex flex-col gap-1 py-1 text-xs">
                            <div className="flex items-center gap-1.5 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[15px] text-secondary">
                                check_circle
                              </span>
                              <span className="text-[11px] leading-tight">
                                {cartilla.pages} págs. • Anillado doble wire-o
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[15px] text-secondary">
                                map
                              </span>
                              <span className="text-[11px] leading-tight truncate">
                                {cartilla.features[1] || 'Mapas temáticos y actividades'}
                              </span>
                            </div>
                          </div>

                          {/* Availability chip */}
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            <span>
                              {isCurrentCourse
                                ? 'Listo para retiro en 24hs'
                                : `${cartilla.stock} copias en sala de profesores`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="w-full h-px bg-surface-container my-0.5" />

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between gap-3 pt-0.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                            Precio final
                          </span>
                          <span className="text-xl font-extrabold text-primary font-mono leading-tight">
                            $ {cartilla.price.toLocaleString('es-AR')}{' '}
                            <span className="text-xs text-on-surface-variant font-normal">ARS</span>
                          </span>
                        </div>

                        <button
                          onClick={() => handleStartOrder(cartilla)}
                          className="flex-1 max-w-[170px] h-11 bg-primary hover:bg-primary-container text-on-primary rounded-lg flex items-center justify-center gap-2 font-bold text-xs shadow-sm active:scale-98 transition-all cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                          <span>Pedir cartilla</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Banner Retiro Seguro */}
            <div className="p-3.5 rounded-xl bg-primary text-on-primary flex items-center gap-3 shadow-md mt-1">
              <div className="w-9 h-9 rounded-full bg-on-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary-fixed text-[22px]">
                  pin_drop
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-xs font-bold text-on-primary leading-tight">
                  Punto de retiro seguro
                </h4>
                <p className="text-[11px] text-on-primary-container leading-tight mt-0.5">
                  Retirá en el recreo en la Mesa de Geografía (Sala de Profesores) presentando tu comprobante.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MI PEDIDO / CONFIRMACIÓN */}
        {activeTab === 'mi-pedido' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Header step 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('catalogo')}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary active:scale-95 transition-transform cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-primary leading-tight">
                    Confirmación de Pedido
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Paso 2 de 2 • Finalizar trámite
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary-container px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-[10px] font-bold text-on-secondary-container">Paso 2/2</span>
              </div>
            </div>

            {/* Resumen del Pedido Card */}
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/60 p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex gap-3.5 items-start">
                <div className="w-16 h-22 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container shadow-xs relative border border-outline-variant/30">
                  {selectedCartilla.coverUrl ? (
                    <img
                      alt={selectedCartilla.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      src={selectedCartilla.coverUrl}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-container text-white flex flex-col items-center justify-center text-center p-1">
                      <span className="material-symbols-outlined text-[20px]">public</span>
                      <span className="text-[8px] font-bold mt-1">2° Año</span>
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-primary text-on-primary text-[8px] font-bold px-1 py-0.5 rounded shadow-xs">
                    {selectedCartilla.year}
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 text-[10px] text-secondary uppercase font-bold tracking-wider">
                    <span className="material-symbols-outlined text-[13px]">school</span>
                    {selectedCartilla.school}
                  </span>
                  <h2 className="text-sm font-bold text-primary leading-tight mt-0.5 truncate">
                    {selectedCartilla.title}
                  </h2>
                  <p className="text-xs text-on-surface-variant line-clamp-1">
                    {selectedCartilla.subtitle}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="bg-surface-container px-2 py-0.5 rounded font-semibold text-primary">
                      {studentYear}
                    </span>
                    <span className="bg-surface-container-low px-2 py-0.5 rounded text-on-surface-variant font-medium">
                      Tapa color + Anillado
                    </span>
                  </div>
                </div>
              </div>

              {/* Ficha de Estudiante y Retiro */}
              <div className="bg-surface-container-low/70 rounded-lg p-3 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                    Alumna:
                  </span>
                  <span className="font-bold text-primary">{studentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">badge</span>
                    DNI:
                  </span>
                  <span className="font-mono text-on-surface">{studentDni}</span>
                </div>
                <div className="flex items-start justify-between pt-1 border-t border-surface-container-high/40">
                  <span className="text-on-surface-variant flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-[15px] text-secondary">
                      location_on
                    </span>
                    Punto:
                  </span>
                  <span className="font-semibold text-primary text-right">
                    Mesa de Geografía • Sala de Profesores
                  </span>
                </div>
              </div>

              {/* Desglose de Costos */}
              <div className="flex flex-col gap-1.5 pt-1 text-xs">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Cuadernillo impreso + anillado</span>
                  <span className="font-bold text-on-surface">
                    $ {selectedCartilla.price.toLocaleString('es-AR')} ARS
                  </span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    Gastos de entrega escolar
                    <span className="material-symbols-outlined text-[13px] text-secondary">verified</span>
                  </span>
                  <span className="text-[10px] text-secondary font-bold bg-secondary-container px-2 py-0.5 rounded-full">
                    Bonificado ($0 ARS)
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 bg-surface-container-high/40 p-2.5 rounded-lg mt-1">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Total a abonar
                    </span>
                    <span className="text-[10px] text-secondary font-medium">
                      Sin comisiones adicionales
                    </span>
                  </div>
                  <span className="text-xl font-extrabold text-primary font-mono tracking-tight">
                    $ {selectedCartilla.price.toLocaleString('es-AR')}{' '}
                    <span className="text-xs font-semibold text-on-surface-variant">ARS</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Selección Forma de Pago */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-primary">Forma de pago</label>
                <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">lock</span> 100% Protegido
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Opción A: Mercado Pago */}
                <label
                  onClick={() => setPaymentMethod('Mercado Pago')}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'Mercado Pago'
                      ? 'bg-surface-container-lowest border-primary shadow-sm'
                      : 'bg-surface-container-low border-surface-container-high opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">
                          account_balance_wallet
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-primary">Mercado Pago</span>
                          <span className="bg-secondary-container text-on-secondary-container text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Recomendado
                          </span>
                        </div>
                        <span className="text-[11px] text-secondary font-semibold">
                          Acreditación instantánea
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        paymentMethod === 'Mercado Pago'
                          ? 'bg-primary text-white'
                          : 'bg-surface-container text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant pl-11">
                    Aboná con saldo en cuenta, tarjeta de débito o crédito. Tu comprobante se valida en segundos.
                  </p>
                  <div className="pl-11 flex items-center gap-2 text-[10px] font-semibold text-outline">
                    <span className="bg-surface-container px-2 py-0.5 rounded text-primary flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">flash_on</span> Retiro prioritario
                    </span>
                    <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface-variant flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">credit_card</span> Cuotas disponibles
                    </span>
                  </div>
                </label>

                {/* Opción B: Efectivo al retirar */}
                <label
                  onClick={() => setPaymentMethod('Efectivo retiro')}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'Efectivo retiro'
                      ? 'bg-surface-container-lowest border-primary shadow-sm'
                      : 'bg-surface-container-low border-surface-container-high opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">payments</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">
                          Pagar en efectivo al retirar
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          Monto exacto en mano
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        paymentMethod === 'Efectivo retiro'
                          ? 'bg-primary text-white'
                          : 'bg-surface-container text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant pl-11">
                    Entregás los $ {selectedCartilla.price.toLocaleString('es-AR')} ARS justos al docente en la Sala de Profesores al momento de retirar tu ejemplar.
                  </p>
                  <div className="pl-11">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-0.5 rounded">
                      <span className="material-symbols-outlined text-[12px]">schedule</span> Reserva activa por 7 días hábiles
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Aviso de Protocolo Escolar */}
            <div className="w-full bg-surface-container-high/60 rounded-xl p-3.5 flex gap-3 items-start border border-surface-container-high shadow-xs">
              <div className="w-7 h-7 rounded-full bg-surface-container-highest flex-shrink-0 flex items-center justify-center text-primary mt-0.5">
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              </div>
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-bold text-primary">Protocolo de Retiro Inmediato</span>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Una vez confirmado, se emitirá automáticamente tu <strong>Código Token de Retiro (#GEO)</strong> con código QR para mostrar desde el celular frente al docente responsable.
                </p>
              </div>
            </div>

            {/* Submit button bar */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                type="button"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>Procesando pedido...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>
                      {paymentMethod === 'Mercado Pago'
                        ? `Confirmar y Pagar • $ ${selectedCartilla.price.toLocaleString('es-AR')} ARS`
                        : `Reservar cartilla • Pago al retirar`}
                    </span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1 text-[10px] text-outline font-semibold">
                <span className="material-symbols-outlined text-[13px] text-secondary">verified_user</span>
                <span>Transacción escolar segura • Ciclo Lectivo 2025</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MIS PEDIDOS (Retiro Vouchers) */}
        {activeTab === 'mis-pedidos' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-primary">Mis Pedidos</h1>
                <p className="text-xs text-on-surface-variant">
                  Comprobantes y códigos digitales para retirar en el colegio
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                {orders.length} pedidos
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-surface-container-lowest p-8 rounded-xl text-center border border-surface-container-high flex flex-col items-center">
                <span className="material-symbols-outlined text-[36px] text-outline mb-2">
                  shopping_cart
                </span>
                <p className="text-sm font-bold text-primary">No tenés pedidos activos aún</p>
                <button
                  onClick={() => setActiveTab('catalogo')}
                  className="mt-3 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold"
                >
                  Ver Catálogo de Cartillas
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order) => {
                  const isReady = order.deliveryStatus === 'Listo para retirar';
                  const isDelivered = order.deliveryStatus === 'Entregado';

                  return (
                    <div
                      key={order.id}
                      className="ticket-perforated rounded-2xl p-4 shadow-md border border-surface-container-high/80 flex flex-col gap-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-dashed border-outline-variant/60">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                            Código de Retiro
                          </span>
                          <span className="font-mono text-base font-extrabold text-primary">
                            {order.code}
                          </span>
                        </div>
                        {isReady ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Listo para retirar
                          </span>
                        ) : isDelivered ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check</span>
                            Entregado
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                            Pendiente de pago
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div className="col-span-2 flex flex-col gap-0.5">
                          <h3 className="text-xs font-bold text-primary leading-tight">
                            {order.cartillaTitle}
                          </h3>
                          <p className="text-[11px] text-on-surface-variant">
                            {order.school} • {order.year}
                          </p>
                          <div className="mt-1 text-[11px] text-outline">
                            Alumno: <strong className="text-on-surface">{order.studentName}</strong>
                          </div>
                          <div className="text-[10px] text-secondary font-semibold">
                            {order.pickupLocation}
                          </div>
                        </div>

                        {/* Simulated QR Code for scanning */}
                        <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-surface-container-low rounded-xl border border-surface-container-high/60">
                          <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-xs p-1">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                              <rect x="10" y="10" width="30" height="30" rx="3" fill="currentColor" />
                              <rect x="60" y="10" width="30" height="30" rx="3" fill="currentColor" />
                              <rect x="10" y="60" width="30" height="30" rx="3" fill="currentColor" />
                              <rect x="17" y="17" width="16" height="16" fill="white" />
                              <rect x="67" y="17" width="16" height="16" fill="white" />
                              <rect x="17" y="67" width="16" height="16" fill="white" />
                              <circle cx="25" cy="25" r="4" fill="currentColor" />
                              <circle cx="75" cy="25" r="4" fill="currentColor" />
                              <circle cx="25" cy="75" r="4" fill="currentColor" />
                              <rect x="55" y="55" width="15" height="15" fill="currentColor" />
                              <rect x="75" y="75" width="15" height="15" fill="currentColor" />
                              <rect x="55" y="75" width="10" height="15" fill="currentColor" />
                            </svg>
                          </div>
                          <span className="text-[9px] text-outline font-mono mt-1">Escanear</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-surface-container-high/40 flex justify-between items-center text-xs">
                        <span className="text-outline">
                          {order.paymentMethod} •{' '}
                          <strong className="text-primary font-mono">
                            ${order.price.toLocaleString('es-AR')}
                          </strong>
                        </span>
                        <button
                          onClick={() => window.print()}
                          className="text-secondary font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">print</span>
                          <span>Comprobante</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MI PERFIL */}
        {activeTab === 'mi-perfil' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high/60 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mb-2 shadow-sm">
                {studentName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <h2 className="text-lg font-bold text-primary">{studentName}</h2>
              <span className="text-xs text-outline font-mono">DNI {studentDni}</span>
              <span className="mt-1 px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                {studentYear}
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high/60 flex flex-col gap-3 text-xs">
              <h3 className="font-bold text-primary uppercase text-[11px] tracking-wider">
                Datos Institucionales
              </h3>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-outline">Colegio</span>
                <span className="font-semibold text-on-surface">{studentSchool}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-outline">Email</span>
                <span className="font-semibold text-on-surface">{studentEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-outline">Teléfono tutor</span>
                <span className="font-semibold text-on-surface">{studentPhone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-outline">Punto de retiro</span>
                <span className="font-semibold text-secondary">Mesa de Geografía (Sala Docente)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('auth')}
                className="w-full h-10 rounded-lg bg-surface-container text-primary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">switch_account</span>
                <span>Cambiar de cuenta / Registro</span>
              </button>
              <button
                onClick={onSwitchToTeacher}
                className="w-full h-10 rounded-lg bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>Ir al Panel de Administración Docente</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Success Modal after placing order */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-surface-variant rounded-full mb-3 sm:hidden" />
            <div className="w-14 h-14 rounded-full bg-secondary-container text-secondary flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              ¡Pedido Confirmado con Éxito!
            </span>
            <h3 className="text-lg font-bold text-primary mt-1">Listo para retirar</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              Guardamos tu ejemplar de <strong>{confirmedOrder.cartillaTitle}</strong> en la Sala de Profesores.
            </p>

            {/* Perforated voucher token */}
            <div className="w-full ticket-perforated bg-surface-container-high rounded-xl p-4 my-4 flex flex-col gap-2 text-left border border-outline-variant/30">
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-outline-variant/50">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                    Comprobante de Retiro
                  </span>
                  <span className="text-xl font-extrabold text-primary font-mono">
                    {confirmedOrder.code}
                  </span>
                </div>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[24px] text-primary">qr_code</span>
                </div>
              </div>

              <div className="pt-1 text-xs text-on-surface-variant flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <span>Titular:</span>
                  <strong className="text-primary">{confirmedOrder.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ubicación:</span>
                  <strong className="text-primary">{confirmedOrder.pickupLocation}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <strong className="text-secondary">{confirmedOrder.paymentStatus}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setConfirmedOrder(null);
                setActiveTab('mis-pedidos');
              }}
              className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              Ver en Mis Pedidos
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Matching prompt HTML!) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container-high shadow-[0_-2px_12px_rgba(0,32,69,0.05)]">
        <div className="flex justify-around items-center h-15 px-2">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 cursor-pointer transition-colors ${
              activeTab === 'catalogo'
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <span className="text-[10px] tracking-tight mt-0.5">Catálogo</span>
          </button>

          <button
            onClick={() => setActiveTab('mi-pedido')}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 cursor-pointer transition-colors ${
              activeTab === 'mi-pedido'
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            <span className="text-[10px] tracking-tight mt-0.5">Mi Pedido</span>
          </button>

          <button
            onClick={() => setActiveTab('mis-pedidos')}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 cursor-pointer transition-colors ${
              activeTab === 'mis-pedidos'
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span className="text-[10px] tracking-tight mt-0.5">Mis Pedidos</span>
          </button>

          <button
            onClick={() => setActiveTab('mi-perfil')}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 cursor-pointer transition-colors ${
              activeTab === 'mi-perfil'
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span className="text-[10px] tracking-tight mt-0.5">Mi Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
