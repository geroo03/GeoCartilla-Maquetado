import {
  Cartilla,
  DeliveryStatus,
  Notification,
  Order,
  OrderEvent,
  PaymentMethod,
  PaymentStatus,
  School,
} from '../types/index.ts';
import { formatDateTimeShort } from '../lib/format.ts';
import { INITIAL_CARTILLAS, INITIAL_SCHOOLS, PICKUP_LOCATION } from './mockData.ts';

/**
 * Generador determinista de pedidos. Usa un PRNG con semilla fija para que
 * la demo sea siempre idéntica: los mismos pedidos, montos y estados en cada
 * reinicio. Las fechas sí son relativas a hoy, para que el panel nunca se vea
 * desactualizado.
 */

/** mulberry32: PRNG chico y determinista. */
function createRng(seed: number) {
  let a = seed;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMBRES = [
  'Bautista', 'Sofía', 'Mateo', 'Valentina', 'Joaquín', 'Camila', 'Benjamín',
  'Martina', 'Thiago', 'Emilia', 'Lucas', 'Catalina', 'Santino', 'Isabella',
  'Lorenzo', 'Delfina', 'Dante', 'Mía', 'Facundo', 'Renata', 'Ignacio',
  'Julieta', 'Tomás', 'Paulina', 'Agustín', 'Guadalupe', 'Franco', 'Abril',
  'Nicolás', 'Victoria', 'Juan Cruz', 'Morena', 'Gael', 'Pilar', 'Ciro',
  'Antonella', 'Bruno', 'Lara', 'Simón', 'Candela',
];

const APELLIDOS = [
  'Benítez', 'Martínez', 'Rodríguez', 'Morales', 'López', 'Díaz', 'Fernández',
  'González', 'Pereyra', 'Sosa', 'Romero', 'Álvarez', 'Torres', 'Ruiz',
  'Domínguez', 'Ibarra', 'Quiroga', 'Acosta', 'Medina', 'Figueroa', 'Cabrera',
  'Vera', 'Molina', 'Ortiz', 'Silva', 'Luna', 'Ponce', 'Herrera', 'Ávila',
  'Maldonado',
];

const DOMINIOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.ar'];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Quita tildes y espacios para construir emails verosímiles. */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function buildHistory(
  createdAt: number,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  deliveryStatus: DeliveryStatus,
  amountLabel: string,
): OrderEvent[] {
  const events: OrderEvent[] = [
    {
      at: createdAt,
      actor: 'alumno',
      label: 'Pedido registrado',
      detail: `Solicitud generada desde el portal del alumno (${paymentMethod}).`,
    },
  ];

  if (paymentStatus === 'Pagado') {
    events.push({
      at: createdAt + 6 * 60_000,
      actor: paymentMethod === 'Mercado Pago' ? 'sistema' : 'docente',
      label: 'Pago acreditado',
      detail:
        paymentMethod === 'Mercado Pago'
          ? `Mercado Pago confirmó la acreditación de ${amountLabel}.`
          : `El docente registró el cobro en efectivo de ${amountLabel}.`,
    });
  }

  if (deliveryStatus === 'Preparado' || deliveryStatus === 'Listo para retirar' || deliveryStatus === 'Entregado') {
    events.push({
      at: createdAt + 90 * 60_000,
      actor: 'docente',
      label: 'Ejemplar preparado',
      detail: 'Ejemplar separado de la remesa y rotulado con el código del pedido.',
    });
  }

  if (deliveryStatus === 'Listo para retirar' || deliveryStatus === 'Entregado') {
    events.push({
      at: createdAt + 4 * 3600_000,
      actor: 'sistema',
      label: 'Listo para retirar',
      detail: `Disponible en ${PICKUP_LOCATION}.`,
    });
  }

  if (deliveryStatus === 'Entregado') {
    events.push({
      at: createdAt + 28 * 3600_000,
      actor: 'docente',
      label: 'Entregado',
      detail: 'Retirado por el alumno con presentación de DNI.',
    });
  }

  return events;
}

export interface SeedResult {
  orders: Order[];
  notifications: Notification[];
  cartillas: Cartilla[];
  schools: School[];
}

const SEED = 20260314;
const ORDER_COUNT = 62;
const WEEKS_BACK = 10;

/**
 * Construye el estado inicial completo. El stock de las cartillas se ajusta
 * para que sea coherente con los pedidos generados (cada pedido no cancelado
 * consumió un ejemplar).
 */
