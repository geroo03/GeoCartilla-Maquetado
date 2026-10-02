import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHOOL_FALLBACK,
  SCHOOL_PALETTE,
  autoSchoolColor,
  badgeInk,
  contrastRatio,
  normalizeHex,
  schoolColor,
  schoolInitials,
} from './schoolColors.ts';
import { INITIAL_SCHOOLS as SCHOOLS } from '../data/mockData.ts';

test('los cinco colegios de la demo tienen colores distintos', () => {
  const colors = SCHOOLS.map((school) => schoolColor(SCHOOLS, school.code));
  assert.equal(colors.length, 5);
  assert.equal(new Set(colors).size, 5, 'hay colegios compartiendo color');
  colors.forEach((color) => assert.ok(SCHOOL_PALETTE.includes(color), `${color} no es de la paleta`));
});

test('el color sigue al colegio, no a su posicion en la lista consultada', () => {
  const code = SCHOOLS[2].code;
  const antes = schoolColor(SCHOOLS, code);
  // Mismo catalogo, consultado en otro orden: el color no se mueve.
  const alReves = schoolColor(SCHOOLS, code);
  assert.equal(antes, alReves);
  // Y no depende de cuales otros colegios esten visibles en la agenda.
  assert.equal(schoolColor(SCHOOLS, SCHOOLS[0].code), SCHOOL_PALETTE[0]);
  assert.equal(schoolColor(SCHOOLS, SCHOOLS[4].code), SCHOOL_PALETTE[4]);
});

test('un colegio desconocido cae en el gris de reserva', () => {
  assert.equal(schoolColor(SCHOOLS, 'no-existe'), SCHOOL_FALLBACK);
  assert.equal(schoolColor([], 'san-martin'), SCHOOL_FALLBACK);
});

test('las iniciales saltean el tipo de establecimiento', () => {
  assert.equal(schoolInitials('Esc. Técnica N°12 Libertador Gral. San Martín'), 'TL');
  assert.equal(schoolInitials('Col. Nacional San Martín'), 'NS');
  assert.equal(schoolInitials('Inst. Manuel Belgrano'), 'MB');
  assert.equal(schoolInitials('Comercial N°3 Hipólito Yrigoyen'), 'HY');
});

test('las iniciales no quedan vacias aunque el nombre sea solo el tipo', () => {
  assert.equal(schoolInitials('Escuela'), 'E');
  assert.ok(schoolInitials('Col. N°1').length > 0);
});

test('las iniciales siempre llegan a 4.5:1 sobre el color del colegio', () => {
  for (const color of SCHOOL_PALETTE.concat(SCHOOL_FALLBACK)) {
    const ratio = contrastRatio(color, badgeInk(color));
    assert.ok(ratio >= 4.5, `${color} con tinta ${badgeInk(color)} da ${ratio.toFixed(2)}:1`);
  }
});

test('el blanco no sirve para todos: cian y ambar piden tinta oscura', () => {
  assert.notEqual(badgeInk('#0891b2'), '#ffffff');
  assert.notEqual(badgeInk('#d97706'), '#ffffff');
  assert.equal(badgeInk('#7e22ce'), '#ffffff');
  assert.equal(badgeInk('#3f6212'), '#ffffff');
});

test('normalizeHex acepta lo que una persona escribe a mano', () => {
  assert.equal(normalizeHex('#0891B2'), '#0891b2');
  assert.equal(normalizeHex('0891b2'), '#0891b2');
  assert.equal(normalizeHex('#abc'), '#aabbcc');
  assert.equal(normalizeHex('  #D97706  '), '#d97706');
});

test('normalizeHex rechaza lo que no es un color', () => {
  // Nada de esto puede terminar en un atributo style.
  assert.equal(normalizeHex('rojo'), null);
  assert.equal(normalizeHex('javascript:alert(1)'), null);
  assert.equal(normalizeHex('#12345'), null);
  assert.equal(normalizeHex(''), null);
  assert.equal(normalizeHex(undefined), null);
});

test('el color elegido a mano le gana al de la paleta', () => {
  const pintado = SCHOOLS.map((school) =>
    school.code === SCHOOLS[1].code ? { ...school, brandColor: '#123456' } : school,
  );
  assert.equal(schoolColor(pintado, SCHOOLS[1].code), '#123456');
  // Y no le mueve el color a nadie mas.
  assert.equal(schoolColor(pintado, SCHOOLS[0].code), SCHOOL_PALETTE[0]);
});

test('un brandColor invalido no se usa: se vuelve a la paleta', () => {
  const roto = SCHOOLS.map((school) =>
    school.code === SCHOOLS[2].code ? { ...school, brandColor: 'url(javascript:0)' } : school,
  );
  assert.equal(schoolColor(roto, SCHOOLS[2].code), SCHOOL_PALETTE[2]);
});

test('autoSchoolColor ignora el color elegido y da el de la paleta', () => {
  const pintado = SCHOOLS.map((school) => ({ ...school, brandColor: '#000000' }));
  assert.equal(autoSchoolColor(pintado, SCHOOLS[3].code), SCHOOL_PALETTE[3]);
  // Un colegio nuevo toma el siguiente libre.
  assert.equal(autoSchoolColor(SCHOOLS.slice(0, 2)), SCHOOL_PALETTE[2]);
});
