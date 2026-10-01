import React, { useState } from 'react';
import { School } from '../types/index.ts';

interface SchoolsViewProps {
  schools: School[];
  onAddSchool: (school: School) => void;
}

export const SchoolsView: React.FC<SchoolsViewProps> = ({ schools, onAddSchool }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [phone, setPhone] = useState('+54 9 11 ');
  const [delivery, setDelivery] = useState('Viernes 09:00 hs');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSchool: School = {
      id: `school-${Date.now()}`,
      code: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: name.trim(),
      address: address.trim() || 'CABA, Argentina',
      divisions: ['1° Año (1-2)', '2° Año (1-2)', '3° Año (A-B)'],
      coordinator: coordinator.trim() || 'Prof. a designar',
      studentsCount: 120,
      nextDelivery: delivery.trim(),
      phone: phone.trim(),
    };

    onAddSchool(newSchool);
    setShowAddModal(false);
    setName('');
    setAddress('');
    setCoordinator('');
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[20px]">school</span>
            <span className="text-xs font-bold uppercase tracking-wider">Red de Instituciones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-0.5">
            Colegios Adscriptos
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Instituciones educativas con convenios de entrega directa en Sala de Profesores.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-sm hover:bg-primary-container transition-all cursor-pointer self-start sm:self-auto active:scale-95"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Adscribir Colegio</span>
        </button>
      </div>

      {/* Grid of Schools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schools.map((school) => (
          <div
            key={school.id}
            className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high/60 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                    <span className="material-symbols-outlined text-[22px]">account_balance</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary">{school.name}</h3>
                    <p className="text-xs text-outline flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {school.address}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                  Activo 2025
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-container-low grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-outline block mb-0.5 text-[11px]">Coordinador docente:</span>
                  <span className="font-semibold text-on-surface">{school.coordinator}</span>
                </div>
                <div>
                  <span className="text-outline block mb-0.5 text-[11px]">Próxima remesa:</span>
                  <span className="font-semibold text-secondary">{school.nextDelivery}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {school.divisions.map((div, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium bg-surface-container text-on-surface-variant px-2 py-0.5 rounded"
                  >
                    {div}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container-low flex items-center justify-between text-xs">
              <span className="text-outline">
                <strong className="text-primary font-mono">{school.studentsCount}</strong> alumnos registrados
              </span>
              <a
                href={`https://wa.me/${school.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>{school.phone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add School Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-surface-container-high/60">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-surface-container-low">
              <h3 className="text-base font-bold text-primary">Adscribir Nuevo Colegio</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-on-surface block mb-1">Nombre del Colegio *</label>
                <input
                  required
                  placeholder="ej. Colegio San José"
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-on-surface block mb-1">Dirección / Sede</label>
                <input
                  placeholder="ej. Av. Rivadavia 4500, Caballito"
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-on-surface block mb-1">Profesor / Coordinador</label>
                  <input
                    placeholder="Prof. Juan Pérez"
                    className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs"
                    value={coordinator}
                    onChange={(e) => setCoordinator(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-semibold text-on-surface block mb-1">Teléfono</label>
                  <input
                    className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-on-surface block mb-1">Día de Remesa habitual</label>
                <input
                  placeholder="ej. Jueves 09:30 hs"
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-on-surface-variant font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-sm"
                >
                  Guardar Colegio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
