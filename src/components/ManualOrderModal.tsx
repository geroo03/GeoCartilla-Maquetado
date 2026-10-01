import React, { useState } from 'react';
import { Cartilla, Order, PaymentMethod, PaymentStatus, DeliveryStatus } from '../types/index.ts';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartillas: Cartilla[];
  onAddOrder: (newOrder: Order) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  cartillas,
  onAddOrder,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentDni, setStudentDni] = useState('');
  const [studentPhone, setStudentPhone] = useState('+54 9 11 ');
  const [selectedCartillaId, setSelectedCartillaId] = useState(cartillas[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo retiro');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pendiente de pago');

  if (!isOpen) return null;

  const selectedCartilla = cartillas.find((c) => c.id === selectedCartillaId) || cartillas[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentDni.trim()) return;

    const randomNum = Math.floor(4830 + Math.random() * 50);
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder: Order = {
      id: `geo-${randomNum}`,
      code: `GEO-${randomNum}`,
      studentName: studentName.trim(),
      studentDni: studentDni.trim(),
      studentEmail: `${studentName.toLowerCase().replace(/\s+/g, '.')}@colegio.edu.ar`,
      studentPhone: studentPhone.trim() || '+54 9 11 5000-0000',
      school: selectedCartilla?.school || 'Col. Nacional San Martín',
      schoolCode: selectedCartilla?.schoolCode || 'san-martin',
      year: selectedCartilla?.year || '3° Año',
      division: `${selectedCartilla?.year || '3° Año'} (Div. A)`,
      cartillaId: selectedCartilla?.id || 'cart-03',
      cartillaTitle: selectedCartilla?.title || 'Geografía 3° Año',
      cartillaCover: selectedCartilla?.coverUrl || '',
      cartillaPages: selectedCartilla?.pages || 120,
      paymentMethod,
      paymentStatus,
      deliveryStatus: (paymentStatus === 'Pagado' ? 'Listo para retirar' : 'Preparado') as DeliveryStatus,
      date: formattedDate,
      timestamp: Date.now(),
      price: selectedCartilla?.price || 8000,
      pickupLocation: 'Mesa de Geografía - Sala de Profesores',
    };

    onAddOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-surface-container-high/60">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-primary">add_shopping_cart</span>
            <h3 className="text-base font-bold text-primary">Cargar Pedido Manual</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          <div>
            <label className="font-semibold text-on-surface block mb-1">Nombre y apellido del alumno *</label>
            <input
              required
              className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ej. Agustín Peralta"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-on-surface block mb-1">DNI del alumno *</label>
              <input
                required
                className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="46.789.123"
                type="text"
                value={studentDni}
                onChange={(e) => setStudentDni(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-on-surface block mb-1">WhatsApp / Contacto</label>
              <input
                className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                type="text"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Cartilla a encargar *</label>
            <select
              className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              value={selectedCartillaId}
              onChange={(e) => setSelectedCartillaId(e.target.value)}
            >
              {cartillas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} • {c.school} (${c.price.toLocaleString('es-AR')} ARS)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-on-surface block mb-1">Método de Cobro</label>
              <select
                className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="Efectivo retiro">Efectivo al retirar</option>
                <option value="Mercado Pago">Mercado Pago / Transferencia</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-on-surface block mb-1">Estado Inicial del Pago</label>
              <select
                className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              >
                <option value="Pendiente de pago">Pendiente de pago</option>
                <option value="Pagado">Ya Pagado</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-surface-container-low">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-lg text-on-surface-variant font-semibold hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold shadow-sm"
            >
              Cargar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
