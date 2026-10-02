import React, { useState } from 'react';
import type { Notification } from '../types/index.ts';
import { useDemo } from '../store/demoStore.tsx';
import { initials } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { NotificationsPanel } from './NotificationsPanel.tsx';
import type { TeacherTab } from './SidebarTeacher.tsx';

/** Título y placeholder de búsqueda según la pestaña activa. */
const TAB_META: Record<TeacherTab, { title: string; searchPlaceholder: string }> = {
  resumen: {
    title: 'Resumen del ciclo',
    searchPlaceholder: 'Buscar en el resumen...',
  },
  pedidos: {
    title: 'Pedidos',
    searchPlaceholder: 'Buscar por alumno, DNI, código o cartilla...',
  },
  entregas: {
    title: 'Entregas',
    searchPlaceholder: 'Buscar colegio o alumno...',
  },
  cartillas: {
    title: 'Cartillas',
    searchPlaceholder: 'Buscar por título, código o colegio...',
  },
  colegios: {
    title: 'Colegios',
    searchPlaceholder: 'Buscar por nombre, dirección o coordinador...',
  },
};

interface HeaderTeacherProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: TeacherTab;
  notifications: Notification[];
  unread: number;
  onOpenOrder?: (orderId: string) => void;
}

export const HeaderTeacher: React.FC<HeaderTeacherProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  notifications,
  unread,
  onOpenOrder,
}) => {
  const { state } = useDemo();
  const [showNotifications, setShowNotifications] = useState(false);
  const teacher = state.teacher;
  const meta = TAB_META[activeTab];

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-72 z-30 h-20 px-4 sm:px-6 lg:px-8 bg-surface/80 backdrop-blur-md border-b border-surface-container-high/50 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <h1 className="hidden xl:block text-sm font-bold text-primary whitespace-nowrap pl-10 lg:pl-0">
          {meta.title}
        </h1>

        <label className="relative flex items-center flex-1 max-w-md min-w-0 pl-10 lg:pl-0">
          <span className="sr-only">{meta.searchPlaceholder}</span>
          <Icon
            name="search"
            size={18}
            className="absolute left-13 lg:left-3 text-outline pointer-events-none"
          />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={meta.searchPlaceholder}
            className="w-full h-10 pl-10 pr-9 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            type="search"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 w-6 h-6 rounded-full flex items-center justify-center text-outline hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
              aria-label="Limpiar búsqueda"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowNotifications((open) => !open)}
            className="relative w-10 h-10 rounded-lg bg-surface-container-lowest border border-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
            aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}
            aria-expanded={showNotifications}
          >
            <Icon name="notifications" size={20} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationsPanel
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onOpenOrder={onOpenOrder}
            />
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-surface-container-high">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs font-bold text-on-surface whitespace-nowrap">
              {teacher?.name ?? 'Docente'}
            </span>
            <span className="text-[10px] text-outline whitespace-nowrap">
              {teacher?.role ?? 'Sesión activa'}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[11px] font-extrabold shrink-0"
            title={teacher?.email}
          >
            {initials(teacher?.name ?? 'GC')}
          </div>
        </div>
      </div>
    </header>
  );
};
