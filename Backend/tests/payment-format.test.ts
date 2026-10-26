import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDemoPayment } from '../../Frontend/src/payment.js';
test('demo payment checks format without validating card existence', () => {
  const p = { num: '1111 2222 3333 4444', exp: '12/2030', cvv: '123', nom: 'Persona ficticia', cp: '01001' };
  const now = new Date('2026-10-24T12:00:00Z');
  assert.equal(validateDemoPayment(p, now), '');
  for (const bad of [{ num: '1234' }, { num: 'abcd222233334444' }, { exp: '13/2030' }, { exp: '09/2026' }, { cvv: 'ab3' }, { nom: ' ' }, { cp: 'abc' }]) assert.notEqual(validateDemoPayment({ ...p, ...bad }, now), '');
});
