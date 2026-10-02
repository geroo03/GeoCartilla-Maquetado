/** Ciclo lectivo vigente: en Argentina el año escolar coincide con el calendario. */
export const CURRENT_TERM = new Date().getFullYear();

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/** $8.000 */
export function formatARS(amount: number): string {
  return ARS.format(amount);
}

/** 1.184.000 (sin símbolo, para ejes de gráficos y tablas) */
export function formatNumber(value: number): string {
  return value.toLocaleString('es-AR');
}

/** $1,2 M / $184 k / $8.000 — para KPIs donde no entra el número completo. */
export function formatCompactARS(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`;
  }
  if (Math.abs(amount) >= 100_000) {
    return `$${Math.round(amount / 1000).toLocaleString('es-AR')} k`;
  }
  return formatARS(amount);
}

/** 14/03 10:24 — el formato corto que ya usaban los pedidos. */
export function formatDateTimeShort(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 14 de marzo de 2026 */
export function formatLongDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Viernes 21 de marzo, 08:30 hs — ventana de retiro de un colegio. */
export function formatDeliveryWindow(ts: number): string {
  const d = new Date(ts);
  const label = d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const p = (n: number) => String(n).padStart(2, '0');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}, ${p(d.getHours())}:${p(d.getMinutes())} hs`;
}

/** "hace 2 h", "hace 3 días" — para notificaciones y timeline. */
export function formatRelative(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.round(days / 30);
  return months === 1 ? 'hace un mes' : `hace ${months} meses`;
}

/** Lunes 00:00 de la semana que contiene ts, para agrupar series temporales. */
export function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

/** 11 mar — etiqueta corta de eje. */
export function formatAxisDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/** Iniciales para los avatares: "Sofía Martínez" -> "SM". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
