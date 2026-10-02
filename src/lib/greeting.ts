/**
 * Texto del saludo de bienvenida. Vive aparte del componente porque es logica
 * pura y asi entra en los tests: el runner de node solo toma archivos .ts
 * (no puede despojar tipos de un .tsx con JSX adentro).
 */

/**
 * "Prof. Martin Gomez" -> "Martin". El saludo es personal: con el nombre
 * completo y el titulo suena a notificacion del sistema, no a bienvenida.
 */
export function firstName(fullName: string): string {
  const withoutTitle = fullName.replace(/^(prof\.?|profe|lic\.?|dra?\.?|mg\.?|ing\.?)\s+/i, '');
  return withoutTitle.trim().split(/\s+/)[0] || fullName.trim();
}

/** Saludo segun la hora local, que es cuando una bienvenida se siente escrita para vos. */
export function greeting(hour: number): string {
  if (hour < 6) return 'Buenas noches';
  if (hour < 13) return 'Buen día';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}
