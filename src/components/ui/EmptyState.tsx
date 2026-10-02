import React from 'react';
import { Icon } from './Icon.tsx';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void; icon?: string };
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  message,
  action,
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      compact ? 'py-8 px-4' : 'py-16 px-6'
    }`}
  >
    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
      <Icon name={icon} size={28} />
    </div>
    <h3 className="text-sm font-bold text-on-surface">{title}</h3>
    <p className="text-xs text-on-surface-variant mt-1 max-w-sm leading-relaxed">{message}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
      >
        {action.icon && <Icon name={action.icon} size={16} />}
        {action.label}
      </button>
    )}
  </div>
);
