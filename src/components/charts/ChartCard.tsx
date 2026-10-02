import React, { useState } from 'react';
import { Icon } from '../ui/Icon.tsx';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Leyenda: obligatoria desde dos series, innecesaria con una sola. */
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
  /** Vista de tabla equivalente; garantiza que ningún dato quede sólo en el color. */
  table?: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  legend,
  children,
  table,
  className = '',
}) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <section
      className={`bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high/60 flex flex-col ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-on-surface">{title}</h3>
          {subtitle && <p className="text-[11px] text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>

        {table && (
          <button
            onClick={() => setShowTable((visible) => !visible)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
            aria-label={showTable ? 'Ver gráfico' : 'Ver los datos como tabla'}
            title={showTable ? 'Ver gráfico' : 'Ver los datos como tabla'}
          >
            <Icon name={showTable ? 'bar_chart' : 'table_rows'} size={16} />
          </button>
        )}
      </div>

      {legend && legend.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap mb-2">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-on-surface-variant">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 min-w-0">{showTable && table ? table : children}</div>
    </section>
  );
};
