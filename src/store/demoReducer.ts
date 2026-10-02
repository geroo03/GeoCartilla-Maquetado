import type {
  Cartilla,
  DeliveryStatus,
  EventActor,
  Notification,
  NotificationAudience,
  Order,
  OrderEvent,
  PaymentStatus,
  School,
  StockMovement,
  StockReason,
  Student,
  TeacherSession,
} from '../types/index.ts';
import { buildSeed } from '../data/seed.ts';
import { formatARS } from '../lib/format.ts';

/**
 * Lógica pura del estado de la demo: el reducer, el estado inicial y el
 * acceso a localStorage. Sin React, para poder probarlo de forma aislada.
 * El wiring con React vive en demoStore.tsx.
 */

const STORAGE_KEY = 'geocartillas.demo';
const SCHEMA_VERSION = 1;

export interface DemoState {
  cartillas: Cartilla[];
  orders: Order[];
  schools: School[];
  notifications: Notification[];
  stockMovements: StockMovement[];
  teacher: TeacherSession | null;
  student: Student | null;
}

export type DemoAction =
  | { type: 'MARK_PAID'; orderId: string }
  | { type: 'DELIVER'; orderId: string }
  | { type: 'BULK_DELIVER'; orderIds: string[] }
  | { type: 'PREPARE'; orderId: string }
  | { type: 'CANCEL_ORDER'; orderId: string; actor: EventActor; reason?: string }
  | { type: 'ADD_ORDER'; order: Order; actor: EventActor }
  | { type: 'SET_ORDER_NOTES'; orderId: string; notes: string }
  | { type: 'UPSERT_CARTILLA'; cartilla: Cartilla }
  | { type: 'TOGGLE_CARTILLA'; id: string }
  | { type: 'DELETE_CARTILLA'; id: string }
  | { type: 'ADJUST_STOCK'; id: string; delta: number; reason: StockReason; note?: string }
  | { type: 'UPSERT_SCHOOL'; school: School }
  | { type: 'DELETE_SCHOOL'; id: string }
  | { type: 'LOGIN_TEACHER'; session: TeacherSession }
  | { type: 'LOGIN_STUDENT'; student: Student }
  | { type: 'UPDATE_STUDENT'; student: Student }
  | { type: 'LOGOUT'; scope: 'teacher' | 'student' }
  | { type: 'READ_NOTIFICATION'; id: string }
  | { type: 'READ_ALL_NOTIFICATIONS'; audience: NotificationAudience }
  | { type: 'RESET_DEMO' }
  | { type: 'RESTORE'; state: DemoState };

export function createInitialState(now = Date.now()): DemoState {
  const { orders, notifications, cartillas, schools } = buildSeed(now);
  return {
    cartillas,
    orders,
    schools,
    notifications,
    stockMovements: [],
    teacher: null,
    student: null,
  };
}

