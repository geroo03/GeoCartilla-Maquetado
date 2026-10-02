import test from 'node:test';
import assert from 'node:assert/strict';
import { firstName, greeting } from './greeting.ts';

test('firstName saca el titulo y se queda con el nombre de pila', () => {
  assert.equal(firstName('Prof. Martin Gomez'), 'Martin');
  assert.equal(firstName('Lic. Ana Maria Suarez'), 'Ana');
  assert.equal(firstName('Dra. Paula Ruiz'), 'Paula');
  assert.equal(firstName('Diego Fernandez'), 'Diego');
});

test('firstName no se rompe con entradas raras', () => {
  assert.equal(firstName('Diego'), 'Diego');
  assert.equal(firstName('  Diego  '), 'Diego');
  // Solo el titulo: no hay nombre que extraer, asi que devuelve lo que hay
  // en vez de una cadena vacia en pantalla.
  assert.equal(firstName('Prof.'), 'Prof.');
  assert.equal(firstName(''), '');
});

test('greeting cambia con la hora del dia', () => {
  assert.equal(greeting(0), 'Buenas noches');
  assert.equal(greeting(5), 'Buenas noches');
  assert.equal(greeting(6), 'Buen día');
  assert.equal(greeting(12), 'Buen día');
  assert.equal(greeting(13), 'Buenas tardes');
  assert.equal(greeting(19), 'Buenas tardes');
  assert.equal(greeting(20), 'Buenas noches');
  assert.equal(greeting(23), 'Buenas noches');
});

test('greeting cubre las 24 horas sin huecos', () => {
  for (let hour = 0; hour < 24; hour += 1) {
    assert.ok(greeting(hour).length > 0, `falta saludo para la hora ${hour}`);
  }
});
