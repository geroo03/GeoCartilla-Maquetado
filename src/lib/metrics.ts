import type { Cartilla, Notification, Order, School } from '../types/index.ts';
import { startOfWeek } from './format.ts';

/**
 * Métricas derivadas de los pedidos. Viven acá para que el panel de Pedidos,
 * el Resumen y la vista de Entregas compartan exactamente el mismo cálculo:
 * en el maquetado original los KPI eran constantes escritas a mano.
 */

/** Un pedido cancelado no cuenta para la operación ni para la recaudación. */
export const isLive = (order: Order) => order.deliveryStatus !== 'Cancelado';

export interface OrderMetrics {
  total: number;
  revenue: number;
  pendingCount: number;
  pendingAmount: number;
  preparedCount: number;
  waitingCount: number;
  readyCount: number;
  deliveredCount: number;
  canceledCount: number;
  refundedAmount: number;
  /** Entregados sobre el total vivo, 0..1 */
  deliveryRate: number;
  /** Cobrado sobre el total facturable, 0..1 */
  collectionRate: number;
}

export function computeOrderMetrics(orders: Order[]): OrderMetrics {
  const live = orders.filter(isLive);
  const billable = live.reduce((sum, o) => sum + o.price, 0);

  const metrics: OrderMetrics = {
    total: live.length,
    revenue: 0,
    pendingCount: 0,
    pendingAmount: 0,
    preparedCount: 0,
    waitingCount: 0,
    readyCount: 0,
    deliveredCount: 0,
    canceledCount: orders.length - live.length,
    refundedAmount: orders
      .filter((o) => o.paymentStatus === 'Reintegrado')
      .reduce((sum, o) => sum + o.price, 0),
    deliveryRate: 0,
    collectionRate: 0,
  };

  live.forEach((order) => {
    if (order.paymentStatus === 'Pagado') {
      metrics.revenue += order.price;
    } else if (order.paymentStatus === 'Pendiente de pago') {
      metrics.pendingCount += 1;
      metrics.pendingAmount += order.price;
    }

    switch (order.deliveryStatus) {
      case 'Entregado':
        metrics.deliveredCount += 1;
        break;
      case 'Listo para retirar':
        metrics.readyCount += 1;
        break;
      case 'Preparado':
        metrics.preparedCount += 1;
        break;
      case 'En espera':
        metrics.waitingCount += 1;
        break;
      default:
        break;
    }
  });

  metrics.deliveryRate = live.length ? metrics.deliveredCount / live.length : 0;
  metrics.collectionRate = billable ? metrics.revenue / billable : 0;

  return metrics;
}

export interface WeekPoint {
  weekStart: number;
  count: number;
  revenue: number;
}

/** Serie semanal de los últimos `weeks` lunes, incluida la semana en curso. */
export function weeklySeries(orders: Order[], weeks = 10, now = Date.now()): WeekPoint[] {
  const buckets = new Map<number, WeekPoint>();
  const firstWeek = startOfWeek(now) - (weeks - 1) * 7 * 24 * 3600_000;

  for (let i = 0; i < weeks; i += 1) {
    const weekStart = firstWeek + i * 7 * 24 * 3600_000;
    buckets.set(weekStart, { weekStart, count: 0, revenue: 0 });
  }

  orders.filter(isLive).forEach((order) => {
    const bucket = buckets.get(startOfWeek(order.timestamp));
    if (!bucket) return; // más viejo que la ventana
    bucket.count += 1;
    if (order.paymentStatus === 'Pagado') bucket.revenue += order.price;
  });

  return [...buckets.values()].sort((a, b) => a.weekStart - b.weekStart);
}

/** Variación porcentual de pedidos de esta semana contra la anterior. */
export function weekOverWeekDelta(orders: Order[], now = Date.now()): number | null {
  const series = weeklySeries(orders, 2, now);
  const [previous, current] = series;
  if (!previous || previous.count === 0) return null;
  return ((current.count - previous.count) / previous.count) * 100;
}

