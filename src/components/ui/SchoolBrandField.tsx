import React, { useRef, useState } from 'react';
import { Icon } from './Icon.tsx';
import { SCHOOL_PALETTE, badgeInk, normalizeHex } from '../../lib/schoolColors.ts';
import { ImageTooLargeError, fileToLogoDataUrl, LOGO_SIZE } from '../../lib/image.ts';

export interface SchoolBrand {
  brandColor?: string;
  logoUrl?: string;
}

interface SchoolBrandFieldProps {
  value: SchoolBrand;
  onChange: (next: SchoolBrand) => void;
  /** Color que le tocaria por paleta si no se elige ninguno. */
  autoColor: string;
  /** Iniciales de la vista previa, cuando no hay logo. */
  initials: string;
}

/**
 * Control de identidad visual del colegio: color e insignia. Se usa en el
 * alta y en la edicion, y muestra en vivo la misma insignia que despues
 * aparece en la agenda de entregas.
 */
export const SchoolBrandField: React.FC<SchoolBrandFieldProps> = ({
  value,
  onChange,
  autoColor,
  initials,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const chosen = normalizeHex(value.brandColor);
  const preview = chosen ?? autoColor;

  const pickColor = (color: string | undefined) => {
    setError(null);
    onChange({ ...value, brandColor: color });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const logoUrl = await fileToLogoDataUrl(file);
      onChange({ ...value, logoUrl });
    } catch (cause) {
      setError(
        cause instanceof ImageTooLargeError
          ? cause.message
          : 'No se pudo leer esa imagen. Probá con un PNG o JPG.',
      );
    } finally {
      setBusy(false);
      // Permite volver a elegir el mismo archivo despues de un error.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border border-outline-variant/30 p-3">
      <legend className="px-1 text-xs font-semibold text-primary">Identidad del colegio</legend>

      <div className="flex items-center gap-3">
        {/* Reproduce la tarjeta de la agenda: filete con el color e insignia
            al lado. Con un logo cargado el color sigue mandando en el filete,
            y asi se ve que las dos cosas conviven. */}
        <span
          className="shrink-0 flex items-stretch gap-2 rounded-lg bg-surface-container-lowest border border-surface-container-high/60 p-1.5 pl-0 overflow-hidden"
          style={{ borderLeftWidth: 4, borderLeftColor: preview }}
        >
          <span
            className="ml-1.5 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden text-sm font-extrabold"
            style={{
              backgroundColor: value.logoUrl ? 'transparent' : preview,
              color: badgeInk(preview),
            }}
          >
            {value.logoUrl ? (
              <img src={value.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initials || '—'
            )}
          </span>
        </span>

        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <span className="text-[11px] text-on-surface-variant">
            Así se ve en la agenda de entregas.
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container text-primary text-[11px] font-bold hover:bg-surface-container-high transition-colors disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
            >
              <Icon name={busy ? 'progress_activity' : 'photo_camera'} size={15} className={busy ? 'animate-spin' : ''} />
              {value.logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>

            {value.logoUrl && (
              <button
                onClick={() => {
                  setError(null);
                  onChange({ ...value, logoUrl: undefined });
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                type="button"
              >
                <Icon name="delete" size={15} />
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        onChange={(event) => void handleFile(event.target.files?.[0])}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        aria-label="Logo del colegio"
      />

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => pickColor(undefined)}
          className={`h-7 px-2 rounded-full text-[10px] font-bold border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
            chosen
              ? 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
              : 'border-primary bg-primary text-on-primary'
          }`}
          type="button"
          aria-pressed={!chosen}
        >
          Automático
        </button>

        {SCHOOL_PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => pickColor(color)}
            className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
              chosen === color ? 'border-on-surface scale-110' : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            type="button"
            aria-label={`Usar el color ${color}`}
            aria-pressed={chosen === color}
          />
        ))}

        {/* El selector del sistema cubre cualquier color fuera de la paleta. */}
        <label
          className="w-7 h-7 rounded-full border-2 border-outline-variant/50 flex items-center justify-center cursor-pointer hover:bg-surface-container focus-within:outline-2 focus-within:outline-primary"
          title="Elegir otro color"
        >
          <Icon name="colorize" size={14} className="text-on-surface-variant" />
          <input
            value={preview}
            onChange={(event) => pickColor(event.target.value)}
            type="color"
            className="sr-only"
            aria-label="Elegir otro color"
          />
        </label>
      </div>

      <p className="text-[10px] text-outline">
        El logo reemplaza a las iniciales y se guarda recortado a {LOGO_SIZE}px, para que entre en el
        almacenamiento del navegador.
      </p>

      {error && (
        <p className="text-[10px] font-semibold text-error flex items-center gap-1" role="alert">
          <Icon name="error" size={13} />
          {error}
        </p>
      )}
    </fieldset>
  );
};
