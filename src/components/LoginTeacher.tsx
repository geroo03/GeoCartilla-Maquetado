import React, { useState } from 'react';
import type { TeacherSession } from '../types/index.ts';
import { DEMO_TEACHER_CREDENTIALS, TEACHER_PROFILE } from '../data/mockData.ts';
import { CURRENT_TERM } from '../lib/format.ts';
import { Icon } from './ui/Icon.tsx';
import { BrandMark } from './SidebarTeacher.tsx';

interface LoginTeacherProps {
  onLogin: (session: TeacherSession) => void;
  onPreviewStudent: () => void;
}

/**
 * Puerta de entrada del panel docente. Es una demo, así que acepta cualquier
 * credencial, pero valida el formato y muestra las de ejemplo en pantalla
 * para que quien la recorra no tenga que adivinarlas.
 */
export const LoginTeacher: React.FC<LoginTeacherProps> = ({ onLogin, onPreviewStudent }) => {
  const [email, setEmail] = useState(DEMO_TEACHER_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_TEACHER_CREDENTIALS.password);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Revisá el correo: falta el @ o el dominio.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña tiene que tener al menos 6 caracteres.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    // Breve espera para que se vea el estado de carga del botón.
    setTimeout(() => {
      onLogin({
        email,
        name: TEACHER_PROFILE.name,
        role: TEACHER_PROFILE.role,
      });
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface-container-low via-background to-primary-fixed/40">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center p-2.5 shadow-lg">
            <BrandMark />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary tracking-tight">GeoCartillas</h1>
            <p className="text-xs text-on-surface-variant">
              Gestión editorial y logística de cartillas escolares
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/60 flex flex-col gap-3.5"
        >
          <div>
            <h2 className="text-base font-bold text-primary">Acceso docente</h2>
            <p className="text-xs text-outline">Ciclo lectivo {CURRENT_TERM}</p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary">Correo institucional</span>
            <div className="relative flex items-center">
              <Icon name="mail" size={18} className="absolute left-3 text-outline" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="username"
                className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary">Contraseña</span>
            <div className="relative flex items-center">
              <Icon name="lock" size={18} className="absolute left-3 text-outline" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full h-10 pl-10 pr-10 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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
          </label>

          {error && (
            <p
              className="text-[11px] font-semibold text-on-error-container bg-error-container rounded-lg px-3 py-2 flex items-center gap-1.5"
              role="alert"
            >
              <Icon name="error" size={16} />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {isSubmitting ? (
              <>
                <Icon name="progress_activity" size={18} className="animate-spin" />
                Ingresando...
              </>
            ) : (
              <>
                <Icon name="login" size={18} />
                Ingresar al panel
              </>
            )}
          </button>

          <div className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 leading-relaxed">
            <span className="font-bold text-primary">Credenciales de la demo</span>
            <br />
            {DEMO_TEACHER_CREDENTIALS.email} / {DEMO_TEACHER_CREDENTIALS.password}
            <br />
            <span className="text-outline">Cualquier correo válido también entra.</span>
          </div>
        </form>

        <button
          onClick={onPreviewStudent}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-primary font-semibold text-xs hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
        >
          <Icon name="smartphone" size={18} />
          Ver el portal del alumno sin ingresar
        </button>
      </div>
    </div>
  );
};
