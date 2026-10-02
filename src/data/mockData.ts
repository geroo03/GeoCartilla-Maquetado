import type { Cartilla, School } from '../types/index.ts';
import { CURRENT_TERM, formatDeliveryWindow } from '../lib/format.ts';

/**
 * Catálogo base de la demo. Los pedidos no viven acá: los genera
 * `seed.ts` a partir de estas cartillas, así nunca quedan datos
 * inconsistentes entre un pedido y la cartilla que referencia.
 */

/** Próxima ocurrencia de un día de semana a una hora dada, desde hoy. */
function nextWeekdayAt(weekday: number, hour: number, minute: number, weeksAhead = 0): number {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  const delta = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta + weeksAhead * 7);
  return d.getTime();
}

const DELIVERY_WINDOWS = {
  'san-martin': nextWeekdayAt(5, 8, 30), // viernes
  belgrano: nextWeekdayAt(4, 10, 0), // jueves
  'normal-1': nextWeekdayAt(1, 9, 15, 1), // lunes de la semana próxima
  'comercial-3': nextWeekdayAt(3, 11, 30), // miércoles
  'tecnica-12': nextWeekdayAt(2, 7, 45), // martes
};

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'san-martin',
    code: 'san-martin',
    name: 'Col. Nacional San Martín',
    address: 'Av. Corrientes 2040, CABA',
    divisions: ['1° Año (1-4)', '2° Año (1-4)', '3° Año (A, B, C)', '4° Año (A, B)'],
    coordinator: 'Prof. Martín Gómez',
    studentsCount: 340,
    nextDelivery: formatDeliveryWindow(DELIVERY_WINDOWS['san-martin']),
    nextDeliveryAt: DELIVERY_WINDOWS['san-martin'],
    phone: '+54 9 11 5820-9411',
  },
  {
    id: 'belgrano',
    code: 'belgrano',
    name: 'Inst. Manuel Belgrano',
    address: 'Juramento 2900, Belgrano, CABA',
    divisions: ['3° Año (Bachiller)', '4° Año (Bachiller)', '5° Año (Sociales)'],
    coordinator: 'Prof. Gabriela Rossi',
    studentsCount: 215,
    nextDelivery: formatDeliveryWindow(DELIVERY_WINDOWS.belgrano),
    nextDeliveryAt: DELIVERY_WINDOWS.belgrano,
    phone: '+54 9 11 4782-9900',
  },
  {
    id: 'normal-1',
    code: 'normal-1',
    name: 'Esc. Normal N°1 Presidente Roque Sáenz Peña',
    address: 'Av. Córdoba 1951, Recoleta, CABA',
    divisions: ['2° Año (A-E)', '3° Año (A-D)', '5° Año (Naturales)'],
    coordinator: 'Prof. Horacio Varela',
    studentsCount: 290,
    nextDelivery: formatDeliveryWindow(DELIVERY_WINDOWS['normal-1']),
    nextDeliveryAt: DELIVERY_WINDOWS['normal-1'],
    phone: '+54 9 11 4811-2311',
  },
  {
    id: 'comercial-3',
    code: 'comercial-3',
    name: 'Comercial N°3 Hipólito Yrigoyen',
    address: 'Tucumán 3160, Almagro, CABA',
    divisions: ['3° Año (Comercial)', '4° Año (Economía)'],
    coordinator: 'Prof. Mariana Toledo',
    studentsCount: 160,
    nextDelivery: formatDeliveryWindow(DELIVERY_WINDOWS['comercial-3']),
    nextDeliveryAt: DELIVERY_WINDOWS['comercial-3'],
    phone: '+54 9 11 4862-0941',
  },
  {
    id: 'tecnica-12',
    code: 'tecnica-12',
    name: 'Esc. Técnica N°12 Libertador Gral. San Martín',
    address: 'Av. Rivadavia 4950, Caballito, CABA',
    divisions: ['4° Año (Técnica)', '5° Año (Técnica)', '6° Año (Técnica)'],
    coordinator: 'Prof. Diego Acuña',
    studentsCount: 198,
    nextDelivery: formatDeliveryWindow(DELIVERY_WINDOWS['tecnica-12']),
    nextDeliveryAt: DELIVERY_WINDOWS['tecnica-12'],
    phone: '+54 9 11 5591-7720',
  },
];

