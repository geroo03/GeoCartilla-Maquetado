import React, { useState } from 'react';
import { CHART, columnPath, niceTicks, squarePath } from './chartTheme.ts';
import { useElementWidth } from './useElementWidth.ts';

export interface ColumnDatum {
  label: string;
  /** Tramos de abajo hacia arriba. */
  segments: { key: string; value: number; color: string }[];
  /** Línea extra para el tooltip, p. ej. la recaudación de la semana. */
  note?: string;
}

interface StackedColumnsProps {
  data: ColumnDatum[];
  height?: number;
  valueSuffix?: string;
}

/**
 * Columnas apiladas con una sola escala. Dos medidas de escalas distintas
 * nunca comparten gráfico, así que la recaudación va en el tooltip y no en
 * un segundo eje.
 */
export const StackedColumns: React.FC<StackedColumnsProps> = ({
  data,
  height = 200,
  valueSuffix = '',
}) => {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const padding = { top: 16, right: 8, bottom: 26, left: 30 };
  const plotWidth = Math.max(40, width - padding.left - padding.right);
  const plotHeight = height - padding.top - padding.bottom;

  const totals = data.map((d) => d.segments.reduce((sum, s) => sum + s.value, 0));
  const ticks = niceTicks(Math.max(...totals, 1));
  const maxTick = ticks[ticks.length - 1];

  const band = plotWidth / Math.max(1, data.length);
  const barWidth = Math.min(CHART.maxBarThickness, band * 0.62);
  const scaleY = (value: number) => (value / maxTick) * plotHeight;

  // Etiqueta selectiva: sólo el pico de la serie.
  const peakIndex = totals.indexOf(Math.max(...totals));

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label="Pedidos por semana">
        {/* Grilla recesiva, hairline y sólida */}
        {ticks.map((tick) => {
          const y = padding.top + plotHeight - scaleY(tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke={CHART.grid}
                strokeWidth="1"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill={CHART.axisText}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {data.map((datum, index) => {
          const x = padding.left + index * band + (band - barWidth) / 2;
          let cursor = padding.top + plotHeight;
          const isHovered = hovered === index;

          // El tramo superior lleva el extremo redondeado; los interiores, recto.
          const lastFilled = datum.segments.reduce(
            (acc, segment, i) => (segment.value > 0 ? i : acc),
            -1,
          );

          return (
            <g
              key={datum.label}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Área de hover más grande que la marca */}
              <rect
                x={padding.left + index * band}
                y={padding.top}
                width={band}
                height={plotHeight}
                fill={isHovered ? CHART.grid : 'transparent'}
                opacity={isHovered ? 0.45 : 0}
              />

              {datum.segments.map((segment, segmentIndex) => {
                if (segment.value <= 0) return null;
                const rawHeight = scaleY(segment.value);
                // Gap de 2px en color de superficie entre tramos que se tocan
                const isTop = segmentIndex === lastFilled;
                const gap = isTop ? 0 : CHART.surfaceGap;
                const barHeight = Math.max(1, rawHeight - gap);
                const y = cursor - rawHeight;
                cursor -= rawHeight;

                return (
                  <path
                    key={segment.key}
                    d={
                      isTop
                        ? columnPath(x, y, barWidth, barHeight)
                        : squarePath(x, y + gap, barWidth, barHeight)
                    }
                    fill={segment.color}
                  />
                );
              })}

              {index === peakIndex && totals[index] > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={padding.top + plotHeight - scaleY(totals[index]) - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#43474e"
                >
                  {totals[index]}
                </text>
              )}

              <text
                x={x + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="9"
                fill={CHART.axisText}
              >
                {datum.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered !== null && (
        <div
          className="absolute z-10 pointer-events-none bg-inverse-surface text-inverse-on-surface rounded-lg px-2.5 py-1.5 text-[11px] shadow-xl whitespace-nowrap"
          style={{
            left: Math.min(
              Math.max(padding.left + hovered * band + band / 2 - 60, 0),
              Math.max(0, width - 130),
            ),
            top: 0,
          }}
          role="tooltip"
        >
          <div className="font-bold">{data[hovered].label}</div>
          {data[hovered].segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span>
                {segment.key}: <strong>{segment.value}</strong>
                {valueSuffix}
              </span>
            </div>
          ))}
          {data[hovered].note && (
            <div className="text-outline-variant mt-0.5">{data[hovered].note}</div>
          )}
        </div>
      )}
    </div>
  );
};
