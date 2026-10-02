import type { Order } from '../types/index.ts';

/** Escapa un valor para CSV: comillas dobles y separadores. */
function cell(value: string | number): string {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Dispara la descarga de un CSV en el navegador. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const content = [headers, ...rows].map((row) => row.map(cell).join(',')).join('\n');
  // BOM para que Excel en es-AR respete los acentos.
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ORDER_HEADERS = [
  'Código', 'Alumno', 'DNI', 'Email', 'Teléfono', 'Colegio', 'Año', 'División',
  'Cartilla', 'Método Pago', 'Estado Pago', 'Estado Entrega', 'Monto ARS', 'Fecha',
];

export function exportOrdersCsv(orders: Order[], suffix = ''): void {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(
    `GeoCartillas_Pedidos${suffix ? `_${suffix}` : ''}_${stamp}.csv`,
    ORDER_HEADERS,
    orders.map((o) => [
      o.code, o.studentName, o.studentDni, o.studentEmail, o.studentPhone,
      o.school, o.year, o.division, o.cartillaTitle, o.paymentMethod,
      o.paymentStatus, o.deliveryStatus, o.price, o.date,
    ]),
  );
}
