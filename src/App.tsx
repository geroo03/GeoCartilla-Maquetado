import React, { useEffect, useMemo, useState } from 'react';
import type { Order } from './types/index.ts';
import { DemoProvider, useDemo } from './store/demoStore.tsx';
import { computeOrderMetrics, notificationsFor, unreadCount } from './lib/metrics.ts';
import { HeaderTeacher } from './components/HeaderTeacher.tsx';
import { SidebarTeacher, type TeacherTab } from './components/SidebarTeacher.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { OrdersView } from './components/OrdersView.tsx';
import { BookletsView } from './components/BookletsView.tsx';
import { SchoolsView } from './components/SchoolsView.tsx';
import { DeliveriesView } from './components/DeliveriesView.tsx';
import { OrderDetailDrawer } from './components/OrderDetailDrawer.tsx';
import { ConfirmDeliveryModal } from './components/ConfirmDeliveryModal.tsx';
import { ManualOrderModal } from './components/ManualOrderModal.tsx';
import { PrintSheetModal } from './components/PrintSheetModal.tsx';
import { LoginTeacher } from './components/LoginTeacher.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';
import { DemoGuide } from './components/DemoGuide.tsx';
import { WelcomeOverlay } from './components/WelcomeOverlay.tsx';
import { ToastStack } from './components/ui/ToastStack.tsx';
import { Icon } from './components/ui/Icon.tsx';

export type AppMode = 'teacher' | 'student';

/** Contexto ligero para que las vistas abran modales sin prop drilling. */
interface ShellActions {
  openOrder: (order: Order) => void;
  confirmDelivery: (order: Order) => void;
  openManualOrder: () => void;
  openPrintSheet: (schoolCode?: string) => void;
  goToTab: (tab: TeacherTab) => void;
  switchMode: (mode: AppMode) => void;
}

const ShellContext = React.createContext<ShellActions | null>(null);

export function useShell(): ShellActions {
  const ctx = React.useContext(ShellContext);
  if (!ctx) throw new Error('useShell debe usarse dentro de <App>');
  return ctx;
}

