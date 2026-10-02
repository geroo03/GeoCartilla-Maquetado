import assert from 'node:assert/strict';
import test from 'node:test';
import type { Order } from '../types/index.ts';
import { createInitialState, demoReducer } from './demoReducer.ts';

/**
 * Invariantes del reducer. Se corren con `npm test` (runner nativo de Node,
 * sin dependencias extra). Cubren justamente los puntos donde el maquetado
 * original mentía: stock que no bajaba, editar que duplicaba y estados que
 * no se promovían.
 */

const base = createInitialState();

const findPending = () =>
  base.orders.find((o) => o.paymentStatus === 'Pendiente de pago' && o.deliveryStatus === 'Preparado')!;

test('el seed es determinista y consistente', () => {
  const a = createInitialState(1_760_000_000_000);
  const b = createInitialState(1_760_000_000_000);
  assert.deepEqual(
    a.orders.map((o) => o.code),
    b.orders.map((o) => o.code),
    'dos corridas con el mismo reloj dan los mismos pedidos',
  );
  assert.equal(new Set(base.orders.map((o) => o.code)).size, base.orders.length, 'códigos únicos');
  assert.equal(new Set(base.orders.map((o) => o.studentDni)).size, base.orders.length, 'DNI únicos');

  for (const order of base.orders) {
    const cartilla = base.cartillas.find((c) => c.id === order.cartillaId)!;
    assert.ok(cartilla, `el pedido ${order.code} referencia una cartilla existente`);
    assert.equal(order.cartillaTitle, cartilla.title, 'el título coincide con la cartilla');
    assert.equal(order.cartillaPages, cartilla.pages, 'las páginas coinciden con la cartilla');
    assert.equal(order.price, cartilla.price, 'el precio coincide con la cartilla');
    assert.ok(
      base.schools.some((s) => s.code === order.schoolCode),
      'el colegio del pedido existe',
    );
  }
});

test('MARK_PAID cobra, promueve la entrega y deja rastro', () => {
  const pending = findPending();
  const next = demoReducer(base, { type: 'MARK_PAID', orderId: pending.id });
  const order = next.orders.find((o) => o.id === pending.id)!;

  assert.equal(order.paymentStatus, 'Pagado');
  assert.equal(order.deliveryStatus, 'Listo para retirar', 'preparado + pagado = listo para retirar');
  assert.equal(order.history.length, pending.history.length + 1);
  assert.equal(next.notifications[0].audience, 'alumno');
  assert.equal(next.notifications[0].studentDni, pending.studentDni);
  assert.equal(
    demoReducer(next, { type: 'MARK_PAID', orderId: pending.id }),
    next,
    'volver a cobrar no cambia nada',
  );
});

test('DELIVER sobre un impago cobra en el acto, en orden cronológico', () => {
  const unpaid = base.orders.find((o) => o.paymentStatus === 'Pendiente de pago')!;
  const next = demoReducer(base, { type: 'DELIVER', orderId: unpaid.id });
  const order = next.orders.find((o) => o.id === unpaid.id)!;

  assert.equal(order.deliveryStatus, 'Entregado');
  assert.equal(order.paymentStatus, 'Pagado');
  assert.equal(order.history.length, unpaid.history.length + 2, 'suma cobro y entrega');

  const labels = order.history.slice(-2).map((e) => e.label);
  assert.deepEqual(labels, ['Pago acreditado', 'Entregado'], 'el cobro antecede a la entrega');
  order.history.forEach((event, i, all) => {
    if (i > 0) assert.ok(all[i - 1].at <= event.at, 'historial ordenado por fecha');
  });
});

