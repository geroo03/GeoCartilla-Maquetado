import type { School } from '../types/index.ts';

/**
 * Color de identidad por colegio, para que las tarjetas de la agenda se
 * distingan de un vistazo en vez de ser cinco bloques iguales.
 *
 * La paleta sale del validador del sistema de diseño con --pairs all (las
 * cinco tarjetas se ven al mismo tiempo, asi que todos los pares importan) y
 * pasa los cinco chequeos sin advertencias:
 *
 *   Banda de luminosidad    los 5 dentro de L 0.43-0.77
 *   Piso de croma           los 5 >= 0.1
 *   Separacion daltonismo   peor par 9.8 (objetivo >= 8) - tritan 10.6
 *   Piso de vision normal   peor par 21.2 (objetivo >= 15)
 *   Contraste vs superficie los 5 >= 3:1
 *
 * Los tonos quedan a 45 grados o mas entre si (222 / 302 / 6 / 58 / 131), que
 * es lo que hace que se lean como cinco colores distintos y no como variantes.
 *
 * El color nunca es el unico identificador: siempre va al lado del nombre del
 * colegio y de sus iniciales.
 */
export const SCHOOL_PALETTE = [
  '#0891b2', // cian
  '#7e22ce', // violeta
  '#c2185b', // frambuesa
  '#d97706', // ambar
  '#3f6212', // verde oscuro
];

/** Gris de reserva: a partir del sexto colegio manda el nombre, no el color. */
export const SCHOOL_FALLBACK = '#4b5563';

/**
 * Normaliza un color escrito a mano: acepta #abc y #aabbcc, con o sin
 * almohadilla, y devuelve null si no es un hex valido. Lo que llega de un
 * input de texto o de un estado persistido no se pega al DOM sin revisar.
 */
export function normalizeHex(value: string | undefined | null): string | null {
  if (!value) return null;
  const raw = value.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

/**
 * Color de un colegio. Manda el elegido a mano; si no hay, se toma el de la
 * paleta por orden de alta, que es estable y se persiste: si la agenda se
 * ordena por fecha, un colegio no puede cambiar de color.
 */
export function schoolColor(schools: School[], code: string): string {
  const index = schools.findIndex((school) => school.code === code);
  if (index < 0) return SCHOOL_FALLBACK;
  const chosen = normalizeHex(schools[index].brandColor);
  if (chosen) return chosen;
  return SCHOOL_PALETTE[index] ?? SCHOOL_FALLBACK;
}

/**
 * El color que le tocaria a un colegio por paleta, ignorando el elegido a
 * mano. Es lo que muestra la opcion "Automatico" del formulario. Un colegio
 * que todavia no existe toma el siguiente libre.
 */
export function autoSchoolColor(schools: School[], code?: string): string {
  const index = code ? schools.findIndex((school) => school.code === code) : -1;
  return SCHOOL_PALETTE[index < 0 ? schools.length : index] ?? SCHOOL_FALLBACK;
}

/** Tinta oscura para las insignias claras: el navy de la marca es muy azul
 *  sobre el cian, asi que se usa un marron casi negro. */
const DARK_INK = '#1f1300';

/** Luminancia relativa (WCAG). */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Tinta de las iniciales sobre el color del colegio. El blanco no alcanza en
 * todos: sobre el cian da 3.7:1 y sobre el ambar 3.2:1, por debajo del 4.5:1
 * que pide un texto chico. Se elige la que mas contraste da.
 */
export function badgeInk(background: string): string {
  return contrast(background, '#ffffff') >= contrast(background, DARK_INK) ? '#ffffff' : DARK_INK;
}

/** Expuesto para que el test pueda verificar el contraste de la paleta. */
export const contrastRatio = contrast;

/**
 * Iniciales para la insignia. Saltea el tipo de establecimiento ("Esc.",
 * "Col.", "Inst.") y los numerales, que se repiten entre colegios y no
 * distinguen nada.
 */
export function schoolInitials(name: string): string {
  const SKIP = /^(esc\.?|escuela|col\.?|colegio|inst\.?|instituto|comercial|n[°º]?\s*\d+|normal)$/i;
  const words = name
    .split(/\s+/)
    .filter((word) => word.length > 0 && !SKIP.test(word) && /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(word));
  const source = words.length > 0 ? words : name.split(/\s+/).filter(Boolean);
  return source
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}
