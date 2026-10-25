import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
// Prevent running this suite against an existing project database.
if (!process.env.DATABASE_URL || new URL(process.env.DATABASE_URL).pathname !== '/hospedaya_test') throw new Error('Usa una BD aislada llamada hospedaya_test.');
const { app } = await import('../../src/application.js');
const { db } = await import('../../src/db.js');
after(async () => { await db.$disconnect(); });
test('real PostgreSQL: auth, ownership, concurrent bookings, costs, availability and cancellation', async () => {
  const suffix = Date.now();
  async function register(rol: string, name: string) {
    const response = await request(app).post('/api/auth/registro').send({ nombre: name, correo: name + suffix + '@example.com', password: 'Test-only-password-123', rol });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(response.body.user.password_hash, undefined);
    return response.body as { token: string; user: { id: string } };
  }
  const host = await register('ANFITRION', 'host'), guest = await register('HUESPED', 'guest'), other = await register('ANFITRION', 'other');
  const auth = (token: string) => ({ Authorization: 'Bearer ' + token });
  assert.equal((await request(app).post('/api/auth/login').send({ correo: 'guest' + suffix + '@example.com', password: 'incorrect-password' })).status, 401);
  assert.equal((await request(app).post('/api/auth/login').send({ correo: 'guest' + suffix + '@example.com', password: 'Test-only-password-123' })).status, 200);
  assert.equal((await request(app).get('/api/reservas')).status, 401);
  assert.equal((await request(app).get('/api/anfitrion/alojamientos').set(auth(guest.token))).status, 403);
  assert.equal((await request(app).post('/api/auth/registro').send({ nombre: 'Bad', correo: 'bad@example.com', password: 'Password123', rol: 'ADMINISTRADOR' })).status, 400);
  const payload = { nombre: 'Test alojamiento', ciudad: 'Antigua', direccion: 'Calle de pruebas 123', desc: 'Alojamiento para pruebas aisladas.', precio: 450.25, cap: 4, hab: 2, banos: 1, amenidades: 'Wi-Fi', reglas: 'No fumar', imagenes: ['/uploads/alojamientos/images.jpg'] };
  const created = await request(app).post('/api/alojamientos').set(auth(host.token)).send(payload);
  assert.equal(created.status, 201, JSON.stringify(created.body)); const id = created.body.id;
  assert.equal(typeof id, 'string');
  assert.equal((await request(app).put('/api/alojamientos/' + id).set(auth(other.token)).send(payload)).status, 404);
  assert.equal((await request(app).post('/api/alojamientos/' + id + '/disponibilidad').set(auth(host.token)).send({ desde: '2090-01-01', hasta: '2090-12-31', estado: 'DISPONIBLE' })).status, 201);
  const booking = { alojId: id, desde: '2090-02-01', hasta: '2090-02-04', adultos: 2, ninos: 1 };
  assert.equal((await request(app).post('/api/reservas').set(auth(host.token)).send(booking)).status, 400);
  assert.equal((await request(app).post('/api/reservas').set(auth(guest.token)).send({ ...booking, cvv: '123' })).status, 400);
  assert.equal((await request(app).post('/api/reservas').set(auth(guest.token)).send({ ...booking, adultos: 5 })).status, 400);
  const concurrent = await Promise.all([guest, other].map(u => request(app).post('/api/reservas').set(auth(u.token)).send(booking)));
  assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 409]);
  const winnerIndex = concurrent.findIndex(r => r.status === 201), winner = [guest, other][winnerIndex], loser = [guest, other][1 - winnerIndex];
  const reservation = concurrent[winnerIndex].body;
  assert.equal(reservation.total, 1350.75);
  assert.equal(await db.reserva.count({ where: { id_alojamiento: BigInt(id) } }), 1);
  assert.equal((await request(app).get('/api/anfitrion/reservas').set(auth(host.token))).body.length, 1);
  assert.equal((await request(app).get('/api/anfitrion/reservas').set(auth(other.token))).body.length, 0);
  assert.equal((await request(app).patch('/api/reservas/' + reservation.id).set(auth(loser.token)).send({ desde: '2090-03-01', hasta: '2090-03-03', adultos: 1, ninos: 0 })).status, 404);
  assert.equal(await db.costo_reserva.count({ where: { id_reserva: BigInt(reservation.id) } }), 1);
  assert.equal((await request(app).get('/api/reservas').set(auth(loser.token))).body.length, 0);
  assert.equal((await request(app).patch('/api/reservas/' + reservation.id + '/cancelar').set(auth(loser.token))).status, 404);
  const filtered = await request(app).get('/api/alojamientos?desde=2090-02-02&hasta=2090-02-03');
  assert.equal(filtered.body.some((a: { id: string }) => a.id === id), false);
  const adjacent = await request(app).post('/api/reservas').set(auth(guest.token)).send({ ...booking, desde: '2090-02-04', hasta: '2090-02-06' });
  assert.equal(adjacent.status, 201, JSON.stringify(adjacent.body));
  assert.equal((await request(app).patch('/api/reservas/' + reservation.id).set(auth(winner.token)).send({ desde: '2090-02-03', hasta: '2090-02-05', adultos: 2, ninos: 0 })).status, 409);
  assert.equal((await request(app).put('/api/alojamientos/' + id).set(auth(host.token)).send({ ...payload, precio: 999 })).status, 200);
  const modified = await request(app).patch('/api/reservas/' + reservation.id).set(auth(winner.token)).send({ desde: '2090-03-01', hasta: '2090-03-03', adultos: 1, ninos: 0 });
  assert.equal(modified.status, 200); assert.equal(modified.body.total, 900.5);
  assert.equal((await request(app).post('/api/alojamientos/' + id + '/disponibilidad').set(auth(host.token)).send({ desde: '2090-03-01', hasta: '2090-03-02', estado: 'NO_DISPONIBLE' })).status, 409);
  assert.equal((await request(app).patch('/api/reservas/' + reservation.id + '/cancelar').set(auth(winner.token))).status, 200);
  assert.equal((await request(app).patch('/api/reservas/' + reservation.id + '/cancelar').set(auth(winner.token))).status, 200);
  const reopened = await request(app).get('/api/alojamientos?desde=2090-03-01&hasta=2090-03-03');
  assert.equal(reopened.body.some((a: { id: string }) => a.id === id), true);
  assert.equal((await request(app).patch('/api/reservas/' + reservation.id).set(auth(winner.token)).send({ desde: '2090-03-01', hasta: '2090-03-03', adultos: 1, ninos: 0 })).status, 409);
  const blocked = await request(app).post('/api/alojamientos/' + id + '/disponibilidad').set(auth(host.token)).send({ desde: '2090-03-01', hasta: '2090-03-02', estado: 'NO_DISPONIBLE' });
  assert.equal(blocked.status, 201);
  assert.equal((await request(app).post('/api/reservas').set(auth(guest.token)).send({ ...booking, desde: '2090-03-01', hasta: '2090-03-02' })).status, 409);
  // Verify the database constraint independently of the API's row lock.
  await assert.rejects(db.reserva.create({ data: { id_usuario: BigInt(guest.user.id), id_alojamiento: BigInt(id), fecha_entrada: new Date('2090-02-04'), fecha_salida: new Date('2090-02-05'), cantidad_huespedes: 1, adultos: 1, ninos: 0, estado: 'CONFIRMADA' } }));
  assert.equal((await request(app).patch('/api/reservas/' + adjacent.body.id + '/cancelar').set(auth(host.token))).status, 200);
  assert.equal((await request(app).delete('/api/alojamientos/' + id).set(auth(host.token))).status, 204);
  assert.equal((await request(app).get('/api/alojamientos/' + id)).status, 404);
  assert.equal((await request(app).get('/api/reservas').set(auth(guest.token))).body.some((r: { id: string }) => r.id === adjacent.body.id), true);
  assert.equal((await request(app).post('/api/reservas').set(auth(guest.token)).send({ ...booking, desde: '2090-04-01', hasta: '2090-04-03' })).status, 409);
  // The cancellation/modification deadline is the day of arrival in Guatemala.
  const { today } = await import('../../src/domain.js');
  const start = today(), end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  const current = await db.reserva.create({ data: { id_usuario: BigInt(guest.user.id), id_alojamiento: BigInt(id), fecha_entrada: new Date(start), fecha_salida: end, cantidad_huespedes: 1, adultos: 1, ninos: 0, estado: 'CONFIRMADA' } });
  assert.equal((await request(app).patch('/api/reservas/' + current.id_reserva + '/cancelar').set(auth(guest.token))).status, 409);
  assert.equal((await request(app).patch('/api/reservas/' + current.id_reserva).set(auth(guest.token)).send({ desde: '2090-06-01', hasta: '2090-06-03', adultos: 1, ninos: 0 })).status, 409);
  const upcoming = await request(app).get('/api/reservas').set(auth(guest.token));
  assert.equal(upcoming.body.find((r: { id: string }) => r.id === String(current.id_reserva)).estado, 'En curso');
  // Exceeding NUMERIC(12,2) must fail cleanly without a partially saved reservation.
  const expensive = await request(app).post('/api/alojamientos').set(auth(host.token)).send({ ...payload, precio: 99999999.99 });
  assert.equal(expensive.status, 201);
  await request(app).post('/api/alojamientos/' + expensive.body.id + '/disponibilidad').set(auth(host.token)).send({ desde: '2090-01-01', hasta: '2090-12-31', estado: 'DISPONIBLE' });
  assert.equal((await request(app).post('/api/reservas').set(auth(guest.token)).send({ ...booking, alojId: expensive.body.id, desde: '2090-01-01', hasta: '2090-12-31' })).status, 400);
  assert.equal(await db.reserva.count({ where: { id_alojamiento: BigInt(expensive.body.id) } }), 0);

});