export interface SchoolBreakdown {
  schoolCode: string;
  name: string;
  orders: number;
  revenue: number;
  pending: number;
  readyToPickup: number;
}

export function revenueBySchool(orders: Order[], schools: School[]): SchoolBreakdown[] {
  const rows = new Map<string, SchoolBreakdown>();
  schools.forEach((school) => {
    rows.set(school.code, {
      schoolCode: school.code,
      name: school.name,
      orders: 0,
      revenue: 0,
      pending: 0,
      readyToPickup: 0,
    });
  });

  orders.filter(isLive).forEach((order) => {
    const row = rows.get(order.schoolCode);
    if (!row) return;
    row.orders += 1;
    if (order.paymentStatus === 'Pagado') row.revenue += order.price;
    if (order.paymentStatus === 'Pendiente de pago') row.pending += 1;
    if (order.deliveryStatus === 'Listo para retirar') row.readyToPickup += 1;
  });

  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
}

export interface CartillaBreakdown {
  cartillaId: string;
  title: string;
  orders: number;
  revenue: number;
}

export function topCartillas(orders: Order[], limit = 5): CartillaBreakdown[] {
  const rows = new Map<string, CartillaBreakdown>();

  orders.filter(isLive).forEach((order) => {
    const row = rows.get(order.cartillaId) ?? {
      cartillaId: order.cartillaId,
      title: order.cartillaTitle,
      orders: 0,
      revenue: 0,
    };
    row.orders += 1;
    if (order.paymentStatus === 'Pagado') row.revenue += order.price;
    rows.set(order.cartillaId, row);
  });

  return [...rows.values()].sort((a, b) => b.orders - a.orders).slice(0, limit);
}

export interface FunnelStage {
  label: string;
  count: number;
}

/** Embudo logístico, de la solicitud al retiro. */
export function deliveryFunnel(orders: Order[]): FunnelStage[] {
  const metrics = computeOrderMetrics(orders);
  return [
    { label: 'En espera', count: metrics.waitingCount },
    { label: 'Preparado', count: metrics.preparedCount },
    { label: 'Listo para retirar', count: metrics.readyCount },
    { label: 'Entregado', count: metrics.deliveredCount },
  ];
}

export const LOW_STOCK_THRESHOLD = 10;

export function lowStockCartillas(cartillas: Cartilla[]): Cartilla[] {
  return cartillas
    .filter((c) => c.isActive && c.stock < LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);
}

/** Pedidos de un alumno, identificado por DNI. */
export function ordersForStudent(orders: Order[], dni: string | undefined): Order[] {
  if (!dni) return [];
  const normalize = (value: string) => value.replace(/\D/g, '');
  const target = normalize(dni);
  return orders.filter((order) => normalize(order.studentDni) === target);
}

/** Notificaciones visibles para una audiencia; el alumno sólo ve las suyas. */
export function notificationsFor(
  notifications: Notification[],
  audience: 'docente' | 'alumno',
  dni?: string,
): Notification[] {
  const normalize = (value: string) => value.replace(/\D/g, '');
  return notifications.filter((n) => {
    if (n.audience !== audience) return false;
    if (audience === 'alumno' && n.studentDni) {
      return dni ? normalize(n.studentDni) === normalize(dni) : false;
    }
    return true;
  });
}

export function unreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/** Pedidos listos para retirar agrupados por colegio, para la agenda. */
export function pickupsBySchool(orders: Order[], schools: School[]) {
  return schools
    .map((school) => {
      const schoolOrders = orders.filter((o) => isLive(o) && o.schoolCode === school.code);
      return {
        school,
        ready: schoolOrders.filter((o) => o.deliveryStatus === 'Listo para retirar'),
        prepared: schoolOrders.filter((o) => o.deliveryStatus === 'Preparado'),
        waiting: schoolOrders.filter((o) => o.deliveryStatus === 'En espera'),
        pendingPayment: schoolOrders.filter((o) => o.paymentStatus === 'Pendiente de pago'),
      };
    })
    .sort((a, b) => a.school.nextDeliveryAt - b.school.nextDeliveryAt);
}
