import React from 'react';
import { useDemo } from '../store/demoStore.tsx';
import { computeOrderMetrics, lowStockCartillas } from '../lib/metrics.ts';
import { CURRENT_TERM } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { ConfirmDialog } from './ui/ConfirmDialog.tsx';

export type TeacherTab = 'resumen' | 'pedidos' | 'cartillas' | 'colegios' | 'entregas';

interface SidebarTeacherProps {
  activeTab: TeacherTab;
  onTabChange: (tab: TeacherTab) => void;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  onSwitchToStudent: () => void;
}

/** Logo geométrico de GeoCartillas. */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="8" width="14" height="24" rx="2" fill="#2563eb" />
    <rect x="22" y="8" width="14" height="24" rx="2" fill="#10b981" />
    <path d="M7 16H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 22H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="29" cy="20" r="5" stroke="white" strokeWidth="2" />
    <path d="M29 15V25M24 20H34" stroke="white" strokeWidth="1.5" />
  </svg>
);

export const SidebarTeacher: React.FC<SidebarTeacherProps> = ({
  activeTab,
  onTabChange,
  mobileMenuOpen = false,
  onCloseMobileMenu,
  onSwitchToStudent,
}) => {
  const { state, dispatch } = useDemo();
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  const metrics = computeOrderMetrics(state.orders);
  const lowStock = lowStockCartillas(state.cartillas).length;
  const readyToPickup = metrics.readyCount;

  const items: {
    id: TeacherTab;
    label: string;
    icon: string;
    badge?: number;
    badgeTone?: 'alert' | 'neutral';
  }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'insights' },
    { id: 'pedidos', label: 'Pedidos', icon: 'receipt_long', badge: metrics.total, badgeTone: 'neutral' },
    {
      id: 'entregas',
      label: 'Entregas',
      icon: 'local_shipping',
      badge: readyToPickup || undefined,
      badgeTone: 'alert',
    },
    {
      id: 'cartillas',
      label: 'Cartillas',
      icon: 'auto_stories',
      badge: lowStock || undefined,
      badgeTone: 'alert',
    },
    { id: 'colegios', label: 'Colegios', icon: 'school', badge: state.schools.length, badgeTone: 'neutral' },
  ];

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-40 lg:hidden no-print"
          onClick={onCloseMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 lg:translate-x-0 no-print ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Navegación principal"
      >
        <div className="flex flex-col min-h-0">
          <div className="h-20 px-6 flex items-center justify-between border-b border-surface-container-high/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm overflow-hidden p-1.5 shrink-0">
                <BrandMark />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-primary leading-tight tracking-tight">
                  GeoCartillas
                </span>
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                  Panel Docente
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
              aria-label="Cerrar menú"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="px-4 py-3 shrink-0">
            <div className="bg-surface-container-low rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Gestión Editorial
              </span>
              <span className="text-xs text-secondary font-extrabold bg-secondary-container px-2 py-0.5 rounded-full">
                {CURRENT_TERM}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 pt-2 overflow-y-auto">
            {items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobileMenu?.();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={item.icon} size={20} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-secondary text-on-secondary'
                          : item.badgeTone === 'alert'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                            : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mx-4 mt-6 p-3 bg-surface-container-low rounded-xl border border-surface-container-high/60 shrink-0">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <Icon name="map" size={16} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {state.teacher?.name.replace('Prof. ', 'Cátedra ') ?? 'Cátedra de Geografía'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mesa de Geografía activa en Sala de Profesores para retiro con DNI o comprobante digital.
            </p>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2 shrink-0">
          <button
            onClick={onSwitchToStudent}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
          >
            <Icon name="smartphone" size={18} />
            <span>Ver Portal del Alumno</span>
          </button>

          <div className="h-px w-full bg-surface-container-high my-1" />

          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors text-xs font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
            type="button"
          >
            <Icon name="logout" size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Cerrar sesión"
        message="Vas a salir del panel docente y volver a la pantalla de acceso. Los datos de la demo se conservan."
        confirmLabel="Cerrar sesión"
        tone="primary"
        onConfirm={() => dispatch({ type: 'LOGOUT', scope: 'teacher' })}
        onClose={() => setConfirmLogout(false)}
      />
    </>
  );
};
