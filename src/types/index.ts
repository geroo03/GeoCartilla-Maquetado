export type PaymentMethod = 'Mercado Pago' | 'Efectivo retiro';
export type PaymentStatus = 'Pagado' | 'Pendiente de pago' | 'Reintegrado';
export type DeliveryStatus =
  | 'Listo para retirar'
  | 'Preparado'
  | 'Entregado'
  | 'En espera'
  | 'Cancelado';

/** Quién originó un evento del historial de un pedido. */
export type EventActor = 'docente' | 'alumno' | 'sistema';

/** Una entrada del historial de un pedido (timeline del detalle). */
export interface OrderEvent {
  at: number;
  actor: EventActor;
  label: string;
  detail?: string;
}

/** Motivo de la tapa generada por CoverArt cuando no hay coverUrl. */
export type CoverMotif = 'topographic' | 'satellite' | 'political' | 'climate' | 'urban';

export interface Cartilla {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  school: string;
  schoolCode: string;
  year: string;
  divisions: string;
  price: number;
  stock: number;
  isActive: boolean;
  pages: number;
  features: string[];
  /** URL externa opcional; si está vacía se dibuja una tapa con CoverArt. */
  coverUrl: string;
  coverMotif: CoverMotif;
  tag: string;
  edition: string;
}

export interface Order {
  id: string;
  code: string;
  studentName: string;
  studentDni: string;
  studentEmail: string;
  studentPhone: string;
  school: string;
  schoolCode: string;
  year: string;
  division: string;
  cartillaId: string;
  cartillaTitle: string;
  cartillaCover: string;
  cartillaPages: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  date: string;
  timestamp: number;
  price: number;
  pickupLocation: string;
  /** Timeline de cambios de estado, del más viejo al más nuevo. */
  history: OrderEvent[];
  /** Nota interna del docente. */
  notes?: string;
}

export interface School {
  id: string;
  code: string;
  name: string;
  address: string;
  divisions: string[];
  coordinator: string;
  studentsCount: number;
  nextDelivery: string;
  /** Timestamp de la próxima ventana de retiro, para ordenar la agenda. */
  nextDeliveryAt: number;
  phone: string;
}

/** Alumno con sesión abierta en el portal. */
export interface Student {
  id: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  school: string;
  schoolCode: string;
  division: string;
}

/** Docente con sesión abierta en el panel. */
export interface TeacherSession {
  email: string;
  name: string;
  role: string;
}

export type NotificationKind = 'pedido' | 'pago' | 'entrega' | 'stock' | 'remesa';
export type NotificationAudience = 'docente' | 'alumno';

export interface Notification {
  id: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  title: string;
  body: string;
  at: number;
  read: boolean;
  orderId?: string;
  /** Si está presente, la notificación es sólo para ese alumno. */
  studentDni?: string;
}

export type StockReason = 'pedido' | 'cancelacion' | 'reposicion' | 'ajuste' | 'alta';

export interface StockMovement {
  id: string;
  cartillaId: string;
  cartillaTitle: string;
  /** Negativo descuenta, positivo repone. */
  delta: number;
  reason: StockReason;
  at: number;
  note?: string;
}
