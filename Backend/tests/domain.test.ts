import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dates, dateSchema, bookingSchema, registration, idSchema } from '../src/domain.js';
test('dates reject impossible dates and reversed ranges; checkout is exclusive', () => {
  assert.equal(dates('2090-01-01', '2090-01-04'), 3);
  assert.throws(() => dates('2090-01-04', '2090-01-04'));
  assert.throws(() => dates('2020-01-01', '2020-01-03'));
  assert.equal(dateSchema.safeParse('2090-02-30').success, false);
});
test('booking contract rejects totals, identity overrides and payment fields', () => {
  const b = { alojId: '1', desde: '2090-01-01', hasta: '2090-01-03', adultos: 2, ninos: 0 };
  assert.equal(bookingSchema.safeParse(b).success, true);
  for (const field of ['total', 'userId', 'tarjeta', 'cvv', 'payment']) assert.equal(bookingSchema.safeParse({ ...b, [field]: '123' }).success, false);
  assert.equal(bookingSchema.safeParse({ ...b, adultos: 0 }).success, false);
  assert.equal(idSchema.safeParse('3.5').success, false);
  assert.equal(idSchema.safeParse('9223372036854775808').success, false);
});
test('public registration cannot create administrators', () => {
  assert.equal(registration.safeParse({ correo: 'a@example.com', password: 'Example123', nombre: 'Test', rol: 'ADMINISTRADOR' }).success, false);
});
