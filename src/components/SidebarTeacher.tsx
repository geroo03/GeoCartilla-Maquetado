import React from 'react';

interface SidebarTeacherProps {
  activeTab: 'pedidos' | 'cartillas' | 'colegios';
  onTabChange: (tab: 'pedidos' | 'cartillas' | 'colegios') => void;
  ordersCount: number;
  onSwitchToStudent: () => void;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const SidebarTeacher: React.FC<SidebarTeacherProps> = ({
  activeTab,
  onTabChange,
  ordersCount,
  onSwitchToStudent,
  mobileMenuOpen = false,
  onCloseMobileMenu,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Header Brand */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-surface-container-high/40">
            <div className="flex items-center gap-3">
              {/* Geometric GeoCartillas Icon Logo */}
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm overflow-hidden p-1.5 shrink-0">
                <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-white">
                  <rect x="4" y="8" width="14" height="24" rx="2" fill="#2563eb" />
                  <rect x="22" y="8" width="14" height="24" rx="2" fill="#10b981" />
                  <path d="M7 16H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7 22H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="29" cy="20" r="5" stroke="white" strokeWidth="2" />
                  <path d="M29 15V25M24 20H34" stroke="white" strokeWidth="1.5" />
                </svg>
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

            {/* Mobile close button */}
            <button
              onClick={onCloseMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Academic Term Tag */}
          <div className="px-4 py-3">
            <div className="bg-surface-container-low rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Gestión Editorial
              </span>
              <span className="text-xs text-secondary font-extrabold bg-secondary-container px-2 py-0.5 rounded-full">
                2025
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-4 pt-2">
            <button
              onClick={() => {
                onTabChange('pedidos');
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                activeTab === 'pedidos'
                  ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                <span className="text-sm">Pedidos</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'pedidos'
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {ordersCount}
              </span>
            </button>

            <button
              onClick={() => {
                onTabChange('cartillas');
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                activeTab === 'cartillas'
                  ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">auto_stories</span>
              <span className="text-sm">Cartillas</span>
            </button>

            <button
              onClick={() => {
                onTabChange('colegios');
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left cursor-pointer ${
                activeTab === 'colegios'
                  ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">school</span>
              <span className="text-sm">Colegios</span>
            </button>
          </nav>

          {/* Quick Context Box for Geography Teacher */}
          <div className="mx-4 mt-6 p-3 bg-surface-container-low rounded-xl border border-surface-container-high/60">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Cátedra Gómez</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mesa de Geografía activa en Sala de Profesores para retiro con DNI o comprobante digital.
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 flex flex-col gap-2">
          {/* Switch to Student Portal button */}
          <button
            onClick={onSwitchToStudent}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">smartphone</span>
            <span>Ver Portal del Alumno</span>
          </button>

          <div className="h-px w-full bg-surface-container-high my-1" />

          <button
            onClick={() => {
              if (window.confirm('¿Deseas cerrar la sesión del docente y ver el portal de alumnos?')) {
                onSwitchToStudent();
              }
            }}
            className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors text-xs font-semibold cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
