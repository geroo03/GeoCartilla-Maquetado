import React from 'react';
import type { CoverMotif } from '../../types/index.ts';

/**
 * Tapa generada en SVG. El maquetado original apuntaba a URLs firmadas de
 * Google AI Studio que van a expirar, y el onError sólo escondía la imagen
 * dejando un hueco. Esto dibuja una tapa estable y distinta por cartilla,
 * sin depender de la red.
 */

interface Palette {
  bg: string;
  bgAlt: string;
  ink: string;
  accent: string;
  band: string;
  onBand: string;
}

const PALETTES: Record<CoverMotif, Palette> = {
  topographic: {
    bg: '#1a365d',
    bgAlt: '#002045',
    ink: '#adc7f7',
    accent: '#aeeecb',
    band: '#d6e3ff',
    onBand: '#002045',
  },
  satellite: {
    bg: '#002045',
    bgAlt: '#283044',
    ink: '#86a0cd',
    accent: '#95d4b3',
    band: '#adc7f7',
    onBand: '#001b3c',
  },
  political: {
    bg: '#d6e3ff',
    bgAlt: '#adc7f7',
    ink: '#2d476f',
    accent: '#eb851c',
    band: '#002045',
    onBand: '#ffffff',
  },
  climate: {
    bg: '#2c694e',
    bgAlt: '#0e5138',
    ink: '#b1f0ce',
    accent: '#ffb77d',
    band: '#aeeecb',
    onBand: '#002114',
  },
  urban: {
    bg: '#283044',
    bgAlt: '#131b2e',
    ink: '#adc7f7',
    accent: '#eb851c',
    band: '#d6e3ff',
    onBand: '#002045',
  },
};

/** Hash estable de un string, para que cada cartilla tenga su variación. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function Motif({ motif, palette, seed }: { motif: CoverMotif; palette: Palette; seed: number }) {
  const jitter = (amount: number, offset = 0) => (seed * 97 + offset) % amount;

  switch (motif) {
    case 'topographic':
      return (
        <g fill="none" stroke={palette.ink} strokeWidth="1.1" opacity="0.65">
          {Array.from({ length: 7 }).map((_, i) => (
            <ellipse
              key={i}
              cx={40 + jitter(14, i * 3)}
              cy={66 + jitter(10, i * 7)}
              rx={8 + i * 7}
              ry={6 + i * 5.2}
              transform={`rotate(${-18 + jitter(12, i)} 40 66)`}
            />
          ))}
        </g>
      );

    case 'satellite':
      return (
        <g>
          <g stroke={palette.ink} strokeWidth="0.5" opacity="0.4">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 10} y1="22" x2={i * 10} y2="122" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={22 + i * 10} x2="80" y2={22 + i * 10} />
            ))}
          </g>
          <path
            d={`M8 ${54 + jitter(8)} q16 -14 30 -2 t26 -6 l0 26 q-18 10 -32 2 t-24 6 z`}
            fill={palette.accent}
            opacity="0.55"
          />
          <circle cx={56 + jitter(8, 3)} cy={44 + jitter(10, 5)} r="7" fill={palette.ink} opacity="0.5" />
        </g>
      );

    case 'political':
      return (
        <g stroke={palette.band} strokeWidth="0.9">
          <path d="M14 34 L40 28 L58 42 L52 70 L30 78 L12 60 Z" fill={palette.accent} opacity="0.75" />
          <path d="M52 70 L68 66 L72 94 L46 104 L30 78 Z" fill={palette.ink} opacity="0.45" />
          <path d="M12 60 L30 78 L24 112 L8 104 Z" fill={palette.band} opacity="0.2" />
          <circle cx="40" cy="28" r="2.2" fill={palette.band} stroke="none" />
          <circle cx="46" cy="104" r="2.2" fill={palette.band} stroke="none" />
        </g>
      );

    case 'climate':
      return (
        <g>
          {Array.from({ length: 5 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${40 + i * 16} q20 ${-8 + jitter(9, i * 5)} 40 0 t40 0 l0 16 l-80 0 z`}
              fill={palette.ink}
              opacity={0.16 + i * 0.09}
            />
          ))}
          <circle cx={60 - jitter(10)} cy="38" r="9" fill={palette.accent} opacity="0.85" />
        </g>
      );

    case 'urban':
      return (
        <g>
          {Array.from({ length: 11 }).map((_, i) => {
            const h = 20 + ((seed * 1000 + i * 37) % 48);
            return (
              <rect
                key={i}
                x={5 + i * 6.6}
                y={118 - h}
                width="5"
                height={h}
                fill={i % 4 === 0 ? palette.accent : palette.ink}
                opacity={i % 4 === 0 ? 0.85 : 0.5}
                rx="0.6"
              />
            );
          })}
          <line x1="0" y1="118" x2="80" y2="118" stroke={palette.band} strokeWidth="1.4" opacity="0.7" />
          <line x1="0" y1="96" x2="80" y2="96" stroke={palette.band} strokeWidth="0.7" opacity="0.35" />
        </g>
      );
  }
}

interface CoverArtProps {
  motif: CoverMotif;
  /** Identificador de la cartilla: fija la variación del dibujo. */
  seed: string;
  /** Texto corto en la banda inferior, p. ej. "3°". */
  label?: string;
  className?: string;
}

export const CoverArt: React.FC<CoverArtProps> = ({ motif, seed, label, className = '' }) => {
  const palette = PALETTES[motif];
  const variation = hash(seed);
  const gradientId = `cover-${motif}-${Math.round(variation * 1e6)}`;

  return (
    <svg
      viewBox="0 0 80 120"
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Tapa de la cartilla${label ? ` de ${label}` : ''}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.bg} />
          <stop offset="100%" stopColor={palette.bgAlt} />
        </linearGradient>
      </defs>

      <rect width="80" height="120" fill={`url(#${gradientId})`} />
      <Motif motif={motif} palette={palette} seed={variation} />

      {/* Lomo */}
      <rect x="0" y="0" width="3.5" height="120" fill={palette.band} opacity="0.55" />

      {/* Banda del título */}
      <rect x="0" y="0" width="80" height="18" fill={palette.band} opacity="0.92" />
      <text
        x="7"
        y="12.5"
        fill={palette.onBand}
        fontSize="7.5"
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        letterSpacing="0.3"
      >
        GEOGRAFÍA
      </text>

      {label && (
        <>
          <rect x="54" y="98" width="26" height="22" fill={palette.band} opacity="0.92" />
          <text
            x="67"
            y="113"
            fill={palette.onBand}
            fontSize="11"
            fontWeight="800"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          >
            {label}
          </text>
        </>
      )}
    </svg>
  );
};

/**
 * Tapa de una cartilla: usa la imagen externa si hay una cargada a mano, y
 * si no dibuja la generada. Evita el hueco en blanco del maquetado original.
 */
export const BookletCover: React.FC<{
  coverUrl?: string;
  motif: CoverMotif;
  seed: string;
  label?: string;
  className?: string;
  alt?: string;
}> = ({ coverUrl, motif, seed, label, className = '', alt }) => {
  const [failed, setFailed] = React.useState(false);

  if (coverUrl && !failed) {
    return (
      <img
        src={coverUrl}
        alt={alt ?? 'Tapa de la cartilla'}
        className={`object-cover ${className}`}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    );
  }

  return <CoverArt motif={motif} seed={seed} label={label} className={className} />;
};
