/**
 * Preparacion de los logos escolares para guardarlos en localStorage.
 *
 * Una foto de telefono son varios MB y en base64 crece otro 33%. El estado
 * entero de la demo vive en localStorage, que da unos 5 MB: guardar el
 * archivo tal cual reventaria la cuota y, como la escritura esta envuelta en
 * try/catch, la demo dejaria de persistir sin decir nada. Por eso el logo se
 * reduce a un cuadrado chico antes de tocar el estado.
 */

/** Lado del cuadrado que se guarda. Se muestra a 36px; 128 cubre pantallas 3x. */
export const LOGO_SIZE = 128;

/** Tope de entrada. Mas que esto no se procesa: es una foto, no un logo. */
export const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/** Tope de salida. Si el recorte supera esto, algo salio mal y no se guarda. */
export const MAX_OUTPUT_BYTES = 120 * 1024;

export class ImageTooLargeError extends Error {}
export class ImageUnreadableError extends Error {}

/**
 * Lee un archivo de imagen y devuelve un data URL cuadrado de LOGO_SIZE px.
 * Recorta al centro para no deformar el logo.
 */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageUnreadableError('El archivo no es una imagen.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageTooLargeError('La imagen pesa más de 8 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = LOGO_SIZE;
    canvas.height = LOGO_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new ImageUnreadableError('No se pudo procesar la imagen.');

    // Recorte centrado: el lado corto define el cuadrado.
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = (image.naturalWidth - side) / 2;
    const sy = (image.naturalHeight - side) / 2;
    context.drawImage(image, sx, sy, side, side, 0, 0, LOGO_SIZE, LOGO_SIZE);

    // WebP cuando el navegador lo soporta; si no, toDataURL ignora el tipo
    // y devuelve PNG, que tambien sirve.
    const dataUrl = canvas.toDataURL('image/webp', 0.82);
    if (dataUrlBytes(dataUrl) > MAX_OUTPUT_BYTES) {
      throw new ImageTooLargeError('La imagen no se pudo comprimir lo suficiente.');
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageUnreadableError('No se pudo leer la imagen.'));
    image.src = src;
  });
}

/** Tamaño real del payload de un data URL, sin el encabezado. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return 0;
  const body = dataUrl.slice(comma + 1);
  const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0;
  return Math.floor((body.length * 3) / 4) - padding;
}

/** Solo se aceptan imagenes embebidas: nada de URLs remotas en el estado. */
export function isSafeLogoDataUrl(value: string | undefined | null): value is string {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value);
}