test('ADD_ORDER descuenta stock y CANCEL_ORDER lo devuelve', () => {
  const cartilla = base.cartillas.find((c) => c.isActive && c.stock > 0)!;
  const order: Order = { ...base.orders[0], id: 'test-1', code: 'GEO-9999', cartillaId: cartilla.id, history: [] };

  const added = demoReducer(base, { type: 'ADD_ORDER', order, actor: 'alumno' });
  assert.equal(added.cartillas.find((c) => c.id === cartilla.id)!.stock, cartilla.stock - 1);
  assert.equal(added.stockMovements[0].delta, -1);
  assert.equal(added.stockMovements[0].reason, 'pedido');
  assert.equal(added.orders[0].id, 'test-1', 'el pedido nuevo queda primero');

  const canceled = demoReducer(added, { type: 'CANCEL_ORDER', orderId: 'test-1', actor: 'alumno' });
  assert.equal(
    canceled.cartillas.find((c) => c.id === cartilla.id)!.stock,
    cartilla.stock,
    'el ejemplar vuelve al stock',
  );
  assert.equal(canceled.orders.find((o) => o.id === 'test-1')!.deliveryStatus, 'Cancelado');
  assert.equal(
    demoReducer(canceled, { type: 'CANCEL_ORDER', orderId: 'test-1', actor: 'alumno' }),
    canceled,
    'cancelar dos veces no duplica la devolución de stock',
  );
});

test('cancelar un pedido ya pagado lo marca como reintegrado', () => {
  const paid = base.orders.find((o) => o.paymentStatus === 'Pagado')!;
  const next = demoReducer(base, { type: 'CANCEL_ORDER', orderId: paid.id, actor: 'docente' });
  assert.equal(next.orders.find((o) => o.id === paid.id)!.paymentStatus, 'Reintegrado');
});

test('el stock nunca queda negativo', () => {
  const cartilla = base.cartillas[0];
  const next = demoReducer(base, { type: 'ADJUST_STOCK', id: cartilla.id, delta: -9999, reason: 'ajuste' });
  assert.equal(next.cartillas.find((c) => c.id === cartilla.id)!.stock, 0);
});

test('BULK_DELIVER entrega el lote e ignora los ya entregados', () => {
  const ids = base.orders
    .filter((o) => o.deliveryStatus !== 'Entregado')
    .slice(0, 4)
    .map((o) => o.id);

  const next = demoReducer(base, { type: 'BULK_DELIVER', orderIds: ids });
  ids.forEach((id) => {
    assert.equal(next.orders.find((o) => o.id === id)!.deliveryStatus, 'Entregado');
  });
  assert.equal(
    demoReducer(next, { type: 'BULK_DELIVER', orderIds: ids }),
    next,
    'reaplicar el lote no cambia nada',
  );
});

test('UPSERT_CARTILLA edita cuando el id existe y agrega cuando es nuevo', () => {
  const cartilla = base.cartillas[0];

  const edited = demoReducer(base, {
    type: 'UPSERT_CARTILLA',
    cartilla: { ...cartilla, title: 'Editada', price: 9999 },
  });
  assert.equal(edited.cartillas.length, base.cartillas.length, 'editar no duplica');
  assert.equal(edited.cartillas.find((c) => c.id === cartilla.id)!.title, 'Editada');

  const created = demoReducer(base, {
    type: 'UPSERT_CARTILLA',
    cartilla: { ...cartilla, id: 'cart-nueva' },
  });
  assert.equal(created.cartillas.length, base.cartillas.length + 1);
  assert.equal(created.stockMovements[0].reason, 'alta');
});

test('RESTORE habilita el undo genérico', () => {
  const mutated = demoReducer(base, { type: 'BULK_DELIVER', orderIds: [base.orders[0].id] });
  assert.notEqual(mutated, base);
  assert.equal(demoReducer(mutated, { type: 'RESTORE', state: base }), base);
});

test('el estado es serializable para localStorage', () => {
  const mutated = demoReducer(base, { type: 'MARK_PAID', orderId: findPending().id });
  assert.deepEqual(JSON.parse(JSON.stringify(mutated)), mutated);
});
