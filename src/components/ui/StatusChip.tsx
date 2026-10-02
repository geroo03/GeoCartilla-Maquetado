import React from 'react';
import type { DeliveryStatus, PaymentMethod, PaymentStatus } from '../../types/index.ts';

const CHIP_BASE =
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap';

interface ChipStyle {
  wrapper: string;
  dot: string;
}

const PAYMENT_STYLES: Record<PaymentStatus, ChipStyle> = {
  Pagado: { wrapper: 'bg-primary-fixed text-on-primary-fixed', dot: 'bg-primary' },
  'Pendiente de pago': {
    wrapper: 'bg-tertiary-fixed text-on-tertiary-fixed',
    dot: 'bg-on-tertiary-container',
  },
  Reintegrado: { wrapper: 'bg-surface-container-high text-on-surface-variant', dot: 'bg-outline' },
};

const DELIVERY_STYLES: Record<DeliveryStatus, ChipStyle> = {
  'Listo para retirar': {
    wrapper: 'bg-primary-fixed text-on-primary-fixed',
    dot: 'bg-primary animate-pulse',
  },
  Entregado: { wrapper: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary' },
  Preparado: { wrapper: 'bg-surface-container text-outline', dot: 'bg-outline' },
  'En espera': { wrapper: 'bg-surface-container text-outline', dot: 'bg-outline' },
  Cancelado: { wrapper: 'bg-error-container text-on-error-container', dot: 'bg-error' },
};

export const PaymentChip: React.FC<{ status: PaymentStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const style = PAYMENT_STYLES[status];
  return (
    <span className={`${CHIP_BASE} ${style.wrapper} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

export const DeliveryChip: React.FC<{ status: DeliveryStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const style = DELIVERY_STYLES[status];
  return (
    <span className={`${CHIP_BASE} ${style.wrapper} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

export const PaymentMethodLabel: React.FC<{ method: PaymentMethod; className?: string }> = ({
  method,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-1.5 text-xs text-on-surface-variant ${className}`}>
    <span
      className={`w-2 h-2 rounded-full ${
        method === 'Mercado Pago' ? 'bg-primary' : 'bg-tertiary-container'
      }`}
    />
    {method}
  </span>
);
