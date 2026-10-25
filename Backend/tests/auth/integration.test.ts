import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const connection = process.env.DATABASE_URL;
if (!connection || new URL(connection).pathname !== '/hospedaya_test') {
  throw new Error('Estas pruebas requieren una base aislada llamada hospedaya_test.');
}
const { createApp } = await import('../../src/app.js');
const { auth, hostOnly } = await import('../../src/auth.js');
const { db } = await import('../../src/db.js');
const app = createApp(app => app.get('/api/prueba-anfitrion', auth, hostOnly, (_req, res) => res.json({ ok: true })));
after(async () => { await db.$disconnect(); });

test('registro, login, sesión, perfil, roles y cuentas inactivas con PostgreSQL', async () => {
  const email = `auth-${Date.now()}@example.com`;
  const password = 'Test-only-password-123';
  const registration = { nombre: 'Persona de prueba', correo: email, password, rol: 'HUESPED' };
  assert.equal((await request(app).get('/api/health')).status, 200);
  const created = await request(app).post('/api/auth/registro').send(registration);
  assert.equal(created.status, 201);
  assert.equal(created.body.user.correo, email);
  assert.equal(created.body.user.password_hash, undefined);
  const id = BigInt(created.body.user.id);
  const saved = await db.usuario.findUniqueOrThrow({ where: { id_usuario: id } });
  assert.notEqual(saved.password_hash, password);
  assert.equal(await bcrypt.compare(password, saved.password_hash), true);
  assert.equal((await request(app).post('/api/auth/registro').send({ ...registration, correo: ' ' + email.toUpperCase() + ' ' })).status, 409);
  assert.equal((await request(app).post('/api/auth/registro').send({ ...registration, rol: 'ADMINISTRADOR' })).status, 400);
  for (const body of [{ correo: email, password: 'Incorrect-password' }, { correo: 'absent-' + email, password }]) {
    const failed = await request(app).post('/api/auth/login').send(body);
    assert.equal(failed.status, 401); assert.equal(failed.body.error, 'Correo o contraseña incorrectos.');
  }
  const login = await request(app).post('/api/auth/login').send({ correo: email.toUpperCase(), password });
  assert.equal(login.status, 200);
  const header = { Authorization: 'Bearer ' + login.body.token };
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid')).status, 401);
  for (const opts of [
    { subject: id.toString(), expiresIn: -1, audience: 'hospedaya-web' },
    { subject: id.toString(), expiresIn: 60, audience: 'another-app' },
    { subject: '9223372036854775808', expiresIn: 60, audience: 'hospedaya-web' },
  ]) {
    const badToken = jwt.sign({}, process.env.JWT_SECRET!, { ...opts, issuer: 'hospedaya', algorithm: 'HS256' });
    assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + badToken)).status, 401);
  }
  const me = await request(app).get('/api/auth/me').set(header);
  assert.equal(me.status, 200); assert.equal(me.body.id, id.toString()); assert.equal(me.body.password_hash, undefined);
  assert.equal((await request(app).get('/api/prueba-anfitrion').set(header)).status, 403);
  const profile = await request(app).patch('/api/auth/me').set(header).send({ nombre: 'Nombre actualizado', biografia: 'Me gusta viajar.' });
  assert.equal(profile.status, 200); assert.equal(profile.body.nombre, 'Nombre actualizado');
  assert.equal((await request(app).patch('/api/auth/me').set(header).send({ nombre: 'Nombre', biografia: '', rol: 'ADMINISTRADOR' })).status, 400);
  await db.usuario.update({ where: { id_usuario: id }, data: { rol: 'ANFITRION' } });
  assert.equal((await request(app).get('/api/prueba-anfitrion').set(header)).status, 200);
  await db.usuario.update({ where: { id_usuario: id }, data: { estado: 'INACTIVO' } });
  assert.equal((await request(app).get('/api/auth/me').set(header)).status, 401);
  assert.equal((await request(app).post('/api/auth/login').send({ correo: email, password })).status, 401);
  assert.equal((await request(app).get('/ruta-inexistente')).status, 404);
  assert.equal((await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{')).status, 400);
});

test('limita intentos repetidos de autenticación', async () => {
  const isolatedApp = createApp();
  for (let i = 0; i < 30; i++) {
    assert.equal((await request(isolatedApp).post('/api/auth/login').send({})).status, 400);
  }
  assert.equal((await request(isolatedApp).post('/api/auth/login').send({})).status, 429);
});
