import React from 'react';
import { Icon } from './Icon.tsx';

export type KpiAccent = 'primary' | 'amber' | 'green' | 'neutral';

interface AccentStyle {
  blob: string;
  label: string;
  value: string;
  badge: string;
  iconBox: string;
  bar: string;
  footerValue: string;
}

const ACCENTS: Record<KpiAccent, AccentStyle> = {
  primary: {
    blob: 'bg-primary-fixed/30',
    label: 'text-on-surface-variant',
    value: 'text-primary',
    badge: 'bg-secondary-container text-on-secondary-container',
    iconBox: 'bg-surface-container text-primary',
    bar: 'bg-primary',
    footerValue: 'text-primary',
  },
  amber: {
    blob: 'bg-tertiary-fixed/30',
    label: 'text-on-tertiary-container',
    value: 'text-on-tertiary-fixed',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    iconBox: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    bar: 'bg-on-tertiary-container',
    footerValue: 'text-on-tertiary-container',
  },
  green: {
    blob: 'bg-secondary-fixed/40',
    label: 'text-on-secondary-container',
    value: 'text-secondary',
    badge: 'bg-secondary-container text-on-secondary-container',
    iconBox: 'bg-secondary-container text-on-secondary-container',
    bar: 'bg-secondary',
    footerValue: 'text-secondary',
  },
  neutral: {
    blob: 'bg-surface-container-highest/50',
    label: 'text-on-surface-variant',
    value: 'text-on-surface',
    badge: 'bg-surface-container text-on-surface-variant',
    iconBox: 'bg-surface-container text-outline',
    bar: 'bg-outline',
    footerValue: 'text-on-surface',
  },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  accent?: KpiAccent;
  /** Insignia corta a la derecha del número, p. ej. "+12% mes". */
  badge?: string;
  footerLabel?: string;
  footerValue?: string;
  /** Proporción 0..1 de la barra inferior. */
  progress?: number;
  /** Si está presente la tarjeta es un botón que aplica un filtro. */
  onClick?: () => void;
  isActive?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  accent = 'primary',
  badge,
  footerLabel,
  footerValue,
  progress,
  onClick,
  isActive = false,
}) => {
  const style = ACCENTS[accent];
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      {...(onClick
        ? { onClick, type: 'button' as const, 'aria-pressed': isActive }
        : {})}
      className={`relative bg-surface-container-lowest p-4 rounded-xl shadow-xs border flex flex-col justify-between overflow-hidden text-left w-full ${
        isActive ? 'border-primary ring-2 ring-primary/30' : 'border-surface-container-high/60'
      } ${
        onClick
          ? 'cursor-pointer transition-all hover:shadow-sm hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          : ''
      }`}
    >
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none ${style.blob}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${style.label}`}>
            {label}
          </span>
          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <span className={`text-3xl font-extrabold font-mono ${style.value}`}>{value}</span>
            {badge && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${style.badge}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox}`}>
          <Icon name={icon} size={22} />
        </div>
      </div>

      {(footerLabel || footerValue) && (
        <div className="mt-4 pt-1 flex items-center justify-between gap-2 text-xs">
          <span className="text-outline">{footerLabel}</span>
          <span className={`text-xs font-extrabold ${style.footerValue}`}>{footerValue}</span>
        </div>
      )}

      {progress !== undefined && (
        <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      )}
    </Tag>
  );
};
