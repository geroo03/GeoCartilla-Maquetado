import React from 'react';
import { Order } from '../types/index.ts';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-surface-container-high">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-surface-container-low bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">print</span>
            <div>
              <h3 className="text-base font-bold text-primary">Planilla de Retiro Institucional</h3>
              <p className="text-xs text-outline">
                Control de firmas y entregas para la Mesa de Geografía • Sala de Profesores
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir Documento</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-8 overflow-y-auto bg-white text-black font-sans print:p-0">
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">GeoCartillas Editorial</h1>
              <h2 className="text-sm font-semibold text-gray-700">
                Planilla de Retiro de Cartillas • Ciclo Lectivo 2025
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Punto de entrega: Mesa de Geografía (Sala de Profesores) • Prof. Titular Martín Gómez
              </p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p>Fecha de emisión: {new Date().toLocaleDateString('es-AR')}</p>
              <p>Total registros: {orders.length}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                <th className="p-2 border-r border-gray-300 w-16">Código</th>
                <th className="p-2 border-r border-gray-300">Alumno / DNI</th>
                <th className="p-2 border-r border-gray-300">Colegio / Año</th>
                <th className="p-2 border-r border-gray-300">Cartilla Solicitada</th>
                <th className="p-2 border-r border-gray-300 w-28">Estado / Cobro</th>
                <th className="p-2 w-36">Firma de Retiro</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={o.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 border-r border-gray-300 font-mono font-bold">{o.code}</td>
                  <td className="p-2 border-r border-gray-300">
                    <div className="font-bold">{o.studentName}</div>
                    <div className="text-[11px] text-gray-600">DNI {o.studentDni}</div>
                  </td>
                  <td className="p-2 border-r border-gray-300">
                    <div>{o.school}</div>
                    <div className="text-[11px] text-gray-600">{o.year}</div>
                  </td>
                  <td className="p-2 border-r border-gray-300 font-medium">{o.cartillaTitle}</td>
                  <td className="p-2 border-r border-gray-300">
                    <div className="font-semibold">{o.paymentStatus}</div>
                    <div className="text-[11px] text-gray-600">
                      ${o.price.toLocaleString('es-AR')} ({o.paymentMethod})
                    </div>
                  </td>
                  <td className="p-2 border-b border-gray-300 h-10"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-600">
            <div>
              <p>Firma y Aclaración del Docente Receptor: ___________________________</p>
            </div>
            <div>
              <p>Soporte de imprenta: +54 9 11 5820-9411</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
