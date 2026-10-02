import React, { useState } from 'react';
import { useDemo } from '../store/demoStore.tsx';
import { Icon } from './ui/Icon.tsx';
import { ConfirmDialog } from './ui/ConfirmDialog.tsx';
import type { TeacherTab } from './SidebarTeacher.tsx';
import type { AppMode } from '../App.tsx';

interface Step {
  title: string;
  detail: string;
  mode: AppMode;
  tab?: TeacherTab;
}

const STEPS: Step[] = [
  {
    title: 'El alumno pide su cartilla',
    detail:
      'En el portal, registrate o entrá, elegí tu colegio y año, y pedí una cartilla. Probá pagando con Mercado Pago y después con efectivo: el estado del pedido cambia distinto.',
    mode: 'student',
  },
  {
    title: 'Mirá cómo bajó el stock',
    detail:
      'Volvé al panel, pestaña Cartillas: el ejemplar que acabás de pedir ya no está disponible. Si una cartilla queda bajo 10 unidades aparece el aviso de stock bajo.',
    mode: 'teacher',
    tab: 'cartillas',
  },
  {
    title: 'Cobrá lo que está pendiente',
    detail:
      'En Pedidos, filtrá por "Pendiente de pago". Abrí un pedido y marcalo como cobrado: pasa a "Listo para retirar" y el alumno recibe la notificación.',
    mode: 'teacher',
    tab: 'pedidos',
  },
  {
    title: 'Entregá en lote',
    detail:
      'Seleccioná varios pedidos con los checkboxes y usá la acción masiva. También podés imprimir la planilla de firmas: sale sólo la planilla, sin el panel.',
    mode: 'teacher',
    tab: 'pedidos',
  },
  {
    title: 'Organizá la jornada de retiro',
    detail:
      'En Entregas tenés la agenda por colegio con su ventana de retiro, cuántos ejemplares hay listos y la opción de cerrar toda la remesa de una vez.',
    mode: 'teacher',
    tab: 'entregas',
  },
  {
    title: 'Revisá el resultado',
    detail:
      'El Resumen recalcula todo con cada cambio: recaudación, pedidos por semana, embudo de entrega y ranking de cartillas. Ningún número está escrito a mano.',
    mode: 'teacher',
    tab: 'resumen',
  },
];

interface DemoGuideProps {
  mode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  onGoToTab: (tab: TeacherTab) => void;
}

/**
 * Panel de ayuda de la demo: el recorrido sugerido, el reinicio a los datos
 * originales y el estado de la persistencia.
 */
export const DemoGuide: React.FC<DemoGuideProps> = ({ mode, onSwitchMode, onGoToTab }) => {
  const { state, resetDemo } = useDemo();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full bg-secondary text-on-secondary shadow-2xl flex items-center justify-center hover:bg-on-secondary-container transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary no-print"
        type="button"
        aria-label="Guía de la demo"
        aria-expanded={isOpen}
      >
        <Icon name={isOpen ? 'close' : 'help'} size={22} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] max-h-[70vh] bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden no-print">
          <div className="px-4 py-3 border-b border-surface-container-low bg-primary text-on-primary">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Icon name="map" size={18} className="text-secondary-fixed-dim" />
              Guía de la demo
            </h2>
            <p className="text-[11px] text-on-primary-container mt-0.5">
              Recorrido sugerido, de la venta a la entrega.
            </p>
          </div>

          <ol className="flex-1 overflow-y-auto divide-y divide-surface-container-low">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <button
                  onClick={() => {
                    onSwitchMode(step.mode);
                    if (step.tab) onGoToTab(step.tab);
                  }}
                  className="w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-container-low transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                  type="button"
                >
                  <span className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-on-surface">{step.title}</span>
                    <span className="block text-[11px] text-on-surface-variant leading-snug mt-0.5">
                      {step.detail}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary mt-1">
                      <Icon name={step.mode === 'student' ? 'smartphone' : 'desktop_windows'} size={12} />
                      Ir
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="px-4 py-3 border-t border-surface-container-low bg-surface-container-low/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-outline">Vista actual</span>
              <span className="font-bold text-primary">
                {mode === 'student' ? 'Portal del alumno' : 'Panel docente'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-outline">Pedidos cargados</span>
              <span className="font-bold text-primary font-mono">{state.orders.length}</span>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="mt-1 h-9 rounded-lg bg-surface-container text-error text-xs font-bold hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
              type="button"
            >
              <Icon name="restart_alt" size={16} />
              Reiniciar la demo
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmReset}
        title="Reiniciar la demo"
        message="Se descartan todos los pedidos, cambios de stock y sesiones, y se vuelve a los datos de ejemplo originales. No se puede deshacer."
        confirmLabel="Reiniciar"
        onConfirm={resetDemo}
        onClose={() => setConfirmReset(false)}
      />
    </>
  );
};
