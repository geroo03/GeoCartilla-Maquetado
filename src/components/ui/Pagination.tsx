import React from 'react';
import { Icon } from './Icon.tsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Devuelve los números a mostrar, con elipsis cuando hay muchas páginas:
 * [1, '…', 7, 8, 9, '…', 25]
 */
function pageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | 'ellipsis')[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);

  if (from > 2) items.push('ellipsis');
  for (let page = from; page <= to; page += 1) items.push(page);
  if (to < total - 1) items.push('ellipsis');
  items.push(total);

  return items;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const arrowClass =
    'w-7 h-7 rounded-lg flex items-center justify-center bg-surface-container-lowest transition-colors focus-visible:outline-2 focus-visible:outline-primary';

  return (
    <nav className="flex items-center gap-1 font-mono" aria-label="Paginación de pedidos">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${arrowClass} ${
          currentPage === 1
            ? 'text-outline opacity-50 cursor-not-allowed'
            : 'text-on-surface hover:bg-surface-container cursor-pointer'
        }`}
        type="button"
        aria-label="Página anterior"
      >
        <Icon name="chevron_left" size={16} />
      </button>

      {pageItems(currentPage, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`gap-${index}`} className="px-1 text-outline" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
              item === currentPage
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
            type="button"
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${arrowClass} ${
          currentPage === totalPages
            ? 'text-outline opacity-50 cursor-not-allowed'
            : 'text-on-surface hover:bg-surface-container cursor-pointer'
        }`}
        type="button"
        aria-label="Página siguiente"
      >
        <Icon name="chevron_right" size={16} />
      </button>
    </nav>
  );
};
