import React from 'react';
import { Order } from '../types/index.ts';

interface ConfirmDeliveryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export const ConfirmDeliveryModal: React.FC<ConfirmDeliveryModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-surface-container-high/60">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-3 flex items-center justify-between border-b border-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary leading-tight">
                Confirmar entrega de cartilla
              </h3>
              <span className="text-xs text-outline font-medium">
                Protocolo de entrega institucional
              </span>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 flex flex-col gap-4 bg-surface">
          {/* Voucher / Token Visual Card */}
          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3 border border-surface-container-high/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-outline uppercase tracking-wider">
                Código de Retiro
              </span>
              <span className="text-2xl font-extrabold text-primary font-mono tracking-wider">
                {order.code}
              </span>
            </div>

            <div className="h-px bg-surface-container-high w-full my-1" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-outline block mb-0.5">Alumno</span>
                <span className="text-sm font-bold text-on-surface block truncate">
                  {order.studentName}
                </span>
                <span className="text-outline">DNI: {order.studentDni}</span>
              </div>
              <div>
                <span className="text-outline block mb-0.5">Institución</span>
                <span className="text-sm font-semibold text-on-surface block truncate">
                  {order.school}
                </span>
                <span className="text-secondary font-bold">{order.year}</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center gap-3 border border-surface-container-high/40">
              <span className="material-symbols-outlined text-primary text-[22px]">menu_book</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-outline uppercase tracking-wider">
                  Material a entregar
                </span>
                <span className="text-xs font-bold text-primary truncate">
                  {order.cartillaTitle} (Ed. 2025)
                </span>
              </div>
            </div>

            {order.paymentStatus === 'Pendiente de pago' && (
              <div className="p-2.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg text-xs flex items-center justify-between">
                <span className="font-semibold">Cobro pendiente en efectivo:</span>
                <span className="font-bold text-sm">$ {order.price.toLocaleString('es-AR')} ARS</span>
              </div>
            )}
          </div>

          {/* Verification Notice */}
          <div className="flex items-start gap-3 p-3.5 bg-secondary-container/40 border border-secondary/20 rounded-xl text-on-secondary-container">
            <span className="material-symbols-outlined text-[20px] text-secondary mt-0.5 shrink-0">
              verified_user
            </span>
            <p className="text-xs text-secondary leading-relaxed">
              <strong>Verificación obligatoria:</strong> Comprobá que el alumno o adulto responsable
              exhiba este código desde su celular o acredite identidad con DNI antes de retirar en la{' '}
              <em>Mesa de Geografía - Sala de Profesores</em>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 bg-surface-container-lowest border-t border-surface-container-low">
          <button
            className="px-4 py-2.5 rounded-lg text-on-surface-variant font-semibold text-xs hover:bg-surface-container transition-colors cursor-pointer"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-bold text-xs hover:bg-secondary/90 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
            onClick={() => {
              onConfirm(order.id);
              onClose();
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Confirmar y marcar entregado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
