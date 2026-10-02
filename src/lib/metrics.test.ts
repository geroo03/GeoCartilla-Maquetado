import assert from 'node:assert/strict';
import test from 'node:test';
import type { Order } from '../types/index.ts';
import { createInitialState } from '../store/demoReducer.ts';
import {
  computeOrderMetrics,
  deliveryFunnel,
  notificationsFor,
  ordersForStudent,
  revenueBySchool,
  topCartillas,
  weeklySeries,
} from './metrics.ts';

const state = createInitialState();

/** Pedido mínimo para armar escenarios a mano. */
function makeOrder(overrides: Partial<Order>): Order {
  return { ...state.orders[0], history: [], ...overrides };
}

test('las métricas cuadran con el total de pedidos', () => {
  const m = computeOrderMetrics(state.orders);
  assert.equal(
    m.waitingCount + m.preparedCount + m.readyCount + m.deliveredCount,
    m.total,
    'el embudo suma exactamente el total vivo',
  );
  assert.equal(m.total + m.canceledCount, state.orders.length);
  assert.ok(m.deliveryRate >= 0 && m.deliveryRate <= 1);
  assert.ok(m.collectionRate >= 0 && m.collectionRate <= 1);
});

test('la recaudación suma sólo los pedidos pagados', () => {
  const orders = [
    makeOrder({ id: 'a', paymentStatus: 'Pagado', price: 8000, deliveryStatus: 'Entregado' }),
    makeOrder({ id: 'b', paymentStatus: 'Pendiente de pago', price: 7500, deliveryStatus: 'En espera' }),
    makeOrder({ id: 'c', paymentStatus: 'Pagado', price: 1000, deliveryStatus: 'Listo para retirar' }),
  ];
  const m = computeOrderMetrics(orders);
  assert.equal(m.revenue, 9000);
  assert.equal(m.pendingCount, 1);
  assert.equal(m.pendingAmount, 7500);
  assert.equal(m.total, 3);
});

test('los pedidos cancelados quedan fuera de la operación', () => {
  const orders = [
    makeOrder({ id: 'a', paymentStatus: 'Pagado', price: 8000, deliveryStatus: 'Entregado' }),
    makeOrder({ id: 'b', paymentStatus: 'Reintegrado', price: 8000, deliveryStatus: 'Cancelado' }),
  ];
  const m = computeOrderMetrics(orders);
  assert.equal(m.total, 1, 'el cancelado no cuenta como pedido vivo');
  assert.equal(m.canceledCount, 1);
  assert.equal(m.revenue, 8000, 'el reintegrado no suma recaudación');
  assert.equal(m.refundedAmount, 8000);
  assert.equal(deliveryFunnel(orders).reduce((s, stage) => s + stage.count, 0), 1);
});

test('la serie semanal cubre la ventana completa y ubica cada pedido', () => {
  const now = Date.UTC(2026, 2, 18, 12, 0, 0); // miércoles
  const week = 7 * 24 * 3600_000;
  const orders = [
    makeOrder({ id: 'a', timestamp: now, paymentStatus: 'Pagado', price: 100 }),
    makeOrder({ id: 'b', timestamp: now - week, paymentStatus: 'Pagado', price: 200 }),
    makeOrder({ id: 'c', timestamp: now - week, paymentStatus: 'Pendiente de pago', price: 999 }),
    makeOrder({ id: 'd', timestamp: now - 50 * week }), // fuera de la ventana
  ];

  const series = weeklySeries(orders, 4, now);
  assert.equal(series.length, 4, 'devuelve siempre 4 semanas, aun las vacías');
  assert.deepEqual(series.map((p) => p.count), [0, 0, 2, 1]);
  assert.equal(series[2].revenue, 200, 'sólo lo pagado cuenta como recaudado');
  series.forEach((point, i) => {
    if (i > 0) assert.ok(series[i - 1].weekStart < point.weekStart, 'orden cronológico');
  });
});

test('el desglose por colegio incluye los colegios sin pedidos', () => {
  const rows = revenueBySchool(state.orders, state.schools);
  assert.equal(rows.length, state.schools.length);
  assert.equal(
    rows.reduce((sum, r) => sum + r.orders, 0),
    computeOrderMetrics(state.orders).total,
    'la suma por colegio reconstruye el total',
  );
  rows.forEach((row, i) => {
    if (i > 0) assert.ok(rows[i - 1].revenue >= row.revenue, 'ordenado por recaudación');
  });
});

test('el ranking de cartillas se ordena por cantidad de pedidos', () => {
  const top = topCartillas(state.orders, 3);
  assert.ok(top.length <= 3);
  top.forEach((row, i) => {
    if (i > 0) assert.ok(top[i - 1].orders >= row.orders);
  });
});

test('un alumno sólo ve sus propios pedidos, con o sin puntos en el DNI', () => {
  const target = state.orders[0];
  const mine = ordersForStudent(state.orders, target.studentDni);
  assert.ok(mine.length >= 1);
  assert.ok(mine.every((o) => o.studentDni === target.studentDni));

  assert.deepEqual(
    ordersForStudent(state.orders, target.studentDni.replace(/\./g, '')).map((o) => o.id),
    mine.map((o) => o.id),
    'el DNI sin puntos matchea igual',
  );
  assert.deepEqual(ordersForStudent(state.orders, undefined), [], 'sin sesión no hay pedidos');
});

test('las notificaciones del alumno no filtran las de otros', () => {
  const notifications = [
    { id: '1', kind: 'pago', audience: 'alumno', title: 't', body: 'b', at: 1, read: false, studentDni: '11.111.111' },
    { id: '2', kind: 'pago', audience: 'alumno', title: 't', body: 'b', at: 2, read: false, studentDni: '22.222.222' },
    { id: '3', kind: 'stock', audience: 'docente', title: 't', body: 'b', at: 3, read: false },
    { id: '4', kind: 'pedido', audience: 'alumno', title: 't', body: 'b', at: 4, read: false },
  ] as const;

  const mine = notificationsFor([...notifications], 'alumno', '11111111');
  assert.deepEqual(mine.map((n) => n.id), ['1', '4'], 'las propias y las generales, no las de otro alumno');
  assert.deepEqual(notificationsFor([...notifications], 'docente').map((n) => n.id), ['3']);
  assert.deepEqual(
    notificationsFor([...notifications], 'alumno').map((n) => n.id),
    ['4'],
    'sin DNI no se muestran las dirigidas',
  );
});
