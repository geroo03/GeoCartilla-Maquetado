import React, { useState } from 'react';
import type { Student } from '../../types/index.ts';
import { useDemo } from '../../store/demoStore.tsx';
import { Icon } from '../ui/Icon.tsx';

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary';

/** Un alumno de ejemplo para entrar de una, sin tipear. */
const DEMO_STUDENT = {
  name: 'Sofía Martínez',
  dni: '47.382.115',
  email: 'sofia.martinez23@gmail.com',
  phone: '+54 9 11 5849-2041',
};

interface AuthTabProps {
  onAuthenticated: (student: Student) => void;
}

/**
 * Registro e ingreso del alumno. En el maquetado original los dos formularios
 * sólo hacían setActiveTab('catalogo'): no creaban sesión ni validaban nada, y
 * los datos del alumno estaban escritos a mano en un useState.
 */
export const AuthTab: React.FC<AuthTabProps> = ({ onAuthenticated }) => {
  const { state } = useDemo();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState(DEMO_STUDENT.name);
  const [dni, setDni] = useState(DEMO_STUDENT.dni);
  const [email, setEmail] = useState(DEMO_STUDENT.email);
  const [phone, setPhone] = useState(DEMO_STUDENT.phone);
  const [password, setPassword] = useState('cartilla2026');
  const [schoolCode, setSchoolCode] = useState(state.schools[0]?.code ?? '');
  const [division, setDivision] = useState(state.schools[0]?.divisions[0] ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const school = state.schools.find((s) => s.code === schoolCode) ?? state.schools[0];

  const buildStudent = (dniValue: string, nameValue: string, emailValue: string): Student => ({
    id: dniValue.replace(/\D/g, ''),
    name: nameValue.trim(),
    dni: dniValue.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
    email: emailValue.trim(),
    phone: phone.trim(),
    school: school?.name ?? '',
    schoolCode: school?.code ?? '',
    division: division || school?.divisions[0] || '',
  });

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};

    if (name.trim().length < 3) found.name = 'Escribí tu nombre y apellido.';
    const digits = dni.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 8) found.dni = 'El DNI tiene 7 u 8 dígitos.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = 'Revisá tu correo.';
    if (password.length < 6) found.password = 'Mínimo 6 caracteres.';

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    onAuthenticated(buildStudent(dni, name, email));
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Revisá tu correo.' });
      return;
    }
    if (password.length < 6) {
      setErrors({ password: 'Mínimo 6 caracteres.' });
      return;
    }
    setErrors({});

    // Si el correo coincide con un pedido existente, recupera esos datos:
    // así "Mis pedidos" muestra el historial real de ese alumno.
    const previous = state.orders.find(
      (order) => order.studentEmail.toLowerCase() === email.trim().toLowerCase(),
    );

    if (previous) {
      onAuthenticated({
        id: previous.studentDni.replace(/\D/g, ''),
        name: previous.studentName,
        dni: previous.studentDni,
        email: previous.studentEmail,
        phone: previous.studentPhone,
        school: previous.school,
        schoolCode: previous.schoolCode,
        division: previous.division,
      });
      return;
    }

    onAuthenticated(buildStudent(dni, name, email));
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="flex rounded-xl bg-surface-container p-1">
        {(
          [
            { value: 'register' as const, label: 'Crear cuenta' },
            { value: 'login' as const, label: 'Ya tengo cuenta' },
          ]
        ).map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setMode(option.value);
              setErrors({});
            }}
            className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
              mode === option.value
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant'
            }`}
            type="button"
            aria-pressed={mode === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high/60 flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-primary">
              {mode === 'register' ? 'Registrate para pedir' : 'Ingresar a tu cuenta'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {mode === 'register'
                ? 'Completá tus datos para acceder a tu material escolar.'
                : 'Accedé a tus cartillas pedidas y comprobantes.'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <Icon name="school" size={18} />
          </div>
        </div>

        <form
          onSubmit={mode === 'register' ? handleRegister : handleLogin}
          className="flex flex-col gap-3 text-xs"
        >
          {mode === 'register' && (
            <>
              <label className="flex flex-col gap-1">
                <span className="font-semibold text-primary">Nombre y apellido</span>
                <div className="relative flex items-center">
                  <Icon name="person" size={18} className="absolute left-3 text-outline" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="Sofía Martínez"
                    aria-invalid={!!errors.name}
                  />
                </div>
                {errors.name && <span className="text-[10px] font-semibold text-error">{errors.name}</span>}
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-semibold text-primary">DNI</span>
                <div className="relative flex items-center">
                  <Icon name="badge" size={18} className="absolute left-3 text-outline" />
                  <input
                    value={dni}
                    onChange={(event) => setDni(event.target.value)}
                    inputMode="numeric"
                    className={`${inputClass} pl-9 font-mono`}
                    placeholder="47.382.115"
                    aria-invalid={!!errors.dni}
                  />
                </div>
                {errors.dni && <span className="text-[10px] font-semibold text-error">{errors.dni}</span>}
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-semibold text-primary">Colegio</span>
                <select
                  value={schoolCode}
                  onChange={(event) => {
                    setSchoolCode(event.target.value);
                    const next = state.schools.find((s) => s.code === event.target.value);
                    setDivision(next?.divisions[0] ?? '');
                  }}
                  className={`${inputClass} cursor-pointer`}
                >
                  {state.schools.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-semibold text-primary">Año y división</span>
                <select
                  value={division}
                  onChange={(event) => setDivision(event.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  {school?.divisions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-semibold text-primary">Teléfono</span>
                <div className="relative flex items-center">
                  <Icon name="call" size={18} className="absolute left-3 text-outline" />
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={`${inputClass} pl-9 font-mono`}
                  />
                </div>
              </label>
            </>
          )}

          <label className="flex flex-col gap-1">
            <span className="font-semibold text-primary">Email</span>
            <div className="relative flex items-center">
              <Icon name="mail" size={18} className="absolute left-3 text-outline" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className={`${inputClass} pl-9`}
                placeholder="sofia.martinez23@gmail.com"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <span className="text-[10px] font-semibold text-error">{errors.email}</span>}
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-semibold text-primary">Contraseña</span>
            <div className="relative flex items-center">
              <Icon name="lock" size={18} className="absolute left-3 text-outline" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pl-9 pr-10`}
                aria-invalid={!!errors.password}
              />
              <button
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 w-7 h-7 rounded-full flex items-center justify-center text-outline hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
            {errors.password && (
              <span className="text-[10px] font-semibold text-error">{errors.password}</span>
            )}
          </label>

          <button
            className="h-11 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="submit"
          >
            <Icon name={mode === 'register' ? 'person_add' : 'login'} size={18} />
            {mode === 'register' ? 'Crear cuenta y ver cartillas' : 'Ingresar'}
          </button>
        </form>

        <p className="text-[10px] text-outline text-center leading-relaxed">
          Es una demo: los datos quedan guardados sólo en este navegador.
          {mode === 'login' && ' Si usás el correo de un pedido existente, recuperás su historial.'}
        </p>
      </section>
    </div>
  );
};
