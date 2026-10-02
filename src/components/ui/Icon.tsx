import React from 'react';

interface IconProps {
  /** Nombre del glifo en Material Symbols Outlined. */
  name: string;
  /** Tamaño en px; coincide con el text-[Npx] que usaba el markup original. */
  size?: number;
  className?: string;
  filled?: boolean;
}

/** Envoltorio sobre Material Symbols, que la app carga por fuente. */
export const Icon: React.FC<IconProps> = ({ name, size = 20, className = '', filled = false }) => (
  <span
    aria-hidden="true"
    className={`${filled ? 'material-symbols-filled' : 'material-symbols-outlined'} ${className}`}
    style={{ fontSize: `${size}px` }}
  >
    {name}
  </span>
);
