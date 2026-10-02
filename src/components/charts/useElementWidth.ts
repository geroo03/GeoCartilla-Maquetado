import { useEffect, useRef, useState } from 'react';

/**
 * Ancho real del contenedor, para dibujar el SVG en píxeles exactos en lugar
 * de escalar un viewBox fijo (que deformaría o encogería el texto).
 */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => setWidth(node.clientWidth || fallback);
    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fallback]);

  return [ref, width] as const;
}