export const INITIAL_CARTILLAS: Cartilla[] = [
  {
    id: 'cart-01',
    code: 'CART-01',
    title: 'Geografía 1° Año: Introducción al Espacio Geográfico',
    subtitle: 'Nociones de territorio, escalas, coordenadas y lectura de mapas.',
    school: 'Col. Nacional San Martín',
    schoolCode: 'san-martin',
    year: '1° Año',
    divisions: '1° Año (Divisiones 1 a 4)',
    price: 7200,
    stock: 56,
    isActive: true,
    pages: 96,
    features: ['96 págs. • Anillado simple', 'Set de mapas mudos desprendibles'],
    coverUrl: '',
    coverMotif: 'topographic',
    tag: `Oficial ${CURRENT_TERM}`,
    edition: `Edición Oficial ${CURRENT_TERM} • Ciclo Básico`,
  },
  {
    id: 'cart-02',
    code: 'CART-02',
    title: 'Geografía 2° Año: Ambientes y Recursos de América',
    subtitle: 'Recursos naturales, biomas americanos y población originaria.',
    school: 'Col. Nacional San Martín',
    schoolCode: 'san-martin',
    year: '2° Año',
    divisions: '2° Año (Divisiones 1 a 4)',
    price: 7500,
    stock: 30,
    isActive: true,
    pages: 108,
    features: ['108 págs.', 'Ejercicios prácticos con mapas mudos'],
    coverUrl: '',
    coverMotif: 'climate',
    tag: 'Reimpresión',
    edition: `Reimpresión Marzo ${CURRENT_TERM}`,
  },
  {
    id: 'cart-03',
    code: 'CART-03',
    title: 'Geografía 3° Año: Espacios Urbanos y Rurales',
    subtitle: 'Relieves, Pampa húmeda, economías regionales, mapas temáticos.',
    school: 'Col. Nacional San Martín',
    schoolCode: 'san-martin',
    year: '3° Año',
    divisions: '3° Año (Div. A, B y C)',
    price: 8000,
    stock: 42,
    isActive: true,
    pages: 124,
    features: ['124 págs. • Anillado doble wire-o', 'Cuadernillo cartográfico anexo'],
    coverUrl: '',
    coverMotif: 'urban',
    tag: `Oficial ${CURRENT_TERM}`,
    edition: `Edición Oficial ${CURRENT_TERM} • Cátedra Prof. Gómez`,
  },
  {
    id: 'cart-04',
    code: 'CART-04',
    title: 'Geografía 4° Año: Procesos Globales',
    subtitle: 'Geopolítica mundial, bloques económicos y división internacional.',
    school: 'Inst. Manuel Belgrano',
    schoolCode: 'belgrano',
    year: '4° Año',
    divisions: '4° Año (Bachiller)',
    price: 8000,
    stock: 18,
    isActive: true,
    pages: 140,
    features: ['140 págs. • Mapas satelitales a color', 'Cartografía satelital y bloques geopolíticos'],
    coverUrl: '',
    coverMotif: 'satellite',
    tag: `Oficial ${CURRENT_TERM}`,
    edition: `Edición Oficial ${CURRENT_TERM} • Ciclo Orientado`,
  },
  {
    id: 'cart-05',
    code: 'CART-05',
    title: 'Geografía 5° Año: Problemáticas Ambientales',
    subtitle: 'Cambio climático, crisis hídrica y desarrollo sustentable en Arg.',
    school: 'Esc. Normal N°1 Presidente Roque Sáenz Peña',
    schoolCode: 'normal-1',
    year: '5° Año',
    divisions: '5° Año (Naturales)',
    price: 8500,
    stock: 0,
    isActive: false,
    pages: 98,
    features: ['98 págs. • Casos de estudio ambientales', 'Guía de trabajo de campo'],
    coverUrl: '',
    coverMotif: 'climate',
    tag: 'Sin stock',
    edition: `Edición ${CURRENT_TERM - 1} / Re-edición en imprenta`,
  },
  {
    id: 'cart-06',
    code: 'CART-06',
    title: 'Geografía 3° Año: Cartografía y Teledetección',
    subtitle: 'Proyecciones, SIG, imágenes satelitales y trabajo de campo.',
    school: 'Esc. Normal N°1 Presidente Roque Sáenz Peña',
    schoolCode: 'normal-1',
    year: '3° Año',
    divisions: '3° Año (Div. A a D)',
    price: 8200,
    stock: 7,
    isActive: true,
    pages: 116,
    features: ['116 págs. • Láminas satelitales', 'Prácticos con software SIG libre'],
    coverUrl: '',
    coverMotif: 'satellite',
    tag: 'Stock bajo',
    edition: `Edición Oficial ${CURRENT_TERM} • Cátedra Prof. Varela`,
  },
  {
    id: 'cart-07',
    code: 'CART-07',
    title: 'Geografía 4° Año: Economía y Territorio Argentino',
    subtitle: 'Complejos productivos, infraestructura y comercio exterior.',
    school: 'Comercial N°3 Hipólito Yrigoyen',
    schoolCode: 'comercial-3',
    year: '4° Año',
    divisions: '4° Año (Economía)',
    price: 7900,
    stock: 24,
    isActive: true,
    pages: 132,
    features: ['132 págs. • Series estadísticas', 'Anexo de gráficos y censos'],
    coverUrl: '',
    coverMotif: 'political',
    tag: `Oficial ${CURRENT_TERM}`,
    edition: `Edición Oficial ${CURRENT_TERM} • Orientación Economía`,
  },
  {
    id: 'cart-08',
    code: 'CART-08',
    title: 'Geografía 5° Año: Geopolítica del Atlántico Sur',
    subtitle: 'Cuestión Malvinas, plataforma continental y Antártida Argentina.',
    school: 'Esc. Técnica N°12 Libertador Gral. San Martín',
    schoolCode: 'tecnica-12',
    year: '5° Año',
    divisions: '5° Año (Técnica)',
    price: 8800,
    stock: 31,
    isActive: true,
    pages: 104,
    features: ['104 págs. • Cartas náuticas', 'Dossier documental histórico'],
    coverUrl: '',
    coverMotif: 'political',
    tag: 'Novedad',
    edition: `Primera edición ${CURRENT_TERM}`,
  },
];

export const TEACHER_PROFILE = {
  name: 'Prof. Martín Gómez',
  role: 'Docente Titular',
  avatar: '',
  email: 'martin.gomez@geocartillas.edu.ar',
  department: 'Cátedra de Geografía Argentina',
  activeTerm: `Ciclo Lectivo ${CURRENT_TERM}`,
};

/** Credenciales que la pantalla de login muestra en pantalla para la demo. */
export const DEMO_TEACHER_CREDENTIALS = {
  email: 'martin.gomez@geocartillas.edu.ar',
  password: 'geografia2026',
};

export const PICKUP_LOCATION = 'Mesa de Geografía - Sala de Profesores';
