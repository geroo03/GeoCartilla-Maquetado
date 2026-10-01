import React from 'react';
import { TEACHER_PROFILE } from '../data/mockData.ts';

interface HeaderTeacherProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNotifications?: () => void;
  activeTab: string;
}

export const HeaderTeacher: React.FC<HeaderTeacherProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  activeTab,
}) => {
  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-6 transition-all duration-200">
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant shrink-0">
          <span className="text-xs text-outline font-medium">Panel</span>
          <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_right</span>
          <span className="text-xs font-semibold text-on-surface capitalize">
            {activeTab === 'pedidos' ? 'Gestión de Pedidos' : activeTab === 'cartillas' ? 'Catálogo' : 'Colegios'}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-secondary-container px-3 py-1 rounded-full shrink-0">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-bold text-on-secondary-container tracking-tight">
            Ciclo Lectivo 2025
          </span>
        </div>

        <div className="relative max-w-xs w-full hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
            placeholder="Buscar por alumno, DNI o pedido..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-[14px]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          title="Notificaciones de remesas y pagos"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-tertiary-container ring-2 ring-surface" />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-surface-container-high">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-bold text-on-surface leading-tight">
              {TEACHER_PROFILE.name}
            </span>
            <span className="text-[11px] text-outline leading-tight">
              {TEACHER_PROFILE.role}
            </span>
          </div>
          <div className="relative">
            <img
              alt="Prof. Martín Gómez"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20 shadow-xs"
              src={TEACHER_PROFILE.avatar}
              onError={(e) => {
                // Fallback to stylized initial if external image fails
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent && !parent.querySelector('.fallback-avatar')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs fallback-avatar';
                  fallback.innerText = 'MG';
                  parent.appendChild(fallback);
                }
              }}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-surface" />
          </div>
        </div>
      </div>
    </header>
  );
};