let notificationSeq = 0;
export function nextId(prefix: string): string {
  notificationSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${notificationSeq}`;
}

function notify(
  state: DemoState,
  entry: Omit<Notification, 'id' | 'at' | 'read'> & { at?: number },
): Notification[] {
  const notification: Notification = {
    id: nextId('ntf'),
    at: entry.at ?? Date.now(),
    read: false,
    ...entry,
  };
  return [notification, ...state.notifications];
}

/** Aplica un cambio a un pedido agregando un evento a su historial. */
function patchOrder(
  orders: Order[],
  orderId: string,
  patch: Partial<Order>,
  event: Omit<OrderEvent, 'at'> & { at?: number },
): Order[] {
  return orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          ...patch,
          history: [...order.history, { at: event.at ?? Date.now(), ...event }],
        }
      : order,
  );
}

function adjustStock(
  state: DemoState,
  cartillaId: string,
  delta: number,
  reason: StockReason,
  note?: string,
): Pick<DemoState, 'cartillas' | 'stockMovements'> {
  const cartilla = state.cartillas.find((c) => c.id === cartillaId);
  if (!cartilla) return { cartillas: state.cartillas, stockMovements: state.stockMovements };

  const movement: StockMovement = {
    id: nextId('mov'),
    cartillaId,
    cartillaTitle: cartilla.title,
    delta,
    reason,
    at: Date.now(),
    note,
  };

  return {
    cartillas: state.cartillas.map((c) =>
      c.id === cartillaId ? { ...c, stock: Math.max(0, c.stock + delta) } : c,
    ),
    stockMovements: [movement, ...state.stockMovements],
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'MARK_PAID': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || order.paymentStatus === 'Pagado') return state;

      // Si ya estaba preparado, cobrarlo lo habilita para el retiro.
      const nextDelivery: DeliveryStatus =
        order.deliveryStatus === 'Preparado' || order.deliveryStatus === 'En espera'
          ? 'Listo para retirar'
          : order.deliveryStatus;

      return {
        ...state,
        orders: patchOrder(
          state.orders,
          action.orderId,
          { paymentStatus: 'Pagado', deliveryStatus: nextDelivery },
          {
            actor: 'docente',
            label: 'Pago acreditado',
            detail: `Cobro de ${formatARS(order.price)} registrado y conciliado.`,
          },
        ),
        notifications: notify(state, {
          kind: 'pago',
          audience: 'alumno',
          title: 'Pago confirmado',
          body: `Registramos tu pago de ${formatARS(order.price)} por ${order.cartillaTitle}.`,
          orderId: order.id,
          studentDni: order.studentDni,
        }),
      };
    }

    case 'PREPARE': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      return {
        ...state,
        orders: patchOrder(
          state.orders,
          action.orderId,
          { deliveryStatus: order.paymentStatus === 'Pagado' ? 'Listo para retirar' : 'Preparado' },
          {
            actor: 'docente',
            label: 'Ejemplar preparado',
            detail: 'Ejemplar separado de la remesa y rotulado con el código del pedido.',
          },
        ),
      };
    }

    case 'DELIVER': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || order.deliveryStatus === 'Entregado') return state;

      const wasUnpaid = order.paymentStatus !== 'Pagado';
      const now = Date.now();

      // Si se cobra en el acto, el pago va primero: el historial se renderiza
      // en orden de aparición y el cobro antecede a la entrega.
      let orders = state.orders;
      if (wasUnpaid) {
        orders = patchOrder(
          orders,
          action.orderId,
          {},
          {
            actor: 'docente',
            label: 'Pago acreditado',
            detail: `Cobro en efectivo de ${formatARS(order.price)} al momento del retiro.`,
            at: now,
          },
        );
      }
      orders = patchOrder(
        orders,
        action.orderId,
        { deliveryStatus: 'Entregado', paymentStatus: 'Pagado' },
        {
          actor: 'docente',
          label: 'Entregado',
          detail: wasUnpaid
            ? `Retirado con pago en efectivo de ${formatARS(order.price)} en el acto.`
            : 'Retirado por el alumno con presentación de DNI.',
          at: now + 1,
        },
      );

      return {
        ...state,
        orders,
        notifications: notify(state, {
          kind: 'entrega',
          audience: 'alumno',
          title: 'Cartilla entregada',
          body: `Retiraste ${order.cartillaTitle}. ¡Que la aproveches!`,
          orderId: order.id,
          studentDni: order.studentDni,
        }),
      };
    }

    case 'BULK_DELIVER': {
      const targets = state.orders.filter(
        (o) => action.orderIds.includes(o.id) && o.deliveryStatus !== 'Entregado' && o.deliveryStatus !== 'Cancelado',
      );
      if (targets.length === 0) return state;

      let orders = state.orders;
      targets.forEach((order) => {
        orders = patchOrder(
          orders,
          order.id,
          { deliveryStatus: 'Entregado', paymentStatus: 'Pagado' },
          {
            actor: 'docente',
            label: 'Entregado',
            detail: `Entrega registrada en lote (${targets.length} ejemplares).`,
          },
        );
      });

      return {
        ...state,
        orders,
        notifications: notify(state, {
          kind: 'entrega',
          audience: 'docente',
          title: 'Entrega en lote',
          body: `${targets.length} ejemplares marcados como entregados.`,
        }),
      };
    }

    case 'CANCEL_ORDER': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || order.deliveryStatus === 'Cancelado') return state;

      // Cancelar devuelve el ejemplar al stock.
      const stock = adjustStock(
        state,
        order.cartillaId,
        1,
        'cancelacion',
        `Pedido ${order.code} cancelado`,
      );

      const paymentStatus: PaymentStatus =
        order.paymentStatus === 'Pagado' ? 'Reintegrado' : 'Pendiente de pago';

      return {
        ...state,
        ...stock,
        orders: patchOrder(
          state.orders,
          action.orderId,
          { deliveryStatus: 'Cancelado', paymentStatus },
          {
            actor: action.actor,
            label: 'Pedido cancelado',
            detail:
              order.paymentStatus === 'Pagado'
                ? `${action.reason ?? 'Cancelación solicitada'}. Se reintegraron ${formatARS(order.price)} y el ejemplar volvió al stock.`
                : `${action.reason ?? 'Cancelación solicitada'}. El ejemplar volvió al stock.`,
          },
        ),
        notifications: notify(state, {
          kind: 'pedido',
          audience: action.actor === 'alumno' ? 'docente' : 'alumno',
          title: 'Pedido cancelado',
          body:
            action.actor === 'alumno'
              ? `${order.studentName} canceló el pedido ${order.code}.`
              : `Tu pedido ${order.code} fue cancelado por la cátedra.`,
          orderId: order.id,
          studentDni: action.actor === 'docente' ? order.studentDni : undefined,
        }),
      };
    }

    case 'ADD_ORDER': {
      // Un pedido nuevo consume un ejemplar del stock.
      const stock = adjustStock(
        state,
        action.order.cartillaId,
        -1,
        'pedido',
        `Pedido ${action.order.code}`,
      );

      return {
        ...state,
        ...stock,
        orders: [action.order, ...state.orders],
        notifications: notify(state, {
          kind: 'pedido',
          audience: 'docente',
          title: action.actor === 'alumno' ? 'Nuevo pedido del portal' : 'Pedido cargado a mano',
          body: `${action.order.studentName} (${action.order.division}) pidió ${action.order.cartillaTitle}.`,
          orderId: action.order.id,
        }),
      };
    }

    case 'SET_ORDER_NOTES':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, notes: action.notes } : o,
        ),
      };

    case 'UPSERT_CARTILLA': {
      const exists = state.cartillas.some((c) => c.id === action.cartilla.id);
      if (exists) {
        return {
          ...state,
          cartillas: state.cartillas.map((c) =>
            c.id === action.cartilla.id ? action.cartilla : c,
          ),
        };
      }
      return {
        ...state,
        cartillas: [action.cartilla, ...state.cartillas],
        stockMovements: [
          {
            id: nextId('mov'),
            cartillaId: action.cartilla.id,
            cartillaTitle: action.cartilla.title,
            delta: action.cartilla.stock,
            reason: 'alta',
            at: Date.now(),
            note: 'Stock inicial del alta de catálogo',
          },
          ...state.stockMovements,
        ],
      };
    }

    case 'TOGGLE_CARTILLA':
      return {
        ...state,
        cartillas: state.cartillas.map((c) =>
          c.id === action.id ? { ...c, isActive: !c.isActive } : c,
        ),
      };

    case 'DELETE_CARTILLA':
      return {
        ...state,
        cartillas: state.cartillas.filter((c) => c.id !== action.id),
      };

    case 'ADJUST_STOCK': {
      const stock = adjustStock(state, action.id, action.delta, action.reason, action.note);
      return { ...state, ...stock };
    }

    case 'UPSERT_SCHOOL': {
      const exists = state.schools.some((s) => s.id === action.school.id);
      return {
        ...state,
        schools: exists
          ? state.schools.map((s) => (s.id === action.school.id ? action.school : s))
          : [...state.schools, action.school],
      };
    }

    case 'DELETE_SCHOOL':
      return {
        ...state,
        schools: state.schools.filter((s) => s.id !== action.id),
      };

    case 'LOGIN_TEACHER':
      return { ...state, teacher: action.session };

    case 'LOGIN_STUDENT':
      return { ...state, student: action.student };

    case 'UPDATE_STUDENT':
      return { ...state, student: action.student };

    case 'LOGOUT':
      return action.scope === 'teacher'
        ? { ...state, teacher: null }
        : { ...state, student: null };

    case 'READ_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };

    case 'READ_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.audience === action.audience ? { ...n, read: true } : n,
        ),
      };

    case 'RESET_DEMO':
      return createInitialState();

    case 'RESTORE':
      return action.state;

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */

/**
 * Lee el estado guardado. Devuelve null si no hay nada, si la versión de
 * esquema cambió o si el JSON está corrupto: en cualquiera de esos casos se
 * vuelve a sembrar. El acceso va en try/catch porque localStorage lanza en
 * ventana privada o con las cookies bloqueadas.
 */
export function loadState(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}.v${SCHEMA_VERSION}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version: number; state: DemoState };
    if (parsed.version !== SCHEMA_VERSION) return null;
    if (!Array.isArray(parsed.state?.orders) || !Array.isArray(parsed.state?.cartillas)) {
      return null;
    }
    return parsed.state;
  } catch {
    return null;
  }
}

export function saveState(state: DemoState): void {
  try {
    window.localStorage.setItem(
      `${STORAGE_KEY}.v${SCHEMA_VERSION}`,
      JSON.stringify({ version: SCHEMA_VERSION, state }),
    );
  } catch {
    // Sin persistencia la demo sigue andando en memoria.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(`${STORAGE_KEY}.v${SCHEMA_VERSION}`);
  } catch {
    /* noop */
  }
}
