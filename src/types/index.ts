export type PaymentMethod = 'Mercado Pago' | 'Efectivo retiro';
export type PaymentStatus = 'Pagado' | 'Pendiente de pago';
export type DeliveryStatus = 'Listo para retirar' | 'Preparado' | 'Entregado' | 'En espera';

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
  coverUrl: string;
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
  phone: string;
}
