/**
 * Parámetros de los gráficos. Los colores salen del validador del sistema de
 * diseño (seis chequeos: banda de luminosidad, piso de croma, separación para
 * daltonismo, piso de visión normal y contraste contra la superficie).
 *
 * El par categórico #2563eb / #c2660a pasa los seis, contraste incluido, y el
 * azul es el mismo que ya usa el logo de la app. La rampa del embudo es de un
 * solo tono con luminosidad monótona decreciente (0.924 -> 0.546).
 */

export const SERIES = {
  /** Pagado: identidad del cobro acreditado. */
  paid: '#2563eb',
  /** Pendiente de pago. */
  pending: '#c2660a',
};

/** Rampa secuencial de un tono para el embudo: claro = inicio, oscuro = final. */
export const FUNNEL_RAMP = ['#dbe6fd', '#a9c2f4', '#5d8ae6', '#2563eb'];

/** Un solo acento para los gráficos de una sola serie. */
export const ACCENT = '#2563eb';

export const CHART = {
  /** Color de la superficie: hace de separador entre marcas. */
  surface: '#ffffff',
  /** Grilla y ejes: un paso por encima de la superficie, recesivos. */
  grid: '#e2e7ff',
  axisText: '#74777f',
  /** Grosor máximo de barra; lo que sobra del carril queda como aire. */
  maxBarThickness: 24,
  /** Separación en color de superficie entre marcas que se tocan. */
  surfaceGap: 2,
  /** Radio del extremo de la barra; la base queda recta. */
  endRadius: 4,
};

/** Barra vertical con el extremo superior redondeado y la base recta. */
export function columnPath(x: number, y: number, width: number, height: number, radius = CHART.endRadius): string {
  const r = Math.max(0, Math.min(radius, height, width / 2));
  if (height <= 0) return '';
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

/** Barra horizontal con el extremo derecho redondeado y el arranque recto. */
export function barPath(x: number, y: number, width: number, height: number, radius = CHART.endRadius): string {
  const r = Math.max(0, Math.min(radius, width, height / 2));
  if (width <= 0) return '';
  return `M${x},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x},${y + height} Z`;
}

/** Rectángulo recto, para los tramos interiores de una barra apilada. */
export function squarePath(x: number, y: number, width: number, height: number): string {
  if (height <= 0 || width <= 0) return '';
  return `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
}

/** Topes redondos para el eje: 0 / 20 / 40 ... */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rawStep = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let value = 0; value <= Math.ceil(max / step) * step + 1e-9; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks;
}
