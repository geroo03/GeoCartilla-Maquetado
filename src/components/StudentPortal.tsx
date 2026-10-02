import React, { useEffect, useMemo, useState } from 'react';
import type { Cartilla, Order } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { notificationsFor, unreadCount } from '../lib/metrics.ts';
import { formatARS } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { BrandMark } from './SidebarTeacher.tsx';
import { AuthTab } from './student/AuthTab.tsx';
import { CatalogTab } from './student/CatalogTab.tsx';
import { CheckoutTab } from './student/CheckoutTab.tsx';
import { MyOrdersTab } from './student/MyOrdersTab.tsx';
import { ProfileTab } from './student/ProfileTab.tsx';
import { OrderReceipt } from './OrderReceipt.tsx';

type StudentTab = 'catalogo' | 'mi-pedido' | 'mis-pedidos' | 'mi-perfil';

const TAB_TITLES: Record<StudentTab, string> = {
  catalogo: 'Catálogo escolar',
  'mi-pedido': 'Mi pedido',
  'mis-pedidos': 'Mis pedidos',
  'mi-perfil': 'Mi perfil',
};

const NAV: { id: StudentTab; label: string; icon: string }[] = [
  { id: 'catalogo', label: 'Catálogo', icon: 'menu_book' },
  { id: 'mi-pedido', label: 'Mi Pedido', icon: 'shopping_bag' },
  { id: 'mis-pedidos', label: 'Mis Pedidos', icon: 'receipt_long' },
  { id: 'mi-perfil', label: 'Mi Perfil', icon: 'account_circle' },
];

/**
 * Portal del alumno, en formato teléfono. Orquesta las pestañas; cada una vive
 * en su propio archivo bajo student/. El original era un solo componente de
 * 1.250 líneas con los datos del alumno escritos a mano.
 */
export const StudentPortal: React.FC<{ onSwitchToTeacher: () => void }> = ({ onSwitchToTeacher }) => {
  const { state, dispatch } = useDemo();
  const [activeTab, setActiveTab] = useState<StudentTab>('catalogo');
  const [selectedCartilla, setSelectedCartilla] = useState<Cartilla | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const student = state.student;

  const myNotifications = useMemo(
    () => notificationsFor(state.notifications, 'alumno', student?.dni),
    [state.notifications, student?.dni],
  );
  const unread = unreadCount(myNotifications);

  // Al salir de la sesión se vuelve al catálogo para la próxima entrada.
  useEffect(() => {
    if (!student) {
      setActiveTab('catalogo');
      setSelectedCartilla(null);
      setConfirmedOrder(null);
    }
  }, [student]);

  const shell = (children: React.ReactNode, title: string) => (
    <div
      className={
        // Deja aire abajo para la barra de navegación (60px) y, en pantallas
        // chicas, también para los controles flotantes de la demo, que si no
        // se comen el botón principal del checkout.
        'w-full max-w-md mx-auto bg-surface min-h-screen flex flex-col relative pb-36 sm:pb-24 shadow-2xl border-x border-surface-container-high/60'
      }
    >
      <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-surface-container-high/50 px-4 py-2.5 flex items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 p-1">
            <BrandMark />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider leading-none">
              GeoCartillas
            </span>
            <span className="text-base font-extrabold text-primary leading-tight truncate">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {student && (
            <button
              onClick={() => setActiveTab('mi-perfil')}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
              aria-label={`Novedades${unread ? `, ${unread} sin leer` : ''}`}
            >
              <Icon name="notifications" size={20} />
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-error text-on-error text-[9px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onSwitchToTeacher}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
            aria-label="Ir al panel docente"
            title="Ir al panel docente"
          >
            <Icon name="desktop_windows" size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      {student && (
        <nav
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container-high shadow-[0_-2px_12px_rgba(0,32,69,0.05)] no-print"
          aria-label="Navegación del portal"
        >
          <div className="flex justify-around items-center h-15 px-2">
            {NAV.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center min-w-[60px] py-1 cursor-pointer transition-colors rounded focus-visible:outline-2 focus-visible:outline-primary ${
                    isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <Icon name={item.icon} size={20} filled={isActive} />
                  <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );

  // Sin sesión: sólo registro / ingreso.
  if (!student) {
    return shell(<AuthTab onAuthenticated={(next) => dispatch({ type: 'LOGIN_STUDENT', student: next })} />, 'Acceso escolar');
  }

  // Pantalla de pedido confirmado.
  if (confirmedOrder) {
    return shell(
      <div className="flex flex-col items-center text-center gap-4 py-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
          <Icon name="check_circle" size={36} filled />
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-primary">¡Pedido confirmado!</h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
            {confirmedOrder.paymentStatus === 'Pagado'
              ? 'Ya está pago. Podés retirarlo presentando tu DNI.'
              : `Reservado. Abonás ${formatARS(confirmedOrder.price)} al retirarlo.`}
          </p>
        </div>

        <div className="w-full ticket-perforated rounded-xl border border-surface-container-high p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-dashed border-outline-variant/50">
            <div className="text-left min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-outline font-bold">
                Código
              </span>
              <span className="block text-lg font-extrabold font-mono text-primary">
                {confirmedOrder.code}
              </span>
            </div>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-xs shrink-0">
              <Icon name="qr_code" size={24} className="text-primary" />
            </div>
          </div>

          <div className="text-xs text-on-surface-variant flex flex-col gap-1">
            {[
              { label: 'Titular', value: confirmedOrder.studentName },
              { label: 'Cartilla', value: confirmedOrder.cartillaTitle },
              { label: 'Ubicación', value: confirmedOrder.pickupLocation },
              { label: 'Estado', value: confirmedOrder.paymentStatus },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-3">
                <span className="shrink-0">{row.label}:</span>
                <strong className="text-primary text-right min-w-0 truncate">{row.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <button
            onClick={() => setReceiptOpen(true)}
            className="w-full h-11 bg-surface-container text-primary rounded-xl font-bold text-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="receipt" size={18} />
            Ver comprobante
          </button>

          <button
            onClick={() => {
              setConfirmedOrder(null);
              setSelectedCartilla(null);
              setActiveTab('mis-pedidos');
            }}
            className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
          >
            Ver en Mis Pedidos
          </button>
        </div>

        <OrderReceipt
          order={confirmedOrder}
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
        />
      </div>,
      'Pedido confirmado',
    );
  }

  return shell(
    <>
      {activeTab === 'catalogo' && (
        <CatalogTab
          student={student}
          onChooseCartilla={(cartilla) => {
            setSelectedCartilla(cartilla);
            setActiveTab('mi-pedido');
          }}
          onUpdateStudent={(next) => dispatch({ type: 'UPDATE_STUDENT', student: next })}
        />
      )}

      {activeTab === 'mi-pedido' && (
        <CheckoutTab
          student={student}
          cartilla={selectedCartilla}
          onBackToCatalog={() => setActiveTab('catalogo')}
          onConfirmed={(order) => setConfirmedOrder(order)}
        />
      )}

      {activeTab === 'mis-pedidos' && (
        <MyOrdersTab student={student} onBackToCatalog={() => setActiveTab('catalogo')} />
      )}

      {activeTab === 'mi-perfil' && (
        <ProfileTab
          student={student}
          onSave={(next) => dispatch({ type: 'UPDATE_STUDENT', student: next })}
          onLogout={() => dispatch({ type: 'LOGOUT', scope: 'student' })}
        />
      )}
    </>,
    TAB_TITLES[activeTab],
  );
};
