import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
if (!process.env.DATABASE_URL || new URL(process.env.DATABASE_URL).pathname !== '/hospedaya_test') throw new Error('Usa la base aislada hospedaya_test.');
const { createApp } = await import('../../src/app.js');
const { lodgings, hosts } = await import('../../src/lodgings.js');
const { db } = await import('../../src/db.js');
const app = createApp(app => { app.use('/api/alojamientos', lodgings); app.use('/api/anfitrion', hosts); });
after(async () => { await db.$disconnect(); });

test('alojamientos: permisos, edición, fotos, filtros, disponibilidad e historial', async () => {
  const suffix = Date.now();
  async function account(name: string, rol: string) {
    const r = await request(app).post('/api/auth/registro').send({ nombre: name, correo: name + suffix + '@example.com', password: 'Test-only-password123', rol });
    assert.equal(r.status, 201);
    return { header: { Authorization: 'Bearer ' + r.body.token }, id: BigInt(r.body.user.id) };
  }
  const owner = await account('Owner', 'ANFITRION'), other = await account('Other', 'ANFITRION'), guest = await account('Guest', 'HUESPED');
  const body = { nombre: 'Casa prueba', ciudad: 'Ciudad' + suffix, direccion: 'Calle de pruebas 123', desc: 'Casa para comprobar los alojamientos.', precio: 450.25, cap: 4, hab: 2, banos: 1, amenidades: 'Cocina', reglas: 'No fumar', imagenes: ['/uploads/alojamientos/images.jpg', '/uploads/alojamientos/images2.jpg'] };
  assert.equal((await request(app).post('/api/alojamientos').send(body)).status, 401);
  assert.equal((await request(app).post('/api/alojamientos').set(guest.header).send(body)).status, 403);
  for (const bad of [{ cap: 0 }, { precio: -1 }, { precio: 2.001 }, { imagenes: [] }, { imagenes: ['https://'] }, { hostId: '1' }]) {
    assert.equal((await request(app).post('/api/alojamientos').set(owner.header).send({ ...body, ...bad })).status, 400);
  }
  const created = await request(app).post('/api/alojamientos').set(owner.header).send(body);
  assert.equal(created.status, 201); const id = created.body.id, url = '/api/alojamientos/' + id;
  assert.equal(created.body.hostId, owner.id.toString()); assert.deepEqual(created.body.imagenes, body.imagenes);
  assert.equal(created.body.password_hash, undefined);
  assert.equal((await request(app).get(url)).status, 200);
  assert.equal((await request(app).get('/api/alojamientos/3.5')).status, 400);
  assert.equal((await request(app).get('/api/anfitrion/alojamientos').set(other.header)).body.length, 0);
  assert.equal((await request(app).get('/api/anfitrion/alojamientos').set(owner.header)).body.length, 1);
  assert.equal((await request(app).put(url).set(other.header).send(body)).status, 404);
  assert.equal((await request(app).delete(url).set(other.header)).status, 404);
  const edit = await request(app).put(url).set(owner.header).send({ ...body, nombre: 'Casa actualizada', imagenes: [body.imagenes[1]] });
  assert.equal(edit.status, 200); assert.equal(edit.body.nombre, 'Casa actualizada'); assert.deepEqual(edit.body.imagenes, [body.imagenes[1]]);
  assert.equal(await db.imagen_alojamiento.count({ where: { id_alojamiento: BigInt(id), es_principal: true } }), 1);
  const query = (params: Record<string, string>) => request(app).get('/api/alojamientos?' + new URLSearchParams({ ciudad: body.ciudad, ...params }));
  assert.equal((await query({ huespedes: '4', precioMin: '400', precioMax: '500' })).body.length, 1);
  assert.equal((await query({ huespedes: '5' })).body.length, 0);
  assert.equal((await query({ precioMax: '400' })).body.length, 0);
  assert.equal((await query({ desde: '2090-02-01' })).status, 400);
  assert.equal((await query({ precioMin: '500', precioMax: '100' })).status, 400);
  const range = { desde: '2090-02-01', hasta: '2090-02-04' };
  assert.equal((await query(range)).body.length, 0);
  const period = { desde: '2090-01-01', hasta: '2090-12-31', estado: 'DISPONIBLE' };
  assert.equal((await request(app).post(url + '/disponibilidad').set(other.header).send(period)).status, 404);
  assert.equal((await request(app).post(url + '/disponibilidad').set(owner.header).send({ ...period, hasta: period.desde })).status, 400);
  const enabled = await request(app).post(url + '/disponibilidad').set(owner.header).send(period);
  assert.equal(enabled.status, 201); assert.equal((await query(range)).body.length, 1);
  const block = await request(app).post(url + '/disponibilidad').set(owner.header).send({ ...range, estado: 'NO_DISPONIBLE' });
  assert.equal(block.status, 201); assert.equal((await query(range)).body.length, 0);
  assert.equal((await query({ desde: range.hasta, hasta: '2090-02-06' })).body.length, 1);
  assert.equal((await request(app).delete(url + '/disponibilidad/' + block.body.id).set(other.header)).status, 404);
  assert.equal((await request(app).delete(url + '/disponibilidad/' + block.body.id).set(owner.header)).status, 204);
  assert.equal((await query(range)).body.length, 1);
  // Fixture inserted directly: the reservations API belongs to the next stage.
  const booking = await db.reserva.create({ data: { id_usuario: guest.id, id_alojamiento: BigInt(id), fecha_entrada: new Date(range.desde), fecha_salida: new Date(range.hasta), cantidad_huespedes: 4, adultos: 4, ninos: 0, estado: 'CONFIRMADA' } });
  assert.equal((await query(range)).body.length, 0);
  assert.equal((await request(app).put(url).set(owner.header).send({ ...body, cap: 2 })).status, 409);
  assert.equal((await request(app).post(url + '/disponibilidad').set(owner.header).send({ ...range, estado: 'NO_DISPONIBLE' })).status, 409);
  assert.equal((await request(app).delete(url + '/disponibilidad/' + enabled.body.id).set(owner.header)).status, 204);
  assert.ok(await db.reserva.findUnique({ where: { id_reserva: booking.id_reserva } }));
  assert.equal((await request(app).delete(url).set(owner.header)).status, 204);
  assert.equal((await request(app).get(url)).status, 404);
  assert.equal((await query({})).body.length, 0);
  assert.equal((await request(app).get('/api/anfitrion/alojamientos').set(owner.header)).body[0].estado, 'INACTIVO');
  assert.ok(await db.reserva.findUnique({ where: { id_reserva: booking.id_reserva } }));
});
