import test from 'node:test';
import assert from 'node:assert/strict';
import { dataUrlBytes, isSafeLogoDataUrl, LOGO_SIZE, MAX_OUTPUT_BYTES } from './image.ts';

const b64 = (text: string) => Buffer.from(text, 'utf8').toString('base64');

test('dataUrlBytes mide el payload real, no el largo del string', () => {
  for (const sample of ['a', 'ab', 'abc', 'abcd', 'hola mundo', 'x'.repeat(1000)]) {
    const url = `data:image/png;base64,${b64(sample)}`;
    assert.equal(dataUrlBytes(url), Buffer.byteLength(sample), `fallo con ${sample.length} bytes`);
  }
});

test('dataUrlBytes no explota con basura', () => {
  assert.equal(dataUrlBytes(''), 0);
  assert.equal(dataUrlBytes('sin-coma'), 0);
});

test('isSafeLogoDataUrl solo acepta imagenes embebidas', () => {
  assert.ok(isSafeLogoDataUrl(`data:image/webp;base64,${b64('x')}`));
  assert.ok(isSafeLogoDataUrl(`data:image/png;base64,${b64('x')}`));
  assert.ok(isSafeLogoDataUrl(`data:image/jpeg;base64,${b64('x')}`));
});

test('isSafeLogoDataUrl rechaza lo remoto y lo ejecutable', () => {
  // El logo se guarda en el estado y se pega en un src: nada de esto entra.
  assert.equal(isSafeLogoDataUrl('https://ejemplo.com/logo.png'), false);
  assert.equal(isSafeLogoDataUrl('data:text/html;base64,PHNjcmlwdD4='), false);
  assert.equal(isSafeLogoDataUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isSafeLogoDataUrl('javascript:alert(1)'), false);
  assert.equal(isSafeLogoDataUrl(undefined), false);
  assert.equal(isSafeLogoDataUrl(''), false);
});

test('los topes dejan margen para cinco colegios en localStorage', () => {
  // 5 MB de cuota tipica; cinco logos al tope no pueden comerse el estado.
  assert.ok(MAX_OUTPUT_BYTES * 5 < 1024 * 1024, 'cinco logos pasan de 1 MB');
  assert.equal(LOGO_SIZE, 128);
});
