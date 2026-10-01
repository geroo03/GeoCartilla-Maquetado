import React, { useState } from 'react';
import { Cartilla, Order, School } from './types/index.ts';
import {
  INITIAL_CARTILLAS,
  INITIAL_ORDERS,
  INITIAL_SCHOOLS,
} from './data/mockData.ts';
import { HeaderTeacher } from './components/HeaderTeacher.tsx';
import { SidebarTeacher } from './components/SidebarTeacher.tsx';
import { OrdersView } from './components/OrdersView.tsx';
import { BookletsView } from './components/BookletsView.tsx';
import { SchoolsView } from './components/SchoolsView.tsx';
import { OrderDetailDrawer } from './components/OrderDetailDrawer.tsx';
import { ConfirmDeliveryModal } from './components/ConfirmDeliveryModal.tsx';
import { ManualOrderModal } from './components/ManualOrderModal.tsx';
import { PrintSheetModal } from './components/PrintSheetModal.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';

export default function App() {
  // Main mode: 'teacher' or 'student'
  const [appMode, setAppMode] = useState<'teacher' | 'student'>('teacher');

  // Teacher navigation: 'pedidos' | 'cartillas' | 'colegios'
  const [teacherTab, setTeacherTab] = useState<'pedidos' | 'cartillas' | 'colegios'>('pedidos');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global state for live data reactivity
  const [cartillas, setCartillas] = useState<Cartilla[]>(INITIAL_CARTILLAS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [schools, setSchools] = useState<School[]>(INITIAL_SCHOOLS);

  // Search query in teacher header
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawer state
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<Order | null>(null);
  const [selectedOrderForConfirm, setSelectedOrderForConfirm] = useState<Order | null>(null);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Handlers for orders
  const handleMarkPaid = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: 'Pagado',
              deliveryStatus: o.deliveryStatus === 'Preparado' ? 'Listo para retirar' : o.deliveryStatus,
            }
          : o
      )
    );
    if (selectedOrderForDrawer && selectedOrderForDrawer.id === orderId) {
      setSelectedOrderForDrawer((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: 'Pagado',
              deliveryStatus: prev.deliveryStatus === 'Preparado' ? 'Listo para retirar' : prev.deliveryStatus,
            }
          : null
      );
    }
    showToast('¡Pago de $8.000 ARS registrado y conciliado!');
  };

  const handleDeliver = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              deliveryStatus: 'Entregado',
              paymentStatus: 'Pagado',
            }
          : o
      )
    );
    if (selectedOrderForDrawer && selectedOrderForDrawer.id === orderId) {
      setSelectedOrderForDrawer((prev) =>
        prev
          ? {
              ...prev,
              deliveryStatus: 'Entregado',
              paymentStatus: 'Pagado',
            }
          : null
      );
    }
    showToast('¡Cartilla entregada con éxito en Sala de Profesores!');
  };

  const handleBulkDeliver = (orderIds: string[]) => {
    setOrders((prev) =>
      prev.map((o) =>
        orderIds.includes(o.id)
          ? {
              ...o,
              deliveryStatus: 'Entregado',
              paymentStatus: 'Pagado',
            }
          : o
      )
    );
    showToast(`¡${orderIds.length} cartillas marcadas como entregadas!`);
  };

  const handleAddOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Nuevo pedido ${newOrder.code} registrado para ${newOrder.studentName}`);
  };

  // Handlers for cartillas
  const handleToggleCartillaActive = (id: string) => {
    setCartillas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
    showToast('Visibilidad de la cartilla actualizada');
  };

  const handleAddCartilla = (newCartilla: Cartilla) => {
    setCartillas((prev) => [newCartilla, ...prev]);
    showToast(`Cartilla "${newCartilla.title}" agregada al catálogo.`);
  };

  const handleAddSchool = (newSchool: School) => {
    setSchools((prev) => [...prev, newSchool]);
    showToast(`Colegio "${newSchool.name}" adscripto.`);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-secondary text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-outline-variant hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating View Switcher Bar (Quickly toggle between Teacher Desktop & Student Mobile) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary-container/95 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-2xl border border-primary-fixed/30 flex items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold text-on-primary-container px-2 hidden sm:inline">
          Vista actual:
        </span>
        <button
          onClick={() => setAppMode('teacher')}
          className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            appMode === 'teacher'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-primary-container hover:text-white'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
          <span>Panel Docente</span>
        </button>

        <button
          onClick={() => setAppMode('student')}
          className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            appMode === 'student'
              ? 'bg-secondary text-on-secondary shadow-sm'
              : 'text-on-primary-container hover:text-white'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">smartphone</span>
          <span>Portal Alumno</span>
        </button>
      </div>

      {/* VIEW A: TEACHER DASHBOARD */}
      {appMode === 'teacher' && (
        <div className="flex min-h-screen">
          {/* Mobile hamburger menu toggle */}
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-surface-container-lowest text-primary shadow-sm border border-surface-container-high"
              type="button"
              aria-label="Abrir menú docente"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>

          {/* Desktop & Mobile Sidebar */}
          <SidebarTeacher
            activeTab={teacherTab}
            onTabChange={(tab) => setTeacherTab(tab)}
            ordersCount={orders.length}
            onSwitchToStudent={() => setAppMode('student')}
            mobileMenuOpen={mobileSidebarOpen}
            onCloseMobileMenu={() => setMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
            <HeaderTeacher
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenNotifications={() =>
                showToast('Notificación: La remesa #41 de Geografía 5° llega el jueves a las 09:30 hs.')
              }
              activeTab={teacherTab}
            />

            <main className="relative pt-24 px-4 sm:px-6 lg:px-8 pb-20 bg-background flex-1 w-full">
              {teacherTab === 'pedidos' && (
                <OrdersView
                  orders={orders}
                  onSelectOrder={(order) => setSelectedOrderForDrawer(order)}
                  onOpenConfirmDelivery={(order) => setSelectedOrderForConfirm(order)}
                  onOpenManualOrder={() => setIsManualOrderOpen(true)}
                  onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
                  onBulkDeliver={handleBulkDeliver}
                  searchQuery={searchQuery}
                />
              )}

              {teacherTab === 'cartillas' && (
                <BookletsView
                  cartillas={cartillas}
                  schools={schools}
                  onToggleActive={handleToggleCartillaActive}
                  onAddCartilla={handleAddCartilla}
                />
              )}

              {teacherTab === 'colegios' && (
                <SchoolsView schools={schools} onAddSchool={handleAddSchool} />
              )}
            </main>
          </div>

          {/* Modals and Drawer */}
          <OrderDetailDrawer
            order={selectedOrderForDrawer}
            isOpen={!!selectedOrderForDrawer}
            onClose={() => setSelectedOrderForDrawer(null)}
            onMarkPaid={handleMarkPaid}
            onDeliver={handleDeliver}
          />

          <ConfirmDeliveryModal
            order={selectedOrderForConfirm}
            isOpen={!!selectedOrderForConfirm}
            onClose={() => setSelectedOrderForConfirm(null)}
            onConfirm={handleDeliver}
          />

          <ManualOrderModal
            isOpen={isManualOrderOpen}
            onClose={() => setIsManualOrderOpen(false)}
            cartillas={cartillas}
            onAddOrder={handleAddOrder}
          />

          <PrintSheetModal
            isOpen={isPrintSheetOpen}
            onClose={() => setIsPrintSheetOpen(false)}
            orders={orders}
          />
        </div>
      )}

      {/* VIEW B: STUDENT PORTAL (MOBILE-OPTIMIZED INTERFACE) */}
      {appMode === 'student' && (
        <div className="min-h-screen bg-surface-container-low/60 flex items-center justify-center p-0 sm:py-6">
          <StudentPortal
            cartillas={cartillas}
            orders={orders}
            onPlaceOrder={handleAddOrder}
            onSwitchToTeacher={() => setAppMode('teacher')}
          />
        </div>
      )}
    </div>
  );
}
