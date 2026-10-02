import React, { useState } from 'react';
import { ACCENT, CHART, barPath } from './chartTheme.ts';
import { useElementWidth } from './useElementWidth.ts';

export interface BarDatum {
  label: string;
  value: number;
  /** Texto que se muestra en la punta; si falta se usa el valor. */
  display?: string;
  color?: string;
  note?: string;
  onClick?: () => void;
}

interface HorizontalBarsProps {
  data: BarDatum[];
  /** Ancho reservado para las etiquetas de categoría. */
  labelWidth?: number;
  barHeight?: number;
  emptyMessage?: string;
}

/**
 * Barras horizontales para magnitud por categoría: una sola escala, valor en
 * la punta y etiqueta por fila (la identidad nunca depende sólo del color).
 */
export const HorizontalBars: React.FC<HorizontalBarsProps> = ({
  data,
  labelWidth = 120,
  barHeight = 18,
  emptyMessage = 'Sin datos todavía.',
}) => {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-[11px] text-outline py-6 text-center">{emptyMessage}</p>;
  }

  const rowHeight = barHeight + 14;
  const height = data.length * rowHeight;
  const valueWidth = 56;
  const plotWidth = Math.max(24, width - labelWidth - valueWidth);
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label="Comparación por categoría">
        {data.map((datum, index) => {
          const y = index * rowHeight;
          const barWidth = (datum.value / max) * plotWidth;
          const isHovered = hovered === index;
          const fill = datum.color ?? ACCENT;

          return (
            <g
              key={datum.label}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onClick={datum.onClick}
              className={datum.onClick ? 'cursor-pointer' : undefined}
            >
              <rect
                x="0"
                y={y}
                width={width}
                height={rowHeight}
                fill={isHovered ? CHART.grid : 'transparent'}
                opacity={isHovered ? 0.5 : 0}
                rx="4"
              />

              <text
                x="0"
                y={y + barHeight / 2 + 4}
                fontSize="10"
                fill="#43474e"
                fontWeight="600"
              >
                {datum.label.length > 22 ? `${datum.label.slice(0, 21)}...` : datum.label}
              </text>

              {/* Carril: paso más claro de la misma rampa */}
              <rect
                x={labelWidth}
                y={y}
                width={plotWidth}
                height={barHeight}
                fill={CHART.grid}
                opacity="0.55"
                rx="3"
              />

              <path d={barPath(labelWidth, y, Math.max(2, barWidth), barHeight)} fill={fill} />

              {/* Valor en la punta, en token de texto y nunca en el color de la serie */}
              <text
                x={labelWidth + plotWidth + 6}
                y={y + barHeight / 2 + 4}
                fontSize="10"
                fontWeight="700"
                fill="#131b2e"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {datum.display ?? datum.value}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered !== null && data[hovered].note && (
        <div
          className="absolute z-10 pointer-events-none bg-inverse-surface text-inverse-on-surface rounded-lg px-2.5 py-1.5 text-[11px] shadow-xl max-w-[16rem]"
          style={{ left: Math.min(labelWidth, Math.max(0, width - 200)), top: hovered * rowHeight + rowHeight }}
          role="tooltip"
        >
          <div className="font-bold">{data[hovered].label}</div>
          <div className="text-outline-variant">{data[hovered].note}</div>
        </div>
      )}
    </div>
  );
};