export function buildSeed(now = Date.now()): SeedResult {
  const rng = createRng(SEED);
  const cartillas = INITIAL_CARTILLAS.map((c) => ({ ...c }));
  const schools = INITIAL_SCHOOLS.map((s) => ({ ...s, divisions: [...s.divisions] }));
  const orderable = cartillas.filter((c) => c.isActive);

  const orders: Order[] = [];
  const consumed = new Map<string, number>();
  const usedDni = new Set<string>();
  let codeCounter = 4720;

  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const cartilla = pick(rng, orderable);
    const school = schools.find((s) => s.code === cartilla.schoolCode) ?? schools[0];

    const nombre = pick(rng, NOMBRES);
    const apellido = pick(rng, APELLIDOS);
    const studentName = `${nombre} ${apellido}`;

    // DNI único por pedido, en el rango verosímil para secundaria.
    let dniNum = 45_000_000 + Math.floor(rng() * 3_500_000);
    while (usedDni.has(String(dniNum))) dniNum += 1;
    usedDni.add(String(dniNum));
    const studentDni = dniNum
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Sesgo hacia pedidos recientes: exponente > 1 empuja el valor hacia 0,
    // que es "hoy". Así la bandeja siempre tiene actividad de las últimas horas.
    const weekBias = Math.pow(rng(), 2.2);
    const createdAt =
      now -
      Math.floor(weekBias * WEEKS_BACK * 7 * 24 * 3600_000) -
      Math.floor(rng() * 10 * 3600_000);

    const paymentMethod: PaymentMethod = rng() < 0.68 ? 'Mercado Pago' : 'Efectivo retiro';
    const ageDays = (now - createdAt) / (24 * 3600_000);

    // Cuanto más viejo el pedido, más probable que ya esté cerrado.
    let paymentStatus: PaymentStatus;
    let deliveryStatus: DeliveryStatus;

    if (paymentMethod === 'Mercado Pago') {
      // Online se acredita solo; queda pendiente apenas algún pago rechazado.
      paymentStatus = rng() < 0.93 ? 'Pagado' : 'Pendiente de pago';
    } else {
      // El efectivo se cobra recién al retirar, así que los pedidos nuevos
      // están casi todos pendientes y los viejos ya se cobraron.
      const paidChance = ageDays > 10 ? 0.8 : ageDays > 3 ? 0.5 : 0.15;
      paymentStatus = rng() < paidChance ? 'Pagado' : 'Pendiente de pago';
    }

    if (paymentStatus === 'Pendiente de pago') {
      deliveryStatus = ageDays < 2 || rng() < 0.4 ? 'En espera' : 'Preparado';
    } else if (ageDays > 10) {
      deliveryStatus = rng() < 0.92 ? 'Entregado' : 'Listo para retirar';
    } else if (ageDays > 3) {
      deliveryStatus = rng() < 0.6 ? 'Entregado' : 'Listo para retirar';
    } else if (ageDays > 1) {
      deliveryStatus = rng() < 0.7 ? 'Listo para retirar' : 'Preparado';
    } else {
      deliveryStatus = rng() < 0.45 ? 'Listo para retirar' : 'Preparado';
    }

    const division = pick(rng, school.divisions);
    const amountLabel = `$${cartilla.price.toLocaleString('es-AR')} ARS`;
    codeCounter += 1 + Math.floor(rng() * 3);
    const code = `GEO-${codeCounter}`;

    orders.push({
      id: code.toLowerCase(),
      code,
      studentName,
      studentDni,
      studentEmail: `${slugify(nombre)}.${slugify(apellido)}@${pick(rng, DOMINIOS)}`,
      studentPhone: `+54 9 11 ${3000 + Math.floor(rng() * 6999)}-${1000 + Math.floor(rng() * 8999)}`,
      school: school.name,
      schoolCode: school.code,
      year: cartilla.year,
      division,
      cartillaId: cartilla.id,
      cartillaTitle: cartilla.title,
      cartillaCover: cartilla.coverUrl,
      cartillaPages: cartilla.pages,
      paymentMethod,
      paymentStatus,
      deliveryStatus,
      date: formatDateTimeShort(createdAt),
      timestamp: createdAt,
      price: cartilla.price,
      pickupLocation: PICKUP_LOCATION,
      history: buildHistory(createdAt, paymentMethod, paymentStatus, deliveryStatus, amountLabel),
    });

    consumed.set(cartilla.id, (consumed.get(cartilla.id) ?? 0) + 1);
  }

  orders.sort((a, b) => b.timestamp - a.timestamp);

  // El stock declarado en el catálogo es el stock *actual*: lo que queda
  // después de los pedidos ya tomados. No hace falta restar nada, pero sí
  // dejamos registro de que esos ejemplares salieron de la remesa.

  // Notificaciones derivadas de los pedidos más recientes.
  const notifications: Notification[] = [];
  orders.slice(0, 8).forEach((order, idx) => {
    if (order.paymentStatus === 'Pendiente de pago') {
      notifications.push({
        id: `ntf-${order.id}-pago`,
        kind: 'pago',
        audience: 'docente',
        title: 'Pago pendiente',
        body: `${order.studentName} eligió pagar en efectivo al retirar ${order.cartillaTitle}.`,
        at: order.timestamp,
        read: idx > 2,
        orderId: order.id,
      });
    } else {
      notifications.push({
        id: `ntf-${order.id}-pedido`,
        kind: 'pedido',
        audience: 'docente',
        title: 'Nuevo pedido pagado',
        body: `${order.studentName} (${order.division}) pidió ${order.cartillaTitle}.`,
        at: order.timestamp,
        read: idx > 2,
        orderId: order.id,
      });
    }
  });

  cartillas
    .filter((c) => c.isActive && c.stock > 0 && c.stock < 10)
    .forEach((c) => {
      notifications.push({
        id: `ntf-stock-${c.id}`,
        kind: 'stock',
        audience: 'docente',
        title: 'Stock bajo',
        body: `Quedan ${c.stock} ejemplares de ${c.title}. Conviene pedir reposición a imprenta.`,
        at: now - 5 * 3600_000,
        read: false,
      });
    });

  const nextSchool = [...schools].sort((a, b) => a.nextDeliveryAt - b.nextDeliveryAt)[0];
  notifications.push({
    id: 'ntf-remesa',
    kind: 'remesa',
    audience: 'docente',
    title: 'Remesa de imprenta en camino',
    body: `La próxima remesa llega a ${nextSchool.name} el ${nextSchool.nextDelivery}.`,
    at: now - 2 * 3600_000,
    read: false,
  });

  notifications.sort((a, b) => b.at - a.at);

  return { orders, notifications, cartillas, schools };
}