/** Barra flotante para alternar entre las dos vistas de la demo. */
function ViewSwitcher({
  mode,
  onChange,
}: {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}) {
  return (
    <div
      className={`fixed bottom-(--fab-bottom) left-1/2 -translate-x-1/2 z-50 bg-primary-container/95 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-2xl border border-primary-fixed/30 flex items-center gap-2 text-xs no-print`}
    >
      <span className="text-[11px] font-semibold text-on-primary-container px-2 hidden sm:inline">
        Vista actual:
      </span>
      {(
        [
          { id: 'teacher' as const, label: 'Panel Docente', icon: 'desktop_windows' },
          { id: 'student' as const, label: 'Portal Alumno', icon: 'smartphone' },
        ]
      ).map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-fixed-dim ${
            mode === option.id
              ? option.id === 'student'
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'bg-white text-primary shadow-sm'
              : 'text-on-primary-container hover:text-white'
          }`}
          type="button"
          aria-pressed={mode === option.id}
        >
          <Icon name={option.icon} size={16} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function AppShell() {
  const { state, dispatch, persistenceBlocked } = useDemo();

  const [appMode, setAppMode] = useState<AppMode>('teacher');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('resumen');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Guarda el nombre a saludar, no un booleano "ya inicio sesion": la sesion
  // queda en localStorage, asi que atarlo al estado haria que la bienvenida
  // se repitiera en cada refresh.
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [orderForDrawer, setOrderForDrawer] = useState<Order | null>(null);
  const [orderForConfirm, setOrderForConfirm] = useState<Order | null>(null);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [printSheetSchool, setPrintSheetSchool] = useState<string | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // El drawer refleja la versión viva del pedido: si se cobra o entrega desde
  // adentro, el panel se actualiza sin cerrarse.
  const liveOrderForDrawer = useMemo(
    () => (orderForDrawer ? state.orders.find((o) => o.id === orderForDrawer.id) ?? null : null),
    [orderForDrawer, state.orders],
  );

  const teacherNotifications = useMemo(
    () => notificationsFor(state.notifications, 'docente'),
    [state.notifications],
  );

  // Solo hace falta cuando la bienvenida esta en pantalla.
  const welcomeMetrics = useMemo(
    () => (welcomeName ? computeOrderMetrics(state.orders) : null),
    [welcomeName, state.orders],
  );

  // Al cambiar de pestaña el buscador global arranca limpio.
  useEffect(() => {
    setSearchQuery('');
  }, [teacherTab]);

  const actions = useMemo<ShellActions>(
    () => ({
      openOrder: (order) => setOrderForDrawer(order),
      confirmDelivery: (order) => setOrderForConfirm(order),
      openManualOrder: () => setIsManualOrderOpen(true),
      openPrintSheet: (schoolCode) => {
        setPrintSheetSchool(schoolCode ?? null);
        setIsPrintSheetOpen(true);
      },
      goToTab: (tab) => setTeacherTab(tab),
      switchMode: (mode) => setAppMode(mode),
    }),
    [],
  );

  const showTeacherLogin = appMode === 'teacher' && !state.teacher;

  return (
    <ShellContext.Provider value={actions}>
      <div
        className="min-h-screen bg-background font-sans text-on-surface antialiased"
        // Línea de base de los controles flotantes (switcher, guía, toasts).
        // El portal del alumno tiene una barra inferior fija de 60px que, por
        // ser fixed, está pegada al borde de la ventana en TODOS los anchos:
        // no alcanza con subir los flotantes sólo en pantallas chicas.
        style={{ '--fab-bottom': appMode === 'student' ? '5rem' : '1rem' } as React.CSSProperties}
      >
        <ToastStack />

        {persistenceBlocked && (
          <div className="fixed top-0 inset-x-0 z-[70] bg-tertiary-container text-on-tertiary-container px-4 py-2 text-[11px] font-semibold flex items-center justify-center gap-2 no-print">
            <Icon name="warning" size={16} />
            No se puede guardar en este navegador (ventana privada o cookies bloqueadas): los cambios se
            pierden al refrescar.
          </div>
        )}

        {!showTeacherLogin && (
          <ViewSwitcher mode={appMode} onChange={setAppMode} />
        )}
        {!showTeacherLogin && (
          <DemoGuide
            mode={appMode}
            onSwitchMode={setAppMode}
            onGoToTab={setTeacherTab}
          />
        )}

        {welcomeName && welcomeMetrics && (
          <WelcomeOverlay
            name={welcomeName}
            readyCount={welcomeMetrics.readyCount}
            pendingCount={welcomeMetrics.pendingCount}
            onDone={() => setWelcomeName(null)}
          />
        )}

        {showTeacherLogin && (
          <LoginTeacher
            onLogin={(session) => {
              dispatch({ type: 'LOGIN_TEACHER', session });
              setWelcomeName(session.name);
            }}
            onPreviewStudent={() => setAppMode('student')}
          />
        )}

        {appMode === 'teacher' && state.teacher && (
          <div className="flex min-h-screen">
            <div className="lg:hidden fixed top-4 left-4 z-40 no-print">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg bg-surface-container-lowest text-primary shadow-sm border border-surface-container-high focus-visible:outline-2 focus-visible:outline-primary"
                type="button"
                aria-label="Abrir menú docente"
              >
                <Icon name="menu" size={24} />
              </button>
            </div>

            <SidebarTeacher
              activeTab={teacherTab}
              onTabChange={setTeacherTab}
              mobileMenuOpen={mobileSidebarOpen}
              onCloseMobileMenu={() => setMobileSidebarOpen(false)}
              onSwitchToStudent={() => setAppMode('student')}
            />

            {/*
              min-w-0 es necesario: sin eso el contenedor es un item flex con
              min-width auto y no puede encogerse por debajo del ancho de su
              contenido, lo que generaba scroll horizontal en pantallas chicas.
            */}
            <div className="flex-1 min-w-0 lg:pl-72 flex flex-col min-h-screen">
              <HeaderTeacher
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeTab={teacherTab}
                notifications={teacherNotifications}
                unread={unreadCount(teacherNotifications)}
                onOpenOrder={(orderId) => {
                  const order = state.orders.find((o) => o.id === orderId);
                  if (order) {
                    setTeacherTab('pedidos');
                    setOrderForDrawer(order);
                  }
                }}
              />

              <main className="relative pt-24 px-4 sm:px-6 lg:px-8 pb-24 bg-background flex-1 w-full min-w-0 overflow-x-hidden">
                {teacherTab === 'resumen' && <DashboardView />}
                {teacherTab === 'pedidos' && <OrdersView searchQuery={searchQuery} />}
                {teacherTab === 'cartillas' && <BookletsView searchQuery={searchQuery} />}
                {teacherTab === 'colegios' && <SchoolsView searchQuery={searchQuery} />}
                {teacherTab === 'entregas' && <DeliveriesView />}
              </main>
            </div>

            <OrderDetailDrawer
              order={liveOrderForDrawer}
              isOpen={!!liveOrderForDrawer}
              onClose={() => setOrderForDrawer(null)}
            />

            <ConfirmDeliveryModal
              order={orderForConfirm}
              isOpen={!!orderForConfirm}
              onClose={() => setOrderForConfirm(null)}
            />

            <ManualOrderModal
              isOpen={isManualOrderOpen}
              onClose={() => setIsManualOrderOpen(false)}
            />

            <PrintSheetModal
              isOpen={isPrintSheetOpen}
              onClose={() => setIsPrintSheetOpen(false)}
              schoolCode={printSheetSchool}
            />
          </div>
        )}

        {appMode === 'student' && (
          <div className="min-h-screen bg-surface-container-low/60 flex items-center justify-center p-0 sm:py-6">
            <StudentPortal onSwitchToTeacher={() => setAppMode('teacher')} />
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <AppShell />
    </DemoProvider>
  );
}
